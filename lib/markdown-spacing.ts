const WINDOWS_NEWLINE = /\r\n/g;
const EXTRA_NEWLINES = /\n{3,}/g;

export function withVisibleBlankLines(markdown: string) {
  const normalized = (markdown || "").replace(WINDOWS_NEWLINE, "\n");

  return normalized.replace(EXTRA_NEWLINES, (sequence) => {
    const extraBlankLines = Math.max(0, sequence.length - 2);
    const spacerBreaks = Array.from(
      {length: extraBlankLines},
      () => '<br data-spacer="true" />\n'
    ).join("");

    return `\n\n${spacerBreaks}`;
  });
}

