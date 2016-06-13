
const parseHTML = (str, returnBody?: boolean) => {
  let tmp = (<any>document.implementation).createHTMLDocument();
  tmp.body.innerHTML = str;
  return returnBody ? tmp.body : tmp.body.children;
};
