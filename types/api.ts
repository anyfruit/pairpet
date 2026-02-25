export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export interface CloudCallOptions<T = Record<string, unknown>> {
  name: string;
  data?: T;
}
