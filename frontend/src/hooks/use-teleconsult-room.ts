"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  teleconsultApi,
  type TeleconsultChatMessage,
  type TeleconsultContext,
} from "@/lib/api/teleconsult";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

type UseTeleconsultRoomOptions = {
  appointmentId: string;
  role: "doctor" | "patient" | "secretary";
  enabled: boolean;
};

export function useTeleconsultRoom({ appointmentId, role, enabled }: UseTeleconsultRoomOptions) {
  const [context, setContext] = useState<TeleconsultContext | null>(null);
  const [chat, setChat] = useState<TeleconsultChatMessage[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const signalCursorRef = useRef(0);
  const lastChatIdRef = useRef<string | undefined>(undefined);
  const makingOfferRef = useRef(false);
  const politeRef = useRef(role === "doctor" || role === "secretary");

  const cleanupMedia = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setConnected(false);
  }, []);

  const postSignal = useCallback(
    async (type: "offer" | "answer" | "ice" | "hangup", payload: Record<string, unknown>) => {
      await teleconsultApi.postSignal(appointmentId, type, payload);
    },
    [appointmentId],
  );

  const ensurePeer = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        void postSignal("ice", ev.candidate.toJSON() as unknown as Record<string, unknown>);
      }
    };
    pc.ontrack = (ev) => {
      const stream = ev.streams[0] ?? new MediaStream([ev.track]);
      setRemoteStream(stream);
      setConnected(true);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setConnected(false);
      }
      if (pc.connectionState === "connected") setConnected(true);
    };
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }
    pcRef.current = pc;
    return pc;
  }, [postSignal]);

  const handleRemoteSignal = useCallback(
    async (type: string, payload: Record<string, unknown>, from: string) => {
      if (from === role) return;
      const pc = ensurePeer();
      try {
        if (type === "offer") {
          const polite = politeRef.current;
          const offerCollision = makingOfferRef.current;
          if (!polite && offerCollision) return;
          await pc.setRemoteDescription(payload as unknown as RTCSessionDescriptionInit);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await postSignal("answer", answer as unknown as Record<string, unknown>);
        } else if (type === "answer") {
          await pc.setRemoteDescription(payload as unknown as RTCSessionDescriptionInit);
        } else if (type === "ice") {
          try {
            await pc.addIceCandidate(payload as RTCIceCandidateInit);
          } catch {
            /* ignore stale ice */
          }
        } else if (type === "hangup") {
          cleanupMedia();
        }
      } catch (e) {
        console.warn("signal handling error", e);
      }
    },
    [cleanupMedia, ensurePeer, postSignal, role],
  );

  const createOffer = useCallback(async () => {
    const pc = ensurePeer();
    makingOfferRef.current = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await postSignal("offer", offer as unknown as Record<string, unknown>);
    } finally {
      makingOfferRef.current = false;
    }
  }, [ensurePeer, postSignal]);

  const join = useCallback(async () => {
    setJoining(true);
    setError(null);
    try {
      const ctx = await teleconsultApi.getContext(appointmentId);
      setContext(ctx);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const joined = await teleconsultApi.join(appointmentId);
      setChat(joined.chat);
      lastChatIdRef.current = joined.chat.at(-1)?.id;
      signalCursorRef.current = joined.signalCursor;

      if (role === "doctor") {
        window.setTimeout(() => void createOffer(), 400);
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(
        typeof msg === "string"
          ? msg
          : "Impossible de rejoindre la salle (caméra/micro ou serveur).",
      );
      cleanupMedia();
    } finally {
      setJoining(false);
    }
  }, [appointmentId, cleanupMedia, createOffer, role]);

  useEffect(() => {
    if (!enabled) return;
    void join();
    return () => {
      cleanupMedia();
    };
  }, [enabled, appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps -- join once per session

  useEffect(() => {
    if (!enabled) return;
    const pollSignals = window.setInterval(async () => {
      try {
        const { signals, ended } = await teleconsultApi.pollSignals(
          appointmentId,
          signalCursorRef.current,
        );
        for (const s of signals) {
          signalCursorRef.current = Math.max(signalCursorRef.current, s.seq);
          await handleRemoteSignal(s.type, s.payload, s.from);
        }
        if (ended) cleanupMedia();
      } catch {
        /* ignore poll errors */
      }
    }, 1200);

    const pollChat = window.setInterval(async () => {
      try {
        const { messages } = await teleconsultApi.listChat(appointmentId, lastChatIdRef.current);
        if (messages.length > 0) {
          lastChatIdRef.current = messages[messages.length - 1]?.id;
          setChat((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const merged = [...prev];
            for (const m of messages) {
              if (!ids.has(m.id)) merged.push(m);
            }
            return merged;
          });
        }
      } catch {
        /* ignore */
      }
    }, 2000);

    return () => {
      window.clearInterval(pollSignals);
      window.clearInterval(pollChat);
    };
  }, [appointmentId, cleanupMedia, enabled, handleRemoteSignal]);

  const sendChat = useCallback(
    async (body: string) => {
      const msg = await teleconsultApi.sendChat(appointmentId, body);
      setChat((prev) => [...prev, msg]);
      lastChatIdRef.current = msg.id;
    },
    [appointmentId],
  );

  const endSession = useCallback(
    async (notes?: string) => {
      await postSignal("hangup", {});
      if (role === "doctor") {
        await teleconsultApi.end(appointmentId, notes);
      }
      cleanupMedia();
    },
    [appointmentId, cleanupMedia, postSignal, role],
  );

  const toggleMute = useCallback((muted: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }, []);

  const toggleVideo = useCallback((off: boolean) => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !off;
    });
  }, []);

  return {
    context,
    chat,
    localStream,
    remoteStream,
    connected,
    error,
    joining,
    sendChat,
    endSession,
    toggleMute,
    toggleVideo,
    cleanupMedia,
  };
}
