"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { target: 6, suffix: "", label: "Competitive teams", color: "text-navy-dark", bar: "bg-navy-dark" },
  { target: 1, suffix: "", label: "Professional local platform", color: "text-brand-red", bar: "bg-brand-red" },
  { target: 100, suffix: "%", label: "Focus on fair play", color: "text-ember", bar: "bg-ember" },
];

function StatItem({ stat }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let start;
    let frame;
    function step(timestamp) {
      if (start === undefined) start = timestamp;
      const progress = Math.min((timestamp - start) / 1200, 1);
      setValue(Math.floor(progress * stat.target));
      if (progress < 1) frame = requestAnimationFrame(step);
      else setValue(stat.target);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, stat.target]);

  return (
    <div
      ref={ref}
      className="group min-h-[128px] bg-[#f4b63d] p-6 transition-transform duration-300 ease-out hover:-translate-y-1 flex flex-col items-center"
    >
      <span className={`mb-3 block h-1 w-10 rounded-full transition-all duration-500 group-hover:w-16 ${stat.bar}`} />
      <strong className={`block text-[clamp(2rem,4vw,3.2rem)] leading-none ${stat.color}`}>
        {value}
        {stat.suffix}
      </strong>
      <span className="font-extrabold text-muted">{stat.label}</span>
    </div>
  );
}

export default function StatsBar() {
  return (
    <div className="grid grid-cols-1 gap-5 bg-ink/10 sm:grid-cols-3 my-5" aria-label="League highlights">
      {STATS.map((stat) => (
        <StatItem key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
