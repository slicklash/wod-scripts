export type Response<T = any> = { data?: T };

export function httpFetch<T = any>(
  url: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown> | string,
): Promise<Response<T>> {
  return new Promise((resolve, reject) => {
    const isJSON = typeof body !== "string";
    GM.xmlHttpRequest({
      method,
      url,
      headers:
        body !== undefined && isJSON
          ? { "Content-Type": "application/json" }
          : {},
      data:
        body === undefined ? undefined : isJSON ? JSON.stringify(body) : body,
      onload: ({ readyState, status, responseText, responseHeaders }) => {
        if (readyState !== 4) return;
        const type = responseHeaders
          ?.match(/^content-type:\s*([^;\r\n]+)/im)?.[1]
          ?.trim()
          ?.toLowerCase();
        const data = type?.includes("json")
          ? JSON.parse(responseText)
          : responseText;
        if (status >= 200 && status < 300) resolve({ data });
        else reject({ status, data });
      },
      onerror: reject,
    });
  });
}
