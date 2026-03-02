# 🇵🇭 Bayanihan Map

A mobile-first, community-driven web application designed to help citizens report local infrastructure and utility issues (like potholes, broken streetlights, and uncollected garbage) in real-time.

## ✨ Features

- **Interactive Map:** Built with React Leaflet, restricted to Philippine bounds for focused, distortion-free navigation.
- **Smart Location Selection:** Users can lock in their exact coordinates using High-Accuracy GPS or manually drag-and-drop a pin on the map.
- **Client-Side Image Optimization:** Integrated `browser-image-compression` to resize evidence photos to under 1MB _before_ uploading, saving bandwidth and storage.
- **Mobile-Optimized UI:** Designed with dynamic viewport heights (`h-dvh`) and safe-area padding to ensure buttons and modals don't conflict with iOS/Android browser navigation bars.
- **Secure Submissions:** Leverages Next.js Server Actions to securely process and push report data to the backend.
- **Fluid Animations:** Smooth modal transitions powered by Framer Motion.

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org) (App Router), React, TypeScript
- **Styling:** Tailwind CSS, Framer Motion, React Icons
- **Mapping:** React Leaflet (`react-leaflet`, `leaflet`)
- **Backend / Database:** Supabase (PostgreSQL)
- **Utilities:** `browser-image-compression`

## 🚀 Getting Started

First, install dependencies if you haven't already:

```bash
npm install
```

Then, set up your environment variables. Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Finally, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result!

## 🗺️ Roadmap / Next Steps

- [ ] Add custom map markers (Category Icons) for different issue types.
- [ ] Replace native browser alerts with custom Toast notifications.
- [ ] Enable notification subscription for municipalities.
- [ ] Implement resolve leaderboards
- [ ] Explore AI-based image moderation to filter trolls and ensure community safety.
- [ ] Public Launch.
- [ ] Endorse project to communities.
