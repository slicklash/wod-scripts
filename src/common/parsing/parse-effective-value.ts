/**
 * Parse an effective value string like "10[5]" or "10" into a tuple of numbers.
 * The first number is the base value, and the second number is the effective value.
 * If the effective value is not specified, it defaults to the base value.
 */
export function parseEffectiveValue(str: string): [number, number] {
  const m = str.replace(/[a-z:,\s]+/gi, "").match(/(\d+)(?:\[(-?\d+)\])?/);
  if (!m) return [0, 0];
  return [Number(m[1]), Number(m[2] ?? m[1])];
}
