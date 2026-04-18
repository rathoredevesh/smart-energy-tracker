import { useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";

export default function ReportCardSection({ billBreakdown, ecoReport }) {
  const reportRef = useRef(null);
  const [shareMessage, setShareMessage] = useState("");

  async function handleDownloadCard() {
    if (!reportRef.current) {
      return;
    }
    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = "smart-energy-report-card.png";
      link.href = dataUrl;
      link.click();
      setShareMessage("Report card downloaded as PNG.");
    } catch {
      setShareMessage("The card could not be rendered as PNG in this browser.");
    }
  }

  async function handleShareCard() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Smart Energy Report Card",
          text: ecoReport.share_text,
        });
        setShareMessage("Report card shared.");
        return;
      }

      await navigator.clipboard.writeText(ecoReport.share_text);
      setShareMessage("Share text copied to clipboard.");
    } catch {
      setShareMessage("Sharing was canceled or blocked by the browser.");
    }
  }

  return (
    <section id="report-card" className="section-divider">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Bill Breakdown"
          title="Show cost clearly and make the report card shareable"
          description="People remember bill impact more than raw kWh. This layer explains where the money went and turns your monthly summary into a visual card you can share or export."
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white">Cost by Appliance</h3>
              <p className="mt-2 text-sm text-slate-400">{billBreakdown.highlight}</p>
              <div className="mt-5 space-y-3">
                {billBreakdown.by_appliance.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.kwh} kWh | {item.hours_per_day} hrs/day
                        </p>
                      </div>
                      <p className="text-right text-white">
                        <span className="block text-lg font-semibold">
                          Rs {item.cost_inr}
                        </span>
                        <span className="text-sm text-slate-400">
                          {item.share_pct}%
                        </span>
                      </p>
                    </div>
                    <div className="budget-track mt-4 h-2 rounded-full">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-tealglow via-electric to-acid"
                        style={{ width: `${Math.min(item.share_pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white">Cost by Room</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {billBreakdown.by_room.map((room) => (
                  <div
                    key={room.name}
                    className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                  >
                    <p className="text-sm text-slate-400">{room.name}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      Rs {room.cost_inr}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {room.kwh} kWh | {room.share_pct}% of the month
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Shareable Eco Report Card
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Export a visual summary card or copy a share-ready line for social,
                    email, or chats.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadCard}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <Download size={16} />
                    Download Card
                  </button>
                  <button
                    type="button"
                    onClick={handleShareCard}
                    className="inline-flex items-center gap-2 rounded-full bg-tealglow px-4 py-3 text-sm font-semibold text-slate-950"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>

              <div
                ref={reportRef}
                className="rounded-[30px] border border-tealglow/20 bg-[radial-gradient(circle_at_top,rgba(0,245,197,0.18),transparent_36%),linear-gradient(135deg,#07111f,#081a2d)] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-tealglow/80">
                      Monthly Report
                    </p>
                    <h4 className="mt-3 font-display text-3xl font-bold text-white">
                      {ecoReport.headline}
                    </h4>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                      {ecoReport.subtitle}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Goals on track
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {ecoReport.goal_count}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {ecoReport.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4"
                    >
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {ecoReport.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-tealglow/20 bg-tealglow/10 px-4 py-2 text-sm font-medium text-tealglow"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {shareMessage ? (
                <div className="mt-4 rounded-2xl border border-tealglow/20 bg-tealglow/10 px-4 py-3 text-sm text-tealglow">
                  {shareMessage}
                </div>
              ) : null}
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
