# Remix of Remix of Remix of Orbital Vision Watch

Build a complete, production-quality FRONTEND prototype called SANSIGHT for NASA Space Apps Challenge, a spaceflight-associated neuro-ocular syndrome (SANS) monitoring and adaptive OCT scheduling research demonstration. This is a brand NEW independent app; do NOT modify existing projects or deploy publicly yet. Prioritize a stunning, polished cinematic NASA mission-control aesthetic, not a generic dashboard. Tech React TypeScript Tailwind shadcn, responsive, accessible, working navigation and interactions. Dark near-black/navy background, elegant electric cyan/ice blue accents, restrained amber for warnings, crisp typography, refined glass panels, subtle starfield, animated cinematic rotating 3D Earth on landing page (use performant fallback if WebGL unavailable), polished micro-interactions and charts. Landing page dramatic hero "SANSIGHT — Beyond the Visible", NASA challenge context, enter mission control CTA. Full app sidebar/topbar with functional routes/pages: Mission Control overview, Astronaut profile (ASTRO001), SANS Monitoring, OCT Eye Scans (OD/OS separate), Adaptive Scan Planner, Data Integrity, Alerts, Vital Signs, Offline Sync, Clinical Guidance, Scientific Evidence, and Interactive Demo. Use clear simulated longitudinal per-eye OCT RNFL values and confidence/uncertainty, quality flags, Kalman estimates, scan recommendations under crew-time budget, integrity issues (missing/delayed/noisy scans), readable trends, responsive tables and charts, interactive astronaut/time range toggles, alert filters, demo scenario controls and simulated upload. Vital signs context include heart rate, blood pressure, SpO2, glucose only if supported by data; avoid claiming a watch measures glucose. Show prominent but elegant 'SIMULATED RESEARCH DATA — NOT FOR CLINICAL USE' and never fabricate real NASA data or clinical validation. Provide polished empty/loading/error states and logical navigation. Implement an API adapter layer to later connect FastAPI at NEXT_PUBLIC_SANS_API_URL or VITE_SANS_API_URL, with demo mode default and no backend dependency. Build all key pages and functional demo in first pass, with strong visual design, not just a wireframe. Make it visually impressive for hackathon judges.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://orbital-vision-compass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/04da417f-4984-4dbc-b56b-0c37ea4ffaf3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
