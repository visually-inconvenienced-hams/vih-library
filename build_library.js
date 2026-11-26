/* Build library.json for the VIH group document library page.
 *
 * Run: node build_library.js
 * Writes: library.json (81 entries: the 77 files in the Document Index,
 * third edition, 2026-11-16, plus the Emergency Communications FOG link
 * index and the PEP/IPAWS emergency alerting reference, both added
 * 2026-11-22, plus the weather spotting and weather radio guide and the
 * digital voice weather and emergency resources list, both added
 * 2026-11-23, plus the first radio guide, added 2026-11-25, minus
 * one — the question pool's plain-text and Braille files are a single
 * entry, not two).
 *
 * Source of truth for the inventory: the Document Index at
 * ~/workspace/goals/visually-inconvenienced-hams-automated-group-posts/files/!Document-Index.txt
 *
 * NAME RULE: field-reference entries carry their RENAMED file names
 * (stamp _v2.0-20261116-2218-AB9MZ), matching the rename Gregory ordered
 * on 2026-11-16. The generator verifies every renamed name exists in
 * ~/workspace/field-reference-files-renamed/ and fails loudly if one is
 * missing. Download URLs point at the field-reference repository, which
 * keeps the PLAIN kit names (the selector loads section files by those
 * names), so the displayed file name and the URL's file name differ for
 * those entries — that is deliberate, and the BUILD-REPORT says so.
 * The kit zip is the exception: it is uploaded to the field-reference
 * repository under its STAMPED name, so its URL carries the stamp.
 *
 * URL RULE: files that will live in the new library repository use
 * relative URLs (LIC/..., CNTST/...), so they work whatever the repo is
 * called. Files already on GitHub use absolute Pages URLs. The kit zip
 * lives in the field-reference repository, so it links to its Pages URL
 * there. The superseded index has url null and no download link.
 *
 * BRAILLE RULE: the whole book and every section also exist as .brf
 * files (contracted UEB grade 2) in the field-reference repository's
 * braille/ folder. Those files carry their own stamp,
 * _v2.0-20261116-2210-AB9MZ (2210, from the Braille build — not the
 * 2218 rename stamp), so the generator verifies each .brf name against
 * the field-reference staging braille/ folder and fails loudly if one
 * is missing. Entries that have a .brf twin carry a brailleUrl field;
 * the three format entries of a section share one .brf file, so the
 * same brailleUrl appears on three entries (76 entries, 30 distinct
 * .brf files: 69 field-reference entries sharing 23 files, plus the
 * FOG link index, the PEP/IPAWS reference, the weather guide, and the
 * digital voice list, each with its own .brf in this repository's
 * EMERG/ folder, plus the blind-population chart, whose .brf twin sits
 * beside it in RES/, plus the question pool, whose .brf lives in the
 * Technician-class repository's braille/ folder, plus the first radio
 * guide, whose .brf sits in LIC/). The kit zip and the
 * read-me have no .brf twin and carry no brailleUrl.
 *
 * LISTEN RULE: an entry with a plain-text twin carries a textUrl
 * field; the page renders a Listen button beside it that reads the
 * text aloud with the device's own voice (browser speech, no audio
 * files — the same approach as the Technician class). The FOG link
 * index and the PEP/IPAWS reference have one, and so do the whole
 * book and every section of the field reference: their .txt twins
 * live in the field-reference repository's txt/ folder, carry the
 * same 2210 stamp as the .brf files, and are verified against staging
 * the same way. The three format entries of a section share one .txt
 * file, so the same textUrl appears on three entries (76 entries,
 * 30 distinct .txt files — the same shape as the Braille twins).
 *
 * DOWNLOAD RULE (added 2026-11-25): the page's Download button opens
 * a panel listing the entry's formats alphabetically — Braille,
 * eBraille (beta), EPUB, PDF, Text, Word — showing only the formats
 * that exist. The fields behind it: brailleUrl (.brf), ebrailleUrl
 * (.ebrl, shown as "eBraille (beta)"), epubUrl (.epub), pdfUrl (the
 * entry's PDF; a Word entry points at its section's large-print
 * PDF), pefUrl (.pef, shown as "Braille print file"), textUrl
 * (.txt), wordUrl (.docx). eBraille and PEF twins (added 2026-11-25,
 * converted from the DOCX files by DAISY Pipeline: grade-2 UEB;
 * PEF set up 40 cells by 25 lines, single-sided) sit beside the
 * DOCX files, the same way the EPUB twins do. EPUB and Word twins
 * exist for the same 76 entries
 * as the text twins (30 distinct files each): field-reference EPUBs
 * were converted from the section DOCX files and sit beside them in
 * sections/ (the full book's at the repository root); local EPUB and
 * DOCX files were converted from the plain-text sources and sit
 * beside them in EMERG/, RES/, and LIC/. Every twin is verified
 * against staging the same way as the .brf and .txt twins.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const STAMP = "_v2.0-20261116-2218-AB9MZ";
const FR = "https://visually-inconvenienced-hams.github.io/field-reference/";
const TECH = "https://visually-inconvenienced-hams.github.io/technician-class/";
/* The kit zip is uploaded to the field-reference repository under its
 * stamped name (see the first entry below). */
