import { callCloud } from "./cloud";

export async function getDashboard(dateKey: string) {
  return callCloud({
    name: "getDashboard",
    data: { dateKey }
  });
}
