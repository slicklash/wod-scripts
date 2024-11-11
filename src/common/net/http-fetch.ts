export interface IResponse {
  data?: any;
}

declare let GM;

export function httpFetch(url, method = "GET", data?): Promise<IResponse> {
  return new Promise((resolve, reject) => {
    const request: any = {
      method,
      url,
      headers: { Cookie: document.cookie },
      onload: (resp) => {
        if (resp.readyState !== 4) return;
        if (resp.status >= 200 && resp.status < 300) {
          resolve({ data: resp.responseText });
        } else {
          reject({ data: resp.responseText });
        }
      },
    };
    if (typeof data === "object") {
      request.data = JSON.stringify(data);
      request.headers = { "Content-Type": "application/json" };
    }
    if (typeof GM === "object") {
      GM.xmlHttpRequest(request);
    } else {
      GM_xmlhttpRequest(request);
    }
  });
}
