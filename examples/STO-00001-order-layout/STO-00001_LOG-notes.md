# `STO-00001-order-layout` Specification Log

**Status:** Draft
**Owner:** Protocol Engineering
**Applies to:** Protocol Team
**Related:** STO-00001_DOC-main.md

---

## 2026-01-07

### Initial Draft

Created storage layout specification:
- Order account: 190 bytes with 8-byte discriminator
- Action tape: Variable-size with header + entries
- Q64.64 fixed-point for prices

### Layout Files

Added YAML layouts:
- `LAY-order.v1.yaml`: Order account binary layout
- `LAY-action-tape.v1.yaml`: Action tape binary layout

### Type Definitions

Added TypeScript definitions:
- `DEF-types.v1.ts`: Type definitions and constants
- `DEF-codec.v1.ts`: Encode/decode functions
