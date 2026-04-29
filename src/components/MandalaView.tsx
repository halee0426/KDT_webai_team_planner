import { useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";

export function MandalaView({ accent, planKind = "my" }: { accent: string; planKind?: "my" | "shared" }) {
  const [cells, setCells] = useState<string[]>(() => {
    const arr = Array(81).fill("");
    arr[40] = planKind === "shared" ? "팀 목표" : "올해 목표";
    return arr;
  });

  const update = (i: number, v: string) => {
    setCells((c) => {
      const next = [...c];
      next[i] = v;
      // mirror tier 2/3
      const mirror = mirrorIndex(i);
      if (mirror !== null) next[mirror] = v;
      return next;
    });
  };

  const reset = () => {
    const arr = Array(81).fill("");
    arr[40] = "올해 목표";
    setCells(arr);
  };

  const aiFill = () => {
    setCells((c) => {
      const next = [...c];
      const subs = ["건강", "커리어", "관계", "재정", "학습", "취미", "여행", "마음"];
      // 8 sub-goal centers
      const subCenters = [10, 13, 16, 37, 43, 64, 67, 70];
      subCenters.forEach((idx, k) => {
        if (!next[idx]) {
          next[idx] = subs[k];
          const m = mirrorIndex(idx);
          if (m !== null) next[m] = subs[k];
        }
      });
      return next;
    });
  };

  return (
    <div className="px-4 pt-4 pb-32">
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" }}>만다라트</div>
          <div style={{ fontSize: 13 }} className="text-[var(--text-secondary)] mt-1">
            중앙 핵심 목표 → 8개 세부 목표 → 각 실행 계획
          </div>
        </div>
        <button onClick={reset} className="flex items-center gap-1" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          <RotateCcw size={14} /> 초기화
        </button>
      </div>

      <button
        onClick={aiFill}
        className="mt-3 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"
        style={{ background: "var(--bg-tertiary)", fontSize: 13 }}
      >
        <Sparkles size={14} style={{ color: accent }} /> AI에게 분해 부탁
      </button>

      <div className="mt-4 grid grid-cols-9 gap-[1px]" style={{ background: "var(--separator)" }}>
        {cells.map((v, i) => {
          const tier = getTier(i);
          let bg = "var(--bg-elevated)";
          let color = "var(--text-primary)";
          let fw: number = 400;
          if (tier === 1) {
            bg = accent;
            color = "#fff";
            fw = 700;
          } else if (tier === 2) {
            bg = `${accent}1A`;
            color = accent;
            fw = 700;
          } else if (tier === 3) {
            bg = "var(--bg-tertiary)";
            fw = 400;
          }
          const blockBorder = isBlockEdge(i);
          return (
            <input
              key={i}
              value={v}
              onChange={(e) => update(i, e.target.value)}
              className="text-center outline-none"
              style={{
                background: bg,
                color,
                fontSize: 9,
                fontWeight: fw,
                aspectRatio: "1",
                padding: 1,
                ...blockBorder,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function getTier(i: number): 1 | 2 | 3 | 4 {
  if (i === 40) return 1;
  // 8 sub-goal centers (center of each 3x3 block, excluding the central block)
  const subCenters = [10, 13, 16, 37, 43, 64, 67, 70];
  if (subCenters.includes(i)) return 2;
  // outer cells of central 3x3 block
  const centralOuter = [30, 31, 32, 39, 41, 48, 49, 50];
  if (centralOuter.includes(i)) return 3;
  return 4;
}

function mirrorIndex(i: number): number | null {
  // central block outer cells mirror sub-goal centers
  const map: Record<number, number> = {
    30: 10, 31: 13, 32: 16,
    39: 37, 41: 43,
    48: 64, 49: 67, 50: 70,
    10: 30, 13: 31, 16: 32,
    37: 39, 43: 41,
    64: 48, 67: 49, 70: 50,
  };
  return map[i] ?? null;
}

function isBlockEdge(i: number) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const style: any = {};
  if (r % 3 === 0) style.borderTop = "0.5px solid var(--accent-line)";
  if (c % 3 === 0) style.borderLeft = "0.5px solid var(--accent-line)";
  return style;
}
