# cocapn.com Phase 1 — gate sign-off

The gate for deploying this build to the live `cocapn.com` domain was
defined earlier in this session as requiring a named human, with a
dated, written approval that the page does not overclaim — not an
emergent property of enough evidence accumulating.

**Reviewed:** 2026-07-07
**Approved by:** Casey DiGennaro, via explicit instruction to proceed
("go with your recommendations on everything you have my sign-off"),
given Fable's synthesis and recommendation in
`/tmp/.../scratchpad/fable-hard-problems/GRAND_SYNTHESIS.md` (problem 4),
independently reviewed and verified by Claude before this sign-off was
recorded.

**Scope:** Phase 1 only — the command-and-confirm helm FSM and the
capability-provisioning tree, both deterministic, no LLM in either path.
Phase 2 (LLM-backed chat, generated provisioning) is explicitly excluded
and has no path to this domain from this decision.

**Basis for approval:**
- Both source repos (`cocapn-phase1-state-machine`,
  `cocapn-phase1-provisioning`) are honest about being prototypes in
  their own READMEs, with real documented judgment calls.
- The paradigm-first rewrite standard is proven live on `cocapn.ai` and
  `superinstance.ai` this session.
- A real vision-model test of this page's actual hero copy already
  showed a non-technical reader correctly inferring "a digital ghost of
  a machine that hasn't been built yet" — the honesty outcome this gate
  exists to protect, already measured before this sign-off.
- The one finding from that test (the primary CTA reading as
  intimidating) was fixed before this deployment: both demo entry
  buttons now read as concrete tasks ("Try it: say 'port ten'...", "Try
  it: turn on the deck lights...") rather than category labels.
- Explicit cross-links to `cocapn.ai` and both real GitHub repos were
  added so a skeptical visitor can verify every claim directly.
- The sticky status bar ("SIMULATION — designed, not built... No LLM is
  in the path") is present on every page in this build, not just the
  landing page.
