# FutureTrust Bank Frontend

This folder contains the customer-facing React application for the FutureTrust Bank platform. It presents the bank as a digital-first experience with a landing page, account summaries, transfer simulation, fraud monitoring, and real-time alerting.

## Overview

The frontend app is intentionally designed to look like a modern digital banking experience while keeping the underlying backend protocols intact. It communicates with the Spring services through the API gateway and uses mock fallback logic when the backend is temporarily unavailable.

The app is built with:

- React 19
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Framer Motion
- Recharts
- Axios

## Application structure

```text
banking-frontend/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   ├── assets/
│   ├── data/
│   │   └── mockData.js
│   ├── hooks/
│   │   ├── useFraudAlertStream.js
│   │   └── useSagaProgress.js
│   │
│   ├── services/
│   │   └── api.js
│   ├── store/
│   │   ├── accountSlice.js
│   │   ├── dashboardSlice.js
│   │   ├── fraudAlertSlice.js
│   │   ├── store.js
│   │   └── transactionSlice.js
│   └── ...
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
└── README.md
```

## Main UI areas

### Landing page

The root landing page showcases the FutureTrust Bank narrative: modern banking, fraud defense, and real-time security. It includes a hero section, trust indicators, feature blocks, and a narrative callout around intelligent financial protection.

### Dashboard and account views

The dashboard surfaces:

- account summary
- transfer activity
- fraud review context
- current account status
- recent alerts

### Transfer workflow

The transfer simulator uses Redux-driven flows to model a customer transfer journey. Actions and payloads are kept compatible with existing backend contracts while the labels and presentation are adapted for a banking audience.

### Fraud operations view

The fraud interface presents case review workflows, severity badges, and investigation states. Under the hood, the app continues to use the same data structure and API naming conventions required by the backend.

## State and data layer

### Redux store

The frontend uses a Redux store for transaction, account, dashboard, and fraud alert state. This keeps the experience responsive while making it easy to integrate with the backend API contract.

### API client and mock fallback

The app centralizes request handling in `src/services/api.js`.

Key behaviors:

- Reads `VITE_API_BASE_URL` with a localhost fallback of `http://localhost:8080/api`
- Uses `VITE_USE_MOCK=true` to switch to local mock data
- Falls back to in-memory mock responses when the backend is down or the network is unavailable
- Preserves internal endpoint paths and payloads even when the UI copy is banking-facing

## EventSource integration for fraud alerts

The real-time alerting hook is implemented in `src/hooks/useFraudAlertStream.js`.

It does the following:

- checks whether the feature is enabled
- switches to mock alert generation when `VITE_USE_MOCK` is enabled
- creates an `EventSource` connection to the backend fraud stream when live data is available
- dispatches incoming alert payloads into the Redux fraud store
- falls back to a periodic mock alert stream when the backend disconnects or is unavailable

This gives the app acceptable real-time behavior in both local demo mode and connected environments.

## Scripts

The project uses the following scripts from `package.json`:

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

## Environment configuration

Create a `.env` file in the `banking-frontend` folder if you need custom values.

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK=true
```

## Runtime notes

- The frontend depends on the gateway and services being reachable on localhost.
- If the backend is not started, the app still renders a mock banking experience and can continue to demonstrate the workflow.
- Internal API paths such as `/api/...` and Redux action payloads remain unchanged so the UI can communicate with the backend without breaking contracts.

## UX and branding approach

The interface is intentionally written to read as a real bank product experience instead of a technical system demo. This includes:

- customer-friendly account labels
- trust-oriented hero messaging
- fraud alert narration in plain language
- safe and polished terminology around balance movement and verification

The architecture remains unchanged under the hood; the front-end language is simply expressed in a more authentic banking voice.

## Suggested next steps

- connect the dashboard to live account endpoints once the backend is running
- add production-grade form validation around transfers and verification
- expand monitoring and business metrics for customer risk review
- add customer authentication and protected route handling for a real production deployment
