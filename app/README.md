```markdown
# BurnNote — Encrypted burn-once notes & files

This `app/` folder contains the Next.js frontend for BurnNote — a small tool to encrypt a message or file in the browser, upload the encrypted payload to the server, and let someone retrieve it exactly once (the server deletes it after first read).

Local development

1. Start the backend server (from repo root):

```powershell
cd 'C:\Users\chami\OneDrive\Desktop\cv-bulider\server'
npm run dev
```

2. Start the Next.js app (in a separate terminal):

```powershell
cd 'C:\Users\chami\OneDrive\Desktop\cv-bulider\app'
npm run dev
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000

Notes on security and architecture

- Encryption is performed entirely in the browser using the Web Crypto API. The server stores only the encrypted payload and never receives the password.
- Retrieval is burn-once: when a client GETs `/api/note/:id` the server returns the encrypted payload and immediately deletes it from its in-memory store.
- The current server uses an in-memory store (demo). For production you should replace this with a durable store that supports single-read deletion and set strict access controls.

What's next

- Add persistent storage and optionally an authenticated admin UI.
- Add rate-limiting, abuse protection and better TTL management for stored notes.
- Add link previews and QR-code support for easier sharing.

```
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
