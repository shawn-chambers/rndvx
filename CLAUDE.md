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

**Database:**
```bash
# Create migration
cd packages/server && npx prisma migrate dev --name migration_name

# Open Prisma Studio
cd packages/server && npx prisma studio

# Reset database
cd packages/server && npx prisma migrate reset
```

## Future Considerations

- Testing framework setup (Jest, React Testing Library, Supertest)
- CI/CD pipeline
- Deployment strategy
- Real-time features (WebSockets for live updates)
- Push notifications for reminders
- Mobile responsiveness
- Progressive Web App (PWA) capabilities

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
