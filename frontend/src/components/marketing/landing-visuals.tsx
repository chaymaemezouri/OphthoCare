'use client';

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LANDING_EASE, pulseGlow, floatSlow, floatY, useLandingMounted } from '@/components/marketing/landing-motion';

type GlassTint = 'purple' | 'blue' | 'neutral' | 'dark';

const GLASS_TINTS: Record<GlassTint, string> = {
  purple:
    'border-[#B7A7FF]/35 bg-gradient-to-br from-[#B7A7FF]/20 via-white/50 to-white/30 shadow-[0_24px_80px_rgba(183,167,255,0.22),inset_0_1px_0_rgba(255,255,255,0.7)]',
  blue: 'border-[#7EADD0]/35 bg-gradient-to-br from-[#7EADD0]/18 via-white/50 to-white/30 shadow-[0_24px_80px_rgba(126,173,208,0.2),inset_0_1px_0_rgba(255,255,255,0.7)]',
  neutral:
    'border-white/60 bg-gradient-to-br from-white/70 via-white/45 to-white/25 shadow-[0_24px_80px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.8)]',
  dark: 'border-white/10 bg-gradient-to-br from-[#111111]/90 via-[#1a1a2e]/85 to-[#111111]/90 shadow-[0_32px_100px_rgba(0,0,0,0.35)] text-white',
};

export function FloatingOrbs({ className }: { className?: string }) {
  const mounted = useLandingMounted();
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <motion.div
        variants={pulseGlow}
        animate={mounted ? 'animate' : false}
        className="absolute -left-[10%] top-[8%] h-[min(50vw,420px)] w-[min(50vw,420px)] rounded-full bg-[#B7A7FF]/30 blur-[90px]"
      />
      <motion.div
        variants={floatSlow}
        animate={mounted ? 'animate' : false}
        className="absolute -right-[5%] top-[20%] h-[min(45vw,380px)] w-[min(45vw,380px)] rounded-full bg-[#7EADD0]/28 blur-[100px]"
      />
      <motion.div
        variants={floatY}
        animate={mounted ? 'animate' : false}
        className="absolute bottom-[10%] left-[30%] h-[min(35vw,280px)] w-[min(35vw,280px)] rounded-full bg-[#D8D0FF]/35 blur-[80px]"
      />
    </div>
  );
}

export function SectionMesh({
  variant = 'light',
  className,
}: {
  variant?: 'light' | 'purple' | 'blue' | 'mixed';
  className?: string;
}) {
  const mounted = useLandingMounted();
  const meshes = {
    light: 'from-white via-[#F8F8F6] to-white',
    purple: 'from-[#F5F2FF] via-white to-[#F8F8F6]',
    blue: 'from-[#F0F7FC] via-white to-[#F8F8F6]',
    mixed: 'from-[#F5F2FF] via-[#F0F7FC] to-white',
  };
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className={cn('absolute inset-0 bg-gradient-to-b', meshes[variant])} />
      <motion.div
        variants={pulseGlow}
        animate={mounted ? 'animate' : false}
        className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#B7A7FF]/15 blur-[80px]"
      />
      <motion.div
        variants={floatY}
        animate={mounted ? 'animate' : false}
        className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[#7EADD0]/12 blur-[70px]"
      />
    </div>
  );
}

export function GlassPanel({
  children,
  className,
  tint = 'neutral',
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  tint?: GlassTint;
  hover?: boolean;
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -6, scale: 1.01 } : undefined}
      transition={{ duration: 0.35, ease: LANDING_EASE }}
      className={cn(
        'relative overflow-hidden rounded-[24px] border backdrop-blur-2xl backdrop-saturate-150 sm:rounded-[28px]',
        GLASS_TINTS[tint],
        className,
      )}
      style={{ WebkitBackdropFilter: 'blur(24px) saturate(1.5)' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-white/10" aria-hidden />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-[#7EADD0] via-[#B7A7FF] to-[#7EADD0] bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient-shift_4s_ease_infinite]',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AnimatedStat({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <div ref={ref}>
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: LANDING_EASE }}
        className="text-3xl font-light tabular-nums tracking-tight text-[#111111] sm:text-4xl"
      >
        {display}
      </motion.p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#77777D]">{label}</p>
    </div>
  );
}

export function MarqueeRow({
  children,
  className,
  minItems = 6,
  fadeFrom = '#F0F7FC',
}: {
  children: React.ReactNode;
  className?: string;
  minItems?: number;
  fadeFrom?: string;
}) {
  const count = Children.count(children);
  const useMarquee = count >= minItems;

  if (!useMarquee) {
    return (
      <div className={cn('flex flex-wrap gap-2 sm:gap-3', className)}>
        {children}
      </div>
    );
  }

  const items = Children.toArray(children);
  const duplicated = items.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, { key: `${String(child.key ?? i)}-dup` })
      : child,
  );

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r to-transparent"
        style={{ backgroundImage: `linear-gradient(to right, ${fadeFrom}, transparent)` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l to-transparent"
        style={{ backgroundImage: `linear-gradient(to left, ${fadeFrom}, transparent)` }}
        aria-hidden
      />
      <div className="flex w-max animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
        <div className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">{children}</div>
        <div className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4" aria-hidden>
          {duplicated}
        </div>
      </div>
    </div>
  );
}

export function ShimmerLine({ className }: { className?: string }) {
  const mounted = useLandingMounted();
  return (
    <motion.div
      className={cn('h-px w-full bg-gradient-to-r from-transparent via-[#B7A7FF]/60 to-transparent', className)}
      animate={mounted ? { opacity: [0.3, 1, 0.3], scaleX: [0.6, 1, 0.6] } : false}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
