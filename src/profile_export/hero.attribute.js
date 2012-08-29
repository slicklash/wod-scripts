
// --- HeroAttribute

function HeroAttribute(name) {
    this.name = name;
    this.value = 0;
    this.effective_value = 0;
    this.training_cost = 0;
}

var _attrCosts = '0,0,100,500,1300,2800,5100,8500,13200,19400,27400,37400,49700,64500,82100,102800,126800,154400,\
185900,221600,261800,306800,356800,412200,473300,540400,613800,693800,780800,875000,976800'.split(',');

HeroAttribute.getCost = function(value) {
    return _attrCosts[value] ? ('' + Number(_attrCosts[value])).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ") : 0;
};
