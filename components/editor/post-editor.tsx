"use client";

import {marked} from "marked";
import {CheckCircle2, Eye, Heading2, Heading3, ImageUp, Italic, Link2, List, ListOrdered, Quote, Settings, Split, Trash2, Undo2} from "lucide-react";
import Image from "next/image";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Link, useRouter} from "@/i18n/navigation";

type Option = {id: string; name: string};

type PostEditorProps = {
  id: string;
  locale: "de" | "en";
  initial: {
    title: string;
    slug: string;
    excerpt: string;
    contentMarkdown: string;
    categoryId: string | null;
    tags: string[];
    coverImage: string | null;
    coverAlt: string | null;
    featured: boolean;
    status: "DRAFT" | "PUBLISHED";
  };
  categories: Option[];
};

type Mode = "write" | "preview" | "split";

marked.setOptions({gfm: true, breaks: true});

export function PostEditor({id, locale, initial, categories}: PostEditorProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("split");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statusText, setStatusText] = useState("Saved");
  const [notice, setNotice] = useState<{type: "success" | "error"; text: string} | null>(null);
  const [dirty, setDirty] = useState(false);
  const [postStatus, setPostStatus] = useState<"DRAFT" | "PUBLISHED">(initial.status);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [contentMarkdown, setContentMarkdown] = useState(initial.contentMarkdown);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? "");
  const [coverImage, setCoverImage] = useState(initial.coverImage ?? "");
  const [coverAlt, setCoverAlt] = useState(initial.coverAlt ?? "");
  const [featured, setFeatured] = useState(initial.featured);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const previewHtml = useMemo(() => {
    const parsed = marked.parse(contentMarkdown || "");
    return typeof parsed === "string" ? parsed : "";
  }, [contentMarkdown]);

  const mutateMarkdown = useCallback((transform: (value: string, start: number, end: number) => {next: string; cursorStart?: number; cursorEnd?: number}) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const {next, cursorStart, cursorEnd} = transform(contentMarkdown, start, end);

    setContentMarkdown(next);
    setDirty(true);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = cursorStart ?? start;
      textarea.selectionEnd = cursorEnd ?? end;
    });
  }, [contentMarkdown]);

  const wrapSelection = useCallback((prefix: string, suffix = prefix, placeholder = "text") => {
    mutateMarkdown((value, start, end) => {
      const selected = value.slice(start, end);
      const middle = selected || placeholder;
      const insertion = `${prefix}${middle}${suffix}`;
      const next = value.slice(0, start) + insertion + value.slice(end);

      const offsetStart = selected ? start : start + prefix.length;
      const offsetEnd = selected ? start + insertion.length : start + prefix.length + placeholder.length;

      return {next, cursorStart: offsetStart, cursorEnd: offsetEnd};
    });
  }, [mutateMarkdown]);

  const prefixLine = useCallback((prefix: string) => {
    mutateMarkdown((value, start, end) => {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      return {next, cursorStart: start + prefix.length, cursorEnd: end + prefix.length};
    });
  }, [mutateMarkdown]);

  const insertAtCursor = useCallback((text: string) => {
    mutateMarkdown((value, start, end) => {
      const next = value.slice(0, start) + text + value.slice(end);
      const cursor = start + text.length;
      return {next, cursorStart: cursor, cursorEnd: cursor};
    });
  }, [mutateMarkdown]);

  const uploadFile = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    return new Promise<{path: string; name: string} | null>((resolve) => {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {method: "POST", body: formData});
        if (!res.ok) {
          resolve(null);
          return;
        }

        const json = await res.json();
        const path = json?.asset?.path as string | undefined;
        if (!path) {
          resolve(null);
          return;
        }

        resolve({path, name: file.name});
      };

      input.click();
    });
  }, []);

  const showNotice = useCallback((type: "success" | "error", text: string) => {
    setNotice({type, text});
    setTimeout(() => {
      setNotice((current) => (current?.text === text ? null : current));
    }, 2600);
  }, []);

  const addImageToMarkdown = useCallback(async () => {
    setStatusText("Uploading image...");
    const uploaded = await uploadFile();

    if (!uploaded) {
      setStatusText("Upload failed");
      showNotice("error", "Bild-Upload fehlgeschlagen.");
      return;
    }

    insertAtCursor(`\n![${uploaded.name}](${uploaded.path})\n`);
    if (!coverImage) {
      setCoverImage(uploaded.path);
      setCoverAlt(uploaded.name);
    }

    setStatusText("Saved");
    showNotice("success", "Bild eingefügt.");
  }, [coverImage, insertAtCursor, showNotice, uploadFile]);

  const uploadCover = useCallback(async () => {
    setStatusText("Uploading image...");
    const uploaded = await uploadFile();
    if (!uploaded) {
      setStatusText("Upload failed");
      showNotice("error", "Cover-Upload fehlgeschlagen.");
      return;
    }

    setCoverImage(uploaded.path);
    setCoverAlt((prev) => prev || uploaded.name);
    setDirty(true);
    setStatusText("Saved");
    showNotice("success", "Cover-Bild hochgeladen.");
  }, [showNotice, uploadFile]);

  const save = useCallback(
    async (nextStatus: "DRAFT" | "PUBLISHED", options?: {notify?: boolean}) => {
      setStatusText("Saving...");

      const payload = {
        locale,
        title,
        slug,
        excerpt,
        contentMarkdown,
        featured,
        categoryId: categoryId || null,
        tags: tags.split(",").map((tag) => tag.trim()),
        coverImage: coverImage || null,
        coverAlt: coverAlt || null,
        status: nextStatus,
      };

      const res = await fetch(`/api/editor/posts/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      const message =
        typeof json?.message === "string"
          ? json.message
          : nextStatus === "PUBLISHED"
            ? "Essay veröffentlicht."
            : "Entwurf gespeichert.";

      setStatusText(res.ok ? "Saved" : "Error");
      if (res.ok) {
        setDirty(false);
        setPostStatus(nextStatus);
        if (options?.notify) {
          showNotice("success", message);
        }
      } else if (options?.notify) {
        showNotice("error", "Speichern fehlgeschlagen.");
      }
    },
    [locale, title, slug, excerpt, contentMarkdown, featured, categoryId, tags, coverImage, coverAlt, id, showNotice]
  );

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      void save(postStatus, {notify: false});
    }, 2200);
    return () => clearTimeout(timer);
  }, [dirty, postStatus, save]);

  const deleteEssay = useCallback(async () => {
    const confirmed = window.confirm("Essay wirklich löschen?");
    if (!confirmed) return;

    const res = await fetch(`/api/editor/posts/${id}`, {method: "DELETE"});
    if (!res.ok) {
      showNotice("error", "Löschen fehlgeschlagen.");
      return;
    }

    showNotice("success", "Essay gelöscht.");
    const editorPath = locale === "de" ? "/editor" : `/${locale}/editor`;
    router.push(editorPath);
    router.refresh();
  }, [id, locale, router, showNotice]);

  const writePanel = (
    <section className="h-full border-r border-site-border bg-site-panel">
      <div className="border-b border-site-border px-5 py-5">
        <Input
          className="border-0 bg-transparent px-0 text-[3.2rem] leading-none font-serif text-site-ink shadow-none placeholder:text-site-muted focus-visible:ring-0"
          placeholder="Essay title..."
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setDirty(true);
          }}
        />
      </div>

      <div className="border-b border-site-border px-5 py-4">
        <Textarea
          className="min-h-[52px] resize-none border-0 bg-transparent px-0 py-0 text-[1.2rem] leading-8 shadow-none placeholder:text-site-muted focus-visible:ring-0"
          placeholder="Write a brief excerpt or summary..."
          value={excerpt}
          onChange={(event) => {
            setExcerpt(event.target.value);
            setDirty(true);
          }}
        />
      </div>

      <div className="border-b border-site-border px-4 py-2">
        <div className="flex items-center gap-1">
          <Button size="icon" type="button" variant="ghost" onClick={() => wrapSelection("**")}>
            <strong className="text-sm">B</strong>
          </Button>
          <Button size="icon" type="button" variant="ghost" onClick={() => wrapSelection("_")}>
            <Italic className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-site-border" />

          <Button size="icon" type="button" variant="ghost" onClick={() => prefixLine("## ")}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button size="icon" type="button" variant="ghost" onClick={() => prefixLine("### ")}>
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button size="icon" type="button" variant="ghost" onClick={() => prefixLine("> ")}>
            <Quote className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-site-border" />

          <Button size="icon" type="button" variant="ghost" onClick={() => prefixLine("- ")}>
            <List className="h-4 w-4" />
          </Button>
          <Button size="icon" type="button" variant="ghost" onClick={() => prefixLine("1. ")}>
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-site-border" />

          <Button size="icon" type="button" variant="ghost" onClick={() => wrapSelection("\n```\n", "\n```\n", "code") }>
            <span className="text-sm">&lt;/&gt;</span>
          </Button>
          <Button
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => {
              const href = window.prompt("URL", "https://");
              if (!href) return;
              wrapSelection("[", `](${href})`, "link text");
            }}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button size="icon" type="button" variant="ghost" onClick={() => void addImageToMarkdown()}>
            <ImageUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-5 py-4">
        <textarea
          ref={textareaRef}
          className="min-h-[56vh] w-full resize-none border-0 bg-transparent text-[1.05rem] leading-[1.82] text-site-ink outline-none placeholder:text-site-muted"
          placeholder="Start writing your essay... (Markdown supported)"
          value={contentMarkdown}
          onChange={(event) => {
            setContentMarkdown(event.target.value);
            setDirty(true);
          }}
        />
      </div>
    </section>
  );

  const previewPanel = (
    <section className="h-full bg-site px-8 py-8">
      {previewHtml.trim() ? (
        <article className="prose-essay max-w-none" dangerouslySetInnerHTML={{__html: previewHtml}} />
      ) : (
        <div className="grid min-h-[50vh] place-items-center text-center text-site-muted">
          <div>
            <Eye className="mx-auto mb-3 h-12 w-12 opacity-45" />
            <p className="text-xl">Your preview will appear here</p>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-site">
      <header className="border-b border-site-border bg-site-panel">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 text-site-muted">
            <Link className="rounded-md p-2 hover:bg-site-pill" href="/editor">
              <Undo2 className="h-5 w-5" />
            </Link>
            <p className="font-serif text-[2rem] text-site-ink">
              2cents <span className="px-2 text-site-muted">/</span>
              <span className="font-sans text-base text-site-muted">Editor</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" type="button" variant="ghost" onClick={() => setSettingsOpen((value) => !value)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" onClick={() => void save("DRAFT", {notify: true})}>Save Draft</Button>
            <Button type="button" onClick={() => void save("PUBLISHED", {notify: true})}>Publish</Button>
            <Button type="button" variant="outline" onClick={() => void deleteEssay()}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {notice ? (
          <div className="border-t border-site-border px-6 py-2">
            <p
              className={`inline-flex items-center gap-1 text-sm ${
                notice.type === "success" ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {notice.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
              {notice.text}
            </p>
          </div>
        ) : null}

        <div className="border-t border-site-border px-5">
          <div className="flex gap-5 text-sm">
            <button
              className={`border-b-2 px-1 py-3 ${mode === "write" ? "border-site-accent text-site-accent" : "border-transparent text-site-muted"}`}
              onClick={() => setMode("write")}
              type="button"
            >
              Write
            </button>
            <button
              className={`inline-flex items-center gap-1 border-b-2 px-1 py-3 ${mode === "preview" ? "border-site-accent text-site-accent" : "border-transparent text-site-muted"}`}
              onClick={() => setMode("preview")}
              type="button"
            >
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button
              className={`inline-flex items-center gap-1 border-b-2 px-1 py-3 ${mode === "split" ? "border-site-accent text-site-accent" : "border-transparent text-site-muted"}`}
              onClick={() => setMode("split")}
              type="button"
            >
              <Split className="h-4 w-4" /> Split View
            </button>
          </div>
        </div>
      </header>

      {settingsOpen ? (
        <section className="border-b border-site-border bg-site-panel px-6 py-5">
          <div className="mx-auto max-w-[1020px] space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-site-ink">URL Slug</label>
                <Input
                  placeholder="url-slug"
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setDirty(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-site-ink">Category</label>
                <select
                  className="h-10 w-full rounded-md border border-site-border bg-white px-3 text-sm"
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                    setDirty(true);
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-site-ink">Tags (comma-separated)</label>
              <Input
                placeholder="tag1, tag2, tag3"
                value={tags}
                onChange={(event) => {
                  setTags(event.target.value);
                  setDirty(true);
                }}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-site-ink">Cover Image</label>
              <button
                className="grid h-32 w-full place-items-center rounded-md border border-dashed border-site-border bg-site text-site-muted hover:bg-white"
                onClick={() => void uploadCover()}
                type="button"
              >
                <span className="inline-flex items-center gap-2 text-sm">
                  <ImageUp className="h-5 w-5" /> Click to upload or drag and drop
                </span>
              </button>

              {coverImage ? (
                <div className="mt-3 rounded-md border border-site-border bg-white p-3">
                  <Image
                    alt={coverAlt || "Cover image"}
                    className="max-h-48 rounded object-cover"
                    height={320}
                    src={coverImage}
                    unoptimized
                    width={900}
                  />
                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
                    <Input
                      placeholder="Cover alt text"
                      value={coverAlt}
                      onChange={(event) => {
                        setCoverAlt(event.target.value);
                        setDirty(true);
                      }}
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-site-muted">
                      <input
                        checked={featured}
                        type="checkbox"
                        onChange={(event) => {
                          setFeatured(event.target.checked);
                          setDirty(true);
                        }}
                      />
                      Featured
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="min-h-[70vh]">
        {mode === "write" ? <div className="grid grid-cols-1">{writePanel}</div> : null}
        {mode === "preview" ? <div className="grid grid-cols-1">{previewPanel}</div> : null}
        {mode === "split" ? <div className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-2">{writePanel}{previewPanel}</div> : null}
      </section>

      <div className="border-t border-site-border px-6 py-2 text-right text-xs text-site-muted">Autosave: {statusText}</div>
    </div>
  );
}
