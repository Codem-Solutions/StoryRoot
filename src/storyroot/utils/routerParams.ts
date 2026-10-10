export function encodeJsonParam(value: unknown): string {
  return JSON.stringify(value);
}

export function decodeJsonParam<T>(value: string | string[] | undefined, fallback: T): T {
  if (!value) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function stringParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
