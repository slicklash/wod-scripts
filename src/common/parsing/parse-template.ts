export function parseTemplate(tpl, data) {
  try {
    const code =
      "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" +
      tpl
        .replace(/[\r\t\n]/g, " ")
        .replace(/'(?=[^#]*#>)/g, "\t")
        .split("'")
        .join("\\'")
        .split("\t")
        .join("'")
        .replace(/<#=(.+?)#>/g, "',$1,'")
        .split("<#")
        .join("');")
        .split("#>")
        .join("p.push('") +
      "');}return p.join('');";
    const fn = new Function("obj", code);
    return fn(data);
  } catch (ex) {
    console.error(ex);
  }
  return "ERROR";
}
