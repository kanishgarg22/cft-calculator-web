import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import './App.css';
import NewCalculationScreen from './screens/NewCalculationScreen';
import RecordScreen from './screens/RecordScreen';
import RecordDetailScreen from './screens/RecordDetailScreen';

function Navbar() {
  const location = useLocation();
  const isNew = location.pathname === '/' || location.pathname === '/new';

  return (
    <nav className="navbar">
      <Link to="/new" className="navbar-brand">CFT Calculator</Link>
      <div className="navbar-links">
        <Link
          to="/new"
          className={`nav-link ${isNew ? 'active' : ''}`}
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

function EditWrapper() {
  const { id } = useParams();
  return <NewCalculationScreen key={`edit-${id}`} />;
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<NewCalculationScreen key="new" />} />
          <Route path="/new" element={<NewCalculationScreen key="new" />} />
          <Route path="/edit/:id" element={<EditWrapper />} />
          <Route path="/records" element={<RecordScreen />} />
          <Route path="/record/:id" element={<RecordDetailScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;