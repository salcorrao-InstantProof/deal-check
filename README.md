# Deal Check project

The app is the single, self-contained `deal_check.html` file. It has no runtime
dependencies, accounts, server API, install step, or build step. The remaining
files document the project and provide an optional Node calculation test.

Read `AGENTS.md` before changing code.

## Actual status

- Intake and Deal Check UI, coach notes, and browser-only save/load are written.
- Browser rendering and persistence are unverified. No browser tests ran.
- Case list, three-document generation, and social card are not built.
- The original payment/APR/amortization and reconciliation source is unchanged.
  The additions described below provide a separate timing adapter, itemized fee inputs and manual LTV.
- The owner-authorized payment-attribution test tolerance is one cent. The
  remaining residual is printed with eight decimal places and is also included
  in the UI output code. The $5 amount-financed threshold and $2 payment flag
  threshold are unchanged.
- The baseline market-price source is unresolved. Current savings figures
  compare the two entered sheets; they do not prove a market baseline or that
  coaching caused a saving.

## Repeat the logic checks

From this folder, on a machine with Node:

```sh
node test_logic.cjs --capture
node test_additions.cjs --capture
```

The command executes the HTML's own calculation script, checks its locked
source fingerprint, runs the original eight cases plus the ninth zero-APR deferral case and tolerance guards, and
captures the inputs and actual report text in `LOGIC_TEST_OUTPUT.txt`.
It only syntax-checks the UI script. It does not execute UI event handlers,
emulate localStorage, or count as browser verification.

## September 12 additions — verified calculation output

```
Locked calculation source unchanged: PASS
9/9 required cases passed
40/40 additions checks passed
Browser/UI execution and save/load persistence: NOT RUN
```

The SHA-256 of the original calculation source remains
`d81a964579480019dddd7948c73fb512eaa04d157d3c2d9568243f4b8a307ee9`.
The first eight cases and existing one-cent attribution, $5 financing stop and
$2 printed-payment flag thresholds are unchanged. The ninth required case
checks 0% APR with First at 30 days and New at 120: payment is exactly unchanged,
interest is zero, and no monetary saving is invented.

### First-payment timing

Each sheet defaults to Loan, with 30 days to first payment. Whole days 30–120
are accepted. Blank, fractional or out-of-range values block the timing estimate
instead of falling back to 30. Selecting Lease disables the days input and
suppresses loan payment, implied APR and interest projections. It preserves the
entered days for switching back to Loan. This is not a new lease calculator.

The original 30-day payment function is untouched. A separate adapter applies
an odd-first-period factor to that function and uses the same factor when
back-solving implied APR. For this days-only estimate, one month is 30 days:

- `r = APR / 1200`, `t = floor(days / 30)`, `f = (days % 30) / 30`.
- Timing factor: `(1 + f*r) * (1+r)^(t-1)`.
- Adjusted payment: original payment times timing factor.
- Extra pre-amortization interest: principal times (timing factor minus one).
- Total projected interest: all adjusted payments minus principal.
- Remaining interest from financing the deferral is shown separately too.

Both interest components are already inside total interest and payment totals;
they are never added again. This replaces the earlier flat actual/365 add-on,
which could not price the requested payment reduction or correctly back-solve
an APR for this deferred schedule. The adapter follows Appendix J's whole-period
and fractional-period form, but days alone cannot reproduce every actual
calendar schedule. Actual dates, finance-charge classification, final payments,
and lender accrual terms are needed for a contract-level APR determination.
Nothing in this app certifies a legal violation or changes a signed contract.

The requested coach warning begins above 45 days. The app expressly distinguishes
that from §1026.17(c)(4)(ii): for terms of at least one year but less than ten,
up to 21 extra first-period days can be disregarded (51 with a 30-day regular
period). The warning states that this exception cannot be used only when those
term conditions are met and the extra interval exceeds 21 days.

Timing-change cost/savings holds the New sheet's principal, APR and term fixed.
An Available room line estimates moving New's first payment back to 30 days.
This proposed saving is not added to Scorecard savings. Payment attribution
adds timing after itemized amounts, APR and term, with the existing residual
check retained. Printed payments and financing are never overwritten.

References:
- https://www.consumerfinance.gov/rules-policy/regulations/1026/17/
- https://www.consumerfinance.gov/rules-policy/regulations/1026/j/

### Calculated financing and the Calculate buttons

Each calculator adds selling price, dealer add-ons, products, dealer fee, tax,
title/plate, license and registration fees; subtracts rebates, money down and
positive trade equity; and adds negative equity. Trade equity is allowance less
payoff. Combined title/license/registration fees must be entered only once.
Separate license and registration default to zero for older records.

Calculated financing sits beside the editable printed amount. The signed
printed-minus-calculated difference remains visible even for a one-cent
mismatch; the existing $5 comparison stop is unchanged. Missing fields remain
unknown. Each Calculate button can estimate payment and interest from itemized
financing without a printed principal or payment. The comparison model uses
printed principal and continues to flag reconciliation differences.

### Standalone LTV

