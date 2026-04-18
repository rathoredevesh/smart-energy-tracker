function getCellColor(intensity) {
  if (intensity <= 0.12) {
    return "rgba(18, 36, 56, 0.85)";
  }
  if (intensity <= 0.32) {
    return "rgba(16, 185, 129, 0.45)";
  }
  if (intensity <= 0.58) {
    return "rgba(132, 204, 22, 0.52)";
  }
  if (intensity <= 0.8) {
    return "rgba(250, 204, 21, 0.7)";
  }
  return "rgba(239, 68, 68, 0.85)";
}

export default function HeatmapCalendar({ cells = [] }) {
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return (
    <div className="glass-panel rounded-[28px] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Energy Heatmap</p>
          <p className="text-xs text-slate-400">Last 12 weeks of color-coded daily intensity</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
          <span>Low</span>
          <div className="h-2 w-8 rounded-full bg-slate-800" />
          <div className="h-2 w-8 rounded-full bg-emerald-400/60" />
          <div className="h-2 w-8 rounded-full bg-yellow-400/70" />
          <div className="h-2 w-8 rounded-full bg-red-500/80" />
          <span>High</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-flow-col grid-rows-7 gap-2">
          {weeks.map((week, weekIndex) =>
            week.map((cell, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className="group relative h-7 w-7 rounded-lg border border-white/6 transition-transform duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: getCellColor(cell.intensity) }}
                title={`${cell.date}: ${cell.kwh} kWh`}
              >
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-2xl group-hover:block">
                  <div className="font-semibold text-white">{cell.kwh} kWh</div>
                  <div className="mt-1 whitespace-nowrap text-slate-400">{cell.date}</div>
                </div>
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
}

