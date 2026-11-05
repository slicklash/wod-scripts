export const hash = (text: string) => Math.abs([...text.padEnd(11, "0")].map((x) => x.charCodeAt(0)).reduce((a, x) => (a + ((a << 7) + (a << 3))) ^ x)).toString(16);
