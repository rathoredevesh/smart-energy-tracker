import { Cloud, Globe2, Trees } from "lucide-react";
import EcoScene from "../components/EcoScene";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";

export default function EcoImpactSection({ overview, isMobile }) {
  const cityCarbon = Number((overview.city_average_kwh * 0.82).toFixed(2));
  const usageRatio = Math.max(
    0.25,
    Math.min(1.15, overview.current_month_kwh / overview.city_average_kwh),
  );
  const treeEquivalent = Number((overview.carbon_kg / 21).toFixed(1));

  return (
    <section id="eco-impact" className="section-divider">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Eco Impact"
          title="Translate kWh into carbon impact and compare yourself with the city"
          description="This view converts household energy into CO2 emissions, animates a living eco-tree based on your footprint, and places your profile against the wider city baseline."
        />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div data-reveal>
            {isMobile ? (
              <GlassCard className="soft-grid p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
                    <div className="mb-4 inline-flex rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                      <Trees size={18} />
                    </div>
                    <p className="text-sm text-slate-400">Tree Equivalent</p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {treeEquivalent}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
                    <div className="mb-4 inline-flex rounded-2xl bg-electric/10 p-3 text-electric">
                      <Globe2 size={18} />
                    </div>
                    <p className="text-sm text-slate-400">Vs City Average</p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {overview.vs_city_pct}%
                    </p>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <EcoScene ecoScore={overview.eco_score} usageRatio={usageRatio} />
            )}
          </div>

          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-5">
                  <Cloud className="text-electric" size={18} />
                  <p className="mt-3 text-sm text-slate-400">Your CO2</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {overview.carbon_kg} kg
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-5">
                  <Globe2 className="text-tealglow" size={18} />
                  <p className="mt-3 text-sm text-slate-400">City Average CO2</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {cityCarbon} kg
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-5">
                  <Trees className="text-acid" size={18} />
                  <p className="mt-3 text-sm text-slate-400">Tree Offset Estimate</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {treeEquivalent}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white">Carbon Story</h3>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                <p>
                  Your current month totals translate to{" "}
                  <span className="font-semibold text-white">
                    {overview.carbon_kg} kg CO2
                  </span>
                  . That means every cut in appliance runtime improves both your bill
                  and your carbon output immediately.
                </p>
                <p>
                  The 3D tree grows as your energy profile becomes more efficient,
                  while the globe compares your home against the city benchmark of{" "}
                  <span className="font-semibold text-white">
                    {overview.city_average_kwh} kWh
                  </span>{" "}
                  per month.
                </p>
              </div>
              <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Relative Impact</span>
                  <span>{overview.vs_city_pct}% vs city</span>
                </div>
                <div className="budget-track mt-3 h-3 rounded-full">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-tealglow to-electric"
                    style={{
                      width: `${Math.min(Math.abs(overview.vs_city_pct) + 30, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
