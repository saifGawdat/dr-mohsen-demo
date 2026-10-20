"use client";

import { useEffect } from "react";

/**
 * One delegated listener for the prototype's cross-section controls, plus the
 * reveal/scrollspy observers. Section components stay server-rendered; only
 * the behaviours live here.
 */
export function SiteBehavior() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveal on first intersection, exactly like the approved prototype.
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-fade], [data-stagger]"));
    let revealObserver: IntersectionObserver | undefined;
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-in"));
    } else {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              revealObserver?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
      );
      targets.forEach((target) => revealObserver?.observe(target));
    }

    // Process rail: highlight the step crossing the middle of the viewport.
    const steps = Array.from(document.querySelectorAll<HTMLElement>(".m-step"));
    let stepObserver: IntersectionObserver | undefined;
    if (steps.length && "IntersectionObserver" in window) {
      stepObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => entry.target.classList.toggle("is-on", entry.isIntersecting));
        },
        { rootMargin: "-42% 0px -42% 0px" }
      );
      steps.forEach((step) => stepObserver?.observe(step));
    }

    const scrollTo = (id: string) => {
      document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const teamTrigger = target.closest("[data-team-request]");
      if (teamTrigger) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("mm:open-team"));
        return;
      }

      const bookTrigger = target.closest<HTMLElement>("[data-book-doc]");
      if (bookTrigger) {
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent("mm:book-doctor", {
            detail: {
              doctorId: bookTrigger.dataset.docId ?? "",
              specialty: bookTrigger.dataset.docSpec ?? "",
            },
          })
        );
        scrollTo("booking");
        return;
      }

      const specialtyTrigger = target.closest<HTMLElement>("[data-goto-spec]");
      if (specialtyTrigger) {
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent("mm:filter-doctors", {
            detail: { specialty: specialtyTrigger.dataset.gotoSpec ?? "all" },
          })
        );
        scrollTo("doctors");
      }
    };

    document.addEventListener("click", onClick);

    return () => {
      revealObserver?.disconnect();
      stepObserver?.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
