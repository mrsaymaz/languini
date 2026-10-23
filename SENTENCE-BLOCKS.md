# Grammatical sentence blocks · Languini v0.38.1

Sentence building now follows grammatical constituents instead of requiring exactly three pieces. All 1,520 sentence activities have reviewed boundaries and role annotations. This corrects 534 previous block arrangements while preserving every sentence, Turkish translation, answer and activity ID.

| Sentence | Blocks |
| --- | --- |
| Our teacher is helpful. | Our teacher · is · helpful. |
| The pupils are very naughty. | The pupils · are · very naughty. |
| My teacher gives us homework every day. | My teacher · gives · us · homework · every day. |
| My teacher gives us homework at school every day. | My teacher · gives · us · homework · at school · every day. |

The first three examples express the requested authoring rule. The fourth is an additional test fixture illustrating place before time. These examples do not add assessed activities to the curriculum.

## Boundary rules

- Keep the complete subject together, including articles and possessives: The pupils, Our teacher, These clean towels.
- Keep auxiliaries, negation and the main verb together in declarative sentences: has got, must not enter, is making, is going to visit.
- Separate an indirect object from the thing given: gives · us · a worksheet; gives · the dog · some water.
- Keep complete noun phrases and adjective complements: a blue uniform, very helpful, my daily plans.
- Keep a whole place or time phrase together: on the board, every day, twice a week, on Saturday.
- Retain the original word order. Questions preserve auxiliary–subject inversion; imperatives do not gain an invented subject. A sentence without a place or time phrase does not gain one.
- Embedded object clauses remain coherent units, such as I · think · our canteen is clean. Comparatives and noun complements remain intact.

Roles are authoring metadata, not new answer clues displayed during play. The current bank contains 1,332 three-block activities, 186 four-block activities and two five-block activities. Five- and six-block teacher-example fixtures also exercise the engine, rendering and layout checks.

## Gameplay

Preparation displays one paper/ingredient portion for every block, using the existing ingredient area for up to six blocks. The board, recipe note and main plate retain their original three-block station dimensions and placement; additional portions use the spare space. Counters, selection, drag/tap controls, rotation recovery and sentence completion use that count. The third block cannot finish a five-block sentence. The three meal phases and nine canonical final food components remain: repeated food types represent portions and are consolidated when the whole phase is complete.

Washing displays and connects every block. Its existing three/six/nine plate routines remain; block count does not alter the number of plates or pay extra rewards. Tap and swipe routes remain available. Text fitting prefers a readable smaller size before splitting a word across lines.

## Source and preservation

content/sentence-blocks.json is the reviewed mapping keyed by the exact complete sentence. scripts/sentence-blocks.mjs applies and validates it during the existing reproducible language import. Missing future sentences fail the import and need reviewed boundaries; the importer does not invent three visual chunks.

The original source banks, baseline hashes and frozen original runtime remain unchanged. The preservation guard permits only the requested sentence-block changes and role annotations, and continues to compare all other original task fields exactly. It also requires the current bank to reproduce from the supplied sources and reviewed mapping.

source/validation/sentence-block-review-v0.38.0.tsv lists every sentence activity, grade, unit, boundaries and roles for teacher review. Use npm run import:language, npm test and npm run build from source/ after npm ci.
