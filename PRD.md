# Relay Desk — product brief

## Problem / user
A finance or support operator sees a paid invoice in one system and an unpaid balance in another. A generic “retry” button hides why the records disagree. The operator needs an explanation and a traceable next step.

## Outcome
Help an operator choose an appropriate action without double-counting a payment or treating an approval as a resolution. Initial validation measures decision correctness, time to explain a discrepancy and confidence calibration. These are proposed measures, not observed outcomes.

## Scope and acceptance criteria
- Matching event IDs count once; conflicting IDs and currency mismatches require escalation.
- Failed attempts cannot erase successful evidence. Events can arrive out of order.
- Configurable 24/48/72h grace periods determine when a payment-to-accounting gap becomes overdue.
- Partial balances stay visible. Distinct successful events exceeding an invoice are investigated.
- Viewer can inspect; Operator needs a rationale of at least 12 characters to record an action.
- Approval never modifies payment records or silently resolves the exception.
- Import rejects invalid structures and files above 1MB; exports include orphan events and decisions.

## Options considered
1. Automatic retries: fast, but premature for conflicts and unknown provider semantics.
2. A static dashboard: clear counts, but no path from diagnosis to accountable action.
3. Evidence queue with approval: chosen to make the failure understandable before proposing recovery.

## Delivery plan
Prototype: current local rules, queue and export. Next: five usability sessions and revised language. After validation: one sandbox provider adapter, authenticated server roles, durable audit, simulated failure injection. Production expansion is gated on safe retry behavior and reconciled transaction identity.

## Guardrails
No double counted event IDs; no state transition from paid to failed because of a late failure; no currency conversion implied; no client role presented as production authorization. Count false escalations and missed financial discrepancies separately.

## Tradeoffs and next changes
A fixed clock makes evaluation reproducible but is not live operations. A configurable grace threshold demonstrates a policy decision; it is not a provider SLA. Event-ID deduplication is necessary but not sufficient for business-level idempotency. Production needs canonical payment IDs and provider-specific status resolution.
