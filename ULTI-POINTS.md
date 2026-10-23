# Ulti points

Ulti is a separate, non-spendable reward for a successful full shift. There are sixteen logical pools: one for each Grade 5–8 and house/team. Lessons and restaurants feed the same grade/team pool; existing runes and purchases are independent.

| Restaurant | Relaxed | Challenge |
|---|---:|---:|
| Languini Cafe | 4 | 8 |
| Languini Diner | 6 | 12 |
| Languini Bistro | 8 | 16 |

Failed or abandoned shifts, individual English tasks, replayed result callbacks and practice/preview demonstrations do not award Ulti. Rewards do not depend on the number of shift stars, provided the shift is won.

Each award expires exactly 168 hours after it is credited. New awards do not renew old ones. Balances are calculated from timestamps, including after the game was closed. The setup Ulti button and result reward open a small balance dialog showing the selected grade/team and expiry dates. Displayed balances refresh while the app is open. Expired receipts remain historical records and cannot be credited again.

Existing saves gain an empty ledger without changing runes, progress, purchases or settings. Ulti persists with the existing browser save. Sequential saves from older open tabs merge valid Ulti receipts instead of overwriting another tab's awards. This is local browser persistence, not a shared classroom account or a server-verified bank.

## Future connection

No external game or service is contacted. `src/ulti.mjs` exports a read-only `ultiSnapshot(profile, now)` containing active pools and award receipts. Each receipt has a unique shift ID, source (`languini`), amount, restaurant ID, pace, UTC earned timestamp and UTC expiry timestamp. The pool key contains the grade/team. The successful-shift result freezes the selected grade/team/restaurant/pace at shift creation, so later UI choices cannot redirect its reward.

Stored data: `profile.ulti = { version: 1, pools: { "5:gryffindor": [receipt, ...] } }`. Restaurant IDs retain their original meanings: courtyard = Cafe, bistro = Diner, banquet = Bistro. The snapshot returns copies and exposes no spending API. Cross-device sharing, identities, server verification and consuming Ulti elsewhere will be defined when that system is supplied.
