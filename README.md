# MERN CRM

A full-stack Customer Relationship Management system built to practice real-world patterns: authentication, REST API design, and a component-based React frontend.

## Features

- 🔐 JWT-based authentication (register, login, logout)
- 👤 Customer management — create, view, edit, delete
- 📋 Interaction log per customer (calls, meetings, emails, video calls)
- 🔎 Paginated & sortable customer list
- 🎨 Responsive UI with React Bootstrap

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
**Frontend:** React, Vite, React Router, Axios, React Bootstrap

## Project Structure

\```
mern-crm/
├── backend/     # Express REST API
└── frontend/    # React (Vite) client
\```

## Getting Started

\```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
\```

Requires a MongoDB connection string and JWT secret in `backend/.env`.

## What I'd Improve Next

- Add automated tests (Jest / React Testing Library)
- Add role-based access (admin vs. sales rep)
