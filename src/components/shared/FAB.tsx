// 플로팅 액션 버튼 — AI 자연어 입력 진입점
// 담당: B
export default function FAB({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', right: 20, bottom: 80,
        width: 56, height: 56, borderRadius: '50%',
        border: 'none', cursor: 'pointer',
        background: 'var(--accent, #0066cc)', color: '#fff',
        fontSize: 24, boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
      }}
    >
      ✨
    </button>
  );
}
