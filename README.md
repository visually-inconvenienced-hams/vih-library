# VIH group document library

The searchable, sortable, accessible front door to the Visually Inconvenienced Hams group's files. Live page: https://visually-inconvenienced-hams.github.io/vih-library/

The page renders its lists from library.json, with a live search box and a sort control (alphabetical by name, and by date) whose choice stays put. The field-reference collection lives in its own repository, visually-inconvenienced-hams/field-reference, and this page links to it. Every file has a download link except the document index itself, which this page supersedes. The Tonne audio bandpass filter article links to the author's own copy at tonnesoftware.com (QEX March/April 2017, copyright ARRL) rather than being hosted here.

## Files in this directory

- index.html — the library page.
- library.js — search, sort, and grouping logic for the page.
- library.json — the data file: one entry per file in the group's Document Index, third edition, November 16, 2026 (77 entries), plus the Emergency Communications FOG link index, added November 22, 2026 (78 entries in all).
- build_library.js — the generator that writes library.json from the index data. Re-run it with node build_library.js after any data change.
- test_library.js — 55 checks on the data and the logic. Run with node test_library.js.
- test_page.js — 38 checks that run the page's own render, search, and sort script under a DOM stub. Run with node test_page.js.
- BUILD-REPORT.md — what was built, the file counts, the test results, and the design decisions.
- README.md — this file.

## Folders

- CNTST/ — the contest schedule ($Contest-Schedule.txt), updated every morning.
- LIC/ — the Technician license question pool, 2026-2030, plain text. The Braille edition lives in the technician-class repository.
- RES/ — the blind-population distribution reference (Blind-Population-Distribution.pdf), made by Gregory AB9MZ from public data.
