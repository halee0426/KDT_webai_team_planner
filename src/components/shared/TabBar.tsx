// 하단 탭바 — 4개 메인 + 더보기

import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const PRIMARY = [
  { to: '/day',     label: '오늘',  icon: '🌞' },
  { to: '/month',   label: '캘린더', icon: '🗓' },
  { to: '/year',    label: '연력',  icon: '📅' },
  { to: '/mandala', label: '목표',  icon: '🎯' },
] as const;

const MORE = [
  { to: '/week',     label: '주력',  icon: '📆' },
  { to: '/tenmin',   label: '10분',  icon: '⏱' },
  { to: '/diary',    label: '일기',  icon: '📓' },
  { to: '/settings', label: '설정',  icon: '⚙️' },
] as const;

export default function TabBar() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-[var(--bg-glass)] pb-safe backdrop-blur-xl">
        {PRIMARY.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive ? 'text-[color:var(--accent)]' : 'text-ink-mute'
              }`
            }
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
            moreOpen ? 'text-[color:var(--accent)]' : 'text-ink-mute'
          }`}
        >
          <span className="text-base">⋯</span>
          <span>더보기</span>
        </button>
      </nav>

      {moreOpen && (
        <div onClick={() => setMoreOpen(false)} className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-16 mx-2 rounded-2xl bg-[var(--bg-elev)] p-4 shadow-2xl">
            <div className="grid grid-cols-3 gap-3">
              {MORE.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1 rounded-xl bg-[var(--bg-tertiary)] p-4 text-sm hover:bg-[var(--accent-soft)]"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="font-medium">{t.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
