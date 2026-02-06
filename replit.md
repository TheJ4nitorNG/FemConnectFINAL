# FemConnect

## Overview

FemConnect is an 18+ dating/social connection web application designed as a safe, inclusive space for Femboys and admirers to meet and connect. The platform features user registration with age verification, profile browsing with role/location filters, and a respectful community-focused design with pastel/playful UI aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom pastel color palette, shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and UI animations
- **Forms**: React Hook Form with Zod resolver for validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod schemas for type-safe request/response validation
- **Authentication**: Passport.js with Local Strategy, cookie-based sessions using express-session
- **Password Security**: scrypt hashing with random salts

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: shared/schema.ts (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `db:push` command

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components including shadcn/ui
│   │   ├── hooks/        # Custom React hooks (auth, users, toast)
│   │   ├── pages/        # Route pages (Landing, Auth, Dashboard, Profile)
│   │   └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── auth.ts       # Passport authentication setup
│   ├── db.ts         # Database connection
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── static.ts     # Static file serving for production
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod schemas
```

### Key Design Patterns
- **Type-Safe API Contracts**: API routes defined with Zod schemas in shared/routes.ts, used by both frontend and backend
- **Database Abstraction**: IStorage interface in storage.ts allows for easy testing and potential storage backend changes
- **Protected Routes**: React wrapper component checks authentication state before rendering protected pages
- **Shadow Banning**: Users can be shadow banned without being notified (isShadowBanned field excluded from queries)

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via DATABASE_URL environment variable
- **connect-pg-simple**: Session storage in PostgreSQL (configured but currently using memory store)

### Authentication
- **passport**: Authentication middleware
- **passport-local**: Username/password authentication strategy
- **express-session**: Cookie-based session management

### Frontend Libraries
- **@radix-ui/***: Accessible UI primitives for shadcn/ui components
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library
- **wouter**: Lightweight routing
- **lucide-react**: Icon library

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development
- **drizzle-kit**: Database migration tooling

### Mobile App / PWA
- **Capacitor**: Native iOS/Android wrapper for App Store distribution
- **Service Worker**: Offline support with cache-first strategy for static assets
- **PWA Manifest**: Web app manifest for installable PWA functionality

## App Store Readiness

FemConnect is prepared for App Store distribution with:

### PWA Features
- Web app manifest (`client/public/manifest.json`)
- Service worker with offline support (`client/public/sw.js`)
- Install prompt component for mobile users
- App icons in all required sizes (72-512px)
- Splash screens for all iPhone and iPad devices

### Native App Wrapper
- Capacitor configuration (`capacitor.config.ts`)
- iOS-specific meta tags and settings
- See `APP_STORE_GUIDE.md` for detailed submission instructions

### Legal Pages
- Privacy Policy (`/privacy`)
- Terms of Service (`/terms`)
- Footer links on landing page

### Email Notifications
- Resend integration via Replit connector
- Password reset emails
- New message notifications
- Profile picture reminders
- Admin report notifications