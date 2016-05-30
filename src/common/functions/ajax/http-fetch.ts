/// <reference path="../../../../lib/typings/browser.d.ts" />

function httpFetch (url, method = 'GET') {

   return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: method,
            url: url,
            onload: (request) => {
                if (request.readyState !== 4) return;
                if (request.status >= 200 && request.status < 300)
                    resolve(request.responseText);
                else
                    reject(request.responseText);
            }
        });
    });
}
