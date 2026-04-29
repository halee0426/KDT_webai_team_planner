// 플로팅 액션 버튼 — AI 자연어 입력 진입점 (✨)

type Props = { onClick?: () => void };

export default function FAB({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="AI 입력"
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--accent)] text-2xl text-white shadow-lg transition hover:scale-105 active:scale-95"
      style={{
        boxShadow: '0 6px 20px rgba(0,102,204,0.4)',
      }}
    >
      ✨
    </button>
  );
}
