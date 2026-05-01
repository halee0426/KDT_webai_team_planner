import { X, ChevronRight } from "lucide-react";
import { accents, AccentKey } from "./tokens";

type Theme = "light" | "dark" | "system";

export function Settings({
  open,
  onClose,
  theme,
  setTheme,
  accentKey,
  setAccentKey,
  aiOn,
  setAiOn,
}: {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  accentKey: AccentKey;
  setAccentKey: (a: AccentKey) => void;
  aiOn: boolean;
  setAiOn: (v: boolean) => void;
}) {
  const accent = accents[accentKey] ?? accents.mint;
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[60] flex">
      <div
        className="flex-1 backdrop-fade"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.3)" }}
      />
      <div
        className="w-[320px] flex flex-col panel-slide-right"
        style={{ background: "var(--bg-elevated)", borderLeft: "0.5px solid var(--hairline)" }}
      >
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <div style={{ fontSize: 22, fontWeight: 700 }}>설정</div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <Section label="외관">
            <div className="flex p-1 rounded-full" style={{ background: "var(--bg-tertiary)" }}>
              {(["light", "dark", "system"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="flex-1 py-1.5 rounded-full"
                  style={{
                    background: theme === t ? "var(--bg-elevated)" : "transparent",
                    fontSize: 13,
                    fontWeight: theme === t ? 600 : 400,
                    boxShadow: theme === t ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {t === "light" ? "Light" : t === "dark" ? "Dark" : "시스템 자동"}
                </button>
              ))}
            </div>
          </Section>

          <Section label="색상 테마">
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(accents) as AccentKey[]).map((k) => {
                const c = accents[k];
                const sel = k === accentKey;
                return (
                  <button
                    key={k}
                    onClick={() => setAccentKey(k)}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl active:scale-95"
                    style={{
                      background: sel ? `${c}1A` : "transparent",
                      border: sel ? `2px solid ${c}` : "0.5px solid var(--hairline)",
                    }}
                  >
                    <div className="w-7 h-7 rounded-full" style={{ background: c }} />
                    <span style={{ fontSize: 11, fontWeight: sel ? 600 : 400 }}>{k}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label="데이터">
            <Row label="내보내기 (JSON 파일)" />
            <Row label="가져오기" />
            <Row label="초기화" destructive />
          </Section>

          <Section label="AI">
            <div className="flex items-center justify-between py-3" style={{ borderBottom: "0.5px solid var(--hairline)" }}>
              <span style={{ fontSize: 15 }}>AI 일정 분해 사용</span>
              <button
                onClick={() => setAiOn(!aiOn)}
                className="w-12 h-7 rounded-full relative transition-colors"
                style={{ background: aiOn ? accent : "var(--bg-tertiary)" }}
              >
                <div
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all"
                  style={{ left: aiOn ? 22 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                />
              </button>
            </div>
            <Row label="API 키 설정" />
          </Section>
        </div>

        <div className="text-center pb-6" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          v1.0.0
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div
        className="mb-2 text-[var(--text-muted)] uppercase"
        style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.5px" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ label, destructive }: { label: string; destructive?: boolean }) {
  return (
    <button
      className="w-full flex items-center justify-between py-3 active:opacity-60"
      style={{ borderBottom: "0.5px solid var(--hairline)" }}
    >
      <span style={{ fontSize: 15, color: destructive ? "#FF3B30" : "var(--text-primary)" }}>{label}</span>
      {!destructive && <ChevronRight size={16} className="text-[var(--text-muted)]" />}
    </button>
  );
}
