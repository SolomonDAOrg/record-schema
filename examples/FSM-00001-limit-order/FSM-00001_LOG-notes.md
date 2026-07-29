# `FSM-00001-limit-order` Specification Log

**Status:** Draft
**Owner:** Protocol Engineering
**Applies to:** Protocol Team
**Related:** FSM-00001_DOC-main.md

---

## 2026-01-07

### Initial Draft

Created formal state machine specification:
- 6 states (3 terminal)
- 5 events
- 10 transitions with guards and actions

### Schema Files

Added YAML schemas:
- `SCH-states.v1.yaml`: State definitions with invariants
- `SCH-transitions.v1.yaml`: Transition table with guards/actions
- `SCH-events.v1.yaml`: Event definitions and emitted events

### Type Definitions

Added TypeScript definitions:
- `DEF-types.v1.ts`: All type definitions
- `DEF-machine.v1.ts`: State machine implementation

### Open Questions

1. Should we add a `paused` state for emergency stops?
2. Minimum fill amount threshold value?
3. TWAP window duration for price trigger?
