import { ReactNode } from "react";
import { User, Users } from "lucide-react";
import { LogoMark } from "./Logo";

export function PlanSelect({
  accent,
  onSelect,
}: {
  accent: string;
  onSelect: (kind: "my" | "shared") => void;
}) {
  return (
    <div className="absolute inset-0 z-[70] flex flex-col" style={{ background: "var(--bg-canvas)" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-[760px] flex flex-col items-center">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-3">
              <LogoMark size={56} accent={accent} rounded={14} />
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.6px" }}>하루온 시작하기</div>
            <div
              style={{ fontSize: 18, letterSpacing: "-0.34px" }}
              className="text-[var(--text-secondary)] mt-2"
            >
              어떤 플랜을 사용할까요?
            </div>
          </div>

          <div className="w-full flex justify-center">
            <div className="grid w-full max-w-[640px] grid-cols-1 gap-4 md:grid-cols-2">
              <PlanCard
                accent={accent}
                icon={<User size={30} strokeWidth={1.5} />}
                label="나의 플랜"
                sub="개인 일정 관리"
                onClick={() => onSelect("my")}
              />
              <PlanCard
                accent={accent}
                icon={<Users size={30} strokeWidth={1.5} />}
                label="공동 플랜"
                sub="함께 만드는 일정"
                onClick={() => onSelect("shared")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  accent,
  icon,
  label,
  sub,
  onClick,
}: {
  accent: string;
  icon: ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-[280px] rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-[0.97] transition-transform"
      style={{
        background: "var(--bg-elevated)",
        border: "0.5px solid var(--hairline)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: `${accent}1A`, color: accent }}
      >
        {icon}
      </div>
      <div className="text-center">
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.44px" }}>{label}</div>
        <div style={{ fontSize: 14, letterSpacing: "-0.2px" }} className="text-[var(--text-muted)] mt-2.5">
          {sub}
        </div>
      </div>
    </button>
  );
}
