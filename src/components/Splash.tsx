import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

export function Splash({ onDone, accent = "#0066cc" }: { onDone: () => void; accent?: string }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1400);
    const t2 = setTimeout(onDone, 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center transition-opacity duration-500"
      style={{ background: "#000", opacity: phase === "out" ? 0 : 1 }}
    >
      <div
        className="flex flex-col items-center gap-3 transition-all duration-700"
        style={{
          transform: phase === "in" ? "scale(1)" : "scale(1.05)",
          opacity: phase === "in" ? 1 : 0,
        }}
      >
        <div className="flex items-center justify-center" style={{ filter: `drop-shadow(0 12px 30px ${accent}66)` }}>
          <LogoMark size={84} accent={accent} rounded={22} />
        </div>
        <div style={{ color: "#fff", fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px" }}>
          하루온
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: "-0.224px" }}>
          켜지는 하루, 채워지는 시간
        </div>
      </div>
    </div>
  );
}
