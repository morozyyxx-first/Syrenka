# Nazwa projektu - Syrenka
Nazwa i numer zespołu - 2ndWind 11

# Clone the repository
git clone https://github.com/morozyyxx-first/syrenka.git

cd syrenka

# Install dependencies
npm install

# Running the application
npm run dev

Once started, open your web browser and navigate to http://localhost:3000

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Event API configuration

The event API credential is read server-side as `API_KEY`. Do not add a `VITE_` prefix: Vite exposes prefixed variables to browser code.

- In Vercel, add `API_KEY` under **Project Settings → Environment Variables**, set its type to **Secret**, and select the environments you deploy to.
- For local development, add `API_KEY=...` to the root `.env.local` file. `.env.local` is ignored by Git.
- Deploy again after changing the Vercel variable. The `/api/events` Vercel Function uses the key to call the upstream events API.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
