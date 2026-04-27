import { Suspense, lazy, startTransition, useEffect, useMemo, useState } from "react";
import { Bolt, Leaf, Menu, Volume2, VolumeX, X } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroSection from "./sections/HeroSection";
import PulseSection from "./sections/PulseSection";
import {
  createEnergyLog,
  fetchDashboard,
  getReportExportUrl,
  uploadBillWorkbook,
} from "./lib/api";
import { useResponsiveMode } from "./hooks/useResponsiveMode";
import { useAmbientHum } from "./hooks/useAmbientHum";
import AlertCenter from "./components/AlertCenter";
import CustomCursor from "./components/CustomCursor";
import FloatingAssistant from "./components/FloatingAssistant";
import OnboardingModal from "./components/OnboardingModal";

const HouseSection = lazy(() => import("./sections/HouseSection"));
const DataPanelSection = lazy(() => import("./sections/DataPanelSection"));
const OptimizationSection = lazy(() => import("./sections/OptimizationSection"));
const AnalyticsSection = lazy(() => import("./sections/AnalyticsSection"));
const InsightsSection = lazy(() => import("./sections/InsightsSection"));
const ReportCardSection = lazy(() => import("./sections/ReportCardSection"));
const EcoImpactSection = lazy(() => import("./sections/EcoImpactSection"));
const LeaderboardSection = lazy(() => import("./sections/LeaderboardSection"));

gsap.registerPlugin(ScrollTrigger);

const STORAGE_KEY = "smart-energy-profile";
const DASHBOARD_CACHE_KEY = "smart-energy-dashboard-cache";
const THEME_KEY = "smart-energy-theme";
const VIEW_KEY = "smart-energy-view";
const DAY_MODE_LABEL = "\u2600\uFE0F Day Mode";
const NIGHT_MODE_LABEL = "\uD83C\uDF19 Night Mode";

const DEFAULT_PROFILE = {
  displayName: "Govinder Home",
  householdName: "You",
  city: "Bengaluru Metro Grid",
  monthlyBudgetInr: 3500,
  homeType: "Apartment",
  familySize: "4",
  primaryGoal: "Lower monthly bill",
};

const MAP_POSITIONS = [
  { zone: "North Grid", x: 20, y: 26 },
  { zone: "Riverfront", x: 39, y: 58 },
  { zone: "Central Loop", x: 53, y: 34 },
  { zone: "East Solar Bay", x: 72, y: 49 },
  { zone: "Green Ridge", x: 84, y: 22 },
];

const VIEW_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "Landing + Pulse",
    title: "Energy command center",
    description: "Start with the animated landing view, live energy pulse, and the fastest summary of how your home is behaving today.",
  },
  {
    id: "home",
    label: "3D Home",
    eyebrow: "Interactive House",
    title: "Inspect the 3D house room by room",
    description: "Open the living model of your home, watch power flow into each room, and inspect appliance pressure before it affects the bill.",
  },
  {
    id: "usage",
    label: "Usage",
    eyebrow: "Logs + Bills",
    title: "Capture usage without the clutter",
    description: "Manual logging, voice capture, Excel imports, recent usage history, and report exports now live in one cleaner work area.",
  },
  {
    id: "planner",
    label: "Planner",
    eyebrow: "Optimization Lab",
    title: "Test savings before changing habits",
    description: "Run bill simulations, schedule heavy-use days more intelligently, and see how small changes shape the month ahead.",
  },
  {
    id: "intelligence",
    label: "AI Insights",
    eyebrow: "Analytics + Forecasts",
    title: "Analyze trends and forecast the next move",
    description: "Move from trend lines to anomaly detection, budget alerts, AI tips, and demand patterns that explain where the next savings will come from.",
  },
  {
    id: "impact",
    label: "Eco Impact",
    eyebrow: "Carbon + Community",
    title: "Measure footprint and compare your progress",
    description: "Translate household kWh into carbon impact, compare against the city average, and climb the leaderboard with real savings.",
  },
];

