/**
 * @file FSM-00001_DEF-machine.v1.ts
 * @description State machine implementation for limit orders
 * @version 1
 * @record FSM-00001
 */

import type { SolanaAddress } from "@solomon-labs/types";
import {
    OrderState,
    OrderEvent,
    OrderSide,
    TerminalStates,
    type OrderData,
    type EventPayload,
    type TransitionContext,
    type TransitionResult,
    type TransitionSuccess,
    type TransitionFailure,
} from "./FSM-00001_DEF-types.v1";

// ============================================================================
// Transition Table
// ============================================================================

type TransitionKey = `${OrderState}:${OrderEvent}`;

interface TransitionDef {
    readonly to: OrderState;
    readonly guard: (order: OrderData, payload: EventPayload, ctx: TransitionContext) => string | null;
}

const TRANSITIONS: Readonly<Record<TransitionKey, TransitionDef>> = {
    [`${OrderState.Pending}:${OrderEvent.Activate}`]: {
        to: OrderState.Open,
        guard: guardValidOrder,
    },
    [`${OrderState.Pending}:${OrderEvent.Cancel}`]: {
        to: OrderState.Cancelled,
        guard: guardIsOwner,
    },
    [`${OrderState.Open}:${OrderEvent.PartialFill}`]: {
        to: OrderState.Partial,
        guard: guardPartialFill,
    },
    [`${OrderState.Open}:${OrderEvent.Fill}`]: {
        to: OrderState.Filled,
        guard: guardFill,
    },
    [`${OrderState.Open}:${OrderEvent.Cancel}`]: {
        to: OrderState.Cancelled,
        guard: guardIsOwner,
    },
    [`${OrderState.Open}:${OrderEvent.Expire}`]: {
        to: OrderState.Expired,
        guard: guardExpired,
    },
    [`${OrderState.Partial}:${OrderEvent.PartialFill}`]: {
        to: OrderState.Partial,
        guard: guardPartialFill,
    },
    [`${OrderState.Partial}:${OrderEvent.Fill}`]: {
        to: OrderState.Filled,
        guard: guardFill,
    },
    [`${OrderState.Partial}:${OrderEvent.Cancel}`]: {
        to: OrderState.Cancelled,
        guard: guardIsOwner,
    },
    [`${OrderState.Partial}:${OrderEvent.Expire}`]: {
        to: OrderState.Expired,
        guard: guardExpired,
    },
};

// ============================================================================
// Guards
// ============================================================================

function guardValidOrder(
    order: OrderData,
    _payload: EventPayload,
    ctx: TransitionContext
): string | null {
    if (order.triggerPrice <= 0n) {
        return "invalid_trigger_price";
    }
    if (order.expirySlot <= ctx.currentSlot) {
        return "invalid_expiry";
    }
    return null;
}

function guardIsOwner(
    order: OrderData,
    _payload: EventPayload,
    ctx: TransitionContext
): string | null {
    if (ctx.signer !== order.owner) {
        return "not_owner";
    }
    return null;
}

function guardPartialFill(
    order: OrderData,
    payload: EventPayload,
    ctx: TransitionContext
): string | null {
    if (payload.event !== OrderEvent.PartialFill) {
        return "invalid_payload";
    }

    const priceCheck = checkPriceTrigger(order, ctx.poolTwap);
    if (priceCheck !== null) {
        return priceCheck;
    }

    const remaining = order.amountIn - order.amountFilled;
    if (payload.fillAmount <= 0n) {
        return "invalid_fill_amount";
    }
    if (payload.fillAmount >= remaining) {
        return "fill_amount_exceeds_remaining";
    }

    return null;
}

function guardFill(
    order: OrderData,
    payload: EventPayload,
    ctx: TransitionContext
): string | null {
    if (payload.event !== OrderEvent.Fill) {
        return "invalid_payload";
    }

    const priceCheck = checkPriceTrigger(order, ctx.poolTwap);
    if (priceCheck !== null) {
        return priceCheck;
    }

    const remaining = order.amountIn - order.amountFilled;
    if (payload.fillAmount !== remaining) {
        return "fill_amount_mismatch";
    }

    return null;
}

function guardExpired(
    order: OrderData,
    _payload: EventPayload,
    ctx: TransitionContext
): string | null {
    if (ctx.currentSlot <= order.expirySlot) {
        return "not_expired";
    }
    return null;
}

function checkPriceTrigger(order: OrderData, poolTwap: bigint): string | null {
    if (order.side === OrderSide.Buy) {
        if (poolTwap > order.triggerPrice) {
            return "price_not_triggered";
        }
    } else {
        if (poolTwap < order.triggerPrice) {
            return "price_not_triggered";
        }
    }
    return null;
}

// ============================================================================
// State Machine
// ============================================================================

