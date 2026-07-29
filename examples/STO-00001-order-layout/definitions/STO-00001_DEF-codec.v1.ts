/**
 * @file STO-00001_DEF-codec.v1.ts
 * @description Encode/decode functions for order account storage
 * @version 1
 * @record STO-00001
 */

import { BufferUtil } from "@solomon-labs/buffer";
import { Base58Util } from "@solomon-labs/base58";
import type { SolanaAddress } from "@solomon-labs/types";
import {
    ORDER_ACCOUNT_SIZE,
    ORDER_DISCRIMINATOR,
    OrderFieldOffset,
    TAPE_HEADER_SIZE,
    TapeHeaderOffset,
    type OrderAccount,
    type TapeHeader,
    type TapeEntry,
    type ActionTape,
} from "./STO-00001_DEF-types.v1";

// ============================================================================
// Order Account Codec
// ============================================================================

export function decodeOrderAccount(data: Uint8Array): OrderAccount {
    if (data.length < ORDER_ACCOUNT_SIZE) {
        throw new Error(`Invalid account size: ${data.length}, expected ${ORDER_ACCOUNT_SIZE}`);
    }

    const discriminator = data.slice(0, 8);
    if (!BufferUtil.equals(discriminator, ORDER_DISCRIMINATOR)) {
        throw new Error("Invalid account discriminator");
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    return {
        id: view.getBigUint64(OrderFieldOffset.Id, true),
        owner: pubkeyToAddress(data.slice(OrderFieldOffset.Owner, OrderFieldOffset.Owner + 32)),
        pool: pubkeyToAddress(data.slice(OrderFieldOffset.Pool, OrderFieldOffset.Pool + 32)),
        state: data[OrderFieldOffset.State],
        side: data[OrderFieldOffset.Side],
        triggerPrice: readU128(view, OrderFieldOffset.TriggerPrice),
        amountIn: view.getBigUint64(OrderFieldOffset.AmountIn, true),
        amountFilled: view.getBigUint64(OrderFieldOffset.AmountFilled, true),
        amountOut: view.getBigUint64(OrderFieldOffset.AmountOut, true),
        minAmountOut: view.getBigUint64(OrderFieldOffset.MinAmountOut, true),
        createdSlot: view.getBigUint64(OrderFieldOffset.CreatedSlot, true),
        expirySlot: view.getBigUint64(OrderFieldOffset.ExpirySlot, true),
        lastUpdatedSlot: view.getBigUint64(OrderFieldOffset.LastUpdatedSlot, true),
        fillCount: view.getUint16(OrderFieldOffset.FillCount, true),
        flags: view.getUint16(OrderFieldOffset.Flags, true),
    };
}

export function encodeOrderAccount(account: OrderAccount): Uint8Array {
    const data = new Uint8Array(ORDER_ACCOUNT_SIZE);
    const view = new DataView(data.buffer);

    data.set(ORDER_DISCRIMINATOR, 0);

    view.setBigUint64(OrderFieldOffset.Id, account.id, true);
    data.set(addressToPubkey(account.owner), OrderFieldOffset.Owner);
    data.set(addressToPubkey(account.pool), OrderFieldOffset.Pool);
    data[OrderFieldOffset.State] = account.state;
    data[OrderFieldOffset.Side] = account.side;
    writeU128(view, OrderFieldOffset.TriggerPrice, account.triggerPrice);
    view.setBigUint64(OrderFieldOffset.AmountIn, account.amountIn, true);
    view.setBigUint64(OrderFieldOffset.AmountFilled, account.amountFilled, true);
    view.setBigUint64(OrderFieldOffset.AmountOut, account.amountOut, true);
    view.setBigUint64(OrderFieldOffset.MinAmountOut, account.minAmountOut, true);
    view.setBigUint64(OrderFieldOffset.CreatedSlot, account.createdSlot, true);
    view.setBigUint64(OrderFieldOffset.ExpirySlot, account.expirySlot, true);
    view.setBigUint64(OrderFieldOffset.LastUpdatedSlot, account.lastUpdatedSlot, true);
    view.setUint16(OrderFieldOffset.FillCount, account.fillCount, true);
    view.setUint16(OrderFieldOffset.Flags, account.flags, true);

    return data;
}

// ============================================================================
// Tape Codec
// ============================================================================

export function decodeTapeHeader(data: Uint8Array): TapeHeader {
    if (data.length < TAPE_HEADER_SIZE) {
        throw new Error(`Invalid tape header size: ${data.length}`);
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    return {
        version: data[TapeHeaderOffset.Version],
        pool: pubkeyToAddress(data.slice(TapeHeaderOffset.Pool, TapeHeaderOffset.Pool + 32)),
        startSlot: view.getBigUint64(TapeHeaderOffset.StartSlot, true),
        endSlot: view.getBigUint64(TapeHeaderOffset.EndSlot, true),
        entryCount: view.getUint32(TapeHeaderOffset.EntryCount, true),
    };
}

export function decodeActionTape(data: Uint8Array): ActionTape {
    const header = decodeTapeHeader(data);
    const entries: TapeEntry[] = [];

    let offset = TAPE_HEADER_SIZE;
    for (let i = 0; i < header.entryCount; i++) {
        const { entry, bytesRead } = decodeTapeEntry(data.slice(offset));
        entries.push(entry);
        offset += bytesRead;
    }

    return { header, entries };
}

function decodeTapeEntry(data: Uint8Array): { entry: TapeEntry; bytesRead: number } {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    const slot = view.getBigUint64(0, true);
    const timestamp = view.getBigInt64(8, true);
    const actionType = data[16];
    const orderId = view.getBigUint64(17, true);
    const prevState = data[25];
    const nextState = data[26];

    const { entryData, dataSize } = decodeEntryData(data.slice(27), actionType);

    const sigOffset = 27 + dataSize;
    const signature = data.slice(sigOffset, sigOffset + 64);

    return {
        entry: {
            slot,
            timestamp,
            actionType,
            orderId,
            prevState,
            nextState,
            data: entryData,
            signature,
        },
        bytesRead: sigOffset + 64,
    };
}

function decodeEntryData(
    data: Uint8Array,
    actionType: number
): { entryData: TapeEntry["data"]; dataSize: number } {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    switch (actionType) {
        case 1: // activate
            return {
                entryData: {
                    triggerPrice: readU128(view, 0),
                    amountIn: view.getBigUint64(16, true),
                    expirySlot: view.getBigUint64(24, true),
                },
                dataSize: 32,
            };

        case 2: // partial_fill
            return {
                entryData: {
                    fillAmount: view.getBigUint64(0, true),
                    fillPrice: readU128(view, 8),
                    amountOut: view.getBigUint64(24, true),
                    remaining: view.getBigUint64(32, true),
                },
                dataSize: 40,
            };

        case 3: // fill
            return {
                entryData: {
                    fillAmount: view.getBigUint64(0, true),
                    fillPrice: readU128(view, 8),
                    amountOut: view.getBigUint64(24, true),
                },
                dataSize: 32,
            };

        case 4: // cancel
            return {
                entryData: {
                    refundAmount: view.getBigUint64(0, true),
                    reason: data[8],
                },
                dataSize: 9,
            };

        case 5: // expire
            return {
                entryData: {
                    refundAmount: view.getBigUint64(0, true),
                    expirySlot: view.getBigUint64(8, true),
                },
                dataSize: 16,
            };

        default:
            throw new Error(`Unknown action type: ${actionType}`);
    }
}

// ============================================================================
// Helpers
// ============================================================================

function readU128(view: DataView, offset: number): bigint {
    const lo = view.getBigUint64(offset, true);
    const hi = view.getBigUint64(offset + 8, true);
    return lo | (hi << 64n);
}

function writeU128(view: DataView, offset: number, value: bigint): void {
    view.setBigUint64(offset, value & 0xffffffffffffffffn, true);
    view.setBigUint64(offset + 8, value >> 64n, true);
}

function pubkeyToAddress(bytes: Uint8Array): SolanaAddress {
    return Base58Util.encode(bytes) as SolanaAddress;
}

function addressToPubkey(address: SolanaAddress): Uint8Array {
    return Base58Util.decode(address);
}
