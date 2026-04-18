import { Activity, CloudSun, Flag, Trophy } from "lucide-react";
import GlassCard from "../components/GlassCard";
import RadialGauge from "../components/RadialGauge";
import SectionHeading from "../components/SectionHeading";

function statusTone(status) {
  if (status === "off_track") {
    return "status-critical";
  }
  if (status === "done") {
    return "status-success";
  }
  if (status === "on_track") {
    return "status-accent";
  }
  return "status-warning";
}

export default function PulseSection({
  pulse,
  weather,
  compare,
  goals,
  challenges,
}) {
  return (
    <section id="pulse" className="section-divider">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Today&apos;s Energy Pulse"
          title="A live-feeling layer above the deeper analytics"
          description="This section surfaces your current load, today&apos;s progress, comparison snapshots, weather impact, and active goals so the dashboard feels like an operating center instead of a static report."
        />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-6" data-reveal>
            <GlassCard className="grid gap-6 p-6 lg:grid-cols-[auto_1fr]">
              <RadialGauge
                value={pulse.current_load_kw}
                maxValue={8}
                unit="kW"
                label="Live Load"
                accent="#00f5c5"
                sublabel={`${pulse.room_label} is the current energy leader.`}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Activity size={18} className="text-tealglow" />
                    <p className="text-sm font-semibold text-white">Current Pulse</p>
                  </div>
                  <p className="text-sm leading-7 text-slate-300">{pulse.narrative}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                    Peak window {pulse.peak_window}
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <CloudSun size={18} className="text-electric" />
                    <p className="text-sm font-semibold text-white">Weather Watch</p>
                  </div>
                  <p className="text-3xl font-semibold text-white">
                    {weather.current_temp_c} deg C
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{weather.summary}</p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Today so far</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {pulse.today_kwh} kWh
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Estimated cost Rs {pulse.estimated_today_cost_inr}
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Cost pressure</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {pulse.cost_pressure.appliance}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Rs {pulse.cost_pressure.cost_inr} this month
                  </p>
                </div>
              </div>
            </GlassCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Flag size={18} className="text-acid" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Comparison Modes
                    </h3>
                    <p className="text-sm text-slate-400">
                      This week vs last week, this month vs last month, and nearby
                      homes.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-400">Weekly</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {compare.weekly.delta_pct}%
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {compare.weekly.current_kwh} kWh vs {compare.weekly.previous_kwh} kWh
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-400">Monthly</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {compare.monthly.delta_pct}%
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {compare.monthly.current_kwh} kWh vs{" "}
                      {compare.monthly.previous_kwh} kWh
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {compare.similar_homes.map((home) => (
                    <div
                      key={home.name}
                      className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{home.name}</p>
                        <p className="text-sm text-slate-300">
                          {home.current_month_kwh} kWh
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        Delta vs you: {home.delta_kwh > 0 ? "+" : ""}
                        {home.delta_kwh} kWh
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Trophy size={18} className="text-yellow-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Family Challenge Mode
                    </h3>
                    <p className="text-sm text-slate-400">
                      Gamified missions for quick wins.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge.title}
                      className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{challenge.title}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {challenge.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">
                            {challenge.progress_pct}%
                          </p>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {challenge.reward_points} pts
                          </p>
                        </div>
                      </div>
                      <div className="budget-track mt-4 h-2 rounded-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-tealglow via-electric to-acid"
                          style={{ width: `${Math.min(challenge.progress_pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>

          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white">Smart Goals</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your dashboard now tracks goals the same way it tracks consumption.
              </p>
              <div className="mt-5 space-y-3">
                {goals.map((goal) => (
                  <div
                    key={goal.title}
                    className={`rounded-[22px] border p-4 ${statusTone(goal.status)}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{goal.title}</p>
                        <p className="mt-1 text-sm">{goal.target}</p>
                      </div>
                      <p className="text-lg font-semibold">{goal.progress_pct}%</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.22em]">
                      <span>{goal.reward}</span>
                      <span>{goal.status.replace("_", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
