import type { CloudCallOptions } from "../types";

export interface CloudResponse<TData = unknown> {
  code: number;
  message: string;
  data: TData | null;
}

function normalizeResult<TData = unknown>(result: unknown): CloudResponse<TData> {
  if (result && typeof result === "object" && "code" in result) {
    return result as CloudResponse<TData>;
  }
  return {
    code: -1,
    message: "云函数返回格式错误",
    data: null
  };
}

export async function callCloud<TData = unknown, TPayload = Record<string, unknown>>(
  options: CloudCallOptions<TPayload>
): Promise<CloudResponse<TData>> {
  try {
    const result = await wx.cloud.callFunction({
      name: options.name,
      data: options.data ?? {}
    });
    return normalizeResult<TData>(result.result);
  } catch (error) {
    console.error("cloud call failed:", error);
    return {
      code: -1,
      message: "云函数调用失败",
      data: null
    };
  }
}
