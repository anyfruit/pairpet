import type { Pair, Pet, Task, User } from "../types";
import { toDateKey } from "../utils/date";

const today = toDateKey();

export const mockCurrentUser: User = {
  id: "u1",
  nickname: "小K",
  avatarUrl: "",
  intimacy: 128
};

export const mockPartnerUser: User = {
  id: "u2",
  nickname: "小Y",
  avatarUrl: "",
  intimacy: 128
};

export const mockPair: Pair = {
  id: "p1",
  code: "PP2026",
  status: "bound",
  memberIds: [mockCurrentUser.id, mockPartnerUser.id],
  createdAt: today
};

export const mockPet: Pet = {
  id: "pet1",
  name: "团团",
  level: 3,
  intimacy: 128,
  avatarEmoji: "🐶"
};

export const mockTasks: Task[] = [
  {
    id: "t1",
    title: "今天喂食",
    points: 10,
    dateKey: today,
    assigneeId: mockCurrentUser.id,
    status: "todo"
  },
  {
    id: "t2",
    title: "晚上遛狗",
    points: 20,
    dateKey: today,
    assigneeId: mockPartnerUser.id,
    status: "done"
  },
  {
    id: "t3",
    title: "清理猫砂",
    points: 15,
    dateKey: today,
    assigneeId: mockCurrentUser.id,
    status: "todo"
  }
];
