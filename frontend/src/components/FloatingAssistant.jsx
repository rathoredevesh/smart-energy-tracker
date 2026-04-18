import { useMemo, useState } from "react";
import { Bot, Sparkles, X } from "lucide-react";

export default function FloatingAssistant({ insights, notifications, pulse }) {
  const [open, setOpen] = useState(false);
  const assistantCards = useMemo(
    () => [
      {
        title: "Right now",
        body: pulse.narrative,
      },
      {
        title: "Best next action",
        body: insights.tips[0]?.body ?? "Trim the top appliance a little to ease this month's bill.",
      },
      {
        title: "Watch item",
        body: notifications[0]?.body ?? insights.peak_hours.message,
      },
    ],
    [insights, notifications, pulse],
  );

  return (
    <div className="fixed bottom-5 right-4 z-[72]">
      {open ? (
        <div className="glass-panel mb-3 w-[320px] rounded-[28px] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-tealglow/10 p-3 text-tealglow">
                <Bot size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Energy Guide</p>
                <p className="text-xs text-slate-400">Personalized quick reads</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-slate-300 transition hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {assistantCards.map((card) => (
              <div key={card.title} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-tealglow/80">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-16 w-16 items-center justify-center rounded-full border border-tealglow/30 bg-tealglow/15 text-tealglow shadow-[0_0_45px_rgba(0,245,197,0.28)] transition hover:scale-105"
      >
        <Bot size={22} />
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-electric text-[11px] font-bold text-slate-950">
          <Sparkles size={12} />
        </span>
      </button>
    </div>
  );
}
