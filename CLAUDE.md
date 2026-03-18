# Bay Area Climate Risk Dashboard

## Commands
- `npm run dev` - Start dev server on port 3000
- `npm run build` - Production build
- `npm run lint` - ESLint check

## Stack
- Next.js 15 with App Router
- TypeScript (strict mode, no `any`)
- Tailwind CSS v4 (CSS-based theme, no tailwind.config.js)
- react-map-gl + Mapbox GL JS for mapping
- GeoJSON data layers for climate risk

## Data sources
- /public/data/ — local GeoJSON files
- CalFire FHSZ (wildfire zones)
- FEMA flood hazard zones
- CalEnviroScreen 4.0 (equity/socioeconomic)

## Architecture
- All map logic in src/components/Map/
- Data fetching in src/lib/
- Layer configs in src/config/layers.ts

## Conventions
- Server components by default
- `"use client"` only for interactive map components
- Keep layers modular — one file per data layer
