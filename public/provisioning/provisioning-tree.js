/*
 * provisioning-tree.js
 * -------------------------------------------------------------------
 * The capability-provisioning decision tree for cocapn.com Phase 1
 * (the OTHER half of Phase 1 — the command-loop FSM lives in a parallel
 * build). Pure data + a small deterministic engine. No DOM, no network,
 * no LLM. Rendered by provisioning-demo.html.
 *
 * EVERY cocapn text string below is VERBATIM from
 * PROVISIONING_DIALOGUE_FULL.md (kimi's script). Do not paraphrase or
 * shorten. ActiveLog event shapes match SPEC_fable_phase1.md §3.
 *
 * Judgment calls (noted per the brief, since kimi's doc leaves some
 * presentation details open):
 *
 *  - Vanilla JS as a classic script exposing a global `ProvisioningTree`,
 *    rather than an ES module or .ts. Reason: the demo must open directly
 *    from disk (file://) with no build step or server. ES modules are
 *    blocked by file:// CORS; a classic script is not. A future Worker
 *    build can wrap this file unchanged.
 *
 *  - ActiveLog uses a deterministic FAKE clock: a fixed base epoch plus
 *    fixed per-event deltas, never Date.now(). Replays are reproducible
 *    (SPEC §3.1: "advance a fake clock ... so replays are reproducible").
 *
 *  - Choice targets beginning with "__" are CONTROL FLOWS (return-to-
 *    start, integration hand-offs), not node ids. See TARGET below.
 *
 *  - Bare "[Continue]" buttons (DL-2C, CAM-1) are marked `silent: true`:
 *    clicking them advances without adding a captain utterance to the
 *    transcript, because cocapn is simply continuing its own turn (the
 *    doc explicitly offers "no button needed, or show [Continue]").
 *
 *  - "[Back]" (DL-4) is silent for the same reason — it is UI undo, not
 *    dialogue. "[End here]" / "[Return to demo]" / "[Continue to: turn
 *    the boat]" are silent integration hand-offs.
 */

