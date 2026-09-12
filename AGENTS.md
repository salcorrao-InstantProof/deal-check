# PROJECT RULES

Read this file at the start of every session before writing any code.

This is a car-buying coaching tool. It is not a legal, court, or case-management
product. Any schema element involving court dates, bail, or criminal matters was
introduced by mistake and must be rejected.

## Standing rules

1. Calculation code is locked. Do not modify the payment/APR/amortization math
   unless explicitly told to. It is the core of the product.
2. No real customer names anywhere — not in filenames, variable names, seed
   data, test fixtures, or comments. Invent names.
3. Verify in a real browser, served over HTTP. Never test persistence from a
   file URL. Such a test is not accepted as browser verification for this project.
4. Never substitute a shim for a browser test. A Node localStorage stand-in is
   not browser verification. Say the test did not run.
5. Report blocks; do not work around them. If a tool, policy, or permission
   blocks a step, name it plainly and stop. Do not reach for an alternate tool to
   accomplish something a policy just refused.
6. Never weaken a test to make it pass. If a test fails, say so.
7. Stop when told to stop. Do not continue building in the same turn as a
   requested review.
8. Show real output, not descriptions. Pasted terminal output, pasted stored
   records, or a screenshot is evidence; "the screen works" is not.

## Known environment limit

The agent's Browser Use tool is blocked by URL policy from local addresses,
including localhost, 127.0.0.1, and local files. Its instructions prohibit using
an alternate browser to accomplish a blocked action. Playwright/Puppeteer
workarounds are off the table.

The agent cannot verify anything that requires a rendered page. Browser
verification is done manually by the project owner. Do not retry this boundary.
Write code, run calculation logic tests in Node, and hand off browser checks
with clear manual steps. Never label Node checks as browser verification.

## Screen status supplied by the owner

| Screen | Actual state | Remaining |
|---|---|---|
| Case list | Not built | Saved cases, case IDs, list rendering |
| Intake | HTML and event handlers written; rendering untested | Browser execution with records; saved-case integration |
| Deal Check | Calculation code executed; screen rendering untested | Three failing tests; coach notes field |
| Three documents | Not built | Game Plan, Deal Check, Scorecard — generated from saved cases |
| Name-free social card | Not built | — |

Persistence — case ID, coach notes, localStorage save/load over the existing
First/New snapshots and calculation context — is written but unverified.
The notes input is already present in Intake; its browser behavior is unverified.

## Regression suite at handoff: 5/8 passing

1. Term switch only, 60 → 72 — FAIL (rounding residual).
2. Trade +$1,000 and price increase — PASS.
3. GAP added, APR down a quarter point — FAIL (rounding residual).
4. Trade payoff missing — PASS.
5. Stated 4.9%, payment implies a higher rate — PASS.
6. Extra $2,000 down lowers payment — FAIL (rounding residual).
7. Title fees increase $150 — PASS.
8. Every field uses messy input formatting — PASS.

The owner authorizes a one-cent payment-attribution reconciliation tolerance,
with the residual displayed. Do not change payment/APR/amortization math to fix
these failures. The reported unallocated residuals were $0.0017, $0.0034, and
$0.0009 for tests 1, 3, and 6. A genuinely larger gap must remain visible and fail
the attribution check. This tolerance does not replace the separate $5
amount-financed reconciliation threshold or $2 printed-payment flag threshold.

Keep later test output separate from this initial handoff status. Do not infer
browser readiness from a passing calculation suite.

## Data model notes

Deal inputs exist as first/* and new/* snapshots. Money fields parse from
strings to integer cents or null; APR parses to a percentage number or null.
Fields include price, serviceFee, tax, titleFees, rebates, trade, payoff, down,
financed, apr, payment, and addons[].price.

Savings must be provable: they are the central claim of the service. Baseline
price needs a defined source, not a number typed in by hand. Track cash savings
and projected interest savings separately, net of the service fee. Baseline
source design remains an owner decision; do not silently invent a source or
change the locked savings calculation.

## Build order

Engine → persistence → case list → documents → social card.

Do not build a screen that depends on saved cases until save/load is verified
working in a browser.

## Cleanup

Use generic filenames. The app entry point is deal_check.html. Update active
references when renaming; use no real customer names in project artifacts.

## Open questions for the owner

- Before building the case list, decide whether cases need to survive browser
  data clearing or move between devices. localStorage is acceptable for now.
- Define the source of the baseline price used for savings claims.
