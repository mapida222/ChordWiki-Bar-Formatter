# Mobile correction focus

User-approved design: while editing 03 on a narrow screen, keep the selected
row's converted result above the original correction textarea and symbol bar.
Digits use the OS keyboard; Done returns to the usual stacked editors.

## Scope and decisions

- Reuse the original textarea, input handlers, symbol handlers, Undo and converter.
- Keep the textarea in its original DOM parent. Only change its card's layout.
- Read the linked row and converted text through one notification from app.js.
- Use VisualViewport resize/scroll to fit the visible area. Do not persist this
  transient layout or modify the saved-data schema.
- Preserve desktop layout and zoom. Native keyboard/IME needs hardware testing.

## Steps

1. Add a focused DOM harness covering narrow focus, result refresh, viewport
   changes, completion, desktop and absent VisualViewport. Observe RED.
2. Add the display controller, minimal app notification, accessible markup and
   responsive CSS. Use existing symbol handlers, with secondary symbols tucked
   under Other. Keep native digit entry available for a-i via secondary buttons.
3. Run related tests, verify, build and real browser editing/Done checks. Record
   hardware coverage honestly. Review the complete diff and commit locally.

## Progress

- Read-only inspection: app.js owns editing and selection; applyLinkedPosition
  also runs after converted output changes. No persistence changes required.
- Implemented the display-only controller and existing-symbol integration.
- Review fixes: match line-number row heights; restrict numeric keyboard mode
  to narrow widths; defer fixed layout until the initial tap selects its row.
- Browser checks: 393px editing/result match, a-i symbol insertion, Undo, Done;
  320px with 360px available height uses a single symbol row to preserve results.
- Automated gate: 74 test files, syntax checks and production build passed.
- Hardware keyboard, IME and Safari viewport behavior remain unverified.
