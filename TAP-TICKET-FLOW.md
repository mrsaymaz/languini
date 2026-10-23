# Languini v0.33.0 · Tap to fill and send

Built from the verified v0.32.0 release. This update changes the hanging table ticket (fill-in-the-blank) task only.

- Tapping an answer immediately checks it. A correct answer fills the blank and shows the completed sentence.
- After the brief readback, the physical clip animation runs automatically, then the existing order continues. Students do not need to tap the blank, move the ticket or press Clip & send.
- Incorrect choices keep the task open, retain the existing feedback and count the attempt. They cannot send an incorrect ticket.
- The manual clip/send controls remain hidden. Instructions now say to tap the correct word and explain that sending is automatic. Existing optional word dragging still works.
- Automatic sending waits for camera readiness, pause and requested speech. Clip animation time freezes during pause; rotation restores the filled answer and continues safely without another scoring or sending event.
- The engine's one-time clip state remains an internal commit guard. No answer, reward, stock reservation or route step can be credited twice.

The 3D review card, exactly two-second receipt-reading reduction, compact delivery paper/larger crate, sequential restaurants, tab-return recovery, all three preparation phases, curriculum and save identity remain unchanged.

Automated checks use the real interaction controller, model, station geometry and a native-control stand-in. Real phone touch and rendered browser appearance remain device checks.
