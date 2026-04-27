# PadaHub — Mobile Companion App

**PadaHub** is the official mobile companion application for Pada.org. Built with React Native, Expo, and NativeWind, it leverages the TopScore API for read-only league viewing while using Supabase for custom features like real-time team chat, announcements, and captain-only live score reporting.

## Features

- **Authentication**: OAuth2 login with Pada.org / TopScore credentials.
- **Registrations**: View all registered leagues, teams, and events.
- **Teams**: Full team roster viewing, captain identification, and schedules.
- **Schedule**: Calendar view with ICS export support.
- **Chat**: Team-scoped real-time messaging.
- **Announcements**: Broadcasts from league admins and team captains.
- **Live Score Reporting**: Captains can report game scores straight to the app.

## Project Structure

- `app/` — Expo Router file-based screens and layouts.
- `components/` — UI components and domain views (Button, Avatar, Card).
- `constants/` — Config, colors, and Mock Data fixtures.
- `services/` — TopScore API interactions and Supabase client definitions.
- `store/` — Zustand state management (auth handling).
- `types/` — Shared TypeScript models.
- `supabase/` — Database schema initialization files.

## Running Locally

By default, the app runs in **Mock Data Mode**. Real API calls are bypassed and fixtures from `constants/mockData.ts` are returned instead. This allows immediate testing of UI flows and routing.

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the Expo Development Server**
   ```bash
   npx expo start
   ```

3. **Run on Device / Emulator**
   - Press **i** to open the iOS Simulator
   - Press **a** to open the Android Emulator
   - Scan the QR code with the Expo Go app on your physical device.

## Moving to Production

1. Review and deploy the schema found in `supabase/schema.sql` to your Supabase project.
2. Provide real credentials inside `.env` matching `.env.example`.
3. Toggle `USE_MOCK_DATA = false` in `constants/config.ts`.
4. Configure push notifications using your Expo EAS account.
