import { differenceInDays, differenceInCalendarDays } from "date-fns";
import { DEFAULT_LATENCY } from "./constants";
import type { AskType, Status } from "./constants";

export interface UrgencyResult {
  status: Status;
  urgencyScore: number;
  daysWaited: number;
  overdueDays: number;
  nextFollowUpAt: Date;
}

export function computeUrgency(item: {
  createdAt: Date;
  lastContactAt: Date;
  expectedBy: Date | null;
  typicalLatencyDays: number;
  askType: string;
  followUps?: { date: Date }[];
}): UrgencyResult {
  const today = new Date();
  
  // Calculate days since last contact
  const daysWaited = Math.max(
    0,
    differenceInCalendarDays(today, new Date(item.lastContactAt))
  );

  // If there is an explicit deadline (expectedBy)
  if (item.expectedBy) {
    const expectedDate = new Date(item.expectedBy);
    const totalExpectedDays = Math.max(
      1,
      differenceInCalendarDays(expectedDate, new Date(item.createdAt))
    );
    
    const daysRemaining = differenceInCalendarDays(expectedDate, today);

    let status: Status;
    let urgencyScore: number;
    let overdueDays = 0;

    if (daysRemaining < 0) {
      // Deadline has passed!
      status = "OVERDUE";
      overdueDays = Math.abs(daysRemaining);
      // Score starts at 80 and increases up to 100 based on how overdue it is
      urgencyScore = Math.min(100, 80 + overdueDays * 5);
    } else if (daysRemaining <= 2 || daysRemaining / totalExpectedDays <= 0.3) {
      // Due soon if 2 days or less remaining, or less than 30% of total expected days
      status = "DUE_SOON";
      // Score scales between 45 and 79
      const progress = 1 - (daysRemaining / Math.max(1, totalExpectedDays));
      urgencyScore = Math.round(45 + progress * 34);
    } else {
      // Normal waiting state
      status = "WAITING";
      // Score scales between 0 and 44
      const progress = 1 - (daysRemaining / Math.max(1, totalExpectedDays));
      urgencyScore = Math.max(0, Math.round(progress * 44));
    }

    // Decaying follow-up cadence
    const followUpCount = item.followUps?.length ?? 0;
    let nextFollowUpMultiplier = 1.0;
    if (followUpCount === 1) nextFollowUpMultiplier = 1.5;
    else if (followUpCount > 1) nextFollowUpMultiplier = 1.5 + 0.75 * (followUpCount - 1);

    const nextFollowUpDays = Math.min(
      Math.round(totalExpectedDays * nextFollowUpMultiplier),
      totalExpectedDays + 30
    );

    const nextFollowUpAt = new Date(item.createdAt);
    nextFollowUpAt.setDate(nextFollowUpAt.getDate() + nextFollowUpDays);

    return {
      status,
      urgencyScore,
      daysWaited,
      overdueDays,
      nextFollowUpAt,
    };
  }

  // If no expectedBy date, fall back to typical latency logic
  const expected = item.typicalLatencyDays;
  const ratio = daysWaited / expected;

  let status: Status;
  if (ratio < 0.7) {
    status = "WAITING";
  } else if (ratio < 1.0) {
    status = "DUE_SOON";
  } else {
    status = "OVERDUE";
  }

  const urgencyScore = Math.min(100, Math.round(ratio * 60));
  const overdueDays = Math.max(0, daysWaited - expected);

  // Decaying follow-up cadence
  const followUpCount = item.followUps?.length ?? 0;
  let nextFollowUpMultiplier: number;
  if (followUpCount === 0) {
    nextFollowUpMultiplier = 1.0;
  } else if (followUpCount === 1) {
    nextFollowUpMultiplier = 1.5;
  } else {
    nextFollowUpMultiplier = 1.5 + 0.75 * (followUpCount - 1);
  }

  const nextFollowUpDays = Math.min(
    Math.round(expected * nextFollowUpMultiplier),
    expected + 30
  );

  const nextFollowUpAt = new Date(item.createdAt);
  nextFollowUpAt.setDate(nextFollowUpAt.getDate() + nextFollowUpDays);

  return {
    status,
    urgencyScore,
    daysWaited,
    overdueDays,
    nextFollowUpAt,
  };
}

export function getUrgencyColor(score: number): string {
  if (score < 42) return "text-emerald-400";
  if (score < 60) return "text-amber-400";
  return "text-rose-400";
}

export function getUrgencyBg(score: number): string {
  if (score < 42) return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
  if (score < 60) return "bg-amber-500/15 border-amber-500/30 text-amber-300";
  return "bg-rose-500/15 border-rose-500/30 text-rose-300";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "WAITING":
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    case "DUE_SOON":
      return "bg-amber-500/15 border-amber-500/30 text-amber-300";
    case "OVERDUE":
      return "bg-rose-500/15 border-rose-500/30 text-rose-300";
    case "RESOLVED":
      return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
    default:
      return "bg-slate-500/15 border-slate-500/30 text-slate-300";
  }
}
