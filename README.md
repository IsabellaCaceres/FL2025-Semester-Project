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

> A Docker option is available for the frontend if you prefer to avoid managing Expo locally.

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

Before running the scripts below, set `OPENAI_API_KEY` in `.env` (the existing scripts load it automatically).

Open two terminals and run the commands for each role in order:

**Backend terminal**
1. Start Supabase: `bun run supabase:start`
2. Apply the latest migrations: `bunx supabase db push`
3. Export Supabase keys: `bun run supabase:keys`
4. Generate embeddings + upload EPUBs: `bun run supabase:sync-epubs`
5. Start API server: `bun run server`

**Frontend terminal**
1. Launch the Dockerized frontend (installs deps, generates EPUB manifest, starts Expo):

   ```bash
   bun run docker:frontend
   ```

   > Pass additional Docker Compose flags after `--`, e.g. `bun run docker:frontend -- --no-build`

### Windows Supabase troubleshooting

1. Install Scoop (one-time): `irm get.scoop.sh | iex`
2. Install Supabase CLI: `scoop install supabase`
3. Start Supabase inside the project: `supabase start`
4. If the anon key is missing, run `supabase status -o json`, copy `ANON_KEY`, and add it to `.env`.
5. Restart the backend commands above and rerun the frontend terminal (`bun run web`).

### Windows Git "Filename too long" error

If you encounter `error: cannot stat 'assets/epubs/...': Filename too long` when running `git pull`:

**Option 1: Enable long path support in Git (Recommended)**
```bash
git config --global core.longpaths true
```
Then try `git pull` again.

**Option 2: Manually delete old epub files before pulling**
If Option 1 doesn't work, delete the old long-named epub files manually:
1. Navigate to `assets/epubs/` folder
2. Delete any files with very long names (they should be replaced by hash-named files)
3. Run `git pull` again

**Option 3: Reset and re-clone (if above options fail)**
```bash
# Save any uncommitted changes first, then:
git fetch origin
git reset --hard origin/labubu
```

### Frontend via Docker

1. Ensure the backend terminal steps above are running on your host machine (the container depends on `http://127.0.0.1:4000`).
2. Build and start the frontend container (installs dependencies, regenerates the EPUB manifest, and runs Expo automatically):

   ```bash
   bun install
   docker compose up --build frontend
   bun expo start
   ```

3. Tail container logs (optional):

   ```bash
   bun run docker:frontend:logs
   ```

4. When finished, shut everything down:

   ```bash
   bun run docker:frontend:down
   ```

### Quick test checklist

| Role | Commands |
| ---- | -------- |
| Backend | `bun run supabase:start`<br>`bunx supabase db push`<br>`bun run supabase:keys`<br>`bun run supabase:sync-epubs`<br>`bun run server` |
| Frontend (Docker) | `bun run docker:frontend` |

Once both processes are up, sign in through the app, open the Search tab, try a natural-language query, and confirm the AI reasoning plus recommendations show up.
