// API client — all calls go through API Gateway with Cognito JWT auth.
// Books are cached in localStorage to minimise API calls and reduce cost.

const API_URL = import.meta.env.VITE_API_URL;
const CACHE_KEY = 'bw_books_cache';

let _getToken = null; // injected by AuthContext

export const setTokenGetter = (fn) => { _getToken = fn; };

const authHeaders = async () => {
  const token = await _getToken?.();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const request = async (method, path, body) => {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: await authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ── Cache helpers ─────────────────────────────────────────────────────────────
const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || { books: [], sharedBooks: [] }; }
  catch { return { books: [], sharedBooks: [] }; }
};
const writeCache = (data) => localStorage.setItem(CACHE_KEY, JSON.stringify(data));
export const clearCache = () => localStorage.removeItem(CACHE_KEY);

// ── Book API ──────────────────────────────────────────────────────────────────

export const fetchBooks = async () => {
  const data = await request('GET', '/books');
  writeCache(data);
  return data;
};

export const getCachedBooks = () => readCache();

export const apiCreateBook = async (book) => {
  const created = await request('POST', '/books', book);
  const cache = readCache();
  cache.books = [...cache.books, created];
  writeCache(cache);
  return created;
};

export const apiSaveBook = async (book) => {
  const updated = await request('PUT', `/books/${book.bookId}`, book);
  const cache = readCache();
  cache.books = cache.books.map(b => b.bookId === book.bookId ? updated : b);
  writeCache(cache);
  return updated;
};

export const apiDeleteBook = async (bookId) => {
  await request('DELETE', `/books/${bookId}`);
  const cache = readCache();
  cache.books = cache.books.filter(b => b.bookId !== bookId);
  writeCache(cache);
};

// ── Share API ─────────────────────────────────────────────────────────────────

export const apiShareBook = async (bookId, email) =>
  request('POST', `/books/${bookId}/share`, { email });

export const apiUnshareBook = async (bookId, recipientEmail) =>
  request('DELETE', `/books/${bookId}/share`, { recipientEmail });

export const apiGetShares = async (bookId) =>
  request('GET', `/books/${bookId}/shares`);

// ── Chapter Image API ──────────────────────────────────────────────────────────

export const apiUploadChapterImage = async (bookId, chapterId, imageData) => {
  const result = await request('POST', `/books/${bookId}/chapters/${chapterId}/image`, { imageData });
  return result.imageUrl;
};

export const apiDeleteChapterImage = async (bookId, chapterId) =>
  request('DELETE', `/books/${bookId}/chapters/${chapterId}/image`);
