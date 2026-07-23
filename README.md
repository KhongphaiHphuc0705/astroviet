# AstroViet

> A modern, scalable astrology platform built with Clean Architecture, designed to generate accurate Western Astrology charts and Vietnamese interpretations.

![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

---

## Overview

AstroViet is an astrology platform focused on **Western Astrology**.

The project aims to provide:

- Accurate natal chart calculations using Swiss Ephemeris
- Rich Vietnamese interpretations
- Clean and extensible REST API
- Modern developer experience
- Modular Clean Architecture

The backend is designed as a **Modular Monolith**, allowing future migration toward microservices if necessary.

---

## Features

### Astrology

- Natal Chart
- Synastry Chart
- Composite Chart
- Transit Chart
- Progression Chart
- Solar Return

### Chart Calculation

- Swiss Ephemeris
- Placidus House System
- Whole Sign House System
- Major Aspects
- Chiron
- Lilith (optional)
- Lunar Nodes (optional)

### User Management

- User Registration
- Login
- JWT Authentication
- Refresh Token Rotation
- Birth Profile Management

### Knowledge Base

- Astrology Articles
- Learning Resources
- Search

---

## Technology Stack

### Backend

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- Zod
- Pino
- JWT
- bcrypt
- Vitest
- Docker

### Frontend (Planned)

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod
- shadcn/ui

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- OpenAPI
- Swagger UI

---

## Project Architecture

The project follows **Clean Architecture** with a modular structure.

```
src
│
├── config
├── shared
├── modules
│   ├── health
│   ├── identity
│   ├── birth-profile
│   ├── chart
│   └── interpretation
│
├── app.ts
└── server.ts
```

Each module follows four layers:

- Domain
- Application
- Infrastructure
- Presentation

---

## Documentation

Project specifications are maintained before implementation.

Main documents include:

- Product Requirement Document (PRD)
- Astrology Domain Specification
- Astrology Engine Specification
- REST API Specification
- Database Design Specification
- Project Architecture Specification
- Backend Implementation Guide
- Coding Standards

---

## Getting Started

### Prerequisites

- Node.js 22 LTS
- Docker
- Docker Compose
- PostgreSQL (optional when using Docker)

---

### Installation

Clone the repository

```bash
git clone https://github.com/KhongphaiHphuc0705/astroviet.git

cd astroviet
```

Install dependencies

```bash
npm install
```

Copy environment variables

```bash
cp .env.example .env
```

Generate Prisma Client

```bash
npm run prisma:generate
```

Run database migrations

```bash
npm run prisma:migrate
```

Seed development database

```bash
npm run prisma:seed
```

---

## Running the Project

Development

```bash
npm run dev
```

Production

```bash
npm run build

npm start
```

Using Docker

```bash
docker compose up --build
```

---

## API Documentation

Generate OpenAPI

```bash
npm run generate:openapi
```

Swagger UI

```
http://localhost:3000/docs
```

---

## Testing

Run all tests

```bash
npm test
```

Coverage

```bash
npm run coverage
```

Lint

```bash
npm run lint
```

Type Checking

```bash
npm run typecheck
```

---

## Development Workflow

Current implementation roadmap

- ✅ Sprint 0 — Infrastructure
- 🚧 Sprint 1 — Identity Module
- ⏳ Sprint 2 — Birth Profile
- ⏳ Sprint 3 — Chart Engine
- ⏳ Sprint 4 — Interpretation Engine
- ⏳ Sprint 5 — Knowledge Base
- ⏳ Sprint 6 — Production Readiness

---

## Roadmap

Planned features

- Google OAuth
- Email Verification
- AI-generated Interpretation
- Chart Sharing
- Multi-language Support
- Mobile-friendly UI
- Redis Cache
- Monitoring
- Rate Limiting

---

## License

This project is licensed under the **MIT License**.

See the LICENSE file for details.

---

## Author

Developed by **Phuc Hoang**

GitHub:

https://github.com/KhongphaiHphuc0705
