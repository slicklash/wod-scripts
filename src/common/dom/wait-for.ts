export function waitFor(
  selectorOrElement: string | Element | Document,
  eventName?: string,
): Promise<any> {
  return new Promise((resolve) => {
    if (typeof selectorOrElement === "string") {
      const fn = () => {
        const elem = document.querySelector(selectorOrElement);
        if (elem || document.readyState === "complete") {
          resolve(elem);
          return;
        }
        setTimeout(fn, 250);
      };
      fn();
    } else {
      if (eventName) selectorOrElement.addEventListener(eventName, resolve);
    }
  });
}
