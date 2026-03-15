import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {Table} from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {generateHTML} from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import {all, createLowlight} from "lowlight";

const lowlight = createLowlight(all);

export const editorExtensions = [
  StarterKit,
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
    protocols: ["https", "http", "mailto"],
  }),
  Placeholder.configure({
    placeholder: "Beginne deinen Essay...",
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Table.configure({
    resizable: false,
  }),
  TableRow,
  TableHeader,
  TableCell,
  Image.configure({
    inline: false,
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
];

export function getDefaultContentJson() {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
      },
    ],
  };
}

export function contentJsonToHtml(content: unknown): string {
  try {
    return generateHTML(content as Record<string, unknown>, editorExtensions);
  } catch {
    return "";
  }
}

export function extractTextFromContent(content: unknown): string {
  const walk = (node: unknown): string[] => {
    if (!node || typeof node !== "object") {
      return [];
    }

    const typed = node as {text?: string; content?: unknown[]};
    const own = typed.text ? [typed.text] : [];
    const children = (typed.content ?? []).flatMap((child) => walk(child));
    return [...own, ...children];
  };

  return walk(content).join(" ").replace(/\s+/g, " ").trim();
}
