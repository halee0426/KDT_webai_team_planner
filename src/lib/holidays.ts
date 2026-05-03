// 공공데이터포털 공휴일 API (SpcdeInfoService/getRestDeInfo)
// .env.local에 VITE_HOLIDAY_API_KEY=인증키(Decoding) 를 설정하세요

const BASE = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';
const cache = new Map<string, Map<number, string>>();

interface HolidayItem {
  dateName: string;
  locdate: number; // YYYYMMDD
  isHoliday: string;
}

export async function fetchHolidays(year: number, month: number): Promise<Map<number, string>> {
  const key = `${year}-${month}`;
  if (cache.has(key)) return cache.get(key)!;

  const serviceKey = import.meta.env.VITE_HOLIDAY_API_KEY;
  if (!serviceKey || serviceKey === 'your_decoded_service_key_here') return new Map();

  const mm = String(month + 1).padStart(2, '0');
  const url = `${BASE}?ServiceKey=${serviceKey}&solYear=${year}&solMonth=${mm}&_type=json&numOfRows=30`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const raw = json?.response?.body?.items?.item;
    const result = new Map<number, string>();
    if (raw) {
      const items: HolidayItem[] = Array.isArray(raw) ? raw : [raw];
      items.forEach((item) => {
        if (item.isHoliday === 'Y') {
          const day = Number(String(item.locdate).slice(6, 8));
          result.set(day, item.dateName);
        }
      });
    }
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, new Map());
    return new Map();
  }
}
