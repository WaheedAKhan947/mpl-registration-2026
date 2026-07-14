const VARIANT_CLASSES = {
  primary:
    "border border-transparent bg-green text-white shadow-[0_14px_30px_rgba(11,107,58,0.22)] hover:-translate-y-0.5 hover:bg-green-dark hover:shadow-[0_18px_36px_rgba(11,107,58,0.27)]",
  secondary:
    "border border-ink/10 bg-white text-green-dark shadow-none hover:-translate-y-0.5",
};

const BASE_CLASSES =
  "inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-lg px-5 text-[0.95rem] font-extrabold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0";

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export default function Button({
  as = "button",
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const classes = classNames(BASE_CLASSES, VARIANT_CLASSES[variant], className);

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
