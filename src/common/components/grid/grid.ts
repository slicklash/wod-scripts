import { parseHTML } from '../../dom/parse-html';
import { GridDataSource, GridDataSourceOptions } from './grid.data-source';

export interface IGridOptions {
    columns: IGridColumn[];
    pageSize?: number;
}

interface IGridColumn {
    header: string;
    field: string;
    render?: (row: any) => string;
}

interface IPagination {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
}

interface ICollectionResponse {
    _list: any[];
    _pagination: IPagination;
}

let forEach = (xs: any[], fn) => xs.map(fn).join('');

export class Grid {

    element: Element;
    tbody: HTMLTableSectionElement;
    paginationInfo: HTMLSpanElement;
    columns: IGridColumn[];
    rows: any[] = [];
    options: IGridOptions;
    pageSize: number;
    pagination: IPagination;
    dataSource: GridDataSource;
    inputPageSize: HTMLInputElement;

    init (element: Element, options: IGridOptions, dataSourceOptions: GridDataSourceOptions) {
         this.options = options;
         this.columns = options.columns;
         this.element = element;
         this.pageSize = options.pageSize || 50;
         this.pagination = { page: undefined, pageSize: this.pageSize, pages: undefined, total: undefined };
         this.dataSource = new GridDataSource(dataSourceOptions);
         this._render();
    }

    fetchPage (page: number) {

        let params = { page: Math.min(Math.max(page, 1), this.pagination.pages || 1), pageSize: this.pageSize };

        this.dataSource.query(params).then(resp => {
            let response = resp.data;
            let data = typeof response === 'string' ? JSON.parse(response) : response;
            Object.assign(this.pagination, data._pagination);
            this._updateRows(data._list);
        });
    }

    _updateRows (rows: any[]) {
        Array.prototype.splice.apply(this.rows, [0, this.rows.length].concat(rows));
        this._renderRows();
        let { page, pageSize, total } = this.pagination;
        this.paginationInfo.innerHTML = `${Math.max(total > 0 ? 1 : 0, (page - 1) * pageSize)} - ${Math.min(pageSize * page, total)} of ${total}`;
    }

    _render () {

// pagi_but clickable

        let table = <HTMLTableElement>parseHTML(`
           <table class="content_table">
                <thead>
                    <tr class="row0">
                        <td class="paginator_row top" colspan="${this.columns.length}">
                             <input type="button" class="pagi_but clickable first" value="&laquo;" style="font-size: 16px" />
                             <input type="button" class="pagi_but clickable previous" value="&lsaquo;" style="font-size: 16px" />
                             <span class="info"></span>
                             <input type="button" class="pagi_but clickable next" value="&rsaquo;" style="font-size: 16px" />
                             <input type="button" class="pagi_but clickable last" value="&raquo;" style="font-size: 16px" />
                             page size: <input type="text" class="pagi_def page-size" value="50" size="3" />
                             <input type="button" class="pagi_but clickable btn-page-size" value="&radic;" />
                        </td>
                    </tr>
                    <tr class="header">
                        ${forEach(this.columns, col => `<th>${col.header}</th>`)}
                    </tr>
                </thead>
                <tbody class="grid-rows">
                </tbody>
           </table>
        `);

        this.element.appendChild(table);
        this.tbody = <HTMLTableSectionElement>table.querySelector('.grid-rows');
        this.paginationInfo = <HTMLSpanElement>table.querySelector('.paginator_row.top .info');
        table.querySelector('.pagi_but.first').addEventListener('click', () => this.fetchPage(1));
        table.querySelector('.pagi_but.last').addEventListener('click', () => this.fetchPage(this.pagination.pages));
        table.querySelector('.pagi_but.previous').addEventListener('click', () => this.fetchPage(this.pagination.page - 1));
        table.querySelector('.pagi_but.next').addEventListener('click', () => this.fetchPage(this.pagination.page + 1));
        this.inputPageSize =  <HTMLInputElement>table.querySelector('.page-size');
        table.querySelector('.btn-page-size').addEventListener('click', () => { this.pageSize = Number(this.inputPageSize.value); this.fetchPage(1); });
        this._renderRows();
    }

    _renderRows () {

        let table = <HTMLTableElement>parseHTML(`
            <table>
            ${forEach(this.rows, (row,i) => {
                return `
                <tr class="row${i % 2}">
                    ${forEach(this.columns, (col: IGridColumn) => `<td> ${this.renderCell(col, row)} </td>`)}
                </tr>`;
            })}
            </table>
        `);

        this.tbody.innerHTML = '';

        for (let row of Array.from(table.rows)) {
            this.tbody.appendChild(row);
        }
    }

    renderCell (col: IGridColumn, row) {
        return col.render ? col.render(row) : row[col.field] || '';
    }
}
