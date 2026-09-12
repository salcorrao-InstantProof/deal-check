# Deal Check project

The app is the single, self-contained `deal_check.html` file. It has no runtime
dependencies, accounts, server API, install step, or build step. The remaining
files document the project and provide an optional Node calculation test.

Read `AGENTS.md` before changing code.

## Actual status

- Intake and Deal Check UI, coach notes, and browser-only save/load are written.
- Browser rendering and persistence are unverified. No browser tests ran.
- Case list, three-document generation, and social card are not built.
- Payment/APR/amortization and savings calculation source is unchanged.
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
```

The command executes the HTML's own calculation script, checks its locked
source fingerprint, runs the eight existing cases plus tolerance guards, and
captures the inputs and actual report text in `LOGIC_TEST_OUTPUT.txt`.
It only syntax-checks the UI script. It does not execute UI event handlers,
emulate localStorage, or count as browser verification.

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
