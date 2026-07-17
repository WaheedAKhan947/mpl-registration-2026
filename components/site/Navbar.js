"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Teams", href: "#teams" },
  { label: "Management", href: "#management" },
  { label: "Gallery", href: "#gallery" },
  { label: "Register", href: "#register" },
];

export default function Navbar() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-10 border-b-2 border-gold/70 bg-paper/90 backdrop-blur-lg"
      aria-label="Main navigation"
    >
      <div className="relative mx-auto flex min-h-[76px] w-[min(1180px,calc(100%-32px))] items-center justify-between gap-6">
        <a className="flex items-center gap-3 font-black" href="#home" aria-label="Maneri Premier League home">
          <Image
            src="/logo.png"
            alt="MPL logo"
            width={52}
            height={52}
            className="drop-shadow-[0_8px_18px_rgba(244,182,61,0.45)]"
          />
          <span className="text-navy-dark">
            Maneri Premier League
            <small className="-mt-1 block text-[0.78rem] font-bold text-muted">Swabi, KP, Pakistan</small>
          </span>
        </a>

        <button
          className="grid h-[42px] w-[42px] place-content-center gap-1 rounded-lg border border-ink/10 bg-white text-navy-dark md:hidden"
          type="button"
          aria-label="Open menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((o) => !o)}
        >
          <span aria-hidden="true" className="block h-0.5 w-[18px] rounded-full bg-current" />
          <span aria-hidden="true" className="block h-0.5 w-[18px] rounded-full bg-current" />
          <span aria-hidden="true" className="block h-0.5 w-[18px] rounded-full bg-current" />
        </button>

        <div
          className={`${
            navOpen ? "flex" : "hidden"
          } absolute left-0 right-0 top-[76px] flex-col items-stretch gap-2 rounded-lg border border-gold/30 bg-white p-4 shadow-panel-navy md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          onClick={() => setNavOpen(false)}
        >
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="py-2 font-bold text-[#24392e] hover:text-navy md:py-0">
              {link.label}
            </a>
          ))}
          <Button as="a" href="#contact" variant="gold" className="w-full md:w-auto">
            Contact
          </Button>
        </div>
      </div>
    </nav>
  );
}
