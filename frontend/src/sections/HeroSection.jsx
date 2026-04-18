import {
  ArrowRight,
  IndianRupee,
  Leaf,
  MoonStar,
  Sparkles,
  SunMedium,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import HeroScene from "../components/HeroScene";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HeroSection({
  overview,
  pulse,
  prediction,
  compare,
  preferences,
  isMobile,
  dayMode,
  soundEnabled,
  onToggleSound,
  onOpenOnboarding,
  onNavigate,
}) {
  return (
    <section id="top" className="section-divider relative overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-[780px] transition duration-700 ${
          dayMode
            ? "bg-[radial-gradient(circle_at_top,rgba(77,163,255,0.16),transparent_38%),linear-gradient(180deg,rgba(248,249,250,0.45),transparent)]"
            : "bg-[radial-gradient(circle_at_top,rgba(56,217,169,0.18),transparent_35%),linear-gradient(180deg,rgba(18,18,18,0.72),transparent)]"
        }`}
      />

      <div className="section-shell grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-tealglow/20 bg-tealglow/10 px-4 py-2 text-sm text-tealglow">
              <span className="h-2 w-2 rounded-full bg-tealglow shadow-[0_0_18px_rgba(0,245,197,0.8)]" />
              Smart Grid Intelligence
            </div>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-electric/40"
            >
              <Sparkles size={14} />
              Personalize
            </button>
            <button
              type="button"
              onClick={onToggleSound}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-electric/40"
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              Sound {soundEnabled ? "On" : "Off"}
            </button>
          </div>

          <div className="space-y-6" data-reveal>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-400">
              {preferences.displayName} | {preferences.city}
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.02] text-white sm:text-6xl xl:text-7xl">
              Track. Analyze.
              <br />
              <span className="gradient-title">Save Energy.</span>
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Monitor every room, compare against similar homes, predict upcoming bills,
              and move through a cleaner dashboard that separates daily work from deep
              analytics.
            </p>
          </div>

          <div className="flex flex-wrap gap-3" data-reveal>
            <button
              type="button"
              onClick={() => onNavigate("usage")}
              className="inline-flex items-center gap-2 rounded-full bg-tealglow px-5 py-3 text-sm font-semibold text-slate-950 transition hover:translate-y-[-2px]"
            >
              Open Usage Center
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-electric/50 hover:bg-electric/10"
            >
              Explore 3D Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate("planner")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-electric/50 hover:bg-electric/10"
            >
              Run Savings Lab
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3" data-reveal>
            <GlassCard className="p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-tealglow/10 p-3 text-tealglow">
                <Zap size={18} />
              </div>
              <p className="text-sm text-slate-400">Live Load</p>
              <p className="mt-2 text-3xl font-semibold text-white">{pulse.current_load_kw} kW</p>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                {pulse.room_label} now
              </p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-electric/10 p-3 text-electric">
                <IndianRupee size={18} />
              </div>
              <p className="text-sm text-slate-400">Projected Spend</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {formatCurrency(prediction.predicted_bill_inr)}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                {prediction.month} prediction
              </p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="mb-3 inline-flex rounded-2xl bg-acid/10 p-3 text-acid">
                <Leaf size={18} />
              </div>
              <p className="text-sm text-slate-400">Eco Score</p>
              <p className="mt-2 text-3xl font-semibold text-white">{overview.eco_score}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                {overview.vs_city_pct <= 0 ? "Below city average" : "Above city average"}
              </p>
            </GlassCard>
          </div>
        </div>

        <div className="space-y-4" data-reveal>
          {isMobile ? (
            <GlassCard className="hero-backdrop overflow-hidden p-8">
              <div className="soft-grid rounded-[28px] border border-white/8 p-8">
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-tealglow/30 bg-tealglow/10 shadow-[0_0_50px_rgba(0,245,197,0.22)]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-electric/15 px-3 text-center text-sm font-semibold text-white">
                    {dayMode ? "Day Mode" : "Night Mode"}
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-white/5"
                      style={{ height: `${48 + (index % 5) * 18}px` }}
                    />
                  ))}
                </div>
              </div>
            </GlassCard>
          ) : (
            <HeroScene dayMode={dayMode} />
          )}

          <GlassCard className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Budget</p>
              <p className="mt-2 text-xl font-semibold text-white">{overview.budget_used_pct}% used</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Peak Day</p>
              <p className="mt-2 text-xl font-semibold text-white">{overview.peak_day.kwh} kWh</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Comparison</p>
              <p className="mt-2 text-xl font-semibold text-white">{compare.monthly.delta_pct}% MoM</p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Hero Mode</p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-white">
                {dayMode ? (
                  <SunMedium size={16} className="text-yellow-300" />
                ) : (
                  <MoonStar size={16} className="text-cyan-200" />
                )}
                {dayMode ? "Day skyline" : "Night skyline"}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
