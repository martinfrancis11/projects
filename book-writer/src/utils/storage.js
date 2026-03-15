const BOOKS_KEY = 'bookwriter_books';

export const getBooks = () => {
  try {
    return JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveBooks = (books) => {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
};

export const getBook = (id) => {
  return getBooks().find((b) => b.id === id) || null;
};

export const saveBook = (book) => {
  const books = getBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) {
    books[idx] = book;
  } else {
    books.push(book);
  }
  saveBooks(books);
};

export const deleteBook = (id) => {
  saveBooks(getBooks().filter((b) => b.id !== id));
};

export const createBook = (title, author, genre = 'Fiction', coverColor = '#8B4513') => ({
  id: Date.now().toString(),
  title,
  author,
  genre,
  coverColor,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chapters: [
    {
      id: Date.now().toString() + '_1',
      title: 'Chapter 1',
      content: '',
    },
  ],
});

export const createChapter = (title = 'New Chapter') => ({
  id: Date.now().toString(),
  title,
  content: '',
});
