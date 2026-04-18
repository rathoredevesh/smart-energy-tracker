import {
  Flame,
  Gamepad2,
  Laptop,
  Lightbulb,
  MonitorPlay,
  Refrigerator,
  ShowerHead,
  Sparkles,
  Tv,
  Wind,
  WashingMachine,
} from "lucide-react";

const ROOM_NAMES = ["bedroom", "kitchen", "living room", "living_room", "bathroom"];

export function getApplianceVisual(applianceName = "") {
  const name = applianceName.toLowerCase();
  if (name.includes("ac")) {
    return { Icon: Wind, accent: "text-electric" };
  }
  if (name.includes("fan")) {
    return { Icon: Sparkles, accent: "text-tealglow" };
  }
  if (name.includes("lamp") || name.includes("light")) {
    return { Icon: Lightbulb, accent: "text-yellow-200" };
  }
  if (name.includes("tv") || name.includes("soundbar")) {
    return { Icon: Tv, accent: "text-electric" };
  }
  if (name.includes("console")) {
    return { Icon: Gamepad2, accent: "text-fuchsia-300" };
  }
  if (name.includes("laptop")) {
    return { Icon: Laptop, accent: "text-tealglow" };
  }
  if (name.includes("refrigerator") || name.includes("fridge")) {
    return { Icon: Refrigerator, accent: "text-cyan-200" };
  }
  if (name.includes("heater")) {
    return { Icon: Flame, accent: "text-orange-300" };
  }
  if (name.includes("washing")) {
    return { Icon: WashingMachine, accent: "text-cyan-300" };
  }
  if (name.includes("dishwasher")) {
    return { Icon: ShowerHead, accent: "text-blue-200" };
  }
  if (name.includes("microwave") || name.includes("cooktop") || name.includes("induction")) {
    return { Icon: Flame, accent: "text-yellow-300" };
  }
  return { Icon: MonitorPlay, accent: "text-slate-200" };
}

export function parseVoiceTranscript(transcript, rooms) {
  const lowered = transcript.toLowerCase();
  const parsed = {};
  const wattsMatch = lowered.match(/(\d+(?:\.\d+)?)\s*(?:watt|watts|w)\b/);
  const hoursMatch = lowered.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hrs|hr)\b/);
  const dateMatch = lowered.match(/\b(\d{4}-\d{2}-\d{2})\b/);

  if (wattsMatch) {
    parsed.watts = wattsMatch[1];
  }
  if (hoursMatch) {
    parsed.hours_per_day = hoursMatch[1];
  }
  if (dateMatch) {
    parsed.usage_date = dateMatch[1];
  }

  const matchedRoom = rooms.find((room) => lowered.includes(room.label.toLowerCase()) || lowered.includes(room.id));
  if (matchedRoom) {
    parsed.room = matchedRoom.id;
  } else {
    const fallbackRoom = ROOM_NAMES.find((roomName) => lowered.includes(roomName));
    if (fallbackRoom) {
      parsed.room = fallbackRoom.replace(" ", "_");
    }
  }

  let applianceText = lowered
    .replace(/(\d+(?:\.\d+)?)\s*(?:watt|watts|w)\b/g, "")
    .replace(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hrs|hr)\b/g, "")
    .replace(/\b(today|yesterday|tomorrow|log|record|add|for|room|date)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (dateMatch) {
    applianceText = applianceText.replace(dateMatch[1], "").trim();
  }
  if (matchedRoom) {
    applianceText = applianceText.replace(matchedRoom.label.toLowerCase(), "").trim();
  }

  if (applianceText) {
    parsed.appliance_name = applianceText
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return parsed;
}