const ZIP_FILE = "AB9MZ_Field_Reference_Complete_Kit_v2.0-20261116-2218-AB9MZ.zip";

const RENAMED_DIR = path.join(process.env.HOME, "workspace/field-reference-files-renamed");
const renamedOnDisk = new Set(fs.readdirSync(RENAMED_DIR));
function stamped(stem, ext) {
  const name = stem + STAMP + ext;
  if (!renamedOnDisk.has(name)) {
    throw new Error("renamed file missing from staging: " + name);
  }
  return name;
}

/* The .brf files carry the Braille build's own stamp (2210, not the
 * 2218 rename stamp). Verify each one exists in the field-reference
 * staging braille/ folder, the same way stamped() verifies the
 * renamed files. */
const BRF_STAMP = "_v2.0-20261116-2210-AB9MZ";
const BRF_DIR = path.join(process.env.HOME, "workspace/github-pages-staging/field-reference/braille");
const brfOnDisk = new Set(fs.readdirSync(BRF_DIR));
function brailleUrl(stem) {
  const name = stem + BRF_STAMP + ".brf";
  if (!brfOnDisk.has(name)) {
    throw new Error("braille file missing from field-reference staging: " + name);
  }
  return FR + "braille/" + name;
}

/* The .txt twins carry the same 2210 stamp as the .brf files. Verify
 * each one exists in the field-reference staging txt/ folder. */
const TXT_DIR = path.join(process.env.HOME, "workspace/github-pages-staging/field-reference/txt");
const txtOnDisk = new Set(fs.readdirSync(TXT_DIR));
function textTwinUrl(stem) {
  const name = stem + BRF_STAMP + ".txt";
  if (!txtOnDisk.has(name)) {
    throw new Error("text file missing from field-reference staging: " + name);
  }
  return FR + "txt/" + name;
}

/* EPUB and Word twins (added 2026-11-25 for the Download panel).
 * Field-reference EPUBs sit beside the section DOCX files in
 * sections/ (the full book's EPUB sits at the repository root beside
 * its DOCX); they were converted from those DOCX files by pandoc
 * (build_epub_docx.py in the library goal's hidden_files). The Word
 * twin of a field-reference entry is its section DOCX. Verify each
 * file exists in field-reference staging, the same way brailleUrl()
 * verifies the .brf files. */
const FR_DIR = path.join(process.env.HOME, "workspace/github-pages-staging/field-reference");
const FR_SECTIONS_DIR = path.join(FR_DIR, "sections");
const frSectionsOnDisk = new Set(fs.readdirSync(FR_SECTIONS_DIR));
const frRootOnDisk = new Set(fs.readdirSync(FR_DIR));
function epubUrl(stem) {
  const name = stem + ".epub";
  if (!frSectionsOnDisk.has(name)) {
    throw new Error("epub file missing from field-reference staging: " + name);
  }
  return FR + "sections/" + name;
}
function wordUrl(stem) {
  const name = stem + ".docx";
  if (!frSectionsOnDisk.has(name)) {
    throw new Error("docx file missing from field-reference staging: " + name);
  }
  return FR + "sections/" + name;
}
function bookEpubUrl() {
  const name = "AB9MZ_Amateur_Radio_Field_Reference.epub";
  if (!frRootOnDisk.has(name)) {
    throw new Error("full-book epub missing from field-reference staging: " + name);
  }
  return FR + name;
}
function bookWordUrl() {
  const name = "AB9MZ_Amateur_Radio_Field_Reference.docx";
  if (!frRootOnDisk.has(name)) {
    throw new Error("full-book docx missing from field-reference staging: " + name);
  }
  return FR + name;
}

/* eBraille and PEF twins (added 2026-11-25 for the Download panel).
 * Converted from the same DOCX files by DAISY Pipeline (grade-2 UEB;
 * PEF 40 cells by 25 lines, single-sided); they sit beside the DOCX
 * files in sections/ (the full book's at the repository root), and
 * beside the local DOCX files in EMERG/, RES/, and LIC/. Verify each
 * file exists in staging, the same way epubUrl() verifies the EPUBs. */
function ebrailleUrl(stem) {
  const name = stem + ".ebrl";
  if (!frSectionsOnDisk.has(name)) {
    throw new Error("ebraille file missing from field-reference staging: " + name);
  }
  return FR + "sections/" + name;
}
function pefUrl(stem) {
  const name = stem + ".pef";
  if (!frSectionsOnDisk.has(name)) {
    throw new Error("pef file missing from field-reference staging: " + name);
  }
  return FR + "sections/" + name;
}
function bookEbrailleUrl() {
  const name = "AB9MZ_Amateur_Radio_Field_Reference.ebrl";
  if (!frRootOnDisk.has(name)) {
    throw new Error("full-book ebraille missing from field-reference staging: " + name);
  }
  return FR + name;
}
function bookPefUrl() {
  const name = "AB9MZ_Amateur_Radio_Field_Reference.pef";
  if (!frRootOnDisk.has(name)) {
    throw new Error("full-book pef missing from field-reference staging: " + name);
  }
  return FR + name;
}

