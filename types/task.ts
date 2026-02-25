export type TaskScope = "pair" | "personal";
export type TaskRepeatRule = "daily" | "once";
export type TaskType = "system" | "custom";

export interface Task {
  _id: string;
  taskType: TaskType;
  title: string;
  scope: TaskScope;
  repeatRule: TaskRepeatRule;
  points: number;
  bonusPoints: number;
  pairId: string;
  creatorOpenId: string;
  assigneeOpenId: string;
  enabled: boolean;
  onceDateKey?: string;
}

export interface TaskListItem extends Task {
  selfDone: boolean;
  partnerDone?: boolean;
}

export interface CompleteTaskResult {
  alreadyCompleted: boolean;
  basePoints: number;
  bonusTriggered: boolean;
  bonusPoints: number;
  levelUp: boolean;
  pairIntimacyScore: number;
  pet: {
    _id: string;
    name: string;
    exp: number;
    level: number;
    stage: "egg" | "baby" | "grow";
    mood: string;
    intimacy: number;
  } | null;
}
