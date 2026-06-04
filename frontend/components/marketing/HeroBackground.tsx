"use client";

import { motion, useReducedMotion } from "framer-motion";

export function HeroBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(217_91%_60%/0.06),transparent_35%),radial-gradient(circle_at_78%_22%,hsl(270_65%_58%/0.05),transparent_35%),radial-gradient(circle_at_50%_82%,hsl(221_83%_53%/0.03),transparent_40%)]" />
      <motion.div
        aria-hidden
        className="absolute -left-28 top-20 h-72 w-72 rounded-full bg-blue-500/5 blur-[100px] sm:h-96 sm:w-96"
        animate={
          shouldReduceMotion
            ? undefined
            : { x: [0, 16, 0], y: [0, -10, 0], opacity: [0.05, 0.08, 0.05] }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute right-[-9rem] top-8 h-80 w-80 rounded-full bg-violet-600/4 blur-[100px] sm:h-[30rem] sm:w-[30rem]"
        animate={
          shouldReduceMotion
            ? undefined
            : { x: [0, -14, 0], y: [0, 16, 0], opacity: [0.04, 0.07, 0.04] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_65%)] hero-grid" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--background)/0)_0%,hsl(var(--background)/0.05)_50%,hsl(var(--background))_90%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
