
// ─── YearView ─────────────────────────────────────────────────
// Layout constants — compact, no unnecessary whitespace
const COL_LABEL_W = 48;   // sticky month label width
const DATE_H      = 16;   // height of date-number area
const BAR_H       = 12;   // highlight bar height
const BAR_GAP     = 1;    // gap between stacked bars
const EVT_H       = 11;   // height per event text line
const EVT_GAP     = 1;    // gap between event lines
const MAX_EVTS    = 3;    // max visible events per cell
function YearView() {
  const data = useStore();
  const theme = THEMES[data.theme];
  const { year, highlights, events } = data;

  // 하이라이트마다 고정 레인 번호 배정 (greedy interval scheduling)
  // — 같은 레인에 겹치는 구간이 없도록 보장
  const hlLanes = React.useMemo(() => {
    const lanes = {};
    highlights.forEach((h, i) => {
      const used = new Set(
        highlights.slice(0, i)
          .filter(o => h.startDate <= o.endDate && h.endDate >= o.startDate)
          .map(o => lanes[o.id])
      );
      let lane = 0;
      while (used.has(lane)) lane++;
      lanes[h.id] = lane;
    });
    return lanes;
  }, [highlights]);

  const numLanes = highlights.length === 0 ? 0 : Math.max(0, ...Object.values(hlLanes)) + 1;
  const cellH    = DATE_H + numLanes * (BAR_H + BAR_GAP) + MAX_EVTS * (EVT_H + EVT_GAP) + 4;

  const [zoom, setZoom] = React.useState(1.0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart]   = React.useState(null);
  const [dragEnd, setDragEnd]       = React.useState(null);
  const [showPicker, setShowPicker] = React.useState(false);
  const [hlColor, setHlColor]       = React.useState(HIGHLIGHT_COLORS[0].value);
  const [hlLabel, setHlLabel]       = React.useState('');
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingHl, setEditingHl]         = React.useState(null);
  const [editStart, setEditStart]         = React.useState('');
  const [editEnd, setEditEnd]             = React.useState('');
  const [editColor, setEditColor]         = React.useState('');
  const [editLabel, setEditLabel]         = React.useState('');

  const today = todayStr();

  const isInDrag = (dateStr) => {
    if (!dragStart || !dragEnd) return false;
    const [s, e] = [dragStart, dragEnd].sort();
    return dateStr >= s && dateStr <= e;
  };

  const getDateHighlights = (dateStr) =>
    highlights.filter(h => dateStr >= h.startDate && dateStr <= h.endDate);

  const getDateEvents = (dateStr) =>
    events.filter(ev => ev.date === dateStr);

  const onDayDown = (dateStr, e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(dateStr);
    setDragEnd(dateStr);
    setEditHlId(null);
  };
  const onDayEnter = (dateStr) => { if (isDragging) setDragEnd(dateStr); };
  const onDayUp = () => {
    if (isDragging && dragStart && dragEnd) {
      setIsDragging(false);
      const [s, e] = [dragStart, dragEnd].sort();
      if (s === e) {
        setDragStart(null); setDragEnd(null);
      } else {
        // 드래그 범위 선택 → 형광펜 저장
        setShowPicker(true);
      }
    } else {
      setIsDragging(false);
    }
  };

  const saveHighlight = () => {
    if (!dragStart || !dragEnd) return;
    const [s, e] = [dragStart, dragEnd].sort();
    store.addHighlight({ startDate: s, endDate: e, color: hlColor, label: hlLabel.trim() });
    resetPicker();
  };

  const resetPicker = () => {
    setDragStart(null); setDragEnd(null);
    setShowPicker(false); setHlLabel('');
  };

  const renderMonthRow = (mi) => {
    const numDays  = daysInMonth(year, mi);
    const monthStr = String(mi + 1).padStart(2, '0');
    const mFirstKey = `${year}-${monthStr}-01`;
    const mLastKey  = `${year}-${monthStr}-${String(numDays).padStart(2, '0')}`;

    // ── Drag: center day within this month's visible selection ──
    const dragMidDay = (() => {
      if (!isDragging || !dragStart || !dragEnd) return null;
      const [ds, de] = [dragStart, dragEnd].sort();
      const dragDays = [];
      for (let d = 1; d <= numDays; d++) {
        const dk = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
        if (dk >= ds && dk <= de) dragDays.push(d);
      }
      if (!dragDays.length) return null;
      return dragDays[Math.floor(dragDays.length / 2)];
    })();

    const dragRangeLabel = (isDragging && dragStart && dragEnd) ? (() => {
      const [s, e] = [dragStart, dragEnd].sort();
      return s === e
        ? s.slice(5).replace('-', '/')
        : `${s.slice(5).replace('-', '/')} ~ ${e.slice(5).replace('-', '/')}`;
    })() : null;

    // ── Overlay labels: center X of each highlight's visible segment ──
    const overlays = highlights.map((h, hIdx) => {
      if (!h.label) return null;
      if (h.endDate < mFirstKey || h.startDate > mLastKey) return null;

      const visStartDay = h.startDate >= mFirstKey ? parseInt(h.startDate.slice(8)) : 1;
      const visEndDay   = h.endDate   <= mLastKey  ? parseInt(h.endDate.slice(8))   : numDays;
      const midDay      = Math.round((visStartDay + visEndDay) / 2);
      const midKey      = `${year}-${monthStr}-${String(midDay).padStart(2, '0')}`;

      const slot = hlLanes[h.id] || 0;

      // CSS calc: cx = label_col_width + fraction × (100% - label_col_width)
      const frac = (visStartDay - 1 + (visEndDay - visStartDay + 1) / 2) / numDays;
      const cx   = `calc(${(COL_LABEL_W * (1 - frac)).toFixed(2)}px + ${(frac * 100).toFixed(4)}%)`;
      return {
        id:    h.id,
        label: h.label,
        cx,
        top:   DATE_H + slot * (BAR_H + BAR_GAP),
      };
    }).filter(Boolean);

    // ── Day cells ──
    const cells = [];
    for (let d = 1; d <= numDays; d++) {
      const dateStr   = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
      const dow       = new Date(year, mi, d).getDay();
      const isToday   = dateStr === today;
      const isWeekend = dow === 0 || dow === 6;
      const inDrag    = isInDrag(dateStr);
      const dayHls    = getDateHighlights(dateStr);
      const dayEvts   = getDateEvents(dateStr);
      const isMidDrag = d === dragMidDay;

      cells.push(
        <div key={d}
          onMouseDown={e => onDayDown(dateStr, e)}
          onMouseEnter={() => onDayEnter(dateStr)}
          onMouseUp={onDayUp}
          style={{
            flex: 1, minWidth: 0, height: cellH,
            borderRight: '1px solid rgba(0,0,0,0.05)',
            background: inDrag
              ? `${theme.primary}26`
              : isToday   ? `${theme.primary}12`
              : isWeekend ? 'rgba(0,0,0,0.018)' : 'transparent',
            cursor: 'crosshair', position: 'relative', userSelect: 'none',
          }}>

          {/* Date number */}
          <div style={{
            textAlign: 'center', height: DATE_H,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isToday
              ? <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: theme.primary, color: '#fff',
                  fontSize: 9, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{d}</span>
              : <span style={{
                  fontSize: 9, fontWeight: isWeekend ? 500 : 400,
                  color: dow === 0 ? '#c0392b' : dow === 6 ? '#0066cc' : '#86868b',
                }}>{d}</span>
            }
          </div>

          {/* Highlight bars — 레인 고정으로 겹치는 구간도 직선 유지 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: BAR_GAP }}>
            {Array.from({ length: numLanes }, (_, lane) => {
              const h = dayHls.find(hl => hlLanes[hl.id] === lane);
              if (!h) return <div key={lane} style={{ height: BAR_H }} />;
              const isStart        = h.startDate === dateStr;
              const isEnd          = h.endDate   === dateStr;
              const isLastInMonth  = d === numDays;
              const isFirstInMonth = d === 1 && h.startDate < mFirstKey;
              const rL = (isStart || isFirstInMonth) ? 3 : 0;
              const rR = (isEnd   || isLastInMonth)  ? 3 : 0;
              return (
                <div key={h.id}
                  onClick={e => {
                    e.stopPropagation();
                    setEditingHl(h);
                    setEditStart(h.startDate);
                    setEditEnd(h.endDate);
                    setEditColor(h.color);
                    setEditLabel(h.label || '');
                    setShowEditModal(true);
                  }}
                  style={{
                    height: BAR_H, background: h.color, cursor: 'pointer',
                    borderRadius: `${rL}px ${rR}px ${rR}px ${rL}px`,
                  }}
                />
              );
            })}
          </div>

          {/* Drag center label — shows full date range, centered in the selection */}
          {isMidDrag && dragRangeLabel && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', zIndex: 10,
            }}>
              <span style={{
                fontSize: 8, fontWeight: 700,
                color: '#fff',
                background: theme.primary,
                borderRadius: 4, padding: '1px 5px',
                whiteSpace: 'nowrap',
                letterSpacing: -0.1,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}>{dragRangeLabel}</span>
            </div>
          )}

          {/* Event text lines — up to 3 */}
          {dayEvts.length > 0 && (
            <div style={{
              position: 'absolute', left: 1, right: 1, bottom: 2,
              display: 'flex', flexDirection: 'column', gap: EVT_GAP,
            }}>
              {dayEvts.slice(0, MAX_EVTS).map(ev => (
                <div key={ev.id} style={{
                  height: EVT_H, lineHeight: `${EVT_H}px`,
                  background: (ev.color || theme.primary) + '28',
                  borderLeft: `2px solid ${ev.color || theme.primary}`,
                  borderRadius: '0 3px 3px 0',
                  padding: '0 3px',
                  fontSize: 8, fontWeight: 500, color: '#1d1d1f',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {ev.title}
                </div>
              ))}
              {dayEvts.length > MAX_EVTS && (
                <div style={{ fontSize: 7, color: '#86868b', textAlign: 'center', lineHeight: 1 }}>
                  +{dayEvts.length - MAX_EVTS}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={mi} style={{
        display: 'flex', position: 'relative',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        {/* Sticky month label */}
        <div
          onClick={() => {
            store.setMonthViewDate(`${year}-${String(mi+1).padStart(2,'0')}`);
            window.__switchTab && window.__switchTab('month');
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(0,102,204,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(245,245,247,0.95)'}
          style={{
            flexShrink: 0, width: COL_LABEL_W, height: cellH,
            position: 'sticky', left: 0, zIndex: 10,
            background: 'rgba(245,245,247,0.95)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 1,
            cursor: 'pointer', transition: 'background .12s',
          }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f', lineHeight: 1, letterSpacing: -0.4 }}>{mi + 1}</span>
          <span style={{ fontSize: 8, fontWeight: 500, color: '#86868b', letterSpacing: 0.4 }}>{MONTH_SHORT[mi].toUpperCase()}</span>
        </div>

        {/* Day cells */}
        {cells}

        {/* ── Centered label overlays — no width constraint = no truncation ── */}
        {overlays.map(ov => (
          <div key={`lbl-${ov.id}`} style={{
            position: 'absolute',
            left: ov.cx,
            top: ov.top,
            height: BAR_H,
            transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none', zIndex: 5,
            fontSize: 9, fontWeight: 700,
            color: 'rgba(0,0,0,0.72)',
            whiteSpace: 'nowrap',
          }}>{ov.label}</div>
        ))}
      </div>
    );
  };

  const solidColor = (rgba) => rgba.replace(/[\d.]+\)$/, '0.88)');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      onMouseUp={onDayUp}
      onMouseLeave={() => { if (isDragging) onDayUp(); }}>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 16px', flexShrink: 0,
        position: 'relative',
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        {/* 배율 조절 — 좌측 고정 */}
        <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
          <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))}
            style={{ ...apBtnSt, width:26, height:26, fontSize:15 }}>−</button>
          <span style={{ fontSize:11, color:'#8E8E93', minWidth:34, textAlign:'center', fontWeight:500 }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))}
            style={{ ...apBtnSt, width:26, height:26, fontSize:15 }}>+</button>
        </div>

        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)',
          display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => store.setYear(year - 1)} style={apBtnSt}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: -0.8, color: '#1d1d1f' }}>{year}</span>
          <button onClick={() => store.setYear(year + 1)} style={apBtnSt}>›</button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#86868b', letterSpacing: -0.1 }}>형광펜</span>
          {HIGHLIGHT_COLORS.map(c => (
            <button key={c.name} onClick={() => setHlColor(c.value)} title={c.name} style={{
              width: 20, height: 20, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: solidColor(c.value), transition: 'all .15s',
              boxShadow: hlColor === c.value
                ? `0 0 0 2.5px #fff, 0 0 0 4.5px rgba(0,0,0,0.3)`
                : '0 1px 3px rgba(0,0,0,0.15)',
              transform: hlColor === c.value ? 'scale(1.18)' : 'scale(1)',
            }} />
          ))}
          <span style={{ fontSize: 10, color: '#c7c7cc', marginLeft: 6 }}>드래그로 구간 선택</span>
        </div>
      </div>

      {/* Year grid */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f5f5f7' }}>
        <div style={{ background: '#fff', width: '100%', zoom: zoom }}>
          {Array.from({ length: 12 }, (_, mi) => renderMonthRow(mi))}
        </div>
      </div>

      {/* Legend */}
      {highlights.length > 0 && (
        <div style={{
          padding: '5px 12px', display: 'flex', gap: 6, flexWrap: 'wrap',
          alignItems: 'center', flexShrink: 0,
          borderTop: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(245,245,247,0.9)', backdropFilter: 'blur(10px)',
        }}>
          {highlights.map(h => (
            <div key={h.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: h.color, padding: '2px 8px',
              borderRadius: 980, fontSize: 11, fontWeight: 500,
            }}>
              <span>{h.startDate.slice(5).replace('-', '/')} ~ {h.endDate.slice(5).replace('-', '/')}</span>
              {h.label && <span>· {h.label}</span>}
              <button onClick={() => store.removeHighlight(h.id)} style={{
                border: 'none', background: 'none', cursor: 'pointer',
                color: 'rgba(0,0,0,0.4)', fontSize: 14, lineHeight: 1, padding: 0,
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Edit highlight modal */}
      {showEditModal && editingHl && (() => {
        const saveEdit = () => {
          const [s, e] = [editStart, editEnd].sort();
          store.updateHighlight(editingHl.id, { startDate: s, endDate: e, color: editColor, label: editLabel.trim() });
          setShowEditModal(false); setEditingHl(null);
        };
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} onClick={() => { setShowEditModal(false); setEditingHl(null); }}>
            <div style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'saturate(180%) blur(40px)',
              borderRadius: 22, padding: 28, width: 340,
              boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0',
              border: '1px solid rgba(0,0,0,0.08)',
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: '#1d1d1f', letterSpacing: -0.3 }}>구간 수정</h3>

              {/* 날짜 선택 */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                {[['시작일', editStart, setEditStart], ['종료일', editEnd, setEditEnd]].map(([lbl, val, setter]) => (
                  <div key={lbl} style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#86868b', marginBottom: 4, letterSpacing: 0.3 }}>{lbl}</div>
                    <input type="date" value={val} onChange={e => setter(e.target.value)} style={{
                      width: '100%', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
                      padding: '8px 10px', fontSize: 13, outline: 'none',
                      fontFamily: 'inherit', color: '#1d1d1f', background: '#fff',
                    }} />
                  </div>
                ))}
              </div>

              {/* 색상 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f', marginBottom: 10, letterSpacing: -0.1 }}>색상</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c.name} onClick={() => setEditColor(c.value)} style={{
                      flex: 1, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: solidColor(c.value), transition: 'all .15s',
                      boxShadow: editColor === c.value
                        ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px rgba(0,0,0,0.28)`
                        : '0 1px 4px rgba(0,0,0,0.08)',
                      transform: editColor === c.value ? 'scale(1.06)' : 'scale(1)',
                    }} />
                  ))}
                </div>
              </div>

              {/* 레이블 */}
              <input autoFocus value={editLabel} onChange={e => setEditLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                placeholder="레이블 (선택사항)"
                style={{
                  display: 'block', width: '100%', border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 12, padding: '12px 14px', fontSize: 17,
                  outline: 'none', fontFamily: 'inherit', color: '#1d1d1f',
                  background: '#fff', marginBottom: 20, letterSpacing: -0.2,
                }} />

              {/* 버튼 */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { store.removeHighlight(editingHl.id); setShowEditModal(false); setEditingHl(null); }} style={{
                  flex: 1, background: 'rgba(255,59,48,0.1)', color: '#c0392b', border: 'none',
                  borderRadius: 980, padding: '13px 0', cursor: 'pointer',
                  fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                }}>삭제</button>
                <button onClick={() => { setShowEditModal(false); setEditingHl(null); }} style={{
                  flex: 1, background: 'rgba(0,0,0,0.06)', color: '#1d1d1f', border: 'none',
                  borderRadius: 980, padding: '13px 0', cursor: 'pointer',
                  fontSize: 15, fontWeight: 400, fontFamily: 'inherit',
                }}>취소</button>
                <button onClick={saveEdit} style={{
                  flex: 1, background: theme.primary, color: '#fff', border: 'none',
                  borderRadius: 980, padding: '13px 0', cursor: 'pointer',
                  fontSize: 15, fontWeight: 400, fontFamily: 'inherit',
                }}>저장</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add highlight modal */}
      {showPicker && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={resetPicker}>
          <div style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'saturate(180%) blur(40px)',
            borderRadius: 22, padding: 28, width: 340,
            boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0',
            border: '1px solid rgba(0,0,0,0.08)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: '#1d1d1f', letterSpacing: -0.3 }}>구간 추가</h3>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              {[['시작일', dragStart, setDragStart], ['종료일', dragEnd, setDragEnd]].map(([lbl, val, setter]) => (
                <div key={lbl} style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#86868b', marginBottom: 4, letterSpacing: 0.3 }}>{lbl}</div>
                  <input type="date" value={val || ''} onChange={e => setter(e.target.value)} style={{
                    width: '100%', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
                    padding: '8px 10px', fontSize: 13, outline: 'none',
                    fontFamily: 'inherit', color: '#1d1d1f', background: '#fff',
                  }} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f', marginBottom: 10, letterSpacing: -0.1 }}>색상</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {HIGHLIGHT_COLORS.map(c => (
                  <button key={c.name} onClick={() => setHlColor(c.value)} style={{
                    flex: 1, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: solidColor(c.value), transition: 'all .15s',
                    boxShadow: hlColor === c.value
                      ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px rgba(0,0,0,0.28)`
                      : '0 1px 4px rgba(0,0,0,0.08)',
                    transform: hlColor === c.value ? 'scale(1.06)' : 'scale(1)',
                  }} />
                ))}
              </div>
            </div>

            <input autoFocus value={hlLabel} onChange={e => setHlLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveHighlight()}
              placeholder="레이블 (선택사항)"
              style={{
                display: 'block', width: '100%', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12, padding: '12px 14px', fontSize: 17,
                outline: 'none', fontFamily: 'inherit', color: '#1d1d1f',
                background: '#fff', marginBottom: 20, letterSpacing: -0.2,
              }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={resetPicker} style={{
                flex: 1, background: 'rgba(0,0,0,0.06)', color: '#1d1d1f', border: 'none',
                borderRadius: 980, padding: '13px 0', cursor: 'pointer',
                fontSize: 17, fontWeight: 400, fontFamily: 'inherit',
                transition: 'transform .1s',
              }}
                onMouseDown={e => e.currentTarget.style.transform='scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
              >취소</button>
              <button onClick={saveHighlight} style={{
                flex: 1, background: theme.primary, color: '#fff', border: 'none',
                borderRadius: 980, padding: '13px 0', cursor: 'pointer',
                fontSize: 17, fontWeight: 400, fontFamily: 'inherit',
                transition: 'transform .1s',
              }}
                onMouseDown={e => e.currentTarget.style.transform='scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
              >저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const apBtnSt = {
  width: 30, height: 30, borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(0,0,0,0.04)',
  cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
  color: '#1d1d1f', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
  transition: 'transform .1s',
};

// ─── EventModal ───────────────────────────────────────────────
function EventModal({ dateKey, date, theme, events, onClose, onNavigateDay }) {
  const [title, setTitle]     = React.useState('');
  const [evColor, setEvColor] = React.useState(theme.primary);
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const displayDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  const handleAdd = () => {
    if (!title.trim()) return;
    store.addEvent({ date: dateKey, title: title.trim(), color: evColor });
    setTitle('');
  };

  const palette = [theme.primary, '#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#e91e63'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'saturate(180%) blur(40px)',
        borderRadius: 22, padding: 24, width: 340,
        boxShadow: 'rgba(0,0,0,0.22) 3px 5px 30px 0',
        border: '1px solid rgba(0,0,0,0.08)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17, color: '#1d1d1f', letterSpacing: -0.3 }}>{displayDate}</div>
            <button onClick={onNavigateDay} style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: theme.primary, fontSize: 14, padding: 0, fontFamily: 'inherit',
              letterSpacing: -0.1,
            }}>일력에서 보기 →</button>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: 16, color: '#1d1d1f',
          }}>×</button>
        </div>

        {events.length === 0 && (
          <div style={{ color: '#c7c7cc', fontSize: 14, textAlign: 'center', padding: '12px 0 14px', letterSpacing: -0.1 }}>
            등록된 일정이 없습니다
          </div>
        )}
        {events.map(ev => (
          <div key={ev.id} style={{
            display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7,
            padding: '9px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 11,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color || theme.primary, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 15, color: '#1d1d1f', letterSpacing: -0.2 }}>{ev.title}</span>
            <button onClick={() => store.removeEvent(ev.id)} style={{
              border: 'none', background: 'none', cursor: 'pointer', color: '#c7c7cc', fontSize: 17, lineHeight: 1,
            }}>×</button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 6, margin: '14px 0 10px' }}>
          {palette.map(c => (
            <button key={c} onClick={() => setEvColor(c)} style={{
              flex: 1, height: 20, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
              boxShadow: evColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none', transition: 'box-shadow .1s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="일정 추가..."
            style={{
              flex: 1, border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 980, padding: '10px 16px', fontSize: 17,
              outline: 'none', fontFamily: 'inherit', color: '#1d1d1f',
              background: '#fff', letterSpacing: -0.2,
            }} />
          <button onClick={handleAdd} style={{
            background: theme.primary, color: '#fff', border: 'none',
            borderRadius: 980, padding: '10px 18px', cursor: 'pointer',
            fontSize: 17, fontWeight: 400, fontFamily: 'inherit',
            transition: 'transform .1s',
          }}
            onMouseDown={e => e.currentTarget.style.transform='scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform='scale(1)'}
          >추가</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { YearView, EventModal });
