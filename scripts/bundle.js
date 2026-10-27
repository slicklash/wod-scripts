#!/usr/bin/env node

"use strict";
/* eslint-env node */
/* eslint no-console: 0 */
/* eslint @typescript-eslint/no-var-requires: 0 */

const fs = require("fs");
const path = require("path");

const stripAMD = (content) =>
  content
    .split(/^\}\);$/gm)
    .map((p) => {
      let imports = [];
      p = p.replace(
        /define\(".+require, exports(.+)?\) {\n\s{4}"use strict";/gm,
        (m, g1) => {
          imports = (g1 || "").split(/[,\s]+/).filter((x) => !!x);
          return "";
        },
      );

      imports.forEach((x) => {
        p = p.replace(new RegExp(`\\(0,\\s*${x}\\.([\\w$]+)\\)`, "g"), "$1");
        p = p.replace(new RegExp(`\\b${x}\\.`, "g"), "");
      });

      return p
        .replace(/exports\.(.+) = (\1|void 0);/gm, "")
        .replace(/exports\.(.+) = /, "var $1 = ")
        .replace(/([^a-z_])exports\.([a-z0-9_$]+)([^a-z_])/gi, "$1$2$3")
        .replace(
          'Object.defineProperty(exports, "__esModule", { value: true });',
          "",
        )
        .split("\n")
        .map((x) => x.replace(/\s{4}/, ""))
        .filter((x) => x.trim())
        .join("\n");
    })
    .join("\n")
    .trim();

function main(name = "storage_management") {
  console.log(name);
  const header = fs.readFileSync(
    path.join(__dirname, `../src/${name}/header.js`),
    "utf-8",
  );

  let content = fs.readFileSync(
    path.join(__dirname, `../build/${name}.js`),
    "utf-8",
  );

  const version = header.match(/@version\s+([\d.]+)/);
  if (version) content = content.replace("@version", version[1]);
  const url = header.match(/@downloadURL\s+([^\s\n]+)/);
  if (url) content = content.replace("@downloadURL", url[1]);

  content = `${header}
(function() {
'use strict';
${stripAMD(content)}

})();`;

  fs.writeFileSync(path.join(__dirname, `../release/${name}.user.js`), content);
}

if (require.main === module) {
  const [, , name] = process.argv;
  main(name);
}
