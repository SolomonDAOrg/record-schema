# `STO-00001-order-layout` Order Account Layout

**Status:** Draft
**Owner:** Protocol Engineering
**Applies to:** Protocol, SDK, Indexer
**Related:** FSM-00001 (Order State Machine)

---

## 1. Overview

This specification defines the binary storage layout for limit order accounts
on Solana. The layout is optimized for on-chain space efficiency while
maintaining alignment for efficient access.

## 2. Serialization Format

| Property    | Value        |
| ----------- | ------------ |
| Format      | Borsh        |
| Byte Order  | Little-endian|
| Alignment   | 1 byte       |
| Padding     | Explicit     |

## 3. Account Discriminator

All Solomon protocol accounts use an 8-byte discriminator prefix for type
identification:

```
Order Account: [0x4c, 0x4f, 0x52, 0x44, 0x45, 0x52, 0x00, 0x01]
               "L"   "O"   "R"   "D"   "E"   "R"   ver   rev
```

## 4. Order Account Layout

Total size: 190 bytes

| Offset | Size | Field            | Type    | Description                    |
| ------ | ---- | ---------------- | ------- | ------------------------------ |
| 0      | 8    | discriminator    | [u8; 8] | Account type identifier        |
| 8      | 8    | id               | u64     | Unique order ID                |
| 16     | 32   | owner            | Pubkey  | Order owner                    |
| 48     | 32   | pool             | Pubkey  | Pool address                   |
| 80     | 1    | state            | u8      | Current state code             |
| 81     | 1    | side             | u8      | Order side (0=buy, 1=sell)     |
| 82     | 16   | trigger_price    | u128    | Price threshold (Q64.64)       |
| 98     | 8    | amount_in        | u64     | Total input amount             |
| 106    | 8    | amount_filled    | u64     | Amount filled                  |
| 114    | 8    | amount_out       | u64     | Total output received          |
| 122    | 8    | min_amount_out   | u64     | Minimum output (slippage)      |
| 130    | 8    | created_slot     | u64     | Creation slot                  |
| 138    | 8    | expiry_slot      | u64     | Expiry slot                    |
| 146    | 8    | last_updated     | u64     | Last update slot               |
| 154    | 2    | fill_count       | u16     | Number of fills                |
| 156    | 2    | flags            | u16     | Reserved flags                 |
| 158    | 32   | _padding         | [u8;32] | Reserved for future use        |

See `layouts/STO-00001_LAY-order.v1.yaml` for formal definition.

## 5. Fixed-Point Encoding

Price values use Q64.64 fixed-point encoding:

```
value = raw_value / 2^64
raw_value = value * 2^64
```

Example: Price 1.5 = 0x18000000000000000 (27670116110564327424)

## 6. Pubkey Encoding

Public keys are stored as 32 raw bytes in standard Solana format (base58
decoded).

## 7. Action Tape Layout

Action tapes record all state transitions for replay and audit.

See `layouts/STO-00001_LAY-action-tape.v1.yaml` for formal definition.

### 7.1 Tape Header

| Offset | Size | Field        | Type    | Description              |
| ------ | ---- | ------------ | ------- | ------------------------ |
| 0      | 1    | version      | u8      | Tape format version      |
| 1      | 32   | pool         | Pubkey  | Pool address             |
| 33     | 8    | start_slot   | u64     | First slot in tape       |
| 41     | 8    | end_slot     | u64     | Last slot in tape        |
| 49     | 4    | entry_count  | u32     | Number of entries        |

### 7.2 Tape Entry

| Offset | Size | Field       | Type    | Description              |
| ------ | ---- | ----------- | ------- | ------------------------ |
| 0      | 8    | slot        | u64     | Slot number              |
| 8      | 8    | timestamp   | i64     | Unix timestamp           |
| 16     | 1    | action_type | u8      | Action code              |
| 17     | 8    | order_id    | u64     | Order ID                 |
| 25     | 1    | prev_state  | u8      | State before             |
| 26     | 1    | next_state  | u8      | State after              |
| 27     | var  | data        | bytes   | Action-specific data     |
| var    | 64   | signature   | [u8;64] | Transaction signature    |

## 8. Versioning

Layout versions are encoded in the discriminator. Breaking changes require
version increment and migration support.

## 9. Type Definitions

See `definitions/STO-00001_DEF-types.v1.ts` for TypeScript types.

See `definitions/STO-00001_DEF-codec.v1.ts` for encode/decode functions.
