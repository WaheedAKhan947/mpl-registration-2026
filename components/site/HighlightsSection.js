"use client";

import { useEffect, useState } from "react";
import { getYoutubeEmbedUrl } from "@/lib/youtube";

export default function HighlightsSection() {
  const [embedUrl, setEmbedUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEmbedUrl(getYoutubeEmbedUrl(data.highlightVideoUrl));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!embedUrl) return null;

  return (
    <section id="highlights" className="bg-navy-dark py-16 text-white sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            Match Highlights
          </h2>
          <p className="max-w-[440px] font-semibold text-white/70">
            Relive the best moments from the latest MPL action.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl shadow-panel-navy ring-2 ring-gold/30">
          <div className="relative aspect-video w-full">
            <iframe
              src={embedUrl}
              title="MPL Match Highlights"
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
