# Storyliner

## Overview

Storyliner is a brand story crafting tool that helps users create SEO-optimized brand descriptions with real-time keyword tracking. The story sits centered as the "window," with 8 keyword slots framing the sides. Users write a 160-character brand story (SEO meta length) and get live feedback as keywords appear. Clickable suggestion chips drop keywords into open discovery slots — by default ("From my story") they are pulled client-side straight from the words the user has already typed; an optional "Related words" mode queries the free Datamuse API. A built-in, rule-based Story Coach gives Aristotelian guidance — story arc (hook/tension/payoff) plus ethos/pathos/logos meters — and a free offline thesaurus helps tighten wording. Dancing unicorns celebrate when 4+ keywords are woven in (a natural target — your two anchors plus two real supporting signals; many honest brands only have a handful, and cramming in more risks keyword stuffing). A one-click "See a perfect example" loads a Don McLean meta description that demonstrates an anchored, honest, fully-woven story.

## Optional AI (no managed/paid provider required)

AI coaching is optional and off by default — the free rule-based coach always works. To enable real AI rewrites, set these environment variables to any OpenAI-compatible endpoint (LM Studio, Ollama, llama.cpp, Google Gemini free tier, or Groq):

- `AI_BASE_URL` — e.g. `https://generativelanguage.googleapis.com/v1beta/openai` (Gemini) or your self-hosted server's base URL
- `AI_MODEL` — the model name to request
- `AI_API_KEY` — optional bearer token (a free Gemini/Groq key works)

When set, `/api/ai/status` reports enabled and the UI exposes "Get AI rewrite." The server calls `{AI_BASE_URL}/chat/completions` directly (no SDK). Note: the model must be reachable from the deployment — `localhost` endpoints won't work in production.

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