/* The FOG link index lives in this repository (EMERG/), with its
 * plain-text and Braille twins beside it. Verify each file exists in
 * staging, the same way stamped() verifies the renamed files. */
const EMERG_DIR = path.join(__dirname, "EMERG");
const emergOnDisk = new Set(fs.readdirSync(EMERG_DIR));
function emergFile(name) {
  if (!emergOnDisk.has(name)) {
    throw new Error("EMERG file missing from staging: " + name);
  }
  return "EMERG/" + name;
}
const FOG_STEM = "Emergency-Communications-FOG-Link-Index_v1.0-20261122-AB9MZ";
const PEP_STEM = "PEP-IPAWS-Emergency-Alerting-Reference_v1.0-20261122-AB9MZ";
const WX_STEM = "Weather-Spotting-and-Weather-Radio_v1.0-20261123-AB9MZ";
const DV_STEM = "Digital-Voice-Weather-and-Emergency-Resources_v1.0-20261123-AB9MZ";

/* The blind-population chart's plain-text and Braille twins live
 * beside it in this repository's RES/ folder. */
const RES_DIR = path.join(__dirname, "RES");
const resOnDisk = new Set(fs.readdirSync(RES_DIR));
function resFile(name) {
  if (!resOnDisk.has(name)) {
    throw new Error("RES file missing from staging: " + name);
  }
  return "RES/" + name;
}

/* The first radio guide lives in this repository (LIC/), with its
 * plain-text and Braille twins beside it. Verify each file exists in
 * staging, the same way emergFile() verifies the EMERG files. */
const LIC_DIR = path.join(__dirname, "LIC");
const licOnDisk = new Set(fs.readdirSync(LIC_DIR));
function licFile(name) {
  if (!licOnDisk.has(name)) {
    throw new Error("LIC file missing from staging: " + name);
  }
  return "LIC/" + name;
}
const FR_STEM = "First-Radio_v1.0-20261125-AB9MZ";

/* The 22 field-reference sections in BOOK order (the order in the index
 * and in the book itself), each with its title and search keywords. */
const SECTIONS = [
  ["guide", "Using and printing this book", ["guide", "printing", "using", "how to use", "book"]],
  ["phonetics", "Phonetic alphabet", ["phonetics", "alphabet", "nato", "alpha", "bravo", "spelling"]],
  ["morse", "Morse code and procedural signals", ["morse", "code", "cw", "procedural", "dit", "dah", "signals"]],
  ["emergency", "Emergency operating procedures", ["emergency", "procedures", "emcomm", "disaster"]],
  ["voice", "Voice and repeater operation", ["voice", "repeater", "fm", "phone", "ssb"]],
  ["cw", "CW abbreviations", ["cw", "abbreviations", "morse", "prosigns", "shorthand"]],
  ["qsignals", "Q signals and net codes", ["q signals", "qsl", "qth", "net", "codes", "q codes"]],
  ["reports", "Signal reporting", ["signal", "reporting", "rst", "readability", "strength"]],
  ["bands", "US band privileges", ["bands", "privileges", "band plan", "frequency", "allocation"]],
  ["digital", "Digital modes and linked systems", ["digital", "modes", "ft8", "packet", "dmr", "linked", "systems"]],
  ["station", "Antennas, power, and station checks", ["station", "antennas", "power", "checks", "antenna"]],
  ["deployment", "Accessible deployment", ["deployment", "accessible", "field", "go kit", "portable"]],
  ["ares", "ARES", ["ares", "amateur radio emergency service", "emergency"]],
  ["races", "RACES", ["races", "radio amateur civil emergency service", "civil emergency"]],
  ["mars", "MARS", ["mars", "military auxiliary radio system", "military"]],
  ["cap", "Civil Air Patrol", ["cap", "civil air patrol"]],
  ["shares", "SHARES", ["shares", "shared resources", "hf", "emergency"]],
  ["observer", "Official Observer and Volunteer Monitor", ["observer", "volunteer monitor", "oo", "vm", "official observer"]],
  ["traffic", "National Traffic System", ["traffic", "nts", "messages", "radiogram", "national traffic system"]],
  ["forms", "Message forms, logs, and PACE plan", ["forms", "logs", "pace", "message", "log"]],
  ["weather", "Weather radio and storm reports", ["weather", "storm", "skywarn", "noaa", "weather radio"]],
  ["reference", "Glossary and review checklist", ["glossary", "checklist", "reference", "review", "terms"]]
];

const FIELD = {
  category: "FIELD",
  categoryName: "Field Reference",
  section: "AB9MZ Master Field Reference",
  version: "2.0",
  date: "2026-11-16",
  time: "22:18",
  author: "AB9MZ",
  status: "available"
};

const entries = [];
function add(e) { entries.push(e); }