const VIEW_ALIASES = {
  top: "overview",
  pulse: "overview",
  house: "home",
  "data-panel": "usage",
  "report-card": "usage",
  "optimization-lab": "planner",
  analytics: "intelligence",
  insights: "intelligence",
  "eco-impact": "impact",
  leaderboard: "impact",
};

function normalizeViewId(value) {
  const candidate = String(value ?? "").replace(/^#/, "").trim();
  if (!candidate) {
    return "overview";
  }

  if (VIEW_GROUPS.some((view) => view.id === candidate)) {
    return candidate;
  }

  return VIEW_ALIASES[candidate] ?? "overview";
}

function readStoredProfile() {
  if (typeof window === "undefined") {
    return DEFAULT_PROFILE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveStoredProfile(profile) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
}

function readStoredTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

function saveStoredTheme(theme) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_KEY, theme);
  }
}

function readStoredView() {
  if (typeof window === "undefined") {
    return "overview";
  }

  return normalizeViewId(window.location.hash || window.localStorage.getItem(VIEW_KEY) || "overview");
}

function saveStoredView(viewId) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VIEW_KEY, viewId);
  }
}

function readDashboardCache() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(DASHBOARD_CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function readCachedDashboard(householdName) {
  const cache = readDashboardCache();
  return cache[householdName] ?? null;
}

function saveCachedDashboard(householdName, dashboard) {
  if (typeof window === "undefined") {
    return;
  }

  const cache = readDashboardCache();
  cache[householdName] = dashboard;
  window.localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(cache));
}

function aggregateAppliances(rooms = []) {
  const applianceMap = new Map();
  rooms.forEach((room) => {
    (room.appliances ?? []).forEach((appliance) => {
      const current = applianceMap.get(appliance.name) ?? {
        name: appliance.name,
        cost_inr: 0,
        kwh: 0,
        hours_per_day: appliance.hours_per_day ?? 0,
      };
      current.cost_inr += Number(appliance.cost_inr ?? 0);
      current.kwh += Number(appliance.kwh ?? 0);
      current.hours_per_day = Math.max(
        current.hours_per_day,
        Number(appliance.hours_per_day ?? 0),
      );
      applianceMap.set(appliance.name, current);
    });
  });

  return [...applianceMap.values()].sort((left, right) => right.cost_inr - left.cost_inr);
}

function nextDates(count = 3) {
  return Array.from({ length: count }, (_, index) => {
    const value = new Date();
    value.setDate(value.getDate() + index + 1);
    return value.toISOString().slice(0, 10);
  });
}

