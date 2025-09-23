# FL2025: Group AIA; Group Number 8; Goodreads2;

Name your repository using the following format:  
FL2025_Group 8

(Example: FL2025_Group_9)

## Team Members
- Isabella Caceres caceresruscitti@wustl.edu IsabellaCaceres
- Andrew Baggio a.a.baggio@wustl.edu andrewbaggio
- Abby Endale a.endale@wustl.edu atendale

## TA
Abdou Sow

## Objectives
Description of what your project is about, your key functionalities, tech stacks used, etc. 

Our project Goodreads2 is a tool designed to facilitate book recommendations and encourage social communities. The main feature of our function will be a search engine designed to intake natural language from our user and output book/community recommendations based on whatever they are looking for. For example, if the user is looking for books with a similar plotline of a mystical adventure like in the Alchemist, they will be recommended a list of books that include that. 

We want our app to include social features that allow users to join different book club-like communities based on their interests; These groups can also be filtered by our model depending on a variety of factors like activity, size, and general conversation vibe. Outside of these recommendations, our app will serve as a library of books that are read, being read, and to-be-read by our user and their groups/clubs. Our focus will be on facilitating conversations and accurate recommendations off of just a quote, vibe, or title.

We plan to use local storage for our database and React Native + Expo for the frontend work.



## Local Development

### 1. Prerequisites

- [Bun](https://bun.sh) v1.2.18 or newer (required by the scripts)
- Supabase CLI (the project auto-detects the first option that is available):
  - **Recommended**: `bunx supabase` (no global install needed)
  - Alternatively install the native CLI
    - macOS: `brew install supabase/tap/supabase`
    - Windows: `iwr https://supabase.com/cli/install/windows | iex`
- Expo Go (mobile testing) or a web browser (web testing)

> Docker is no longer required for the default workflow.

### 2. Environment setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Start Supabase**

   ```bash
   bun run supabase:start
   ```

   The script automatically uses a local CLI if installed or falls back to `bunx supabase`. Sign in if prompted.

3. **Export Supabase keys**

   ```bash
   bun run supabase:keys
   ```

   This writes `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`.

4. **Launch Expo**

   ```bash
   bun run start
   ```

   - `bun run web` for the in-browser preview
   - `bun run ios` or `bun run android` for device simulators

### 3. Supabase helpers

```bash
bun run supabase:status   # Check container/service health
bun run supabase:reset    # Reset database (drops data)
bun run supabase:stop     # Stop services
```

