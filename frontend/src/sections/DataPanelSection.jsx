import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  CalendarDays,
  FileSpreadsheet,
  Mic,
  MicOff,
  QrCode,
  Upload,
  UserRound,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";
import { parseVoiceTranscript } from "../lib/appliances";

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function DataPanelSection({
  rooms,
  recentLogs,
  onSubmitLog,
  onUploadBill,
  exportUrl,
  busy,
  feedback,
  activeHousehold,
  availableHouseholds,
  onHouseholdChange,
}) {
  const [formData, setFormData] = useState({
    room: rooms[0]?.id ?? "bedroom",
    appliance_name: "",
    watts: "",
    hours_per_day: "",
    usage_date: todayValue(),
  });
  const [file, setFile] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [qrCode, setQrCode] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (rooms.length > 0) {
      setFormData((current) => ({
        ...current,
        room: current.room || rooms[0].id,
      }));
    }
  }, [rooms]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(Boolean(Recognition));
    if (!Recognition) {
      return undefined;
    }

    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setVoiceStatus("Listening for appliance, watts, and hours...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const parsed = parseVoiceTranscript(transcript, rooms);
      setFormData((current) => ({
        ...current,
        ...parsed,
      }));
      setVoiceStatus(`Parsed: "${transcript}"`);
    };

    recognition.onerror = () => {
      setVoiceStatus("Voice input could not be processed. Try again in a quieter moment.");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, [rooms]);

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}#usage`;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 180,
      color: {
        dark: "#dffcf6",
        light: "#091321",
      },
    })
      .then(setQrCode)
      .catch(() => setQrCode(""));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmitLog({
      ...formData,
      watts: Number(formData.watts),
      hours_per_day: Number(formData.hours_per_day),
    });
    setFormData((current) => ({
      ...current,
      appliance_name: "",
      watts: "",
      hours_per_day: "",
    }));
  }

  async function handleFileUpload() {
    if (!file) {
      return;
    }
    await onUploadBill(file);
    setFile(null);
  }

  function toggleVoiceCapture() {
    if (!recognitionRef.current) {
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    recognitionRef.current.start();
  }

  return (
    <section id="data-panel" className="section-divider">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Data Entry Panel"
          title="Log appliances manually, by voice, or through a cleaner bill upload workspace"
          description="Track real appliance usage, backfill historical days, parse `.xlsx` bills with Pandas on the backend, and keep the logging workflow focused instead of crowding it into one oversized screen."
        />

        <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
          <GlassCard className="p-6" data-reveal>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="text-xl font-semibold text-white">Manual Usage Log</h3>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Create appliance entries with room, wattage, runtime, household profile,
                  and historical dates.
                </p>
              </div>
              <CalendarDays className="text-tealglow" size={20} />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-left text-sm text-slate-300">
                  <span>Household Profile</span>
                  <div className="relative">
                    <UserRound
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <select
                      value={activeHousehold}
                      onChange={(event) => onHouseholdChange(event.target.value)}
                      className="theme-input w-full pl-12"
                    >
                      {availableHouseholds.map((household) => (
                        <option key={household} value={household}>
                          {household}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="space-y-2 text-left text-sm text-slate-300">
                  <span>Date</span>
                  <input
                    type="date"
                    value={formData.usage_date}
                    onChange={(event) =>
                      setFormData({ ...formData, usage_date: event.target.value })
                    }
                    className="theme-input w-full"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <label className="space-y-2 text-left text-sm text-slate-300">
                  <span>Appliance Name</span>
                  <input
                    type="text"
                    required
                    value={formData.appliance_name}
                    onChange={(event) =>
                      setFormData({ ...formData, appliance_name: event.target.value })
                    }
                    placeholder="AC, Refrigerator, Gaming Console"
                    className="theme-input w-full"
                  />
                </label>

                <div className="space-y-2 text-left text-sm text-slate-300">
                  <span>Voice Input</span>
                  <button
                    type="button"
                    onClick={toggleVoiceCapture}
                    disabled={!voiceSupported}
                    className={`inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition ${
                      listening
                        ? "border-tealglow/30 bg-tealglow/10 text-tealglow"
                        : "border-white/10 bg-white/5 text-white"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {listening ? <MicOff size={16} /> : <Mic size={16} />}
                    {listening ? "Stop" : "Speak"}
                  </button>
                </div>
              </div>

              {voiceStatus ? (
                <div className="rounded-2xl border border-electric/20 bg-electric/10 px-4 py-3 text-sm text-cyan-100">
                  {voiceStatus}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-left text-sm text-slate-300">
                  <span>Room</span>
                  <select
                    value={formData.room}
                    onChange={(event) => setFormData({ ...formData, room: event.target.value })}
                    className="theme-input w-full"
                  >
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-left text-sm text-slate-300">
                  <span>Watts</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    required
                    value={formData.watts}
                    onChange={(event) => setFormData({ ...formData, watts: event.target.value })}
                    placeholder="1500"
                    className="theme-input w-full"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-left text-sm text-slate-300">
                  <span>Hours Used / Day</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={formData.hours_per_day}
                    onChange={(event) =>
                      setFormData({ ...formData, hours_per_day: event.target.value })
                    }
                    placeholder="4.5"
                    className="theme-input w-full"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center rounded-full bg-tealglow px-5 py-3 text-sm font-semibold text-slate-950 transition hover:translate-y-[-2px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Saving..." : "Save Usage Entry"}
                  </button>
                </div>
              </div>
            </form>
          </GlassCard>

          <div className="space-y-6" data-reveal>
            <div className="grid gap-6 lg:grid-cols-2">
              <GlassCard className="p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="max-w-sm">
                    <h3 className="text-xl font-semibold text-white">Excel Bill Parser</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Upload `.xlsx` files with columns like room, appliance, watts, hours,
                      and date.
                    </p>
                  </div>
                  <FileSpreadsheet className="text-electric" size={20} />
                </div>

                <div className="space-y-4">
                  <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-5">
                    <span className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Upload size={16} />
                      Upload workbook
                    </span>
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-tealglow file:px-4 file:py-2 file:font-semibold file:text-slate-950"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={!file || busy}
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-electric/40 hover:bg-electric/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? "Processing..." : "Parse Workbook"}
                    </button>
                    <a
                      href={exportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-tealglow/20 bg-tealglow/10 px-5 py-3 text-sm font-semibold text-tealglow transition hover:bg-tealglow/15"
                    >
                      Export Excel Report
                    </a>
                  </div>

                  {feedback ? (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        feedback.type === "error"
                          ? "border-red-400/25 bg-red-500/10 text-red-100"
                          : "border-tealglow/20 bg-tealglow/10 text-tealglow"
                      }`}
                    >
                      {feedback.message}
                    </div>
                  ) : null}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="max-w-sm">
                    <h3 className="text-xl font-semibold text-white">Mobile Quick Handoff</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Scan once on another device to open the Usage workspace directly.
                    </p>
                  </div>
                  <QrCode className="text-tealglow" size={20} />
                </div>

                <div className="space-y-4">
                  <div className="mx-auto w-full max-w-[220px] rounded-[24px] border border-white/10 bg-slate-950/60 p-3">
                    {qrCode ? (
                      <img
                        src={qrCode}
                        alt="Quick upload QR code"
                        className="h-full w-full rounded-2xl"
                      />
                    ) : null}
                  </div>

                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                    <p className="text-sm leading-7 text-slate-300">
                      During local development, replace `localhost` with your machine&apos;s
                      LAN IP if you want your phone to reach this dashboard on the same Wi-Fi.
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-400">
                    <p>1. Keep this page open on desktop.</p>
                    <p>2. Scan the code on mobile.</p>
                    <p>3. Upload the workbook there and continue here.</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Recent Logs</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    The newest entries appear here after manual saves or workbook imports.
                  </p>
                </div>
              </div>

              {recentLogs.length ? (
                <>
                  <div className="hidden overflow-hidden rounded-[24px] border border-white/8 lg:block">
                    <div className="grid grid-cols-[1.35fr_0.9fr_0.65fr_0.65fr_0.65fr_0.7fr] gap-3 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      <span>Appliance</span>
                      <span>Room</span>
                      <span>Watts</span>
                      <span>Hours</span>
                      <span>kWh</span>
                      <span>Cost</span>
                    </div>
                    <div className="max-h-[560px] overflow-y-auto">
                      {recentLogs.map((log) => (
                        <div
                          key={log.id}
                          className="grid grid-cols-[1.35fr_0.9fr_0.65fr_0.65fr_0.65fr_0.7fr] gap-3 border-t border-white/6 px-4 py-4 text-sm text-slate-200"
                        >
                          <div>
                            <p className="font-medium text-white">{log.appliance_name}</p>
                            <p className="mt-1 text-xs text-slate-500">{log.usage_date}</p>
                          </div>
                          <p className="capitalize text-slate-300">{log.room.replace("_", " ")}</p>
                          <p>{log.watts}</p>
                          <p>{log.hours_per_day}</p>
                          <p>{log.kwh}</p>
                          <p>Rs {log.cost_inr}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 lg:hidden">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-white">{log.appliance_name}</p>
                            <p className="mt-1 text-sm capitalize text-slate-400">
                              {log.room.replace("_", " ")}
                            </p>
                          </div>
                          <p className="text-sm text-slate-500">{log.usage_date}</p>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500">Watts</p>
                            <p className="mt-1 text-white">{log.watts}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Hours</p>
                            <p className="mt-1 text-white">{log.hours_per_day}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Cost</p>
                            <p className="mt-1 text-white">Rs {log.cost_inr}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-5 text-sm text-slate-400">
                  No logs yet. Add a manual entry or parse a workbook to populate this list.
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
