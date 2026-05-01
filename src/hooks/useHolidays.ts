import { useEffect, useState } from 'react';
import { fetchHolidays } from '@/lib/holidays';

// 달력·일력용 — 특정 연월의 공휴일 (Map<일, 공휴일명>)
export function useHolidays(year: number, month: number): Map<number, string> {
  const [holidays, setHolidays] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    fetchHolidays(year, month).then(setHolidays).catch(console.error);
  }, [year, month]);

  return holidays;
}

// 연력용 — 한 해 전체 공휴일 (Map<"월인덱스-일", 공휴일명>)
export function useYearHolidays(year: number): Map<string, string> {
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    Promise.all(
      Array.from({ length: 12 }, (_, m) => fetchHolidays(year, m))
    ).then((results) => {
      const merged = new Map<string, string>();
      results.forEach((monthMap, m) => {
        monthMap.forEach((name, day) => merged.set(`${m}-${day}`, name));
      });
      setHolidays(merged);
    }).catch(console.error);
  }, [year]);

  return holidays;
}
