import { useEffect, useState } from "react";
import { Cpu, Gauge, Lightbulb, ScanLine, Zap } from "lucide-react";
import GlassCard from "../components/GlassCard";
import HouseScene from "../components/HouseScene";
import RealisticHouseScene from "../components/RealisticHouseScene";
import SectionHeading from "../components/SectionHeading";
import { getApplianceVisual } from "../lib/appliances";

function levelTone(level) {
  if (level === "green") {
    return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";
  }
  if (level === "yellow") {
    return "text-yellow-200 bg-yellow-400/10 border-yellow-300/20";
  }
  return "text-red-200 bg-red-500/10 border-red-400/20";
}

export default function HouseSection({
  rooms,
  isMobile,
  wireframeMode,
  onToggleWireframe,
}) {
  const [selectedRoom, setSelectedRoom] = useState(rooms[0] ?? null);

  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) {
      setSelectedRoom(rooms[0]);
    }
    if (selectedRoom && rooms.length > 0) {
      const updated = rooms.find((room) => room.id === selectedRoom.id);
      if (updated) {
        setSelectedRoom(updated);
      }
    }
  }, [rooms, selectedRoom]);

  return (
    <section id="house" className="section-divider">
      <div className="section-shell">
        <SectionHeading
          eyebrow="3D House Visualization"
          title="A living home model that glows with your demand"
          description="Each room brightens from green to yellow to red based on current energy intensity, with animated power flow straight from the main meter. Click the meter to fire a full-house burst."
        />

        <div className="mb-6 flex flex-wrap gap-3" data-reveal>
          <button
            type="button"
            onClick={onToggleWireframe}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              wireframeMode
                ? "border-tealglow/30 bg-tealglow/10 text-tealglow"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            <ScanLine size={16} />
            {wireframeMode ? "Wireframe On" : "Wireframe Mode"}
          </button>
          <div className="metric-pill">Click a room to inspect appliances</div>
          <div className="metric-pill">Click the meter to pulse power through the house</div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div data-reveal>
            {isMobile ? (
              <GlassCard className="soft-grid p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoom(room)}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-left transition hover:border-tealglow/25"
                    >
                      <div
                        className="h-3 w-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${room.color}, rgba(255,255,255,0.16))`,
                        }}
                      />
                      <p className="mt-4 text-lg font-semibold text-white">{room.label}</p>
                      <p className="mt-2 text-sm text-slate-400">
                        {room.weekly_kwh} kWh this week
                      </p>
                    </button>
                  ))}
                </div>
              </GlassCard>
            ) : (
              <HouseScene
                rooms={rooms}
                selectedRoomId={selectedRoom?.id}
                onSelectRoom={setSelectedRoom}
                wireframeMode={wireframeMode}
              />
            )}
          </div>

          <div className="space-y-6" data-reveal>
            {selectedRoom ? (
              <>
                <GlassCard className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="section-label">Selected Room</p>
                      <h3 className="mt-3 font-display text-3xl font-bold text-white">
                        {selectedRoom.label}
                      </h3>
                      <p className="mt-3 text-sm text-slate-400">
                        Live energy intensity mapped through color, brightness, and
                        room-level appliance motion.
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${levelTone(selectedRoom.level)}`}
                    >
                      {selectedRoom.level}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <Gauge size={18} className="text-tealglow" />
                      <p className="mt-3 text-sm text-slate-400">Weekly Consumption</p>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        {selectedRoom.weekly_kwh} kWh
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <Zap size={18} className="text-electric" />
                      <p className="mt-3 text-sm text-slate-400">Monthly Consumption</p>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        {selectedRoom.monthly_kwh} kWh
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <Cpu size={18} className="text-acid" />
                      <p className="mt-3 text-sm text-slate-400">Dominant Appliance</p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {selectedRoom.primary_appliance}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Appliance Breakdown
                      </h4>
                      <p className="text-sm text-slate-400">
                        Icons, usage bars, and cost share make the room panel feel
                        more alive.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedRoom.appliances.map((appliance) => {
                      const { Icon, accent } = getApplianceVisual(appliance.name);
                      return (
                        <div
                          key={appliance.name}
                          className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`rounded-2xl bg-white/5 p-3 ${accent}`}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <p className="font-semibold text-white">
                                  {appliance.name}
                                </p>
                                <p className="mt-1 text-sm text-slate-400">
                                  {appliance.watts}W | {appliance.hours_per_day} hrs/day
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">
                                {appliance.kwh} kWh
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                Rs {appliance.cost_inr}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            <div className="budget-track h-2 flex-1 rounded-full">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(appliance.share, 100)}%`,
                                  background: `linear-gradient(90deg, ${selectedRoom.color}, rgba(255,255,255,0.82))`,
                                }}
                              />
                            </div>
                            <Lightbulb size={14} className="text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-8" data-reveal>
          <GlassCard className="overflow-hidden p-6 sm:p-7">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="section-label">Realistic View</p>
                <h3 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
                  A more lifelike smart home preview
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
                  This second view keeps the same energy logic but renders it like a
                  real cutaway home with walls, roof, windows, furniture, lawn, and a
                  smart meter feeding each room.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="metric-pill">Same room data</div>
                <div className="metric-pill">Click any room to sync details</div>
              </div>
            </div>

            {isMobile ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {rooms.map((room) => (
                  <button
                    key={`realistic-${room.id}`}
                    type="button"
                    onClick={() => setSelectedRoom(room)}
                    className={`rounded-[24px] border p-5 text-left transition ${
                      selectedRoom?.id === room.id
                        ? "border-tealglow/30 bg-tealglow/10"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <div
                      className="h-32 rounded-[20px]"
                      style={{
                        background: `linear-gradient(180deg, rgba(207,238,255,0.96), rgba(237,246,238,0.98)), radial-gradient(circle at 24% 28%, ${room.color}, transparent 42%)`,
                      }}
                    />
                    <p className="mt-4 text-lg font-semibold text-white">{room.label}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Tap to inspect this room in the detailed panel.
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <RealisticHouseScene
                rooms={rooms}
                selectedRoomId={selectedRoom?.id}
                onSelectRoom={setSelectedRoom}
              />
            )}
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
