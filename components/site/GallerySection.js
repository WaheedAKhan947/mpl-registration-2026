"use client";

import Carousel from "@/components/ui/Carousel";
import { IMG_BASE } from "@/lib/siteData";

const GALLERY_IMAGES = [
  { src: `/image4.jpeg`, alt: "MPL gallery feature" },
  { src: `/image5.jpeg`, alt: "Cricket player portrait" },
  { src: `/image6.jpeg`, alt: "Cricket action" },
  { src: "/image7.jpeg", alt: "MPL 2025 champions with the trophy" },
  { src: "/image8.jpeg", alt: "Spectators watching the match" },
];

function GallerySlide({ image }) {
  return (
    <div className="group relative h-[320px] overflow-hidden rounded-2xl shadow-panel-navy ring-2 ring-gold/30 sm:h-[420px]">
      <img
        src={image.src}
        alt={image.alt}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/85 via-navy-dark/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute bottom-4 left-4 right-4 translate-y-2 font-bold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        {image.alt}
      </span>
    </div>
  );
}

export default function GallerySection() {
  return (
    <section id="gallery" className="bg-white py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            Match-Day Energy
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">
            A cleaner visual gallery gives the league a more official and memorable presence.
          </p>
        </div>
        <Carousel
          items={GALLERY_IMAGES}
          ariaLabel="MPL match-day gallery"
          slideClassName="w-[86%] sm:w-[58%] lg:w-[42%]"
          renderItem={(image) => <GallerySlide image={image} />}
        />
      </div>
    </section>
  );
}
