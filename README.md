# RecipeCards

<img width="393" height="596" alt="app-screen-shot5" src="https://github.com/user-attachments/assets/d7b7e112-5636-448a-a58d-df7c2e60a644" />
<img width="388" height="824" alt="app-screen-shot3" src="https://github.com/user-attachments/assets/a37b22dd-11bb-48fb-b9e5-cb4c09162a28" />



A mobile app for creating, saving, and sharing recipes as beautiful skeuomorphic index cards.

Built with Expo / React Native + TypeScript, backed by Supabase.

## Features

- **Create recipes** — fill out a form with title, ingredients, directions, photo, and serving info
- **Index card design** — recipes render as vintage-style flip cards (cream paper, ruled lines, red margin)
- **Save drafts** — recipes persist locally via AsyncStorage until you're ready to publish
- **Publish & share** — published recipes are uploaded to Supabase and generate a shareable QR code
- **Receive recipes** — scan a QR code or enter a card ID to view someone else's recipe
- **Deep links** — `recipecards://card/{id}` opens a card directly in the app

## Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK ~55 / React Native 0.83.2 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation (native-stack) |
| Storage (local) | AsyncStorage |
| Storage (cloud) | Supabase (PostgreSQL + Storage) |
| Fonts | Playfair Display, DM Sans |
| Image picker | expo-image-picker |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio or Xcode (for device/emulator)

### Install

```bash
git clone https://github.com/DBR77Red/RecipeCards.git
cd RecipeCards
npm install
```

### Run

```bash
npm run android   # Android emulator or device
npm run ios       # iOS simulator (macOS only)
expo start        # Expo Go / web
```

## Project Structure

```
src/
  components/
    RecipeCard.tsx      # Flippable index card component
    RecipeForm.tsx      # Recipe entry form with photo picker
  screens/
    HomeScreen.tsx      # Draft list + New Recipe CTA
    FormScreen.tsx      # Wraps RecipeForm
    PreviewScreen.tsx   # Card preview + publish + share
    CardViewScreen.tsx  # Deep-link recipient view
  lib/
    supabase.ts         # Supabase client
    api.ts              # publish / fetch helpers
  utils/
    recipe.ts           # emptyRecipe() factory
    storage.ts          # AsyncStorage CRUD helpers
  types/
    navigation.ts       # RootStackParamList
App.tsx                 # Root — navigation container + linking config
```

## Supabase Schema

**`recipes` table** — columns mirror `RecipeData` (snake_case):
`id`, `title`, `creator_name`, `photo_url`, `servings`, `prep_time`, `cook_time`, `ingredients` (JSONB), `directions` (JSONB), `status`, `share_url`, `created_at`, `updated_at`

**`recipe-photos` bucket** — public; photos stored as `{id}.jpg`

## License

MIT
