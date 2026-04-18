import { Award, MapPinned, Medal, Trophy } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";

function rankIcon(rank) {
  if (rank === 1) {
    return <Trophy className="text-yellow-300" size={18} />;
  }
  if (rank === 2) {
    return <Medal className="text-slate-200" size={18} />;
  }
  return <Award className="text-amber-500" size={18} />;
}

export default function LeaderboardSection({ leaderboard }) {
  return (
    <section id="leaderboard">
      <div className="section-shell pb-24">
        <SectionHeading
          eyebrow="Leaderboard"
          title="See how your home stacks up against other energy savers"
          description="A playful eco leaderboard compares households by energy saved, highlights month-on-month improvement, awards milestone badges, and now places the homes on a neighborhood-style map."
        />

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <GlassCard className="relative min-h-[420px] overflow-hidden p-6" data-reveal>
            <div className="mb-5 flex items-center gap-3">
              <MapPinned size={18} className="text-tealglow" />
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Neighborhood Leaderboard Map
                </h3>
                <p className="text-sm text-slate-400">
                  Each marker represents a household on the board.
                </p>
              </div>
            </div>

            <div className="relative h-[320px] rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(0,245,197,0.12),transparent_40%),linear-gradient(135deg,#07111f,#081a2d)]">
              <div className="absolute inset-4 rounded-[24px] border border-white/6 soft-grid" />
              {leaderboard.map((home) => (
                <div
                  key={home.name}
                  className="absolute"
                  style={{
                    left: `${home.map_x}%`,
                    top: `${home.map_y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                      home.is_user
                        ? "border-tealglow/30 bg-tealglow/15 text-tealglow shadow-[0_0_25px_rgba(0,245,197,0.28)]"
                        : "border-white/10 bg-white/10 text-white"
                    }`}
                  >
                    #{home.rank}
                  </div>
                  <div className="mt-2 whitespace-nowrap text-center text-xs text-slate-300">
                    {home.zone}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-4" data-reveal>
            {leaderboard.map((home) => (
              <GlassCard
                key={home.name}
                className={`overflow-hidden p-6 ${home.is_user ? "neon-outline" : ""}`}
              >
                <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr_1fr] lg:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                      {rankIcon(home.rank)}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Rank #{home.rank}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">
                        {home.name}
                        {home.is_user ? " | You" : ""}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">{home.zone}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-slate-400">Current Month</p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {home.current_month_kwh} kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Energy Saved</p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {home.saved_kwh} kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Reduction</p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {home.reduction_pct}%
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {home.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-tealglow/20 bg-tealglow/10 px-4 py-2 text-sm font-medium text-tealglow"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
