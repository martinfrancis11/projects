import { useState, useEffect, useCallback } from 'react';
import { getBooks, saveBook, deleteBook, createBook } from '../utils/storage';

export const useBooks = () => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    setBooks(getBooks());
  }, []);

  const addBook = useCallback((title, author, genre, coverColor) => {
    const book = createBook(title, author, genre, coverColor);
    saveBook(book);
    setBooks(getBooks());
    return book;
  }, []);

  const removeBook = useCallback((id) => {
    deleteBook(id);
    setBooks(getBooks());
  }, []);

  const refreshBooks = useCallback(() => {
    setBooks(getBooks());
  }, []);

  return { books, addBook, removeBook, refreshBooks };
};
