# Owner browser checks — NOT RUN

The existing project requires owner browser verification over HTTP. Node tests
do not satisfy this requirement. Use invented data; do not put customer files
or their contents in this repository. These checks are for the built flow,
not a request to design it.

## Customer request

1. Serve the folder as described in PILOT.md. Open the HTTP address on desktop,
   then on an iPhone using an appropriate HTTP-served host. Inspect at a narrow
   phone width: readable type, no horizontal overflow, visible labels/buttons.
2. In the default closed configuration, check the intake-not-open notice.
   Prepare a request with `Avery`, `avery@example.com`, `2022 Example sedan`,
   `WI`, `Financing`, `Tomorrow afternoon`, and `Please explain the package
   price.` Confirm the unsigned/covered-documents checkbox. Verify the summary
   and message show the exact entered data, the $59 fee, and a reference.
3. The email action must remain disabled. Copy and Download text should work
   or show their truthful fallback. They must not claim sending. Check the
   downloaded text contains answers and no attachment.
4. Edit the answers. Change the concern, prepare again, and confirm the latest
   text is in both the summary and message. Clear answers; all fields and
   prepared text should clear. Try missing fields, invalid email, and an
   unchecked confirmation; none should advance to handoff.
5. Configure the approved inbox and set `acceptingRequests` to `true`. Reload.
   The notice should disappear and the email destination should match exactly.
   Prepare the invented request and tap Open email. Confirm the mail app's To,
   subject, complete body, and that no attachment was added automatically.
6. Attach an invented redacted quote manually in the email app. If the owner
   chooses to send this test to the configured inbox, verify actual arrival
   and readable attachments there. Record receipt evidence privately. The page
   must continue to avoid any claim of sent/received status.
7. Repeat the mail-app check on iPhone. Test a long permitted concern with
   punctuation and line breaks. If the device truncates a mailto body or cannot
   open email, the visible prepared text must remain usable with Copy request.
8. Keyboard-check labels, selection controls, submit, focus on the handoff
   title, Edit, and Clear. Check screen-reader status announcements.
9. Refresh after entering invented data. No site-managed draft should restore.
   Native browser autofill is separate from the page's data handling.

## Existing coach tool

Follow `README.md`'s exact HTTP save/read/reload/load comparison and
constructed example. This gate remains NOT RUN. Do not add saved-case-dependent
screens until verified. The customer page does not use coach storage.

## Record observed evidence

Record date, device/browser, actual result, and any failure privately. Do not
replace “NOT RUN” with “PASS” from inspecting code or running Node tests.
Payment collection, actual personal review delivery, and customer usefulness
are separate real-world pilot observations.