export interface OrderStateMachine {
    readonly canTransition: (order: OrderData, event: OrderEvent) => boolean;
    readonly getValidEvents: (order: OrderData) => readonly OrderEvent[];
    readonly transition: (
        order: OrderData,
        payload: EventPayload,
        ctx: TransitionContext
    ) => TransitionResult;
    readonly isTerminal: (state: OrderState) => boolean;
}

export function createOrderStateMachine(): OrderStateMachine {
    return {
        canTransition(order: OrderData, event: OrderEvent): boolean {
            const key: TransitionKey = `${order.state}:${event}`;
            return key in TRANSITIONS;
        },

        getValidEvents(order: OrderData): readonly OrderEvent[] {
            const events: OrderEvent[] = [];
            for (const e of Object.values(OrderEvent)) {
                if (typeof e === "number") {
                    const key: TransitionKey = `${order.state}:${e}`;
                    if (key in TRANSITIONS) {
                        events.push(e);
                    }
                }
            }
            return events;
        },

        transition(
            order: OrderData,
            payload: EventPayload,
            ctx: TransitionContext
        ): TransitionResult {
            const event = payload.event;
            const key: TransitionKey = `${order.state}:${event}`;
            const def = TRANSITIONS[key];

            if (def === undefined) {
                return {
                    success: false,
                    fromState: order.state,
                    event,
                    guardFailure: "invalid_transition",
                } satisfies TransitionFailure;
            }

            const guardResult = def.guard(order, payload, ctx);
            if (guardResult !== null) {
                return {
                    success: false,
                    fromState: order.state,
                    event,
                    guardFailure: guardResult,
                } satisfies TransitionFailure;
            }

            const updatedOrder = applyTransition(order, payload, def.to, ctx);
            const emittedEvent = buildEmittedEvent(order, updatedOrder, payload, ctx);

            return {
                success: true,
                fromState: order.state,
                toState: def.to,
                event,
                updatedOrder,
                emittedEvent,
            } satisfies TransitionSuccess;
        },

        isTerminal(state: OrderState): boolean {
            return TerminalStates.has(state);
        },
    };
}

// ============================================================================
// State Application
// ============================================================================

function applyTransition(
    order: OrderData,
    payload: EventPayload,
    toState: OrderState,
    ctx: TransitionContext
): OrderData {
    const base = {
        ...order,
        state: toState,
        lastUpdatedSlot: ctx.currentSlot,
    };

    switch (payload.event) {
        case OrderEvent.PartialFill:
        case OrderEvent.Fill: {
            const newFilled = order.amountFilled + payload.fillAmount;
            const newOut = order.amountOut + computeAmountOut(payload.fillAmount, payload.fillPrice);
            return {
                ...base,
                amountFilled: newFilled,
                amountOut: newOut,
                fillCount: order.fillCount + 1,
            };
        }
        default:
            return base;
    }
}

function computeAmountOut(fillAmount: bigint, fillPrice: bigint): bigint {
    // Q64.64 fixed point multiplication
    return (fillAmount * fillPrice) >> 64n;
}

function buildEmittedEvent(
    _oldOrder: OrderData,
    newOrder: OrderData,
    payload: EventPayload,
    ctx: TransitionContext
): TransitionSuccess["emittedEvent"] {
    switch (payload.event) {
        case OrderEvent.Activate:
            return {
                type: "OrderActivated",
                orderId: newOrder.id,
                owner: newOrder.owner,
                pool: newOrder.pool,
                side: newOrder.side,
                triggerPrice: newOrder.triggerPrice,
                amountIn: newOrder.amountIn,
                expirySlot: newOrder.expirySlot,
                slot: ctx.currentSlot,
            };

        case OrderEvent.PartialFill:
            return {
                type: "OrderPartiallyFilled",
                orderId: newOrder.id,
                fillAmount: payload.fillAmount,
                fillPrice: payload.fillPrice,
                amountOut: computeAmountOut(payload.fillAmount, payload.fillPrice),
                remaining: newOrder.amountIn - newOrder.amountFilled,
                fillCount: newOrder.fillCount,
                slot: ctx.currentSlot,
            };

        case OrderEvent.Fill:
            return {
                type: "OrderFilled",
                orderId: newOrder.id,
                totalAmountIn: newOrder.amountIn,
                totalAmountOut: newOrder.amountOut,
                avgFillPrice: newOrder.amountIn > 0n
                    ? (newOrder.amountOut << 64n) / newOrder.amountIn
                    : 0n,
                fillCount: newOrder.fillCount,
                slot: ctx.currentSlot,
            };

        case OrderEvent.Cancel:
            return {
                type: "OrderCancelled",
                orderId: newOrder.id,
                refundAmount: newOrder.amountIn - newOrder.amountFilled,
                reason: payload.reason,
                slot: ctx.currentSlot,
            };

        case OrderEvent.Expire:
            return {
                type: "OrderExpired",
                orderId: newOrder.id,
                refundAmount: newOrder.amountIn - newOrder.amountFilled,
                expirySlot: newOrder.expirySlot,
                slot: ctx.currentSlot,
            };
    }
}