function normalizeDashboard(payload, householdName) {
  const overview = {
    budget_used_pct: 0,
    budget_remaining_inr: 0,
    monthly_cost_inr: 0,
    current_month_kwh: 0,
    carbon_kg: 0,
    eco_score: 72,
    vs_city_pct: 0,
    month_label: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
    peak_window: "7 PM - 9 PM",
    top_appliance: { name: "AC", kwh: 0 },
    peak_day: { date: new Date().toISOString().slice(0, 10), kwh: 0 },
    ...payload.overview,
  };

  const rooms = payload.rooms ?? [];
  const flattenedAppliances = aggregateAppliances(rooms);
  const monthlyCost = Number(overview.monthly_cost_inr ?? 0);

  const billBreakdown = payload.bill_breakdown ?? {
    monthly_cost_inr: monthlyCost,
    by_appliance: flattenedAppliances.slice(0, 8).map((appliance) => ({
      ...appliance,
      share_pct:
        monthlyCost > 0
          ? Number(((appliance.cost_inr / monthlyCost) * 100).toFixed(1))
          : 0,
    })),
    by_room: rooms.map((room) => {
      const roomCost = (room.appliances ?? []).reduce(
        (sum, appliance) => sum + Number(appliance.cost_inr ?? 0),
        0,
      );
      return {
        name: room.label,
        cost_inr: Number(roomCost.toFixed(2)),
        kwh: Number(room.monthly_kwh ?? 0),
        share_pct:
          monthlyCost > 0 ? Number(((roomCost / monthlyCost) * 100).toFixed(1)) : 0,
      };
    }),
    by_day: [],
    standby_cost_inr: 0,
    highlight: flattenedAppliances[0]
      ? `${flattenedAppliances[0].name} is driving the largest share of the bill.`
      : "Bill breakdown will appear as you log more appliance usage.",
  };

  const availableHouseholds = Array.from(
    new Set(
      [
        householdName,
        ...(payload.profile?.available_households ?? []),
        ...((payload.leaderboard ?? []).map((item) => item.name)),
      ].filter(Boolean),
    ),
  );

  const pulse = payload.pulse ?? {
    current_load_kw: Number(overview.current_load_kw ?? 0.6),
    estimated_today_cost_inr: Number(overview.today_cost_inr ?? 0),
    today_kwh: Number(overview.today_kwh ?? 0),
    room_label: overview.current_room_label ?? rooms[0]?.label ?? "Living Room",
    peak_window: overview.peak_window,
    grid_status: overview.budget_used_pct >= 85 ? "Watch" : "Stable",
    temperature_c: 31,
    condition: "Warm",
    narrative: `${overview.current_room_label ?? rooms[0]?.label ?? "Living Room"} is leading the current demand.`,
    cost_pressure: {
      appliance: billBreakdown.by_appliance[0]?.name ?? overview.top_appliance?.name ?? "AC",
      cost_inr: billBreakdown.by_appliance[0]?.cost_inr ?? 0,
    },
  };

  const compare = payload.compare ?? {
    weekly: {
      current_kwh: Number(overview.weekly_kwh ?? 0),
      previous_kwh: Number(overview.weekly_kwh ?? 0),
      delta_pct: 0,
    },
    monthly: {
      current_kwh: Number(overview.current_month_kwh ?? 0),
      previous_kwh: Number(overview.current_month_kwh ?? 0),
      delta_pct: Number(overview.month_over_month_pct ?? 0),
    },
    top_changes: [],
    similar_homes: [],
  };

  const weather = payload.weather ?? {
    current_temp_c: 31,
    condition: "Warm",
    correlation: 0.18,
    summary:
      "Weather-aware insights become richer after the upgraded backend reloads, but the dashboard is ready to use now.",
    hottest_day: {
      date: new Date().toISOString().slice(0, 10),
      temp_c: 33,
      kwh: Number(overview.today_kwh ?? 0),
    },
    series: [],
    next_week: nextDates().map((dateValue, index) => ({
      date: dateValue,
      temp_c: 30 + index,
      condition: "Warm",
      risk: index === 0 ? "low" : "steady",
    })),
  };

  const analytics = {
    bar_chart: payload.analytics?.bar_chart ?? [],
    daily_trend: payload.analytics?.daily_trend ?? [],
    heatmap: payload.analytics?.heatmap ?? [],
    hourly_usage:
      payload.analytics?.hourly_usage ??
      Array.from({ length: 24 }, (_, hour) => ({
        hour,
        kwh: hour >= 19 && hour <= 22 ? 0.8 : 0.25,
      })),
    alerts:
      payload.analytics?.alerts ??
      [
        {
          level: "good",
          title: "Energy profile looks balanced",
          message: "Usage is loading normally.",
        },
      ],
    budget_status: payload.analytics?.budget_status ?? {
      used_pct: Number(overview.budget_used_pct ?? 0),
      remaining_inr: Number(overview.budget_remaining_inr ?? 0),
    },
  };

  const goals =
    payload.goals ??
    [
      {
        title: "Stay under your monthly budget",
        target: "Keep spend within your target range",
        progress_pct: Math.min(Number(overview.budget_used_pct ?? 0), 100),
        status: Number(overview.budget_used_pct ?? 0) < 100 ? "on_track" : "off_track",
        reward: "Budget Guardian",
      },
      {
        title: "Beat the city average",
        target: "Stay below the city baseline this month",
        progress_pct:
          overview.vs_city_pct <= 0
            ? 100
            : Math.max(30, 100 - Number(overview.vs_city_pct)),
        status: overview.vs_city_pct <= 0 ? "on_track" : "watch",
        reward: "City Saver",
      },
    ];

  const challenges =
    payload.challenges ??
    [
      {
        title: "Cool Smarter",
        description: "Trim cooling time during the evening peak window.",
        progress_pct: 62,
        reward_points: 120,
      },
      {
        title: "No-Standby Sunday",
        description: "Reduce always-on appliance waste this week.",
        progress_pct: 48,
        reward_points: 140,
      },
    ];

  const planner = payload.planner ?? {
    daily_budget_inr: 117,
    recommended_days: nextDates().map((dateValue) => ({
      date: dateValue,
      temp_c: 30,
      condition: "Warm",
      risk: "low",
    })),
    watch_days: [],
    planning_hint: "Heavy tasks are easiest to schedule outside the evening peak.",
  };

  const insights = {
    prediction: {
      month: payload.insights?.prediction?.month ?? overview.month_label,
      predicted_kwh: Number(
        payload.insights?.prediction?.predicted_kwh ?? overview.current_month_kwh ?? 0,
      ),
      predicted_bill_inr: Number(
        payload.insights?.prediction?.predicted_bill_inr ??
          overview.monthly_cost_inr ??
          0,
      ),
      confidence: Number(payload.insights?.prediction?.confidence ?? 0.62),
    },
    anomalies: payload.insights?.anomalies ?? [],
    tips:
      payload.insights?.tips ??
      [
        {
          title: "Trim your top appliance slightly",
          body: "A small runtime reduction on the main appliance can create the fastest savings this month.",
          impact_inr: 120,
        },
      ],
    room_tips:
      payload.insights?.room_tips ??
      rooms.slice(0, 3).map((room) => ({
        room: room.label,
        title: `${room.label} recommendation`,
        body: `${room.label} is ready for a quick tune-up around ${room.primary_appliance ?? "its main appliance"}.`,
      })),
    weather_story:
      payload.insights?.weather_story ?? {
        headline: weather.summary,
        correlation: weather.correlation,
        hottest_day: weather.hottest_day,
      },
    what_changed:
      payload.insights?.what_changed ??
      [
        {
          title: "Monthly comparison loaded",
          body: `Current month is ${compare.monthly.delta_pct}% versus the previous month.`,
        },
      ],
    schedule_suggestions:
      payload.insights?.schedule_suggestions ??
      billBreakdown.by_appliance.slice(0, 3).map((item) => ({
        title: `Schedule ${item.name} smarter`,
        body: `Shift flexible ${item.name.toLowerCase()} usage outside ${pulse.peak_window}.`,
      })),
    peak_hours:
      payload.insights?.peak_hours ?? {
        window: pulse.peak_window,
        current_load_kw: pulse.current_load_kw,
        message: `Your heaviest pressure appears around ${pulse.peak_window}.`,
      },
  };

  const leaderboard = (payload.leaderboard ?? []).map((item, index) => {
    const marker = MAP_POSITIONS[index % MAP_POSITIONS.length];
    return {
      ...item,
      zone: item.zone ?? marker.zone,
      map_x: item.map_x ?? marker.x,
      map_y: item.map_y ?? marker.y,
    };
  });

  const ecoReport =
    payload.eco_report ?? {
      headline:
        overview.vs_city_pct <= 0
          ? "Your home is below the city average this month."
          : "Your home is above the city average this month.",
      subtitle: `Eco score ${overview.eco_score} with a focus on ${overview.top_appliance?.name ?? "your top appliance"}.`,
      badges: leaderboard.find((item) => item.is_user)?.badges ?? ["Grid Guardian"],
      goal_count: goals.length,
      stats: [
        { label: "Monthly kWh", value: overview.current_month_kwh },
        { label: "Bill", value: overview.monthly_cost_inr },
        { label: "CO2 kg", value: overview.carbon_kg },
        { label: "Predicted bill", value: insights.prediction.predicted_bill_inr },
      ],
      share_text: `This month I used ${overview.current_month_kwh} kWh and kept an eco score of ${overview.eco_score}.`,
    };

  const notifications = payload.notifications ?? analytics.alerts.map((alert) => ({
    level: alert.level,
    title: alert.title,
    body: alert.message,
  }));

  const recentLogs = (payload.recent_logs ?? []).map((log) => ({
    ...log,
    cost_inr:
      log.cost_inr ??
      Number(
        (
          ((log.kwh ??
            ((Number(log.watts ?? 0) * Number(log.hours_per_day ?? 0)) / 1000)) ??
            0) * 8.2
        ).toFixed(2),
      ),
  }));

  return {
    ...payload,
    overview,
    rooms,
    analytics,
    compare,
    weather,
    pulse,
    bill_breakdown: billBreakdown,
    goals,
    challenges,
    planner,
    insights,
    leaderboard,
    eco_report: ecoReport,
    notifications,
    recent_logs: recentLogs,
    profile: {
      active_household: payload.profile?.active_household ?? householdName,
      available_households: availableHouseholds.length
        ? availableHouseholds
        : [householdName],
      city: payload.profile?.city ?? DEFAULT_PROFILE.city,
      default_budget_inr:
        payload.profile?.default_budget_inr ?? DEFAULT_PROFILE.monthlyBudgetInr,
    },
  };
}

