/// <reference path="../../common/components/toy/index.ts" />

/// <reference path="app.controller.ts" />

const AppComponent = {
    controller: AppController,
    directives: [ToyComponent],
    selector: 'app',
    template: `
            <div style="display:none" id="app-panel">

              <div class="search_container" style="float: none">
                <table class="search_short texttoken">
                <tbody>
                    <tr>
                        <td>
                            Name: <input type="text" id="input-search" value="" size="30">
                            <input type="button" id="btn-search" value="Search" class="button clickable" />
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
                               <input type="text" id="input-class" />
                               <input type="text" id="input-race" />
                           </td>
                       </tr>
                       <tr>
                           <td>Location / Unique </td>
                           <td>
                               <input type="text" id="input-location" />
                               <input type="text" id="input-unique" />
                           </td>
                       </tr>
                       <tr>
                           <td>Type / Skill </td>
                           <td>
                               <input type="text" id="input-type" />
                               <input type="text" id="input-skill" />
                           </td>
                       </tr>
                       <tr>
                           <td>Effect / Needs </td>
                           <td>
                               <input type="text" id="input-effect" />
                               <input type="text" id="input-needs" />
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

              <input type="text" id="input-cmd" value="search:*hatred*" />
              <input type="button" id="btn-run" value="run" class="button clickable" />

              <br/>

              <textarea id="output-window" readonly style="height: 50px; width:200px"></textarea>

              <br/>

              <toy></toy>
              <toy />

            </div>
        `
}
