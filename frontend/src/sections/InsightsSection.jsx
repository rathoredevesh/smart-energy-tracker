import { BrainCircuit, CloudSun, Radar, TrendingUp } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function InsightsSection({ insights }) {
  return (
    <section id="insights" className="section-divider">
      <div className="section-shell">
        <SectionHeading
          eyebrow="AI Insights"
          title="Predict bills, catch anomalies, explain changes, and recommend next steps"
          description="The FastAPI backend now layers forecasting, anomaly detection, weather correlation, room-specific coaching, and schedule recommendations into one personalized insight system."
        />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6" data-reveal>
            <GlassCard className="overflow-hidden p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-label">Forecast</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {insights.prediction.month}
                  </h3>
                </div>
                <div className="rounded-2xl bg-tealglow/10 p-3 text-tealglow">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Predicted Usage</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {insights.prediction.predicted_kwh} kWh
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Predicted Bill</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {currency(insights.prediction.predicted_bill_inr)}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Model Confidence</span>
                  <span>{Math.round(insights.prediction.confidence * 100)}%</span>
                </div>
                <div className="budget-track mt-3 h-3 rounded-full">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-electric to-tealglow"
                    style={{ width: `${Math.round(insights.prediction.confidence * 100)}%` }}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Anomaly Detection
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Usage spikes that diverged from your recent baseline.
                  </p>
                </div>
                <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                  <Radar size={18} />
                </div>
              </div>

              <div className="space-y-3">
                {insights.anomalies.length > 0 ? (
                  insights.anomalies.map((anomaly) => (
                    <div
                      key={`${anomaly.date}-${anomaly.kwh}`}
                      className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-white">{anomaly.date}</p>
                        <p className="text-sm text-yellow-200">
                          {anomaly.deviation_pct}% deviation
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{anomaly.kwh} kWh</p>
                      <p className="mt-2 text-sm text-slate-400">{anomaly.reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                    No major anomalies were detected in the current profile.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Smart Saving Tips
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Personal recommendations derived from your heaviest appliance
                    patterns.
                  </p>
                </div>
                <div className="rounded-2xl bg-electric/10 p-3 text-electric">
                  <BrainCircuit size={18} />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {insights.tips.map((tip) => (
                  <div
                    key={tip.title}
                    className="rounded-[24px] border border-white/8 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5"
                  >
                    <p className="text-sm uppercase tracking-[0.22em] text-tealglow/80">
                      Tip
                    </p>
                    <h4 className="mt-3 text-lg font-semibold text-white">
                      {tip.title}
                    </h4>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {tip.body}
                    </p>
                    <div className="mt-6 inline-flex rounded-full border border-tealglow/20 bg-tealglow/10 px-4 py-2 text-sm font-semibold text-tealglow">
                      Save up to Rs {tip.impact_inr}/month
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <CloudSun size={18} className="text-electric" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Weather-aware insight
                    </h3>
                    <p className="text-sm text-slate-400">
                      Correlation between climate and your energy behavior.
                    </p>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-sm leading-7 text-slate-300">
                    {insights.weather_story.headline}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">
                    Hottest day: {insights.weather_story.hottest_day.date} at{" "}
                    {insights.weather_story.hottest_day.temp_c} deg C with{" "}
                    {insights.weather_story.hottest_day.kwh} kWh.
                  </p>
                </div>
                <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-sm text-slate-400">Weather correlation score</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {insights.weather_story.correlation}
                  </p>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white">What changed?</h3>
                <div className="mt-4 space-y-3">
                  {insights.what_changed.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                    >
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white">
                  Room-specific recommendations
                </h3>
                <div className="mt-4 space-y-3">
                  {insights.room_tips.map((tip) => (
                    <div
                      key={tip.room}
                      className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                    >
                      <p className="font-semibold text-white">{tip.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        {tip.body}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white">
                  Peak-hour detection
                </h3>
                <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Peak window
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {insights.peak_hours.window}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {insights.peak_hours.message}
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
