export function toTrimmedString(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
}
