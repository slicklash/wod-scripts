import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { cssClass } from "@common/dom/css-class";

export type ExportControls = {
  btnExport: HTMLInputElement;
  chkboxItems: HTMLInputElement;
  imgLoader: HTMLImageElement;
};

export function createExportControls(referenceButton: HTMLButtonElement): ExportControls | null {
  const btnExport = add<HTMLInputElement>("input");
  const chkboxItems = add<HTMLInputElement>("input");
  const label_items = add<HTMLLabelElement>("label");
  label_items.innerHTML = "Equipment";

  attr(btnExport, { type: "button", class: "button clickable", value: "Export", style: "margin-left: 4px" });
  attr(chkboxItems, { type: "checkbox", id: "export-items", style: "margin-left: 4px" });
  attr(label_items, { for: "export-items" });

  const parent = referenceButton.parentNode;
  if (!parent) return null;

  parent.insertBefore(label_items, referenceButton.nextSibling);
  parent.insertBefore(chkboxItems, label_items);
  parent.insertBefore(btnExport, chkboxItems);
  parent.insertBefore(add<HTMLBRElement>("br"), label_items.nextSibling);

  const imgLoader = attr(add("img", add("div")), {
    src: `${location.protocol}//${location.host}/wod/css/img/ajax-loader.gif`,
    style: "display: none",
  });

  parent.insertBefore(imgLoader, parent.firstChild);

  return { btnExport, chkboxItems, imgLoader: imgLoader as HTMLImageElement };
}

export function setLoadingState(controls: ExportControls): void {
  attr(controls.btnExport, "disabled", "true");
  cssClass(controls.btnExport, "button", true);
  cssClass(controls.btnExport, "clickable", false);
  cssClass(controls.btnExport, "button_disabled", true);
  attr(controls.imgLoader, "style", null);
}

export function setIdleState(controls: ExportControls): void {
  attr(controls.imgLoader, "style", "display: none");
  attr(controls.btnExport, "disabled", null);
  cssClass(controls.btnExport, "clickable", true);
  cssClass(controls.btnExport, "button_disabled", false);
}

export function displayResult(h1: HTMLHeadingElement | null, bbcode: string): void {
  const h1Parent = h1?.parentElement;
  let txtExport = h1Parent?.querySelector("#profile-export-result");
  if (!txtExport && h1Parent) {
    txtExport = add<HTMLTextAreaElement>("textarea", h1Parent);
    attr(txtExport, { rows: "4", cols: "50", id: "profile-export-result" });
  }
  if (txtExport) {
    txtExport.innerHTML = bbcode;
  }
}
