export function formatNumber(number: number) {
  return number ? ("" + number).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ") : "0";
}
