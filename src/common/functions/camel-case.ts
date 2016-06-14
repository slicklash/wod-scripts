/// <reference path="./title-case.ts" />
const camelCase = x => x ? x.split(' ').map((y,i) => i < 1 ? y.toLowerCase() : titleCase(y)).join('') : '';
