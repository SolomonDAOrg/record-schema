/**
 * @file FSM-00001_DEF-types.v1.ts
 * @description Type definitions for limit order state machine
 * @version 1
 * @record FSM-00001
 */

import type { SolanaAddress } from "@solomon-labs/types";

// ============================================================================
// State Types
// ============================================================================

export const OrderState = {
    Pending: 0,
    Open: 1,
    Partial: 2,
    Filled: 3,
    Cancelled: 4,
    Expired: 5,
} as const;

export type OrderState = typeof OrderState[keyof typeof OrderState];

export const OrderStateLabel: Readonly<Record<OrderState, string>> = {
    [OrderState.Pending]: "pending",
    [OrderState.Open]: "open",
    [OrderState.Partial]: "partial",
    [OrderState.Filled]: "filled",
    [OrderState.Cancelled]: "cancelled",
    [OrderState.Expired]: "expired",
};

export const TerminalStates: ReadonlySet<OrderState> = new Set([
    OrderState.Filled,
    OrderState.Cancelled,
    OrderState.Expired,
]);

// ============================================================================
// Event Types
// ============================================================================

export const OrderEvent = {
    Activate: 1,
    PartialFill: 2,
    Fill: 3,
    Cancel: 4,
    Expire: 5,
} as const;

export type OrderEvent = typeof OrderEvent[keyof typeof OrderEvent];

export const OrderEventLabel: Readonly<Record<OrderEvent, string>> = {
    [OrderEvent.Activate]: "activate",
    [OrderEvent.PartialFill]: "partial_fill",
    [OrderEvent.Fill]: "fill",
    [OrderEvent.Cancel]: "cancel",
    [OrderEvent.Expire]: "expire",
};

// ============================================================================
// Side Types
// ============================================================================

export const OrderSide = {
    Buy: 0,
    Sell: 1,
} as const;

export type OrderSide = typeof OrderSide[keyof typeof OrderSide];

// ============================================================================
// Cancel Reason
// ============================================================================

export const CancelReason = {
    UserInitiated: 0,
    Admin: 1,
    ProgramUpgrade: 2,
} as const;

export type CancelReason = typeof CancelReason[keyof typeof CancelReason];

// ============================================================================
// Order Data
// ============================================================================

export interface OrderData {
    readonly id: bigint;
    readonly owner: SolanaAddress;
    readonly pool: SolanaAddress;
    readonly state: OrderState;
    readonly side: OrderSide;
    readonly triggerPrice: bigint;
    readonly amountIn: bigint;
    readonly amountFilled: bigint;
    readonly amountOut: bigint;
    readonly minAmountOut: bigint;
    readonly createdSlot: bigint;
    readonly expirySlot: bigint;
    readonly lastUpdatedSlot: bigint;
    readonly fillCount: number;
}

// ============================================================================
// Event Payloads
// ============================================================================

export interface ActivatePayload {
    readonly event: typeof OrderEvent.Activate;
}

export interface PartialFillPayload {
    readonly event: typeof OrderEvent.PartialFill;
    readonly fillAmount: bigint;
    readonly fillPrice: bigint;
}

export interface FillPayload {
    readonly event: typeof OrderEvent.Fill;
    readonly fillAmount: bigint;
    readonly fillPrice: bigint;
}

export interface CancelPayload {
    readonly event: typeof OrderEvent.Cancel;
    readonly reason: CancelReason;
}

export interface ExpirePayload {
    readonly event: typeof OrderEvent.Expire;
}

export type EventPayload =
    | ActivatePayload
    | PartialFillPayload
    | FillPayload
    | CancelPayload
    | ExpirePayload;

// ============================================================================
// Transition Context
// ============================================================================

export interface TransitionContext {
    readonly signer: SolanaAddress;
    readonly currentSlot: bigint;
    readonly poolTwap: bigint;
}

// ============================================================================
// Transition Result
// ============================================================================

export interface TransitionSuccess {
    readonly success: true;
    readonly fromState: OrderState;
    readonly toState: OrderState;
    readonly event: OrderEvent;
    readonly updatedOrder: OrderData;
    readonly emittedEvent: EmittedEvent;
}

export interface TransitionFailure {
    readonly success: false;
    readonly fromState: OrderState;
    readonly event: OrderEvent;
    readonly guardFailure: string;
}

export type TransitionResult = TransitionSuccess | TransitionFailure;

// ============================================================================
// Emitted Events
// ============================================================================

export interface OrderActivatedEmit {
    readonly type: "OrderActivated";
    readonly orderId: bigint;
    readonly owner: SolanaAddress;
    readonly pool: SolanaAddress;
    readonly side: OrderSide;
    readonly triggerPrice: bigint;
    readonly amountIn: bigint;
    readonly expirySlot: bigint;
    readonly slot: bigint;
}

export interface OrderPartiallyFilledEmit {
    readonly type: "OrderPartiallyFilled";
    readonly orderId: bigint;
    readonly fillAmount: bigint;
    readonly fillPrice: bigint;
    readonly amountOut: bigint;
    readonly remaining: bigint;
    readonly fillCount: number;
    readonly slot: bigint;
}

export interface OrderFilledEmit {
    readonly type: "OrderFilled";
    readonly orderId: bigint;
    readonly totalAmountIn: bigint;
    readonly totalAmountOut: bigint;
    readonly avgFillPrice: bigint;
    readonly fillCount: number;
    readonly slot: bigint;
}

export interface OrderCancelledEmit {
    readonly type: "OrderCancelled";
    readonly orderId: bigint;
    readonly refundAmount: bigint;
    readonly reason: CancelReason;
    readonly slot: bigint;
}

export interface OrderExpiredEmit {
    readonly type: "OrderExpired";
    readonly orderId: bigint;
    readonly refundAmount: bigint;
    readonly expirySlot: bigint;
    readonly slot: bigint;
}

export type EmittedEvent =
    | OrderActivatedEmit
    | OrderPartiallyFilledEmit
    | OrderFilledEmit
    | OrderCancelledEmit
    | OrderExpiredEmit;
