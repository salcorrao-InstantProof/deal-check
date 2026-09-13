# Customer pilot development notes

The first customer flow is a $59 pilot: buyer prepares a request, attaches
unsigned dealer paperwork in their email app, and Sonny returns a personal
review. Keep this a small static product. No accounts, backend, customer
database, automated verdicts, payment processing, or dealer negotiation.

- `index.html` is the self-contained customer page. Its `pilot-config` JSON is
  the only intake configuration. An empty destination or closed intake must
  disable the email action. Never invent contact details or claim email was sent.
- Do not put real customer records, documents, or private account details in
  this public repository. Use invented examples only.
- Keep the existing calculation source unchanged. Read its AGENTS.md
  before modifying the coach tool. This release preserves those files.
- The original project's browser-verification boundary remains in force:
  do not use alternate browser automation to bypass it. Node logic and syntax
  checks are not rendered-page or email-delivery evidence. Owner browser checks
  are documented in `MANUAL_CHECKS.md` and remain required.
- Do not claim that a lower payment is a saving, that an inferred rate proves
  markup, or that typed comparisons establish a market baseline. Sonny owns the
  final assessment. Do not promise a response deadline that he has not accepted.
- Do not add screens dependent on saved cases before the existing manual
  save/load verification gate has passed. The customer intake is independent
  of coach storage and does not persist form inputs.
- Never store customer details in URL queries. Use textContent for user text.
  Do not silently send messages or launch payment requests.

Run `node --test tests/intake.test.cjs` and `node test_logic.cjs` when
changing this flow. Keep tested behavior separate from unverified UI behavior.
