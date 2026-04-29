// 자연어 입력 모달 — FAB로 진입

import { useState } from 'react';
import { useAIStore } from '@/store/aiStore';
import { useEventStore } from '@/store/eventStore';

const QUICK_CHIPS = ['여행 계획', '운동 루틴', '공부 계획', '회의 일정'];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AIInputSheet({ open, onClose }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { parseEvent } = useAIStore();
  const { addEvent } = useEventStore();

  if (!open) return null;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null);
    try {
      const result = await parseEvent(text);
      result.events.forEach((e) =>
        addEvent({
          date: e.date,
          title: e.title,
          color: e.color || '#0066cc',
          startTime: e.startTime,
          endTime: e.endTime,
          createdBy: 'ai',
        }),
      );
      setText('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 호출 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-[var(--bg-elev)] p-6 shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong sm:hidden" />
        <h3 className="mb-4 text-lg font-bold tracking-apple">✨ 무엇을 계획해볼까요?</h3>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'예: 다음 주 제주 3박 4일 가족 여행, 첫날 한라산'}
          className="mb-3 h-24 w-full resize-none rounded-lg border border-line-strong bg-[var(--bg-secondary)] p-3 text-sm outline-none focus:border-[color:var(--accent)]"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setText((t) => (t ? `${t} ${chip}` : chip))}
              className="rounded-pill bg-[var(--bg-tertiary)] px-3 py-1 text-xs text-ink-soft hover:bg-[var(--accent-soft)] hover:text-[color:var(--accent)]"
            >
              {chip}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-pill bg-[var(--bg-tertiary)] py-3 text-sm font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="flex-1 rounded-pill bg-[color:var(--accent)] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? '✨ AI가 생각 중…' : '✨ AI에게 부탁하기'}
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-ink-mute">
          AI 결과는 미리보기 후 저장됩니다.
        </p>
      </div>
    </div>
  );
}
