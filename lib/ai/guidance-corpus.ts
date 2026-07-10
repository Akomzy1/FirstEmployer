/**
 * Curated guidance corpus loader + deterministic retrieval (FR-6.1).
 * The corpus is the committed set under /content/guidance/*.md — the ONLY text
 * the assistant may ground guidance answers on (plus live config values and the
 * business's own obligation state). Retrieval is keyword scoring — deterministic,
 * transparent, and honest at this corpus size; no embeddings, no magic.
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export interface GuidanceDoc {
  id: string;
  title: string;
  url: string;
  refs: string[];
  keywords: string[];
  body: string;
}

/** Tiny front-matter parser for the corpus files (--- key: value --- body). */
export function parseGuidanceDoc(raw: string): GuidanceDoc | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  if (!meta.id || !meta.title) return null;
  return {
    id: meta.id,
    title: meta.title,
    url: meta.url ?? "",
    refs: (meta.refs ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    keywords: (meta.keywords ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    body: m[2].trim(),
  };
}

let cache: GuidanceDoc[] | null = null;

/** Load the committed corpus (cached per process). */
export function loadGuidanceCorpus(dir = join(process.cwd(), "content", "guidance")): GuidanceDoc[] {
  if (cache) return cache;
  const docs: GuidanceDoc[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const doc = parseGuidanceDoc(readFileSync(join(dir, f), "utf8"));
    if (doc) docs.push(doc);
  }
  cache = docs.sort((a, b) => a.id.localeCompare(b.id));
  return cache;
}

/** Test/maintenance helper. */
export function __clearCorpusCache() {
  cache = null;
}

/**
 * Deterministic retrieval: score by keyword and title-word hits, return the top
 * matches (score > 0), best first, id as tie-break.
 */
export function retrieveGuidance(question: string, corpus: GuidanceDoc[], limit = 2): GuidanceDoc[] {
  const q = question.toLowerCase();
  const scored = corpus
    .map((doc) => {
      let score = 0;
      for (const kw of doc.keywords) if (q.includes(kw)) score += kw.includes(" ") ? 3 : 2;
      for (const word of doc.title.toLowerCase().split(/\W+/)) {
        if (word.length > 3 && q.includes(word)) score += 1;
      }
      return { doc, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id));
  return scored.slice(0, limit).map((s) => s.doc);
}
