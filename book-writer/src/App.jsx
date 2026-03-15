import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import Library from './components/Library';
import BookEditor from './components/BookEditor';
import './styles/global.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentBook, setCurrentBook] = useState(null); // { bookId, readOnly }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        height:'100vh', background:'#1a1208', fontFamily:'Georgia, serif',
        fontSize:'1.1rem', color:'#8a6a3a' }}>
        Loading…
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (currentBook) {
    return (
      <BookEditor
        bookId={currentBook.bookId}
        readOnly={currentBook.readOnly}
        onBack={() => setCurrentBook(null)}
      />
    );
  }

  return (
    <Library
      onOpenBook={(bookId, readOnly = false) => setCurrentBook({ bookId, readOnly })}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
