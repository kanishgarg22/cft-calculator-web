import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatINR } from '../helpers/helpers';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecords, deleteRecord as deleteFromFirestore } from '../services/recordService';

export default function RecordScreen() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecords(currentUser.uid);
      setRecords(data);
    } catch (e) {
      console.error('Load records error:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const deleteRecord = (id) => {
    setConfirmDialog({
      title: 'Delete Record',
      message: 'Are you sure you want to delete this record?',
      onConfirm: async () => {
        try {
          await deleteFromFirestore(currentUser.uid, id);
          setRecords((prev) => prev.filter((r) => r.id !== id));
        } catch (e) { alert('Failed to delete record'); }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const deleteAllRecords = () => {
    if (records.length === 0) return;
    setConfirmDialog({
      title: 'Delete ALL Records',
      message: `Delete all ${records.length} records? This cannot be undone!`,
      onConfirm: async () => {
        try {
          await Promise.all(records.map((r) => deleteFromFirestore(currentUser.uid, r.id)));
          setRecords([]);
        } catch (e) { alert('Failed to delete all records'); }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const viewRecord = (record) => navigate(`/record/${record.id}`);
  const editRecord = (record) => navigate(`/edit/${record.id}`);
  const getGrandTotal = (totals) => Number((totals || {}).grandTotal || 0);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-box">
          <div className="spinner"></div>
          <p className="loading-text">Loading records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {confirmDialog && (
        <div className="modal-overlay" onClick={confirmDialog.onCancel}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-title">{confirmDialog.title}</h3>
            <p className="confirm-message">{confirmDialog.message}</p>
            <div className="confirm-buttons">
              <button className="confirm-btn cancel" onClick={confirmDialog.onCancel}>Cancel</button>
              <button className="confirm-btn danger" onClick={confirmDialog.onConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="records-header">
        <div className="records-header-left">
          <h1>Saved Records</h1>
          <p>{records.length} {records.length === 1 ? 'record' : 'records'}</p>
        </div>
        <div className="records-header-right">
          <button className="header-btn primary" onClick={() => navigate('/new')}>+ New</button>
          {records.length > 0 && (
            <button className="header-btn danger" onClick={deleteAllRecords}>Clear All</button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-circle">📋</div>
          <h2 className="empty-title">No Records Yet</h2>
          <p className="empty-subtitle">Create a calculation and save it to see your records here.</p>
          <button className="empty-create-btn" onClick={() => navigate('/new')}>Create First Record</button>
        </div>
      ) : (
        <div style={{ marginTop: '10px' }}>
          {records.map((item) => {
            const grandTotal = getGrandTotal(item.totals);
            const displayName = item.buyerName || item.BuyerName || item.customerName || 'Unnamed';
            const validItems = (item.rows || []).filter(
              (r) => r && parseFloat(r.length) > 0 && parseFloat(r.width) > 0 && parseFloat(r.height) > 0
            );
            return (
              <div key={item.id} className="record-card" onClick={() => viewRecord(item)}>
                <div className="card-content">
                  <div className="card-top">
                    <div className="card-top-left">
                      <div className="card-name" title={displayName}>{displayName}</div>
                      <div className="card-invoice">{item.invoiceNumber || '-'}</div>
                    </div>
                    <div className="card-total-badge">
                      <div className="card-total-label">Total</div>
                      <div className="card-total-value">₹{formatINR(grandTotal)}</div>
                    </div>
                  </div>
                  <div className="card-meta">
                    <span className="card-meta-text">{item.date || '-'}</span>
                    <span className="card-meta-dot">•</span>
                    <span className="card-meta-text">{validItems.length} items</span>
                    {item.soldByName && (
                      <><span className="card-meta-dot">•</span><span className="card-meta-text">By: {item.soldByName}</span></>
                    )}
                  </div>
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="card-action-btn view" onClick={() => viewRecord(item)}>View</button>
                    <button className="card-action-btn edit" onClick={() => editRecord(item)}>Edit</button>
                    <button className="card-action-btn delete" onClick={() => deleteRecord(item.id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
