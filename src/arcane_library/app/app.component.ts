/// <reference path="../../common/components/toy/index.ts" />

/// <reference path="app.controller.ts" />

const AppComponent: IComponent = {
    controller: AppController,
    directives: [ToyComponent],
    selector: 'app',
    template: `
        <div id="app-panel">

            <div class="search_container" style="float: none">
            <table class="search_short texttoken">
            <tbody>
                <tr>
                    <td>
                        Name: <input type="text" [(ngModel)]="$ctrl.filters.name" size="30">
                        <input type="button" value="Search" class="button clickable" (click)="$ctrl.applySearch()" />
                    </td>
                </tr>
            </tbody>
            </table>
            </div>
            <div style="border: thin solid #909090">
                <table>
                <tbody>
                    <tr>
                        <td>Class / Race </td>
                        <td>
                            <input type="text" [(ngModel)]="$ctrl.filters.heroClasses" />
                            <input type="text" [(ngModel)]="$ctrl.filters.races" />
                        </td>
                    </tr>
                    <tr>
                        <td>Location / Unique </td>
                        <td>
                            <input type="text" [(ngModel)]="$ctrl.filters.location" />
                            <input type="text" [(ngModel)]="$ctrl.filters.unique" />
                        </td>
                    </tr>
                    <tr>
                        <td>Type / Skill </td>
                        <td>
                            <input type="text" [(ngModel)]="$ctrl.filters.itemClasses" />
                            <input type="text" [(ngModel)]="$ctrl.filters.skills" />
                        </td>
                    </tr>
                    <tr>
                        <td>Effect / Needs </td>
                        <td>
                            <input type="text" [(ngModel)]="$ctrl.filters.effect" />
                            <input type="text" [(ngModel)]="$ctrl.filters.needs" />
                        </td>
                    </tr>
                    <tr>
                        <td>Raw </td>
                        <td>
                            <input type="text" [(ngModel)]="$ctrl.rawFilter" style="width: 600px" />
                        </td>
                    </tr>
                    <tr>
                        <td>Consumable</td>
                        <td>
                            <label><input type="radio" name="input-usage" value="both" checked />Both</label>
                            <label><input type="radio" name="input-usage" value="yes" />Yes<label>
                            <label><input type="radio" name="input-usage" vaue="no" />No</label>
                        </td>
                    </tr>
                </tbody>
                </table>
            </div>

            <div id="grid-items"></div>

            <br/>

            <input type="text" [(ngModel)]="$ctrl.cmd" />
            <input type="button" value="run" class="button clickable" (click)="$ctrl.onRunCommand()" />

            <br/>

            <textarea readonly style="height: 50px; width:200px" [textContent]="$ctrl.logMsg"></textarea>

            <br/>

            <toy></toy>
            <toy />

        </div>
    `
}
