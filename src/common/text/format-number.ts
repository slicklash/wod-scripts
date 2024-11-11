export function formatNumber(number) {
  // prettier-ignore
  return number ? ("" + number).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ") : "0";
}
