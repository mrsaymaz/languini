# The opening · Languini v0.43.0

| Time | Story and acting | Sound |
| --- | --- | --- |
| 0–4 s | Glimpse the dusty photograph; the owner straightens CLOSED and looks back | Sparse, unfinished melody; quiet street texture and sign movement |
| 4–9 s | Keys, handshake and promise; the owner softens and walks away | Key jingles and restrained music |
| 9–15 s | Touch the sticky table, inspect the hand, press the failed checkout twice, try the cooker; prepare to work | Two failed button attempts, cooker click and sleeve rustle; quieter music |
| 15–22 s | Broom and cloth reveal the surfaces directly behind them; notice, wipe, study and straighten the photograph | Soft bass and brushes; wiping; the opening melody returns at the photograph |
| 22–26 s | Tighten each panel; close it; cooker warms and checkout responds | Tool taps, panel closures, ignition and the working till |
| 26–32 s | Turn OPEN, step back and wait; bell, chef reaction, customer arrival and transition into gameplay | A quiet beat, a clear bell, then the melody resolves and blends into gameplay |

The edit sheet in src/opening-direction.mjs shares the important action times with the score. Feature surfaces use a moving geometry/UV boundary, retaining the size and appearance of the clean surface beneath them. The photograph starts partly obscured, stays continuously revealed as the cloth moves, and remains in the normal restaurant after the scene.

Music and effects are original local Web Audio. The music and Foley buses are separate so the music can fall quiet before the bell without lowering the bell. No video or audio downloads are added. Dialogue is captioned.

Compact subtitles and a small bottom control strip reserve more space for the scene on portrait phones. Context appears on pause; all buttons retain 44-pixel touch targets. Instruction plaques and the prep display hide during the film and restore for gameplay. The story camera ends at the actual gameplay overview.

Pause, hidden tabs and graphics loss freeze story time and audio. Resume and Continue do not replay missed cues. Reduced motion keeps key poses, actions, surface reveals and subtitles, with no repetitive shake or continuous camera push; the final room reveal uses a static cut. Skip stops story sound. Natural completion fades the music into the first shift.

Existing campaigns retain their completed-intro flag. Use Help > Replay to watch the updated scene; replay returns to setup without changing campaign progress. No service timers run behind the story.
