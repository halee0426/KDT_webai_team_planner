
// ─── Shared Apple styles ──────────────────────────────────────
const AP = {
  card:    { background:'#fff', borderRadius:16, boxShadow:'0 1px 0 rgba(60,60,67,0.06), 0 4px 20px rgba(0,0,0,0.06)' },
  input:   { border:'none', background:'rgba(0,0,0,0.05)', borderRadius:12, padding:'11px 13px',
             fontSize:15, outline:'none', fontFamily:'inherit', color:'#1C1C1E', width:'100%' },
  btn:     (primary) => ({
    border:'none', borderRadius:12, padding:'10px 18px', cursor:'pointer',
    fontSize:15, fontWeight:600, fontFamily:'inherit',
    background: primary, color:'#fff',
  }),
  btnGhost: { border:'none', borderRadius:12, padding:'10px 18px', cursor:'pointer',
              fontSize:15, fontWeight:500, fontFamily:'inherit',
              background:'rgba(0,0,0,0.06)', color:'#1C1C1E' },
  label:   { fontSize:11, fontWeight:600, color:'#8E8E93', letterSpacing:0.5,
             textTransform:'uppercase', marginBottom:8, display:'block' },
};

const apNavBtn = {
  width:34, height:34, borderRadius:10,
  border:'0.5px solid rgba(60,60,67,0.16)',
  background:'rgba(0,0,0,0.04)',
  cursor:'pointer', fontSize:18, fontFamily:'inherit',
  color:'#1C1C1E', display:'inline-flex',
  alignItems:'center', justifyContent:'center',
};

