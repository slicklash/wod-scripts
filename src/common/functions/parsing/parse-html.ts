
const parseHTML = str => {
  let tmp = (<any>document.implementation).createHTMLDocument();
  tmp.body.innerHTML = str;
  return tmp.body.children;
};
