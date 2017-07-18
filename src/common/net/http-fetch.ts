export interface IResponse {
    data?: any
}

export function httpFetch (url, method = 'GET', data = undefined): Promise<IResponse> {

   return new Promise((resolve, reject) => {
        let request: any = {
            method: method,
            url: url,
            headers: { Cookie: document.cookie },
            onload: (request) => {
                if (request.readyState !== 4) return;
                if (request.status >= 200 && request.status < 300)
                    resolve({
                        data: request.responseText
                    });
                else
                    reject({
                        data: request.responseText
                    });
            }
        };
        if (typeof data === 'object') {
            request.data = JSON.stringify(data);
            request.headers = { 'Content-Type': 'application/json' };
        }
        GM_xmlhttpRequest(request);
    });
}
