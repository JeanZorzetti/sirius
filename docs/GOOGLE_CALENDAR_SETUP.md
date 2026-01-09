# 📅 Google Calendar Integration - Setup Guide

## Overview

This guide will help you set up the Google Calendar integration for your CRM system. The integration allows automatic event creation when deals are won, follow-up reminders, and bidirectional synchronization of calendar events.

## Prerequisites

- Google Cloud account
- Admin access to your CRM deployment
- Ability to set environment variables in your hosting platform

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID for later

## Step 2: Enable Google Calendar API

1. In the Cloud Console, navigate to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and press **ENABLE**
4. Wait for the API to be enabled (may take a minute)

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Select **External** user type (or Internal if using Google Workspace)
   - Fill in required fields:
     - App name: "Your CRM Name"
     - User support email: your-email@domain.com
     - Developer contact email: your-email@domain.com
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Add test users (your email addresses that will test the integration)
   - Save and continue
4. Back in Credentials page, click **+ CREATE CREDENTIALS** → **OAuth client ID** again
5. Select **Web application**
6. Configure:
   - **Name:** "CRM Google Calendar Integration"
   - **Authorized redirect URIs:** Add your callback URL:
     - Production: `https://your-domain.com/api/integrations/google-calendar/callback`
     - Local dev: `http://localhost:3000/api/integrations/google-calendar/callback`
7. Click **CREATE**
8. Copy the **Client ID** and **Client Secret** shown in the popup

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Google Calendar OAuth
GOOGLE_CALENDAR_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CALENDAR_CLIENT_SECRET="YOUR_CLIENT_SECRET"
GOOGLE_CALENDAR_REDIRECT_URI="https://your-domain.com/api/integrations/google-calendar/callback"

# Integration Encryption Key (if not already set)
INTEGRATION_ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"
```

**Generate encryption key:**
```bash
openssl rand -hex 32
```

## Step 5: Deploy to Production

1. Add environment variables to your hosting platform (Vercel, Railway, etc.)
2. Redeploy your application
3. Verify all variables are set correctly

## Step 6: Test the Integration

1. Log in to your CRM as an admin user
2. Navigate to **Settings** → **Integrations** → **Google Calendar**
3. Click **"Conectar com Google"**
4. You'll be redirected to Google's consent screen
5. Grant access to your Google Calendar
6. You should be redirected back to the settings page with a success message
7. Your connected email should be displayed

## Step 7: Configure Cron Job (Optional but Recommended)

Set up a cron job to sync events every 4 hours:

**For Vercel (using Vercel Cron):**

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-google-calendar",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

**For other platforms:**

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

- URL: `https://your-domain.com/api/cron/sync-google-calendar`
- Schedule: Every 4 hours (`0 */4 * * *`)
- Method: GET
- Headers:
  - `Authorization: Bearer YOUR_CRON_SECRET`

Make sure to set `CRON_SECRET` in your environment variables.

## Features

Once configured, the integration provides:

### ✅ Automatic Event Creation
- When a deal is marked as "Won", a calendar event is automatically created for the next business day
- Event includes deal details, customer information, and reminders

### ✅ Follow-up Reminders
- Create calendar reminders for specific deals
- Customizable reminder dates and notes
- Email and popup notifications

### ✅ Bidirectional Sync
- Events created in Google Calendar are synced to the CRM
- View all your events in one place
- Link calendar events to deals manually

### ✅ Event Management
- Create, update, and delete events from the CRM
- All changes sync to Google Calendar
- Track event status (confirmed, pending, cancelled)

## Troubleshooting

### Error: "access_denied"
**Cause:** User denied access during OAuth flow
**Solution:** Try connecting again and grant the required permissions

### Error: "connection_failed"
**Cause:** Invalid credentials or API not enabled
**Solutions:**
- Verify `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET`
- Ensure Google Calendar API is enabled in Cloud Console
- Check redirect URI matches exactly

### Error: "No refresh token received"
**Cause:** Google didn't return a refresh token
**Solutions:**
- Disconnect and reconnect (OAuth flow forces consent screen)
- Check if you're using the same Google account
- Revoke access in Google Account settings and try again

### Events not syncing
**Cause:** Cron job not configured or failing
**Solutions:**
- Check cron job logs in your hosting platform
- Verify `CRON_SECRET` is set correctly
- Test manually: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/sync-google-calendar`

## Security Best Practices

1. **Keep secrets secure**
   - Never commit `.env` files to git
   - Use environment variables in production
   - Rotate credentials periodically

2. **OAuth Token Storage**
   - Refresh tokens are encrypted using AES-256-GCM
   - Stored in database with encryption at rest
   - Never exposed in API responses

3. **Access Control**
   - Only organization owners can connect/disconnect
   - Each organization has isolated calendar access
   - Users can only see events from their organization

## API Endpoints

For reference, here are the integration endpoints:

- **OAuth Initiation:** `GET /api/integrations/google-calendar/auth`
- **OAuth Callback:** `GET /api/integrations/google-calendar/callback`
- **Disconnect:** `POST /api/integrations/google-calendar/settings`
- **Sync Cron:** `GET /api/cron/sync-google-calendar`

## Support

For issues or questions:

1. Check the logs in your hosting platform
2. Review Google Cloud Console audit logs
3. Check IntegrationLog table in database for activity
4. Contact support with error details

## Changelog

### Version 1.0.0 (2026-01-08)
- Initial Google Calendar integration
- OAuth 2.0 authentication
- Automatic event creation for won deals
- Follow-up reminder creation
- Bidirectional event sync
- Cron job for automatic syncing
