# VentureSocial

An algorithmic, social-first travel planning platform built with a strictly vibrant "Executive Polaroid" aesthetic.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fventuresocial%2Fapp)

## Tech Stack
* **Frontend**: React + Vite + TailwindCSS + Motion
* **Backend**: Supabase (PostgreSQL, Realtime, Auth, RPC)
* **Algorithms**: Geospatial Proximity Matrix & Engagement Scoring

## Core Features & Logic

### 1. Social Ranking Algorithm (1/2/5/10 Model)
To organically prioritize the best itineraries across the network without relying on manual sort toggles, the system natively runs a multi-layered algorithm on every query. The dynamic math generates an `Engagement Score` based on value thresholds:
- Liking a trip: **+1 Point**
- Commenting on a trip: **+2 Points**
- Remixing (Adding a Post to Cart): **+5 Points**
- Leaving a perfect 5-Star Rating: **+10 Points**

All top-level discover feeds run via a `calculate_engagement_score()` RPC schema ensuring the highest-quality community itineraries natively float to the top of the timeline dynamically. Followed creators are programmatically hoisted above raw scores.

### 2. Live Geographic Route Optimization
When viewing the "Remixed Journey" custom map inside the Unified Checkout layer, standard user paths are completely recalculated mathematically.
We employ the **Haversine Algorithmic Formula** which maps precise Lat/Long grid points of individual check-ins and sequentially sorts them via absolute minimal travel distance, ensuring zero geographical waste for groups navigating new localities.

### 3. Traveler-Aware Smart Checkout 
A complex checkout state logic manages cost splits dynamically scaled against traveler volume.
- **Hotel Split Dynamics**: Implements `Math.ceil(travelers / 2) * current_base_cost * 0.5`. 
- **Fixed-Rate Transport**: Locks the rental car metric flat to protect against multiplicative scaling group charges.
- **Social Credit Points Ledger**: Generates `+50 Points` deposited to the original creator's secure ledger ID instantly when a user replicates their content into a booking cart.

### 4. Supabase Network Connectivity
Natively powered via Postgres channels. Message interactions occurring through Profile interfaces open sharp geometric Chat Overlays synced securely across `conversations` and `messages` tables via Supabase Realtime logic bindings.

## Deployment Setup
1. Clone this repository directly mapping to Vercel via the button above.
2. Initialize `npm install`
3. Duplicate `.env.example` -> `.env` and fill the variables keys from your Supabase Dashboard.
4. Execute `supabase_migration.sql` inside your cloud Supabase SQL Editor.
5. Launch `npm run dev` to preview the architecture locally.
