import {marked} from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const sanitizeConfig: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "em",
    "strong",
    "hr",
    "br",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "loading"],
    th: ["colspan", "rowspan", "align"],
    td: ["colspan", "rowspan", "align"],
    code: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "data"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {rel: "noopener noreferrer", target: "_blank"}),
    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        loading: "lazy",
      },
    }),
  },
};

export function markdownToHtml(markdown: string) {
  const parsed = marked.parse(markdown || "");
  const rawHtml = typeof parsed === "string" ? parsed : "";
  return sanitizeHtml(rawHtml, sanitizeConfig);
}

export function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6})\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[\*_~]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function storedContentToMarkdown(contentJson: unknown, contentHtml?: string | null) {
  if (typeof contentJson === "string") {
    return contentJson;
  }

  if (contentJson && typeof contentJson === "object") {
    const maybe = contentJson as {markdown?: unknown};
    if (typeof maybe.markdown === "string") {
      return maybe.markdown;
    }
  }

  if (!contentHtml) {
    return "";
  }

  return contentHtml
    .replace(/<br\s*\/?>(\n)?/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
