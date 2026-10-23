# Languini · Ulti points and the English League

Ulti points live only in Mr. Saymaz's English League (the tally system). A won
shift adds points to the student's (grade, team) pool in the League's Battle
Arena, the same pools that Tower Swarm, Wordramp and Growbloom feed. The League
decides every point value and limit; Languini only decides which shifts it
claims. This game's League id is **`languini`**.

The earlier browser-only ledger (4/6/8 and 8/12/16 Ulti, seven-day receipts) is
retired. Old saves drop it on load; nothing from it is sent anywhere. Runes,
stars, reputation, purchases and unlocks are unchanged and stay in the browser.

## Which shifts are claimed

- Teams: `gryffindor`, `hufflepuff`, `slytherin`, `ravenclaw`. Grade, lesson,
  team, restaurant and pace are frozen when the shift opens, so later choices
  cannot redirect the claim.
- Only a **won** shift is claimed (every guest served, fewer than three lost),
  and only with enough English answered right first time without a hint:
  **Relaxed: at least 60%. Challenge: at least 75%.**
- Lost or abandoned shifts, Design/phone-preview demonstrations and wins below
  the accuracy rule are never claimed. A win below the rule says why on the
  result screen.

## Configuration

`config.js` sets
`window.LANGUINI_CONFIG = { ultiApi: 'https://mrsaymaz.netlify.app/api/ulti' }`.
With `ultiApi: ''` the copy is practice-only: no Ulti button, no Ulti result and
no network requests. If `config.js` is missing, the same League URL is used.
The phone preview (`phone-preview.html`) never contacts the League.

## Requests

All requests are `POST` JSON to `ultiApi` (the League must allow the Languini
site's origin, as it does for the other games).

- **Start:** when a shift opens, the game sends
  `{action:'start', game:'languini', grade, team, arena, pace, unit, device}`.
  `arena` is 0–2 (Cafe, Diner, Bistro), `pace` is `relaxed` or `challenge`, and
  `unit` is the lesson id (for example `g5u1`). The ticket is kept in this
  browser under the shift. If the device is offline when the shift opens, it
  asks again after each served guest.
- **Claim:** `{action:'claim', ticket, device}` is sent only after a claimed
  win. The game never sends a points value and holds no key.
  - A network failure, a 5xx reply or `retry: true` keeps the ticket in an
    outbox, which is resent on the next launch or win. Outbox items are
    dropped after 47 hours; unused tickets after 48 hours.
  - A 400 refusal (`too-fast`, `expired` or any other) is final.
- **Pools:** `{action:'pools', grade}` when setup opens, when the grade
  changes, when the Ulti dialog opens and every five minutes on the setup
  screen. The last reply (settings and pools) is cached in this browser.
- `device` is a random 24-character id made once and kept in localStorage
  (`languini-league.v1`, separate from the game save).

## What students see

- **Setup Ulti button:** their team's live League points for the lesson's grade
  (`–` until the League has answered).
- **Ulti dialog:** the four team pools for the grade: live points from entries
  within the League's `hours`, out of `capacity`, and Battle Arena strength
  `1 + (maxStrength − 1) × √(min(points, capacity) / capacity)`, with their own
  team highlighted. The rules text is built from the League's settings. If the
  League has not switched `languini` on, the dialog says so.
- **Result screen:** "+N Ulti for Grade g Team!", or why not: below the
  accuracy rule, `device-limit`, `team-limit`, `off`, `too-fast`, `expired`, a
  win saved on the device until it is online, or a shift that never got a
  ticket.

## The League line

Add this to the `games` section of the ULTI block in the League's Apps Script:

```
languini: { points: { relaxed: [4, 6, 8], challenge: [8, 12, 16] }, deviceDailyWins: 6, minSeconds: 150 },
```

Arena order: 0 Languini Cafe, 1 Languini Diner, 2 Languini Bistro. The point
values are the ones Languini used locally; they are larger than the other
games' (Wordramp `[2, 4, 6]` / `[5, 7, 9]`, Tower Swarm `[3, 5, 7]` /
`[5, 8, 11]`), so adjust them in the League if a shift should be worth less.

`minSeconds: 150`: a simulated perfect Cafe shift (instant answers, no
hesitation) needs 93 seconds of service time on Challenge and 99 on Relaxed,
plus at least 35 English tasks, each of which stops the service clock while it
is answered. Diner needs 119–137 seconds plus 64 tasks, Bistro 146–179 plus
126. Real play is therefore always well above 150 seconds.

## Verification

`tests/ulti.test.mjs` covers the start/claim/pools requests against a stand-in
League, the accuracy rule, the outbox, `ultiApi: ''`, retiring the old ledger
and the frozen shift context. `tests/startup.test.mjs` checks that the only
network request the game makes is a POST to the League, and none at all for a
practice copy. In Chromium against a local League using the same protocol: the
setup button and dialog, a +4 win, a 50% win that is not claimed, an offline
win resent on reload, a too-fast refusal, a practice copy and the phone preview
sending nothing, and the 320/390 px layouts.

Not verified here: the real League site (this environment could not reach it)
and real phones.
