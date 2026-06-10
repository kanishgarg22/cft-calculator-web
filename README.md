# CFT Calculator

A fast, error-proof **cubic-feet (CFT) billing calculator** for timber, plywood, furniture and other material that is priced by volume. Enter each item's dimensions, quantity and rate — the app does every calculation for you and produces a clean, printable estimated bill / invoice.

> **Why it exists:** Working out CFT by hand is slow and easy to get wrong. A typical bill takes **10+ minutes** to total up manually, and a single arithmetic slip means starting the whole sheet over. This tool removes the human error from those calculations: you just **fill in the measurements, it calculates instantly, and gives the customer an estimated bill in about 2 minutes.**

---

## What it does

- **Accurate CFT calculation** from Length × Width × Height, with mixed units per dimension.
- **Multiple units supported** — Inches (`In`), Feet (`Ft`), Millimetres (`Mm`) and **Soot (`St`, 1 soot = ⅛ inch)** — so you can enter measurements exactly the way they're written on the material.
- **Per-row totals** — CFT per piece, total CFT (× quantity), rate per CFT and line amount, all updating live as you type.
- **GST** and unlimited **adjustments** (add or subtract charges such as transport, loading, or a discount).
- **Indian-format currency** (₹ 1,23,456.78 lakh/crore grouping).
- **One-click printable invoice** (Generate PDF) with buyer/seller details, an itemised table and a payment summary.
- **Saved records** — every calculation is stored locally and can be viewed, edited or deleted later.
- **Input guards** that prevent the common mistakes a paper sheet can't: junk characters are stripped, a blank quantity is treated as **1** (so a priced row never silently totals to ₹0), and you can't generate a bill with no items.

## How the calculation works

Every dimension is first converted to inches, then:

```
CFT (per piece) = (Length_in × Width_in × Height_in) / 1728      // 1728 = cubic inches in one cubic foot
Total CFT       = CFT × Quantity
Line Amount     = Total CFT × Rate per CFT
Subtotal        = Σ (Line Amounts)
GST Amount      = Subtotal × (GST % / 100)
Balance (Total) = Subtotal + GST + Net Adjustments
```

Unit conversions used:

| Unit | Code | Value in inches |
|------|------|-----------------|
| Inch | `In` | 1 |
| Foot | `Ft` | 12 |
| Millimetre | `Mm` | 0.0393701 |
| Soot | `St` | 0.125 |

## Tech stack

- **React 19** (Create React App / `react-scripts`)
- **React Router 7** for the New / Records / Detail screens
- **Browser `localStorage`** for saving records (no backend or sign-in required)
- Invoices are rendered as self-contained HTML and printed via the browser's print-to-PDF

## Getting started

Requires **Node.js** and npm.

```bash
# from the project folder
npm install      # install dependencies
npm start        # run the dev server at http://localhost:3000
npm run build    # create an optimized production build in ./build
```

## Using the app

1. **New Calculation** — fill in the date, invoice number, buyer and seller.
2. **Items** — for each row enter the item name, Length / Width / Height (pick the unit per field), Quantity and Rate. CFT, Total CFT and Amount fill in automatically. Use **+ Add Row** for more items.
3. **GST & Adjustments** — set a GST % and add any extra charges or discounts.
4. **Generate PDF** to print/save the estimated bill, or **Save Record** to keep it.
5. **Records** — reopen any saved calculation to view, edit or re-print it.

> Records are stored in your browser only. Clearing the browser's site data will remove saved calculations, and they don't sync between devices.

## Project structure

```
src/
├── App.js                      # routes + navbar
├── index.js                    # React entry point
├── helpers/helpers.js          # units, CFT math, currency formatting, input sanitizers, invoice HTML
└── screens/
    ├── NewCalculationScreen.js # create / edit a calculation
    ├── RecordScreen.js         # list of saved records
    └── RecordDetailScreen.js   # view a single saved invoice
```

## Deployment

The production build in `./build` is a static site and can be hosted anywhere (Netlify, Vercel, GitHub Pages, or any static host):

```bash
npm run build
```

then serve the `build/` folder.
