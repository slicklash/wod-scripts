export function _t(text) {
  if (location.href.indexOf('.net') > 0) return text;
  return text === 'Commit' ? 'nderungen' : text;
}
