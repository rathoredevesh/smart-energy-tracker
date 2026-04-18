export default function RadialGauge({
  value,
  maxValue = 100,
  label,
  sublabel,
  unit = "",
  accent = "#00f5c5",
}) {
  const pct = Math.max(0, Math.min((value / maxValue) * 100, 100));
  const background = `conic-gradient(${accent} 0deg ${pct * 3.6}deg, rgba(255,255,255,0.06) ${pct * 3.6}deg 360deg)`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative flex h-36 w-36 items-center justify-center rounded-full border border-white/10"
        style={{ background }}
      >
        <div className="absolute inset-[14px] rounded-full border border-white/6 bg-slate-950/85" />
        <div className="relative text-center">
          <p className="text-3xl font-semibold text-white">
            {value}
            {unit}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</p>
        </div>
      </div>
      {sublabel ? <p className="max-w-[14rem] text-center text-sm text-slate-400">{sublabel}</p> : null}
    </div>
  );
}

