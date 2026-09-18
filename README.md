# MERN CRM

A full-stack Customer Relationship Management system built to practice real-world patterns: authentication, REST API design, a component-based React frontend, automated testing, containerization and CI/CD.

## Live Demo

🔗 **[https://mern-crm-frontend-dfos.onrender.com](https://mern-crm-frontend-dfos.onrender.com)**

Test credentials:
- Email: `demo@example.com`
- Password: `Demo12345`

*(Free-tier hosting — the backend may take ~30s to wake up on first request.)*

## Features

- 🔐 JWT authentication (register, login, logout)
- ⏱️ Automatic logout after 5 minutes of inactivity, with a warning modal one minute before the session expires
- 👤 Customer management: create, view, edit, delete
- 📋 Interaction log per customer (calls, meetings, emails, video calls)
- 🔎 Search by company name, NIP or city (debounced, case-insensitive, handled server-side)
- ↕️ Paginated and sortable customer list
- 🌗 Light/dark theme: follows the system preference by default, with a manual toggle remembered between visits
- 📱 Responsive layout: the customer table turns into a card list on small screens

## Tech Stack

| Area | Technologies |
|---|---|
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt |
| Frontend | React, Vite, React Router, Axios, React Bootstrap |
| Testing | Jest, Supertest, mongodb-memory-server (backend); Vitest, Testing Library (frontend) |
| DevOps | Docker (multi-stage), Docker Compose, GitHub Actions, GitHub Container Registry |
| Hosting | Render (backend + static frontend), MongoDB Atlas |

## Project Structure

```text
mern-crm/
├── .github/workflows/
│   ├── ci.yml                    # tests + Docker build validation on every PR
│   └── cd.yml                    # publishes Docker images to GHCR on push to main
├── docker-compose.yml            # local dev: MongoDB + backend + frontend
├── backend/                      # Express REST API
│   ├── server.js                 # entry point: DB connection + listen
│   ├── app.js                    # Express app (middleware, routes), importable in tests
│   ├── Dockerfile                # multi-stage: dev / production
│   ├── app/
│   │   ├── configs/              # database connection
│   │   ├── controllers/          # request handlers (user, customer, action)
│   │   ├── middlewares/          # JWT auth middleware
│   │   ├── models/               # Mongoose schemas (User, Customer, Action)
│   │   └── router/               # route definitions
│   └── tests/                    # Jest + Supertest, mirrors app/
│       ├── setup.js              # in-memory MongoDB helpers
│       └── app/controllers/
└── frontend/                     # React (Vite) client
    ├── Dockerfile                # multi-stage: dev (Vite) / production (nginx)
    ├── src/
    │   ├── apiService/           # Axios clients (user, customer, action)
    │   ├── components/           # pages and UI components
    │   │   └── modals/           # delete, action form, session-timeout modals
    │   ├── hooks/                # useInactivityLogout, useDebouncedValue, useTheme
    │   ├── helpers/              # formatting and cookie helpers
    │   ├── App.jsx               # routing, navbar, session handling
    │   └── index.css, App.css    # design system (CSS variables, light/dark themes)
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
| `backend/.env` | `FRONTEND_URL` | Allowed CORS origin (the frontend's URL) |
| `frontend/.env` | `VITE_API_URL` | Backend URL (defaults to `http://localhost:5070`) |

## API Overview

All endpoints except `/auth/*` require the JWT in the `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register a user |
| POST | `/auth/login` | Log in, returns a JWT |
| POST | `/auth/logout` | Log out |
| GET | `/customers` | List customers. Query: `page`, `limit`, `sort`, `order`, `search` |
| GET | `/customers/:id` | Get one customer |
| POST | `/customers/add` | Create a customer |
| PUT | `/customers/edit/:id` | Update a customer |
| DELETE | `/customers/delete/:id` | Delete a customer |
| GET | `/actions/:customerId` | List a customer's interactions |
| POST | `/actions/add` | Add an interaction |
| PUT | `/actions/edit/:id` | Update an interaction |
| DELETE | `/actions/delete/:id` | Delete an interaction |

## Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test -- run
```

Backend tests run against an in-memory MongoDB, so no database is needed. Frontend tests cover the custom hooks (session timeout, debounce, theme), formatting helpers and the pagination component.

## CI/CD

- **CI** (`.github/workflows/ci.yml`) runs on every pull request to `main`: backend tests, frontend tests plus a production build, and validation that both production Docker images build. `main` is protected, so a PR can only be merged when all three checks pass.
- **CD** (`.github/workflows/cd.yml`) runs on every push to `main` and publishes the production images to GitHub Container Registry (`ghcr.io/harrysad/mern-crm-backend` and `ghcr.io/harrysad/mern-crm-frontend`).
- **Deployment:** Render deploys the backend (Docker) and the frontend (static site) automatically once CI passes; the production database is MongoDB Atlas.
- **Workflow:** every change goes through a feature branch and a pull request, with [Conventional Commits](https://www.conventionalcommits.org/) messages.

## What I'd Improve Next

- Role-based access (admin vs. read-only user)
- End-to-end tests (Playwright) and component tests for the customer list and forms
- Store the JWT in an httpOnly cookie instead of a JavaScript-readable one
- API documentation (OpenAPI/Swagger)