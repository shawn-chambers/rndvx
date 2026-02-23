# CLAUDE.md

## Project Overview

**rndvx** is a social/community application designed to help friends organize weekly meetings. The app facilitates location selection, attendance confirmation, reminders, and coordination for recurring friend gatherings.

## Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Redux** (react-redux) - State management
- **Framer Motion** - Animations and transitions
- **shadcn/ui** - Component library (Radix UI + Tailwind CSS)
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **Prisma** - Type-safe ORM and database toolkit

### Code Quality
- **ESLint** - Linting (Airbnb style guide)
- **Prettier** - Code formatting

### Project Structure
- **Monorepo** - Frontend and backend in same repository
- **Workspaces** - Organized as packages (client, server, shared types)

## Folder Structure

```
rndvx/
├── packages/
│   ├── client/          # React frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/  # shadcn/ui components + custom components
│   │   │   ├── pages/       # Page components
│   │   │   ├── store/       # Redux store, slices, actions
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── lib/         # Utilities and helpers
│   │   │   ├── styles/      # Global styles, Tailwind config
│   │   │   └── types/       # Frontend-specific types
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── server/          # Express backend (Node + TypeScript)
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── controllers/ # Business logic
│   │   │   ├── middleware/  # Express middleware (auth, validation, etc.)
│   │   │   ├── services/    # Business services
│   │   │   ├── types/       # Backend-specific types
│   │   │   └── index.ts     # Server entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma # Prisma schema
│   │   └── package.json
│   │
│   └── types/           # Shared types between client and server
│       ├── src/
│       │   └── index.ts     # Shared type definitions
│       └── package.json
│
├── package.json         # Root package.json with workspaces
├── .eslintrc.js         # ESLint config (Airbnb)
├── .prettierrc          # Prettier config
├── tsconfig.json        # Root TypeScript config
└── CLAUDE.md
```

## Core Features

### Current/Planned
- User profiles and authentication
- Weekly meeting organization
- Location selection/voting
- Attendance confirmation
- Meeting reminders
- More features to be iterated

## Architecture

### API Design
- **REST API** - Traditional RESTful endpoints
- Communication between React frontend and Express backend

### Authentication
- User login/registration system
- Token-based authentication (implementation details TBD)

### State Management
- Redux for global application state
- Consider organizing by feature slices (meetings, users, locations, etc.)

## Database Schema Considerations

### Key Entities (Initial)
- **Users** - Profile information, authentication credentials
- **Meetings** - Meeting details, date/time, recurring schedule
- **Locations** - Meeting places, location suggestions
- **Attendance** - RSVP tracking, confirmation status
- **Reminders** - Notification preferences and history

## Development Guidelines

### Code Style
- Follow **Airbnb JavaScript/TypeScript Style Guide**
- Use **ESLint** for linting enforcement
- Use **Prettier** for automatic code formatting
- Run linting before commits
- Consistent naming: camelCase for variables/functions, PascalCase for components/classes

### Code Organization
- Keep components modular and reusable
- Separate business logic from UI components
- Use TypeScript interfaces/types for data models
- Share common types via the `packages/types` workspace
- Maintain consistent naming conventions

### Frontend Patterns
- **Components**: Use shadcn/ui components as base, customize with Tailwind
- **State Management**: Redux Toolkit for global state (meetings, auth, users)
- **Local State**: React useState/useReducer for component-specific UI state
- **Animations**: Framer Motion for page transitions, micro-interactions, and gesture-based animations
- **Hooks**: Custom hooks for reusable logic (useAuth, useMeetings, etc.)
- **Styling**: Tailwind CSS utility classes, avoid inline styles
- **Mobile First**: Design for mobile by default, use `sm:` breakpoint for desktop enhancements. Use `min-h-dvh`, `active:` states, 16px min input font size, touch-friendly tap targets (min 44px)

### Backend Patterns
- **Routes**: RESTful structure (`/api/users`, `/api/meetings`, etc.)
- **Controllers**: Handle request/response logic
- **Services**: Business logic and data manipulation
- **Middleware**: Authentication, validation (Zod), error handling
- **Database**: Prisma ORM for all database operations
  - Define schema in `prisma/schema.prisma`
  - Use Prisma Client for type-safe queries
  - Run migrations for schema changes: `npx prisma migrate dev`
