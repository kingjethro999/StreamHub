# StreamHub - Nigerian Streaming Platform

A React-based streaming platform focused on Nigerian content creators.

## Features

- Live streaming catalog with categories (Gaming, Music, Tech, Comedy, Entertainment)
- User authentication with Supabase
- Channel profiles and stream details
- Premium subscription tiers
- Search functionality
- Activity tracking and notifications

## Tech Stack

- **React 18** - UI library
- **React Router 6** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **Supabase** - Backend and authentication
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_REDIRECT_URL=http://localhost:3000
   ```

4. Run the database migration scripts in Supabase:
   - Run `scripts/001_create_profiles.sql`
   - Run `scripts/002_seed_nigerian_content.sql`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── ui/           # UI component library (Radix + Tailwind)
│   ├── header.jsx
│   ├── navigation.jsx
│   ├── stream-card.jsx
│   ├── stream-catalog.jsx
│   └── category-filter.jsx
├── pages/            # Route pages
│   ├── auth/         # Authentication pages
│   ├── Home.jsx
│   ├── Search.jsx
│   ├── Profile.jsx
│   ├── Premium.jsx
│   └── ...
├── lib/              # Utilities
│   └── supabase/     # Supabase client setup
├── App.jsx           # Main app component with routes
├── main.jsx          # Application entry point
└── index.css         # Global styles and Tailwind config

scripts/              # Database migration scripts
public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## License

MIT
```

```mjs file="next.config.mjs" isDeleted="true"
...deleted...
