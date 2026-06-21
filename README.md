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

By default, the app runs in **Production Mode** using the real TopScore API. To use mock data instead, set `EXPO_PUBLIC_USE_MOCK_DATA=true` in `.env`.

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
2. Update `.env` with real credentials matching `.env.example`:
   - `EXPO_PUBLIC_TOPSCORE_BASE_URL=https://pada.usetopscore.com`
   - `EXPO_PUBLIC_TOPSCORE_CLIENT_ID=your_client_id`
   - `EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET=your_client_secret`
   - `EXPO_PUBLIC_SUPABASE_URL=your_supabase_url`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`
3. Ensure `EXPO_PUBLIC_USE_MOCK_DATA` is **NOT** set to `"true"` in `.env` (defaults to `false`).
4. Configure push notifications using your Expo EAS account.
5. Run `npx expo prebuild` then `npx expo run:android` or `npx expo run:ios` to build.
