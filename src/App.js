import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import NewCalculationScreen from './screens/NewCalculationScreen';
import RecordScreen from './screens/RecordScreen';
import RecordDetailScreen from './screens/RecordDetailScreen';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">CFT Calculator</Link>
      <div className="navbar-links">
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          + New
        </Link>
        <Link
          to="/records"
          className={`nav-link ${location.pathname === '/records' ? 'active' : ''}`}
        >
          Records
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<NewCalculationScreen />} />
          <Route path="/new" element={<NewCalculationScreen />} />
          <Route path="/edit/:id" element={<NewCalculationScreen />} />
          <Route path="/records" element={<RecordScreen />} />
          <Route path="/record/:id" element={<RecordDetailScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;