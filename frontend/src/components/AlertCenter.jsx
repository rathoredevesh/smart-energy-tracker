import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

function alertStyles(level) {
  if (level === "critical") {
    return {
      Icon: AlertTriangle,
      className: "status-critical",
    };
  }
  if (level === "warning") {
    return {
      Icon: AlertTriangle,
      className: "status-warning",
    };
  }
  if (level === "good") {
    return {
      Icon: CheckCircle2,
      className: "status-success",
    };
  }
  return {
    Icon: Info,
    className: "status-info",
  };
}

export default function AlertCenter({ alerts }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!alerts?.length) {
      return undefined;
    }

    const enriched = alerts.map((alert, index) => ({
      ...alert,
      id: `${alert.title}-${index}-${Date.now()}`,
    }));
    setItems(enriched);

    const timer = window.setTimeout(() => {
      setItems((current) => current.slice(0, 1));
    }, 9000);

    return () => window.clearTimeout(timer);
  }, [alerts]);

  if (!items.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-full max-w-sm flex-col gap-3">
      {items.map((item) => {
        const { Icon, className } = alertStyles(item.level);
        return (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-[22px] border px-4 py-4 shadow-2xl backdrop-blur-2xl ${className}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-white/10 p-2">
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm opacity-90">{item.body}</p>
              </div>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((alert) => alert.id !== item.id))}
                className="rounded-full p-1 text-current/80 transition hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
