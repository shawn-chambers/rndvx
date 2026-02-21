# rndvx

An app to get friends together to hang out that don't have the energy to decide when and where to hang out.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v14+
- npm v9+

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in `packages/server/`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/rndvx
PORT=3000
NODE_ENV=development
JWT_SECRET=change-me-in-production
```

Create a `.env` file in `packages/client/`:

```bash
VITE_API_URL=http://localhost:3000/api
```

### 3. Set up the database

```bash
# Run Prisma migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### 4. Start development servers

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run them separately:
npm run dev:client    # Frontend on http://localhost:5173
npm run dev:server    # Backend on http://localhost:3000
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:client` | Start frontend only |
| `npm run dev:server` | Start backend only |
| `npm run build` | Build all packages |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |

## Project Structure

```
rndvx/
├── packages/
│   ├── client/       # React frontend (Vite + TypeScript)
│   ├── server/       # Express backend (Node + TypeScript)
│   └── types/        # Shared TypeScript types
├── package.json      # Root workspace config
└── tsconfig.json     # Root TypeScript config
```

## Tech Stack

- **Frontend**: React, TypeScript, Redux Toolkit, Framer Motion, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
