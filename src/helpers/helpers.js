// ─── CONSTANTS ───
export const COLORS = {
  background: '#F5F5F0',
  card: '#FFFFFF',
  primary: '#C8CDA0',
  secondary: '#D8DDB8',
  accent: '#F5F6ED',
  border: '#E0E0D8',
  textPrimary: '#444444',
  textSecondary: '#666666',
  textLight: '#999999',
  buttonMain: '#D8DDB8',
  buttonDelete: '#D06060',
  grandTotal: '#4A5020',
  tableHeader: '#F5F6ED',
  white: '#FFFFFF',
  successBg: '#F5F6ED',
  rowEven: '#FAFAF7',
  inputBg: '#FAFAF8',
  shadow: '#444444',
  sage: '#C8CDA0',
  lightSage: '#F0F2E4',
  warmGray: '#E0E0D8',
  offWhite: '#F5F5F0',
};

export const CONVERSION_FACTORS = {
  inches: 1,
  foot: 12,
  mm: 0.0393701,
  soot: 0.125,
};

export const CUBIC_INCHES_PER_CFT = 1728;
export const MIN_ROWS = 7;

export const UNIT_OPTIONS = [
  { value: 'inches', label: 'In' },
  { value: 'foot', label: 'Ft' },
  { value: 'mm', label: 'Mm' },
  { value: 'soot', label: 'St' },
];

// ─── HELPER FUNCTIONS ───
export const convertToInches = (value, unit) => {
  if (value === '' || value === null || value === undefined || isNaN(Number(value))) return 0;
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return num * (CONVERSION_FACTORS[unit] || 1);
};

export const calculateCFT = (l, w, h, lUnit, wUnit, hUnit) => {
  const lv = parseFloat(l);
  const wv = parseFloat(w);
  const hv = parseFloat(h);
  if (!lv || !wv || !hv || isNaN(lv) || isNaN(wv) || isNaN(hv)) return 0;
  const li = convertToInches(lv, lUnit || 'inches');
  const wi = convertToInches(wv, wUnit || 'inches');
  const hi = convertToInches(hv, hUnit || 'inches');
  return (li * wi * hi) / CUBIC_INCHES_PER_CFT;
};

export const formatINR = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  const n = Number(num);
  const isNegative = n < 0;
  const abs = Math.abs(n).toFixed(2);
  const parts = abs.split('.');
  let intPart = parts[0];
  const decPart = parts[1];
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    intPart = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  return (isNegative ? '-' : '') + intPart + '.' + decPart;
};

export const getUnitLabel = (unitValue) => {
  const unit = UNIT_OPTIONS.find((u) => u.value === unitValue);
  return unit ? unit.label : 'In';
};

export const sanitizeForHTML = (str) => {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const sanitizeDecimalInput = (value, maxDigits = null) => {
  if (value === null || value === undefined) return '';
  // Keep only digits and dots.
  let cleaned = String(value).replace(/[^0-9.]/g, '');
  // Collapse any extra dots so there is at most one decimal point.
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    cleaned =
      cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
  }
  let [intPart = '', decPart] = cleaned.split('.');
  // Strip leading zeros from the integer part ("007" -> "7", "0" stays "0").
  if (intPart.length > 1) {
    intPart = intPart.replace(/^0+/, '') || '0';
  }
  // Optionally cap the number of integer digits.
  if (maxDigits !== null && intPart.length > maxDigits) {
    intPart = intPart.slice(0, maxDigits);
  }
  return decPart !== undefined ? intPart + '.' + decPart : intPart;
};

export const sanitizeDimensionInput = (value) => {
  return sanitizeDecimalInput(value, 5);
};

export const sanitizeIntegerInput = (value) => {
  if (value === null || value === undefined) return '';
  let cleaned = value.replace(/[^0-9]/g, '');
  if (cleaned.length === 0) return '';
  const parsed = parseInt(cleaned, 10);
  if (isNaN(parsed)) return '';
  return String(parsed);
};

export const sanitizeFileName = (str) => {
  return String(str || 'file').replace(/[^a-zA-Z0-9]/g, '_');
};

export const createDefaultRows = () =>
  Array(MIN_ROWS)
    .fill(null)
    .map((_, i) => ({
      id: Date.now() + i,
      itemName: '',
      length: '',
      width: '',
      height: '',
      lengthUnit: 'inches',
      widthUnit: 'inches',
      heightUnit: 'inches',
      quantity: '',
      pricePerCft: '',
    }));

