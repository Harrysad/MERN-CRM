# MERN CRM

A full-stack Customer Relationship Management system built to practice real-world patterns: authentication, REST API design, a component-based React frontend, automated testing, containerization and CI/CD.

## Live Demo

🔗 **[https://mern-crm-frontend-dfos.onrender.com](https://mern-crm-frontend-dfos.onrender.com)**

Test credentials:
- Email: `demo@example.com`
- Password: `Demo12345`

The demo account is **read-only**: every feature (including the add/edit forms and the NIP-based autofill) is fully usable, but saving, editing or deleting is blocked with an inline message, so the demo data always stays intact for the next visitor.

*(Free-tier hosting — the backend may take about a minute to wake up on first request.)*

Want to try the signup flow? Register your own account (a disposable address from a service like [temp-mail.org](https://temp-mail.org/pl/) works fine) and confirm it with the link sent to that address. Every account except the demo one is deleted automatically 3 days after it was created, together with its data.

## Features

- 🔐 JWT authentication (register, login, logout)
- 🛡️ Role-based access control: every account is `admin` over its own data by default; a `viewer` role can read everything but is blocked from creating, editing or deleting records
- 🔒 Per-account data isolation: every customer and interaction belongs to the account that created it — no account can see, edit or delete another account's data
- ✉️ Email verification: a new account must confirm its address through a link sent by email (Resend); until then it is read-only. The link can be re-sent after a 60-second cooldown
- 🧹 Automatic cleanup: every account except the demo one is deleted with all its data 3 days after it was created, by a scheduled GitHub Actions workflow that calls a secret-protected endpoint; the owner is notified by email
- 🏢 NIP-based company autofill: looks up a company by NIP in Poland's official VAT payer registry and fills in the name and address automatically
- ⏱️ Automatic logout after 5 minutes of inactivity, with a warning modal one minute before the session expires
- 👤 Customer management: create, view, edit, delete
- 📋 Interaction log per customer (calls, meetings, emails, video calls)
- 🔎 Search by company name, NIP or city (debounced, case-insensitive, handled server-side) from a pill-style search bar with a clear button
- ↕️ Paginated and sortable customer list, with a selectable page size (5 / 10 / 25 / 50) remembered between visits
- 🌗 Light/dark theme: follows the system preference by default, with a manual toggle remembered between visits; frosted-glass surfaces over a soft gradient background
- 📱 Responsive layout: the customer table turns into a card list on small screens, and the theme toggle and logout move into the burger menu

## Tech Stack

| Area | Technologies |
|---|---|
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt |
| Frontend | React, Vite, React Router, Axios, React Bootstrap |
| Testing | Jest, Supertest, mongodb-memory-server (backend); Vitest, Testing Library (frontend) |
| DevOps | Docker (multi-stage), Docker Compose, GitHub Actions, GitHub Container Registry |
| Hosting | Render (backend + static frontend), MongoDB Atlas |
| External API | Poland's VAT payer registry ("biała lista podatników", wl-api.mf.gov.pl), Resend (transactional email) |

## Project Structure

```text
mern-crm/
├── .github/workflows/
│   ├── ci.yml                    # tests + Docker build validation on every PR
│   ├── cd.yml                    # publishes Docker images to GHCR on push to main
│   └── cleanup-accounts.yml      # daily cleanup of expired accounts
├── docker-compose.yml            # local dev: MongoDB + backend + frontend
├── backend/                      # Express REST API
│   ├── server.js                 # entry point: DB connection + listen
│   ├── app.js                    # Express app (middleware, routes), importable in tests
│   ├── Dockerfile                # multi-stage: dev / production
│   ├── app/
│   │   ├── configs/              # database connection
│   │   ├── controllers/          # request handlers (user, customer, action, NIP lookup, internal cleanup)
│   │   ├── middlewares/          # JWT auth, write access (role + email verification), internal secret check
│   │   ├── models/               # Mongoose schemas (User with role, Customer, Action — both scoped by owner)
│   │   ├── router/               # route definitions
│   │   └── services/             # email sending (Resend) and account retention
│   └── tests/                    # Jest + Supertest, mirrors app/
│       ├── setup.js              # in-memory MongoDB helpers
│       └── app/controllers/
└── frontend/                     # React (Vite) client
    ├── Dockerfile                # multi-stage: dev (Vite) / production (nginx)
    ├── src/
    │   ├── apiService/           # Axios clients (user, customer, action, NIP lookup)
    │   ├── components/           # pages and UI components
    │   │   └── modals/           # delete, action form, session-timeout, resend-verification, signup-success modals
    │   ├── hooks/                # useInactivityLogout, useDebouncedValue, useTheme, usePageSize, useCountdown
    │   ├── helpers/              # formatting and cookie helpers
    │   ├── App.jsx               # routing, navbar, session handling
    │   └── index.css, App.css    # design system (CSS variables, light/dark themes, glass surfaces)
    └── tests/                    # Vitest + Testing Library, mirrors src/
        └── src/
            ├── components/
            ├── helpers/
            └── hooks/
```

## Run with Docker (recommended)

No local Node.js or MongoDB installation required.

```bash
docker compose up
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5070

Docker Compose starts its own MongoDB container, so no external database or account is needed. Data persists between runs. To fully reset the local database:

```bash
docker compose down -v
```

Without a `RESEND_API_KEY`, verification emails are not sent: the link is printed in the backend log (`docker compose logs backend`), which is all you need to confirm an account registered locally.

## Run without Docker

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

This requires a running MongoDB instance (set `MONGO_URL` in `backend/.env`).

### Environment variables

| File | Variable | Description |
|---|---|---|
| `backend/.env` | `PORT` | Port the API listens on |
| `backend/.env` | `MONGO_URL` | MongoDB connection string |
| `backend/.env` | `JWT_SECRET` | Secret used to sign JWTs |
| `backend/.env` | `FRONTEND_URL` | Allowed CORS origin and base URL of the links sent by email (the frontend's URL) |
| `backend/.env` | `RESEND_API_KEY` | Resend API key. When empty (local development), emails are printed to the backend console instead of being sent |
| `backend/.env` | `EMAIL_FROM` | Sender address, on a domain verified in Resend |
| `backend/.env` | `INTERNAL_CLEANUP_SECRET` | Shared secret required by the internal cleanup endpoint (`X-Internal-Secret` header) |
| `frontend/.env` | `VITE_API_URL` | Backend URL (defaults to `http://localhost:5070`) |

The scheduled cleanup workflow additionally needs two GitHub repository secrets: `BACKEND_URL` and `INTERNAL_CLEANUP_SECRET` (the same value as on the server).

## API Overview

All endpoints except `/auth/signup`, `/auth/login`, `/auth/verify/:token` and `/internal/*` require the JWT in the `Authorization` header. Every account is scoped to its own data — a customer or interaction created by one account is never visible to another. New accounts get the `admin` role by default; a `viewer`-role account can use every `GET` endpoint but gets a `403` on `POST`/`PUT`/`DELETE`. Until its email address is confirmed, an account is treated the same way: reads work, writes return `403`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register a user |
| POST | `/auth/login` | Log in, returns a JWT |
| POST | `/auth/logout` | Log out |
| GET | `/auth/verify/:token` | Confirm an email address with the token from the verification email |
| POST | `/auth/resend-verification` | Send a new verification link (60 s cooldown) |
| GET | `/auth/verification-status` | Check whether the current account is verified |
| GET | `/customers` | List customers. Query: `page`, `limit` (max 100), `sort`, `order`, `search` |
| GET | `/customers/:id` | Get one customer |
| POST | `/customers/add` | Create a customer |
| PUT | `/customers/edit/:id` | Update a customer |
| DELETE | `/customers/delete/:id` | Delete a customer |
| GET | `/actions/:customerId` | List a customer's interactions |
| POST | `/actions/add` | Add an interaction |
| PUT | `/actions/edit/:id` | Update an interaction |
| DELETE | `/actions/delete/:id` | Delete an interaction |
| GET | `/nip/:nip` | Look up a company's name and address by NIP in Poland's VAT payer registry (available to every role) |
| POST | `/internal/cleanup-accounts` | Delete accounts older than 3 days, except the demo one. Not for users: requires the `X-Internal-Secret` header and is called by the scheduled workflow |

## Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test -- run
```

Backend tests run against an in-memory MongoDB, so no database is needed. Frontend tests cover the custom hooks (session timeout, debounce, theme, page size), formatting helpers and the pagination and toolbar components. Backend tests also cover per-account data isolation, role-based write restrictions, and the NIP-lookup address parsing. Backend tests also cover email verification (with the email service mocked), the resend cooldown and the account cleanup.

## CI/CD

- **CI** (`.github/workflows/ci.yml`) runs on every pull request to `main`: backend tests, frontend tests plus a production build, and validation that both production Docker images build. `main` is protected, so a PR can only be merged when all three checks pass.
- **CD** (`.github/workflows/cd.yml`) runs on every push to `main` and publishes the production images to GitHub Container Registry (`ghcr.io/harrysad/mern-crm-backend` and `ghcr.io/harrysad/mern-crm-frontend`).
- **Deployment:** Render deploys the backend (Docker) and the frontend (static site) automatically once CI passes; the production database is MongoDB Atlas.
- **Scheduled cleanup** (`.github/workflows/cleanup-accounts.yml`) runs daily at 03:00 UTC and can also be started manually. It calls the backend's internal cleanup endpoint with a shared secret, which deletes every account older than 3 days except the demo one, together with its data. It retries so it can cope with the free Render instance waking up.
- **Workflow:** every change goes through a feature branch and a pull request, with [Conventional Commits](https://www.conventionalcommits.org/) messages.

## What I'd Improve Next

- End-to-end tests (Playwright) and component tests for the customer list and forms
- Store the JWT in an httpOnly cookie instead of a JavaScript-readable one
- API documentation (OpenAPI/Swagger)
- Send emails through a queue and surface delivery failures (verification and deletion emails are currently fire-and-forget)