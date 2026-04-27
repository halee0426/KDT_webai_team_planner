
// ─── Constants ────────────────────────────────────────────────
const THEMES = {
  blue:   { name:'블루',   primary:'#0066cc', bg:'rgba(0,102,204,0.1)',   ring:'#0071e3', text:'#0066cc' },
  purple: { name:'퍼플',   primary:'#AF52DE', bg:'rgba(175,82,222,0.1)',  ring:'#C97AEF', text:'#7B2EA8' },
  pink:   { name:'핑크',   primary:'#FF2D55', bg:'rgba(255,45,85,0.1)',   ring:'#FF6B87', text:'#CC0033' },
  orange: { name:'오렌지', primary:'#FF9500', bg:'rgba(255,149,0,0.1)',   ring:'#FFB74D', text:'#CC7700' },
  green:  { name:'그린',   primary:'#34C759', bg:'rgba(52,199,89,0.1)',   ring:'#6DD98A', text:'#1A8A3A' },
  gray:   { name:'그레이', primary:'#636366', bg:'rgba(99,99,102,0.1)',   ring:'#AEAEB2', text:'#3C3C43' },
};

const HIGHLIGHT_COLORS = [
  { name:'레드',   value:'rgba(255,59,48,0.38)'  },
  { name:'오렌지', value:'rgba(255,149,0,0.42)'  },
  { name:'노랑',   value:'rgba(255,204,0,0.5)'   },
  { name:'그린',   value:'rgba(52,199,89,0.38)'  },
  { name:'블루',   value:'rgba(0,122,255,0.32)'  },
  { name:'퍼플',   value:'rgba(175,82,222,0.38)' },
];

const DAY_KO  = ['일','월','화','수','목','금','토'];
const MONTH_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Utils ────────────────────────────────────────────────────
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDate(s) {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function totalDaysInYear(y) {
  return isLeapYear(y) ? 366 : 365;
}
function todayStr() {
  return fmtDate(new Date());
}

// ─── Store ────────────────────────────────────────────────────
const STORE_KEY = 'annual_planner_v3';

function loadData() {
  try {
    const s = localStorage.getItem(STORE_KEY);
    if (s) {
      const d = JSON.parse(s);
      if (!THEMES[d.theme]) d.theme = 'blue';
      return d;
    }
  } catch(e) {}
  return {
    year: 2026,
    theme: 'blue',
    events: [],
    highlights: [],
    todos: {},
    mandala: { cells: Array(81).fill('') },
    dayViewDate: todayStr(),
    monthViewDate: todayStr().slice(0,7),
  };
}

class PlannerStore {
  constructor() {
    this.data = loadData();
    this._listeners = [];
  }
  subscribe(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }
  _save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch(e) {}
    const snap = {...this.data};
    this._listeners.forEach(fn => fn(snap));
  }

  setYear(y)    { this.data.year = y;    this._save(); }
  setTheme(t)   { this.data.theme = t;   this._save(); }
  setDayViewDate(d)   { this.data.dayViewDate = d;   this._save(); }
  setMonthViewDate(m) { this.data.monthViewDate = m; this._save(); }

  // Events
  addEvent(ev) {
    this.data.events = [...this.data.events, { id: Date.now()+'_'+Math.random(), ...ev }];
    this._save();
  }
  removeEvent(id) {
    this.data.events = this.data.events.filter(e => e.id !== id);
    this._save();
  }
  updateEvent(id, updates) {
    this.data.events = this.data.events.map(e => e.id === id ? {...e,...updates} : e);
    this._save();
  }

  // Highlights
  addHighlight(h) {
    this.data.highlights = [...this.data.highlights, { id: Date.now()+'_'+Math.random(), ...h }];
    this._save();
  }
  removeHighlight(id) {
    this.data.highlights = this.data.highlights.filter(h => h.id !== id);
    this._save();
  }
  updateHighlightLabel(id, label) {
    this.data.highlights = this.data.highlights.map(h => h.id === id ? {...h, label} : h);
    this._save();
  }

  // 미완료 할일을 다음날로 자동 이전
  rolloverTodos(fromDate, toDate) {
    const fromList = this.data.todos[fromDate] || [];
    const toList   = this.data.todos[toDate]   || [];
    const incomplete = fromList.filter(t => !t.done);
    if (!incomplete.length) return;
    const alreadyRolled = new Set(toList.filter(t => t.rolledFrom === fromDate).map(t => t.rolledId));
    const toAdd = incomplete.filter(t => !alreadyRolled.has(t.id));
    if (!toAdd.length) return;
    const todos = { ...this.data.todos };
    todos[toDate] = [
      ...toList,
      ...toAdd.map(t => ({
        id: Date.now() + '_' + Math.random(),
        text: t.text, done: false,
        rolledFrom: fromDate, rolledId: t.id,
      })),
    ];
    this.data.todos = todos;
    this._save();
  }

  // Todos
  addTodo(date, text) {
    const todos = {...this.data.todos};
    if (!todos[date]) todos[date] = [];
    todos[date] = [...todos[date], { id: Date.now(), text, done: false }];
    this.data.todos = todos;
    this._save();
  }
  toggleTodo(date, id) {
    const todos = {...this.data.todos};
    if (todos[date]) {
      todos[date] = todos[date].map(t => t.id === id ? {...t, done: !t.done} : t);
      this.data.todos = todos;
      this._save();
    }
  }
  deleteTodo(date, id) {
    const todos = {...this.data.todos};
    if (todos[date]) {
      todos[date] = todos[date].filter(t => t.id !== id);
      this.data.todos = todos;
      this._save();
    }
  }
  updateTodoText(date, id, text) {
    const todos = {...this.data.todos};
    if (todos[date]) {
      todos[date] = todos[date].map(t => t.id === id ? {...t, text} : t);
      this.data.todos = todos;
      this._save();
    }
  }

  // Mandala
  setMandalaCell(idx, val) {
    const cells = [...this.data.mandala.cells];
    cells[idx] = val;
    this.data.mandala = { cells };
    this._save();
  }
}

const store = new PlannerStore();

function useStore() {
  const [data, setData] = React.useState(store.data);
  React.useEffect(() => store.subscribe(d => setData({...d})), []);
  return data;
}

Object.assign(window, {
  store, useStore,
  THEMES, HIGHLIGHT_COLORS, DAY_KO, MONTH_KO, MONTH_SHORT,
  fmtDate, parseDate, daysInMonth, isLeapYear, totalDaysInYear, todayStr,
});