/* ---- The whole kit: zip, read-me, full book in three formats ---- */
add(Object.assign({}, FIELD, {
  name: "AB9MZ Master Field Reference, complete kit — zip file",
  file: stamped("AB9MZ_Field_Reference_Complete_Kit", ".zip"),
  list: "field-kit",
  format: "Zip file",
  url: FR + ZIP_FILE,
  keywords: ["field reference", "kit", "zip", "complete", "whole book", "ab9mz", "download"],
  note: "The whole kit in one download: the full book, all 22 sections in all formats, the offline section selector, and the build files. The zip lives in the field-reference repository."
}));
add(Object.assign({}, FIELD, {
  name: "AB9MZ Master Field Reference — read me first",
  file: stamped("READ_ME_FIRST", ".txt"),
  list: "field-kit",
  format: "Plain text",
  url: FR + "READ_ME_FIRST.txt",
  keywords: ["field reference", "read me", "readme", "how the kit is organized", "ab9mz"],
  note: "How the kit is organized and what is in it. Start here if you downloaded the zip."
}));
add(Object.assign({}, FIELD, {
  name: "AB9MZ Master Field Reference, full book — large-print PDF",
  file: stamped("AB9MZ_Amateur_Radio_Field_Reference", ".pdf"),
  list: "field-kit",
  format: "Large-print PDF",
  url: FR + "AB9MZ_Amateur_Radio_Field_Reference.pdf",
  pdfUrl: FR + "AB9MZ_Amateur_Radio_Field_Reference.pdf",
  epubUrl: bookEpubUrl(),
  wordUrl: bookWordUrl(),
  brailleUrl: brailleUrl("AB9MZ_Amateur_Radio_Field_Reference"),
  ebrailleUrl: bookEbrailleUrl(),
  pefUrl: bookPefUrl(),
  textUrl: textTwinUrl("AB9MZ_Amateur_Radio_Field_Reference"),
  keywords: ["field reference", "full book", "complete", "pdf", "large print", "ab9mz"],
  note: "The full book, all 22 sections, large-print PDF. 22 point text, 28 point headings."
}));
add(Object.assign({}, FIELD, {
  name: "AB9MZ Master Field Reference, full book — Word document",
  file: stamped("AB9MZ_Amateur_Radio_Field_Reference", ".docx"),
  list: "field-kit",
  format: "Word document",
  url: FR + "AB9MZ_Amateur_Radio_Field_Reference.docx",
  pdfUrl: FR + "AB9MZ_Amateur_Radio_Field_Reference.pdf",
  epubUrl: bookEpubUrl(),
  wordUrl: bookWordUrl(),
  brailleUrl: brailleUrl("AB9MZ_Amateur_Radio_Field_Reference"),
  ebrailleUrl: bookEbrailleUrl(),
  pefUrl: bookPefUrl(),
  textUrl: textTwinUrl("AB9MZ_Amateur_Radio_Field_Reference"),
  keywords: ["field reference", "full book", "complete", "word", "docx", "ab9mz"],
  note: "The full book, all 22 sections, Word document."
}));
add(Object.assign({}, FIELD, {
  name: "AB9MZ Master Field Reference, full book — tagged PDF",
  file: stamped("AB9MZ_Amateur_Radio_Field_Reference-tagged", ".pdf"),
  list: "field-kit",
  format: "Tagged PDF",
  url: FR + "tagged/AB9MZ_Amateur_Radio_Field_Reference.pdf",
  pdfUrl: FR + "tagged/AB9MZ_Amateur_Radio_Field_Reference.pdf",
  epubUrl: bookEpubUrl(),
  wordUrl: bookWordUrl(),
  brailleUrl: brailleUrl("AB9MZ_Amateur_Radio_Field_Reference"),
  ebrailleUrl: bookEbrailleUrl(),
  pefUrl: bookPefUrl(),
  textUrl: textTwinUrl("AB9MZ_Amateur_Radio_Field_Reference"),
  keywords: ["field reference", "full book", "complete", "tagged", "pdf", "screen reader", "ab9mz"],
  note: "The full book, all 22 sections, tagged PDF. Screen readers navigate it by heading."
}));

/* ---- The 22 sections, three formats each, in book order ---- */
const FORMATS = [
  ["Large-print PDF", ".pdf", "sections/", ["pdf", "large print"],
   "Large-print PDF. 22 point text, 28 point headings."],
  ["Word document", ".docx", "sections/", ["word", "docx"],
   "Word document."],
  ["Tagged PDF", ".pdf", "tagged/", ["tagged", "pdf", "screen reader"],
   "Tagged PDF. Screen readers navigate it by heading."]
];
SECTIONS.forEach(function (s) {
  const stem = s[0];
  const title = s[1];
  const keys = s[2];
  FORMATS.forEach(function (f) {
    const format = f[0];
    const ext = f[1];
    const folder = f[2];
    const formatKeys = f[3];
    const formatNote = f[4];
    const isTagged = format === "Tagged PDF";
    const fileStem = isTagged ? stem + "-tagged" : stem;
    add(Object.assign({}, FIELD, {
      name: title + " — " + format,
      file: stamped(fileStem, ext),
      list: "field-sections",
      subsection: stem,
      subsectionTitle: title,
      format: format,
      url: FR + folder + stem + ext,
      /* The Download panel's PDF choice: a PDF entry offers its own
       * file; a Word entry offers the section's large-print PDF. */
      pdfUrl: format === "Word document" ? FR + "sections/" + stem + ".pdf" : FR + folder + stem + ext,
      epubUrl: epubUrl(stem),
      wordUrl: wordUrl(stem),
      brailleUrl: brailleUrl(stem),
      ebrailleUrl: ebrailleUrl(stem),
      pefUrl: pefUrl(stem),
      textUrl: textTwinUrl(stem),
      keywords: ["field reference"].concat(keys).concat(formatKeys),
      note: formatNote
    }));
  });
});

