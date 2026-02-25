export interface Pair {
  id: string;
  code: string;
  status: "pending" | "bound";
  memberIds: string[];
  createdAt: string;
}
