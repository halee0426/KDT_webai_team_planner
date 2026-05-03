// src/components/ai/AIChatModal.tsx
// 풀스크린 AI 자연어 입력 채팅 모달.
// FAB → open=true → slide-up 등장. 메시지 히스토리는 내부 state.
//
// onSubmit: 사용자 텍스트 → AI 응답 + 일정 후보 반환
// onSaveEvents: "그대로 저장" 시 호출 → 부모에서 store에 반영

import { useEffect, useRef, useState } from "react";
import { X, MoreHorizontal, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { LogoMark } from "@/components/Logo";
import { SPRING, EASE, DURATION } from "@/styles/animations";

export type AIEvent = {
  id: string;
  date: string;          // YYYY-MM-DD
  title: string;
  startTime?: string;    // HH:MM
  endTime?: string;
  color: string;         // hex
};

export type Message =
  | { role: "ai"; text: string; events?: AIEvent[]; pending?: boolean }
  | { role: "user"; text: string };

const SUGGESTS: { icon: string; label: string }[] = [
  { icon: "🏖", label: "제주 3박 4일" },
  { icon: "🏃", label: "이번 주 운동 3회" },
  { icon: "📚", label: "토익 900점" },
  { icon: "🎯", label: "새해 목표 분해" },
];

export function AIChatModal({
  open,
  onClose,
  onSubmit,
  onSaveEvents,
  accent = "#0066cc",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<{ reply: string; events?: AIEvent[] }>;
  onSaveEvents: (events: AIEvent[]) => void;
  accent?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "안녕하세요, 하루온봇이에요!\n어떠한 일정을 만들어볼까요?",
    },
  ]);
  const [input, setInput] = useState("");
  const [editPlaceholder, setEditPlaceholder] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // open 시 input focus (motion 진입 애니메이션 끝나는 시점)
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  // 새 메시지 시 스크롤 바닥
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // textarea 자동 높이 (1~5줄 / max 120px)
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const showSuggests = messages.length === 1; // AI 인삿말만 있을 때

  const handleClose = () => {
    // motion AnimatePresence 가 exit 애니메이션 자동 처리
    onClose();
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setEditPlaceholder(false);
    const userMsg: Message = { role: "user", text };
    const pending: Message = { role: "ai", text: "", pending: true };
    setMessages((m) => [...m, userMsg, pending]);

    try {
      const { reply, events } = await onSubmit(text);
      setMessages((m) => {
        const next = m.slice(0, -1);
        next.push({ role: "ai", text: reply, events });
        return next;
      });
    } catch {
      setMessages((m) => {
        const next = m.slice(0, -1);
        next.push({ role: "ai", text: "잠깐 문제가 생겼어요. 다시 한 번 시도해 주세요." });
        return next;
      });
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const removeEventFromMsg = (msgIdx: number, evId: string) => {
    setMessages((m) =>
      m.map((msg, i) =>
        i === msgIdx && msg.role === "ai" && msg.events
          ? { ...msg, events: msg.events.filter((e) => e.id !== evId) }
          : msg,
      ),
    );
  };

  const editEventField = (msgIdx: number, evId: string, field: keyof AIEvent, value: string) => {
    setMessages((m) =>
      m.map((msg, i) =>
        i === msgIdx && msg.role === "ai" && msg.events
          ? { ...msg, events: msg.events.map((e) => (e.id === evId ? { ...e, [field]: value } : e)) }
          : msg,
      ),
    );
  };

  const saveEvents = (evs: AIEvent[]) => {
    onSaveEvents(evs);
    setToast("일정이 추가됐어요");
    setTimeout(() => {
      setToast(null);
      handleClose();
    }, 900);
  };

  const requestEdit = () => {
    setEditPlaceholder(true);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
    {open && (
    <motion.div
      key="aichat-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.base / 1000, ease: EASE.apple }}
      className="absolute inset-0 z-[80]"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={SPRING.sheet}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          top: 120,
          bottom: 80,
          background: "var(--bg-canvas)",
          borderRadius: 28,
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transformOrigin: "50% 100%",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            height: 56,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px 0 8px",
            borderBottom: "0.5px solid var(--hairline)",
          }}
        >
          <button
            onClick={handleClose}
            aria-label="닫기"
            style={{
              width: 40, height: 40, borderRadius: 12,
              display: "grid", placeItems: "center",
              background: "transparent", border: 0, cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            <X size={20} strokeWidth={1.8} />
          </button>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px" }}>
            하루온봇
          </div>
          <button
            aria-label="더보기"
            style={{
              width: 40, height: 40, borderRadius: 12,
              display: "grid", placeItems: "center",
              background: "transparent", border: 0, cursor: "pointer",
              color: "var(--text-secondary)",
            }}
            onClick={() => {
              if (confirm("대화를 초기화할까요?")) {
                setMessages([
                  { role: "ai", text: "안녕하세요, 하루온봇이에요!\n어떠한 일정을 만들어볼까요?" },
                ]);
              }
            }}
          >
            <MoreHorizontal size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* 메시지 영역 */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 16px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg, idx) => (
            <MessageRow
              key={idx}
              msg={msg}
              accent={accent}
              onRemoveEvent={(evId) => removeEventFromMsg(idx, evId)}
              onEditEvent={(evId, field, value) => editEventField(idx, evId, field, value)}
              onSave={(evs) => saveEvents(evs)}
              onRequestEdit={requestEdit}
              isLast={idx === messages.length - 1}
            />
          ))}
        </div>

        {/* 빠른 제안 칩 */}
        {showSuggests && (
          <div
            style={{
              flexShrink: 0,
              padding: "0 16px 12px",
              display: "flex",
              gap: 8,
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {SUGGESTS.map((s) => (
              <button
                key={s.label}
                onClick={() => setInput(s.label)}
                style={{
                  flexShrink: 0,
                  height: 28,
                  padding: "0 14px",
                  borderRadius: 999,
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  letterSpacing: "-0.2px",
                }}
              >
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* 입력 영역 */}
        <div
          style={{
            flexShrink: 0,
            background: "var(--bg-elevated)",
            borderTop: "0.5px solid var(--hairline)",
            padding: "12px 12px",
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
          }}
        >
          <div
            style={{
              background: "var(--bg-tertiary)",
              borderRadius: 24,
              padding: "6px 6px 6px 16px",
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder={editPlaceholder ? "어떻게 수정할까요?" : "메시지를 입력하세요..."}
              style={{
                flex: 1,
                background: "transparent",
                border: 0,
                outline: 0,
                resize: "none",
                fontFamily: "inherit",
                fontSize: 15,
                lineHeight: 1.4,
                color: "var(--text-primary)",
                padding: "8px 0",
                maxHeight: 120,
                letterSpacing: "-0.24px",
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              aria-label="보내기"
              style={{
                flexShrink: 0,
                width: 40, height: 40, borderRadius: 999,
                background: input.trim() ? accent : "var(--hairline)",
                color: "#fff",
                border: 0, cursor: input.trim() ? "pointer" : "not-allowed",
                display: "grid", placeItems: "center",
                transition: "background 0.15s",
              }}
            >
              <ArrowUp size={20} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* 토스트 */}
        {toast && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 100,
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.85)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              padding: "10px 16px",
              borderRadius: 999,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            ✓ {toast}
          </div>
        )}
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
  );
}

function MessageRow({
  msg, accent, onRemoveEvent, onEditEvent, onSave, onRequestEdit, isLast,
}: {
  msg: Message;
  accent: string;
  onRemoveEvent: (evId: string) => void;
  onEditEvent: (evId: string, field: keyof AIEvent, value: string) => void;
  onSave: (evs: AIEvent[]) => void;
  onRequestEdit: () => void;
  isLast: boolean;
}) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: "78%",
            padding: "10px 14px",
            borderRadius: 18,
            borderTopRightRadius: 4,
            background: accent,
            color: "#fff",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.45,
            letterSpacing: "-0.24px",
            whiteSpace: "pre-line",
            boxShadow: `0 2px 8px ${accent}33`,
          }}
        >
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div
        style={{
          flexShrink: 0,
          width: 30, height: 30, borderRadius: 9,
          overflow: "hidden",
          display: "grid", placeItems: "center",
          marginTop: 2,
        }}
      >
        <LogoMark size={30} accent={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {msg.pending ? (
          <Bubble><TypingDots />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
              AI가 일정을 짜는 중...
            </div>
          </Bubble>
        ) : (
          <Bubble>
            <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>
          </Bubble>
        )}

        {msg.events && msg.events.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "fadeIn 0.4s ease-out" }}>
            {msg.events.map((ev) => (
              <EventCard key={ev.id} ev={ev}
                onRemove={() => onRemoveEvent(ev.id)}
                onEdit={(field, value) => onEditEvent(ev.id, field, value)}
              />
            ))}
            {isLast && (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  onClick={onRequestEdit}
                  style={{
                    flex: 1, height: 40, borderRadius: 999,
                    background: "transparent",
                    color: "var(--text-primary)",
                    border: "0.5px solid var(--hairline)",
                    fontSize: 14, fontWeight: 500, cursor: "pointer",
                    letterSpacing: "-0.2px",
                  }}
                >
                  수정 요청
                </button>
                <button
                  onClick={() => onSave(msg.events!)}
                  style={{
                    flex: 1, height: 40, borderRadius: 999,
                    background: accent,
                    color: "#fff",
                    border: 0,
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    letterSpacing: "-0.2px",
                    boxShadow: `0 4px 12px ${accent}40`,
                  }}
                >
                  그대로 저장
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
      `}</style>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-tertiary)",
        color: "var(--text-primary)",
        padding: "12px 16px",
        borderRadius: 18,
        borderTopLeftRadius: 4,
        fontSize: 14,
        lineHeight: 1.45,
        letterSpacing: "-0.24px",
        maxWidth: "100%",
      }}
    >
      {children}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: 18 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 999,
            background: "var(--text-secondary)",
            display: "inline-block",
            animation: `typingBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function EventCard({
  ev, onRemove, onEdit,
}: {
  ev: AIEvent;
  onRemove: () => void;
  onEdit: (field: keyof AIEvent, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "0.5px solid var(--hairline)",
        borderRadius: 14,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div
        style={{
          width: 8, height: 8, borderRadius: 999, flexShrink: 0,
          background: ev.color,
          boxShadow: `0 0 0 3px ${ev.color}22`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, letterSpacing: "-0.1px" }}>
          {ev.date}{ev.startTime ? ` · ${ev.startTime}${ev.endTime ? `–${ev.endTime}` : ""}` : ""}
        </div>
        {editing ? (
          <input
            autoFocus
            value={ev.title}
            onChange={(e) => onEdit("title", e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }}
            style={{
              width: "100%", fontSize: 14, fontWeight: 500,
              background: "transparent", border: 0, outline: 0,
              color: "var(--text-primary)", padding: "2px 0",
              letterSpacing: "-0.24px",
            }}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.24px", marginTop: 1, cursor: "text" }}
          >
            {ev.title}
          </div>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        aria-label="편집"
        style={{
          width: 28, height: 28, borderRadius: 8,
          background: "transparent", border: 0, cursor: "pointer",
          color: "var(--text-secondary)",
          display: "grid", placeItems: "center",
        }}
      >
        <Pencil size={14} strokeWidth={1.8} />
      </button>
      <button
        onClick={onRemove}
        aria-label="삭제"
        style={{
          width: 28, height: 28, borderRadius: 8,
          background: "transparent", border: 0, cursor: "pointer",
          color: "var(--text-muted)",
          display: "grid", placeItems: "center",
        }}
      >
        <Trash2 size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}
