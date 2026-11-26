/* Node tests for library.json + library.js. Run: node test_library.js
 * Exit code 0 only when every check passes.
 *
 * COUNT NOTE: the library holds 81 entries: the 77 files in the Document
 * Index, third edition, 2026-11-16 (the 71-file field-reference
 * collection, the contest schedule, the index itself, the two
 * question-pool files, the Tonne article, and the blind-population
 * reference), plus the Emergency Communications FOG link index and the
 * PEP/IPAWS reference, both added 2026-11-22, plus the weather spotting
 * and weather radio guide and the digital voice weather and emergency
 * resources list, both added 2026-11-23, plus the first radio guide,
 * added 2026-11-25, minus one — the question pool's two files are a
 * single entry. The 46 field-reference Braille
 * and plain-text files are
 * NOT entries here — they are not in the index (they are not in group
 * Files); the page links to their folders in the field-reference
 * repository instead. Since 2026-11-22 each field-reference entry also
 * carries a brailleUrl to its own .brf file, and the FOG index, the
 * PEP/IPAWS reference, the weather guide, the digital voice list, the
 * blind-population chart, the question pool, and the first radio guide
 * carry one too
 * (76 entries, 30 distinct .brf files); the .brf files are still not
 * entries, only secondary links next to the main download link. The
 * same 76 entries carry a textUrl, which is what their Listen button
 * reads aloud.
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
check("81 library entries", data.length === 81, "got " + data.length);

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
check("counts by list match the index (5 kit, 66 sections, 1 cntst, 1 gen, 2 lic, 1 radio, 1 res)",
  Object.keys(LISTS).every(function (k) { return byList[k] === LISTS[k]; }),
  JSON.stringify(byList));

/* ---- URL rules ---- */
const withUrl = data.filter(function (e) { return e.url; });
const withoutUrl = data.filter(function (e) { return !e.url; });
check("80 entries have a download link, 1 does not",
  withUrl.length === 80 && withoutUrl.length === 1,
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
    .every(function (u) { return /^(CNTST|LIC|RES|EMERG)\//.test(u); }),
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
const emergOnDisk = new Set(
  fs.readdirSync(path.join(__dirname, "EMERG"))
);
const resOnDisk = new Set(
  fs.readdirSync(path.join(__dirname, "RES"))
);
const licOnDisk = new Set(
  fs.readdirSync(path.join(__dirname, "LIC"))
);
const techBrfOnDisk = new Set(
  fs.readdirSync(path.join(process.env.HOME, "workspace/github-pages-staging/technician-class/braille"))
);
const TECH = "https://visually-inconvenienced-hams.github.io/technician-class/";
const withBraille = data.filter(function (e) { return e.brailleUrl; });
check("76 entries carry a Braille link (3 whole-book + 66 sections + the FOG index + the PEP/IPAWS reference + the weather guide + the digital voice list + the blind-population chart + the question pool + the first radio guide)",
  withBraille.length === 76, "got " + withBraille.length);
check("30 distinct Braille files (the 3 formats of a section share one .brf, plus the FOG .brf, the PEP .brf, the weather .brf, the digital voice .brf, the chart .brf, the pool .brf, and the first radio .brf)",
  new Set(withBraille.map(function (e) { return e.brailleUrl; })).size === 30);
check("every Braille link ends in .brf and points into the field-reference braille/ folder, this repo's EMERG/, RES/, or LIC/ folder, or the Technician-class braille/ folder",
  withBraille.every(function (e) {
    return /\.brf$/.test(e.brailleUrl)
      && (e.brailleUrl.indexOf(FR + "braille/") === 0 || e.brailleUrl.indexOf("EMERG/") === 0 || e.brailleUrl.indexOf("RES/") === 0 || e.brailleUrl.indexOf("LIC/") === 0 || e.brailleUrl.indexOf(TECH + "braille/") === 0);
  }));
check("every Braille file name exists in its staging folder (field-reference braille/, this repo's EMERG/, RES/, or LIC/, or the Technician-class braille/ folder)",
  withBraille.every(function (e) {
    var name = e.brailleUrl.split("/").pop();
    if (e.brailleUrl.indexOf("EMERG/") === 0) return emergOnDisk.has(name);
    if (e.brailleUrl.indexOf("RES/") === 0) return resOnDisk.has(name);
    if (e.brailleUrl.indexOf("LIC/") === 0) return licOnDisk.has(name);
    if (e.brailleUrl.indexOf(TECH + "braille/") === 0) return techBrfOnDisk.has(name);
    return brfOnDisk.has(name);
  }));
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
check("the kit zip, the read-me, and all non-field entries except the Emergency Communications entries, the chart, and the question pool carry no Braille link",
  data.filter(function (e) { return !e.brailleUrl; }).length === 5
  && !zip[0].brailleUrl
  && !data.filter(function (e) { return e.file.indexOf("READ_ME_FIRST") === 0; })[0].brailleUrl
  && data.filter(function (e) { return e.category !== "FIELD" && e.list !== "emerg" && e.list !== "res" && e.list !== "lic"; })
    .every(function (e) { return !e.brailleUrl; }));

/* ---- Download-panel format links: EPUB, Word, PDF (2026-11-25) ---- */
const frSectionsOnDisk = new Set(
  fs.readdirSync(path.join(process.env.HOME, "workspace/github-pages-staging/field-reference/sections"))
);
const frRootOnDisk = new Set(
  fs.readdirSync(path.join(process.env.HOME, "workspace/github-pages-staging/field-reference"))
);
function twinOnDisk(u) {
  var name = u.split("/").pop();
  if (u.indexOf("EMERG/") === 0) return emergOnDisk.has(name);
  if (u.indexOf("RES/") === 0) return resOnDisk.has(name);
  if (u.indexOf("LIC/") === 0) return licOnDisk.has(name);
  if (u.indexOf(FR + "sections/") === 0) return frSectionsOnDisk.has(name);
  if (u.indexOf(FR) === 0) return frRootOnDisk.has(name);
  return false;
}
const withEpub = data.filter(function (e) { return e.epubUrl; });
check("76 entries carry an EPUB link (the same entries as the Braille links)",
  withEpub.length === 76, "got " + withEpub.length);
check("30 distinct EPUB files (the 3 formats of a section share one .epub)",
  new Set(withEpub.map(function (e) { return e.epubUrl; })).size === 30);
check("every EPUB link ends in .epub and points into the field-reference sections/ folder or root, or this repo's EMERG/, RES/, or LIC/ folder",
  withEpub.every(function (e) {
    return /\.epub$/.test(e.epubUrl)
      && (e.epubUrl.indexOf(FR + "sections/") === 0 || e.epubUrl.indexOf(FR) === 0
        || e.epubUrl.indexOf("EMERG/") === 0 || e.epubUrl.indexOf("RES/") === 0
        || e.epubUrl.indexOf("LIC/") === 0);
  }));
check("every EPUB file name exists in its staging folder",
  withEpub.every(function (e) { return twinOnDisk(e.epubUrl); }));
const epubBySub = {};
withEpub.filter(function (e) { return e.list === "field-sections"; }).forEach(function (e) {
  (epubBySub[e.subsection] = epubBySub[e.subsection] || new Set()).add(e.epubUrl);
});
check("the 3 entries of each section share one EPUB link",
  Object.keys(epubBySub).length === 22
  && Object.keys(epubBySub).every(function (k) { return epubBySub[k].size === 1; }));
const withWord = data.filter(function (e) { return e.wordUrl; });
check("76 entries carry a Word link (the same entries as the Braille links)",
  withWord.length === 76, "got " + withWord.length);
check("30 distinct Word files (the 3 formats of a section share one .docx)",
  new Set(withWord.map(function (e) { return e.wordUrl; })).size === 30);
check("every Word link ends in .docx and every Word file exists in its staging folder",
  withWord.every(function (e) { return /\.docx$/.test(e.wordUrl) && twinOnDisk(e.wordUrl); }));
const withPdf = data.filter(function (e) { return e.pdfUrl; });
check("75 entries carry a PDF link (the Braille-link entries minus the question pool, which has no PDF)",
  withPdf.length === 75, "got " + withPdf.length);
check("52 distinct PDF files (22 large-print + 22 tagged section PDFs, the full book's two PDFs, and 6 local PDFs)",
  new Set(withPdf.map(function (e) { return e.pdfUrl; })).size === 52);
check("every PDF link ends in .pdf and every PDF file exists in its staging folder",
  withPdf.every(function (e) {
    if (!/\.pdf$/.test(e.pdfUrl)) return false;
    if (e.pdfUrl.indexOf(FR + "tagged/") === 0) {
      return fs.existsSync(path.join(process.env.HOME,
        "workspace/github-pages-staging/field-reference/tagged", e.pdfUrl.split("/").pop()));
    }
    return twinOnDisk(e.pdfUrl);
  }));
check("a Word entry's PDF link is its section's large-print PDF",
  data.filter(function (e) { return e.list === "field-sections" && e.format === "Word document"; })
    .every(function (e) { return e.pdfUrl === FR + "sections/" + e.subsection + ".pdf"; }));
/* ---- Download-panel format links: eBraille and PEF (2026-11-25) ---- */
const withEbraille = data.filter(function (e) { return e.ebrailleUrl; });
check("76 entries carry an eBraille link (the same entries as the Braille links)",
  withEbraille.length === 76, "got " + withEbraille.length);
check("30 distinct eBraille files (the 3 formats of a section share one .ebrl)",
  new Set(withEbraille.map(function (e) { return e.ebrailleUrl; })).size === 30);
check("every eBraille link ends in .ebrl and every eBraille file exists in its staging folder",
  withEbraille.every(function (e) { return /\.ebrl$/.test(e.ebrailleUrl) && twinOnDisk(e.ebrailleUrl); }));
const ebrailleBySub = {};
withEbraille.filter(function (e) { return e.list === "field-sections"; }).forEach(function (e) {
  (ebrailleBySub[e.subsection] = ebrailleBySub[e.subsection] || new Set()).add(e.ebrailleUrl);
});
check("the 3 entries of each section share one eBraille link",
  Object.keys(ebrailleBySub).length === 22
  && Object.keys(ebrailleBySub).every(function (k) { return ebrailleBySub[k].size === 1; }));
const withPef = data.filter(function (e) { return e.pefUrl; });
check("76 entries carry a PEF link (the same entries as the Braille links)",
  withPef.length === 76, "got " + withPef.length);
check("30 distinct PEF files (the 3 formats of a section share one .pef)",
  new Set(withPef.map(function (e) { return e.pefUrl; })).size === 30);
check("every PEF link ends in .pef and every PEF file exists in its staging folder",
  withPef.every(function (e) { return /\.pef$/.test(e.pefUrl) && twinOnDisk(e.pefUrl); }));
const pefBySub = {};
withPef.filter(function (e) { return e.list === "field-sections"; }).forEach(function (e) {
  (pefBySub[e.subsection] = pefBySub[e.subsection] || new Set()).add(e.pefUrl);
});
check("the 3 entries of each section share one PEF link",
  Object.keys(pefBySub).length === 22
  && Object.keys(pefBySub).every(function (k) { return pefBySub[k].size === 1; }));
check("the 5 entries without a Braille link also carry no EPUB, Word, PDF, eBraille, or PEF link",
  data.filter(function (e) { return !e.brailleUrl; })
    .every(function (e) { return !e.epubUrl && !e.wordUrl && !e.pdfUrl && !e.ebrailleUrl && !e.pefUrl; }));

/* ---- Emergency Communications entries: Listen button and Braille link ---- */
const emerg = data.filter(function (e) { return e.list === "emerg"; });
check("four Emergency Communications entries (the FOG link index, the PEP/IPAWS reference, the weather guide, and the digital voice list)",
  emerg.length === 4, "got " + emerg.length);
check("each Emergency Communications entry has a plain-text twin and a Braille twin beside the PDF",
  emerg.length === 4 && emerg.every(function (e) {
    return e.textUrl === "EMERG/" + e.file.replace(/\.pdf$/, ".txt")
      && e.brailleUrl === "EMERG/" + e.file.replace(/\.pdf$/, ".brf");
  }));
check("the Emergency Communications text and Braille twins exist in the staging EMERG/ folder",
  emerg.length === 4 && emerg.every(function (e) {
    return emergOnDisk.has(e.textUrl.split("/").pop())
      && emergOnDisk.has(e.brailleUrl.split("/").pop());
  }));
check("searching \"listen\" finds all four Emergency Communications entries",
  L.searchLibrary(data, "listen").filter(function (e) { return e.list === "emerg"; }).length === 4);
check("searching \"fog\" finds the FOG link index",
  L.searchLibrary(data, "fog").some(function (e) { return e.list === "emerg"; }));
check("searching \"pep\" finds the PEP/IPAWS reference",
  L.searchLibrary(data, "pep").some(function (e) { return e.file.indexOf("PEP-IPAWS") === 0; }));

/* ---- Licensing: the first radio guide ---- */
const firstRadio = data.filter(function (e) { return e.file.indexOf("First-Radio") === 0; });
check("the first radio guide has a plain-text twin and a Braille twin beside the PDF",
  firstRadio.length === 1
  && firstRadio[0].textUrl === "LIC/" + firstRadio[0].file.replace(/\.pdf$/, ".txt")
  && firstRadio[0].brailleUrl === "LIC/" + firstRadio[0].file.replace(/\.pdf$/, ".brf"));
check("the first radio guide text and Braille twins exist in the staging LIC/ folder",
  firstRadio.length === 1
  && licOnDisk.has(firstRadio[0].textUrl.split("/").pop())
  && licOnDisk.has(firstRadio[0].brailleUrl.split("/").pop()));

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
check("index.html has 7 data-list slots", slotKeys.length === 7, "got " + slotKeys.length);
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
check("groupBySection returns 7 groups", groups.length === 7, "got " + groups.length);
check("first group is the Field Reference (71), last is Emergency Communications (4)",
  groups.length > 0 && groups[0].section === "AB9MZ Master Field Reference"
  && groups[0].entries.length === 71
  && groups[groups.length - 1].section === "Emergency Communications"
  && groups[groups.length - 1].entries.length === 4);
check("grouped entries total 81",
  groups.reduce(function (n, g) { return n + g.entries.length; }, 0) === 81);
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

check("\"braille\" finds the question pool, the first radio guide, and all four Emergency Communications entries (their keywords name Braille; the field-reference Braille links are still not search tokens)",
  L.searchLibrary(data, "braille").length === 6
  && L.searchLibrary(data, "braille").filter(function (e) { return e.list === "lic" && e.brailleUrl; }).length === 2
  && L.searchLibrary(data, "braille").filter(function (e) { return e.list === "emerg"; }).length === 4);

check("\"question pool\" finds the single grouped pool entry",
  L.searchLibrary(data, "question pool").length === 1);

check("\"field reference\" finds all 71 field-reference entries",
  L.searchLibrary(data, "field reference").length === 71);

check("\"licensing\" finds the question pool and the first radio guide",
  L.searchLibrary(data, "licensing").length === 2);

check("\"zzzzz\" returns zero results", L.searchLibrary(data, "zzzzz").length === 0);

check("blank query returns all 81 entries in data order",
  L.searchLibrary(data, "   ").length === 81
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
check("date-newest starts with the first radio guide (2026-11-25) and ends with the Tonne article (no date)",
  dateNewest[0].file === "First-Radio_v1.0-20261125-AB9MZ.pdf"
  && dateNewest[dateNewest.length - 1].file.indexOf("Tonne") !== -1
  && L.dateKey(dateNewest[0]) === "2026-11-25T00:00",
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