function PageHeader({ eyebrow, title, description, metrics = [] }) {
  return (
    <section className="section-shell pb-10 pt-10">
      <div className="page-shell" data-reveal>
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div>
            <p className="section-label">{eyebrow}</p>
            <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">
              {title}
            </h1>
            <p className="page-copy mt-4 max-w-3xl text-base leading-8">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="page-metric">
                <p className="page-metric-label">{metric.label}</p>
                <p className="page-metric-value">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel max-w-lg rounded-[36px] p-10 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-tealglow/30 bg-tealglow/10 shadow-[0_0_65px_rgba(0,245,197,0.22)]">
          <div className="loader-ring" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-white">
          Booting Smart Grid
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Pulling live pulse metrics, weather-aware insights, bill forecasts, and the
          3D home system.
        </p>
      </div>
    </div>
  );
}

function SectionFallback({ title = "Loading section..." }) {
  return (
    <section className="section-shell pb-10 pt-10">
      <div className="page-shell">
        <div className="glass-panel rounded-[32px] p-8">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Preparing view</p>
          <h2 className="mt-4 font-display text-3xl font-bold text-white">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Pulling the interactive visuals into place.
          </p>
        </div>
      </div>
    </section>
  );
}

function createFallbackDashboard(householdName) {
  return normalizeDashboard({}, householdName ?? DEFAULT_PROFILE.householdName);
}

