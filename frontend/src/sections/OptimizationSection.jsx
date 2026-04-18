import { useEffect, useMemo, useState } from "react";
import { CalendarRange, SlidersHorizontal } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";

function createInitialAdjustments(appliances) {
  return appliances.reduce((accumulator, item) => {
    accumulator[item.name] = 0;
    return accumulator;
  }, {});
}

export default function OptimizationSection({
  billBreakdown,
  planner,
  insights,
  overview,
}) {
  const appliances = billBreakdown.by_appliance.slice(0, 4);
  const [adjustments, setAdjustments] = useState(createInitialAdjustments(appliances));
  const [plannerForm, setPlannerForm] = useState({
    date: planner.recommended_days[0]?.date ?? new Date().toISOString().slice(0, 10),
    note: "Laundry + dishwasher",
    extraKwh: 2.5,
  });
  const [plannerItems, setPlannerItems] = useState([]);

  useEffect(() => {
    setAdjustments(createInitialAdjustments(appliances));
  }, [billBreakdown.by_appliance]);

  const simulation = useMemo(() => {
    let savedKwh = 0;
    let savedInr = 0;

    appliances.forEach((appliance) => {
      const reductionHours = adjustments[appliance.name] ?? 0;
      const perDayKwh = appliance.kwh / 30 || 0;
      const savedForAppliance = Math.min(perDayKwh, perDayKwh * (reductionHours / 2));
      savedKwh += savedForAppliance * 30;
      savedInr += savedForAppliance * 30 * 8.2;
    });

    const newBill = Math.max(overview.monthly_cost_inr - savedInr, 0);
    const co2Saved = savedKwh * 0.82;

    return {
      savedKwh: savedKwh.toFixed(1),
      savedInr: savedInr.toFixed(0),
      newBill: newBill.toFixed(0),
      co2Saved: co2Saved.toFixed(1),
    };
  }, [adjustments, appliances, overview.monthly_cost_inr]);

  function addPlannerItem(event) {
    event.preventDefault();
    setPlannerItems((current) => [
      {
        ...plannerForm,
        id: `${plannerForm.date}-${plannerForm.note}-${Date.now()}`,
      },
      ...current,
    ]);
  }

  return (
    <section id="optimization-lab" className="section-divider">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Optimization Lab"
          title="Experiment with savings before you change real behavior"
          description="Use a what-if simulator, schedule heavy tasks around your peak window, and keep a budget planning calendar for upcoming high-load days."
        />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <SlidersHorizontal size={18} className="text-tealglow" />
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Savings Simulator
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Drag appliance reductions and instantly see the impact on bill and
                    carbon.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  {appliances.map((appliance) => (
                    <div
                      key={appliance.name}
                      className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{appliance.name}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {appliance.kwh} kWh | Rs {appliance.cost_inr}
                          </p>
                        </div>
                        <p className="text-sm text-tealglow">
                          {adjustments[appliance.name] || 0} hr cut
                        </p>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.5"
                        value={adjustments[appliance.name] || 0}
                        onChange={(event) =>
                          setAdjustments((current) => ({
                            ...current,
                            [appliance.name]: Number(event.target.value),
                          }))
                        }
                        className="mt-4 w-full accent-tealglow"
                      />
                    </div>
                  ))}
                </div>

                <div className="rounded-[28px] border border-tealglow/15 bg-tealglow/10 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-tealglow/80">
                    Simulation Result
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-300">Monthly savings</p>
                      <p className="mt-1 text-3xl font-semibold text-white">
                        Rs {simulation.savedInr}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">Energy reduced</p>
                      <p className="mt-1 text-3xl font-semibold text-white">
                        {simulation.savedKwh} kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">New projected bill</p>
                      <p className="mt-1 text-3xl font-semibold text-white">
                        Rs {simulation.newBill}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">CO2 avoided</p>
                      <p className="mt-1 text-3xl font-semibold text-white">
                        {simulation.co2Saved} kg
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <CalendarRange size={18} className="text-electric" />
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Budget Planner Calendar
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Mark upcoming heavy-use days and keep them aligned with the
                    planner&apos;s safer windows.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <form className="space-y-4" onSubmit={addPlannerItem}>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Date</span>
                    <input
                      type="date"
                      value={plannerForm.date}
                      onChange={(event) =>
                        setPlannerForm({ ...plannerForm, date: event.target.value })
                      }
                      className="theme-input w-full"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Planned task</span>
                    <input
                      value={plannerForm.note}
                      onChange={(event) =>
                        setPlannerForm({ ...plannerForm, note: event.target.value })
                      }
                      className="theme-input w-full"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Expected extra kWh</span>
                    <input
                      type="number"
                      step="0.1"
                      value={plannerForm.extraKwh}
                      onChange={(event) =>
                        setPlannerForm({
                          ...plannerForm,
                          extraKwh: Number(event.target.value),
                        })
                      }
                      className="theme-input w-full"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full bg-electric px-5 py-3 text-sm font-semibold text-slate-950"
                  >
                    Add Plan
                  </button>
                </form>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">
                      Recommended cooler days
                    </p>
                    <div className="mt-3 space-y-3">
                      {planner.recommended_days.map((day) => (
                        <div
                          key={day.date}
                          className="flex items-center justify-between gap-3 text-sm text-slate-300"
                        >
                          <span>{day.date}</span>
                          <span>{day.temp_c} deg C | {day.condition}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">
                      Your planned heavy days
                    </p>
                    <div className="mt-3 space-y-3">
                      {plannerItems.length > 0 ? (
                        plannerItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-[20px] border border-white/8 bg-slate-950/40 p-3"
                          >
                            <p className="font-medium text-white">{item.note}</p>
                            <p className="mt-1 text-sm text-slate-400">
                              {item.date} | +{item.extraKwh} kWh
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">
                          No planned heavy-use days yet. Add one to track it against
                          the recommended windows.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white">
                Scheduling Suggestions
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                These AI scheduling ideas focus on moving flexible tasks outside{" "}
                {overview.peak_window}.
              </p>
              <div className="mt-5 space-y-3">
                {insights.schedule_suggestions.map((suggestion) => (
                  <div
                    key={suggestion.title}
                    className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                  >
                    <p className="font-semibold text-white">{suggestion.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {suggestion.body}
                    </p>
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
