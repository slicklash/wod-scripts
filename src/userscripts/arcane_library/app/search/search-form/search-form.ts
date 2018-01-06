import { FormControlGroup } from '../../../../../common/toymvc/forms/form-control-group';
import { SearchFormTemplate } from './search-form.template'

export class SearchForm {

  form: FormControlGroup;

  constructor(private element, private props?) {
  }

  $onInit() {

    this.render();

    this.form = new FormControlGroup('form', this.element).reset({
      actionSearch: { enumerable: false, writable: false },
      // actionCommand: { disabled: true, enumerable: false, writable: false },
    });

    const { onSearch } = this.props;

    const actionSearch = (<any>this.form.controls).actionSearch;
    actionSearch.element.addEventListener('click', () => onSearch(this.form.value));

    this.form.valueChanges.subscribe(v => {

      console.log(v);
    });

  }

  render() {
    this.element.innerHTML = SearchFormTemplate;
  }
}
