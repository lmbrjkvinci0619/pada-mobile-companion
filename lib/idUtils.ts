export function toNumberId(id: string | number, fieldName: string): number {
  if (typeof id === "number") return id;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid ${fieldName}: "${id}" is not a valid number`);
  }
  return num;
}

export function toNumericIdOrThrow(id: string, fieldName: string): number {
  const numId = toNumberId(id, fieldName);
  if (numId <= 0) {
    throw new Error(`Invalid ${fieldName}: "${id}" must be a positive number`);
  }
  return numId;
}

export function toNumericIdOrUndefined(id: string | undefined, fieldName: string): number | undefined {
  if (id === undefined) return undefined;
  const num = toNumberId(id, fieldName);
  if (num <= 0) return undefined;
  return num;
}

export function toNumericIdOrNull(id: string | number | null | undefined, fieldName: string): number | null {
  if (id === null || id === undefined) return null;
  if (typeof id === "number") return id;
  const num = toNumberId(id, fieldName);
  if (!Number.isFinite(num)) return null;
  return num;
}

export function isValidNumericId(id: string | number): boolean {
  if (typeof id === "number") return id > 0 && Number.isFinite(id);
  const num = Number(id);
  return num > 0 && Number.isFinite(num);
}