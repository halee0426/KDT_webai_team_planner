import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { highlights } from "./tokens";

type Block = { id: number; day: number; start: number; dur: number; title: string; c: string };

export function WeekView({ accent, planKind = "my" }: { accent: string; planKind?: "my" | "shared" }) {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const dates = [27, 28, 29, 30, 1, 2, 3];
  const today = 2;
  const hours = Array.from({ length: 19 }, (_, i) => i + 6);
  const HOUR = 60;
  const SLOT = HOUR / 2;

  // All selectable half-hour values from 6:00 to 24:00
  const halfHours = Array.from({ length: 37 }, (_, i) => 6 + i * 0.5);

  const [blocks, setBlocks] = useState<Block[]>(
    planKind === "shared"
      ? [
          { id: 1, day: 1, start: 11, dur: 2, title: "팀 워크숍", c: highlights[3].color },
          { id: 2, day: 2, start: 16, dur: 1, title: "기획 싱크", c: highlights[1].color },
          { id: 3, day: 3, start: 10, dur: 1, title: "스프린트 리뷰", c: highlights[5].color },
          { id: 4, day: 5, start: 14, dur: 3, title: "회식", c: highlights[0].color },
        ]
      : [
          { id: 1, day: 0, start: 9, dur: 1, title: "기획 회의", c: highlights[4].color },
          { id: 2, day: 2, start: 10, dur: 1, title: "팀 스탠드업", c: highlights[4].color },
          { id: 3, day: 2, start: 14.5, dur: 1, title: "1:1", c: highlights[5].color },
          { id: 4, day: 4, start: 13, dur: 2, title: "디자인 리뷰", c: highlights[1].color },
        ],
  );

  const [drag, setDrag] = useState<{ day: number; aSlot: number; bSlot: number } | null>(null);
  const [sheet, setSheet] = useState<{ day: number; start: number; end: number } | null>(null);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string>(highlights[4].color);
  const [editingBlock, setEditingBlock] = useState<{ block: Block; startH: number; endH: number } | null>(null);

  const pickCol = (x: number, y: number): { day: number; slot: number } | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const col = el?.closest("[data-wcol]") as HTMLElement | null;
    if (!col) return null;
    const day = Number(col.getAttribute("data-wcol"));
    const grid = col.closest("[data-wgrid]") as HTMLElement | null;
    if (!grid) return null;
    const top = grid.getBoundingClientRect().top;
    const slot = Math.max(0, Math.min(hours.length * 2 - 1, Math.floor((y - top) / SLOT)));
    return { day, slot };
  };
  const onGridDown = (e: React.PointerEvent) => {
    const p = pickCol(e.clientX, e.clientY);
    if (!p) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ day: p.day, aSlot: p.slot, bSlot: p.slot });
  };
  const onGridMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = pickCol(e.clientX, e.clientY);
    if (p && p.slot !== drag.bSlot) setDrag({ ...drag, bSlot: p.slot });
  };
  const endDrag = () => {
    if (!drag) return;
    const s = Math.min(drag.aSlot, drag.bSlot);
    const e = Math.max(drag.aSlot, drag.bSlot) + 1;
    const startHour = 6 + s * 0.5;
    const endHour = 6 + e * 0.5;
    const reverse = drag.aSlot > drag.bSlot;
    const day = drag.day;
    setDrag(null);
    const overlapping = blocks.filter(
      (b) => b.day === day && !(b.start + b.dur <= startHour || b.start >= endHour),
    );
    if ((reverse || s === e - 1) && overlapping.length > 0) {
      setBlocks((bs) => bs.filter((b) => !overlapping.includes(b)));
      return;
    }
    setSheet({ day, start: startHour, end: endHour });
  };

  const saveBlock = () => {
    if (!sheet) return;
    setBlocks((bs) => [
      ...bs,
      {
        id: Date.now(),
        day: sheet.day,
        start: sheet.start,
        dur: sheet.end - sheet.start,
        title: title.trim() || "새 일정",
        c: color,
      },
    ]);
    setSheet(null);
    setTitle("");
  };

  const openEdit = (b: Block) => {
    setEditingBlock({ block: { ...b }, startH: b.start, endH: b.start + b.dur });
  };

  const saveEdit = () => {
    if (!editingBlock) return;
    const { block, startH, endH } = editingBlock;
    setBlocks((bs) =>
      bs.map((b) =>
        b.id === block.id
          ? { ...block, start: startH, dur: endH - startH }
          : b,
      ),
    );
    setEditingBlock(null);
  };

  const deleteEdit = () => {
    if (!editingBlock) return;
    setBlocks((bs) => bs.filter((b) => b.id !== editingBlock.block.id));
    setEditingBlock(null);
  };

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between px-5 pt-4">
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" }}>
          4월 27일 — 5월 3일
        </div>
        <div className="flex gap-1">
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
            <ChevronLeft size={18} />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--bg-tertiary)" }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex sticky top-0 z-10 mt-3" style={{ background: "var(--bg-canvas)", borderBottom: "0.5px solid var(--hairline)" }}>
        <div style={{ width: 36 }} />
        {days.map((d, i) => (
          <div key={d} className="flex-1 text-center py-2" style={{ borderLeft: "0.5px solid var(--hairline)" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{d}</div>
            <div
              className="mx-auto mt-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: i === today ? accent : "transparent",
                color: i === today ? "#fff" : "var(--text-primary)",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {dates[i]}
            </div>
          </div>
        ))}
      </div>

      <div
        data-wgrid
        className="relative"
        style={{ touchAction: "none", userSelect: "none" }}
        onPointerDown={onGridDown}
        onPointerMove={onGridMove}
        onPointerUp={endDrag}
        onPointerCancel={() => setDrag(null)}
      >
        {hours.map((h) => (
          <div key={h} className="flex" style={{ height: HOUR, borderBottom: "0.5px solid var(--hairline)" }}>
            <div
              style={{ width: 36, fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}
              className="text-right pr-2 pt-1"
            >
              {String(h).padStart(2, "0")}:00
            </div>
            {days.map((_, i) => (
              <div
                key={i}
                data-wcol={i}
                className="flex-1 relative"
                style={{ borderLeft: "0.5px solid var(--hairline)" }}
              >
                <div
                  className="absolute left-0 right-0"
                  style={{ top: SLOT, borderTop: "0.5px dashed var(--hairline)" }}
                />
              </div>
            ))}
          </div>
        ))}

        {blocks.map((b) => {
          const top = (b.start - 6) * HOUR;
          const colWidth = `calc((100% - 36px) / 7)`;
          return (
            <button
              key={b.id}
              onPointerDown={(ev) => ev.stopPropagation()}
              onClick={() => openEdit(b)}
              className="absolute rounded-lg overflow-hidden text-left active:opacity-70"
              style={{
                top,
                left: `calc(36px + ${colWidth} * ${b.day} + 2px)`,
                width: `calc(${colWidth} - 4px)`,
                height: b.dur * HOUR - 2,
                background: b.c,
                borderLeft: `3px solid ${accent}`,
                padding: "4px 6px",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>
                {fmtH(b.start)}
              </div>
            </button>
          );
        })}

        {drag && (
          <div
            className="absolute rounded-lg pointer-events-none"
            style={{
              top: Math.min(drag.aSlot, drag.bSlot) * SLOT,
              left: `calc(36px + ((100% - 36px) / 7) * ${drag.day} + 2px)`,
              width: `calc((100% - 36px) / 7 - 4px)`,
              height: (Math.abs(drag.bSlot - drag.aSlot) + 1) * SLOT,
              background: `${accent}33`,
              border: `2px dashed ${accent}`,
            }}
          />
        )}

        <div
          className="absolute pointer-events-none"
          style={{
            top: (14.5 - 6) * HOUR,
            left: `calc(36px + ((100% - 36px) / 7) * ${today})`,
            width: `calc((100% - 36px) / 7)`,
            height: 1,
            background: "#FF3B30",
          }}
        />
      </div>

      {/* Add sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[420px] rounded-3xl p-5 pb-6 shadow-2xl"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--separator)" }} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>새 일정</div>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목"
              className="w-full mt-4 px-4 py-3 rounded-full outline-none"
              style={{ background: "var(--bg-tertiary)", fontSize: 15 }}
            />
            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>요일</div>
                <select
                  value={sheet.day}
                  onChange={(e) => setSheet({ ...sheet, day: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {days.map((d, i) => (
                    <option key={i} value={i}>{d} ({dates[i]})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작 시간</div>
                <select
                  value={sheet.start}
                  onChange={(e) => {
                    const ns = Number(e.target.value);
                    setSheet({ ...sheet, start: ns, end: Math.max(sheet.end, ns + 0.5) });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {halfHours.filter((h) => h < 24).map((h) => (
                    <option key={h} value={h}>{fmtH(h)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료 시간</div>
                <select
                  value={sheet.end}
                  onChange={(e) => setSheet({ ...sheet, end: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {halfHours.filter((h) => h > sheet.start).map((h) => (
                    <option key={h} value={h}>{fmtH(h)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-4">
              {highlights.map((h) => (
                <button
                  key={h.key}
                  onClick={() => setColor(h.color)}
                  className="aspect-square rounded-lg active:scale-95"
                  style={{
                    background: h.color,
                    border: color === h.color ? `2px solid ${accent}` : "0.5px solid var(--hairline)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={saveBlock}
              className="w-full mt-4 py-3 rounded-2xl active:scale-95"
              style={{ background: accent, color: "#fff", fontSize: 17, fontWeight: 600 }}
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* Edit sheet */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingBlock(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[420px] rounded-3xl p-5 pb-6 shadow-2xl"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--separator)" }} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>일정 편집</div>
            <input
              value={editingBlock.block.title}
              onChange={(e) =>
                setEditingBlock({
                  ...editingBlock,
                  block: { ...editingBlock.block, title: e.target.value },
                })
              }
              className="w-full mt-4 px-4 py-3 rounded-full outline-none"
              style={{ background: "var(--bg-tertiary)", fontSize: 15 }}
            />
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>요일</div>
                <select
                  value={editingBlock.block.day}
                  onChange={(e) =>
                    setEditingBlock({
                      ...editingBlock,
                      block: { ...editingBlock.block, day: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {days.map((d, i) => (
                    <option key={i} value={i}>{d} ({dates[i]})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작 시간</div>
                <select
                  value={editingBlock.startH}
                  onChange={(e) => {
                    const ns = Number(e.target.value);
                    setEditingBlock({
                      ...editingBlock,
                      startH: ns,
                      endH: Math.max(editingBlock.endH, ns + 0.5),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {halfHours.filter((h) => h < 24).map((h) => (
                    <option key={h} value={h}>{fmtH(h)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료 시간</div>
                <select
                  value={editingBlock.endH}
                  onChange={(e) =>
                    setEditingBlock({ ...editingBlock, endH: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {halfHours.filter((h) => h > editingBlock.startH).map((h) => (
                    <option key={h} value={h}>{fmtH(h)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-4">
              {highlights.map((h) => (
                <button
                  key={h.key}
                  onClick={() =>
                    setEditingBlock({
                      ...editingBlock,
                      block: { ...editingBlock.block, c: h.color },
                    })
                  }
                  className="aspect-square rounded-lg active:scale-95"
                  style={{
                    background: h.color,
                    border: editingBlock.block.c === h.color ? `2px solid ${accent}` : "0.5px solid var(--hairline)",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={deleteEdit}
                className="flex-1 py-3 rounded-2xl"
                style={{ color: "#FF3B30", fontSize: 15, fontWeight: 500, background: "var(--bg-tertiary)" }}
              >
                삭제
              </button>
              <button
                onClick={() => setEditingBlock(null)}
                className="flex-1 py-3 rounded-2xl"
                style={{ color: "var(--text-secondary)", fontSize: 15, background: "var(--bg-tertiary)" }}
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-3 rounded-2xl active:scale-95"
                style={{ background: accent, color: "#fff", fontSize: 15, fontWeight: 600 }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtH(h: number) {
  const hh = Math.floor(h);
  const mm = h % 1 === 0 ? "00" : "30";
  return `${String(hh).padStart(2, "0")}:${mm}`;
}
