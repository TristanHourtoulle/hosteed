# Calendar Synchronization System

This document describes the calendar synchronization system implemented in Hosteed.

## Overview

The calendar sync system allows hosts to:

1. **Export** their Hosteed calendar to external platforms (Airbnb, Booking.com, Google Calendar, etc.)
2. **Import** external calendars to automatically block dates on Hosteed

## Features

### Export Calendar (Hosteed → External Platforms)

- **Secure ICS Feeds**: Each product has a unique, tokenized ICS feed URL
- **Real-time Updates**: Feed reflects current reservations and unavailability blocks
- **Webcal Support**: Direct subscription to Google Calendar, Apple Calendar, etc.
- **Token Regeneration**: Hosts can regenerate tokens if compromised

### Import Calendar (External Platforms → Hosteed)

- **Multiple Calendars**: Import unlimited external calendars per product
- **Auto-Sync**: Automatically synchronizes every 24 hours
- **Manual Sync**: Force sync at any time via UI button
- **Color Coding**: Assign colors to differentiate calendar sources
- **Error Tracking**: View sync status and errors for each calendar

## Architecture

### Database Schema

#### Product Table

```prisma
model Product {
  // ... existing fields
  calendarFeedToken String?           @unique // Token for ICS feed
  externalCalendars ExternalCalendar[] @relation("ProductExternalCalendars")
}
```

#### ExternalCalendar Table

```prisma
model ExternalCalendar {
  id             String   @id @default(cuid())
  productId      String
  name           String   // Ex: "Calendrier Airbnb"
  icalUrl        String   // URL du flux iCal externe
  color          String   @default("#3B82F6")
  description    String?
  isActive       Boolean  @default(true)
  lastSyncAt     DateTime?
  lastSyncStatus String?  @default("pending") // "success", "error", "pending"
  lastSyncError  String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  product        Product  @relation("ProductExternalCalendars", fields: [productId], references: [id], onDelete: Cascade)
}
```

### API Routes

#### Export Calendar

- `GET /api/calendar/[productId]/token` - Get or create feed token
- `POST /api/calendar/[productId]/token` - Regenerate feed token
- `GET /api/calendar/[productId]/feed.ics?token=xxx` - Public ICS feed

#### Import Calendar

- `GET /api/calendar/[productId]/external` - List external calendars
- `POST /api/calendar/[productId]/external` - Add external calendar
- `PUT /api/calendar/[productId]/external/[calendarId]` - Update calendar
- `DELETE /api/calendar/[productId]/external/[calendarId]` - Delete calendar
- `POST /api/calendar/[productId]/external/[calendarId]/sync` - Manual sync
- `POST /api/calendar/[productId]/sync-all` - Sync all calendars for product

#### Admin

- `POST /api/calendar/sync-all` - Sync all calendars (admin only)
- `GET /api/calendar/sync-all` - View sync status (admin only)

### Services

#### calendar.service.ts

- `getOrCreateCalendarFeedToken(productId)` - Get/create feed token
- `regenerateCalendarFeedToken(productId)` - Regenerate token
- `generateProductICSFeed(productId, baseUrl)` - Generate ICS content
- `verifyCalendarFeedToken(productId, token)` - Verify token

#### external-calendar.service.ts

- `fetchExternalCalendar(icalUrl)` - Fetch and parse external ICS
- `syncExternalCalendar(calendarId)` - Sync one calendar
- `syncProductExternalCalendars(productId)` - Sync all for product
- `syncAllExternalCalendars()` - Sync all active calendars
- `createExternalCalendar(data)` - Create external calendar
- `updateExternalCalendar(id, data)` - Update calendar
- `deleteExternalCalendar(id)` - Delete calendar (+ synced blocks)
- `getProductExternalCalendars(productId)` - List calendars

### UI Components

#### ExportCalendarModal.tsx

- Display feed URLs (HTTP and Webcal)
- Copy to clipboard functionality
- Regenerate token
- Platform-specific instructions

#### ImportCalendarModal.tsx

- Add/edit/delete external calendars
- Manual sync button per calendar
- Sync all button
- Sync status indicators
- Error display

## Setup Instructions

### 1. Database Migration

Already applied. The schema includes:

- `Product.calendarFeedToken` field
- `ExternalCalendar` model

### 2. Environment Variables

Ensure `.env` contains:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000/
# Or for production:
# NEXT_PUBLIC_BASE_URL=https://hosteed.com/
```

### 3. Automated Sync (OVH VPS)

#### Option A: Cron Job (Recommended)

1. Make the script executable:

```bash
chmod +x scripts/sync-calendars.ts
```

2. Install tsx globally (if not already):

```bash
pnpm add -g tsx
```

3. Add to crontab:

```bash
crontab -e
```

4. Add this line to run daily at 3 AM:

```cron
0 3 * * * cd /path/to/hosteed && NODE_ENV=production tsx scripts/sync-calendars.ts >> /var/log/hosteed-calendar-sync.log 2>&1
```

5. View logs:

```bash
tail -f /var/log/hosteed-calendar-sync.log
```

#### Option B: systemd Timer

1. Create service file `/etc/systemd/system/hosteed-calendar-sync.service`:

```ini
[Unit]
Description=Hosteed Calendar Sync
After=network.target

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/path/to/hosteed
Environment="NODE_ENV=production"
ExecStart=/usr/bin/tsx scripts/sync-calendars.ts
StandardOutput=append:/var/log/hosteed-calendar-sync.log
StandardError=append:/var/log/hosteed-calendar-sync.log
```

2. Create timer file `/etc/systemd/system/hosteed-calendar-sync.timer`:

```ini
[Unit]
Description=Run Hosteed Calendar Sync Daily

