# Learnify — Frontend

React 19 + TypeScript + Vite client for the Learnify Student Management System.
See the [root README](../README.md) for full setup.

```bash
npm install
npm run dev      # http://localhost:5173 (proxies /api to http://localhost:8080)
npm run lint
npm run build
```

| Folder | Contents |
|---|---|
| `src/api/` | Axios client: attaches the login token, handles 401, error helpers |
| `src/auth/` | Session storage (token, user, role, expiry) |
| `src/pages/` | Login, Dashboard, Students, Subjects, Marks Entry, Reports |
| `src/components/` | Sidebar, charts, metric cards, field error messages |
| `src/utils/` | Form validation rules, CSV export |

Set `VITE_API_URL` (e.g. in `.env.local`) only if the API is not served at `/api` on the same host.
