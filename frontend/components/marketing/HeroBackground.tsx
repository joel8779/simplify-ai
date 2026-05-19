"use client";

import { motion, useReducedMotion } from "framer-motion";

export function HeroBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(217_91%_60%/0.24),transparent_32%),radial-gradient(circle_at_78%_22%,hsl(270_65%_58%/0.22),transparent_30%),radial-gradient(circle_at_50%_82%,hsl(221_83%_53%/0.12),transparent_34%)]" />
      <motion.div
        aria-hidden
        className="absolute -left-28 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl sm:h-96 sm:w-96"
        animate={
          shouldReduceMotion
            ? undefined
            : { x: [0, 26, 0], y: [0, -18, 0], opacity: [0.22, 0.36, 0.22] }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute right-[-9rem] top-8 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl sm:h-[30rem] sm:w-[30rem]"
        animate={
          shouldReduceMotion
            ? undefined
            : { x: [0, -22, 0], y: [0, 24, 0], opacity: [0.18, 0.32, 0.18] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.055)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.055)_1px,transparent_1px)] bg-[size:52px_52px] opacity-35 [mask-image:radial-gradient(ellipse_at_center,black_8%,transparent_72%)] hero-grid" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--background)/0)_0%,hsl(var(--background)/0.18)_46%,hsl(var(--background))_92%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
