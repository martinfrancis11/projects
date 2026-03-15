import { useState } from 'react';
import Library from './components/Library';
import BookEditor from './components/BookEditor';
import './styles/global.css';

export default function App() {
  const [currentBookId, setCurrentBookId] = useState(null);

  if (currentBookId) {
    return (
      <BookEditor
        bookId={currentBookId}
        onBack={() => setCurrentBookId(null)}
      />
    );
  }

  return <Library onOpenBook={setCurrentBookId} />;
}
