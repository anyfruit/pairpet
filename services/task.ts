import { callCloud } from "./cloud";

export type TaskScope = "pair" | "personal";
export type TaskRepeatRule = "daily" | "once";

export interface CreateTaskPayload {
  title: string;
  scope: TaskScope;
  repeatRule: TaskRepeatRule;
  points: number;
  bonusPoints: number;
  onceDateKey?: string;
}

export async function createTask(payload: CreateTaskPayload) {
  return callCloud({
    name: "createTask",
    data: payload
  });
}

export async function getTasksByDate(dateKey: string) {
  return callCloud({
    name: "getTasksByDate",
    data: { dateKey }
  });
}

export async function completeTask(taskId: string, dateKey: string) {
  return callCloud({
    name: "completeTask",
    data: { taskId, dateKey }
  });
}
