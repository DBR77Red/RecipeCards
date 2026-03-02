# RecipeCards

A React Native (Expo) recipe card app that runs as a web app in Replit, with voice-to-recipe functionality on native (iOS/Android).

## Tech Stack

- **Framework**: Expo SDK 55 (React Native with web support via react-native-web)
- **Language**: TypeScript
- **Navigation**: React Navigation (native stack)
- **Storage**: AsyncStorage (@react-native-async-storage/async-storage)
- **Fonts**: Expo Google Fonts (DM Sans, Playfair Display)
- **Bundler**: Metro (for web)
- **Database**: Supabase (for published card sharing)
- **Voice**: expo-av (recording), Deepgram (transcription), Anthropic Claude Haiku (recipe parsing)

## Project Structure

```
/
├── App.tsx              # Root app component with navigation setup
├── index.ts             # App entry point
├── app.json             # Expo configuration (includes mic permission)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── assets/              # App icons and splash screens
├── server/
│   └── index.js         # Express API server (port 3001) — recipes, transcribe, parse-recipe
└── src/
    ├── components/      # Reusable UI components
    │   ├── RecipeCard.tsx
    │   └── RecipeForm.tsx   # Includes voice bar UI
    ├── hooks/
    │   └── useVoiceRecorder.ts  # expo-av recording hook (idle/recording/stopped, 60s limit)
    ├── lib/
    │   └── supabase.ts
    ├── screens/         # App screens
    │   ├── HomeScreen.tsx
    │   ├── FormScreen.tsx
    │   ├── PreviewScreen.tsx
    │   ├── ReceiveScreen.tsx
    │   └── CardViewScreen.tsx
    ├── types/           # TypeScript type definitions
    │   └── navigation.ts
    └── utils/           # Utility functions
        ├── recipe.ts
        ├── storage.ts
        ├── api.ts
        ├── transcribe.ts    # Sends audio to /api/transcribe → Deepgram
        └── parseRecipe.ts   # Sends transcript to /api/parse-recipe → Claude Haiku
```

## Running the App

The workflow `Start application` runs:
```
RCT_METRO_PORT=5000 npx expo start --web
```

This starts the Expo Metro dev server on port 5000, serving the web version of the app.

## Voice-to-Recipe Flow (native only)

1. User taps the mic button in the New Recipe form
2. `useVoiceRecorder` hook records audio (max 60s) using `expo-av`
3. On stop, audio file is POSTed to `POST /api/transcribe` (Express → Deepgram)
4. Transcript is POSTed to `POST /api/parse-recipe` (Express → Claude Haiku)
5. Haiku returns structured JSON: title, servings, prepTime, cookTime, ingredients[], directions[]
6. Form fields are auto-filled; user can edit anything before saving/publishing

## Required Secrets

- `DEEPGRAM_API_KEY` — Deepgram voice transcription
- `ANTHROPIC_API_KEY` — Claude Haiku recipe parsing

## Key Configuration Notes

- Port 5000 is set via `RCT_METRO_PORT=5000` environment variable
- Express API runs on port 3001
- Expo SDK 55 uses Metro (not webpack) for web bundling
- The app uses AsyncStorage for local recipe data persistence
- Voice bar is hidden on web (Platform.OS !== 'web' guard)