/* ---- Contests: the standing schedule, group-maintained ---- */
add({
  name: "Contest schedule — rolling 30-day window",
  file: "$Contest-Schedule.txt",
  category: "CNTST",
  categoryName: "Contests",
  section: "Contests",
  list: "cntst",
  format: "Plain text",
  url: "CNTST/$Contest-Schedule.txt",
  version: null,
  date: "2026-11-12",
  time: "10:00",
  author: null,
  keywords: ["contest", "schedule", "events", "on-air", "sweepstakes", "contests"],
  status: "available",
  maintained: true,
  note: "Group-maintained file. The standing contest and on-air events schedule, covering a rolling 30-day window. It is checked every morning and replaced with a new edition when the contest list changes or the edition is a week old."
});

/* ---- General: the index itself — this page replaces it ---- */
add({
  name: "Document index",
  file: "!Document-Index.txt",
  category: "GEN",
  categoryName: "General",
  section: "General",
  list: "gen",
  format: "Plain text",
  url: null,
  version: null,
  date: "2026-11-16",
  time: "20:41",
  author: null,
  keywords: ["index", "document index", "contents", "categories"],
  status: "superseded",
  maintained: true,
  note: "Group-maintained file. This page is now the document index, so the text file is no longer updated. Everything the index listed is on this page, with search and sort."
});

/* ---- Licensing and Exams: the Technician question pool ----
 * One entry for both files (Gregory's decision 2026-11-22): Open and
 * Listen read the plain-text pool; the Download button offers the
 * same pool in contracted Braille from the Technician-class repo,
 * plus EPUB and Word copies beside the text file in LIC/. */
add({
  name: "Technician question pool 2026-2030",
  file: "Technician-Question-Pool-2026-2030.txt",
  category: "LIC",
  categoryName: "Licensing and Exams",
  section: "Licensing and Exams",
  list: "lic",
  format: "Plain text",
  url: "LIC/Technician-Question-Pool-2026-2030.txt",
  textUrl: "LIC/Technician-Question-Pool-2026-2030.txt",
  epubUrl: licFile("Technician-Question-Pool-2026-2030.epub"),
  wordUrl: licFile("Technician-Question-Pool-2026-2030.docx"),
  brailleUrl: TECH + "braille/Technician-Question-Pool-2026-2030.brf",
  ebrailleUrl: licFile("Technician-Question-Pool-2026-2030.ebrl"),
  pefUrl: licFile("Technician-Question-Pool-2026-2030.pef"),
  version: null,
  date: "2026-11-16",
  time: "17:49",
  author: null,
  keywords: ["technician", "question pool", "exam", "license", "2026-2030", "questions", "braille", "brf", "licensing"],
  status: "available",
  note: "Public domain. The full 2026-2030 Technician question pool, all 409 questions. The Download button gives the same pool in contracted Braille (UEB grade 2), for Braille displays and embossers."
});

/* ---- Licensing and Exams: the first radio guide ---- */
add({
  name: "Your First Radio — guide",
  file: FR_STEM + ".pdf",
  category: "LIC",
  categoryName: "Licensing and Exams",
  section: "Licensing and Exams",
  list: "lic",
  format: "Guide PDF",
  url: licFile(FR_STEM + ".pdf"),
  pdfUrl: licFile(FR_STEM + ".pdf"),
  epubUrl: licFile(FR_STEM + ".epub"),
  wordUrl: licFile(FR_STEM + ".docx"),
  textUrl: licFile(FR_STEM + ".txt"),
  brailleUrl: licFile(FR_STEM + ".brf"),
  ebrailleUrl: licFile(FR_STEM + ".ebrl"),
  pefUrl: licFile(FR_STEM + ".pef"),
  version: "1.0",
  date: "2026-11-25",
  time: null,
  author: "AB9MZ",
  keywords: ["first radio", "new ham", "handheld", "mobile radio", "voice prompts", "chirp", "programming", "elmer", "getting started", "licensing", "listen", "braille"],
  status: "available",
  note: "How to pick your first radio and set it up. How to make your first contact. It covers handheld, mobile, and base radios. It covers voice prompts, power, and antennas. It covers programming with CHIRP. It tells where to get help, from the Saturday net to finding an elmer. Includes a Listen button and a Braille file."
});

