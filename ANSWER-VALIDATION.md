## v0.50.0 interaction and visual verification

The complete 440-check run produced 437 passes and three failures: two expectations still counted the new contact plane as food or expected the previous venue-specific task exposure; the page also retained previous-version asset query tags. These were corrected. All 17 checks in the affected files then passed, giving passing evidence for every unique check. See validation/interaction-test-summary-v0.50.0.json and its complete captured logs. Eight new focused checks cover gesture state and priorities, lazy prop cleanup, material roles, common task lighting, label-flight cleanup/reduced motion and washing cancellation.

The language audit remains clean: 4 grades, 44 units, 4,805 tasks, 3,285 choice tasks, 1,520 sentences and 1,841 delivery-label tasks. All 13 protected files preserve their exact bytes. No assessed content or rewards changed.

# Language task stability · v0.46.2

Consecutive menu rounds now replace their native task page in place, without restarting the station camera or fading to a painted menu underneath. Native tablets use a small plain screen backing; completion of listening tasks leaves that backing untouched. A different guest or station still receives the normal arrival animation and camera/input lock.

The 4,805-task structure/answer-key audit runs on every build. Matching and listening generators, choice availability, native touches, failed-match recovery, hints, rotation and pause are covered in the release checks. This validates mechanics and answer availability; semantic review of every curriculum distractor remains a separate editorial task.

See VALIDATION-REPORT.md and validation/menu-browser-v0.46.2.json for this release's scope and browser evidence.

---

# Answer validation · v0.45.2

The reported Grade 5 School Life clue is g5u1d3: “You learn to move kings and queens on a board.” Its key is chess club. The source options already contain chess club, art club and music club.

A legacy CSS rule made an odd final sticker span the whole grid. The fitted paper could expect a single row of three; the CSS moved the third sticker to an unplanned second row outside the paper. Shuffling could therefore hide the correct answer. The same rule affected long sticker classes.

The legacy full-row rule is now limited to the old panel presentation. Physical delivery labels explicitly occupy the grid cells calculated for their paper. Their size and the crate remain unchanged. Restoring a task also verifies cached choices against the current answer and option pool; incomplete/stale choices are regenerated.

## Checks

- Every build checks all 4,805 task IDs, prompts and answers, all 3,285 choice tasks, and all 1,520 sentence reconstructions. Missing keys, duplicate choices, empty content and broken repair metadata fail the build.
- Regression tests sample both paces and random choice order for every choice task; generated matching/listening/functional takeaway pairs and explicit sorting memberships are checked.
- The rendered delivery audit checks all 1,841 label activities at both paces across eleven screen sizes: 40,502 cases. It uses production CSS, markup, measured browser fonts, receiving-paper layout and page fitting. It checks every label's paper containment, text bounds, target size and centre-point hit access, plus one exact visible answer.
- A separate full WebGL check puts chess club in each of the three slots at four sizes and selects/attaches it. It also repairs an incomplete cached choice set and keeps the answer available after rotation.

Run npm run verify:language for bank checks. The optional browser audit needs Playwright and Chromium: install Playwright without changing the lockfile, then run npm run verify:answer-controls -- /path/to/chromium. The normal game and build do not need Playwright.

These checks verify answer-key consistency, task structure and interactive availability. They are not an automatic proof that every distractor is semantically wrong. The reported chess-club meaning has been checked directly. See VALIDATION-REPORT.md for release evidence and device-testing limits.
