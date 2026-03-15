const LEGACY_UPLOAD_PREFIX = "/uploads/";
const API_MEDIA_PREFIX = "/api/media/";

function extractFilename(value: string) {
  const withoutQuery = value.split("?")[0]?.split("#")[0] ?? "";
  const segments = withoutQuery.split("/").filter(Boolean);
  const filename = segments.at(-1);
  return filename ? decodeURIComponent(filename) : "";
}

export function toMediaPath(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith(API_MEDIA_PREFIX)) {
    return trimmed;
  }

  if (trimmed.startsWith(LEGACY_UPLOAD_PREFIX)) {
    const filename = extractFilename(trimmed);
    if (!filename) return trimmed;
    return `${API_MEDIA_PREFIX}${encodeURIComponent(filename)}`;
  }

  return trimmed;
}

export function rewriteLegacyUploadPathsInHtml(html: string) {
  if (!html.includes(LEGACY_UPLOAD_PREFIX)) {
    return html;
  }

  return html.replace(/(src=["'])\/uploads\/([^"']+)(["'])/g, (_match, start, filename, end) => {
    return `${start}${toMediaPath(`/uploads/${filename}`)}${end}`;
  });
}
