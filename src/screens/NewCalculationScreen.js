import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  UNIT_OPTIONS,
  MIN_ROWS,
  formatINR,
  getUnitLabel,
  sanitizeDecimalInput,
  sanitizeDimensionInput,
  sanitizeIntegerInput,
  createDefaultRows,
  getRowCalculations,
  downloadPDF,
} from '../helpers/helpers';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`toast ${type}`}>{message}</div>;
}


function UnitModal({ show, rows, unitTarget, onSelect, onClose }) {
  if (!show) return null;
  const currentUnit = unitTarget.row >= 0 ? rows[unitTarget.row]?.[unitTarget.field] : '';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Select Unit</h3>
        {UNIT_OPTIONS.map((unit) => (
          <div
            key={unit.value}
            className={`modal-option ${currentUnit === unit.value ? 'selected' : ''}`}
            onClick={() => onSelect(unit.value)}
          >
            {unit.label} ({unit.value})
          </div>
        ))}
        <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default function NewCalculationScreen() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const today = new Date().toLocaleDateString('en-GB');
  const idCounter = useRef(Date.now() + 100);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const getNextId = () => { idCounter.current += 1; return idCounter.current; };

  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [buyerName, setBuyerName] = useState('');
  const [soldByName, setSoldByName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [description, setDescription] = useState('');
  const [gstPercent, setGstPercent] = useState('');
  const [gstManualAmt, setGstManualAmt] = useState('');
  const [rows, setRows] = useState(createDefaultRows());
  const [additionalCharges, setAdditionalCharges] = useState([
    { id: Date.now() + 900, label: '', amount: '', type: 'plus' },
    { id: Date.now() + 901, label: '', amount: '', type: 'minus' },
  ]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitTarget, setUnitTarget] = useState({ row: -1, field: '' });

  useEffect(() => {
    if (editId) {
      try {
        const savedRecords = localStorage.getItem('cftRecords');
        const records = savedRecords ? JSON.parse(savedRecords) : [];
        const record = records.find((r) => String(r.id) === String(editId));
        if (record) {
          setEditRecord(record);
          setInvoiceNumber(record.invoiceNumber || '');
          setInvoiceDate(record.date || today);
          setBuyerName(record.buyerName || record.BuyerName || record.customerName || '');
          setSoldByName(record.soldByName || '');
          setVehicleNumber(record.vehicleNumber || '');
          setDescription(record.description || '');
          setGstPercent(String(record.gst || ''));
          setGstManualAmt(record.gstManualAmt != null ? String(record.gstManualAmt) : '');
          if (record.rows && record.rows.length > 0) {
            const editRows = record.rows.map((row, index) => ({
              id: row.id || Date.now() + index, itemName: row.itemName || '',
              length: row.length != null ? String(row.length) : '',
              width: row.width != null ? String(row.width) : '',
              height: row.height != null ? String(row.height) : '',
              lengthUnit: row.lengthUnit || 'inches', widthUnit: row.widthUnit || 'inches', heightUnit: row.heightUnit || 'inches',
              quantity: row.quantity != null ? String(row.quantity) : '',
              pricePerCft: row.pricePerCft != null ? String(row.pricePerCft) : '',
            }));
            while (editRows.length < MIN_ROWS) editRows.push({ id: Date.now() + editRows.length + 500, itemName: '', length: '', width: '', height: '', lengthUnit: 'inches', widthUnit: 'inches', heightUnit: 'inches', quantity: '', pricePerCft: '' });
            setRows(editRows);
          }
          if (record.additionalCharges && record.additionalCharges.length > 0)
            setAdditionalCharges(record.additionalCharges.map((c) => ({ ...c, id: c.id || Date.now() + Math.random(), type: c.type || 'plus' })));
        }
      } catch (e) { console.error('Error loading edit record:', e); }
    }
    setIsInitialized(true);
  }, [editId, today]);

    const totals = useMemo(() => {
    let totalCFT = 0, totalTCFT = 0, subtotal = 0;
    rows.forEach((row) => { const { cft, totalCft, amount } = getRowCalculations(row); totalCFT += cft; totalTCFT += totalCft; subtotal += amount; });
    const misc = additionalCharges.reduce((sum, ch) => { const a = parseFloat(ch.amount) || 0; return ch.type === 'minus' ? sum - a : sum + a; }, 0);
    const gstValue = parseFloat(gstPercent) || 0;
    const gstAmtCalc = subtotal * (gstValue / 100);
    const gstAmt = gstManualAmt !== '' ? (parseFloat(gstManualAmt) || 0) : gstAmtCalc;
    return { totalCFT, totalTCFT, subtotal, misc, gstAmt, gstAmtCalc, grandTotal: subtotal + gstAmt + misc };
  }, [rows, gstPercent, gstManualAmt, additionalCharges]);

  const addRow = useCallback(() => {
    const last = rows[rows.length - 1];
    setRows((p) => [...p, { id: getNextId(), itemName: '', length: '', width: '', height: '', lengthUnit: last?.lengthUnit || 'inches', widthUnit: last?.widthUnit || 'inches', heightUnit: last?.heightUnit || 'inches', quantity: '', pricePerCft: '' }]);
  }, [rows]);

const updateRow = useCallback((i, f, v) => { setRows((p) => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; }); }, []);
  const addCharge = useCallback(() => { setAdditionalCharges((p) => [...p, { id: getNextId(), label: '', amount: '', type: 'plus' }]); }, []);
  const updateCharge = useCallback((i, f, v) => { setAdditionalCharges((p) => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; }); }, []);
  const removeCharge = useCallback((i) => { setAdditionalCharges((p) => p.filter((_, idx) => idx !== i)); }, []);
  const openUnitSelector = useCallback((r, f) => { setUnitTarget({ row: r, field: f }); setShowUnitModal(true); }, []);
  const selectUnit = useCallback((v) => { updateRow(unitTarget.row, unitTarget.field, v); setShowUnitModal(false); }, [unitTarget, updateRow]);

  const saveRecord = async () => {
    if (!buyerName.trim()) { setToast({ message: 'Please enter Buyer Name', type: 'error' }); return; }
    if (isLoading) return;
    setIsLoading(true);
    try {
      const record = { id: editRecord ? editRecord.id : Date.now(), invoiceNumber, date: invoiceDate, buyerName: buyerName.trim(), BuyerName: buyerName.trim(), customerName: buyerName.trim(), soldByName: soldByName.trim(), gst: parseFloat(gstPercent) || 0, gstManualAmt: gstManualAmt !== '' ? parseFloat(gstManualAmt) || 0 : null, rows: rows.map((r) => ({ ...r })), additionalCharges: additionalCharges.map((c) => ({ ...c })), totals: { ...totals } };
      const saved = localStorage.getItem('cftRecords');
      let records = saved ? JSON.parse(saved) : [];
      if (editRecord) records = records.map((r) => (r.id === editRecord.id ? record : r)); else records.unshift(record);
      localStorage.setItem('cftRecords', JSON.stringify(records));
      setToast({ message: editRecord ? 'Record updated!' : 'Record saved!', type: 'success' });
      setTimeout(() => navigate('/records'), 1500);
    } catch (e) { setToast({ message: 'Failed to save', type: 'error' }); } finally { setIsLoading(false); }
  };

  const hasValidItem = () =>
    rows.some(
      (r) =>
        parseFloat(r.length) > 0 &&
        parseFloat(r.width) > 0 &&
        parseFloat(r.height) > 0
    );

  const buildRecord = () => ({
    invoiceNumber, date: invoiceDate,
    buyerName: buyerName.trim() || 'Customer', soldByName: soldByName.trim(),
    vehicleNumber: vehicleNumber.trim(), description: description.trim(),
    gst: parseFloat(gstPercent) || 0,
    gstManualAmt: gstManualAmt !== '' ? parseFloat(gstManualAmt) || 0 : null,
    rows: rows.map((r) => ({ ...r })),
    additionalCharges: additionalCharges.map((c) => ({ ...c })),
    totals: { ...totals },
  });

  const generatePDF = async () => {
    if (isLoading) return;
    if (!hasValidItem()) { setToast({ message: 'Add at least one item with Length, Width & Height first', type: 'error' }); return; }
    setIsLoading(true);
    try { downloadPDF(buildRecord()); setToast({ message: 'PDF download started!', type: 'success' }); }
    catch (e) { setToast({ message: 'Failed to generate PDF', type: 'error' }); } finally { setIsLoading(false); }
  };

  if (!isInitialized && editId) return (<div className="loading-overlay"><div className="loading-box"><div className="spinner"></div><p className="loading-text">Loading...</p></div></div>);

  const chargesTotal = additionalCharges.reduce((sum, ch) => { const a = parseFloat(ch.amount) || 0; return ch.type === 'minus' ? sum - a : sum + a; }, 0);

  return (
    <div className="page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {isLoading && <div className="loading-overlay"><div className="loading-box"><div className="spinner"></div><p className="loading-text">Processing...</p></div></div>}
      <UnitModal show={showUnitModal} rows={rows} unitTarget={unitTarget} onSelect={selectUnit} onClose={() => setShowUnitModal(false)} />

      <div className="banner">
        <span className="banner-icon">{editRecord ? '✎' : '+'}</span>
        <span className="banner-text">{editRecord ? `Editing: ${editRecord.invoiceNumber}` : 'New Calculation'}</span>
      </div>

      <div className="section-card">
        <h3 className="section-title">Invoice Details</h3>
        <div className="form-grid">
          <div className="field-row"><label className="field-label">Date</label><input type="text" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="field-input" placeholder="DD/MM/YYYY" /></div>
          <div className="field-row"><label className="field-label">Invoice #</label><input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="field-input" /></div>
        </div>
      </div>

      <div className="section-card">
        <h3 className="section-title">Customer & Seller</h3>
        <div className="form-grid">
          <div className="field-row"><label className="field-label">Buyer</label><input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="field-input" placeholder="Enter buyer name" /></div>
          <div className="field-row"><label className="field-label">Seller</label><input type="text" value={soldByName} onChange={(e) => setSoldByName(e.target.value)} className="field-input" placeholder="Your company name" /></div>
          <div className="field-row"><label className="field-label">Vehicle No</label><input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="field-input" placeholder="e.g. MH12AB1234" /></div>
          <div className="field-row"><label className="field-label">Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="field-input" placeholder="e.g. Teak wood, Pine..." /></div>
        </div>
      </div>

      {/* Items Table */}
      <div className="section-card">
        <div className="items-header-row">
          <h3 className="section-title" style={{ marginBottom: 0 }}>Items</h3>
          <span className="row-count-badge">{rows.length} Rows</span>
        </div>
        <div className="table-wrapper">
          <table className="items-table">
            <thead><tr>
              <th style={{ width: '35px' }}>#</th>
              <th className="left" style={{ width: '90px' }}>Item</th>
              <th style={{ width: '115px' }}>Length</th>
              <th style={{ width: '115px' }}>Width</th>
              <th style={{ width: '115px' }}>Height</th>
              <th style={{ width: '68px' }}>CFT</th>
              <th style={{ width: '100px' }}>Qty</th>
              <th style={{ width: '75px' }}>T.CFT</th>
              <th style={{ width: '100px' }}>Rate</th>
              <th style={{ width: '180px' }}>Amount</th>
            </tr></thead>
            <tbody>
              {rows.map((row, index) => {
                const { cft, totalCft, amount } = getRowCalculations(row);
                return (
                  <tr key={row.id}>
                    <td><span className="row-number">{index + 1}</span></td>
                    <td className="left"><input type="text" value={row.itemName} onChange={(e) => updateRow(index, 'itemName', e.target.value)} placeholder="Item" className="table-input left" /></td>
                    <td><div className="dim-cell"><input type="text" value={row.length} onChange={(e) => updateRow(index, 'length', sanitizeDimensionInput(e.target.value))} className="dim-input" maxLength={7} /><button className="unit-btn" onClick={() => openUnitSelector(index, 'lengthUnit')}>{getUnitLabel(row.lengthUnit)} ▾</button></div></td>
                    <td><div className="dim-cell"><input type="text" value={row.width} onChange={(e) => updateRow(index, 'width', sanitizeDimensionInput(e.target.value))} className="dim-input" maxLength={7} /><button className="unit-btn" onClick={() => openUnitSelector(index, 'widthUnit')}>{getUnitLabel(row.widthUnit)} ▾</button></div></td>
                    <td><div className="dim-cell"><input type="text" value={row.height} onChange={(e) => updateRow(index, 'height', sanitizeDimensionInput(e.target.value))} className="dim-input" maxLength={7} /><button className="unit-btn" onClick={() => openUnitSelector(index, 'heightUnit')}>{getUnitLabel(row.heightUnit)} ▾</button></div></td>
                    <td><span className="calc-cell">{cft.toFixed(4)}</span></td>
                    <td><input type="text" value={row.quantity} onChange={(e) => updateRow(index, 'quantity', sanitizeIntegerInput(e.target.value))} className="table-input qty-input" placeholder="1" /></td>
                    <td><span className="calc-cell">{totalCft.toFixed(4)}</span></td>
                    <td><div className="amount-cell rate-cell"><span className="rupee-sign">₹</span><input type="text" value={row.pricePerCft} onChange={(e) => updateRow(index, 'pricePerCft', sanitizeDecimalInput(e.target.value, 5))} className="amount-input rate-input" placeholder="" maxLength={9} /></div></td>
                    <td><div className="amount-display amount-wide"><span className="rupee">₹</span><span className="value">{formatINR(amount)}</span></div></td>
                  </tr>
                );
              })}
              <tr className="table-total-row">
                <td colSpan="5" style={{ textAlign: 'right', paddingRight: '12px' }}>TOTAL</td>
                <td></td><td></td>
                <td>{totals.totalTCFT.toFixed(4)}</td>
                <td></td>
                <td><div className="amount-display amount-wide total-amount"><span className="rupee">₹</span><span className="value">{formatINR(totals.subtotal)}</span></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <button className="add-row-btn" onClick={addRow}>+ Add Row</button>
      </div>

      {/* GST */}
      <div className="section-card">
        <h3 className="section-title">GST</h3>
        <div className="field-row">
          <label className="field-label">GST %</label>
          <input type="text" value={gstPercent} onChange={(e) => { setGstPercent(sanitizeDecimalInput(e.target.value)); setGstManualAmt(''); }} className="field-input" style={{ textAlign: 'right', maxWidth: '90px' }} placeholder="0" />
          <label className="field-label" style={{ width: 'auto', color: '#888', paddingLeft: '8px' }}>Amount ₹</label>
          <input type="text" value={gstManualAmt} onChange={(e) => setGstManualAmt(sanitizeDecimalInput(e.target.value))} className="field-input" style={{ textAlign: 'right', maxWidth: '160px' }} placeholder={totals.gstAmtCalc > 0 ? formatINR(totals.gstAmtCalc) : '0.00'} />
        </div>
      </div>

      {/* Adjustments */}
      <div className="charges-section-card">
        <div className="charges-title-row">
          <h3 className="charges-section-title">Adjustments</h3>
          <span className="charges-count-badge">{additionalCharges.length} Rows</span>
        </div>

        {additionalCharges.length > 0 && (
          <div className="charges-table">
            <div className="charges-header">
              <span className="charges-header-cell" style={{ flex: 3 }}>Description</span>
              <span className="charges-header-cell" style={{ width: '74px', textAlign: 'center' }}>Type</span>
              <span className="charges-header-cell" style={{ flex: 2 }}>Amount (₹)</span>
              <span className="charges-header-cell" style={{ width: '40px' }}></span>
            </div>
            {additionalCharges.map((charge, index) => (
              <div key={charge.id} className="charge-row">
                <input type="text" value={charge.label} onChange={(e) => updateCharge(index, 'label', e.target.value)} placeholder="e.g. Transport, Discount..." className="charge-input" />
                <div className="charge-type-container">
                  <button className={`charge-type-btn ${charge.type === 'plus' ? 'active-plus' : 'inactive'}`} onClick={() => updateCharge(index, 'type', 'plus')} title="Add">+</button>
                  <button className={`charge-type-btn ${charge.type === 'minus' ? 'active-minus' : 'inactive'}`} onClick={() => updateCharge(index, 'type', 'minus')} title="Subtract">−</button>
                </div>
                <div className="charge-amount-wrap">
                  <span className="charge-rupee">₹</span>
                  <input type="text" value={charge.amount} onChange={(e) => updateCharge(index, 'amount', sanitizeDecimalInput(e.target.value))} className="charge-amount-input" placeholder="0.00" />
                </div>
                <button className="charge-remove-btn" onClick={() => removeCharge(index)} title="Remove">✕</button>
              </div>
            ))}
          </div>
        )}

        <button className="add-charge-btn" onClick={addCharge}>+ Add Row</button>

        {additionalCharges.some((c) => parseFloat(c.amount) > 0) && (
          <div className="charge-summary">
            <span className="charge-summary-label">Net Adjustments</span>
            <span className={`charge-summary-value ${chargesTotal < 0 ? 'negative' : ''}`}>
              {chargesTotal >= 0 ? '+' : ''}₹{formatINR(chargesTotal)}
            </span>
          </div>
        )}
      </div>

      {/* Invoice Summary - GST above Adjustments */}
      <div className="totals-card">
        <h3 className="totals-title">Invoice Summary</h3>
        <div className="total-line">
          <span className="total-line-label">Subtotal</span>
          <span className="total-line-value">₹{formatINR(totals.subtotal)}</span>
        </div>
        {(gstPercent || gstManualAmt) && totals.gstAmt > 0 && (
          <div className="total-line">
            <span className="total-line-label">GST{gstPercent ? ` (${gstPercent}%)` : ' (Manual)'}</span>
            <span className="total-line-value">₹{formatINR(totals.gstAmt)}</span>
          </div>
        )}
        {additionalCharges.some((c) => parseFloat(c.amount) > 0) && (
          <div className="total-line">
            <span className="total-line-label">Adjustments</span>
            <span className="total-line-value" style={{ color: totals.misc >= 0 ? '#6B8030' : '#D06060' }}>
              {totals.misc >= 0 ? '+' : ''}₹{formatINR(totals.misc)}
            </span>
          </div>
        )}
        <div className="grand-total-bar">
          <span className="grand-total-label">Balance</span>
          <span className="grand-total-value">₹{formatINR(totals.grandTotal)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="btn-container">
        <div className="btn-row">
          <button className="btn btn-save" onClick={saveRecord}>{editRecord ? 'Update Record' : 'Save Record'}</button>
          <button className="btn btn-download" onClick={generatePDF}>Download PDF</button>
        </div>
      </div>
    </div>
  );
}