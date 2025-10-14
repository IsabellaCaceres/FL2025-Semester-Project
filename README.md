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

1. **Auto start everything (installs deps, starts Supabase, keys, sync, API server, Expo)**

   ```bash
   bun run dev:auto
   ```

2. **Auto start with a Supabase reset first**

   ```bash
   bun run dev:auto:reset
   ```

Both commands point the frontend at `http://127.0.0.1:4000` by default; set `EXPO_PUBLIC_API_URL` in `.env` to override.

### Manual command sequence

1. Install dependencies: `bun install`
2. Generate EPUB manifest: `bun run generate:epubs`
3. Start Supabase: `bun run supabase:start`
4. Export Supabase keys: `bun run supabase:keys`
5. Sync EPUB storage: `bun run supabase:sync-epubs`
6. Start API server: `bun run server`
7. Launch Expo: `bun expo start`


# If running into Windows error where supabase command is nonfunctional, install supabase globally:
1. **In powershell (can be done anywhere):**
irm get.scoop.sh | iex
scoop install supabase

2. **Now cd to project:**
supabase start

3. **If Anon key doesn't generate, run:**
supabase status -o json

4. **Find "ANON_KEY" in the output, paste to .env file**
Syntax:
EXPO_PUBLIC_SUPABASE_URL=http://XXX.X.X.X:XXXXX
EXPO_PUBLIC_SUPABASE_ANON_KEY={the anon key}

5. **Then run:**
bun run expo start
