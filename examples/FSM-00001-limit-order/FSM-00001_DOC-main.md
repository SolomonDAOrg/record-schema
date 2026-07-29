# `FSM-00001-limit-order` Limit Order State Machine

**Status:** Draft
**Owner:** Protocol Engineering
**Applies to:** Protocol, SDK, Indexer
**Related:** STO-00001 (Order Account Layout), GRM-00001 (Order Query Language)

---

## 1. Overview

This specification defines the finite state machine for limit orders in the
Solomon AMM protocol. A limit order transitions through states based on
events from user actions, price triggers, and time expiry.

## 2. Formal Definition

The state machine M is defined as:

```
M = (S, E, T, s₀, F)
```

Where:
- S = {pending, open, partial, filled, cancelled, expired}
- E = {activate, fill, partial_fill, cancel, expire}
- T = S × E → S (transition function)
- s₀ = pending (initial state)
- F = {filled, cancelled, expired} (terminal states)

## 3. States

| State     | Code | Terminal | Invariants                           |
| --------- | ---- | -------- | ------------------------------------ |
| pending   | 0    | No       | amount_filled = 0, not monitoring    |
| open      | 1    | No       | amount_filled = 0, monitoring price  |
| partial   | 2    | No       | 0 < amount_filled < amount_in        |
| filled    | 3    | Yes      | amount_filled = amount_in            |
| cancelled | 4    | Yes      | refund issued                        |
| expired   | 5    | Yes      | slot > expiry_slot, refund issued    |

See `schemas/FSM-00001_SCH-states.v1.yaml` for formal schema.

## 4. Events

| Event        | Code | Source      | Description                    |
| ------------ | ---- | ----------- | ------------------------------ |
| activate     | 1    | crank       | Order passes validation        |
| partial_fill | 2    | crank       | Price trigger, partial exec    |
| fill         | 3    | crank       | Price trigger, full exec       |
| cancel       | 4    | user        | User cancellation request      |
| expire       | 5    | crank       | TTL exceeded                   |

See `schemas/FSM-00001_SCH-events.v1.yaml` for formal schema.

## 5. Transitions

### 5.1 Transition Table

| From      | Event        | To        | Guard                    | Action              |
| --------- | ------------ | --------- | ------------------------ | ------------------- |
| pending   | activate     | open      | valid_order              | emit_activated      |
| pending   | cancel       | cancelled | is_owner                 | refund_full         |
| open      | partial_fill | partial   | price_triggered ∧ amount | exec_partial        |
| open      | fill         | filled    | price_triggered ∧ amount | exec_full           |
| open      | cancel       | cancelled | is_owner                 | refund_full         |
| open      | expire       | expired   | slot > expiry            | refund_full         |
| partial   | partial_fill | partial   | price_triggered ∧ amount | exec_partial        |
| partial   | fill         | filled    | price_triggered ∧ amount | exec_remaining      |
| partial   | cancel       | cancelled | is_owner                 | refund_remaining    |
| partial   | expire       | expired   | slot > expiry            | refund_remaining    |

See `schemas/FSM-00001_SCH-transitions.v1.yaml` for formal schema.

### 5.2 Guards

**valid_order**: Order parameters pass validation (balance, price, TTL).

**is_owner**: Transaction signer matches order owner.

**price_triggered**: Pool TWAP has crossed order trigger price.

**slot > expiry**: Current slot exceeds order expiry_slot.

**amount**: Fill amount meets minimum threshold.

### 5.3 Actions

**emit_activated**: Emit OrderActivated event, record to action tape.

**exec_partial**: Transfer partial tokens, update amount_filled, emit event.

**exec_full**: Transfer remaining tokens, emit OrderFilled event.

**exec_remaining**: Transfer remaining tokens after partials, emit OrderFilled.

**refund_full**: Return all locked tokens to owner.

**refund_remaining**: Return unfilled tokens to owner.

## 6. State Diagram

See `diagrams/FSM-00001_DIA-state-chart.mermaid`.

## 7. Type Definitions

See `definitions/FSM-00001_DEF-types.v1.ts` for TypeScript types.

See `definitions/FSM-00001_DEF-machine.v1.ts` for machine implementation.

## 8. Determinism

The machine is deterministic: for any state s and event e, there is at most
one valid transition. Guards must be mutually exclusive where multiple
transitions from the same state respond to the same event.

## 9. Reachability

All non-terminal states can reach at least one terminal state:
- pending → cancelled (via cancel)
- open → filled | cancelled | expired
- partial → filled | cancelled | expired

## 10. Safety Properties

**P1 (No resurrection)**: Once in terminal state, no transitions possible.

**P2 (Monotonic fill)**: amount_filled never decreases.

**P3 (Conservation)**: amount_in = amount_filled + refund_amount (at terminal).

**P4 (Owner authority)**: Only owner can trigger cancel.
