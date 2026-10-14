// domino-fox release site builder.
//
//   node site/build.mjs             → site/index.html + download/index.html
//   node site/build.mjs --out DIR   → DIR/index.html + DIR/download/index.html
//
// Version stamps come from the extension repo's download/releases.json:
//   --releases PATH | env RELEASES_JSON | ../domino-fox/download/releases.json
// (the default resolves from this script's location, so it works from any cwd).
// Without a registry the intro page still builds — LATEST_* are stamped as
// "unreleased" placeholders and the downloads page is skipped.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

function argValue(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && i + 1 < process.argv.length
    ? process.argv[i + 1]
    : undefined;
}

const releasesPath = argValue("releases")
  ? resolve(process.cwd(), argValue("releases"))
  : process.env.RELEASES_JSON
  ? resolve(process.cwd(), process.env.RELEASES_JSON)
  : resolve(scriptDir, "../../domino-fox/download/releases.json");

const outRoot = argValue("out")
  ? resolve(process.cwd(), argValue("out"))
  : repoRoot;

// split/join instead of String.replace — replacement text must be literal
// (no $-pattern expansion) even when content.md contains `$&`-style text.
// Each placeholder is stamped twice: raw, and percent-encoded — marked
// escapes {{...}} inside markdown link hrefs into %7B%7B...%7D%7D.
function stamp(template, vars) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(value);
    out = out.split(`%7B%7B${key}%7D%7D`).join(value);
  }
  return out;
}

const escapeHtml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function writePage(relPath, vars) {
  const file = resolve(outRoot, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    stamp(readFileSync(resolve(scriptDir, "template.html"), "utf8"), vars),
  );
  console.log(`wrote ${file}`);
}

function downloadsPage(versions, latest) {
  const rows = versions
    .map(
      (v) =>
        `      <tr><td>v${escapeHtml(v.version)}</td><td>${
          escapeHtml(v.date)
        }</td><td><a href="${escapeHtml(v.filename)}">${
          escapeHtml(v.filename)
        }</a></td><td>${escapeHtml(v.notes)}</td></tr>`,
    )
    .join("\n");
  return [
    "<h1>domino-fox — 下载页</h1>",
    '<p>所有历史版本。<a href="../">返回介绍页</a>。</p>',
    "  <table>",
    "    <thead><tr><th>版本</th><th>上传日期</th><th>链接</th><th>Notes</th></tr></thead>",
    "    <tbody>",
    rows,
    "    </tbody>",
    "  </table>",
  ].join("\n");
}

// --- intro page (site/index.html) -------------------------------------------

const releases = existsSync(releasesPath)
  ? JSON.parse(readFileSync(releasesPath, "utf8"))
  : null;
const versions = Array.isArray(releases?.versions) ? releases.versions : [];
const latest = versions[0]; // registry is newest-first

const introHtml = marked.parse(
  readFileSync(resolve(scriptDir, "content.md"), "utf8"),
  {
    gfm: true,
  },
);

writePage("site/index.html", {
  CONTENT: introHtml,
  TITLE: "domino-fox",
  DESCRIPTION:
    "domino-fox — 火狐插件，在浏览器中让大模型自己访问网页、编写脚本。",
  ROOT: "",
  LATEST_VERSION: latest ? latest.version : "unreleased",
  LATEST_XPI: latest ? latest.filename : "unreleased",
  LATEST_LINK: latest ? `download/${latest.filename}` : "download/unreleased",
});

// --- downloads page (download/index.html) -----------------------------------

if (latest) {
  writePage("download/index.html", {
    CONTENT: downloadsPage(versions, latest),
    TITLE: "domino-fox 下载页",
    DESCRIPTION: "domino-fox — 插件发布页面",
    ROOT: "../",
    LATEST_VERSION: latest.version,
    LATEST_XPI: latest.filename,
    // this page lives in download/, so the latest xpi is a same-dir link
    LATEST_LINK: latest.filename,
  });
} else {
  console.log(
    `note: releases.json not found at ${releasesPath} — LATEST_* stamped "unreleased", download/index.html skipped`,
  );
}
