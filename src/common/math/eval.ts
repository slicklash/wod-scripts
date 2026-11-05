/**
 * safely evaluate affected expressions
 */
export function evalAffected(value: string, heroLevel: number, skillRank: number): string {
  const match = value.match(/% of your (hero`s level|skill rank)/);
  if (!match) return value;

  const multiplier = match[1] === "hero`s level" ? heroLevel : skillRank;
  const expression = value.replace(match[0], `*${multiplier}/100`);

  try {
    const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/()]/g);
    if (!tokens || tokens.join("") !== expression.replace(/\s+/g, "")) return value;

    let i = 0;
    const primary = (): number => {
      const token = tokens[i++];
      if (token === "(") {
        const n = addSub();
        if (tokens[i++] !== ")") throw Error();
        return n;
      }
      if (token === "+" || token === "-") return (token === "-" ? -1 : 1) * primary();
      const n = Number(token);
      if (!Number.isFinite(n)) throw Error();
      return n;
    };
    const mulDiv = (): number => {
      let n = primary();
      while (["*", "/"].includes(tokens[i])) {
        const op = tokens[i++];
        const r = primary();
        if (op === "/" && r === 0) throw Error();
        n = op === "*" ? n * r : n / r;
      }
      return n;
    };
    const addSub = (): number => {
      let n = mulDiv();
      while (["+", "-"].includes(tokens[i])) {
        const op = tokens[i++];
        const r = mulDiv();
        n = op === "+" ? n + r : n - r;
      }
      return n;
    };

    const result = addSub();
    return i === tokens.length ? Math.floor(result).toString() : value;
  } catch {
    return value;
  }
}
