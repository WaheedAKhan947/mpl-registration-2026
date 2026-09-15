const TONES = {
  error: "border-brand-red/20 bg-brand-red/[0.07] text-brand-red",
  success: "border-green/25 bg-green/[0.08] text-green-dark",
  info: "border-ink/10 bg-[#fafbfa] text-muted",
};

export default function Notice({ tone = "info", className = "", children }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3.5 py-2.5 text-sm font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </p>
  );
}
