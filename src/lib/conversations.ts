export const CONVERSATION_TYPES = [
  'Outbound Call',
  'Outbound Email',
  'Client Meeting (Virtual)',
  'Client Meeting (In-Person)',
  'LinkedIn Message',
  'WhatsApp',
  'Conference/Event',
  'Referral Conversation',
  'Partner Introduction',
  'Other External Interaction',
] as const;

export const TIER_SORT_ORDER: Record<string, number> = {
  Closer: 0,
  Hunter: 1,
  Enabler: 2,
};

export type EscalationStatus = 'On Track' | 'At Risk' | 'Behind' | 'Escalated';

export function getISOWeekStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

export function getISOWeekEnd(date: Date) {
  const start = getISOWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getQuarterStart(date: Date) {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
}

export function getQuarterEnd(date: Date) {
  const start = getQuarterStart(date);
  return new Date(start.getFullYear(), start.getMonth() + 3, 0, 23, 59, 59, 999);
}

export function getLastNISOWeeks(n: number, anchorDate = new Date()) {
  const weekStart = getISOWeekStart(anchorDate);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - (n - i - 1) * 7);
    return d;
  });
}

export function getEscalationStatus(progressPct: number): EscalationStatus {
  if (progressPct >= 100) return 'On Track';
  if (progressPct >= 70) return 'At Risk';
  if (progressPct >= 40) return 'Behind';
  return 'Escalated';
}

export const ESCALATION_COLORS: Record<EscalationStatus, string> = {
  'On Track': '#27AE60',
  'At Risk': '#F39C12',
  'Behind': '#E74C3C',
  'Escalated': '#C0392B',
};

export function getHeatmapColor(progressPct: number) {
  if (progressPct >= 100) return '#27AE60';
  if (progressPct >= 70) return '#F1C40F';
  if (progressPct > 0) return '#E67E22';
  return '#2A2A2F';
}

export function clampToLast7Days(input: Date) {
  const now = new Date();
  const min = new Date(now);
  min.setDate(now.getDate() - 7);
  min.setHours(0, 0, 0, 0);
  const normalized = new Date(input);
  normalized.setHours(12, 0, 0, 0);

  if (normalized < min || normalized > now) return null;
  return normalized;
}
