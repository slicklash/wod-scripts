/// <reference path="../_references.spec.ts" />

/// <reference path="../common/functions/parsing/parse-html.ts" />

/// <reference path="main.ts" />

describe('tidy_trade', () => {

    it('should parse item info', () => {

        let table = parseHTML(`
            <table>
                <tbody>
                    <tr>
                        <td>3</td>
                        <td></td>
                        <td>
                            <img src="/wod/css/icons/WOD/item_value/de/item_default.png">
                            <img src="/wod/css//skins/skin-2/images/icons/zustand_6.gif">
                              <a href="" class="item_usable">glass wand</a>
                        </td>
                        <td>
                            <input type="checkbox" name="rem_item_ids[18094800]">10
                            <img gold">
                        </td>
                    </tr>
                    <tr>
                        <td>1</td>
                        <td></td>
                        <td>
                            <img src="/wod/css/icons/WOD/item_value/de/item_default.png">
                            <img src="/wod/css//skins/skin-2/images/icons/zustand_3.gif">
                                <a href="" class="item_usable">bubbling brew of magic resistance</a> (6/10)
                        </td>
                        <td>
                            <input type="checkbox" name="rem_item_ids[18515564]">8
                            <img title="gold">
                        </td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td></td>
                        <td>
                            <img src="/wod/css/icons/WOD/item_value/de/item_default.png">
                            <img src="/wod/css//skins/skin-2/images/icons/zustand_3.gif">
                                <a href="" class="item_usable">bubbling brew of magic resistance</a> (6/10)
                        </td>
                        <td>
                            <input type="checkbox" name="rem_item_ids[18515564]">8
                            <img title="gold">
                        </td>
                    </tr>
                </tbody>
            </table>
        `)[0];

        let [items, sums] = getItemInfo(table),
            item1 = items[0];

        expect(items.length).toBe(3);
        expect(item1.name).toBe('bubbling brew of magic resistance');
        expect(sums[item1.name]).toBe(12);

    })

    it('should find tables', () => {

        let main_content = parseHTML(`
            <div id="main_content">
               <h1>Trade with</h1>
               <table></table>
               <table></table>
               <table><tbody>
            </div>
        `)[0];

        let sut = main(main_content);

        expect(sut).toBe(true);

    })

})
