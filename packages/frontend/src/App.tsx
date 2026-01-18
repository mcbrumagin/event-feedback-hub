import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { HomePage } from '@/pages/HomePage';
import { AdminPage } from '@/pages/AdminPage';
import { cn } from '@/lib/utils';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="fixed top-4 right-4 z-50 flex gap-2">
      <Link
        to="/"
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          location.pathname === '/'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        )}
      >
        Feedback
      </Link>
      <Link
        to="/admin"
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          location.pathname === '/admin'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        )}
      >
        Admin
      </Link>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
