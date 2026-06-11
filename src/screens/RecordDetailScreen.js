import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  COLORS,
  formatINR,
  getUnitLabel,
  getRowCalculations,
  downloadPDF,
  openInvoice,
} from '../helpers/helpers';

export default function RecordDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cftRecords');
      const records = saved ? JSON.parse(saved) : [];
      const found = records.find((r) => String(r.id) === String(id));
      setRecord(found || null);
    } catch (e) {
      console.error('Error loading record:', e);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-box">
          <div className="spinner"></div>
          <p className="loading-text">Loading record...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon-circle">❌</div>
          <h2 className="empty-title">Record Not Found</h2>
          <p className="empty-subtitle">
            The record you are looking for does not exist or has been deleted.
          </p>
          <button className="empty-create-btn" onClick={() => navigate('/records')}>
            Go to Records
          </button>
        </div>
      </div>
    );
  }

  const displayBuyerName =
    record.buyerName || record.BuyerName || record.customerName || record.soldToName || 'Customer';
  const safeRows = record.rows || [];
  const safeTotals = record.totals || {};
  const safeCharges = record.additionalCharges || [];

  const validRows = safeRows.filter(
    (row) =>
      row &&
      parseFloat(row.length) > 0 &&
      parseFloat(row.width) > 0 &&
      parseFloat(row.height) > 0
  );

  const handlePreviewInvoice = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try { openInvoice(record); }
    catch (e) { alert('Failed to preview invoice'); }
    finally { setTimeout(() => setIsGenerating(false), 600); }
  };

  const handleGeneratePDF = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try { downloadPDF(record); }
    catch (e) { alert('Failed to generate PDF'); }
    finally { setTimeout(() => setIsGenerating(false), 1000); }
  };

  return (
    <div className="page-container">
      {/* Loading overlay for PDF */}
      {isGenerating && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner"></div>
            <p className="loading-text">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="detail-header">
        <button className="detail-back-btn" onClick={() => navigate('/records')}>
          ← Back
        </button>
        <h2 className="detail-title">Invoice Details</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="detail-preview-btn" onClick={handlePreviewInvoice}>Preview</button>
          <button className="detail-pdf-btn" onClick={handleGeneratePDF}>Download</button>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="section-card">
        <h3 className="section-title">Invoice Information</h3>
        <div className="info-row">
          <span className="info-label">Invoice #</span>
          <span className="info-value bold">{record.invoiceNumber || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Date</span>
          <span className="info-value">{record.date || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Buyer</span>
          <span className="info-value bold">{displayBuyerName}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Seller</span>
          <span className="info-value">{record.soldByName || 'N/A'}</span>
        </div>
        {record.vehicleNumber && (
          <div className="info-row">
            <span className="info-label">Vehicle No</span>
            <span className="info-value bold">{record.vehicleNumber}</span>
          </div>
        )}
        {record.description && (
          <div className="info-row">
            <span className="info-label">Description</span>
            <span className="info-value">{record.description}</span>
          </div>
        )}
        {(record.gst > 0 || record.gstManualAmt > 0) && (
          <div className="info-row">
            <span className="info-label">GST</span>
            <span className="info-value">{record.gst > 0 ? `${record.gst}%` : 'Manual amount'}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="section-card">
        <div className="items-header-row">
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            Items
          </h3>
          <span className="row-count-badge">{validRows.length} Items</span>
        </div>

        {validRows.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <p style={{ color: COLORS.textLight, fontStyle: 'italic', fontSize: '14px' }}>
              No items in this record
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="detail-table">
              <thead>
                <tr>
                  <th style={{ width: '35px' }}>#</th>
                  <th className="left" style={{ width: '120px' }}>Item</th>
                  <th style={{ width: '90px' }}>Length</th>
                  <th style={{ width: '90px' }}>Width</th>
                  <th style={{ width: '90px' }}>Height</th>
                  <th style={{ width: '55px' }}>Qty</th>
                  <th style={{ width: '85px' }}>T.CFT</th>
                  <th style={{ width: '85px' }}>Rate</th>
                  <th style={{ width: '110px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {validRows.map((row, i) => {
                  const { qty, rate, totalCft, amount } = getRowCalculations(row);
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="left">{row.itemName || 'Item ' + (i + 1)}</td>
                      <td>
                        {row.length} {getUnitLabel(row.lengthUnit)}
                      </td>
                      <td>
                        {row.width} {getUnitLabel(row.widthUnit)}
                      </td>
                      <td>
                        {row.height} {getUnitLabel(row.heightUnit)}
                      </td>
                      <td>{qty}</td>
                      <td className="bold">{totalCft.toFixed(3)}</td>
                      <td>₹{formatINR(rate)}</td>
                      <td className="highlight">₹{formatINR(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Charges */}
      {safeCharges.length > 0 &&
        safeCharges.some((ch) => ch.label || parseFloat(ch.amount) > 0) && (
          <div className="section-card">
            <h3 className="section-title">Additional Charges</h3>
            {safeCharges
              .filter((ch) => ch.label || parseFloat(ch.amount) > 0)
              .map((charge, index) => {
                const amt = parseFloat(charge.amount) || 0;
                return (
                  <div key={index} className="charge-item">
                    <span className="charge-item-label">
                      {charge.label || 'Charge'} ({charge.type === 'minus' ? '−' : '+'})
                    </span>
                    <span
                      className="charge-item-amount"
                      style={{
                        color:
                          charge.type === 'minus' ? COLORS.buttonDelete : COLORS.primary,
                      }}
                    >
                      ₹{formatINR(amt)}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

      {/* Totals */}
      <div className="totals-card">
        <h3 className="totals-title">Invoice Totals</h3>

        <div className="total-line">
          <span className="total-line-label">Subtotal</span>
          <span className="total-line-value">₹{formatINR(safeTotals.subtotal)}</span>
        </div>

        {(record.gst > 0 || record.gstManualAmt > 0) && safeTotals.gstAmt > 0 && (
          <div className="total-line">
            <span className="total-line-label">GST{record.gst > 0 ? ` (${record.gst}%)` : ' (Manual)'}</span>
            <span className="total-line-value">₹{formatINR(safeTotals.gstAmt)}</span>
          </div>
        )}

        {safeTotals.misc !== undefined && safeTotals.misc !== 0 && (
          <div className="total-line">
            <span className="total-line-label">Adjustments</span>
            <span
              className="total-line-value"
              style={{
                color: safeTotals.misc >= 0 ? COLORS.primary : COLORS.buttonDelete,
              }}
            >
              {safeTotals.misc >= 0 ? '+' : ''}₹{formatINR(safeTotals.misc)}
            </span>
          </div>
        )}

        <div className="grand-total-bar">
          <span className="grand-total-label">Balance</span>
          <span className="grand-total-value">₹{formatINR(safeTotals.grandTotal)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="btn-container">
        <div className="btn-row">
          <button className="btn btn-preview" onClick={handlePreviewInvoice}>Preview</button>
          <button className="btn btn-download" onClick={handleGeneratePDF}>Download PDF</button>
          <button className="btn btn-edit" onClick={() => navigate(`/edit/${record.id}`)}>Edit Record</button>
        </div>
        <button className="btn btn-back" onClick={() => navigate('/records')}>
          ← Back to Records
        </button>
      </div>
    </div>
  );
}