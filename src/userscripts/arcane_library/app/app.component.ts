import { IComponent } from '@toymvc/core';
import { AppController } from './app.controller';
// import { ToyComponent } from '../../../common/components/toy/toy.component'

export const AppComponent: IComponent = <any>{
    controller: AppController,
    // directives: [ToyComponent],
    selector: 'app',
    template: `
        <div id="app">
           <SearchComponent/>
        </div>
        <div id="app-panel">

            <div id="search-items"></div>
            <div id="search-grid"></div>

            <br/>

            <input type="text" data-formControlName="command" />
            <input type="button" value="run" class="button clickable" data-formControlName="actionCommand" />

            <br/>

            <textarea readonly style="height: 50px; width:200px" data-formControlName="log"></textarea>

            <br/>

        </div>
    `
};
