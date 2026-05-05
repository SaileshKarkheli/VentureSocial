# VentureSocial Style Guide

This document serves as the **Source of Truth** for the core visual tokens used across the VentureSocial platform. Adhere to these guidelines when building new pages and components to maintain a consistent and premium aesthetic.

## 🎨 Colors

### Primary Colors
- **Navy (Brand Dark Blue)**: `#0A192F`
  - *Usage*: Main headers, active text, primary floating navigation, and dark background sections.
  - *Tailwind Utility*: `bg-[#0A192F]`, `text-[#0A192F]` or via CSS var `--color-navy`.
- **Primary Action Blue**: `#3B82F6`
  - *Usage*: Actionable items, badges, selection states, and information highlights.
  - *Tailwind Utility*: `bg-blue-500`, `text-blue-500` (often paired with `bg-blue-50` for subtle containers).

### Accent & Neutrals
- **Accent Orange**: `#FF8C42`
  - *Usage*: Call-to-action buttons, active states, hover effects, and energetic highlights.
  - *Tailwind Utility*: `bg-orange-500`, `text-orange-500` or via CSS var `--color-orange`.
- **Backgrounds**:
  - Main Body: `bg-zinc-50` (`#FAFAFA`)
  - Content Cards: `bg-white` (`#FFFFFF`)
- **Text**:
  - Primary Text: `text-zinc-900` (`#18181B`)
  - Secondary/Muted Text: `text-zinc-500` (`#71717A`)

---

## 🔲 Border Radius

VentureSocial leans heavily towards soft, modern, and highly rounded interfaces rather than sharp corners.

- **Standard Cards & Containers**: `24px` or `16px`
  - *Tailwind*: `rounded-3xl` or `rounded-2xl`
  - *Usage*: Main content sections, trip details, user profile sections, and search result cards.
- **Large Sections & Page Modules**: `32px` or `48px`
  - *Tailwind*: `rounded-[2rem]` or `rounded-[3rem]`
  - *Usage*: Distinct major modules like the Remix Studio canvas or Travel Services sections.
- **Buttons & Small Elements**: `12px`
  - *Tailwind*: `rounded-xl`
  - *Usage*: Standard buttons, small media containers, and tags.
- **Pills, Badges, & Avatars**:
  - *Tailwind*: `rounded-full`
  - *Usage*: Profile pictures, status pills, floating action buttons.

---

## 🌤️ Shadows & Depth

Shadows are used alongside subtle borders (`border-zinc-100` or `border-zinc-200`) to create a clean, layered aesthetic.

- **Standard Content Cards**: 
  - *Tailwind*: `shadow-sm` + `border border-zinc-100`
  - *Usage*: Resting state for most cards, search results, and feed items.
- **Hover & Interactive States**:
  - *Tailwind*: `shadow-lg` or `shadow-xl` (often paired with `hover:-translate-y-0.5` or `hover:scale-105`)
  - *Usage*: When a user hovers over an interactive card or service module.
- **Modals & Floating Navigation**:
  - *Tailwind*: `shadow-2xl`
  - *Usage*: Fixed headers, bottom bars, and prominent modals (e.g., Remix Studio or Publish Modals).
- **Glow & Colored Shadows (Micro-Aesthetics)**:
  - *Tailwind*: `shadow-orange-500/20` or `shadow-blue-500/20`
  - *Usage*: Applied to primary CTA buttons to give them a premium, radiant glow.

---

## 📝 Typography

- **Sans-Serif (Body & UI)**: `Inter`, UI Sans-serif
- **Display (Headings)**: `Space Grotesk`
- **Serif (Accents)**: `Playfair Display`

*(These are configured in `index.css` under `--font-sans`, `--font-display`, and `--font-serif`)*
