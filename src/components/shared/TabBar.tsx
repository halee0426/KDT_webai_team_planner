// 하단 탭바 (모바일) — 6개 뷰 전환
// 담당: B

import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/year',    label: '연력' },
  { to: '/month',   label: '달력' },
  { to: '/week',    label: '주력' },
  { to: '/day',     label: '오늘' },
  { to: '/tenmin',  label: '10분' },
  { to: '/mandala', label: '목표' },
  { to: '/diary',   label: '일기' },
] as const;

export default function TabBar() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0',
      background: 'var(--bg-elev, #fff)',
      borderTop: '1px solid var(--line, rgba(0,0,0,0.08))',
    }}>
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent, #0066cc)' : 'var(--ink-soft, #666)',
            fontSize: 12,
            textDecoration: 'none',
          })}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
