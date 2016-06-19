/// <reference path="../../../../lib/typings/browser.d.ts" />

/// <reference path="../../functions/ajax/http-fetch.ts" />

interface GridDataSourceOptions {
    url: string;
    onConstructRequest: (req: GridRequest) => GridRequest;
}

interface GridRequest {
    action: string;
    params: any;
}

class GridDataSource {

    currentParams: any;
    currentOrderBy: any;

    constructor (private options: GridDataSourceOptions) {
    }

    query (params) : Promise<any> {
        this.currentParams = params;
        return this._invokeRequest('query', params);
    }

    private _invokeRequest (action: string, params) {
        let req: GridRequest = { action, params };
        let p = httpFetch(this._buildUri(this.options.onConstructRequest(req).params));
        return p;
    }

    private _buildUri (params): string {
        let queryParams = Object.keys(params).map(k => params[k] === undefined || params[k] === '' ? undefined : `${k}=${encodeURIComponent(params[k])}`).filter(x=>x != undefined).join('&');
        return this.options.url + '?' + queryParams;
    }
}
