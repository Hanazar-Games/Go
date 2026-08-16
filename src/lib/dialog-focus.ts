import type { KeyboardEvent } from "react";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function trapDialogFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    (element) => !element.hidden,
  );
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}
