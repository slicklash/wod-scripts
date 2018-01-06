
export const SearchFormTemplate = `

<div  data-formGroupName="form" >

  <div class="search_container" style="float: none">
      <table class="search_short texttoken">
      <tbody>
          <tr>
              <td>
                  Name: <input type="text"
                              size="30"
                              data-formControlName="name" >

                  <a  class="button clickable"
                      data-formControlName="actionSearch">Search</a>
              </td>
          </tr>
      </tbody>
      </table>
  </div>

      <div>
      <table>
      <tbody>
          <tr>
              <td>Class / Race </td>
              <td>
                  <input type="text"
                        data-formControlName="heroClasses" />

                  <input type="text"
                        data-formControlName="races" />
              </td>
          </tr>
          <tr>
              <td>Location / Unique </td>
              <td>
                  <input type="text"
                        data-formControlName="location" />

                  <input type="text"
                        data-formControlName="unique" />
              </td>
          </tr>
          <tr>
              <td>Type / Skill </td>
              <td>
                  <input type="text"
                        data-formControlName="itemClasses" />

                  <input type="text"
                        data-formControlName="skills" />
              </td>
          </tr>
          <tr>
              <td>Effect / Needs </td>
              <td>
                  <input type="text"
                        data-formControlName="effect" />

                  <input type="text"
                        data-formControlName="needs" />
              </td>
          </tr>
          <!--
          <tr>
              <td>Raw </td>
              <td>
                  <input type="text"
                        data-formControlName="rawFilter" style="width: 600px" />
              </td>
          </tr>
          -->
          <tr>
              <td>Consumable</td>
              <td>
                  <label><input type="radio" name="usage" data-formControlName="usage" value="both" checked />Both</label>
                  <label><input type="radio" name="usage" data-formControlName="usage" value="yes" />Yes<label>
                  <label><input type="radio" name="usage" data-formControlName="usage" vaue="no" />No</label>
              </td>
          </tr>
      </tbody>
      </table>
      </div>

      <div>
          <table>
              <tbody>
              </tbody>
          </table>
      </div>

</div>

`;
