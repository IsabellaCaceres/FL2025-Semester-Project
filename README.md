## Local Development

### Prerequisites
- [Bun](https://bun.sh) v1.2.18+
- Docker Desktop
- Supabase CLI (`bunx supabase` works)

### Quick Start (Standard)
1. **Setup Environment**
   Copy `.env.example` to `.env` and add your `OPENAI_API_KEY`.

2. **Auto-Start**
   Runs Supabase, migrations, syncs books, and starts both server/web.
   ```bash
   bun run dev:auto
   ```
   *Use `bun run dev:auto:reset` to wipe the database first.*

### Kubernetes Deployment (Local)
The provided manifests in `k8s/` mount your local code for development.

1. **Deploy**
   Ensure your local cluster (e.g. Docker Desktop) is running.
   ```bash
   kubectl apply -f k8s/
   ```

2. **Access**
   - Frontend: `http://localhost:30080` (NodePort)
   - Database: `http://localhost:5432` (if port forwarded)

### Manual Commands
If you prefer running services individually:

**Backend**
```bash
bun run supabase:start      # Start DB
bunx supabase migration up  # Apply migrations locally
bun run supabase:sync-epubs # Sync books & keys
bun run server              # Start API
```

**Frontend**
```bash
bun run web                 # Start Web
# OR
bun run ios                 # Start iOS
```

### Windows Troubleshooting
If you encounter "Filename too long" errors:
```bash
git config --global core.longpaths true
```
Then re-clone or pull.