[Timer]
OnCalendar=daily
OnCalendar=03:00
Persistent=true

[Install]
WantedBy=timers.target
```

3. Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hosteed-calendar-sync.timer
sudo systemctl start hosteed-calendar-sync.timer
```

4. Check status:

```bash
sudo systemctl status hosteed-calendar-sync.timer
sudo systemctl list-timers --all
```

### 4. Manual Testing

Test export:

```bash
# Get token
curl http://localhost:3000/api/calendar/PRODUCT_ID/token \
  -H "Cookie: your-session-cookie"

# Access feed
curl "http://localhost:3000/api/calendar/PRODUCT_ID/feed.ics?token=YOUR_TOKEN"
```

Test import:

```bash
# Add external calendar
curl http://localhost:3000/api/calendar/PRODUCT_ID/external \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Test Calendar",
    "icalUrl": "https://calendar.google.com/calendar/ical/xxx/basic.ics"
  }'

# Manual sync
curl http://localhost:3000/api/calendar/PRODUCT_ID/external/CALENDAR_ID/sync \
  -X POST \
  -H "Cookie: your-session-cookie"
```

Test cron script:

```bash
tsx scripts/sync-calendars.ts
```

## Usage Guide for Hosts

### Exporting Calendar to External Platforms

1. Go to **Dashboard → Calendar**
2. Select a specific property from the dropdown
3. Click **"Exporter le calendrier"**
4. Copy the appropriate URL:
   - **ICS URL**: For Airbnb, Booking.com
   - **Webcal URL**: For Google Calendar, Apple Calendar
5. Paste into the external platform:
   - **Airbnb**: Settings → Calendar → Import calendar
   - **Booking.com**: Extranet → Calendar → Sync calendars
   - **Google Calendar**: Other calendars → From URL
   - **Apple Calendar**: File → New Subscription

### Importing External Calendars

1. Go to **Dashboard → Calendar**
2. Select a specific property
3. Click **"Importer des calendriers"**
4. Click **"Ajouter un calendrier"**
5. Fill in:
   - Name (e.g., "Calendrier Airbnb")
   - ICS URL from external platform
   - Color (optional)
   - Description (optional)
6. Click **"Ajouter"**
7. Calendar will sync automatically

### Manual Sync

- Click **"Sync"** button next to a calendar
- Or click **"Tout synchroniser"** to sync all calendars
- Sync happens automatically every 24 hours

## Troubleshooting

### Export Issues

**Problem**: External platform can't access the feed

- Check that `NEXT_PUBLIC_BASE_URL` is correct
- Ensure URL is publicly accessible (not localhost for production)
- Verify token is valid

**Problem**: Feed shows old data

- ICS feeds are generated in real-time
- External platforms may cache (24h typical)
- Try regenerating the token

### Import Issues

**Problem**: Sync fails with error

- Check that the external ICS URL is publicly accessible
- Verify the URL format is correct
- Check error message in UI

**Problem**: Dates not blocking correctly

- Only events marked as CONFIRMED/BUSY are imported
- Check that external calendar has proper event status
- Verify sync status in UI

**Problem**: Duplicate blocks

- The system automatically removes old synced blocks before creating new ones
- Each calendar's blocks are tagged with `[SYNC:calendarId]`

## Security Considerations

1. **Token Security**
   - Tokens are 64-character random hex strings
   - Unique per product
   - Can be regenerated if compromised
   - Never exposed in logs

2. **Access Control**
   - Only product owner can access/manage calendars
   - Admin-only endpoints for global sync
   - All routes verify ownership

3. **Data Privacy**
   - External calendars only see event titles and dates
   - No personal information in ICS feeds
   - Guest names shown only as "Réservé - [name]"

## Performance Considerations

1. **Caching**
   - ICS feeds generated on-demand (no caching)
   - External platforms cache feeds (typically 24h)

2. **Rate Limiting**
   - No rate limiting on feed access (public endpoint)
   - Consider adding if abuse occurs

3. **Database**
   - Indexed on `productId`, `lastSyncAt`, `isActive`
   - Old synced blocks deleted before new import
   - Minimal storage impact

## Future Enhancements

Potential improvements:

- [ ] Two-way sync (import reservations from external calendars)
- [ ] Sync frequency configuration per calendar
- [ ] Email notifications on sync failures
- [ ] Webhook support for instant sync
- [ ] CalDAV support for bidirectional sync
- [ ] Analytics on sync performance
- [ ] Bulk import/export UI for admins
