# My Khata

A mobile-first digital khata / customer payment management web app.

## Features

- Dashboard for receivables, payables, overdue and due-today amounts
- Customer profiles with unique IDs
- Ledger and transaction history
- Money given, money received and payments
- Due dates and overdue tracking
- Internal Payment Behaviour Score (not an official CIBIL score)
- Search and filters
- Printable overall client report
- Local browser storage for a simple zero-backend starter
- Responsive desktop/mobile UI
- Light/dark theme

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Build for deployment

```bash
npm run build
```

The production files are generated in `dist/`.

## GitHub

Create a repository, upload all files, then connect the repository to Vercel, Netlify, or GitHub Pages.

## Data note

This starter stores data in the browser using localStorage. It is intended as a functional prototype. For a production multi-device/multi-user product, replace the storage layer with a secure backend such as Supabase and add authentication/row-level security.

## Payment Behaviour Score

The score is an internal score derived from recorded payment behaviour. It is NOT a CIBIL, TransUnion, Experian, Equifax, government, or official credit-bureau score.
