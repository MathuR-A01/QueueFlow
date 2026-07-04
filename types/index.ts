export interface FollowUp {
  id: string;
  waitingItemId: string;
  date: Date;
  channel: string;
  draftedByAi: boolean;
  notes: string | null;
}

export interface WaitingItemWithFollowUps {
  id: string;
  title: string;
  counterpartyName: string;
  counterpartyType: string;
  askType: string;
  status: string;
  expectedBy: Date | null;
  typicalLatencyDays: number;
  createdAt: Date;
  updatedAt: Date;
  lastContactAt: Date;
  urgencyScore: number;
  notes: string | null;
  resolutionNote: string | null;
  actualLatencyDays: number | null;
  notifiedDueSoon: boolean;
  notifiedOverdue: boolean;
  followUps: FollowUp[];
}
