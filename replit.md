# RecipeCards

A React Native (Expo SDK 55) recipe card app running as a web app and on Expo Go (via tunnel).

## Tech Stack

- **Framework**: Expo SDK 55 (React Native with web support via react-native-web)
- **Language**: TypeScript
- **Navigation**: React Navigation (native stack)
- **Local Storage**: AsyncStorage (@react-native-async-storage/async-storage)
- **Shared Storage**: Replit key-value database (`@replit/database`) via Express API
- **Fonts**: Expo Google Fonts (DM Sans, Playfair Display)
- **QR Code**: react-native-qrcode-svg + react-native-svg
- **Camera/Scanner**: expo-camera (v55) with barcode scanning

## Project Structure

```
/
├── App.tsx              # Root app component with navigation setup
├── index.ts             # App entry point
├── app.json             # Expo configuration
├── .env.local           # EXPO_PUBLIC_API_URL (generated from REPLIT_DEV_DOMAIN)
├── server/
│   └── index.js         # Express API server (port 3001) for shared recipe storage
└── src/
    ├── components/
    │   ├── RecipeCard.tsx   # RecipeData type + card UI component
    │   └── RecipeForm.tsx   # Form for editing recipe fields
    ├── screens/
    │   ├── HomeScreen.tsx   # Recipe list + QR scanner + account
    │   ├── FormScreen.tsx   # Create/edit draft recipe
    │   ├── PreviewScreen.tsx # Preview + publish + QR code display
    │   └── ReceiveScreen.tsx # View a shared recipe + add to collection
    ├── types/
    │   └── navigation.ts    # RootStackParamList (Home, Form, Preview, Receive)
    └── utils/
        ├── storage.ts       # AsyncStorage CRUD (saveDraft, publishRecipe, etc.)
        └── api.ts           # Backend API helpers (uploadRecipe, fetchSharedRecipe)
```

## Workflows

| Workflow | Command | Port | Purpose |
|---|---|---|---|
| Start application | `RCT_METRO_PORT=5000 npx expo start --tunnel` | 5000 | Expo Metro + ngrok tunnel for Expo Go |
| Backend API | `node server/index.js` | 3001 | Shared recipe storage API |

## Recipe Sharing Flow

1. **Phone A**: Creates a recipe, publishes it from the Preview screen
2. Publishing saves locally AND uploads the recipe to the backend API (port 3001)
3. The backend returns a stable `shareUrl`: `https://{REPLIT_DEV_DOMAIN}:3001/api/recipes/{id}`
4. The QR code on the Preview screen encodes this URL
5. **Phone B**: Taps the scan button (⊞) in the home footer → camera opens → scans QR code
6. App fetches the recipe from the backend and shows it in ReceiveScreen
7. User taps "Add to My Collection" → saves a local draft copy → returns to Home

## Key Configuration Notes

- `REPLIT_DEV_DOMAIN` env var provides the stable Replit hostname
- `.env.local` contains `EXPO_PUBLIC_API_URL` for native Expo Go clients
- The `--tunnel` flag creates an ngrok tunnel so Expo Go on any phone can connect
- Port 3001 is exposed externally in `.replit` for the backend API
- `RecipeData.shareUrl` is optional — falls back to `recipecards://card/{id}` if upload fails
