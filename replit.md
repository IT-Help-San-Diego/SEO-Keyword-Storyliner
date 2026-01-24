# Storyliner

## Overview

Storyliner is a brand story crafting tool that helps users create SEO-optimized brand descriptions with real-time keyword tracking. Users input 8 SEO keywords and write a 160-character brand story, with visual feedback showing which keywords are incorporated into their narrative.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with hot module replacement
- **Theme**: Light/dark mode support via CSS variables and ThemeProvider context

### Backend Architecture
- **Framework**: Express.js 5 on Node.js
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Storage**: In-memory storage with interface abstraction (`IStorage`) for easy database migration
- **Validation**: Zod schemas shared between client and server

### Data Model
The core entity is `BrandStory`:
- `id`: UUID string
- `keywords`: Array of exactly 8 strings
- `story`: String with max 160 characters
- `matchedCount`: Number (0-8) of keywords found in story
- `createdAt`: ISO date string

### Build System
- Development: tsx for TypeScript execution, Vite dev server with HMR
- Production: esbuild bundles server code, Vite builds client to `dist/public`
- The build script bundles common dependencies to reduce cold start times

### Path Aliases
- `@/*` maps to `client/src/*`
- `@shared/*` maps to `shared/*`
- `@assets` maps to `attached_assets/`

## External Dependencies

### Database
- **Drizzle ORM** configured for PostgreSQL (schema in `shared/schema.ts`)
- **connect-pg-simple** for session storage
- Currently using in-memory storage; Postgres can be added by implementing the `IStorage` interface

### UI Components
- **shadcn/ui**: Full component library with Radix UI primitives
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management

### Development Tools
- **Replit plugins**: Runtime error overlay, cartographer, dev banner
- TypeScript with strict mode enabled