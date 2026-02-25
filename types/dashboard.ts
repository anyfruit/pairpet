export interface DashboardSharedTaskSummary {
  taskId: string;
  title: string;
  selfDone: boolean;
  partnerDone: boolean;
}

export interface DashboardPetSummary {
  _id: string;
  name: string;
  species: string;
  level: number;
  exp: number;
  stage: "egg" | "baby" | "grow";
  mood: string;
  intimacy: number;
  expPerLevel: number;
}

export interface DashboardData {
  dateKey: string;
  bound: boolean;
  user: Record<string, unknown> | null;
  pair: {
    _id: string;
    status: string;
    intimacyScore: number;
    memberOpenIds: string[];
  } | null;
  pet: DashboardPetSummary | null;
  todaySummary: {
    total: number;
    completed: number;
    sharedTotal: number;
    sharedCompleted: number;
    sharedTasks: DashboardSharedTaskSummary[];
  };
  recentIntimacyChange: {
    points: number;
    sourceType: string;
    createdAt: string | Date;
  } | null;
}
