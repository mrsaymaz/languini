# Language expansion · Languini v0.37.0

The four supplied grade5-2.json through grade8-2.json files extend the existing catalog. All 44 unit IDs, titles, ordering, save keys and original 3,033 activity identities/wording remain intact. Version 0.38.0 revises sentence boundaries under the requested grammatical-role rule; see SENTENCE-BLOCKS.md. There are now 4,805 activities, including 921 conversation prompts. The import adds 1,772 activities and links 516 repeated source records to existing practice. It also adds 44 sorting packs, bringing the total to 88.

## Parent-unit mapping

Most source sections retain their matching parent. These sections require a semantic mapping because source unit numbers collide with other existing topics:

| Supplied section | Existing parent |
| --- | --- |
| Grade 5: Feelings and Well-being (source g5u9) | Personal Life (g5u3) |
| Grade 5: Everyday Jobs (source g5u10) | Jobs and Workplaces (g5u9) |
| Grade 6: Health and First Aid (source g6u9) | Health and Well-being (g6u10) |
| Grade 6: Sports and Fitness (source g6u10) | Health and Well-being (g6u10) |
| Grade 7: Travel and Transport | Travel and Holidays (g7u12) |
| Grade 8: School Clubs and Learning (source g8u11) | Teen Life (g8u2) |
| Grade 8: Health and Well-being (source g8u12) | Teen Life (g8u2) |

Grade 5 At the Toy Shop, Grade 6 Shopping and Money, and Grade 8 Shopping and Services / Animals and Pet Care keep their existing activities. Unrelated additions are not placed there just because a source ID matches.

Lesson cards show the included subtopics. Category headings and language-focus statements are retained as unit metadata. The complete 44-row mapping and per-record links are in data/additional-bank-import.json and source/public/data/additional-bank-import.json.

## How the material plays

| Source material | Gameplay use |
| --- | --- |
| English–Turkish vocabulary | Delivery labels, listening and translation menus |
| Definition clues | Delivery label choices |
| Questions and replies | Guest conversations, with same-section replies answering incompatible question functions as distractors |
| Sentences with Turkish | Grammatical-block preparation and washing; Turkish revealed after success |
| Completion halves | Complete-sentence preparation and washing; English readback after success |
| Category positive lists | Additional two-heading delivery-sorting packs |
| Picture words and drawing descriptions | Picture words join vocabulary; existing local illustrations appear where available. Original drawing notes are retained as references. |

Added activities: 312 vocabulary, 252 definition clues, 390 questions, and 818 sentence-building activities. Longer source sentences retain every word; version 0.38.0 uses reviewed grammatical constituents rather than exactly three visual chunks. Six very short replies are expanded while preserving their meaning.

Duplicate questions reuse the existing prompt and answer. Repeated vocabulary reuses the existing English entry; original translations and alternative replies remain in the supplied raw files. Matching menus continue to exclude duplicate meanings or images that would make a pair ambiguous.

The supplied completion distractors sometimes make other valid sentences. Their correct halves are combined into sentence assembly, rather than treating valid alternatives as wrong answers. No new automated grammar errors or repair exercises are generated from those endings.

Sorting uses only positive category lists. Four ambiguous label placements (mop and storm, each fitting both of their section's headings) are excluded. Existing sorting packs remain; headings stay stable for three delivery visits before another pack from that unit is selected. Sorting labels with no supplied or known Turkish equivalent remain English-only.

The 396 picture records contain drawing specifications, not image files. All picture words are available as vocabulary. This release does not generate 396 new illustrations or substitute drawing text for actual images. The existing artwork and optimized character/logo assets remain local.

## Rebuild and audit

From source/ after npm ci:

    npm run import:language
    npm test
    npm run build
    npm run verify:release -- dist .

Raw additions: content/additional-banks/. The supplementary picture-word translations are separately identified in picture-translations.json. The original v0.36.0 runtime bank and provenance are frozen in content/baseline-v0.36.0/.

CURRICULUM-BASELINE.json retains its original hashes. The preservation gate verifies those hashes against the frozen snapshots for the two expanded runtime files, verifies every original task still exists, permitting only the authorized sentence-boundary revisions and role metadata, and checks the expanded output against a fresh deterministic import. Original source banks and historical import reports remain protected. The new import report records input SHA-256 hashes, parent mappings, duplicate links and category exclusions.

The game bundles language and sorting data locally for direct file launch. No additional image requests or external curriculum service is introduced. New version query strings refresh cached startup assets on hosted copies.