// ─── MonthView ───────────────────────────────────────────────
function MonthView() {
  const data  = useStore();
  const theme = THEMES[data.theme];
  const [ym, setYm] = React.useState(() => {
    const mv = store.data.monthViewDate;
    if (mv) { const p = mv.split('-'); if (p.length >= 2) return { y: +p[0], m: +p[1]-1 }; }
    return { y: new Date().getFullYear(), m: new Date().getMonth() };
  });

  // store에서 월 변경 신호가 오면 동기화 (연력 → 달력 이동)
  React.useEffect(() => {
    if (!data.monthViewDate) return;
    const p = data.monthViewDate.split('-');
    if (p.length >= 2) setYm({ y: +p[0], m: +p[1]-1 });
  }, [data.monthViewDate]);

  const firstDow = new Date(ym.y, ym.m, 1).getDay();
  const totalD   = daysInMonth(ym.y, ym.m);
  const today    = todayStr();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= totalD; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getKey = d => `${ym.y}-${String(ym.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const prev   = () => setYm(p => p.m === 0 ? { y:p.y-1, m:11 } : { y:p.y, m:p.m-1 });
  const next   = () => setYm(p => p.m === 11 ? { y:p.y+1, m:0 } : { y:p.y, m:p.m+1 });

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F2F2F7' }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, padding:'14px 24px',
        background:'rgba(255,255,255,0.72)',
        backdropFilter:'saturate(180%) blur(20px)',
        WebkitBackdropFilter:'saturate(180%) blur(20px)',
        borderBottom:'0.5px solid rgba(60,60,67,0.12)', flexShrink:0,
      }}>
        <button onClick={prev} style={apNavBtn}>‹</button>
        <span style={{ fontWeight:700, fontSize:22, letterSpacing:-0.5, minWidth:140, textAlign:'center', color:'#1C1C1E' }}>
          {ym.y}년 {MONTH_KO[ym.m]}
        </span>
        <button onClick={next} style={apNavBtn}>›</button>
        <button onClick={() => setYm({ y:new Date().getFullYear(), m:new Date().getMonth() })}
          style={{ marginLeft:6, padding:'6px 14px', border:'0.5px solid rgba(60,60,67,0.18)',
            borderRadius:10, background:'rgba(0,0,0,0.04)', cursor:'pointer',
            fontSize:13, fontWeight:500, color:'#3C3C43', fontFamily:'inherit' }}>오늘</button>
      </div>

      <div style={{ flex:1, padding:'16px 24px', overflow:'auto' }}>
        {/* DOW headers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
          {['일','월','화','수','목','금','토'].map((d,i) => (
            <div key={d} style={{ textAlign:'center', fontSize:12, fontWeight:600, padding:'5px 0',
              color: i===0?'#FF3B30':i===6?'#007AFF':'#8E8E93' }}>{d}</div>
          ))}
        </div>

        {Array.from({ length: cells.length/7 }, (_,wi) => (
          <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
            {cells.slice(wi*7, wi*7+7).map((d, di) => {
              if (!d) return <div key={`empty-${wi}-${di}`} />;
              const key  = getKey(d);
              const evts = data.events.filter(e => e.date === key);
              const isT  = key === today;
              const dow  = (firstDow + d - 1) % 7;
              return (
                <div key={d}
                  onClick={() => {
                    store.setDayViewDate(getKey(d));
                    window.__switchTab && window.__switchTab('day');
                  }}
                  style={{
                    minHeight:88, background:'#fff', borderRadius:14,
                    border: isT ? `2px solid ${theme.primary}` : '0.5px solid rgba(60,60,67,0.1)',
                    padding:'9px 9px 6px', cursor:'pointer', transition:'box-shadow .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                  <div style={{ fontWeight:isT?700:500, fontSize:14, marginBottom:4,
                    color: isT?theme.primary: dow===0?'#FF3B30':dow===6?'#007AFF':'#1C1C1E' }}>
                    {isT
                      ? <span style={{ background:theme.primary, color:'#fff', borderRadius:'50%',
                          width:24, height:24, display:'inline-flex', alignItems:'center',
                          justifyContent:'center', fontSize:12, fontWeight:700 }}>{d}</span>
                      : d}
                  </div>
                  {evts.slice(0,3).map(ev => (
                    <div key={ev.id} style={{ background:ev.color||theme.primary, color:'#fff',
                      borderRadius:5, padding:'2px 6px', fontSize:11, marginBottom:2,
                      overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
                      fontWeight:500 }}>{ev.title}</div>
                  ))}
                  {evts.length>3 && <div style={{ fontSize:10, color:'#8E8E93', marginTop:1 }}>+{evts.length-3}개 더</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── DayView ──────────────────────────────────────────────────
function DayView() {
  const SLOT_H = 28;
  const TIME_W = 56;

  const data    = useStore();
  const theme   = THEMES[data.theme] || THEMES.blue;
  const dateStr = data.dayViewDate || todayStr();
  const date    = parseDate(dateStr);
  const today   = todayStr();

  const [title, setTitle]         = React.useState('');
  const [isAllDay, setIsAllDay]   = React.useState(false);
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime]     = React.useState('10:00');
  const [color, setColor]         = React.useState(null);
  const [editId, setEditId]       = React.useState(null);
  const [editData, setEditData]   = React.useState({});
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragTop, setDragTop]     = React.useState(0);

  const dragRef  = React.useRef({ active:false, id:null, mouseY:0, origSlot:0, dur:0 });
  const movedRef = React.useRef(false);

  const goDay = delta => {
    const d = parseDate(dateStr); d.setDate(d.getDate() + delta);
    store.setDayViewDate(fmtDate(d));
  };

  const timeToSlot = t => {
    if (!t) return 0;
    const [h,m] = t.split(':').map(Number);
    return h * 2 + (m >= 30 ? 1 : 0);
  };
  const slotToTime = s => {
    s = Math.max(0, Math.min(47, s));
    return `${String(Math.floor(s/2)).padStart(2,'0')}:${s%2===0?'00':'30'}`;
  };

  const eventsToday = data.events.filter(e => e.date === dateStr);
  const allDayEvts  = eventsToday.filter(e => !e.startTime && !e.time);
  const timedEvts   = eventsToday.filter(e =>  e.startTime ||  e.time);
  const todosToday  = data.todos[dateStr] || [];

  const timeOptions = [];
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m += 30)
      timeOptions.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);

  const palette = [theme.primary,'#FF3B30','#FF9500','#FFCC00','#34C759','#5AC8FA','#AF52DE','#FF2D55'];
  const eventColor = color || theme.primary;

  const addEvent = () => {
    if (!title.trim()) return;
    if (isAllDay) {
      store.addEvent({ date:dateStr, title:title.trim(), color:eventColor });
    } else {
      const s = timeToSlot(startTime), e = timeToSlot(endTime);
      const et = e > s ? endTime : slotToTime(s + 2);
      store.addEvent({ date:dateStr, title:title.trim(), color:eventColor, startTime, endTime:et });
    }
    setTitle('');
  };

  const startEdit = ev => {
    const sSlot = timeToSlot(ev.startTime || ev.time || '09:00');
    setEditId(ev.id);
    setEditData({
      title:    ev.title,
      color:    ev.color || theme.primary,
      startTime: ev.startTime || ev.time || '09:00',
      endTime:   ev.endTime   || slotToTime(sSlot + 2),
      isAllDay: !ev.startTime && !ev.time,
    });
  };
  const saveEdit = () => {
    if (!editData.title.trim()) return;
    const upd = editData.isAllDay
      ? { title:editData.title.trim(), color:editData.color, startTime:undefined, endTime:undefined, time:undefined }
      : { title:editData.title.trim(), color:editData.color, startTime:editData.startTime, endTime:editData.endTime, time:undefined };
    store.updateEvent(editId, upd);
    setEditId(null);
  };

  // 드래그-이동
  React.useEffect(() => {
    const onMove = e => {
      if (!dragRef.current.active) return;
      const dy = e.clientY - dragRef.current.mouseY;
      if (Math.abs(dy) > 4) movedRef.current = true;
      const slotD = Math.round(dy / SLOT_H);
      const newSlot = Math.max(0, Math.min(47 - dragRef.current.dur + 1, dragRef.current.origSlot + slotD));
      setDragTop(newSlot * SLOT_H);
    };
    const onUp = e => {
      if (!dragRef.current.active) return;
      const dy = e.clientY - dragRef.current.mouseY;
      const slotD = Math.round(dy / SLOT_H);
      const { origSlot, dur, id } = dragRef.current;
      const newSlot = Math.max(0, Math.min(47 - dur + 1, origSlot + slotD));
      if (movedRef.current) {
        store.updateEvent(id, { startTime:slotToTime(newSlot), endTime:slotToTime(newSlot+dur), time:undefined });
      }
      dragRef.current.active = false;
      setDraggingId(null);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startDrag = (e, ev) => {
    e.preventDefault();
    movedRef.current = false;
    const sSlot = timeToSlot(ev.startTime || ev.time || '00:00');
    const eSlot = timeToSlot(ev.endTime   || slotToTime(sSlot + 2));
    const dur = Math.max(1, eSlot - sSlot);
    dragRef.current = { active:true, id:ev.id, mouseY:e.clientY, origSlot:sSlot, dur };
    setDraggingId(ev.id);
    setDragTop(sSlot * SLOT_H);
  };

  const gridH = 48 * SLOT_H;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F2F2F7' }}>

      {/* ── Header ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, padding:'14px 24px',
        background:'rgba(255,255,255,0.72)',
        backdropFilter:'saturate(180%) blur(20px)',
        WebkitBackdropFilter:'saturate(180%) blur(20px)',
        borderBottom:'0.5px solid rgba(60,60,67,0.12)', flexShrink:0,
      }}>
        <button onClick={() => goDay(-1)} style={apNavBtn}>‹</button>
        <div style={{ minWidth:220, textAlign:'center' }}>
          <div style={{ fontWeight:700, fontSize:19, letterSpacing:-0.3,
            color:dateStr===today?theme.primary:'#1C1C1E' }}>
            {date.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })}
          </div>
          <div style={{ fontSize:12, color:'#8E8E93' }}>{['일','월','화','수','목','금','토'][date.getDay()]}요일</div>
        </div>
        <button onClick={() => goDay(1)} style={apNavBtn}>›</button>
        <button onClick={() => store.setDayViewDate(today)} style={{
          marginLeft:6, padding:'6px 14px',
          border:'0.5px solid rgba(60,60,67,0.18)', borderRadius:10,
          background:'rgba(0,0,0,0.04)', cursor:'pointer',
          fontSize:13, fontWeight:500, color:'#3C3C43', fontFamily:'inherit',
        }}>오늘</button>
      </div>

      {/* ── 일정 추가 바 ── */}
      <div style={{
        background:'#fff', borderBottom:'0.5px solid rgba(60,60,67,0.1)',
        padding:'10px 18px', flexShrink:0,
        display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
      }}>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key==='Enter' && addEvent()}
          placeholder="새 일정..."
          style={{ flex:'1 1 140px', ...AP.input, fontSize:14, height:38, padding:'0 12px' }}
        />
        <button onClick={() => setIsAllDay(!isAllDay)} style={{
          flexShrink:0, padding:'0 13px', height:38, borderRadius:980,
          border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13,
          fontWeight:isAllDay?600:400,
          background:isAllDay?theme.primary:'rgba(0,0,0,0.06)',
          color:isAllDay?'#fff':'#1C1C1E', transition:'all .15s',
        }}>종일</button>
        {!isAllDay && (<>
          <select value={startTime} onChange={e => setStartTime(e.target.value)} style={{
            flexShrink:0, height:38, border:'0.5px solid rgba(60,60,67,0.18)',
            borderRadius:10, padding:'0 6px', fontSize:13, outline:'none',
            fontFamily:'inherit', background:'rgba(0,0,0,0.03)', color:'#1C1C1E', cursor:'pointer',
          }}>{timeOptions.map(t=><option key={t} value={t}>{t}</option>)}</select>
          <span style={{ fontSize:12, color:'#8E8E93', flexShrink:0 }}>~</span>
          <select value={endTime} onChange={e => setEndTime(e.target.value)} style={{
            flexShrink:0, height:38, border:'0.5px solid rgba(60,60,67,0.18)',
            borderRadius:10, padding:'0 6px', fontSize:13, outline:'none',
            fontFamily:'inherit', background:'rgba(0,0,0,0.03)', color:'#1C1C1E', cursor:'pointer',
          }}>{timeOptions.map(t=><option key={t} value={t}>{t}</option>)}</select>
        </>)}
        {palette.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{
            width:18, height:18, borderRadius:'50%', background:c,
            border:'none', cursor:'pointer', flexShrink:0,
            boxShadow:eventColor===c ? `0 0 0 2px #fff, 0 0 0 3.5px ${c}` : 'none',
            transition:'box-shadow .1s',
          }}/>
        ))}
        <button onClick={addEvent}
          onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'}
          onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
          style={{
            flexShrink:0, padding:'0 18px', height:38, border:'none',
            borderRadius:980, background:theme.primary, color:'#fff',
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>추가</button>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── 타임 그리드 ── */}
        <div style={{ flex:1, overflow:'auto', background:'#fff' }}>

          {/* 종일 행 */}
          {allDayEvts.length > 0 && (
            <div style={{
              display:'flex', alignItems:'center', gap:4,
              padding:'6px 4px 6px 0',
              borderBottom:'0.5px solid rgba(60,60,67,0.1)',
              background:'rgba(242,242,247,0.5)',
            }}>
              <div style={{ width:TIME_W, flexShrink:0, fontSize:10, color:'#8E8E93', textAlign:'right', paddingRight:8 }}>종일</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, flex:1 }}>
                {allDayEvts.map(ev => (
                  <div key={ev.id} onClick={() => startEdit(ev)} style={{
                    background:(ev.color||theme.primary)+'CC', borderRadius:6,
                    padding:'3px 10px', fontSize:12, fontWeight:600, color:'#fff',
                    display:'flex', alignItems:'center', gap:6, cursor:'pointer',
                  }}>
                    {ev.title}
                    <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();store.removeEvent(ev.id);}}
                      style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.8)',fontSize:14,lineHeight:1,padding:0 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시간 그리드 */}
          <div style={{ position:'relative', height:gridH, userSelect:'none' }}>

            {/* 시간선 + 레이블 */}
            {Array.from({length:25},(_,h) => (
              <div key={h} style={{
                position:'absolute', left:0, right:0, top:h*2*SLOT_H,
                borderTop:h===0?'none':'0.5px solid rgba(60,60,67,0.1)',
                pointerEvents:'none',
              }}>
                {h > 0 && h < 25 && (
                  <span style={{
                    position:'absolute', left:0, width:TIME_W-4,
                    fontSize:10, color:'#8E8E93', fontWeight:500,
                    textAlign:'right', transform:'translateY(-7px)',
                    display:'block', lineHeight:1,
                  }}>{String(h).padStart(2,'0')}:00</span>
                )}
              </div>
            ))}

            {/* 30분 점선 */}
            {Array.from({length:24},(_,h) => (
              <div key={`hf${h}`} style={{
                position:'absolute', left:TIME_W, right:0, top:(h*2+1)*SLOT_H,
                borderTop:'0.5px dashed rgba(60,60,67,0.07)', pointerEvents:'none',
              }}/>
            ))}

            {/* 세로 경계선 */}
            <div style={{ position:'absolute', left:TIME_W, top:0, bottom:0,
              borderLeft:'0.5px solid rgba(60,60,67,0.12)', pointerEvents:'none' }}/>

            {/* 일정 블록 */}
            {timedEvts.map(ev => {
              const isDrag = draggingId === ev.id;
              const sSlot  = timeToSlot(ev.startTime || ev.time || '00:00');
              const eSlot  = timeToSlot(ev.endTime   || slotToTime(sSlot + 2));
              const top    = isDrag ? dragTop : sSlot * SLOT_H;
              const height = Math.max(SLOT_H, (Math.max(eSlot, sSlot+1) - sSlot) * SLOT_H);
              const c      = ev.color || theme.primary;
              return (
                <div key={ev.id}
                  onMouseDown={e => startDrag(e, ev)}
                  onClick={e => { e.stopPropagation(); if (!movedRef.current) startEdit(ev); }}
                  style={{
                    position:'absolute', left:TIME_W+4, right:8,
                    top, height,
                    background:c+'20',
                    borderLeft:`3px solid ${c}`,
                    borderRadius:7,
                    padding:'4px 8px 4px 10px',
                    cursor:isDrag?'grabbing':'grab',
                    zIndex:isDrag?10:2,
                    boxShadow:isDrag?'0 6px 20px rgba(0,0,0,0.15)':'0 1px 3px rgba(0,0,0,0.05)',
                    transition:isDrag?'none':'box-shadow .15s',
                    overflow:'hidden',
                  }}>
                  <div style={{ fontSize:12, fontWeight:600, color:c,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</div>
                  {height >= SLOT_H * 1.5 && (
                    <div style={{ fontSize:10, color:c+'AA', marginTop:1 }}>
                      {(ev.startTime||ev.time||'')+' – '+(ev.endTime||'')}
                    </div>
                  )}
                  <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();store.removeEvent(ev.id);}}
                    style={{ position:'absolute',top:2,right:4,background:'none',border:'none',
                      cursor:'pointer',color:'rgba(60,60,67,0.3)',fontSize:15,lineHeight:1,padding:0 }}>×</button>
                </div>
              );
            })}

            {/* 현재 시간 표시선 */}
            {dateStr===today&&(()=>{
              const now = new Date();
              const top = (now.getHours()*2 + (now.getMinutes()>=30?1:0)) * SLOT_H
                        + (now.getMinutes()%30/30) * SLOT_H;
              return (
                <div style={{ position:'absolute',left:TIME_W-5,right:0,top:top-1,
                  height:2,background:theme.primary,zIndex:5,pointerEvents:'none' }}>
                  <div style={{ position:'absolute',left:0,top:-4,
                    width:10,height:10,borderRadius:'50%',background:theme.primary }}/>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── 사이드바: 할 일 ── */}
        <div style={{ width:272, borderLeft:'0.5px solid rgba(60,60,67,0.12)', padding:'16px 18px',
          background:'rgba(255,255,255,0.7)', backdropFilter:'blur(10px)', flexShrink:0, overflow:'auto' }}>
          <ChecklistPanel date={dateStr} todos={todosToday} theme={theme} />
        </div>
      </div>

      {/* ── 편집 모달 ── */}
      {editId && (
        <div onClick={() => setEditId(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.28)',
          backdropFilter:'blur(4px)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:200,
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:'#fff', borderRadius:20, padding:'24px',
            width:360, maxWidth:'calc(100vw - 32px)',
            boxShadow:'0 20px 60px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontWeight:700, fontSize:17, marginBottom:16, color:'#1C1C1E' }}>일정 편집</div>
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              <input autoFocus value={editData.title}
                onChange={e=>setEditData({...editData,title:e.target.value})}
                onKeyDown={e=>e.key==='Enter'&&saveEdit()}
                style={{ flex:1, ...AP.input, fontSize:15 }}/>
              <button onClick={()=>setEditData({...editData,isAllDay:!editData.isAllDay})} style={{
                flexShrink:0, padding:'0 14px', height:42, borderRadius:980,
                border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13,
                fontWeight:editData.isAllDay?600:400,
                background:editData.isAllDay?theme.primary:'rgba(0,0,0,0.06)',
                color:editData.isAllDay?'#fff':'#1C1C1E',
              }}>종일</button>
            </div>
            {!editData.isAllDay && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <select value={editData.startTime} onChange={e=>setEditData({...editData,startTime:e.target.value})} style={{
                  flex:1, height:42, border:'0.5px solid rgba(60,60,67,0.18)', borderRadius:10,
                  padding:'0 8px', fontSize:14, outline:'none', fontFamily:'inherit',
                  background:'rgba(0,0,0,0.03)', color:'#1C1C1E', cursor:'pointer',
                }}>{timeOptions.map(t=><option key={t} value={t}>{t}</option>)}</select>
                <span style={{ color:'#8E8E93', flexShrink:0 }}>~</span>
                <select value={editData.endTime} onChange={e=>setEditData({...editData,endTime:e.target.value})} style={{
                  flex:1, height:42, border:'0.5px solid rgba(60,60,67,0.18)', borderRadius:10,
                  padding:'0 8px', fontSize:14, outline:'none', fontFamily:'inherit',
                  background:'rgba(0,0,0,0.03)', color:'#1C1C1E', cursor:'pointer',
                }}>{timeOptions.map(t=><option key={t} value={t}>{t}</option>)}</select>
              </div>
            )}
            <div style={{ display:'flex', gap:6, marginBottom:18 }}>
              {palette.map(c=>(
                <button key={c} onClick={()=>setEditData({...editData,color:c})} style={{
                  width:24, height:24, borderRadius:'50%', background:c,
                  border:'none', cursor:'pointer',
                  boxShadow:editData.color===c?`0 0 0 2px #fff, 0 0 0 3.5px ${c}`:'none',
                  transition:'box-shadow .1s',
                }}/>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{store.removeEvent(editId);setEditId(null);}} style={{
                ...AP.btnGhost, flex:1, textAlign:'center', borderRadius:12, color:'#FF3B30',
              }}>삭제</button>
              <button onClick={()=>setEditId(null)} style={{ ...AP.btnGhost, flex:1, textAlign:'center', borderRadius:12 }}>취소</button>
              <button onClick={saveEdit} style={{ ...AP.btn(theme.primary), flex:1, textAlign:'center', borderRadius:12 }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ChecklistPanel ───────────────────────────────────────────
function ChecklistPanel({ date, todos, theme }) {
  const [input, setInput]     = React.useState('');
  const [editId, setEditId]   = React.useState(null);
  const [editTxt, setEditTxt] = React.useState('');

  // 전날 미완료 할일 자동 이전
  React.useEffect(() => {
    const d = parseDate(date);
    d.setDate(d.getDate() - 1);
    store.rolloverTodos(fmtDate(d), date);
  }, [date]);

  const done = todos.filter(t => t.done).length;
  const add = () => { if (!input.trim()) return; store.addTodo(date, input.trim()); setInput(''); };

  return (
    <div>
      <div style={AP.label}>할 일</div>

      {todos.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#8E8E93', marginBottom:5 }}>
            <span>{done}/{todos.length}</span>
            <span>{Math.round(done/todos.length*100)}%</span>
          </div>
          <div style={{ height:4, background:'rgba(0,0,0,0.07)', borderRadius:2 }}>
            <div style={{ height:'100%', background:theme.primary,
              width:`${done/todos.length*100}%`, borderRadius:2, transition:'width .4s' }}/>
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
          placeholder="새 할 일..."
          style={{ ...AP.input, fontSize:14, padding:'9px 12px', flex:1, width:'auto' }}/>
        <button onClick={add} style={{
          background:theme.primary, color:'#fff', border:'none', borderRadius:12,
          padding:'9px 14px', cursor:'pointer', fontSize:16, fontFamily:'inherit', lineHeight:1 }}>+</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {todos.map(t => (
          <div key={t.id} style={{
            display:'flex', alignItems:'center', gap:8, padding:'9px 10px',
            borderRadius:12, background:t.done?'rgba(0,0,0,0.03)':'#fff',
            border:'0.5px solid rgba(60,60,67,0.1)',
            opacity:t.done?0.65:1, transition:'opacity .2s',
          }}>
            <button onClick={()=>store.toggleTodo(date,t.id)} style={{
              width:20, height:20, borderRadius:'50%', flexShrink:0, cursor:'pointer',
              border:`2px solid ${t.done?theme.primary:'rgba(60,60,67,0.25)'}`,
              background:t.done?theme.primary:'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {t.done && <span style={{ color:'#fff',fontSize:10,lineHeight:1,fontWeight:700 }}>✓</span>}
            </button>
            {editId===t.id
              ? <input autoFocus value={editTxt} onChange={e=>setEditTxt(e.target.value)}
                  onBlur={()=>{store.updateTodoText(date,t.id,editTxt);setEditId(null);}}
                  onKeyDown={e=>{if(e.key==='Enter'){store.updateTodoText(date,t.id,editTxt);setEditId(null);}if(e.key==='Escape')setEditId(null);}}
                  style={{ flex:1,border:'none',outline:'none',fontSize:14,fontFamily:'inherit',background:'transparent',color:'#1C1C1E' }}/>
              : <span onDoubleClick={()=>{setEditId(t.id);setEditTxt(t.text);}}
                  style={{ flex:1,fontSize:14,textDecoration:t.done?'line-through':'none',
                    color:t.done?'#8E8E93':'#1C1C1E',wordBreak:'break-word',cursor:'default' }}>{t.text}</span>}
            {t.rolledFrom && (
              <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,149,0,0.9)',
                background:'rgba(255,149,0,0.12)', borderRadius:4, padding:'1px 5px',
                flexShrink:0, letterSpacing:0.2, whiteSpace:'nowrap' }}>밀림</span>
            )}
            <button onClick={()=>store.deleteTodo(date,t.id)} style={{
              border:'none',background:'none',cursor:'pointer',
              color:'rgba(60,60,67,0.25)',fontSize:17,lineHeight:1,padding:0,flexShrink:0 }}>×</button>
          </div>
        ))}
        {todos.length===0 && (
          <div style={{ textAlign:'center',color:'#C7C7CC',fontSize:13,padding:'24px 0' }}>할 일이 없습니다 🎉</div>
        )}
      </div>
    </div>
  );
}

// ─── ChecklistView (tab) ──────────────────────────────────────
function ChecklistView() {
  const data  = useStore();
  const theme = THEMES[data.theme];
  const [sel, setSel] = React.useState(todayStr());
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',background:'#F2F2F7' }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 24px',
        background:'rgba(255,255,255,0.72)',
        backdropFilter:'saturate(180%) blur(20px)',
        WebkitBackdropFilter:'saturate(180%) blur(20px)',
        borderBottom:'0.5px solid rgba(60,60,67,0.12)',flexShrink:0 }}>
        <span style={{ fontWeight:700,fontSize:20,color:'#1C1C1E' }}>체크리스트</span>
        <input type="date" value={sel} onChange={e=>setSel(e.target.value)}
          style={{ border:'0.5px solid rgba(60,60,67,0.18)',borderRadius:10,padding:'7px 12px',
            fontSize:14,outline:'none',fontFamily:'inherit',background:'rgba(0,0,0,0.04)',color:'#1C1C1E' }}/>
        <button onClick={()=>setSel(todayStr())} style={{ padding:'7px 14px',
          border:'0.5px solid rgba(60,60,67,0.18)',borderRadius:10,
          background:'rgba(0,0,0,0.04)',cursor:'pointer',fontSize:13,fontWeight:500,color:'#3C3C43',fontFamily:'inherit' }}>오늘</button>
      </div>
      <div style={{ flex:1,overflow:'auto',padding:'28px 24px',maxWidth:520 }}>
        <ChecklistPanel date={sel} todos={data.todos[sel]||[]} theme={theme} />
      </div>
    </div>
  );
}

// ─── MandalaView ──────────────────────────────────────────────
function MandalaView() {
  const data  = useStore();
  const theme = THEMES[data.theme];
  const cells = data.mandala.cells;

  const blockCenters = [10,13,16,37,40,43,64,67,70];
  const surroundMap  = { 30:0,31:1,32:2,39:3,41:5,48:6,49:7,50:8 };

  const update = (idx, val) => {
    store.setMandalaCell(idx, val);
    if (surroundMap[idx]!==undefined) store.setMandalaCell(blockCenters[surroundMap[idx]], val);
    else {
      const pos = blockCenters.indexOf(idx);
      if (pos!==-1 && idx!==40) {
        const k = Object.keys(surroundMap).find(k=>surroundMap[k]===pos);
        if (k) store.setMandalaCell(Number(k), val);
      }
    }
  };

  const getCellStyle = (row, col) => {
    const idx  = row*9+col;
    const bIdx = Math.floor(row/3)*3+Math.floor(col/3);
    const isCenter      = idx===40;
    const isCenterBlock = bIdx===4;
    const isBlockCenter = blockCenters.includes(idx);
    return {
      bg:    isCenter ? theme.primary : isBlockCenter ? theme.bg : isCenterBlock ? 'rgba(0,0,0,0.02)' : '#fff',
      color: isCenter ? '#fff' : isBlockCenter ? theme.text : '#1C1C1E',
      fw:    isCenter||isBlockCenter ? 700 : 400,
      fs:    isCenter ? 12 : 10,
    };
  };

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',background:'#F2F2F7' }}>
      <div style={{ padding:'14px 24px',
        background:'rgba(255,255,255,0.72)',
        backdropFilter:'saturate(180%) blur(20px)',
        WebkitBackdropFilter:'saturate(180%) blur(20px)',
        borderBottom:'0.5px solid rgba(60,60,67,0.12)',
        flexShrink:0,display:'flex',alignItems:'center',gap:16 }}>
        <span style={{ fontWeight:700,fontSize:20,color:'#1C1C1E' }}>만다라트</span>
        <span style={{ fontSize:13,color:'#8E8E93' }}>중앙 핵심 목표 → 8개 세부 목표 → 각 실행 계획</span>
        <button onClick={()=>{ if(window.confirm('초기화할까요?')){ store.data.mandala={cells:Array(81).fill('')}; store._save(); } }}
          style={{ marginLeft:'auto',padding:'5px 12px',border:'0.5px solid rgba(60,60,67,0.18)',borderRadius:8,
            background:'rgba(0,0,0,0.04)',cursor:'pointer',fontSize:12,color:'#8E8E93',fontFamily:'inherit' }}>초기화</button>
      </div>
      <div style={{ flex:1,overflow:'auto',display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
        <div style={{ borderRadius:16, overflow:'hidden',
          boxShadow:'0 2px 0 rgba(60,60,67,0.06), 0 8px 40px rgba(0,0,0,0.1)',
          border:'0.5px solid rgba(60,60,67,0.12)' }}>
          {Array.from({length:9},(_,row) => (
            <div key={row} style={{ display:'flex' }}>
              {Array.from({length:9},(_,col) => {
                const idx = row*9+col;
                const s   = getCellStyle(row,col);
                return (
                  <div key={col} style={{
                    width:72,height:72,background:s.bg,
                    borderRight: col%3===2&&col<8 ? '1.5px solid rgba(60,60,67,0.2)' : '0.5px solid rgba(60,60,67,0.08)',
                    borderBottom: row%3===2&&row<8 ? '1.5px solid rgba(60,60,67,0.2)' : '0.5px solid rgba(60,60,67,0.08)',
                  }}>
                    <textarea value={cells[idx]} onChange={e=>update(idx,e.target.value)}
                      placeholder={idx===40?'핵심 목표':''}
                      style={{ width:'100%',height:'100%',border:'none',background:'transparent',
                        resize:'none',outline:'none',fontSize:s.fs,fontWeight:s.fw,
                        color:s.color,textAlign:'center',fontFamily:'inherit',
                        padding:4,lineHeight:1.35,cursor:'text' }}/>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TenMinutePlanner ─────────────────────────────────────────
const TMP_KEY = 'ten_min_planner_v3';
const TASK_COLORS = ['#007AFF','#FF3B30','#34C759','#FF9500','#AF52DE','#FF2D55','#5AC8FA','#FFCC00','#30B0C7','#32ADE6'];

function loadTmpData(ds) {
  try { const r = localStorage.getItem(TMP_KEY+'_'+ds); if (r) return JSON.parse(r); } catch(e){}
  return {
    todo:'', comment:'', totalTime:'', memo:'',
    tasks: Array.from({length:18},(_,i)=>({ id:i, text:'', done:false, color:TASK_COLORS[i%TASK_COLORS.length] })),
    grid: {},
  };
}
function saveTmpData(ds, d) { try { localStorage.setItem(TMP_KEY+'_'+ds, JSON.stringify(d)); } catch(e){} }

function TenMinutePlanner() {
  const data  = useStore();
  const theme = THEMES[data.theme];
  const [dateStr, setDateStr] = React.useState(todayStr());
  const [pData, setPData]     = React.useState(() => loadTmpData(todayStr()));
  const [activeTask, setActiveTask] = React.useState(null);
  const isPaintingRef = React.useRef(false); // ref 사용 — React state 비동기 갱신 문제 해결
  const [erasing, setErasing] = React.useState(false);
  const erasingRef = React.useRef(false);

  React.useEffect(() => { setPData(loadTmpData(dateStr)); setActiveTask(null); }, [dateStr]);

  // erasing state를 ref와 동기화
  React.useEffect(() => { erasingRef.current = erasing; }, [erasing]);

  // 드래그 중 window에서 mouseup이 발생해도 페인팅 멈춤
  React.useEffect(() => {
    const stop = () => { isPaintingRef.current = false; };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const update = patch => {
    const d = { ...pData, ...patch };
    setPData(d); saveTmpData(dateStr, d);
  };

  const setTask = (idx, field, val) => {
    const tasks = [...pData.tasks];
    tasks[idx] = { ...tasks[idx], [field]:val };
    update({ tasks });
  };

  const paintCell = (h, s) => {
    const key  = `${h}_${s}`;
    const grid = { ...pData.grid };
    if (erasingRef.current) { delete grid[key]; }
    else if (activeTask!==null) { grid[key] = activeTask; }
    update({ grid });
  };

  const HOURS = Array.from({length:18},(_,i)=>i+6);
  const taskMinutes = pData.tasks.map((_,ti)=>
    Object.values(pData.grid).filter(v=>v===ti).length*10
  );

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',background:'#F2F2F7' }}>
      {/* Header */}
      <div style={{ background:'rgba(255,255,255,0.72)',
        backdropFilter:'saturate(180%) blur(20px)',
        WebkitBackdropFilter:'saturate(180%) blur(20px)',
        borderBottom:'0.5px solid rgba(60,60,67,0.12)',
        padding:'10px 24px',flexShrink:0,display:'flex',flexDirection:'column',gap:8 }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <span style={{ fontWeight:700,fontSize:18,color:'#1C1C1E' }}>10분 플래너</span>
          <input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)}
            style={{ border:'0.5px solid rgba(60,60,67,0.18)',borderRadius:10,padding:'6px 10px',
              fontSize:13,outline:'none',fontFamily:'inherit',background:'rgba(0,0,0,0.04)',color:'#1C1C1E' }}/>
          <button onClick={()=>setDateStr(todayStr())} style={{ padding:'6px 13px',
            border:'0.5px solid rgba(60,60,67,0.18)',borderRadius:10,
            background:'rgba(0,0,0,0.04)',cursor:'pointer',fontSize:12,fontWeight:500,color:'#3C3C43',fontFamily:'inherit' }}>오늘</button>
          <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:11,color:'#8E8E93' }}>TO-DO</span>
            <input value={pData.todo} onChange={e=>update({todo:e.target.value})}
              placeholder="오늘의 핵심 목표..."
              style={{ width:240,border:'none',borderBottom:'0.5px solid rgba(60,60,67,0.25)',
                padding:'3px 4px',fontSize:13,outline:'none',fontFamily:'inherit',background:'transparent',color:'#1C1C1E' }}/>
          </div>
        </div>
        <div style={{ display:'flex',gap:20,alignItems:'center' }}>
          {[['COMMENT','comment',320],['TOTAL TIME','totalTime',120]].map(([lbl,k,w])=>(
            <div key={k} style={{ display:'flex',alignItems:'center',gap:7 }}>
              <span style={{ fontSize:9,fontWeight:700,color:'#8E8E93',letterSpacing:1,textTransform:'uppercase',whiteSpace:'nowrap' }}>{lbl}</span>
              <input value={pData[k]} onChange={e=>update({[k]:e.target.value})}
                style={{ width:w,border:'none',borderBottom:'0.5px solid rgba(60,60,67,0.2)',
                  padding:'2px 4px',fontSize:13,outline:'none',fontFamily:'inherit',background:'transparent',color:'#1C1C1E' }}/>
            </div>
          ))}
          <div style={{ marginLeft:'auto',display:'flex',gap:6 }}>
            <button onClick={()=>setErasing(false)} style={{
              padding:'5px 12px',borderRadius:8,border:'none',fontSize:12,cursor:'pointer',fontFamily:'inherit',
              background:!erasing?theme.primary:'rgba(0,0,0,0.05)',
              color:!erasing?'#fff':'#3C3C43',transition:'all .15s' }}>🖊 채우기</button>
            <button onClick={()=>setErasing(true)} style={{
              padding:'5px 12px',borderRadius:8,border:'none',fontSize:12,cursor:'pointer',fontFamily:'inherit',
              background:erasing?'#FF3B30':'rgba(0,0,0,0.05)',
              color:erasing?'#fff':'#3C3C43',transition:'all .15s' }}>🧹 지우기</button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1,overflow:'auto',display:'flex' }}>
        {/* Tasks */}
        <div style={{ width:280,borderRight:'0.5px solid rgba(60,60,67,0.12)',
          background:'#fff',display:'flex',flexDirection:'column',flexShrink:0 }}>
          <div style={{ padding:'9px 14px',borderBottom:'0.5px solid rgba(60,60,67,0.1)',
            ...AP.label, marginBottom:0 }}>TASKS</div>
          <div style={{ flex:1,overflow:'auto' }}>
            {pData.tasks.map((task,ti)=>(
              <div key={ti} onClick={()=>{setErasing(false);setActiveTask(activeTask===ti?null:ti);}}
                style={{
                  display:'flex',alignItems:'center',gap:7,
                  padding:'6px 12px',borderBottom:'0.5px solid rgba(60,60,67,0.06)',
                  cursor:'pointer',transition:'background .1s',
                  background:activeTask===ti?`${task.color}15`:'transparent',
                  outline:activeTask===ti?`2px solid ${task.color}30`:'none',
                  outlineOffset:-2,
                }}>
                <span style={{ fontSize:10,color:'#C7C7CC',width:16,flexShrink:0,textAlign:'right' }}>{ti+1}</span>
                <input type="color" value={task.color}
                  onChange={e=>{e.stopPropagation();setTask(ti,'color',e.target.value);}}
                  onClick={e=>e.stopPropagation()}
                  style={{ width:18,height:18,border:'none',padding:0,borderRadius:5,cursor:'pointer',
                    background:'none',flexShrink:0 }}/>
                <button onClick={e=>{e.stopPropagation();setTask(ti,'done',!task.done);}}
                  style={{ width:18,height:18,borderRadius:5,flexShrink:0,cursor:'pointer',
                    border:`1.5px solid ${task.done?task.color:'rgba(60,60,67,0.2)'}`,
                    background:task.done?task.color:'transparent',
                    display:'flex',alignItems:'center',justifyContent:'center' }}>
                  {task.done&&<span style={{color:'#fff',fontSize:9,lineHeight:1,fontWeight:700}}>✓</span>}
                </button>
                <input value={task.text} onChange={e=>{e.stopPropagation();setTask(ti,'text',e.target.value);}}
                  onClick={e=>e.stopPropagation()} placeholder={`Task ${ti+1}`}
                  style={{ flex:1,border:'none',outline:'none',fontSize:12,fontFamily:'inherit',
                    background:'transparent',textDecoration:task.done?'line-through':'none',
                    color:task.done?'#8E8E93':'#1C1C1E' }}/>
                {taskMinutes[ti]>0&&(
                  <span style={{ fontSize:10,color:task.color,fontWeight:600,flexShrink:0 }}>{taskMinutes[ti]}분</span>
                )}
              </div>
            ))}
          </div>
          {/* Memo */}
          <div style={{ borderTop:'0.5px solid rgba(60,60,67,0.12)',padding:'10px 12px' }}>
            <div style={{ ...AP.label, marginBottom:6 }}>MEMO</div>
            <textarea value={pData.memo} onChange={e=>update({memo:e.target.value})}
              placeholder="메모..."
              style={{ width:'100%',height:80,border:'0.5px solid rgba(60,60,67,0.12)',borderRadius:10,
                padding:'8px 10px',fontSize:12,fontFamily:'inherit',outline:'none',
                resize:'none',background:'rgba(0,0,0,0.02)',color:'#1C1C1E' }}/>
          </div>
        </div>

        {/* Timetable */}
        <div style={{ flex:1,overflow:'auto',background:'#fff' }}>
          {/* Header */}
          <div style={{ display:'flex',borderBottom:'1.5px solid rgba(60,60,67,0.15)',
            position:'sticky',top:0,background:'rgba(255,255,255,0.95)',
            backdropFilter:'blur(10px)',zIndex:5 }}>
            <div style={{ width:56,flexShrink:0,borderRight:'1.5px solid rgba(60,60,67,0.15)',
              padding:'7px 4px',fontSize:10,fontWeight:700,color:'#8E8E93',
              letterSpacing:1,textAlign:'center',textTransform:'uppercase' }}>TIME</div>
            {Array.from({length:6},(_,s)=>(
              <div key={s} style={{ flex:1,textAlign:'center',padding:'7px 0',
                fontSize:10,color:'#8E8E93',fontWeight:500,
                borderLeft:'0.5px solid rgba(60,60,67,0.08)' }}>:{s*10}</div>
            ))}
          </div>

          <div onMouseLeave={()=>{ isPaintingRef.current = false; }}>
            {HOURS.map(h=>(
              <div key={h} style={{ display:'flex',borderBottom:'0.5px solid rgba(60,60,67,0.06)' }}>
                <div style={{ width:56,flexShrink:0,borderRight:'1.5px solid rgba(60,60,67,0.1)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:12,color:'#8E8E93',fontWeight:500,
                  background:'rgba(242,242,247,0.5)' }}>
                  {String(h).padStart(2,'0')}:00
                </div>
                {Array.from({length:6},(_,s)=>{
                  const ck = `${h}_${s}`;
                  const ti = pData.grid[ck];
                  const tc = ti!==undefined ? pData.tasks[ti]?.color : null;
                  return (
                    <div key={s}
                      onMouseDown={()=>{ isPaintingRef.current = true; paintCell(h,s); }}
                      onMouseEnter={()=>{ if(isPaintingRef.current) paintCell(h,s); }}
                      onMouseUp={()=>{ isPaintingRef.current = false; }}
                      style={{
                        flex:1,height:34,
                        background:tc||'transparent',
                        borderLeft:s===0?'0.5px solid rgba(60,60,67,0.08)':'0.5px solid rgba(60,60,67,0.04)',
                        cursor:'crosshair',transition:'background .06s',
                        position:'relative',
                      }}>
                      {tc&&ti!==undefined&&pData.tasks[ti]?.text&&s===0&&(
                        <div style={{
                          position:'absolute',left:3,top:'50%',transform:'translateY(-50%)',
                          fontSize:9,color:'rgba(255,255,255,0.85)',fontWeight:600,
                          pointerEvents:'none',whiteSpace:'nowrap',overflow:'hidden',maxWidth:80,
                        }}>{pData.tasks[ti].text}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MonthView, DayView, ChecklistView, ChecklistPanel, MandalaView, TenMinutePlanner });
