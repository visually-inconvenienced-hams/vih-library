/* Node tests for library.json + library.js. Run: node test_library.js
 * Exit code 0 only when every check passes.
 *
 * COUNT NOTE: the library holds 77 files, one per file in the Document
 * Index, third edition, 2026-11-16: the 71-file field-reference
 * collection, the contest schedule, the index itself, the two
 * question-pool files, the Tonne article, and the blind-population
 * reference. The 46 field-reference Braille and plain-text files are
 * NOT entries here — they are not in the index (they are not in group
 * Files); the page links to their folders in the field-reference
 * repository instead. Since 2026-11-22 each field-reference entry also
 * carries a brailleUrl to its own .brf file (69 entries, 23 distinct
 * .brf files); the .brf files are still not entries, only secondary
 * links next to the main download link.
 *
 * NAME NOTE: field-reference entries carry their RENAMED file names
 * (stamp _v2.0-20261116-2218-AB9MZ), but their download URLs point at
 * the field-reference repository, which keeps the PLAIN kit names (the
 * selector loads section files by those names). So a field-reference
 * entry's file name and its URL's file name deliberately differ, and
 * the checks below assert exactly that. The kit zip is the exception:
 * it is uploaded to the field-reference repository under its STAMPED
 * name, so its URL carries the stamp.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(DIR, "library.json"), "utf8"));
const L = require("./library.js");
const html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const renamedOnDisk = new Set(
  fs.readdirSync(path.join(process.env.HOME, "workspace/field-reference-files-renamed"))
);

const FACEBOOK = "https://m.facebook.com/groups/742838019382868";
const FR = "https://visually-inconvenienced-hams.github.io/field-reference/";
const STATUSES = ["available", "pending", "superseded"];
const LISTS = {
  "field-kit": 5, "field-sections": 66, "cntst": 1, "gen": 1,
  "lic": 2, "radio": 1, "res": 1
};

let failures = 0;
function check(name, cond, detail) {
  if (!cond) failures++;
  console.log((cond ? "PASS" : "FAIL") + "  " + name + (detail ? "  | " + detail : ""));
}

/* ---- count and fields ---- */
check("77 library entries", data.length === 77, "got " + data.length);

let badFields = [];
data.forEach(function (e, i) {
  if (!e.name || !e.file || !e.category || !e.categoryName || !e.section
      || !e.list || !e.format || !e.note) {
    badFields.push(i + ":" + (e.file || "?"));
  }
  if (STATUSES.indexOf(e.status) === -1) badFields.push(i + ":status");
  if (!Array.isArray(e.keywords) || e.keywords.length < 2) badFields.push(i + ":keywords");
  if (!("version" in e) || !("date" in e) || !("time" in e) || !("author" in e)) {
    badFields.push(i + ":stamp-fields");
  }
});
check("every entry has all required fields non-empty", badFields.length === 0,
  badFields.slice(0, 5).join(", "));

/* ---- counts by list ---- */
const byList = {};
data.forEach(function (e) { byList[e.list] = (byList[e.list] || 0) + 1; });
check("counts by list match the index (5 kit, 66 sections, 1+1+2+1+1)",
  Object.keys(LISTS).every(function (k) { return byList[k] === LISTS[k]; }),
  JSON.stringify(byList));

/* ---- URL rules ---- */
const withUrl = data.filter(function (e) { return e.url; });
const withoutUrl = data.filter(function (e) { return !e.url; });
check("76 entries have a download link, 1 does not",
  withUrl.length === 76 && withoutUrl.length === 1,
  withUrl.length + " with, " + withoutUrl.length + " without");
check("the 1 link-less entry is the superseded index",
  withoutUrl.length === 1 && withoutUrl[0].status === "superseded",
  withoutUrl.map(function (e) { return e.file; }).join(", "));
check("every available entry has a URL",
  data.filter(function (e) { return e.status === "available"; })
    .every(function (e) { return !!e.url; }));

const urls = withUrl.map(function (e) { return e.url; });
check("no duplicate URLs", new Set(urls).size === urls.length,
  "unique " + new Set(urls).size + " of " + urls.length);
check("every absolute URL starts with https://",
  urls.filter(function (u) { return u.indexOf("://") !== -1; })
    .every(function (u) { return u.indexOf("https://") === 0; }));
