/* Page-level test: runs index.html's render/search/sort inline script
 * under a minimal DOM stub in Node, loads the real library.json, and
 * checks that the browse lists it renders hold all 78 documents, that
 * the search box and the sort control behave as specified, and that the
 * superseded entry renders without a download link.
 * Run: node test_page.js (exit 0 only when every check passes).
 *
 * This checks the page's own render path and wording. It cannot check
 * real browser behaviour (focus movement, aria-live announcement, the
 * Facebook webview close button, real localStorage) -- those need a live
 * browser check after deploy.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const data = JSON.parse(fs.readFileSync(path.join(DIR, "library.json"), "utf8"));
const LibrarySearch = require("./library.js");

/* Pull out the render/search/sort inline <script> block (the one holding
 * renderBrowse; the close-button script below it is not it). */
const blocks = [...html.matchAll(/<script>\n([\s\S]*?)<\/script>/g)];
const m = blocks.find((b) => b[1].indexOf("function renderBrowse") !== -1);
if (!m) { console.log("FAIL  no render/search inline script block found"); process.exit(1); }
const inlineJs = m[1];

let failures = 0;
function check(name, cond, detail) {
  if (!cond) failures++;
  console.log((cond ? "PASS" : "FAIL") + "  " + name + (detail ? "  | " + detail : ""));
}

/* ---- minimal DOM stub ---- */
function makeElement(id) {
  return {
    id: id || "", textContent: "", innerHTML: "", className: "",
    disabled: false, value: "", href: "", hidden: false,
    _listeners: {},
    addEventListener: function (type, fn) { this._listeners[type] = fn; },
    focus: function () { this._focused = true; },
    scrollIntoView: function () {},
    querySelectorAll: function () { return []; },
    getAttribute: function () { return null; },
    setAttribute: function () {},
    parentNode: { insertBefore: function () {}, replaceChild: function () {} }
  };
}
const elements = {};
["search-form", "search-input", "sort-select", "clear-search", "load-status",
 "search-results", "main"].forEach((id) => { elements[id] = makeElement(id); });
elements["clear-search"].hidden = true;
elements["search-results"].hidden = true;
const contentsNav = makeElement("contents-nav");
const sectionsDiv = makeElement("sections-div");

/* The 7 browse-list slots, in page order, as in index.html. */
const LIST_KEYS = ["field-kit", "cntst", "gen", "lic", "radio", "res", "emerg"];
const listStubs = LIST_KEYS.map(function (key) {
  const el = makeElement("ul-" + key);
  el.getAttribute = function (attr) { return attr === "data-list" ? key : null; };
  return el;
});
function slot(key) { return listStubs[LIST_KEYS.indexOf(key)]; }
function countItems(el) { return (el.innerHTML.match(/<li>/g) || []).length; }

/* In-memory localStorage stand-in, so the sort persistence path runs. */
const storage = {};
global.window = {
  LibrarySearch: LibrarySearch,
  location: { href: "", reload: function () {} },
  close: function () {},
  localStorage: {
    getItem: function (k) { return k in storage ? storage[k] : null; },
    setItem: function (k, v) { storage[k] = String(v); }
  }
};
global.document = {
  getElementById: function (id) { return elements[id] || null; },
  querySelector: function (sel) {
    if (sel === "nav.contents") return contentsNav;
    if (sel === '[data-section-list="field-sections"]') return sectionsDiv;
    return null;
  },
  querySelectorAll: function (sel) { return sel === "ul[data-list]" ? listStubs : []; },
  createElement: function () { return makeElement(""); },
  hidden: false
};
global.fetch = function (url) {
  check("page fetches only library.json", url === "library.json", "fetched: " + url);
  return Promise.resolve({
    ok: true,
    json: function () { return Promise.resolve(data); }
  });
};

/* Run the page script. */
eval(inlineJs);

