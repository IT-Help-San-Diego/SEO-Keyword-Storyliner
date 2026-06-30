const DRAFT_KEY = "storyliner.draft.v1";

export interface StoredDraft {
  story: string;
  keywords: string[];
}

export function loadDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as StoredDraft).story === "string" &&
      Array.isArray((parsed as StoredDraft).keywords) &&
      (parsed as StoredDraft).keywords.every((k) => typeof k === "string")
    ) {
      return {
        story: (parsed as StoredDraft).story,
        keywords: (parsed as StoredDraft).keywords,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: StoredDraft): boolean {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    /* storage unavailable or full — fail silently, never block the user */
    return false;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