- **Environment**: Use `.env` files, never commit secrets

### API Conventions
```
GET    /api/resource       - List resources
GET    /api/resource/:id   - Get single resource
POST   /api/resource       - Create resource
PUT    /api/resource/:id   - Update resource
DELETE /api/resource/:id   - Delete resource
```

## Environment Setup

### Prerequisites
- Node.js v18+
- PostgreSQL v14+
- npm v9+

### Required Environment Variables

**Backend** (`packages/server/.env`):
```
DATABASE_URL=postgresql://user:password@localhost:5432/rndvx
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend** (`packages/client/.env`):
```
VITE_API_URL=http://localhost:3000/api
```

### Common Commands

**Development:**
```bash
# Install all dependencies
npm install

# Run Prisma migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Start frontend dev server (http://localhost:5173)
npm run dev:client

# Start backend dev server (http://localhost:3000)
npm run dev:server

# Run both concurrently
npm run dev
```

**Testing:**
```bash
# Run backend tests
cd packages/server && npx vitest run

# Run tests with coverage
cd packages/server && npx vitest run --coverage
```

**Database:**
```bash
# Create migration
cd packages/server && npx prisma migrate dev --name migration_name

# Open Prisma Studio
cd packages/server && npx prisma studio

# Reset database
cd packages/server && npx prisma migrate reset
```

## Testing

### Backend Tests
- **Framework**: vitest + supertest
- **Location**: `packages/server/src/__tests__/`
- **Run**: `cd packages/server && npx vitest run`
- **Helpers**:
  - `testApp.ts` — supertest app instance for integration tests
  - `auth.ts` — JWT token generation helpers
- **Coverage**: 111+ tests across auth, users, meetings, RSVPs, invites, groups, and places

## Security

The backend implements the following security measures:

- **Rate limiting**: Auth endpoints limited to 10 requests / 15 minutes
- **CORS**: Configured via `ALLOWED_ORIGINS` env var (comma-separated list)
- **Access control**: RSVP and meeting actions are membership-gated
- **JWT validation**: `JWT_SECRET` is validated at server startup — server will not start without it
- **Error sanitization**: In production, internal error messages are not leaked to clients
- **Meeting status transitions**: Status cannot be set directly to `CONFIRMED` or `PENDING_QUORUM`; transitions are enforced by the service layer

## Future Considerations

- Frontend testing (React Testing Library)
- CI/CD pipeline
- Deployment strategy
- Real-time features (WebSockets for live updates)
- Push notifications for reminders
- Mobile responsiveness
- Progressive Web App (PWA) capabilities

## Style Guide

See [STYLE_GUIDE.md](./STYLE_GUIDE.md) for the full design system exported from Figma.

### Quick Reference
- **Fonts**: Space Grotesk (headings), Raleway (body/UI)
- **Primary**: Lime Green `#9BD770`, Coral Pink `#FF705D`
- **Accents**: Sky Blue `#5EACFF`, Lavender `#D4B8E8`, Yellow `#F5E211`
- **Neutrals**: Cream `#F5F1E4`, Secondary `#E0DBCF`, Charcoal `#1A1A1A`, White `#FFFFFF`
- **Radius**: sm `4px`, md `8px`, lg `12px`, xl `16px`
- **Spacing**: 4 / 8 / 12 / 16 / 24 / 32 / 48 px

## Custom Agents

Specialized agents for rndvx development live in `.claude/agents/`. Use these as subagents via the Task tool for focused work.

### Frontend Agents

