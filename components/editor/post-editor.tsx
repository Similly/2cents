"use client";

import {useCallback, useEffect, useState} from "react";
import {EditorContent, useEditor} from "@tiptap/react";
import type {JSONContent} from "@tiptap/core";
import {
  Bold,
  Code2,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Split,
  Underline,
} from "lucide-react";
import {editorExtensions} from "@/lib/editor";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

type Option = {id: string; name: string};

type PostEditorProps = {
  id: string;
  locale: "de" | "en";
  initial: {
    title: string;
    slug: string;
    excerpt: string;
    contentJson: JSONContent;
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

export function PostEditor({id, locale, initial, categories}: PostEditorProps) {
  const [mode, setMode] = useState<Mode>("split");
  const [statusText, setStatusText] = useState("Saved");
  const [dirty, setDirty] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? "");
  const [coverImage, setCoverImage] = useState(initial.coverImage ?? "");
  const [coverAlt, setCoverAlt] = useState(initial.coverAlt ?? "");
  const [featured, setFeatured] = useState(initial.featured);

  const editor = useEditor({
    extensions: editorExtensions,
    content: initial.contentJson,
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] rounded-md border border-site-border bg-white px-6 py-5 text-lg leading-8 text-site-ink focus:outline-none",
      },
    },
    onUpdate: () => setDirty(true),
  });

  const htmlPreview = editor?.getHTML() ?? "";

  const uploadImage = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {method: "POST", body: data});
      if (!res.ok) return;

      const result = await res.json();
      const path = result.asset?.path;
      if (path && editor) {
        editor.chain().focus().setImage({src: path, alt: file.name}).run();
      }

      if (path) {
        setCoverImage((prev) => prev || path);
      }
    };
    input.click();
  }, [editor]);

  const save = useCallback(
    async (nextStatus: "DRAFT" | "PUBLISHED") => {
      if (!editor) return;
      setStatusText("Saving...");

      const payload = {
        locale,
        title,
        slug,
        excerpt,
        contentJson: editor.getJSON(),
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

      setStatusText(res.ok ? "Saved" : "Error");
      if (res.ok) setDirty(false);
    },
    [categoryId, coverAlt, coverImage, editor, excerpt, featured, id, locale, slug, tags, title]
  );

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      void save("DRAFT");
    }, 2500);
    return () => clearTimeout(timer);
  }, [dirty, save]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-site-border bg-white p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-site-muted">URL Slug</label>
            <Input value={slug} onChange={(event) => { setSlug(event.target.value); setDirty(true); }} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-site-muted">Kategorie</label>
            <select
              className="h-10 w-full rounded-md border border-site-border bg-white px-3 text-sm"
              value={categoryId}
              onChange={(event) => { setCategoryId(event.target.value); setDirty(true); }}
            >
              <option value="">Keine</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-site-muted">Tags (kommagetrennt)</label>
            <Input value={tags} onChange={(event) => { setTags(event.target.value); setDirty(true); }} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-site-muted">Cover Bild URL</label>
            <div className="flex gap-2">
              <Input value={coverImage} onChange={(event) => { setCoverImage(event.target.value); setDirty(true); }} />
              <Button type="button" variant="outline" onClick={uploadImage}>
                Upload
              </Button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-site-muted">Cover Alt</label>
            <Input value={coverAlt} onChange={(event) => { setCoverAlt(event.target.value); setDirty(true); }} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-site-muted md:col-span-2">
            <input checked={featured} type="checkbox" onChange={(event) => { setFeatured(event.target.checked); setDirty(true); }} />
            Als Featured markieren
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-site-border bg-white p-6">
        <Input
          className="mb-4 border-0 px-0 text-5xl font-serif shadow-none focus-visible:ring-0"
          placeholder="Essay title..."
          value={title}
          onChange={(event) => { setTitle(event.target.value); setDirty(true); }}
        />
        <Textarea
          className="mb-4 min-h-[90px]"
          placeholder="Write a brief excerpt or summary..."
          value={excerpt}
          onChange={(event) => { setExcerpt(event.target.value); setDirty(true); }}
        />

        <div className="mb-3 flex flex-wrap items-center gap-1 border-y border-site-border py-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <Underline className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleHeading({level: 2}).run()}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleHeading({level: 3}).run()}>
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
            <Code2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const href = window.prompt("URL");
              if (href) editor?.chain().focus().setLink({href}).run();
            }}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={uploadImage}>
            <ImagePlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 flex gap-2">
          <Button variant={mode === "write" ? "subtle" : "ghost"} onClick={() => setMode("write")} type="button">
            Write
          </Button>
          <Button variant={mode === "preview" ? "subtle" : "ghost"} onClick={() => setMode("preview")} type="button">
            <Eye className="mr-1 h-4 w-4" /> Preview
          </Button>
          <Button variant={mode === "split" ? "subtle" : "ghost"} onClick={() => setMode("split")} type="button">
            <Split className="mr-1 h-4 w-4" /> Split View
          </Button>
        </div>

        <div className={`grid gap-4 ${mode === "split" ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {mode !== "preview" ? <EditorContent editor={editor} /> : null}
          {mode !== "write" ? (
            <div className="min-h-[420px] rounded-md border border-site-border bg-site p-6">
              {htmlPreview ? (
                <div className="prose-essay" dangerouslySetInnerHTML={{__html: htmlPreview}} />
              ) : (
                <p className="text-site-muted">Your preview will appear here</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-site-border bg-white p-4">
        <span className="text-sm text-site-muted">Autosave: {statusText}</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => save("DRAFT")}>
            Save Draft
          </Button>
          <Button type="button" onClick={() => save("PUBLISHED")}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
