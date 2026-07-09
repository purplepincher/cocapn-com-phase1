# Architecture

## State machine design

The `HelmStateMachine` (in `state‑machine.js`) is a small deterministic finite‑state machine with the following states:

- `IDLE` – awaiting a command.
- `C1_PULSING` – a “pulse” timer is running; when it expires the heading changes (simulated).  
- `C1_PULSED` – the pulse completed, the state machine is momentarily idle again.
- `C2_AWAITING_CONFIRM` – a high‑class command (e.g. a mode change) requires explicit confirmation.
- `C2_PULSING` – confirmation received, now pulsing.
- `C2_PULSED` – pulse completed.
- `LOCKOUT` – entered after an override (T10) to simulate hardware recovery; no commands accepted until a lockout timer expires.

The important non‑obvious design decisions:

1. **Two pulse classes (C1 vs C2).**  
   Class‑C1 actions (ordinary heading changes) are applied after a single short timer (`TTL_MS`).  
   Class‑C2 actions (e.g. changing the active profile) require an explicit *confirm* within a configurable window (`CONFIRM_WINDOW_MS`). This mimics real command‑and‑control protocols where irreversible actions must be double‑checked.

2. **Cancel via “belay”.**  
   At any point before a pulse completes, saying “belay” or “cancel” aborts the pending action and reverts to `IDLE` (or to the appropriate state). This is implemented in `t4_belay()` and `t7_cancelled()`.

3. **Override / lockout.**  
   The `override()` method (called externally) immediately clears any pending timers and sets the relay to open, then enters a `LOCKOUT` state with a separate timer. After the lockout expires the machine transitions back to `IDLE`. This simulates a hardware safety override that must cool down.

4. **Timer coordination.**  
   Three independent timers (`TTL`, `confirm`, `lockout`) are managed with clear/cancel protection to avoid double‑firing. Callbacks (`onTimerStart`, `onTimerEnd`) are forwarded to a listener interface so a UI can animate timers.

5. **Synthetic time base.**  
   `BASE_EPOCH` and `MONO_STEP_MS` are used to produce monotonic timestamps for events (`emit`). This enables deterministic replay in test or simulation without depending on real wall‑clock.

### State diagram (simplified)

