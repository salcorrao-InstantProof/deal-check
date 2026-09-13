# Deal Check — $59 personal-review pilot

One customer job: send an unsigned car deal to Sonny and receive a written
personal review with specific findings, questions, and a next move.

The first release has a phone-friendly, self-contained `index.html`. It prepares
an email request; the buyer attaches paperwork in their own email app and sends
it. Sonny confirms availability and payment personally. No website upload,
checkout, receipt confirmation, accounts, or backend is implied.

## What is built

- $59 offer, scope, a clearly fictional review example, and the next steps.
- Short intake: first name, reply email, vehicle, state, cash/finance/undecided,
  requested timing, and the buyer's question. The buyer confirms an unsigned
  purchase and covered sensitive details.
- Readable request summary, addressed email handoff when configured, copy and
  text-download fallbacks, editing, and clearing answers.
- Email remains disabled when intake is closed or its address is invalid.
  Preparing a request is never labeled sent or received.
- Existing calculator preserved byte-for-byte at `deal_check.html`. Its eight-case
  calculation regression and source lock remain in place. This customer flow
  does not depend on its unverified browser storage.

## Run

No install or build is required. From this directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` on that computer. The coach tool is at
`http://127.0.0.1:8000/deal_check.html`.

This command is for owner verification, not evidence that a browser test ran.
Any conventional static host can serve the files. No deployment is included.

## Open intake

In `index.html`, find the `pilot-config` JSON:

```json
{"intakeEmail":"","acceptingRequests":false}
```

Insert Sonny's chosen customer-facing inbox, then set `acceptingRequests` to
`true` after the checks in `MANUAL_CHECKS.md`. Never use an unrelated private
email address without his instruction. No intake address was available at build
time, so the committed version deliberately says intake is not open.

The payment step stays personal: quote the agreed $59 fee and provide the
owner's payment method after accepting the request. This release does not
pretend to take or verify payment. Do not collect payment-card details by email.

## Deliver the first review

1. Buyer prepares the request, adds readable redacted paperwork in email, and
   sends it. The site cannot see whether the mail client opened or email arrived.
2. Sonny checks the actual inbox, confirms receipt, verifies the scope is an
   unsigned cash/financed purchase he can handle, and agrees the delivery time.
   Missing pages or unfamiliar jurisdiction-specific questions get clarified
   before accepting payment. Do not promise instant coverage or a timer.
3. Sonny provides his payment method and checks the actual payment record.
4. Review the supplied quote directly. Use the unchanged coach calculator only
   when comparing **two actual** sheets. Do not invent a revised sheet or a
   market baseline just to fill in the comparison. Record $59 as the coaching
   fee only when it was actually paid.
5. Reply personally with a short written review. Use the outline below. Keep
   findings tied to document/page/line and distinguish missing information from
   proven errors. The existing calculator can support a two-sheet comparison;
   its copied report does **not** include the separate coach-notes field.
6. Include one revised-sheet check for the same deal. Ask what the buyer did
   next and whether the review helped. Keep customer correspondence and
   payment records in the existing private tools, never in this public repo.

### Written review outline (filled in personally)

- **Deal reviewed:** vehicle; documents and versions/pages actually received.
- **My recommendation:** what to do next, with the reason.
- **Findings:** for each relevant KEEP / CUT / REPRICE / VERIFY / WALK, identify
  the actual document line, what it shows, why it matters, and the next action.
  Do not force all five labels onto every deal.
- **What to say:** one concise question or request the buyer can use.
- **What remains unknown:** missing pages, itemization, or external verification.
- **Recheck:** reply with the revised sheet for this same deal.

This is an operator outline, not a generated document system or an automated
verdict. Existing coach save/load, case-list, and three-document gates are not
bypassed by this independent manual workflow.

## Verification and limits

```sh
node --test tests/intake.test.cjs
node test_logic.cjs
```

See `VALIDATION.md` for actual results and `MANUAL_CHECKS.md` for the browser
handoff. Node tests cover request validation, closed-intake behavior, encoded
email payloads, source integrity, and JavaScript syntax. They do not execute UI
events or prove rendering, copy/download, mail-app behavior, delivery, payment,
or browser save/load.

The original project's instruction restricts browser verification to the owner;
no alternate browser automation was used. The existing `README.md` and
`AGENTS.md` retain their historical status and restrictions.

## Why this is small

The buyer supplies documents rather than retyping loan figures. Sonny's review
is the product. Email handles the exchange; the calculator supports the work.
There are no speculative platforms, dealer integrations, automated valuations,
or claims of guaranteed savings. One completed paid review is the first useful
operating result to measure: fee actually received, review delivered, minutes
spent, revision work, and the buyer's reported usefulness.
