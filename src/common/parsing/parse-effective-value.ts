export function parseEffectiveValue(str: string): [number, number] {
  const b = str.replace(/[a-z:,\s\n]+/gi, "").match(/([0-9]+)(\[([0-9-]+)\])?/);
  if (b === null) return [0, 0];
  return b[3] ? [Number(b[1]), Number(b[3])] : [Number(b[1]), Number(b[1])];
}