check("relative URLs live under a category folder",
  urls.filter(function (u) { return u.indexOf("://") === -1; })
    .every(function (u) { return /^(CNTST|LIC|RES)\//.test(u); }),
  urls.filter(function (u) { return u.indexOf("://") === -1; }).join(", "));

/* ---- field-reference entries: renamed names, plain repo URLs ---- */
const field = data.filter(function (e) { return e.category === "FIELD"; });
check("71 field-reference entries", field.length === 71, "got " + field.length);
check("every field-reference file name exists in the renamed staging folder",
  field.every(function (e) { return renamedOnDisk.has(e.file); }));
check("every field-reference entry carries version 2.0, date 2026-11-16, time 22:18, author AB9MZ",
  field.every(function (e) {
    return e.version === "2.0" && e.date === "2026-11-16"
      && e.time === "22:18" && e.author === "AB9MZ";
  }));
const fieldUrls = field.filter(function (e) { return e.url.indexOf(FR) === 0; });
check("all 71 field-reference entries link into the field-reference repo (including the zip)",
  fieldUrls.length === 71, "got " + fieldUrls.length);
check("no field-reference repo URL carries the rename stamp, except the kit zip (uploaded under its stamped name)",
  fieldUrls.filter(function (e) { return e.format !== "Zip file"; })
    .every(function (e) { return e.url.indexOf("_v2.0-") === -1; }));
const zip = field.filter(function (e) { return e.format === "Zip file"; });
check("the kit zip links into the field-reference repo under its stamped name",
  zip.length === 1
  && zip[0].url === FR + "AB9MZ_Field_Reference_Complete_Kit_v2.0-20261116-2218-AB9MZ.zip");

/* ---- Braille links: per-entry .brf downloads ---- */
const brfOnDisk = new Set(
  fs.readdirSync(path.join(process.env.HOME, "workspace/github-pages-staging/field-reference/braille"))
);
const withBraille = data.filter(function (e) { return e.brailleUrl; });
check("69 entries carry a Braille link (3 whole-book + 66 sections)",
  withBraille.length === 69, "got " + withBraille.length);
check("23 distinct Braille files (the 3 formats of a section share one .brf)",
  new Set(withBraille.map(function (e) { return e.brailleUrl; })).size === 23);
check("every Braille link points into the field-reference braille/ folder and ends in .brf",
  withBraille.every(function (e) {
    return e.brailleUrl.indexOf(FR + "braille/") === 0 && /\.brf$/.test(e.brailleUrl);
  }));
check("every Braille file name exists in the field-reference staging braille/ folder",
  withBraille.every(function (e) { return brfOnDisk.has(e.brailleUrl.split("/").pop()); }));
const brailleBySub = {};
withBraille.filter(function (e) { return e.list === "field-sections"; }).forEach(function (e) {
  (brailleBySub[e.subsection] = brailleBySub[e.subsection] || new Set()).add(e.brailleUrl);
});
check("the 3 entries of each section share one Braille link",
  Object.keys(brailleBySub).length === 22
  && Object.keys(brailleBySub).every(function (k) { return brailleBySub[k].size === 1; }));
const kitBraille = withBraille.filter(function (e) { return e.list === "field-kit"; });
check("the 3 whole-book entries share the whole-book Braille file",
  kitBraille.length === 3
  && new Set(kitBraille.map(function (e) { return e.brailleUrl; })).size === 1
  && kitBraille[0].brailleUrl
    === FR + "braille/AB9MZ_Amateur_Radio_Field_Reference_v2.0-20261116-2210-AB9MZ.brf");
check("the kit zip, the read-me, and all non-field entries carry no Braille link",
  data.filter(function (e) { return !e.brailleUrl; }).length === 8
  && !zip[0].brailleUrl
  && !data.filter(function (e) { return e.file.indexOf("READ_ME_FIRST") === 0; })[0].brailleUrl
  && data.filter(function (e) { return e.category !== "FIELD"; })
    .every(function (e) { return !e.brailleUrl; }));

/* ---- group-maintained files ---- */
const maintained = data.filter(function (e) { return e.maintained; });
check("exactly 2 group-maintained files (contest schedule, index)",
  maintained.length === 2
  && maintained.some(function (e) { return e.file === "$Contest-Schedule.txt"; })
  && maintained.some(function (e) { return e.file === "!Document-Index.txt"; }),
  maintained.map(function (e) { return e.file; }).join(", "));

/* ---- list keys match the page's slots ---- */
const slotKeys = [];
const slotRe = /<ul class="doc-list" data-list="([^"]+)"/g;
let sm;
while ((sm = slotRe.exec(html)) !== null) slotKeys.push(sm[1]);
check("index.html has 6 data-list slots", slotKeys.length === 6, "got " + slotKeys.length);
check("index.html has the field-sections container",
  html.indexOf('data-section-list="field-sections"') !== -1);
const entryLists = new Set(data.map(function (e) { return e.list; }));
check("every entry list key has a slot or the sections container in the page",
  [...entryLists].every(function (k) {
    return slotKeys.indexOf(k) !== -1 || k === "field-sections";
  }));
check("every page slot has at least one entry",
  slotKeys.every(function (k) { return entryLists.has(k); }));
check("Facebook return link still present in index.html (top and bottom)",
  (html.match(/m\.facebook\.com\/groups\/742838019382868/g) || []).length >= 2);

