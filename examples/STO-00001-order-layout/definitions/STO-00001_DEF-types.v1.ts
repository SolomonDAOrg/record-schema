/**
 * @file STO-00001_DEF-types.v1.ts
 * @description Type definitions for order account storage layout
 * @version 1
 * @record STO-00001
 */

import type { SolanaAddress } from "@solomon-labs/types";

// ============================================================================
// Constants
// ============================================================================

export const ORDER_ACCOUNT_SIZE = 190;

export const ORDER_DISCRIMINATOR = new Uint8Array([
    0x4c, 0x4f, 0x52, 0x44, 0x45, 0x52, 0x00, 0x01
]);

// ============================================================================
// Field Offsets
// ============================================================================

export const OrderFieldOffset = {
    Discriminator: 0,
    Id: 8,
    Owner: 16,
    Pool: 48,
    State: 80,
    Side: 81,
    TriggerPrice: 82,
    AmountIn: 98,
    AmountFilled: 106,
    AmountOut: 114,
    MinAmountOut: 122,
    CreatedSlot: 130,
    ExpirySlot: 138,
    LastUpdatedSlot: 146,
    FillCount: 154,
    Flags: 156,
    Padding: 158,
} as const;

export type OrderFieldOffset = typeof OrderFieldOffset[keyof typeof OrderFieldOffset];

// ============================================================================
// Field Sizes
// ============================================================================

export const OrderFieldSize = {
    Discriminator: 8,
    Id: 8,
    Owner: 32,
    Pool: 32,
    State: 1,
    Side: 1,
    TriggerPrice: 16,
    AmountIn: 8,
    AmountFilled: 8,
    AmountOut: 8,
    MinAmountOut: 8,
    CreatedSlot: 8,
    ExpirySlot: 8,
    LastUpdatedSlot: 8,
    FillCount: 2,
    Flags: 2,
    Padding: 32,
} as const;

// ============================================================================
// Raw Account Data
// ============================================================================

export interface OrderAccountRaw {
    readonly discriminator: Uint8Array;
    readonly id: bigint;
    readonly owner: Uint8Array;
    readonly pool: Uint8Array;
    readonly state: number;
    readonly side: number;
    readonly triggerPrice: bigint;
    readonly amountIn: bigint;
    readonly amountFilled: bigint;
    readonly amountOut: bigint;
    readonly minAmountOut: bigint;
    readonly createdSlot: bigint;
    readonly expirySlot: bigint;
    readonly lastUpdatedSlot: bigint;
    readonly fillCount: number;
    readonly flags: number;
}

// ============================================================================
// Decoded Account Data
// ============================================================================

export interface OrderAccount {
    readonly id: bigint;
    readonly owner: SolanaAddress;
    readonly pool: SolanaAddress;
    readonly state: number;
    readonly side: number;
    readonly triggerPrice: bigint;
    readonly amountIn: bigint;
    readonly amountFilled: bigint;
    readonly amountOut: bigint;
    readonly minAmountOut: bigint;
    readonly createdSlot: bigint;
    readonly expirySlot: bigint;
    readonly lastUpdatedSlot: bigint;
    readonly fillCount: number;
    readonly flags: number;
}

// ============================================================================
// Action Tape Types
// ============================================================================

export const TAPE_HEADER_SIZE = 53;

export const TapeHeaderOffset = {
    Version: 0,
    Pool: 1,
    StartSlot: 33,
    EndSlot: 41,
    EntryCount: 49,
} as const;

export interface TapeHeader {
    readonly version: number;
    readonly pool: SolanaAddress;
    readonly startSlot: bigint;
    readonly endSlot: bigint;
    readonly entryCount: number;
}

export interface TapeEntryBase {
    readonly slot: bigint;
    readonly timestamp: bigint;
    readonly actionType: number;
    readonly orderId: bigint;
    readonly prevState: number;
    readonly nextState: number;
    readonly signature: Uint8Array;
}

export interface ActivateEntryData {
    readonly triggerPrice: bigint;
    readonly amountIn: bigint;
    readonly expirySlot: bigint;
}

export interface PartialFillEntryData {
    readonly fillAmount: bigint;
    readonly fillPrice: bigint;
    readonly amountOut: bigint;
    readonly remaining: bigint;
}

export interface FillEntryData {
    readonly fillAmount: bigint;
    readonly fillPrice: bigint;
    readonly amountOut: bigint;
}

export interface CancelEntryData {
    readonly refundAmount: bigint;
    readonly reason: number;
}

export interface ExpireEntryData {
    readonly refundAmount: bigint;
    readonly expirySlot: bigint;
}

export type TapeEntryData =
    | ActivateEntryData
    | PartialFillEntryData
    | FillEntryData
    | CancelEntryData
    | ExpireEntryData;

export interface TapeEntry extends TapeEntryBase {
    readonly data: TapeEntryData;
}

export interface ActionTape {
    readonly header: TapeHeader;
    readonly entries: readonly TapeEntry[];
}
