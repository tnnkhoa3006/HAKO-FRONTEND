export function insertTextAtCursor(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  currentValue: string,
  text: string
) {
  const start = element?.selectionStart ?? currentValue.length;
  const end = element?.selectionEnd ?? currentValue.length;

  return {
    nextValue: `${currentValue.slice(0, start)}${text}${currentValue.slice(end)}`,
    cursorPosition: start + text.length,
  };
}

export function focusAndRestoreSelection(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  cursorPosition: number
) {
  requestAnimationFrame(() => {
    if (!element) return;
    element.focus();
    element.setSelectionRange(cursorPosition, cursorPosition);
  });
}
