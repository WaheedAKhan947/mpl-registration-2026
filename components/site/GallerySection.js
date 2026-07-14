import { IMG_BASE } from "@/lib/siteData";

const GALLERY_IMAGES = [
  { src: `${IMG_BASE}/gallery-img.png`, alt: "MPL gallery feature" },
  { src: `${IMG_BASE}/gallery01.png`, alt: "Cricket player portrait" },
  { src: `${IMG_BASE}/gallery02.png`, alt: "Cricket action" },
];

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:[grid-template-columns:1.2fr_0.8fr_0.8fr]">
          {GALLERY_IMAGES.map((image) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className="h-full min-h-[260px] w-full rounded-lg object-cover shadow-[0_16px_40px_rgba(16,32,24,0.1)]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
