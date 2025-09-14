# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev                 # Start dev server on localhost:3000
stripe listen --forward-to localhost:3000/webhook  # In separate terminal for Stripe webhooks
```

### Database Operations
```bash
pnpm prisma generate     # Generate Prisma client
pnpm prisma db push      # Sync database with schema
pnpm prisma migrate deploy  # Apply migrations
pnpm run seed           # Seed database with test data
pnpm prisma studio      # Open Prisma Studio GUI
pnpm prisma db push --force-reset  # Reset database (WARNING: destroys data)
```

### Build & Quality
```bash
pnpm build              # Build for production (includes prisma generate)
pnpm lint               # Run Next.js linter
pnpm test               # Run Jest tests
pnpm test:watch         # Run tests in watch mode
pnpm format             # Format code with Prettier
pnpm format:check       # Check formatting
```

### Docker
```bash
docker-compose up -d db  # Start PostgreSQL database
docker-compose down      # Stop all services
docker-compose down -v   # Stop and remove volumes
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js v5 (Beta)
- **Payments**: Stripe (payments, webhooks)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Email**: Nodemailer
- **TypeScript**: Strict mode enabled

### Directory Structure

**`/src/app`** - Next.js App Router pages and API routes
- `/admin` - Admin dashboard (protected)
- `/dashboard/host` - Host management interface
- `/api` - API endpoints organized by feature
- `/auth` - Authentication pages
- `/host/[id]` - Product detail pages

**`/src/lib/services`** - Business logic layer
- `product.service.ts` - Product CRUD operations
- `rents.service.ts` - Booking/rental management
- `stripe.ts` - Payment processing
- `email.service.ts` - Email notifications
- `validation.service.ts` - Product validation workflow

**`/src/components`** - Reusable React components
- `/ui/shadcnui` - shadcn/ui base components
- `/ui` - Custom UI components
- `/auth` - Authentication forms
- `/admin` - Admin-specific components

**`/src/hooks`** - Custom React hooks
- `useFavorites.ts` - Favorites management
- `useProductSearch.ts` - Product search logic
- `useReservations.ts` - Booking management

**`/prisma`** - Database schema and migrations
- `schema.prisma` - Database models
- `seed.js` - Test data seeding

### Key Patterns

**API Routes**: All API routes use standard Next.js route handlers with consistent error handling:
```typescript
export async function GET/POST/PUT/DELETE(request: Request) {
  try {
    // Business logic via services
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
```

**Service Layer**: Business logic isolated in `/lib/services`:
- Each service handles a specific domain (products, users, payments)
- Services interact with Prisma for database operations
- Services are imported by API routes and server components

**Authentication**: Uses NextAuth with Prisma adapter:
- Session-based authentication
- Role-based access (USER, HOST, ADMIN)
- Protected routes via middleware

**State Management**: 
- Server state: React Query for API data
- Client state: React hooks and context
- Forms: React Hook Form with Zod schemas

**Image Handling**: 
- Images stored as base64 strings in database
- Image compression on upload via `browser-image-compression`

### Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `EMAIL_LOGIN` / `EMAIL_PASSWORD` - SMTP credentials

### Test Credentials

After seeding:
- `pierre@pierre.pierre` / `password` 
- `marie@test.com` / `password`
- `jean@test.com` / `password`

### Key Features

**Product Management**:
- Multi-step product creation with validation workflow
- Image galleries with drag-and-drop reordering
- Equipment, services, extras, and highlights
- Pricing in EUR and MGA currencies

**Booking System**:
- Availability checking
- Extra services selection
- Stripe payment integration
- Commission calculation

**Admin Dashboard**:
- Product validation/rejection
- User management
- Statistics and analytics
- Commission settings

**Host Dashboard**:
- Reservation management
- Product editing
- Calendar view
- Revenue tracking