const CONTROL_CLASSES =
  "w-full rounded-lg border border-ink/10 bg-[#fbfbf8] px-[13px] py-3 text-ink outline-none transition focus:border-green focus:shadow-[0_0_0_4px_rgba(11,107,58,0.12)]";

export default function FormField({ field }) {
  const {
    name,
    label,
    type,
    required,
    options,
    placeholder,
    help,
    full,
    autoComplete,
    inputMode,
    min,
    max,
    accept,
  } = field;

  return (
    <label className={`grid gap-[7px] text-[0.9rem] font-black text-green-dark ${full ? "sm:col-span-2" : ""}`}>
      <span>
        {label} {required ? <span className="font-black text-brand-red">*</span> : null}
      </span>

      {type === "select" ? (
        <select name={name} required={required} defaultValue="" className={CONTROL_CLASSES}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          required={required}
          placeholder={placeholder}
          className={`${CONTROL_CLASSES} min-h-[96px] resize-y`}
        />
      ) : type === "file" ? (
        <input
          name={name}
          type="file"
          required={required}
          accept={accept}
          className={`${CONTROL_CLASSES} bg-white p-2.5`}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          min={min}
          max={max}
          className={CONTROL_CLASSES}
        />
      )}

      {help ? <span className="text-[0.82rem] font-bold text-muted">{help}</span> : null}
    </label>
  );
}
