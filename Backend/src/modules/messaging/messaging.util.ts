/** ID déterministe patient (user) ↔ espace cabinet — spec Sem 23–24. */
export function buildConversationId(patientUserId: string, doctorSpaceId: string): string {
  const [min, max] =
    patientUserId < doctorSpaceId
      ? [patientUserId, doctorSpaceId]
      : [doctorSpaceId, patientUserId];
  return `conv:${min}-${max}`;
}

export function encodeMessageCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ t: createdAt.toISOString(), id }), 'utf8').toString('base64url');
}

export function decodeMessageCursor(raw: string): { createdAt: Date; id: string } | null {
  try {
    const o = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      t: string;
      id: string;
    };
    if (!o.t || !o.id) return null;
    return { createdAt: new Date(o.t), id: o.id };
  } catch {
    return null;
  }
}
