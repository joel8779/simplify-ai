"use client";

import { useEffect, useState } from "react";

interface UseScrollSpyOptions {
  /** Pixel offset from top (e.g. sticky header height). */
  offset?: number;
}

/**
 * Tracks which section id is currently in view using IntersectionObserver.
 * Picks the visible section with the largest intersection ratio; when tied,
 * prefers the one that appears later in the document (further down the page).
 */
export function useScrollSpy(
  sectionIds: string[],
  { offset = 80 }: UseScrollSpyOptions = {}
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const ratios = new Map<string, number>();

    const updateActive = () => {
      let bestId: string | null = null;
      let bestRatio = 0;
      let bestIndex = -1;

      sectionIds.forEach((id, index) => {
        const ratio = ratios.get(id) ?? 0;
        if (ratio > bestRatio || (ratio === bestRatio && ratio > 0 && index > bestIndex)) {
          bestRatio = ratio;
          bestId = id;
          bestIndex = index;
        }
      });

      if (bestRatio > 0) {
        setActiveId(bestId);
        return;
      }

      // Above first section — no nav highlight
      const first = document.getElementById(sectionIds[0]);
      if (first && first.getBoundingClientRect().top > offset) {
        setActiveId(null);
        return;
      }

      setActiveId(sectionIds[0] ?? null);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.intersectionRatio);
        });
        updateActive();
      },
      {
        rootMargin: `-${offset}px 0px -45% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScroll = () => updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    updateActive();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [sectionIds, offset]);

  return activeId;
}
