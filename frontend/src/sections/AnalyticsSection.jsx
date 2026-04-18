import { useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import AnalyticsScene from "../components/AnalyticsScene";
import GlassCard from "../components/GlassCard";
import HeatmapCalendar from "../components/HeatmapCalendar";
import SectionHeading from "../components/SectionHeading";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function AnalyticsSection({ analytics, isMobile }) {
  const [period, setPeriod] = useState("monthly");

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148, 163, 184, 0.08)" },
      },
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148, 163, 184, 0.08)" },
      },
    },
  };

  const dailyTrendData = {
    labels: analytics.daily_trend.map((item) => item.date.slice(5)),
    datasets: [
      {
        label: "Daily kWh",
        data: analytics.daily_trend.map((item) => item.kwh),
        borderColor: "#00f5c5",
        backgroundColor: "rgba(0, 245, 197, 0.14)",
        fill: true,
        tension: 0.32,
        pointRadius: 0,
      },
    ],
  };

  const hourlyData = {
    labels: analytics.hourly_usage.map((item) => `${item.hour}:00`),
    datasets: [
      {
        label: "Hourly estimate",
        data: analytics.hourly_usage.map((item) => item.kwh),
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.12)",
        fill: true,
        tension: 0.28,
        pointRadius: 0,
      },
    ],
  };

  return (
    <section id="analytics" className="section-divider">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Analytics Dashboard"
          title="Zoom from live room signals into weekly, monthly, daily, and peak-hour trends"
          description="Track your appliance mix with a rotating 3D bar chart, inspect daily movement on a line graph, estimate peak-hour pressure, and scan long-term intensity patterns with a heatmap calendar."
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">3D Appliance Usage</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Rotate the appliance mix between weekly and monthly energy demand.
                  </p>
                </div>
                <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
                  {["weekly", "monthly"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPeriod(value)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        period === value
                          ? "bg-tealglow text-slate-950"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              {isMobile ? (
                <div className="space-y-3">
                  {analytics.bar_chart.map((item) => (
                    <div key={item.appliance} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{item.appliance}</p>
                        <p className="text-sm text-slate-300">{item[period]} kWh</p>
                      </div>
                      <div className="budget-track mt-3 h-2 rounded-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-tealglow to-electric"
                          style={{
                            width: `${Math.min((item[period] / analytics.bar_chart[0][period]) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <AnalyticsScene dataset={analytics.bar_chart} period={period} />
              )}
            </GlassCard>

            <HeatmapCalendar cells={analytics.heatmap} />
          </div>

          <div className="space-y-6" data-reveal>
            <GlassCard className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Daily Consumption Trend</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Continuous daily kWh tracking for the most recent 30 days.
                  </p>
                </div>
              </div>

              <div className="h-[320px]">
                <Line data={dailyTrendData} options={lineOptions} />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Threshold Alerts</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Budget thresholding and peak-hour estimation highlight rooms and weeks that need attention.
                  </p>
                </div>
                {analytics.alerts[0]?.level === "good" ? (
                  <ShieldCheck className="text-emerald-300" size={20} />
                ) : (
                  <AlertTriangle className="text-yellow-300" size={20} />
                )}
              </div>

              <div className="mb-5 h-[180px] rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                <Line data={hourlyData} options={lineOptions} />
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Budget Used</span>
                  <span>{analytics.budget_status.used_pct}%</span>
                </div>
                <div className="budget-track mt-3 h-3 rounded-full">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-tealglow via-electric to-red-400"
                    style={{ width: `${Math.min(analytics.budget_status.used_pct, 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Remaining: Rs {analytics.budget_status.remaining_inr}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {analytics.alerts.map((alert) => (
                  <div
                    key={alert.title}
                    className={`rounded-[22px] border p-4 ${
                      alert.level === "critical"
                        ? "status-critical"
                        : alert.level === "warning"
                          ? "status-warning"
                          : "status-success"
                    }`}
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-2 text-sm">{alert.message}</p>
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
