import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

const JSON_DAY_TO_DOW: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const DOW_TO_JSON = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function jsonWorkingHoursToSiteRows(
  siteId: string,
  json: unknown,
): Prisma.SiteWorkingHourCreateManyInput[] {
  const out: Prisma.SiteWorkingHourCreateManyInput[] = [];
  if (!json || typeof json !== 'object') return out;
  const o = json as Record<string, unknown>;
  for (const [key, val] of Object.entries(o)) {
    const dow = JSON_DAY_TO_DOW[key];
    if (dow === undefined) continue;
    if (!Array.isArray(val)) continue;
    for (const range of val) {
      if (typeof range !== 'string') continue;
      const parts = range.split('-').map((x) => x.trim());
      const a = parts[0];
      const b = parts[1];
      if (!a || !b) continue;
      out.push({
        id: randomUUID(),
        doctorSiteId: siteId,
        dayOfWeek: dow,
        startTime: a,
        endTime: b,
        isActive: true,
      });
    }
  }
  return out;
}

export function siteRowsToJsonWorkingHours(
  rows: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[],
): Record<string, string[]> {
  const byDay: Record<number, string[]> = {};
  for (const r of rows) {
    if (!r.isActive) continue;
    if (!byDay[r.dayOfWeek]) byDay[r.dayOfWeek] = [];
    byDay[r.dayOfWeek].push(`${r.startTime}-${r.endTime}`);
  }
  const json: Record<string, string[]> = {};
  for (let d = 0; d < 7; d++) {
    if (byDay[d]?.length) json[DOW_TO_JSON[d]] = byDay[d];
  }
  return json;
}