| Agent | File | Purpose |
|-------|------|---------|
| `rndvx-components` | [`.claude/agents/rndvx-components.md`](.claude/agents/rndvx-components.md) | Component architecture, page layouts, shared UI primitives |
| `rndvx-animation` | [`.claude/agents/rndvx-animation.md`](.claude/agents/rndvx-animation.md) | Framer Motion animations, scroll effects, page transitions |
| `rndvx-state` | [`.claude/agents/rndvx-state.md`](.claude/agents/rndvx-state.md) | Redux store design, slice architecture, normalization, selectors |
| `rndvx-refactoring` | [`.claude/agents/rndvx-refactoring.md`](.claude/agents/rndvx-refactoring.md) | Frontend code simplification, pattern enforcement, tech debt reduction |
| `rndvx-testing` | [`.claude/agents/rndvx-testing.md`](.claude/agents/rndvx-testing.md) | Frontend unit/integration tests for components, slices, and hooks |
| `rndvx-docs` | [`.claude/agents/rndvx-docs.md`](.claude/agents/rndvx-docs.md) | Frontend documentation — CLAUDE.md, STYLE_GUIDE.md, component JSDoc |

### Backend Agents

| Agent | File | Purpose |
|-------|------|---------|
| `rndvx-api` | [`.claude/agents/rndvx-api.md`](.claude/agents/rndvx-api.md) | Express endpoint creation — routes, controllers, services, Zod validation |
| `rndvx-database` | [`.claude/agents/rndvx-database.md`](.claude/agents/rndvx-database.md) | Prisma schema design, models, relations, migrations |
| `rndvx-backend-refactoring` | [`.claude/agents/rndvx-backend-refactoring.md`](.claude/agents/rndvx-backend-refactoring.md) | Backend code cleanup, layer enforcement, type safety |
| `rndvx-backend-tests` | [`.claude/agents/rndvx-backend-tests.md`](.claude/agents/rndvx-backend-tests.md) | Backend unit/integration tests — supertest, service mocks, validation |
| `rndvx-backend-docs` | [`.claude/agents/rndvx-backend-docs.md`](.claude/agents/rndvx-backend-docs.md) | API documentation, schema docs, service JSDoc |

### Cross-Cutting Agents

| Agent | File | Purpose |
|-------|------|---------|
| `rndvx-qa` | [`.claude/agents/rndvx-qa.md`](.claude/agents/rndvx-qa.md) | Security & performance review — produces a severity-rated report |
| `rndvx-a11y` | [`.claude/agents/rndvx-a11y.md`](.claude/agents/rndvx-a11y.md) | Accessibility auditor — WCAG 2.1 AA, contrast, keyboard nav, screen readers |
| `rndvx-cleanup` | [`.claude/agents/rndvx-cleanup.md`](.claude/agents/rndvx-cleanup.md) | Post-QA cleanup — fixes flagged issues, removes dead code, verifies builds |

### When to use which agent

**Building a new feature (recommended pipeline):**
1. `rndvx-database` — design schema + run migration
2. `rndvx-api` — create endpoints (can parallel with step 3)
3. `rndvx-components` — build UI, then `rndvx-animation` for motion
4. `rndvx-testing` + `rndvx-backend-tests` — write tests (parallel)
5. `rndvx-qa` — security & performance review
6. `rndvx-cleanup` — fix anything QA flagged
7. `rndvx-docs` + `rndvx-backend-docs` — update documentation (parallel)

**Quick tasks:**
- **Code review / cleanup**: `rndvx-refactoring` or `rndvx-backend-refactoring`
- **Parallel work**: Spawn multiple agents via TeamCreate for speed

## Notes for Claude

### General
- This is an iterative project - features will evolve over time
- Prioritize clean, maintainable code over premature optimization
- Ask questions when architectural decisions could go multiple ways
- TypeScript should be used throughout for type safety

### Tool-Specific Guidelines
- **Prisma**: Always generate types after schema changes (`npx prisma generate`)
- **shadcn/ui**: Install components via CLI (`npx shadcn-ui@latest add [component]`)
- **Redux Toolkit**: Use createSlice and createAsyncThunk patterns
- **Tailwind**: Use design tokens and avoid arbitrary values when possible
- **ESLint**: Fix linting errors before committing, run `npm run lint:fix`
- **Types**: Put shared types in `packages/types`, import from `@rndvx/types`

### Best Practices
- Write descriptive commit messages
- Keep components under 200 lines when possible
- Test API endpoints with proper error handling
- Validate all user inputs on both frontend and backend
- Use proper HTTP status codes in API responses
- Handle loading and error states in UI
