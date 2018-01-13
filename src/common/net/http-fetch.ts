export interface IResponse {
    data?: any;
}

export function httpFetch(url, method = 'GET', data?): Promise<IResponse> {

   return new Promise((resolve, reject) => {
        const request: any = {
            method,
            url,
            headers: { Cookie: document.cookie },
            onload: req => {
                if (req.readyState !== 4) return;
                if (req.status >= 200 && request.status < 300) {
                    resolve({
                        data: req.responseText,
                    });
                } else {
                    reject({
                        data: req.responseText,
                    });
                }
            },
        };
        if (typeof data === 'object') {
            request.data = JSON.stringify(data);
            request.headers = { 'Content-Type': 'application/json' };
        }
        GM_xmlhttpRequest(request);
    });
}
