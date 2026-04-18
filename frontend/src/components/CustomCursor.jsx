import { useEffect, useState } from "react";

export default function CustomCursor({ disabled = false }) {
  const [cursor, setCursor] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState(
    Array.from({ length: 10 }, () => ({ x: -100, y: -100 })),
  );

  useEffect(() => {
    if (disabled) {
      return undefined;
    }

    let animationFrame = null;
    const pointer = { x: -100, y: -100 };

    function handleMove(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }

    function tick() {
      setCursor({ x: pointer.x, y: pointer.y });
      setTrail((current) => {
        const next = [...current];
        next[0] = { x: pointer.x, y: pointer.y };
        for (let index = 1; index < next.length; index += 1) {
          next[index] = {
            x: next[index].x + (next[index - 1].x - next[index].x) * 0.25,
            y: next[index].y + (next[index - 1].y - next[index].y) * 0.25,
          };
        }
        return next;
      });
      animationFrame = window.requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", handleMove);
    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [disabled]);

  if (disabled) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] hidden lg:block">
      {trail.map((item, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-tealglow/20"
          style={{
            left: item.x,
            top: item.y,
            width: `${12 - index * 0.8}px`,
            height: `${12 - index * 0.8}px`,
            transform: "translate(-50%, -50%)",
            filter: "blur(1px)",
            opacity: 0.65 - index * 0.05,
          }}
        />
      ))}
      <div
        className="absolute h-4 w-4 rounded-full border border-tealglow/80 bg-tealglow/15 shadow-[0_0_24px_rgba(0,245,197,0.5)]"
        style={{
          left: cursor.x,
          top: cursor.y,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