/* ---- Radios: the Tonne article — links to the author's own copy ---- */
add({
  name: "Improved audio-frequency bandpass filter for Morse code reception — Tonne",
  file: "Improved Audio-Frequency Bandpass Filter for Morse Code Reception - Tonne.pdf",
  category: "RADIO",
  categoryName: "Radios",
  section: "Radios",
  list: "radio",
  format: "PDF",
  url: "https://tonnesoftware.com/downloads/2017-mar-apr-qex-Tonne.pdf",
  version: null,
  date: null,
  time: null,
  author: null,
  keywords: ["tonne", "bandpass", "filter", "audio", "morse", "cw", "reception"],
  status: "available",
  note: "By James L. Tonne, W4ENE, QEX March/April 2017, copyright ARRL. The author hosts it himself, so the page links to his copy rather than hosting one."
});

/* ---- Resources: the blind-population reference — Gregory's own graph, hosted ---- */
add({
  name: "Blind population distribution in the United States",
  file: "Blind-Population-Distribution.pdf",
  category: "RES",
  categoryName: "Resources",
  section: "Resources",
  list: "res",
  format: "PDF",
  url: "RES/Blind-Population-Distribution.pdf",
  pdfUrl: "RES/Blind-Population-Distribution.pdf",
  epubUrl: resFile("Blind-Population-Distribution.epub"),
  wordUrl: resFile("Blind-Population-Distribution.docx"),
  textUrl: resFile("Blind-Population-Distribution.txt"),
  brailleUrl: resFile("Blind-Population-Distribution.brf"),
  ebrailleUrl: resFile("Blind-Population-Distribution.ebrl"),
  pefUrl: resFile("Blind-Population-Distribution.pef"),
  version: null,
  date: null,
  time: null,
  author: null,
  keywords: ["blind", "population", "distribution", "statistics", "reference"],
  status: "available",
  note: "Made by Gregory AB9MZ from public data. Sources: data.gov, the World Health Organization (who.int), and national blind groups. Data as of May 29, 2025. The disability groups overlap, so the numbers add to more than 100."
});

/* ---- Emergency Communications: the FOG link index ---- */
add({
  name: "Emergency Communications Field Operations Guides — link index",
  file: FOG_STEM + ".pdf",
  category: "EMERG",
  categoryName: "Emergency Communications",
  section: "Emergency Communications",
  list: "emerg",
  format: "Link-index PDF",
  url: emergFile(FOG_STEM + ".pdf"),
  pdfUrl: emergFile(FOG_STEM + ".pdf"),
  epubUrl: emergFile(FOG_STEM + ".epub"),
  wordUrl: emergFile(FOG_STEM + ".docx"),
  textUrl: emergFile(FOG_STEM + ".txt"),
  brailleUrl: emergFile(FOG_STEM + ".brf"),
  ebrailleUrl: emergFile(FOG_STEM + ".ebrl"),
  pefUrl: emergFile(FOG_STEM + ".pef"),
  version: "1.0",
  date: "2026-11-22",
  time: null,
  author: "AB9MZ",
  keywords: ["fog", "nifog", "auxfog", "emergency", "communications", "field operations guide", "cisa", "interoperability", "listen", "braille", "emcomm"],
  status: "available",
  note: "Links to the official Field Operations Guides from the nation and the states. These are the NIFOG, AUXFOG, and state guides. Each link goes to the publisher's own copy, so you always get the newest one. No one makes an official audio or Braille copy of the guides. This index has its own Listen button and Braille file."
});

/* ---- Emergency Communications: the PEP/IPAWS reference ---- */
add({
  name: "FEMA Primary Entry Point Stations and the IPAWS Emergency Alert System — reference",
  file: PEP_STEM + ".pdf",
  category: "EMERG",
  categoryName: "Emergency Communications",
  section: "Emergency Communications",
  list: "emerg",
  format: "Reference PDF",
  url: emergFile(PEP_STEM + ".pdf"),
  pdfUrl: emergFile(PEP_STEM + ".pdf"),
  epubUrl: emergFile(PEP_STEM + ".epub"),
  wordUrl: emergFile(PEP_STEM + ".docx"),
  textUrl: emergFile(PEP_STEM + ".txt"),
  brailleUrl: emergFile(PEP_STEM + ".brf"),
  ebrailleUrl: emergFile(PEP_STEM + ".ebrl"),
  pefUrl: emergFile(PEP_STEM + ".pef"),
  version: "1.0",
  date: "2026-11-22",
  time: null,
  author: "AB9MZ",
  keywords: ["pep", "ipaws", "eas", "wea", "wireless emergency alerts", "emergency", "communications", "fema", "primary entry point", "text to 911", "satellite", "listen", "braille", "emcomm"],
  status: "available",
  note: "FEMA's list of PEP radio stations. All 73 are here, with their frequencies. PEP means Primary Entry Point. It also explains IPAWS, the Emergency Alert System, and Wireless Emergency Alerts. It covers alert settings for iPhone, Android, GrapheneOS, and Linux. It also covers satellite setup and texting to 911. Includes a Listen button and a Braille file."
});

