# Relay Desk
### Payment operations, with the evidence attached.

An independent product prototype by **Pooja Hegde**. Investigate mismatches between invoices, successful payment events and accounting records. Review the source events, choose the next step and export a decision trail.

## Try it

Run `python3 -m http.server 8080` in this folder, then open `http://localhost:8080`.

1. Select **Cedar Workshop**: payment arrived but accounting is overdue.
2. Change sync grace from **24 to 72 hours**. The recommendation changes from Request sync to Monitor.
3. Select **Common Ground**: a currency mismatch requires escalation.
4. Switch to **Viewer**. Approval is disabled. Switch to Operator, add a rationale, then record a simulated approval.
5. Export the review. The exception remains open until new source evidence resolves it.

## What is implemented

- Seven synthetic invoice scenarios and a deterministic reconciliation engine.
- Event-ID deduplication; conflicting payload detection; partial/overpayments; currency and accounting mismatches; configurable sync grace.
- Search, filters, JSON import with validation and limits, source timeline, simulated role permissions, reasoned approvals, JSON export.
- Fifteen automated tests covering adverse and boundary behavior.
- Responsive, keyboard-accessible interface using vanilla HTML/CSS/JavaScript. No build step, dependencies, telemetry or API keys.

Run tests: `node --test test.js` (Node 18+).

## Product judgment

The core choice is **evidence first, human approval for consequential next steps**. Auto-retrying every mismatch could duplicate a write. Requiring review for every invoice would burden operations. The prototype automates classification and keeps ambiguous or overdue items visible.

Read [PRD](PRD.md), [research plan](RESEARCH.md) and [sample data](sample.json).

## Architecture and limits

`engine.js` is a pure rules module shared by browser and Node tests; `app.js` handles interface state. Monetary values are integer cents. Evaluation uses a fixed clock for reproducibility. Identical event IDs count once; distinct IDs are not assumed to be unique business transactions.

All names and amounts are synthetic. This is not connected to Method, Stripe or QuickBooks, and does not implement their API contracts. Client-side roles illustrate a product requirement, not a security boundary. No payments, refunds or sync requests are sent. Session decisions reset on reload. Import is local to the browser; do not use sensitive production exports.

A production version needs authenticated server-side permissions, provider-specific signatures and transaction identity, durable audit storage, decimal handling for currencies without two minor units, signed webhooks, idempotent workers, observability and legal/security review. Current support is for currencies represented with two decimal minor units. Refunds, disputes, FX, credits and multiple accounting sources are out of scope.

## Evidence

15 automated checks passed at initial release. No real-user study or business lift has been measured. The research plan defines how to collect that next.
