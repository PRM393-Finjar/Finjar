export type RequestMode = "real" | "mock";

export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function requestWithStrategy<T>(
  mode: RequestMode,
  realRequest: () => Promise<T>,
  mockRequest: () => Promise<T>,
): Promise<T> {
  if (mode === "mock") {
    return mockRequest();
  }

  return realRequest();
}