export default function App() {
  const [profile, setProfile] = useState(() => readStoredProfile());
  const [dashboard, setDashboard] = useState(() => {
    const storedProfile = readStoredProfile();
    return (
      readCachedDashboard(storedProfile.householdName) ??
      createFallbackDashboard(storedProfile.householdName)
    );
  });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [theme, setTheme] = useState(() => readStoredTheme());
  const [activeView, setActiveView] = useState(() => readStoredView());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [alertQueue, setAlertQueue] = useState([]);
  const isMobile = useResponsiveMode();

  useAmbientHum(soundEnabled);

  const isLightTheme = theme === "light";

  const activeHousehold = useMemo(
    () => dashboard?.profile?.active_household ?? profile.householdName ?? "You",
    [dashboard, profile.householdName],
  );

  const currentViewMeta = useMemo(
    () => VIEW_GROUPS.find((view) => view.id === activeView) ?? VIEW_GROUPS[0],
    [activeView],
  );

  const currentViewMetrics = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const userRank = dashboard.leaderboard.find((entry) => entry.is_user)?.rank ?? "--";

    if (activeView === "home") {
      return [
        { label: "Rooms", value: dashboard.rooms.length },
        { label: "Top room", value: dashboard.pulse.room_label },
        { label: "Peak window", value: dashboard.overview.peak_window },
      ];
    }

    if (activeView === "usage") {
      return [
        { label: "Recent logs", value: dashboard.recent_logs.length },
        { label: "Active household", value: activeHousehold },
        { label: "Export status", value: "Excel ready" },
      ];
    }

    if (activeView === "planner") {
      return [
        { label: "Daily budget", value: `Rs ${dashboard.planner.daily_budget_inr}` },
        {
          label: "Smart tips",
          value: dashboard.insights.schedule_suggestions.length,
        },
        {
          label: "Potential save",
          value: `Rs ${dashboard.insights.tips[0]?.impact_inr ?? 0}`,
        },
      ];
    }

    if (activeView === "intelligence") {
      return [
        {
          label: "Forecast confidence",
          value: `${Math.round(dashboard.insights.prediction.confidence * 100)}%`,
        },
        { label: "Anomalies", value: dashboard.insights.anomalies.length },
        { label: "Alerts", value: dashboard.analytics.alerts.length },
      ];
    }

    if (activeView === "impact") {
      return [
        { label: "CO2", value: `${dashboard.overview.carbon_kg} kg` },
        { label: "Vs city", value: `${dashboard.overview.vs_city_pct}%` },
        { label: "Leaderboard", value: `#${userRank}` },
      ];
    }

    return [
      { label: "Live load", value: `${dashboard.pulse.current_load_kw} kW` },
      { label: "Projected bill", value: `Rs ${dashboard.insights.prediction.predicted_bill_inr}` },
      { label: "Eco score", value: dashboard.overview.eco_score },
    ];
  }, [activeHousehold, activeView, dashboard]);

  function primeDashboard(householdName) {
    const nextHousehold = householdName ?? DEFAULT_PROFILE.householdName;
    const cachedDashboard = readCachedDashboard(nextHousehold);
    startTransition(() => {
      setDashboard(cachedDashboard ?? createFallbackDashboard(nextHousehold));
    });
  }

  async function loadDashboard(householdName, options = {}) {
    const { background = false } = options;
    const nextHousehold =
      householdName ?? profile.householdName ?? DEFAULT_PROFILE.householdName;

    try {
      if (!background) {
        setLoading(true);
      }

      const payload = await fetchDashboard(nextHousehold);
      const normalizedDashboard = normalizeDashboard(payload, nextHousehold);
      startTransition(() => {
        setDashboard(normalizedDashboard);
      });
      saveCachedDashboard(nextHousehold, normalizedDashboard);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const storedProfile = readStoredProfile();
    setProfile(storedProfile);
    setShowOnboarding(!window.localStorage.getItem(STORAGE_KEY));
    loadDashboard(storedProfile.householdName, { background: true });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    saveStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    function syncViewFromHash() {
      const nextView = normalizeViewId(
        window.location.hash || window.localStorage.getItem(VIEW_KEY) || "overview",
      );
      setActiveView(nextView);
      saveStoredView(nextView);
    }

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  useEffect(() => {
    if (!dashboard) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.utils.toArray("[data-reveal]").forEach((element, index) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 42, filter: "blur(12px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            ease: "power3.out",
            duration: 0.9,
            delay: index * 0.03,
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
            },
          },
        );
      });
      ScrollTrigger.refresh();
    });

    return () => context.revert();
  }, [activeView, dashboard]);

  useEffect(() => {
    if (dashboard?.notifications?.length) {
      setAlertQueue(dashboard.notifications);
    }
  }, [dashboard]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
  }, [activeView]);

  async function handleSubmitLog(payload) {
    try {
      setBusy(true);
      const response = await createEnergyLog({
        ...payload,
        household_name: activeHousehold,
      });
      const normalizedDashboard = normalizeDashboard(response.dashboard, activeHousehold);
      startTransition(() => {
        setDashboard(normalizedDashboard);
      });
      saveCachedDashboard(activeHousehold, normalizedDashboard);
      setFeedback({ type: "success", message: response.message });
      setError("");
    } catch (submitError) {
      setFeedback({ type: "error", message: submitError.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadBill(file) {
    try {
      setBusy(true);
      const response = await uploadBillWorkbook(file);
      const refreshedDashboard = await fetchDashboard(activeHousehold);
      const normalizedDashboard = normalizeDashboard(
        refreshedDashboard ?? response.dashboard,
        activeHousehold,
      );
      startTransition(() => {
        setDashboard(normalizedDashboard);
      });
      saveCachedDashboard(activeHousehold, normalizedDashboard);
      setFeedback({ type: "success", message: response.message });
      setError("");
    } catch (uploadError) {
      setFeedback({ type: "error", message: uploadError.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleHouseholdChange(nextHousehold) {
    const nextProfile = { ...profile, householdName: nextHousehold };
    setProfile(nextProfile);
    saveStoredProfile(nextProfile);
    primeDashboard(nextHousehold);
    await loadDashboard(nextHousehold, { background: true });
  }

  function handleSaveProfile(nextProfile) {
    setProfile(nextProfile);
    saveStoredProfile(nextProfile);
    setShowOnboarding(false);
    primeDashboard(nextProfile.householdName);
    loadDashboard(nextProfile.householdName, { background: true });
  }

  function navigateToView(viewId) {
    const nextView = normalizeViewId(viewId);
    setActiveView(nextView);
    saveStoredView(nextView);

    if (window.location.hash !== `#${nextView}`) {
      window.location.hash = nextView;
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (loading && !dashboard) {
    return <LoadingScreen />;
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel max-w-xl rounded-[32px] p-8">
          <h1 className="font-display text-3xl font-bold text-white">API connection failed</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">{error}</p>
          <button
            type="button"
            onClick={() => loadDashboard(profile.householdName)}
            className="mt-6 rounded-full bg-tealglow px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  function renderCurrentView() {
    if (activeView === "home") {
      return (
        <>
          <PageHeader
            eyebrow={currentViewMeta.eyebrow}
            title={currentViewMeta.title}
            description={currentViewMeta.description}
            metrics={currentViewMetrics}
          />
          <Suspense fallback={<SectionFallback title="Loading the 3D house..." />}>
            <HouseSection
              rooms={dashboard.rooms}
              isMobile={isMobile}
              wireframeMode={wireframeMode}
              onToggleWireframe={() => setWireframeMode((current) => !current)}
            />
          </Suspense>
        </>
      );
    }

    if (activeView === "usage") {
      return (
        <>
          <PageHeader
            eyebrow={currentViewMeta.eyebrow}
            title={currentViewMeta.title}
            description={currentViewMeta.description}
            metrics={currentViewMetrics}
          />
          <Suspense fallback={<SectionFallback title="Loading usage center..." />}>
            <DataPanelSection
              rooms={dashboard.rooms}
              recentLogs={dashboard.recent_logs}
              onSubmitLog={handleSubmitLog}
              onUploadBill={handleUploadBill}
              exportUrl={getReportExportUrl(activeHousehold)}
              busy={busy}
              feedback={feedback}
              activeHousehold={activeHousehold}
              availableHouseholds={dashboard.profile.available_households}
              onHouseholdChange={handleHouseholdChange}
            />
            <ReportCardSection
              billBreakdown={dashboard.bill_breakdown}
              ecoReport={dashboard.eco_report}
            />
          </Suspense>
        </>
      );
    }

    if (activeView === "planner") {
      return (
        <>
          <PageHeader
            eyebrow={currentViewMeta.eyebrow}
            title={currentViewMeta.title}
            description={currentViewMeta.description}
            metrics={currentViewMetrics}
          />
          <Suspense fallback={<SectionFallback title="Loading savings lab..." />}>
            <OptimizationSection
              billBreakdown={dashboard.bill_breakdown}
              planner={dashboard.planner}
              insights={dashboard.insights}
              overview={dashboard.overview}
            />
          </Suspense>
        </>
      );
    }

    if (activeView === "intelligence") {
      return (
        <>
          <PageHeader
            eyebrow={currentViewMeta.eyebrow}
            title={currentViewMeta.title}
            description={currentViewMeta.description}
            metrics={currentViewMetrics}
          />
          <Suspense fallback={<SectionFallback title="Loading analytics..." />}>
            <AnalyticsSection analytics={dashboard.analytics} isMobile={isMobile} />
            <InsightsSection insights={dashboard.insights} />
          </Suspense>
        </>
      );
    }

    if (activeView === "impact") {
      return (
        <>
          <PageHeader
            eyebrow={currentViewMeta.eyebrow}
            title={currentViewMeta.title}
            description={currentViewMeta.description}
            metrics={currentViewMetrics}
          />
          <Suspense fallback={<SectionFallback title="Loading eco impact..." />}>
            <EcoImpactSection overview={dashboard.overview} isMobile={isMobile} />
            <LeaderboardSection leaderboard={dashboard.leaderboard} />
          </Suspense>
        </>
      );
    }

    return (
      <>
        <HeroSection
          overview={dashboard.overview}
          pulse={dashboard.pulse}
          prediction={dashboard.insights.prediction}
          compare={dashboard.compare}
          preferences={profile}
          isMobile={isMobile}
          dayMode={isLightTheme}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((current) => !current)}
          onOpenOnboarding={() => setShowOnboarding(true)}
          onNavigate={navigateToView}
        />
        <PulseSection
          pulse={dashboard.pulse}
          weather={dashboard.weather}
          compare={dashboard.compare}
          goals={dashboard.goals}
          challenges={dashboard.challenges}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen ${isMobile || isLightTheme ? "" : "cursor-none"}`}>
      <CustomCursor disabled={isMobile || isLightTheme} />
      <AlertCenter alerts={alertQueue} />
      <OnboardingModal
        open={showOnboarding}
        availableHouseholds={dashboard.profile.available_households}
        initialProfile={profile}
        onClose={() => setShowOnboarding(false)}
        onSave={handleSaveProfile}
      />

      <header className="sticky top-0 z-50 border-b app-header-shell">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigateToView("overview")}
            className="flex items-center gap-3 text-left text-white"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-tealglow/12 text-tealglow">
              <Bolt size={18} />
            </div>
            <div>
              <p className="font-display text-lg font-bold">Smart Energy Tracker</p>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                3D Consumption Intelligence
              </p>
            </div>
          </button>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="nav-pill"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          ) : (
            <div className="hidden items-center gap-4 xl:flex">
              <nav className="flex items-center gap-2">
                {VIEW_GROUPS.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => navigateToView(view.id)}
                    className={`nav-pill ${activeView === view.id ? "nav-pill-active" : ""}`}
                  >
                    {view.label}
                  </button>
                ))}
              </nav>

              <div className="theme-switch">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`theme-option ${theme === "light" ? "theme-option-active" : ""}`}
                >
                  {DAY_MODE_LABEL}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`theme-option ${theme === "dark" ? "theme-option-active" : ""}`}
                >
                  {NIGHT_MODE_LABEL}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled((current) => !current)}
                className="nav-pill"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          )}
        </div>

        {isMobile && menuOpen ? (
          <div className="border-t border-white/6 px-4 py-4 sm:px-6">
            <div className="grid gap-3">
              {VIEW_GROUPS.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => navigateToView(view.id)}
                  className={`nav-pill w-full justify-start ${
                    activeView === view.id ? "nav-pill-active" : ""
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="theme-switch w-full justify-between">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`theme-option flex-1 ${theme === "light" ? "theme-option-active" : ""}`}
                >
                  {DAY_MODE_LABEL}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`theme-option flex-1 ${theme === "dark" ? "theme-option-active" : ""}`}
                >
                  {NIGHT_MODE_LABEL}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled((current) => !current)}
                className="nav-pill w-full justify-center"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {error ? (
        <div className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        </div>
      ) : null}

      <main>{renderCurrentView()}</main>

      <FloatingAssistant
        insights={dashboard.insights}
        notifications={dashboard.notifications}
        pulse={dashboard.pulse}
      />

      <footer className="border-t app-footer-shell">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            FastAPI + React + Three.js smart home dashboard for energy-conscious households.
          </p>
          <div className="inline-flex items-center gap-2 text-tealglow">
            <Leaf size={16} />
            <span>
              Current view: {currentViewMeta.label} with {isLightTheme ? "day" : "night"} mode enabled
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
