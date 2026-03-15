import { useState, useEffect, useCallback } from 'react';
import { fetchBooks, getCachedBooks, apiCreateBook, apiDeleteBook } from '../utils/api';
import { createBook } from '../utils/storage';

export const useBooks = () => {
  const cached = getCachedBooks();
  const [books, setBooks]             = useState(cached.books || []);
  const [sharedBooks, setSharedBooks] = useState(cached.sharedBooks || []);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Load books from API on mount
  useEffect(() => {
    fetchBooks()
      .then(data => {
        setBooks(data.books || []);
        setSharedBooks(data.sharedBooks || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const addBook = useCallback(async (title, author, genre, coverColor) => {
    const base  = createBook(title, author, genre, coverColor);
    const bookId = base.id; // use the same value for both id and bookId (DynamoDB SK)
    const book  = { ...base, bookId };
    const created = await apiCreateBook(book);
    // Ensure bookId is always present on the returned object
    const normalised = { ...created, bookId: created.bookId || bookId };
    setBooks(prev => [...prev, normalised]);
    return normalised;
  }, []);

  const removeBook = useCallback(async (bookId) => {
    await apiDeleteBook(bookId);
    setBooks(prev => prev.filter(b => b.bookId !== bookId));
  }, []);

  const refreshBooks = useCallback(async () => {
    const data = await fetchBooks();
    setBooks(data.books || []);
    setSharedBooks(data.sharedBooks || []);
  }, []);

  return { books, sharedBooks, loading, error, addBook, removeBook, refreshBooks };
};
