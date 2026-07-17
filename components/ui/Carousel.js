"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function ChevronIcon({ direction = "left", className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

export default function Carousel({
  items,
  renderItem,
  ariaLabel,
  autoPlay = true,
  interval = 4500,
  slideClassName = "",
}) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current;
    const slide = track?.children[index];
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, []);

  const goTo = useCallback(
    (index) => {
      const next = (index + items.length) % items.length;
      setActiveIndex(next);
      scrollToIndex(next);
    },
    [items.length, scrollToIndex]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame;
    function handleScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { scrollLeft, children } = track;
        let closest = 0;
        let closestDistance = Infinity;
        Array.from(children).forEach((child, index) => {
          const distance = Math.abs(child.offsetLeft - scrollLeft);
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = index;
          }
        });
        setActiveIndex(closest);
      });
    }
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!autoPlay || isHovering || items.length <= 1) return;
    const id = setInterval(() => goTo(activeIndex + 1), interval);
    return () => clearInterval(id);
  }, [autoPlay, isHovering, interval, activeIndex, goTo, items.length]);

  return (
    <div
      className="relative rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") goTo(activeIndex + 1);
        if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      }}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <div key={index} className={`h-full shrink-0 snap-center ${slideClassName}`}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-white/95 text-navy-dark shadow-panel-navy transition hover:-translate-x-0.5 hover:bg-gold sm:flex"
          >
            <ChevronIcon direction="left" className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-1 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-white/95 text-navy-dark shadow-panel-navy transition hover:translate-x-0.5 hover:bg-gold sm:flex"
          >
            <ChevronIcon direction="right" className="h-5 w-5" />
          </button>

          <div className="mt-5 flex items-center justify-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-7 bg-gold" : "w-2.5 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