(function (global) {
  "use strict";

  /* =============================================================
   * Control-flow targets (NOT node ids). A choice whose `target` is one
   * of these does not enter a node; the renderer handles the hand-off.
   * ============================================================= */
  const TARGET = {
    // Return to the scene-picker start hub.
    START: "__START__",
    // DL-5's single outbound exit → the §1 command-loop demo (parallel
    // build). This is the ONE place the provisioning tree connects to
    // the command FSM: once the profile is saved, deck_red / deck_white
    // / lights_off become live C2 phrases in the grammar.
    INTEGRATION_COMMAND: "__INTEGRATION_COMMAND__",
    // CAM scene exits ([End here], [Return to demo]) → the command-loop
    // demo's IDLE state (parallel build).
    INTEGRATION_IDLE: "__INTEGRATION_IDLE__",
  };

  /* =============================================================
   * THE TREE.
   *
   * Node shape:
   *   id           — "DL-1", "CAM-2", ...
   *   scene        — "dl" | "cam"
   *   captainPrompt (entry nodes only) — fixed initiating utterance,
   *                  shown as the captain's first message
   *   cocapnText[] — cocapn's text, one string per paragraph (verbatim)
   *   artifacts[]  — special UI rendered inside the turn (profile card,
   *                  engine frame, sonar map). Optional.
   *   emit[]       — ActiveLog events emitted on entry. Optional.
   *   choices[]    — { label, target, silent?, utterance? }
   *   terminal     — true for scene terminators
   * ============================================================= */

  /** @type {Record<string, object>} */
  const NODES = {
    /* ===========================================================
     * 2.1  Lighting-provisioning tree: "Deck lights by voice"
     * =========================================================== */

    "DL-1": {
      id: "DL-1",
      scene: "dl",
      captainPrompt:
        `cocapn, I want the deck lights on voice command. Red at night, white when I'm working gear. Fail dark if anything hangs.`,
      cocapnText: [
        `Got it. You said 'the deck lights' — I'm matching that to the two LED fixtures you logged last trip as 'deck floods' and 'night rack.' I'll draft a Helm profile for a lighting relay. Before I show you the wiring card, what autopilot or existing switch do these run through now?`,
      ],
      choices: [
        // Labels kept verbatim, including the surrounding double quotes —
        // kimi's doc presents these as the captain's spoken lines, and the
        // quotes signal "this is what you say." Becomes the captain turn.
        { label: `"Just a manual toggle on the helm panel. Nothing smart."`, target: "DL-3" },
        { label: `"They're already wired through the autopilot."`,         target: "DL-2B" },
        { label: `"Not sure."`,                                            target: "DL-2C" },
      ],
    },

    "DL-2B": {
      id: "DL-2B",
      scene: "dl",
      cocapnText: [
        `That's a different wiring shape than this sketch covers — the parallel-relay pattern is the one case this demo walks through. In a real install I'd ask a lot more questions before touching anything already wired through the autopilot.`,
      ],
      choices: [
        { label: "Continue with the manual-toggle case", target: "DL-3" },
      ],
    },

    "DL-2C": {
      id: "DL-2C",
      scene: "dl",
      cocapnText: [
        `No problem — for this sketch I'll assume the common case, a simple manual toggle.`,
      ],
      choices: [
        // Auto-advance in kimi's doc. Silent: cocapn proceeds with the
        // assumption; the captain is not speaking here.
        { label: "Continue", target: "DL-3", silent: true },
      ],
    },

    "DL-3": {
      id: "DL-3",
      scene: "dl",
      cocapnText: [
        `Good. That means we parallel at the toggle, not in series. The Helm unit never carries the load — it drives a relay coil. Here's what I'd generate.`,
        `Two things to check with your eyes and a meter before this is real: the relay coil pulls less than 40 mA per channel, and the Helm unit's ground returns to the battery, not the helm panel ground loop. The sea-trial checklist will make you test 'lights off' from each physical switch while the Helm unit is powered, and 'belay that' mid-command. Want me to keep this profile in the log?`,
      ],
      artifacts: [
        {
          // The wiring card. Rendered verbatim from kimi's script JSON.
          kind: "profile-card",
          label: "drafted profile · lighting-relay-2ch",
          data: {
            profile: "lighting-relay-2ch",
            firmware: {
              gpio_out: [12, 14],
              default_state: "both_off",
              fail_state: "both_off",
              watchdog_ms: 500,
              commands: {
                deck_red:   { pin: 12,       ttl_ms: 500, class: "C2" },
                deck_white: { pin: 14,       ttl_ms: 500, class: "C2" },
                lights_off: { pin: [12, 14], ttl_ms: 500, class: "C2" },
              },
            },
          },
        },
      ],
      choices: [
        { label: "Yes, save it",            target: "DL-5" },
        { label: "What if the relay fails?", target: "DL-4" },
        // Returns to entry, nothing saved (per SPEC §2.1 / kimi's note).
        { label: "Cancel",                  target: "DL-1" },
      ],
    },

    "DL-4": {
      id: "DL-4",
      scene: "dl",
      // Double-quoted JS string because this text contains literal backticks
      // (`fail_state`, `both_off`) that would collide with a template literal.
      cocapnText: [
        "If the Helm unit loses power or the firmware crashes, `fail_state` is `both_off` — the lights default to off, not on, and not to whatever they were before. That's the same fail-dark principle as the steering side: unpowered or crashed always resolves to the safe state, never a held state.",
      ],
      choices: [
        // UI "back" navigation, not dialogue — silent.
        { label: "Back", target: "DL-3", silent: true },
      ],
    },

    "DL-5": {
      id: "DL-5",
      scene: "dl",
      terminal: true,
      cocapnText: [
        `Profile saved. In a real install, the next step is flashing this to the Helm unit over USB and walking the wiring card. Here, I'm showing you the shape of that conversation.`,
      ],
      // ActiveLog events to emit on entry, IN THIS ORDER (kimi's doc):
      emit: [
        { type: "chat.exchange", body: { role: "assistant", text: "drafted lighting-relay-2ch profile" } },
        // helm.profile is the new sixth body type flagged in SPEC §0.2/§3.4
        // (not yet in aider's schema). Shape: {profile, channels, fail_state}.
        { type: "helm.profile",
          body: { profile: "lighting-relay-2ch", channels: 2, fail_state: "both_off" } },
      ],
      choices: [
        // THE exit point of the provisioning tree → command-loop demo.
        // Silent: this is a hand-off action, not dialogue. The renderer
        // shows an integration panel + console.log rather than a node.
        { label: "Continue to: turn the boat", target: TARGET.INTEGRATION_COMMAND, silent: true },
      ],
    },

    /* ===========================================================
     * 2.2  Camera / gauges / fishery tree:
     *      "What's in the engine room, and where do I drive?"
     * =========================================================== */

    "CAM-1": {
      id: "CAM-1",
      scene: "cam",
      captainPrompt: `cocapn, what are you seeing down there?`,
      cocapnText: [
        `Let me pull the engine-room frame and read it against the log.`,
      ],
      choices: [
        // Auto-advance in kimi's doc. Silent: cocapn pulling the frame.
        { label: "Continue", target: "CAM-2", silent: true },
      ],
    },

    "CAM-2": {
      id: "CAM-2",
      scene: "cam",
      cocapnText: [
        `Engine-room camera: coolant temp gauge at 198 °F, which is 8 °F above where it sat yesterday. Oil pressure steady at 38 psi. Bilge pump is not running, but the bilge level float is at 2.1 inches — up from 0.4 inches at the start of the trip. I also see the port fuel filter bowl has a slight haze; I can't call it water from the image, but it's different from the last frame I have.`,
      ],
      artifacts: [
        {
          // "UI rendered frame: simulated engine-room still with overlaid
          // readouts." Display-only gauges drive the mock overlay; the
          // emitted media.frame body (below) is the canonical payload.
          kind: "engine-frame",
          label: "sim://engine-cam/frame/0001",
          data: {
            sha256: "<dummy>",
            uri: "sim://engine-cam/frame/0001",
            source: "engine-cam",
            w: 1920,
            h: 1080,
            description:
              "coolant temp 198°F (8°F above yesterday), oil pressure 38 psi steady, bilge level 2.1in (up from 0.4in at trip start), slight haze in the port fuel filter bowl",
            gauges: [
              { label: "coolant",        value: "198 °F", note: "+8 °F vs. yesterday", flag: true },
              { label: "oil pressure",   value: "38 psi", note: "steady" },
              { label: "bilge level",    value: "2.1 in", note: "up from 0.4 in",      flag: true },
              { label: "port fuel filter", value: "haze", note: "not confirmed water", flag: true },
            ],
          },
        },
      ],
      emit: [
        { type: "media.frame",
          body: {
            sha256: "<dummy>",
            uri: "sim://engine-cam/frame/0001",
            source: "engine-cam",
            w: 1920, h: 1080,
            description:
              "coolant temp 198°F (8°F above yesterday), oil pressure 38 psi steady, bilge level 2.1in (up from 0.4in at trip start), slight haze in the port fuel filter bowl",
          } },
      ],
      choices: [
        { label: "And outside?", target: "CAM-3" },
        // Clean exit leaf for visitors who don't want the fishing decision.
        // → command-loop demo IDLE (parallel build).
        { label: "End here", target: TARGET.INTEGRATION_IDLE, silent: true },
      ],
    },

    "CAM-3": {
      id: "CAM-3",
      scene: "cam",
      cocapnText: [
        `Wind's veered southwest and is building to 18 knots. Sonar map shows the pinnacle you marked yesterday at 142 true, 1.2 miles, with a school holding at 80 fathoms. The drift line you wanted is getting pushed east faster than the log predicted.`,
      ],
      artifacts: [
        {
          // "UI update: sonar map refreshes to show the cluster drifting
          // east of the mark." Schematic SVG mock. The honesty label below
          // is VERBATIM from kimi's doc and is the load-bearing honesty
          // distinction (SPEC done-criteria #8).
          kind: "sonar-map",
          label: "Sonar tracking: real repo, real math · camera/gauge readings: simulated",
          data: {
            bearing_true: 142,     // to the pinnacle
            range_nm: 1.2,
            school_fathoms: 80,
            wind: { dir: "SW", knots: 18, building: true },
            drift: "pushed east, faster than logged prediction",
          },
        },
      ],
      choices: [
        { label: "Do I keep fishing it?", target: "CAM-4" },
      ],
    },

    "CAM-4": {
      id: "CAM-4",
      scene: "cam",
      cocapnText: [
        `My read: the fish are still there, but the mechanical risk is stacking. Rising bilge plus climbing coolant on a southwest build is a pattern that has preceded three bad trips in your log — all of them ended with gear in the water and a long run home. If I were aboard, I'd suggest one more pass on the pinnacle, then pull gear and run the inlet while you still have daylight and the engine has margin.`,
      ],
      choices: [
        { label: "Make the pass",   target: "CAM-5A" },
        { label: "Pull gear now",   target: "CAM-5B" },
      ],
    },

    "CAM-5A": {
      id: "CAM-5A",
      scene: "cam",
      terminal: true,
      cocapnText: [
        `Aye. I'll keep the camera on the gauges and log every 30 seconds until we're clear.`,
      ],
      emit: [
        // Per SPEC §0.2: the captain's recorded decision is an ordinary
        // chat.exchange with role "human" (NOT kimi's invented mark.note).
        { type: "chat.exchange", body: { role: "human", text: "make the pass, then run the inlet" } },
      ],
      choices: [
        { label: "Return to demo", target: TARGET.INTEGRATION_IDLE, silent: true },
      ],
    },

    "CAM-5B": {
      id: "CAM-5B",
      scene: "cam",
      terminal: true,
      cocapnText: [
        `Aye. Pulling gear now, camera stays on the gauges, and I'll log every 30 seconds until we're tied up.`,
      ],
      emit: [
        { type: "chat.exchange", body: { role: "human", text: "pull gear now and run the inlet" } },
      ],
      choices: [
        { label: "Return to demo", target: TARGET.INTEGRATION_IDLE, silent: true },
      ],
    },
  };

  /* =============================================================
   * Scene metadata — titles + blurbs for the start hub and breadcrumb.
   * Titles are kimi's scene headers; blurbs are this build's signpost
   * copy (not dialogue, so not subject to the verbatim rule).
   * ============================================================= */
  const SCENES = {
    dl: {
      key: "dl",
      title: "Deck lights by voice",
      eyebrow: "Scene 2.1 · Lighting-provisioning tree",
      blurb:
        "Walk cocapn through drafting a Helm profile for a 2-channel lighting relay — red at night, white for working gear, fail dark. Five nodes, two short redirect branches, one terminal hand-off into the command-loop demo.",
      entry: "DL-1",
    },
    cam: {
      key: "cam",
      title: "What's in the engine room, and where do I drive?",
      eyebrow: "Scene 2.2 · Camera / gauges / fishery tree",
      blurb:
        "cocapn reads a simulated engine-room frame against the log, calls the sonar map (real repo, real math), and makes a bounded recommendation. Five nodes, two terminal leaves — recommend, never decide.",
      entry: "CAM-1",
    },
  };

  /* =============================================================
   * ActiveLog — deterministic envelope builder.
   *
   * Envelope shape (SPEC §3.1):
   *   { alv, dev, seq, ts, mono, type, body }
   *
   * Device assignment (SPEC §3.2):
   *   sim-phone — chat.exchange, helm.command(received/awaiting_confirm)
   *   sim-helm  — helm.event, helm.command(executed/rejected), fix.track,
   *                helm.profile (profile saved to the Helm unit)
   *   sim-cam   — media.frame
   * ============================================================= */
  const BASE_TS = Date.UTC(2025, 0, 1, 0, 0, 0); // 2025-01-01T00:00:00Z (fixed)
  const TS_STEP_MS = 1000;   // simulated seconds between successive events
  const MONO_STEP_MS = 1500; // per-device monotonic ms advance per event

  const log = {
    events: [],
    _tick: 0,
    _seq: { "sim-phone": 0, "sim-helm": 0, "sim-cam": 0 },
    _mono: { "sim-phone": 0, "sim-helm": 0, "sim-cam": 0 },

    reset() {
      this.events = [];
      this._tick = 0;
      this._seq = { "sim-phone": 0, "sim-helm": 0, "sim-cam": 0 };
      this._mono = { "sim-phone": 0, "sim-helm": 0, "sim-cam": 0 };
    },

    /** Infer the originating device id from event type/body (SPEC §3.2). */
    _inferDev(type, body) {
      switch (type) {
        case "media.frame":    return "sim-cam";
        case "helm.event":
        case "fix.track":
        case "helm.profile":   return "sim-helm";
        case "helm.command":
          // Split: received/awaiting_confirm → sim-phone;
          //        executed/rejected          → sim-helm.
          return body && (body.result === "executed" || body.result === "rejected")
            ? "sim-helm" : "sim-phone";
        case "chat.exchange":
        default:               return "sim-phone";
      }
    },

    /** Build a full envelope and append it. Returns the envelope. */
    emit(type, body, devOverride) {
      const dev = devOverride || this._inferDev(type, body);
      this._tick += 1;
      this._seq[dev] += 1;
      this._mono[dev] += MONO_STEP_MS;
      const env = {
        alv: 1,
        dev,
        seq: this._seq[dev],
        ts: BASE_TS + this._tick * TS_STEP_MS,
        mono: this._mono[dev],
        type,
        body,
      };
      this.events.push(env);
      return env;
    },
  };

  /* =============================================================
   * Public API.
   * ============================================================= */
  global.ProvisioningTree = {
    NODES,
    SCENES,
    TARGET,
    log,
    /** Get a node by id. Throws clearly on a bad id — no silent dead-end. */
    node(id) {
      const n = NODES[id];
      if (!n) throw new Error("provisioning-tree: unknown node id " + id);
      return n;
    },
    /** True if `t` is a control-flow target rather than a node id. */
    isControlTarget(t) {
      return t === TARGET.START ||
             t === TARGET.INTEGRATION_COMMAND ||
             t === TARGET.INTEGRATION_IDLE;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
