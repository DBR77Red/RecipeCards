# RecipeCards

A React Native (Expo) recipe card app that runs as a web app in Replit.

## Tech Stack

- **Framework**: Expo SDK 55 (React Native with web support via react-native-web)
- **Language**: TypeScript
- **Navigation**: React Navigation (native stack)
- **Storage**: AsyncStorage (@react-native-async-storage/async-storage)
- **Fonts**: Expo Google Fonts (DM Sans, Playfair Display)
- **Bundler**: Metro (for web)

## Project Structure

```
/
├── App.tsx              # Root app component with navigation setup
├── index.ts             # App entry point
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── assets/              # App icons and splash screens
└── src/
    ├── components/      # Reusable UI components
    │   ├── RecipeCard.tsx
    │   └── RecipeForm.tsx
    ├── screens/         # App screens
    │   ├── HomeScreen.tsx
    │   ├── FormScreen.tsx
    │   └── PreviewScreen.tsx
    ├── types/           # TypeScript type definitions
    │   └── navigation.ts
    └── utils/           # Utility functions
        ├── recipe.ts
        └── storage.ts
```

## Running the App

The workflow `Start application` runs:
```
RCT_METRO_PORT=5000 npx expo start --web
```

This starts the Expo Metro dev server on port 5000, serving the web version of the app.

## Key Configuration Notes

- Port 5000 is set via `RCT_METRO_PORT=5000` environment variable
- Expo SDK 55 uses Metro (not webpack) for web bundling
- The app uses AsyncStorage for local recipe data persistence
