import { Grid, IGridOptions } from  '../../../../../common/components/grid/grid';
import { GridDataSourceOptions, GridRequest } from  '../../../../../common/components/grid/grid.data-source';

import { Constraints, ItemDetails } from '../../../../../common/parsing/parse-item-details';
import { Modifiers, parseModifiers } from '../../../../../common/parsing/parse-modifiers';

interface ItemInfo extends ItemDetails {
    name: string;
    modifiers?: Modifiers;
}

export class SearchGrid {

  grid: Grid;
  searchValue;

  constructor(private element, private props?) {
  }

  search(searchValue = '') {
    this.searchValue = searchValue;
    this.grid.fetchPage(1);
  }

  $onInit() {

    this.render();

    const { onSearch } = this.props;

    this.grid = new Grid();

    let renderContrainsts = (key, row) => {

      let value = row[key];

      if (typeof value === 'string') {
        return value;
      }

      let con: Constraints = value;

      let result = [];

      if (con.include) {
        result.push('<span class="generic_yes">' + con.include.join(', ') + '</span>');
      }

      if (con.exclude) {
        result.push('<span class="generic_no">' + con.exclude.join(', ') + '</span>');
      }

      return result.join(' ');
    };

    let renderLevel = (row: ItemInfo) => {

      let req = row.requirements;

      if (!Array.isArray(req) || !req.length) {
        return '';
      }

      let level = (<string[]>req).find(x => x.indexOf('level is') > -1);

      if (!level) {
        return '';
      }

      return level.split(' ').pop();
    };

    let options: IGridOptions = {
      columns: [
        { header: 'Name', field: 'name', render: (row) => `<a href="/wod/spiel/hero/item.php?name=${row.name}&IS_POPUP=1" target="_blank">${row.name}</a>` },
        { header: 'Location', field: 'location' },
        { header: 'Level', field: 'level', render: renderLevel },
        { header: 'Unique', field: 'unique' },
        { header: 'Effect', field: 'effect' },
        { header: 'Classes', field: 'heroClasses', render: renderContrainsts.bind(this, 'heroClasses') },
        { header: 'Races', field: 'races', render: renderContrainsts.bind(this, 'races') },
      ],
    };

    let dt: GridDataSourceOptions = {
      url: 'http://localhost:8081/items',
      onConstructRequest: this.onGridRequest.bind(this),
    };

    this.grid.init(this.element, options, dt);
  }

  onGridRequest (req: GridRequest) {

    Object.assign(req.params, this.searchValue);

    // let raw = this.rawFilter;
    // if (raw) {
    //    let p: string[] = raw.split('&');
    //    p.forEach(x => {
    //        let [key, val] = x.split('=');
    //        req.params[key] = val;
    //    });
    // }
    return req;
  }

  render() {
    this.element.innerHTML = '';
  }
}