The separate LTV section takes two manually entered dollar amounts and one of:
NADA trade, NADA retail, KBB clean trade, KBB retail. Output is financing divided
by the selected book value times 100. It permits LTV above 100%, requires book
value greater than zero, and rejects malformed inputs. It has no lookup,
network call, automatic sheet linkage or case-storage dependency.

### Manual browser checks — required, not run

Use the HTTP-served app described below. Do not treat Node assertions or a
file preview as browser/persistence verification.

1. Load case 1. Both days inputs should show 30 and both type selectors Loan.
   Press each Calculate button; First should show $25,300 financing, $476.28
   estimated payment and $3,277.04 projected interest.
2. Set New's term to 60, days to 90 and printed payment to $480.18. Calculate
   and compare. New should show $207.04 extra pre-amortization interest,
   $26.81 interest from financing that deferral, $3,510.89 total interest,
   and approximately 4.90% implied APR with no printed-payment mismatch.
   Available room should propose 90 → 30, $3.90/mo and $233.85 projected
   interest saving. The proposal must not be added to Scorecard savings.
3. Test 45, 46, 51, 52 and 120 days. Warning starts at 46. For a 60-month term,
   46–51 must not be labeled outside the 21-extra-day exception. Test blank,
   29, 121 and fractional days for visible validation and unknown projections.
4. Load case 9 and press Run Deal Check. Payment must be unchanged at 0% APR,
   all interest zero, and proposed monetary timing savings zero.
5. Select Lease on either sheet. Its days field must disable and loan estimates
   must be unavailable. Switch back to Loan and check the saved days return.
6. Change only printed financing to $25,500. Calculated financing stays $25,300
   with +$200 difference, without rewriting either field. Add $75 license and
   $125 registration to make the itemized financing $25,500.
7. Enter LTV financing $25,000 and book value $20,000. Each of the four books
   should show 125.00% with the chosen book label. Test $0/missing/negative
   book values; no Infinity or stale result should remain. Deal sheets must
   remain unchanged.
8. Save First as Loan/45 and New as Lease/120, reload on the same HTTP origin,
   and load. Check both types, days, notes and separate fees. Switch New to Loan
   to see 120 return. Load an older record to check Loan/30 defaults. Test
   Copy First into New and Clear inputs. These steps verify actual persistence;
   the Node suite only verifies record shapes and JSON round trips.
9. Compare, copy and print a report. Verify timing costs, available room,
   financing mismatches and the first-payment review survive in the output.

## Owner's manual browser check — not run by the agent

Use an HTTP-served copy. Do not use a downloaded-file preview or file URL as
persistence evidence. If someone is serving the folder from a computer with
Python, this is a manual command for that computer, not a command the agent ran:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory /path/to/deal-check
```

On the same computer, open `http://localhost:8000/deal_check.html`. On a phone
on the same network, use that computer's local IP address in place of localhost.
Use only the invented example below. There is no hosted app URL in this delivery.

1. Enter case ID `case-example-001`, buyer/case name `Avery Example`, vehicle
   `Example sedan`, pre-approval APR `4.9%`, coaching fee `0`, and coach notes
   `Invented example. Check the title-fee increase.` Enter both sheets by hand:

   | Field | First | New |
   |---|---|---|
   | Selling price | $30,000 | $30,000 |
   | Dealer add-ons | None shown — confirmed $0 | None shown — confirmed $0 |
   | Service fee | $500 | $500 |
   | Tax | $1,500 | $1,500 |
   | Title/plate fees | $300 | $450 |
   | Rebates | $0 | $0 |
   | Trade allowance | $10,000 | $10,000 |
   | Trade payoff | $5,000 | $5,000 |
   | Cash down | $2,000 | $2,000 |
   | Amount financed | $25,300 | $25,450 |
   | APR | 4.9% | 4.9% |
   | Term | 60 mo | 60 mo |
   | Payment | $476.28 | $479.11 |
   | Products | None shown — confirmed $0 | None shown — confirmed $0 |
   | State | WI | WI |

   Tap Save case. Record the actual status message. Stop and report an error if
   it does not confirm saving.
2. Copy the entire Exact saved record text, which comes from the storage read
   immediately following the save. Record the storage key as well.
3. Reload the same HTTP URL in the same browser. Enter `case-example-001` and
   tap Load saved case. Copy Exact saved record again. Compare it with step 2
   byte for byte; also check every reloaded field and the notes.
4. Tap Run Deal Check. Copy or photograph the actual result. Expected from the
   Node fixture, not yet observed in a browser: title fees increase $150,
   expected financing is $25,300 / $25,450, cash savings are -$150, projected
   interest savings are -$19.43, and net is -$169.43 with no coaching fee.
   Buyer line: "Plate and title went up $150.00. Why?"

Save cases on the same HTTP origin (scheme, host, and port). Browser-data
clearing can remove them. Moving between devices is not implemented.
The storage prefix is generic. Loading also recognizes a single older
namespaced record for the same ID; that compatibility path is unverified.
No older record is automatically deleted or rewritten.

Do not build a dependent screen until the owner supplies successful browser
save/load evidence.
