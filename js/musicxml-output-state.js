export function hasManualOutputEdits({ latest, currentText, generatedText }) {
  return Boolean(latest && currentText !== generatedText);
}

export function confirmManualOutput({ latest, currentText, generatedText, message, confirm }) {
  if (!hasManualOutputEdits({ latest, currentText, generatedText })) return true;
  return confirm(message);
}
