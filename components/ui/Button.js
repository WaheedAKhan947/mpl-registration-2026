const VARIANT_CLASSES = {
  primary:
    "border border-transparent bg-green text-white shadow-[0_14px_30px_rgba(11,107,58,0.22)] hover:-translate-y-0.5 hover:bg-green-dark hover:shadow-[0_18px_36px_rgba(11,107,58,0.27)]",
  secondary:
    "border border-ink/10 bg-white text-green-dark shadow-none hover:-translate-y-0.5",
  gold:
    "border border-transparent bg-gold text-navy-dark shadow-[0_14px_30px_rgba(244,182,61,0.35)] hover:-translate-y-0.5 hover:bg-[#e8a827] hover:shadow-[0_18px_36px_rgba(244,182,61,0.42)]",
};

const SIZE_CLASSES = {
  md: "min-h-[46px] px-5 text-[0.95rem]",
  sm: "min-h-[40px] px-4 text-sm",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2.5 rounded-lg font-extrabold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0";

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Button({
  as = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const classes = classNames(BASE_CLASSES, SIZE_CLASSES[size] || SIZE_CLASSES.md, VARIANT_CLASSES[variant], className);

  if (as === "a") {
    return (
      <a className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
