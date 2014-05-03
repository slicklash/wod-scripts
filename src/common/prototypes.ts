
// --- Prototypes

interface String {
    pad(len: number, str: string, left?: boolean): string;
    parseEffectiveValue(): Array<Number>;
    trim(): string;
}

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
};

String.prototype.pad = function(len: number, str: string, left?: boolean) {
    var res = this,
        tmp = str || ' ';
    if (left === true) {
        while (res.length < len) res = tmp + res;
    }
    else {
        while (res.length < len) res += tmp;
    }
    return res;
};

String.prototype.parseEffectiveValue = function() {
    var val = this.replace(/[a-z:,\s\n]+/gi, '').match(/([0-9]+)(\[([0-9\-]+)\])?/);
    if (val === null) return [0,0];
    return  val[3] ? [Number(val[1]), Number(val[3])] : [Number(val[1]), Number(val[1])];
};
