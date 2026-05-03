import { useEffect, useRef, useState } from "react";
import { RotateCcw, Maximize2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { LogoMark } from "@/components/Logo";
import { SPRING } from "@/styles/animations";
import { TYPE } from "@/styles/typography";

export function MandalaView({ accent, planKind = "my" }: { accent: string; planKind?: string }) {
  const [cells, setCells] = useState<string[]>(() => {
    const arr = Array(81).fill("");
    arr[40] = planKind !== "my" ? "팀 목표" : "올해 목표";
    return arr;
  });

  // AI 제안(미리보기) — 적용 전까지 cells 에 반영하지 않음
  const [proposal, setProposal] = useState<string[] | null>(null);

  // 초기화 확인 다이얼로그 — AI 미리보기와 동일한 애니메이션 패턴
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmLeaving, setConfirmLeaving] = useState(false);

  // 핀치 줌 + 팬 (transform: translate + scale)
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // 제스처 진행 중 임시 상태 (state 업데이트 비용 절감)
  const gestureRef = useRef<{
    mode: "none" | "pinch" | "pan";
    startDist: number;
    startZoom: number;
    startMid: { x: number; y: number };
    startPan: { x: number; y: number };
    startTouch: { x: number; y: number };
  }>({
    mode: "none",
    startDist: 0,
    startZoom: 1,
    startMid: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
    startTouch: { x: 0, y: 0 },
  });

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // 줌 시 pan을 클램프해서 그리드가 화면 밖으로 너무 벗어나지 않게
  const clampPan = (p: { x: number; y: number }, z: number) => {
    const wrap = wrapperRef.current;
    if (!wrap) return p;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    // 그리드 컨텐츠 = w*z, h*z. 여유 1/2 화면 정도까지 허용
    const maxX = ((z - 1) * w) / 2 + 40;
    const maxY = ((z - 1) * h) / 2 + 40;
    return {
      x: Math.max(-maxX, Math.min(maxX, p.x)),
      y: Math.max(-maxY, Math.min(maxY, p.y)),
    };
  };

  // native touch 이벤트로 핀치/팬 처리
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;

    const dist = (a: Touch, b: Touch) => {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.hypot(dx, dy);
    };
    const mid = (a: Touch, b: Touch) => ({
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    });

    const onTouchStart = (e: TouchEvent) => {
      const g = gestureRef.current;
      if (e.touches.length === 2) {
        // 핀치 시작
        g.mode = "pinch";
        g.startDist = dist(e.touches[0], e.touches[1]);
        g.startZoom = zoom;
        g.startMid = mid(e.touches[0], e.touches[1]);
        g.startPan = pan;
        e.preventDefault();
      } else if (e.touches.length === 1 && zoom > 1) {
        // 줌 상태에서만 팬 시작 (input 클릭 방해 안 하려면)
        g.mode = "pan";
        g.startTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        g.startPan = pan;
      } else {
        g.mode = "none";
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const g = gestureRef.current;
      if (g.mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const d = dist(e.touches[0], e.touches[1]);
        const m = mid(e.touches[0], e.touches[1]);
        let nz = g.startZoom * (d / g.startDist);
        nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nz));
        // 미드포인트 이동만큼 pan 이동 + 줌 차이 보정
        const dx = m.x - g.startMid.x;
        const dy = m.y - g.startMid.y;
        const np = clampPan({ x: g.startPan.x + dx, y: g.startPan.y + dy }, nz);
        setZoom(nz);
        setPan(np);
      } else if (g.mode === "pan" && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - g.startTouch.x;
        const dy = e.touches[0].clientY - g.startTouch.y;
        const np = clampPan({ x: g.startPan.x + dx, y: g.startPan.y + dy }, zoom);
        setPan(np);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const g = gestureRef.current;
      // 핀치 종료 후 한 손가락 남으면 자연스럽게 팬으로 전환
      if (g.mode === "pinch" && e.touches.length === 1 && zoom > 1) {
        g.mode = "pan";
        g.startTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        g.startPan = pan;
      } else if (e.touches.length === 0) {
        g.mode = "none";
        // 줌이 거의 1이면 깔끔하게 1로 스냅
        if (zoom < 1.05) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
      }
    };

    wrap.addEventListener("touchstart", onTouchStart, { passive: false });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd);
    wrap.addEventListener("touchcancel", onTouchEnd);
    return () => {
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
      wrap.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [zoom, pan]);

  // 더블탭으로 1배 ↔ 2배 토글
  const lastTapRef = useRef<number>(0);
  const onDoubleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      // 더블탭
      e.preventDefault();
      if (zoom > 1) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      } else {
        setZoom(2);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };
  // 모달 애니메이션 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLeaving, setModalLeaving] = useState(false);

  // proposal 이 새로 생기면 마운트 후 다음 프레임에 visible = true 트리거
  useEffect(() => {
    if (proposal && !modalLeaving) {
      const id = requestAnimationFrame(() => setModalVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [proposal, modalLeaving]);

  // 초기화 다이얼로그도 같은 패턴
  useEffect(() => {
    if (confirmingReset && !confirmLeaving) {
      const id = requestAnimationFrame(() => setConfirmVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [confirmingReset, confirmLeaving]);

  const update = (i: number, v: string) => {
    setCells((c) => {
      const next = [...c];
      next[i] = v;
      // mirror tier 2/3
      const mirror = mirrorIndex(i);
      if (mirror !== null) next[mirror] = v;
      return next;
    });
  };

  const reset = () => {
    const arr = Array(81).fill("");
    arr[40] = planKind !== "my" ? "팀 목표" : "올해 목표";
    setCells(arr);
    setProposal(null);
    setModalVisible(false);
    setModalLeaving(false);
  };

  const closeConfirmReset = (apply: boolean) => {
    if (confirmLeaving) return;
    setConfirmLeaving(true);
    setConfirmVisible(false);
    setTimeout(() => {
      if (apply) reset();
      setConfirmingReset(false);
      setConfirmLeaving(false);
    }, 220);
  };

  // AI에게 분해 부탁 → 즉시 적용하지 않고 proposal 로만 보관 (미리보기)
  const aiPropose = () => {
    const next = [...cells];
    const subs = ["건강", "커리어", "관계", "재정", "학습", "취미", "여행", "마음"];
    const subCenters = [10, 13, 16, 37, 43, 64, 67, 70];
    subCenters.forEach((idx, k) => {
      if (!next[idx]) {
        next[idx] = subs[k];
        const m = mirrorIndex(idx);
        if (m !== null) next[m] = subs[k];
      }
    });
    setProposal(next);
  };

  const closeModal = (apply: boolean) => {
    if (modalLeaving) return;
    setModalLeaving(true);
    setModalVisible(false);
    setTimeout(() => {
      if (apply && proposal) setCells(proposal);
      setProposal(null);
      setModalLeaving(false);
    }, 220);
  };
  const applyProposal = () => closeModal(true);
  const dismissProposal = () => closeModal(false);

  // 미리보기 중일 때 그리드에 표시할 셀 데이터 (proposal이 있으면 proposal 사용)
  const displayCells = proposal ?? cells;
  const isPreviewing = proposal !== null;
  // 새로 채워질 셀 인덱스 집합 (강조용)
  const newlyFilled = new Set<number>();
  if (proposal) {
    for (let i = 0; i < 81; i++) {
      if (!cells[i] && proposal[i]) newlyFilled.add(i);
    }
  }

  return (
    <div className="px-4 pb-32" style={{ paddingTop: 24 }}>
      {/* 헤더 섹션 — 한 묶음 */}
      <div
        className="flex items-end justify-between"
        style={{
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "0.5px solid var(--hairline)",
        }}
      >
        <div>
          <div style={{ ...TYPE.titlePage, color: "var(--text-primary)" }}>
            만다라트
          </div>
          <div
            style={{
              ...TYPE.bodySmall,
              color: "var(--text-secondary)",
              marginTop: 6,
            }}
          >
            중앙 핵심 목표 → 8개 세부 목표 → 각 실행 계획
          </div>
        </div>
        <button
          onClick={() => setConfirmingReset(true)}
          className="flex items-center gap-1 active:scale-95"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-muted)",
            background: "var(--bg-tertiary)",
            border: 0,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 999,
            fontFamily: "inherit",
          }}
        >
          <RotateCcw size={12} /> 초기화
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          onClick={aiPropose}
          disabled={isPreviewing}
          className="px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95"
          style={{
            background: "var(--bg-tertiary)",
            fontSize: 13,
            opacity: isPreviewing ? 0.5 : 1,
            cursor: isPreviewing ? "default" : "pointer",
          }}
        >
          <LogoMark size={16} accent={accent} rounded={4} /> 하루온에게 분해 부탁
        </button>

        {/* 줌 상태 표시 + 원래대로 */}
        {zoom > 1.02 && (
          <button
            onClick={resetView}
            className="px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"
            style={{
              background: `${accent}1A`,
              color: accent,
              fontSize: 12,
              fontWeight: 600,
              border: 0,
              cursor: "pointer",
            }}
            aria-label="원래대로"
          >
            <Maximize2 size={12} /> {Math.round(zoom * 100)}% · 원래대로
          </button>
        )}
      </div>

      {/* 만다라트 9×9 그리드 — 핀치 줌 + 드래그 팬 (외부 좌우 스와이프 차단) */}
      <div
        ref={wrapperRef}
        onClick={onDoubleTap}
        data-no-swipe="true"
        className="mt-4 rounded-lg"
        style={{
          position: "relative",
          overflow: "hidden",
          touchAction: zoom > 1 ? "none" : "manipulation",
          // 줌 중일 때만 외곽 라인
          ...(zoom > 1.02
            ? { border: "0.5px solid var(--hairline)" }
            : {}),
        }}
      >
      <div
        className="grid grid-cols-9 overflow-hidden"
        style={{
          border: `1.5px solid ${accent}`,
          borderRadius: 8,
          background: "var(--bg-elevated)",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition:
            gestureRef.current.mode === "none"
              ? "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)"
              : "none",
          willChange: "transform",
        }}
      >
        {displayCells.map((v, i) => {
          const tier = getTier(i);
          const r = Math.floor(i / 9);
          const c = i % 9;
          const isNew = newlyFilled.has(i);

          let bg = "var(--bg-elevated)";
          let color = "var(--text-primary)";
          let fw: number = 400;
          if (tier === 1) {
            bg = accent;
            color = "#fff";
            fw = 700;
          } else if (tier === 2) {
            bg = `${accent}1A`;
            color = accent;
            fw = 700;
          } else if (tier === 3) {
            bg = "var(--bg-tertiary)";
            fw = 400;
          }

          const isLastCol = c === 8;
          const isLastRow = r === 7;
          const isBlockRight = c === 2 || c === 5;
          const isBlockBottom = r === 2 || r === 5;

          const borderRight = isLastCol
            ? "none"
            : isBlockRight
            ? `1.5px solid ${accent}`
            : "0.5px solid var(--hairline)";
          const borderBottom = isLastRow
            ? "none"
            : isBlockBottom
            ? `1.5px solid ${accent}`
            : "0.5px solid var(--hairline)";

          // 새로 추천된 셀은 input value 를 빈 문자열로 비우고, 위에 오버레이로 글자만 띄워 애니메이션
          const inputValue = isNew ? "" : v;
          // 추천 셀의 칸 배경은 등장 애니메이션과 동기화 (modalVisible/leaving 따라 강조 톤으로 페이드)
          if (isNew) {
            // 칸 배경은 input 자체가 아니라 wrapper 의 ::before 같은 별도 레이어가 필요한데,
            // 간단히 wrapper background로 처리하고 input 은 transparent 로
          }

          // 애니메이션 진행도 (모달과 동기화)
          const animOn = modalVisible && !modalLeaving;
          // 인덱스 기반 stagger 지연 — 8개 추천이 0~140ms 사이에 순차적으로
          const subCenters = [10, 13, 16, 37, 43, 64, 67, 70];
          const staggerOrder = subCenters.indexOf(i);
          const delayMs =
            isNew && staggerOrder >= 0 ? staggerOrder * 35 : 0;

          return (
            <div
              key={i}
              style={{
                position: "relative",
                aspectRatio: "1",
                minWidth: 0,
                background: isNew
                  ? animOn
                    ? `${accent}33`
                    : "var(--bg-elevated)"
                  : bg,
                borderRight,
                borderBottom,
                boxSizing: "border-box",
                transition: isNew
                  ? `background 260ms cubic-bezier(0.22, 0.61, 0.36, 1) ${delayMs}ms`
                  : undefined,
              }}
            >
              <input
                value={inputValue}
                onChange={(e) => update(i, e.target.value)}
                readOnly={isPreviewing}
                className="text-center outline-none"
                style={{
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  color: isNew ? "transparent" : color,
                  fontSize: 9,
                  fontWeight: fw,
                  padding: 1,
                  border: 0,
                  boxSizing: "border-box",
                }}
              />
              {/* 추천 글자 오버레이 — 모달 등장과 동기화하여 fade + slide-up */}
              {isNew && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    fontSize: 9,
                    fontWeight: 700,
                    color: accent,
                    opacity: animOn ? 1 : 0,
                    transform: animOn
                      ? "translateY(0)"
                      : "translateY(4px)",
                    transition: `opacity 260ms cubic-bezier(0.22, 0.61, 0.36, 1) ${delayMs}ms, transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1) ${delayMs}ms`,
                    willChange: "opacity, transform",
                  }}
                >
                  {v}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {/* 초기화 확인 다이얼로그 — AI 미리보기와 동일한 위치/형태 */}
      {confirmingReset && (
        <div
          className="mt-4 rounded-2xl"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${accent}55`,
            boxShadow: `0 8px 24px ${accent}1F`,
            padding: 16,
            opacity: confirmLeaving ? 0 : confirmVisible ? 1 : 0,
            transform: confirmLeaving
              ? "translateY(8px) scale(0.98)"
              : confirmVisible
              ? "translateY(0) scale(1)"
              : "translateY(12px) scale(0.96)",
            transition: confirmLeaving
              ? "opacity 0.18s ease-in, transform 0.18s ease-in"
              : "opacity 0.28s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1)",
            willChange: "opacity, transform",
          }}
        >
          <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
            <RotateCcw size={14} color={accent} />
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: accent,
                letterSpacing: "-0.1px",
              }}
            >
              초기화
            </div>
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
              marginBottom: 4,
            }}
          >
            초기화 하시겠습니까?
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              marginBottom: 14,
            }}
          >
            모든 칸이 비워집니다.
          </div>
          <div className="flex gap-8" style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => closeConfirmReset(false)}
              className="active:scale-95 transition-transform"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                fontSize: 14,
                fontWeight: 600,
                border: 0,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              취소
            </button>
            <button
              onClick={() => closeConfirmReset(true)}
              className="active:scale-95 transition-transform"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: accent,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                border: 0,
                cursor: "pointer",
                boxShadow: `0 4px 12px ${accent}40`,
                fontFamily: "inherit",
              }}
            >
              초기화
            </button>
          </div>
        </div>
      )}

      {/* AI 추천 미리보기 — 설정 하시겠습니까? */}
      {isPreviewing && (
        <div
          className="mt-4 rounded-2xl"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${accent}55`,
            boxShadow: `0 8px 24px ${accent}1F`,
            padding: 16,
            opacity: modalLeaving ? 0 : modalVisible ? 1 : 0,
            transform: modalLeaving
              ? "translateY(8px) scale(0.98)"
              : modalVisible
              ? "translateY(0) scale(1)"
              : "translateY(12px) scale(0.96)",
            transition: modalLeaving
              ? "opacity 0.18s ease-in, transform 0.18s ease-in"
              : "opacity 0.28s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1)",
            willChange: "opacity, transform",
          }}
        >
          <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
            <LogoMark size={16} accent={accent} rounded={4} />
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: accent,
                letterSpacing: "-0.1px",
              }}
            >
              하루온 추천 미리보기
            </div>
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
              marginBottom: 4,
            }}
          >
            이대로 설정하시겠습니까?
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              marginBottom: 14,
            }}
          >
            8개 세부 목표가 강조 표시되어 있어요. 적용하면 빈 칸에 채워집니다.
          </div>
          <div className="flex gap-8" style={{ display: "flex", gap: 8 }}>
            <button
              onClick={dismissProposal}
              className="active:scale-95 transition-transform"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                fontSize: 14,
                fontWeight: 600,
                border: 0,
                cursor: "pointer",
              }}
            >
              아니오
            </button>
            <button
              onClick={applyProposal}
              className="active:scale-95 transition-transform"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: accent,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                border: 0,
                cursor: "pointer",
                boxShadow: `0 4px 12px ${accent}40`,
              }}
            >
              예, 적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getTier(i: number): 1 | 2 | 3 | 4 {
  if (i === 40) return 1;
  // 8 sub-goal centers (center of each 3x3 block, excluding the central block)
  const subCenters = [10, 13, 16, 37, 43, 64, 67, 70];
  if (subCenters.includes(i)) return 2;
  // outer cells of central 3x3 block
  const centralOuter = [30, 31, 32, 39, 41, 48, 49, 50];
  if (centralOuter.includes(i)) return 3;
  return 4;
}

function mirrorIndex(i: number): number | null {
  // central block outer cells mirror sub-goal centers
  const map: Record<number, number> = {
    30: 10, 31: 13, 32: 16,
    39: 37, 41: 43,
    48: 64, 49: 67, 50: 70,
    10: 30, 13: 31, 16: 32,
    37: 39, 43: 41,
    64: 48, 67: 49, 70: 50,
  };
  return map[i] ?? null;
}