/* Let the fetch promise resolve, then drive the page. */
setTimeout(function () {
  check("load status reports 78 documents",
    elements["load-status"].textContent === "Library loaded: 78 documents.",
    elements["load-status"].textContent);

  check("sort select defaults to the listed order (nothing saved yet)",
    elements["sort-select"].value === "listed",
    elements["sort-select"].value);

  /* Browse lists hold every document. */
  check("kit list holds 5 items", countItems(slot("field-kit")) === 5,
    "got " + countItems(slot("field-kit")));
  check("contests list holds 1 item", countItems(slot("cntst")) === 1);
  check("general list holds 1 item", countItems(slot("gen")) === 1);
  check("licensing list holds 1 item", countItems(slot("lic")) === 1);
  check("radios list holds 1 item", countItems(slot("radio")) === 1);
  check("resources list holds 1 item", countItems(slot("res")) === 1);
  const sectionItems = countItems(sectionsDiv);
  check("field sections hold 66 items", sectionItems === 66, "got " + sectionItems);
  const total = listStubs.reduce(function (n, el) { return n + countItems(el); }, 0) + sectionItems;
  check("rendered browse lists hold 78 items in all", total === 78, "got " + total);

  /* Section headings: 22, in book order, as skip points. */
  const h3s = [...sectionsDiv.innerHTML.matchAll(/<h3 id="field-([^"]+)">([^<]+)<\/h3>/g)];
  check("sections render 22 headings in book order (guide first, reference last)",
    h3s.length === 22 && h3s[0][1] === "guide" && h3s[0][2] === "Using and printing this book"
    && h3s[21][1] === "reference" && h3s[21][2] === "Glossary and review checklist",
    "got " + h3s.length + " headings");

  /* Version stamp wording. */
  check("kit list shows the version stamp in words",
    slot("field-kit").innerHTML.indexOf(
      "Version 2.0. Revised 16 November 2026 at 22:18 Central. By AB9MZ.") !== -1);

  /* Pending and superseded entries have no download link. */
  check("radios list links to the author's copy and carries no pending flag",
    slot("radio").innerHTML.indexOf("Coming soon — source check pending.") === -1
    && slot("radio").innerHTML.indexOf('href="https://tonnesoftware.com/downloads/2017-mar-apr-qex-Tonne.pdf"') !== -1);
  check("resources list links to the relative library path and carries no pending flag",
    slot("res").innerHTML.indexOf("Coming soon — source check pending.") === -1
    && slot("res").innerHTML.indexOf('href="RES/Blind-Population-Distribution.pdf"') !== -1);
  check("general list carries the superseded flag and no link",
    slot("gen").innerHTML.indexOf("Superseded by this page.") !== -1
    && slot("gen").innerHTML.indexOf("<a href=") === -1);

  /* Link targets. */
  check("kit zip links into the field-reference repo under its stamped name",
    slot("field-kit").innerHTML.indexOf(
      "https://visually-inconvenienced-hams.github.io/field-reference/AB9MZ_Field_Reference_Complete_Kit_v2.0-20261116-2218-AB9MZ.zip") !== -1);
  check("question-pool text links to the relative library path",
    slot("lic").innerHTML.indexOf('href="LIC/Technician-Question-Pool-2026-2030.txt"') !== -1);
  check("question-pool Braille button links to the Technician class page",
    slot("lic").innerHTML.indexOf(
      "https://visually-inconvenienced-hams.github.io/technician-class/braille/Technician-Question-Pool-2026-2030.brf") !== -1);
  check("a section file links into the field-reference repo with the plain kit name",
    sectionsDiv.innerHTML.indexOf(
      'href="https://visually-inconvenienced-hams.github.io/field-reference/sections/morse.pdf"') !== -1);

  /* Per-entry Braille links. */
  check("kit list links the whole-book Braille file",
    slot("field-kit").innerHTML.indexOf(
      "https://visually-inconvenienced-hams.github.io/field-reference/braille/AB9MZ_Amateur_Radio_Field_Reference_v2.0-20261116-2210-AB9MZ.brf") !== -1);
  check("a section file links its own Braille file",
    sectionsDiv.innerHTML.indexOf(
      'href="https://visually-inconvenienced-hams.github.io/field-reference/braille/morse_v2.0-20261116-2210-AB9MZ.brf"') !== -1);
  check("Braille links carry an aria-label naming the entry",
    sectionsDiv.innerHTML.indexOf(
      'aria-label="Morse code and procedural signals — Large-print PDF — Braille (.brf)"') !== -1);
  const brailleLinks = ((slot("field-kit").innerHTML + sectionsDiv.innerHTML)
    .match(/>Braille \(\.brf\)<\/a>/g) || []).length;
  check("browse lists render 69 Braille links (3 whole-book + 66 sections)",
    brailleLinks === 69, "got " + brailleLinks);

  /* The Emergency Communications slot renders the FOG index with its
   * Braille link, its plain-text link, and its Listen button. */
  const emergHtml = slot("emerg").innerHTML;
  check("emergency slot renders the FOG index with a Braille link and a Listen button",
    emergHtml.indexOf("Emergency Communications Field Operations Guides") !== -1
    && emergHtml.indexOf(">Braille (.brf)</a>") !== -1
    && emergHtml.indexOf(">Plain text (.txt)</a>") !== -1
    && emergHtml.indexOf('listen-btn') !== -1
    && emergHtml.indexOf('data-listen-url="EMERG/Emergency-Communications-FOG-Link-Index_v1.0-20261122-AB9MZ.txt"') !== -1,
    emergHtml.slice(0, 200));

  /* The decided entry layout: document name as a heading, the three
   * buttons, then the direct URL below the buttons. */
  check("emergency entries render the document name as a heading",
    emergHtml.indexOf("<h3>Emergency Communications Field Operations Guides — link index</h3>") !== -1);
  check("emergency entries render an Open button naming the document",
    emergHtml.indexOf('aria-label="Open Emergency Communications Field Operations Guides — link index">Open</a>') !== -1);
  check("emergency entries put the direct URL below the buttons",
    emergHtml.indexOf('class="entry-url"') !== -1
    && emergHtml.indexOf('>EMERG/Emergency-Communications-FOG-Link-Index_v1.0-20261122-AB9MZ.pdf</a>') !== -1);
  check("page has header and footer landmarks",
    html.indexOf("<header>") !== -1 && html.indexOf("<footer>") !== -1);

  /* Listen appears on documents that are themselves plain text. */
  check("contest schedule carries a Listen button reading its own text",
    slot("cntst").innerHTML.indexOf('data-listen-url="CNTST/$Contest-Schedule.txt"') !== -1);
  check("question-pool text carries a Listen button reading its own text",
    slot("lic").innerHTML.indexOf('data-listen-url="LIC/Technician-Question-Pool-2026-2030.txt"') !== -1);
  check("read-me carries a Listen button reading its own text",
    slot("field-kit").innerHTML.indexOf('data-listen-url="https://visually-inconvenienced-hams.github.io/field-reference/READ_ME_FIRST.txt"') !== -1);
  check("field sections render 66 Listen buttons (one per section entry)",
    (sectionsDiv.innerHTML.match(/data-listen-url="/g) || []).length === 66,
    "got " + ((sectionsDiv.innerHTML.match(/data-listen-url="/g) || []).length));
  check("kit list renders 4 Listen buttons (3 whole-book formats + read-me)",
    (slot("field-kit").innerHTML.match(/data-listen-url="/g) || []).length === 4,
    "got " + ((slot("field-kit").innerHTML.match(/data-listen-url="/g) || []).length));
  check("a section Listen button reads the field-reference text twin",
    sectionsDiv.innerHTML.indexOf('data-listen-url="https://visually-inconvenienced-hams.github.io/field-reference/txt/morse_v2.0-20261116-2210-AB9MZ.txt"') !== -1);
  check("blind-population chart renders a Listen button reading its text twin",
    slot("res").innerHTML.indexOf('data-listen-url="RES/Blind-Population-Distribution.txt"') !== -1);
  check("blind-population chart renders a Braille button to its .brf twin",
    slot("res").innerHTML.indexOf('href="RES/Blind-Population-Distribution.brf"') !== -1);
  check("About names the files that lack a Listen or Braille button, and why",
    html.indexOf("<h3>Files without a Listen or Braille button</h3>") !== -1
    && html.indexOf("The complete kit zip file has no Listen or Braille button") !== -1
    && html.indexOf("The schedule changes each day") !== -1);

  function typeSearch(value) {
    elements["search-input"].value = value;
    elements["search-input"]._listeners.input();
  }
  function setSort(value) {
    elements["sort-select"].value = value;
    elements["sort-select"]._listeners.change();
  }

  /* Search: morse */
  typeSearch("morse");
  const r1 = elements["search-results"].innerHTML;
  check("search announces 7 documents found", r1.indexOf("7 documents found.") !== -1);
  check("search results name the Morse files and the Tonne article",
    r1.indexOf("Morse code and procedural signals") !== -1
    && r1.indexOf("Tonne") !== -1);
  check("browse hidden while searching",
    elements["search-results"].hidden === false
    && contentsNav.hidden === true && elements["main"].hidden === true);
  check("Clear search button appears while searching",
    elements["clear-search"].hidden === false);

  /* Search: no match */
  typeSearch("zzzzz");
  const r2 = elements["search-results"].innerHTML;
  check("no-match message names the query and suggests a word or category",
    r2.indexOf('No documents match "zzzzz"') !== -1
    && r2.indexOf("Try a word like Morse") !== -1);

  /* Clear restores the browse list */
  elements["clear-search"]._listeners.click();
  check("Clear search restores the browse list",
    elements["search-results"].hidden === true
    && elements["search-results"].innerHTML === ""
    && contentsNav.hidden === false && elements["main"].hidden === false
    && elements["search-input"].value === "");

  /* Sort: name A to Z */
  setSort("name-asc");
  check("sort choice is saved in localStorage",
    storage["vih-library-sort"] === "name-asc",
    storage["vih-library-sort"]);
  const kitAsc = slot("field-kit").innerHTML;
  check("kit list under name-asc starts with the tagged book",
    kitAsc.indexOf("AB9MZ_Amateur_Radio_Field_Reference-tagged_v2.0") !== -1
    && kitAsc.indexOf("AB9MZ_Amateur_Radio_Field_Reference-tagged_v2.0")
      < kitAsc.indexOf("AB9MZ_Field_Reference_Complete_Kit"));
  check("sections under name-asc render as one flat list with no subsection headings",
    sectionsDiv.innerHTML.indexOf('id="field-') === -1
    && countItems(sectionsDiv) === 66
    && (sectionsDiv.innerHTML.match(/<h3>/g) || []).length === 66);
  check("sections under name-asc start with the ares tagged file",
    sectionsDiv.innerHTML.indexOf("ares-tagged_v2.0-20261116-2218-AB9MZ.pdf") !== -1
    && sectionsDiv.innerHTML.indexOf("ares-tagged_v2.0-20261116-2218-AB9MZ.pdf")
      < sectionsDiv.innerHTML.indexOf("ares_v2.0-20261116-2218-AB9MZ.pdf"));

  /* Search results follow the sort order too */
  typeSearch("question pool");
  const r3 = elements["search-results"].innerHTML;
  check("search for the question pool returns the single grouped entry with all three buttons",
    r3.indexOf("1 document found.") !== -1
    && r3.indexOf('href="LIC/Technician-Question-Pool-2026-2030.txt"') !== -1
    && r3.indexOf("technician-class/braille/Technician-Question-Pool-2026-2030.brf") !== -1
    && r3.indexOf('data-listen-url="LIC/Technician-Question-Pool-2026-2030.txt"') !== -1);
  elements["clear-search"]._listeners.click();

  /* Sort back to the listed order restores the section headings */
  setSort("listed");
  const h3sBack = [...sectionsDiv.innerHTML.matchAll(/<h3 /g)];
  check("returning to the listed order restores the 22 section headings",
    h3sBack.length === 22, "got " + h3sBack.length);
  check("listed order renders each section entry as an h4 heading",
    (sectionsDiv.innerHTML.match(/<h4>/g) || []).length === 66,
    "got " + ((sectionsDiv.innerHTML.match(/<h4>/g) || []).length));
  check("sort choice updated in localStorage",
    storage["vih-library-sort"] === "listed");

  console.log("\n" + (failures === 0 ? "ALL PAGE CHECKS PASSED" : failures + " PAGE CHECK(S) FAILED"));
  process.exit(failures === 0 ? 0 : 1);
}, 100);