/* ---- the close-button script must only touch back-links ---- */
check("close-button and deep-link scripts are scoped to a.back-link (the zip link is a download)",
  (html.match(/a\.back-link\[href\*="facebook\.com\/groups\/742838019382868"\]/g) || []).length === 2
  && (html.match(/querySelectorAll\('a\[href\*="facebook\.com/g) || []).length === 0);

/* ---- grouping ---- */
const groups = L.groupBySection(data);
check("groupBySection returns 6 groups", groups.length === 6, "got " + groups.length);
check("first group is the Field Reference (71), last is Resources (1)",
  groups.length > 0 && groups[0].section === "AB9MZ Master Field Reference"
  && groups[0].entries.length === 71
  && groups[groups.length - 1].section === "Resources"
  && groups[groups.length - 1].entries.length === 1);
check("grouped entries total 77",
  groups.reduce(function (n, g) { return n + g.entries.length; }, 0) === 77);
const subs = L.groupBySubsection(data.filter(function (e) { return e.list === "field-sections"; }));
check("groupBySubsection returns 22 groups in book order (guide first, reference last)",
  subs.length === 22 && subs[0].subsection === "guide"
  && subs[subs.length - 1].subsection === "reference"
  && subs.every(function (g) { return g.entries.length === 3; }),
  "got " + subs.length);

/* ---- search ---- */
function files(results) { return results.map(function (e) { return e.file; }); }

const morse = L.searchLibrary(data, "morse");
check("\"morse\" finds the 3 Morse files, the 3 CW files, and the Tonne article",
  morse.length === 7
  && morse.filter(function (e) { return e.file.indexOf("morse") === 0; }).length === 3
  && morse.filter(function (e) { return e.file.indexOf("cw") === 0; }).length === 3
  && morse.some(function (e) { return e.file.indexOf("Tonne") !== -1; }),
  morse.length + " results");

check("\"braille\" finds only the question-pool Braille file",
  L.searchLibrary(data, "braille").length === 1
  && L.searchLibrary(data, "braille")[0].file.indexOf(".brf") !== -1);

check("\"question pool\" finds both pool files",
  L.searchLibrary(data, "question pool").length === 2);

check("\"field reference\" finds all 71 field-reference entries",
  L.searchLibrary(data, "field reference").length === 71);

check("\"licensing\" finds the 2 pool files",
  L.searchLibrary(data, "licensing").length === 2);

check("\"zzzzz\" returns zero results", L.searchLibrary(data, "zzzzz").length === 0);

check("blank query returns all 77 entries in data order",
  L.searchLibrary(data, "   ").length === 77
  && L.searchLibrary(data, "").map(function (e) { return e.file; }).join()
    === data.map(function (e) { return e.file; }).join());

/* ---- sort ---- */
check("sortLibrary offers the 5 documented orders",
  L.SORT_ORDERS.join() === "listed,name-asc,name-desc,date-newest,date-oldest");

const nameAsc = L.sortLibrary(data, "name-asc");
check("name-asc starts with !Document-Index.txt and ends with the weather PDF",
  nameAsc[0].file === "!Document-Index.txt"
  && nameAsc[nameAsc.length - 1].file === "weather_v2.0-20261116-2218-AB9MZ.pdf",
  nameAsc[0].file + " ... " + nameAsc[nameAsc.length - 1].file);

const nameDesc = L.sortLibrary(data, "name-desc");
check("name-desc is the exact reverse of name-asc",
  nameDesc.map(function (e) { return e.file; }).join()
    === nameAsc.map(function (e) { return e.file; }).reverse().join());

const dateNewest = L.sortLibrary(data, "date-newest");
check("date-newest starts with a 22:18 field file and ends with the Tonne article (no date)",
  dateNewest[0].file === "AB9MZ_Amateur_Radio_Field_Reference-tagged_v2.0-20261116-2218-AB9MZ.pdf"
  && dateNewest[dateNewest.length - 1].file.indexOf("Tonne") !== -1
  && L.dateKey(dateNewest[0]) === "2026-11-16T22:18",
  dateNewest[0].file + " ... " + dateNewest[dateNewest.length - 1].file);

const dateOldest = L.sortLibrary(data, "date-oldest");
check("date-oldest starts with the contest schedule (2026-11-12) and ends with the Tonne article",
  dateOldest[0].file === "$Contest-Schedule.txt"
  && dateOldest[dateOldest.length - 1].file.indexOf("Tonne") !== -1);

check("date sorts put the two dateless files last",
  L.dateKey(dateNewest[dateNewest.length - 1]) === null
  && L.dateKey(dateNewest[dateNewest.length - 2]) === null
  && L.dateKey(dateOldest[dateOldest.length - 1]) === null);

check("listed order is data order",
  L.sortLibrary(data, "listed").map(function (e) { return e.file; }).join()
    === data.map(function (e) { return e.file; }).join());

check("an unknown order falls back to data order",
  L.sortLibrary(data, "bogus").map(function (e) { return e.file; }).join()
    === data.map(function (e) { return e.file; }).join());

const before = data.map(function (e) { return e.file; }).join();
L.sortLibrary(data, "name-asc");
L.sortLibrary(data, "date-newest");
check("sortLibrary never mutates its input",
  data.map(function (e) { return e.file; }).join() === before);

check("dateKey returns null for the Tonne article",
  L.dateKey(data.filter(function (e) { return e.file.indexOf("Tonne") !== -1; })[0]) === null);

console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
process.exit(failures === 0 ? 0 : 1);
