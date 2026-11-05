export function waitFor(selector: string): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const elem = document.querySelector(selector);
      if (elem || document.readyState === "complete" || Date.now() - start > 30_000) resolve(elem);
      else setTimeout(check, 250);
    };
    check();
  });
}