/* ---- Emergency Communications: the weather spotting guide ---- */
add({
  name: "Weather Spotting and Weather Radio — guide",
  file: WX_STEM + ".pdf",
  category: "EMERG",
  categoryName: "Emergency Communications",
  section: "Emergency Communications",
  list: "emerg",
  format: "Guide PDF",
  url: emergFile(WX_STEM + ".pdf"),
  pdfUrl: emergFile(WX_STEM + ".pdf"),
  epubUrl: emergFile(WX_STEM + ".epub"),
  wordUrl: emergFile(WX_STEM + ".docx"),
  textUrl: emergFile(WX_STEM + ".txt"),
  brailleUrl: emergFile(WX_STEM + ".brf"),
  ebrailleUrl: emergFile(WX_STEM + ".ebrl"),
  pefUrl: emergFile(WX_STEM + ".pef"),
  version: "1.0",
  date: "2026-11-23",
  time: null,
  author: "AB9MZ",
  keywords: ["weather", "skywarn", "spotter", "noaa weather radio", "volmet", "navtex", "stormready", "nwschat", "emergency", "communications", "listen", "braille", "emcomm"],
  status: "available",
  note: "How to spot bad weather and report it. Covers Skywarn training, Spotter Network, weather radio channels, and aircraft and marine weather frequencies. Also covers finding classes near you, NWSChat, StormReady, and more places to learn. Includes a Listen button and a Braille file."
});

/* ---- Emergency Communications: the digital voice list ---- */
add({
  name: "Digital Voice Weather and Emergency Resources — list",
  file: DV_STEM + ".pdf",
  category: "EMERG",
  categoryName: "Emergency Communications",
  section: "Emergency Communications",
  list: "emerg",
  format: "List PDF",
  url: emergFile(DV_STEM + ".pdf"),
  pdfUrl: emergFile(DV_STEM + ".pdf"),
  epubUrl: emergFile(DV_STEM + ".epub"),
  wordUrl: emergFile(DV_STEM + ".docx"),
  textUrl: emergFile(DV_STEM + ".txt"),
  brailleUrl: emergFile(DV_STEM + ".brf"),
  ebrailleUrl: emergFile(DV_STEM + ".ebrl"),
  pefUrl: emergFile(DV_STEM + ".pef"),
  version: "1.0",
  date: "2026-11-23",
  time: null,
  author: "AB9MZ",
  keywords: ["dmr", "d-star", "dstar", "system fusion", "c4fm", "wires-x", "echolink", "allstar", "talkgroup", "reflector", "weather", "emergency", "communications", "listen", "braille", "emcomm"],
  status: "available",
  note: "A list of 91 digital voice places where hams talk about bad weather and emergencies. Covers DMR talkgroups, D-Star reflectors, System Fusion rooms, and more, including EchoLink and AllStar. Each entry gives the number, the name, and what it is for. Includes a Listen button and a Braille file."
});

/* ---- Counts must match the index exactly ---- */
if (entries.length !== 81) {
  throw new Error("expected 81 entries, built " + entries.length);
}
const byList = {};
entries.forEach(function (e) { byList[e.list] = (byList[e.list] || 0) + 1; });
const expected = { "field-kit": 5, "field-sections": 66, "cntst": 1, "gen": 1, "lic": 2, "radio": 1, "res": 1, "emerg": 4 };
Object.keys(expected).forEach(function (k) {
  if (byList[k] !== expected[k]) {
    throw new Error("list " + k + ": expected " + expected[k] + ", built " + (byList[k] || 0));
  }
});
const urls = entries.filter(function (e) { return e.url; }).map(function (e) { return e.url; });
if (new Set(urls).size !== urls.length) {
  throw new Error("duplicate URLs in library.json");
}
/* Braille links: 76 entries carry one (3 whole-book + 66 sections,
 * sharing 23 distinct .brf files — the three format entries of a
 * section point at the same .brf file, so brailleUrl is deliberately
 * NOT unique per entry — plus the FOG link index, the PEP/IPAWS
 * reference, the weather guide, and the digital voice list, each with
 * its own .brf file in this repository's EMERG/ folder, plus the
 * blind-population chart, whose .brf sits in RES/, plus the question
 * pool, whose .brf lives in the Technician-class repository's braille/
 * folder, plus the first radio guide, whose .brf sits in LIC/). */
const withBraille = entries.filter(function (e) { return e.brailleUrl; });
if (withBraille.length !== 76) {
  throw new Error("expected 76 entries with a Braille link, built " + withBraille.length);
}
const distinctBraille = new Set(withBraille.map(function (e) { return e.brailleUrl; }));
if (distinctBraille.size !== 30) {
  throw new Error("expected 30 distinct Braille files, built " + distinctBraille.size);
}
/* Text twins: the same 76 entries carry one (3 whole-book + 66
 * sections, sharing 23 distinct .txt files, plus the FOG link index,
 * the PEP/IPAWS reference, the weather guide, and the digital voice
 * list, each with its own .txt file in this repository's EMERG/
 * folder, plus the blind-population chart, whose .txt twin sits in
 * RES/, plus the question pool, whose .txt file is its own Open link,
 * plus the first radio guide, whose .txt twin sits in LIC/). */
