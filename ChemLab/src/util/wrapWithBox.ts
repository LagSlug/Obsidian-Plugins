import { Cheerio } from "cheerio";

const BOX_STYLE = removeLineBreaksAndExtraSpaces(`
  padding: 10px;
  border: 1px solid;
  background-color: white;
  display: inline-block;
`);

export default function wrapWithBox(source: string) {
  const tabbedSource = addTabToString(source);
  return `<div style="${BOX_STYLE}">\n` + tabbedSource + `\n</div>`;
}


function addTabToString(str: string, tabSize: number = 4): string {
  const lines = str.split("\n");
  const tab = " ".repeat(tabSize);
  return lines.map(line => `${tab}${line}`).join("\n");
}

function removeLineBreaksAndExtraSpaces(str: string): string {
  return str.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s{2,}/g, " ");
}
