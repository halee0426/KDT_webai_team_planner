// 일기 — 날짜별 텍스트 + 무드 선택

import { useState, useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';
import { todayStr } from '@/lib/utils/date';
import type { Diary } from '@/types/event';

const MOODS: { value: Diary['mood']; label: string }[] = [
  { value: '😊', label: '좋음' },
  { value: '😐', label: '보통' },
  { value: '😢', label: '안 좋음' },
];

export default function DiaryView() {
  const { diaries, setDiary } = useEventStore();
  const [date, setDate] = useState(todayStr());
  const [text, setText] = useState('');
  const [mood, setMood] = useState<Diary['mood']>(undefined);

  useEffect(() => {
    const d = diaries[date];
    setText(d?.text || '');
    setMood(d?.mood);
  }, [date, diaries]);

  // 자동 저장 (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim() || mood) setDiary(date, text, mood);
    }, 600);
    return () => clearTimeout(timer);
  }, [text, mood, date, setDiary]);

  const recentDates = Object.keys(diaries)
    .filter((d) => diaries[d].text)
    .sort()
    .reverse()
    .slice(0, 14);

  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--bg-secondary)] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-[var(--bg-glass)] px-4 py-3 backdrop-blur-xl">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-line-strong bg-[var(--bg-tertiary)] px-2 py-1 text-sm"
        />
        <span className="ml-auto text-xs text-ink-mute">{Object.keys(diaries).length}개의 일기</span>
      </div>

      {/* 무드 */}
      <div className="flex gap-2 border-b border-line bg-[var(--bg-elev)] px-4 py-3">
        <span className="text-xs text-ink-soft">오늘 기분</span>
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(mood === m.value ? undefined : m.value)}
            className={`text-xl transition ${mood === m.value ? 'scale-125' : 'opacity-40 hover:opacity-100'}`}
            title={m.label}
          >
            {m.value}
          </button>
        ))}
      </div>

      {/* 본문 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="오늘 어떤 하루였나요?"
        className="flex-1 resize-none bg-[var(--bg-elev)] p-6 text-base leading-relaxed outline-none"
        style={{ lineHeight: 1.7 }}
      />

      {/* 최근 일기 */}
      {recentDates.length > 0 && (
        <div className="border-t border-line bg-[var(--bg-tertiary)] px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">최근</div>
          <div className="flex gap-2 overflow-x-auto">
            {recentDates.map((d) => (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${d === date ? 'bg-[color:var(--accent)] text-white' : 'bg-[var(--bg-elev)]'}`}
              >
                {diaries[d].mood} {d.slice(5).replace('-', '/')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