export const getRowCalculations = (row) => {
  const length = parseFloat(row.length) || 0;
  const width = parseFloat(row.width) || 0;
  const height = parseFloat(row.height) || 0;
  // A blank quantity means a single measured piece, so default it to 1.
  // An explicitly entered 0 stays 0. This prevents a filled-in row with a
  // rate from silently calculating to ₹0 just because Qty was left empty.
  const qtyRaw = row.quantity;
  const quantity =
    qtyRaw === '' || qtyRaw === null || qtyRaw === undefined
      ? 1
      : parseFloat(qtyRaw) || 0;
  const pricePerCft = parseFloat(row.pricePerCft) || 0;

  if (length <= 0 || width <= 0 || height <= 0) {
    return { cft: 0, qty: quantity, rate: pricePerCft, totalCft: 0, amount: 0 };
  }

  const cft = calculateCFT(
    String(length),
    String(width),
    String(height),
    row.lengthUnit || 'inches',
    row.widthUnit || 'inches',
    row.heightUnit || 'inches'
  );
  const totalCft = cft * quantity;
  const amount = totalCft * pricePerCft;
  return { cft, qty: quantity, rate: pricePerCft, totalCft, amount };
};

// ─── PDF HTML GENERATOR ───
export const generateInvoiceHTML = (record) => {
  const displayBuyerName =
    record.buyerName || record.BuyerName || record.customerName || 'Customer';
  const safeRows = record.rows || [];
  const safeTotals = record.totals || {};
  const safeCharges = record.additionalCharges || [];

  let rowsHTML = '';
  let rowNumber = 0;
  let grandTotalTCFT = 0;
  let grandTotalAmount = 0;

  safeRows.forEach((row) => {
    const length = parseFloat(row.length) || 0;
    const width = parseFloat(row.width) || 0;
    const height = parseFloat(row.height) || 0;

    if (length > 0 && width > 0 && height > 0) {
      rowNumber++;
      const { cft, qty, rate, totalCft, amount } = getRowCalculations(row);
      grandTotalTCFT += totalCft;
      grandTotalAmount += amount;

      rowsHTML += `
        <tr>
          <td class="tc c">${rowNumber}</td>
          <td class="tc l">${sanitizeForHTML(row.itemName || 'Item ' + rowNumber)}</td>
          <td class="tc c">${length} ${getUnitLabel(row.lengthUnit)}</td>
          <td class="tc c">${width} ${getUnitLabel(row.widthUnit)}</td>
          <td class="tc c">${height} ${getUnitLabel(row.heightUnit)}</td>
          <td class="tc c">${cft.toFixed(3)}</td>
          <td class="tc c">${qty}</td>
          <td class="tc c b">${totalCft.toFixed(3)}</td>
          <td class="tc r">₹${formatINR(rate)}</td>
          <td class="tc r b hl">₹${formatINR(amount)}</td>
        </tr>`;
    }
  });

  if (rowNumber === 0) {
    rowsHTML = '<tr><td colspan="9" class="empty">No items added</td></tr>';
  }

  let chargesHtml = '';
  safeCharges.forEach((charge) => {
    const amt = parseFloat(charge.amount) || 0;
    if (amt > 0) {
      chargesHtml += `
        <div class="ch-item">
          <span class="ch-label">${sanitizeForHTML(charge.label || 'Charge')}</span>
          <span class="ch-amt ${charge.type === 'minus' ? 'ded' : 'add'}">
            ${charge.type === 'minus' ? '−' : '+'} ₹${formatINR(amt)}
          </span>
        </div>`;
    }
  });

  const t = {
    subtotal: safeTotals.subtotal || grandTotalAmount,
    misc: safeTotals.misc || 0,
    gstAmt: safeTotals.gstAmt || 0,
    grandTotal: safeTotals.grandTotal || grandTotalAmount,
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${sanitizeForHTML(displayBuyerName)}</title>
  <style>
    @page { margin: 0; size: A4 portrait; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      color: #444;
      background: #F5F5F0;
      padding: 25px;
      line-height: 1.5;
    }

    /* ── HEADER ── */
    .hdr {
      text-align: center;
      padding: 24px 0;
      margin-bottom: 24px;
      background: #F0F2E4;
      border-radius: 10px;
      border: 1px solid #D8DDB8;
    }
    .hdr h1 {
      font-size: 30px;
      font-weight: 800;
      letter-spacing: 4px;
      margin-bottom: 4px;
      color: #4A5020;
    }
    .hdr p {
      font-size: 11px;
      color: #7A8040;
      letter-spacing: 1px;
    }

    /* ── INFO BOXES ── */
    .info-c {
      display: flex;
      justify-content: space-between;
      margin-bottom: 22px;
      gap: 18px;
    }
    .info-b {
      flex: 1;
      border: 1px solid #E0E0D8;
      border-radius: 10px;
      padding: 14px;
      background: #FAFAF8;
    }
    .info-b.hl {
      border-color: #C8CDA0;
      background: #F5F6ED;
    }
    .info-t {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      color: #7A8040;
      border-bottom: 1.5px solid #D8DDB8;
      padding-bottom: 7px;
      margin-bottom: 10px;
      letter-spacing: 0.8px;
    }
    .info-r {
      display: flex;
      padding: 5px 0;
      border-bottom: 1px dashed #E8E8E0;
    }
    .info-r:last-child { border-bottom: none; }
    .info-l {
      width: 90px;
      font-weight: 600;
      color: #888;
      font-size: 11px;
    }
    .info-v {
      flex: 1;
      color: #444;
      font-weight: 500;
      font-size: 11px;
    }
    .info-v.b { font-weight: 700; }

    /* ── SECTION TITLE ── */
    .s-title {
      font-weight: 700;
      font-size: 13px;
      color: #7A8040;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding-bottom: 5px;
      border-bottom: 1.5px solid #D8DDB8;
      display: inline-block;
    }

    /* ── TABLE ── */
    .tbl {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .tbl th {
      background: #F5F6ED;
      color: #7A8040;
      padding: 11px 6px;
      text-align: center;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #E0E0D8;
    }
    .tc {
      border: 1px solid #E8E8E0;
      padding: 9px 6px;
      font-size: 11px;
    }
    .tc.c { text-align: center; }
    .tc.l { text-align: left; padding-left: 10px; }
    .tc.r { text-align: right; padding-right: 10px; }
    .tc.b { font-weight: 700; }
    .tc.hl {
      background: #F5F6ED;
      color: #5A6030;
      font-weight: 700;
    }
    .tbl tr:nth-child(even) td { background-color: #FAFAF7; }
    .tbl tr:hover td { background-color: #F5F6ED; }
    .t-row td {
      background: #F0F2E4 !important;
      font-weight: 700;
      color: #4A5020;
      padding: 11px 6px;
      font-size: 12px;
      border-top: 2px solid #D8DDB8;
    }
    .empty {
      text-align: center;
      padding: 36px;
      color: #BBB;
      font-style: italic;
      border: 1px solid #E0E0D8;
    }

    /* ── PAYMENT SUMMARY ── */
    .pay-c { margin-top: 28px; page-break-inside: avoid; }
    .pay-b {
      border: 1px solid #D8DDB8;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .pay-h {
      background: #F0F2E4;
      color: #4A5020;
      padding: 14px 20px;
      text-align: center;
      border-bottom: 1px solid #D8DDB8;
    }
    .pay-h h2 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }
    .pay-bd {
      padding: 18px;
      background: #FAFAF8;
    }
    .pay-r {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px dashed #E8E8E0;
      font-size: 13px;
    }
    .pay-r:last-child { border-bottom: none; }
    .pay-l { color: #888; font-weight: 500; }
    .pay-v { font-weight: 600; color: #444; font-size: 13px; }

    /* ── CHARGES ── */
    .ch-sec {
      background: #F5F6ED;
      border-radius: 8px;
      padding: 13px;
      margin: 12px 0;
      border: 1px solid #E4E8D0;
    }
    .ch-t {
      font-weight: 700;
      color: #7A8040;
      margin-bottom: 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ch-item {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      border-bottom: 1px dashed #E0E0D8;
      font-size: 12px;
    }
    .ch-item:last-child { border-bottom: none; }
    .ch-label { color: #888; }
    .ch-amt { font-weight: 600; }
    .ch-amt.add { color: #6B8030; }
    .ch-amt.ded { color: #D06060; }

    /* ── Balance ── */
    .gt-sec {
      background: #F0F2E4;
      margin: 0 -18px -18px -18px;
      padding: 22px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #D8DDB8;
    }
    .gt-l {
      color: #4A5020;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .gt-v {
      color: #3A4A18;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    /* ── FOOTER ── */
    .ftr {
      margin-top: 36px;
      padding-top: 22px;
      border-top: 1px solid #E0E0D8;
    }
    .sig-c {
      display: flex;
      justify-content: space-between;
      margin-top: 46px;
    }
    .sig-b { width: 30%; text-align: center; }
    .sig-l {
      border-top: 1.5px solid #888;
      width: 140px;
      margin: 0 auto;
      padding-top: 7px;
      font-size: 11px;
      color: #999;
      font-weight: 500;
    }
    .ty {
      text-align: center;
      margin-top: 26px;
      padding: 14px;
      background: #F5F6ED;
      border-radius: 8px;
      border: 1px solid #E4E8D0;
    }
    .ty p {
      color: #5A6030;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.8px;
    }
    .ty small {
      color: #AAA;
      font-size: 10px;
    }
  </style>
</head>
<body>

  <div class="hdr">
    <h1>INVOICE</h1>
    <p>Tax Invoice / Bill of Supply</p>
  </div>

  <div class="info-c">
    <div class="info-b">
      <div class="info-t">Invoice Details</div>
      <div class="info-r">
        <span class="info-l">Invoice No:</span>
        <span class="info-v b">${sanitizeForHTML(record.invoiceNumber)}</span>
      </div>
      <div class="info-r">
        <span class="info-l">Date:</span>
        <span class="info-v">${sanitizeForHTML(record.date)}</span>
      </div>
    </div>
    <div class="info-b hl">
      <div class="info-t">Party Details</div>
      <div class="info-r">
        <span class="info-l">Buyer:</span>
        <span class="info-v b">${sanitizeForHTML(displayBuyerName)}</span>
      </div>
      <div class="info-r">
        <span class="info-l">Seller:</span>
        <span class="info-v">${sanitizeForHTML(record.soldByName || 'N/A')}</span>
      </div>
    </div>
  </div>

  <div class="s-title">Material Details</div>
  <table class="tbl">
    <thead>
      <tr>
        <th style="width:4%;">#</th>
        <th style="width:15%;text-align:left;">Item Name</th>
        <th style="width:9%;">Length</th>
        <th style="width:9%;">Width</th>
        <th style="width:9%;">Height</th>
        <th style="width:8%;">CFT/pc</th>
        <th style="width:7%;">Qty</th>
        <th style="width:11%;">Total CFT</th>
        <th style="width:12%;">Rate</th>
        <th style="width:16%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
      ${rowNumber > 0 ? `
        <tr class="t-row">
          <td colspan="7" style="text-align:right;padding-right:14px;">SUBTOTAL</td>
          <td style="text-align:center;">${grandTotalTCFT.toFixed(3)} CFT</td>
          <td></td>
          <td style="text-align:right;padding-right:10px;">₹${formatINR(grandTotalAmount)}</td>
        </tr>` : ''}
    </tbody>
  </table>

  <div class="pay-c">
    <div class="pay-b">
      <div class="pay-h"><h2>Payment Summary</h2></div>
      <div class="pay-bd">

        <div class="pay-r">
          <span class="pay-l">Subtotal Amount</span>
          <span class="pay-v">₹${formatINR(t.subtotal)}</span>
        </div>

        ${chargesHtml ? `
          <div class="ch-sec">
            <div class="ch-t">Adjustments</div>
            ${chargesHtml}
          </div>` : ''}

        ${t.misc !== 0 ? `
          <div class="pay-r">
            <span class="pay-l">Net Adjustments</span>
            <span class="pay-v" style="color:${t.misc >= 0 ? '#6B8030' : '#D06060'}">
              ${t.misc >= 0 ? '+' : ''}₹${formatINR(t.misc)}
            </span>
          </div>` : ''}

        ${(record.gst > 0 || record.gstManualAmt > 0) && t.gstAmt > 0 ? `
          <div class="pay-r">
            <span class="pay-l">GST${record.gst > 0 ? ` @ ${record.gst}%` : ''}</span>
            <span class="pay-v">₹${formatINR(t.gstAmt)}</span>
          </div>` : ''}

        <div class="gt-sec">
          <span class="gt-l">Balance</span>
          <span class="gt-v">₹${formatINR(t.grandTotal)}</span>
        </div>

      </div>
    </div>
  </div>

  <div class="ftr">
    <div class="sig-c">
      <div class="sig-b"><div class="sig-l">Customer Signature</div></div>
      <div class="sig-b"><div class="sig-l">Authorized Signature</div></div>
    </div>
    <div class="ty">
      <p>Thank You For Your Business!</p>
      <small>This is a computer generated invoice</small>
    </div>
  </div>

</body>
</html>`;
};

// ─── PDF DOWNLOAD ───
export const downloadPDF = (record) => {
  const html = generateInvoiceHTML(record);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } else {
    alert('Please allow popups to generate PDF');
  }
};