const withText = entries.filter(function (e) { return e.textUrl; });
if (withText.length !== 76) {
  throw new Error("expected 76 entries with a text twin, built " + withText.length);
}
const distinctText = new Set(withText.map(function (e) { return e.textUrl; }));
if (distinctText.size !== 30) {
  throw new Error("expected 30 distinct text files, built " + distinctText.size);
}
/* EPUB twins: the same 76 entries carry one (3 whole-book + 66
 * sections, sharing 23 distinct .epub files converted from the
 * section DOCX files, plus the FOG link index, the PEP/IPAWS
 * reference, the weather guide, and the digital voice list, each
 * with its own .epub in EMERG/, plus the blind-population chart in
 * RES/, the question pool and the first radio guide in LIC/). */
const withEpub = entries.filter(function (e) { return e.epubUrl; });
if (withEpub.length !== 76) {
  throw new Error("expected 76 entries with an EPUB link, built " + withEpub.length);
}
const distinctEpub = new Set(withEpub.map(function (e) { return e.epubUrl; }));
if (distinctEpub.size !== 30) {
  throw new Error("expected 30 distinct EPUB files, built " + distinctEpub.size);
}
/* Word twins: the same 76 entries, 30 distinct .docx files (the 23
 * field-reference DOCX files the EPUBs were converted from, plus 7
 * local DOCX files converted from the plain-text sources). */
const withWord = entries.filter(function (e) { return e.wordUrl; });
if (withWord.length !== 76) {
  throw new Error("expected 76 entries with a Word link, built " + withWord.length);
}
const distinctWord = new Set(withWord.map(function (e) { return e.wordUrl; }));
if (distinctWord.size !== 30) {
  throw new Error("expected 30 distinct Word files, built " + distinctWord.size);
}
/* eBraille twins: the same 76 entries, 30 distinct .ebrl files
 * (converted from the 30 DOCX files by DAISY Pipeline, grade-2 UEB;
 * the first radio guide's is the proven 2026-11-25 test file). */
const withEbraille = entries.filter(function (e) { return e.ebrailleUrl; });
if (withEbraille.length !== 76) {
  throw new Error("expected 76 entries with an eBraille link, built " + withEbraille.length);
}
const distinctEbraille = new Set(withEbraille.map(function (e) { return e.ebrailleUrl; }));
if (distinctEbraille.size !== 30) {
  throw new Error("expected 30 distinct eBraille files, built " + distinctEbraille.size);
}
/* PEF twins ("Braille print file"): the same 76 entries, 30 distinct
 * .pef files (same Pipeline conversion, 40 cells by 25 lines,
 * single-sided). */
const withPef = entries.filter(function (e) { return e.pefUrl; });
if (withPef.length !== 76) {
  throw new Error("expected 76 entries with a PEF link, built " + withPef.length);
}
const distinctPef = new Set(withPef.map(function (e) { return e.pefUrl; }));
if (distinctPef.size !== 30) {
  throw new Error("expected 30 distinct PEF files, built " + distinctPef.size);
}
/* PDF twins for the Download panel: 75 entries (the same 76 minus
 * the question pool, which has no PDF), 52 distinct files (22
 * large-print section PDFs shared by the large-print and Word
 * entries, 22 tagged section PDFs, the full book's large-print and
 * tagged PDFs, and the 6 local PDFs in EMERG/, RES/, and LIC/). */
const withPdf = entries.filter(function (e) { return e.pdfUrl; });
if (withPdf.length !== 75) {
  throw new Error("expected 75 entries with a PDF link, built " + withPdf.length);
}
const distinctPdf = new Set(withPdf.map(function (e) { return e.pdfUrl; }));
if (distinctPdf.size !== 52) {
  throw new Error("expected 52 distinct PDF files, built " + distinctPdf.size);
}

fs.writeFileSync(
  path.join(__dirname, "library.json"),
  JSON.stringify(entries, null, 2) + "\n",
  "utf8"
);
console.log("library.json written: " + entries.length + " entries");
console.log("by list: " + JSON.stringify(byList));
console.log("with download links: " + urls.length + "; without: " + (entries.length - urls.length));
console.log("with Braille links: " + withBraille.length + " entries, " + distinctBraille.size + " distinct .brf files");
console.log("with EPUB links: " + withEpub.length + " entries, " + distinctEpub.size + " distinct .epub files");
console.log("with Word links: " + withWord.length + " entries, " + distinctWord.size + " distinct .docx files");
console.log("with eBraille links: " + withEbraille.length + " entries, " + distinctEbraille.size + " distinct .ebrl files");
console.log("with PEF links: " + withPef.length + " entries, " + distinctPef.size + " distinct .pef files");
console.log("with PDF links: " + withPdf.length + " entries, " + distinctPdf.size + " distinct .pdf files");
