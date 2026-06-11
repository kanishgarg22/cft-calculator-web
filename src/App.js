import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './screens/AuthScreen';
import NewCalculationScreen from './screens/NewCalculationScreen';
import RecordScreen from './screens/RecordScreen';
import RecordDetailScreen from './screens/RecordDetailScreen';

function Navbar() {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const isNew = location.pathname === '/' || location.pathname === '/new';

  return (
    <nav className="navbar">
      <Link to="/new" className="navbar-brand">CFT Calculator</Link>
      <div className="navbar-links">
        <Link to="/new" className={`nav-link ${isNew ? 'active' : ''}`}>+ New</Link>
        <Link to="/records" className={`nav-link ${location.pathname === '/records' ? 'active' : ''}`}>Records</Link>
        {currentUser && (
          <button className="nav-logout-btn" onClick={logout} title={currentUser.email}>
            {currentUser.displayName
              ? currentUser.displayName.split(' ')[0]
              : currentUser.email.split('@')[0]}
            &nbsp;↩
          </button>
        )}
      </div>
    </nav>
  );
}

function EditWrapper() {
  const { id } = useParams();
  return <NewCalculationScreen key={`edit-${id}`} />;
}

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <>
      {currentUser && <Navbar />}
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <AuthScreen />} />
        <Route path="/" element={<ProtectedRoute><NewCalculationScreen key="new" /></ProtectedRoute>} />
        <Route path="/new" element={<ProtectedRoute><NewCalculationScreen key="new" /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><EditWrapper /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><RecordScreen /></ProtectedRoute>} />
        <Route path="/record/:id" element={<ProtectedRoute><RecordDetailScreen /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
