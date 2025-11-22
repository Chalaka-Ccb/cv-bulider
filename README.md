```markdown
# BurnNote

Encrypted burn-once notes & files. This repository contains a Next.js frontend (`/app`) and a small Node.js Express backend (`/server`). The frontend performs encryption in the browser and the backend stores encrypted payloads; notes are deleted after a single successful read.

Getting started

1. Start the backend:

```powershell
cd 'C:\Users\chami\OneDrive\Desktop\cv-bulider\server'
npm install
npm run dev
```

2. Start the frontend:

```powershell
cd 'C:\Users\chami\OneDrive\Desktop\cv-bulider\app'
npm install
npm run dev
```

Open http://localhost:3000 to use the app and http://localhost:4000/api/health to check the server.

Security notes

- Passwords are never sent to the server; encryption/decryption happen in the browser.
- The server provided in `server/` is a demo using an in-memory store and is not production-ready.

```
# cv-bulider
A web application that can help users to create a cool CV with in few minutes.
