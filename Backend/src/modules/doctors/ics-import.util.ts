/**
 * Import minimal depuis un fragment ICS (Google Calendar, etc.) vers la structure
 * workingHours utilisée par l'app : { mon: ['09:00-12:00'], ... }
 */
const DAY_MAP: Record<string, string> = {
  SU: 'sun',
  MO: 'mon',
  TU: 'tue',
  WE: 'wed',
  TH: 'thu',
  FR: 'fri',
  SA: 'sat',
};

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function extractTimeFromDt(dtLine: string): { h: number; m: number } | null {
  const m = dtLine.match(/T(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) };
}

export function parseIcsWeeklyHours(icsText: string): {
  workingHours: Record<string, string[]>;
  warnings: string[];
} {
  const warnings: string[] = [];
  const workingHours: Record<string, string[]> = {};

  const blocks = icsText.split(/BEGIN:VEVENT/gi).slice(1);
  if (blocks.length === 0) {
    warnings.push('Aucun VEVENT trouvé dans le fichier ICS.');
    return { workingHours, warnings };
  }

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.replace(/^\s+/, ''));
    let dtstart = '';
    let dtend = '';
    let rrule = '';

    for (const line of lines) {
      if (line.startsWith('DTSTART')) dtstart = line;
      if (line.startsWith('DTEND')) dtend = line;
      if (line.startsWith('RRULE')) rrule = line;
    }

    if (!rrule.toUpperCase().includes('FREQ=WEEKLY')) {
      warnings.push('Un événement ignoré (FREQ non WEEKLY ou sans RRULE).');
      continue;
    }

    const byDayMatch = rrule.match(/BYDAY=([^;:]+)/i);
    if (!byDayMatch) {
      warnings.push('RRULE sans BYDAY — événement ignoré.');
      continue;
    }

    const days = byDayMatch[1].split(',').map((d) => d.trim().toUpperCase());
    const startT = extractTimeFromDt(dtstart);
    const endT = extractTimeFromDt(dtend || dtstart.replace('DTSTART', 'DTEND'));

    if (!startT) {
      warnings.push('DTSTART illisible — événement ignoré.');
      continue;
    }

    const end = endT ?? { h: startT.h + 1, m: startT.m };
    const slot = `${pad2(startT.h)}:${pad2(startT.m)}-${pad2(end.h)}:${pad2(end.m)}`;

    for (const d of days) {
      const key = DAY_MAP[d];
      if (!key) continue;
      if (!workingHours[key]) workingHours[key] = [];
      if (!workingHours[key].includes(slot)) workingHours[key].push(slot);
    }
  }

  if (Object.keys(workingHours).length === 0) {
    warnings.push('Aucun créneau hebdomadaire déduit. Vérifiez BYDAY (MO,TU,...) et DTSTART.');
  }

  return { workingHours, warnings };
}
