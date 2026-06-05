# PRD — "Closet" (working title): AI Personal Stylist Web App

> A mobile-first web app that helps women get more out of the clothes they already own. Users photograph their wardrobe once, then chat with an AI stylist that proposes outfits matched to the day's weather, schedule, and occasion — while nudging them toward the items they rarely wear.

---

## 1. Problem & Vision

**Problem.** Deciding what to wear every day is hard, especially on busy mornings when the outfit has to fit the weather and the day's plans (work, studying, going out). At the same time, most people own a lot of clothes but cycle through the same few items — leaving the rest of the wardrobe unused, which feels wasteful.

**Vision.** A pocket personal stylist. You teach it your closet once. After that, you tell it about your day and it returns ready-to-wear outfits assembled from clothes you already own — with real reasoning about color, occasion, and weather, and a deliberate bias toward rediscovering neglected pieces.

**One-line pitch.** "Tell me about your day; I'll dress you from your own closet."

---

## 2. Goals & Non-Goals

### Goals (what success looks like)
- Reduce daily "what do I wear" decision time to under a minute.
- Increase the share of the wardrobe that actually gets worn (surface underused items).
- Produce outfit suggestions that are genuinely appropriate for weather + occasion + the user's stated mood.
- A calm, warm, low-friction experience that feels like texting a stylish friend.

### Non-Goals (explicitly out of scope for v1)
- E-commerce / shopping recommendations for new clothes.
- Social feed, sharing, or following other users.
- Body-measurement / virtual try-on / AR.
- Multi-person or family wardrobes.
- Native iOS/Android apps (this is a mobile web app / PWA).

---

## 3. Target User

Primary persona: a woman with a full wardrobe who feels decision fatigue in the morning and guilt about unworn clothes. She's comfortable taking photos with her phone and chatting with an AI. She values looking put-together but doesn't want to spend mental energy planning.

---

## 4. Core User Flows

### 4.1 First-time user — Onboarding & wardrobe upload
1. Sign up / log in.
2. Land on the **Upload screen** (the very first thing a new user sees): a friendly prompt to add all the clothing photos they want in their database.
3. User selects/captures photos (multi-select from camera roll, or take photos one by one).
4. Each photo is auto-analyzed by a vision model into structured attributes (see §6). A progress state shows items being added to the closet.
5. User can optionally review/correct tags (v1.1 — can be minimal in v1).
6. Once at least N items exist, user is taken to the **Home screen**.

### 4.2 Returning user — Daily styling
1. Land on the **Home screen**: `Hello, {name}` + a catchy line, e.g. *"What's the mood today?"* + a chat entry point.
2. User types a request, e.g. *"Work meeting this morning then drinks with friends tonight."*
3. The **stylist agent asks 1–3 clarifying questions** before answering (see §5).
4. Agent assembles and presents **2–3 outfit options**, each rendered as the actual photos of the user's items, with a short rationale.
5. User can ask for tweaks ("more casual", "swap the shoes", "I'm cold"), mark a favorite, or "I'll wear this" (which logs the wear — see §7).

### 4.3 Manage closet
- A **Closet screen** where the user can browse all items (filter by category/color), add more, and edit or delete items.

---

## 5. The Stylist Agent (the heart of the product)

The agent behaves like a thoughtful personal stylist, not a search box.

### 5.1 Behavior requirements
- **Clarify before answering.** When a request is ambiguous, ask 1–3 short clarifying questions first. Never dump questions endlessly; one well-chosen round is the target. Examples of what to clarify: formality level, indoor/outdoor, comfort vs. statement, whether there's a specific item they want to build around, and confirming the weather/location if not already known.
- **Reason about color & coordination.** Understand which colors work together (complementary/analogous/neutral pairing), pattern mixing limits, and proportion/silhouette basics. Rationale should be brief and human, not a lecture.
- **Respect occasion & weather.** Match formality to the stated context; account for temperature, rain, wind. Pull real weather for the user's location/day rather than guessing.
- **Bias toward underused items.** When multiple valid options exist, prefer items the user wears rarely (using wear counts from §7). This directly serves the "I only wear the same few things" problem. The agent can gently call this out ("You haven't worn this in a while — it's perfect for today").
- **Stay within the closet.** Only suggest items the user actually owns. If the closet genuinely lacks something appropriate, say so honestly and offer the best available alternative.
- **Iterate.** Support follow-up adjustments in the same conversation while keeping context (the day, the weather, what was already proposed).

### 5.2 How outfits get assembled (recommended technical approach)
1. **Filter candidates.** From the request + clarifications, pre-filter the wardrobe by obvious constraints (category needs, season/weather suitability, formality) to a manageable candidate set.
2. **Reason over structured data.** Pass the candidate items as structured JSON (id + attributes, not raw images) to the Claude API, with a system prompt encoding the stylist behavior above plus the weather and occasion context. Ask it to compose 2–3 complete outfits and return **item IDs + a one-line rationale per outfit** in a strict JSON schema.
3. **Render.** The app maps returned IDs back to the stored item photos and displays each outfit as a visual collage/stack.
4. **Wear-frequency signal.** Include each item's wear count in the JSON and instruct the model to favor low-count items when quality is otherwise comparable.

> Keeping the model's job to *reasoning over structured metadata and returning IDs* (rather than generating images) keeps it reliable, cheap, and visually faithful to the real wardrobe.

---

## 6. Wardrobe Ingestion & Item Model

### 6.1 Upload
- Multi-photo upload from camera roll, plus single-photo capture.
- **v1 assumption:** one clothing item per photo (cleaner auto-tagging). Multi-item photos / background removal can come later.
- Show progress as items are analyzed and added.

### 6.2 Auto-tagging (vision)
Each photo is sent to a vision-capable Claude model that returns structured attributes. Suggested schema per item:

```json
{
  "id": "uuid",
  "image_url": "storage path",
  "category": "top | bottom | dress | outerwear | shoes | accessory | other",
  "subcategory": "e.g. t-shirt, blazer, jeans, sneakers",
  "primary_color": "string",
  "secondary_colors": ["string"],
  "pattern": "solid | striped | floral | plaid | print | other",
  "material_guess": "string (optional)",
  "formality": "casual | smart-casual | business | formal | sporty",
  "season": ["spring", "summer", "fall", "winter"],
  "warmth": "light | medium | warm",
  "notes": "free-text stylist-relevant detail",
  "wear_count": 0,
  "last_worn": null,
  "created_at": "timestamp"
}
```

- The user can edit any field (v1.1; in v1 at minimum allow delete + re-upload).

---

## 7. Wear Tracking (supports the anti-waste goal)
- When a user picks an outfit ("I'll wear this"), increment `wear_count` and set `last_worn` for each item in it.
- The styling agent reads these signals to surface neglected items.
- (v2) A simple "least worn" view or gentle weekly nudge ("12 items you haven't worn this season").

---

## 8. Screens (UI Spec)

1. **Auth** — minimal sign up / log in.
2. **Onboarding / Upload** *(first screen for new users)* — warm welcome, clear single CTA to add wardrobe photos, multi-select + camera, progress feedback.
3. **Home** *(returning users)* — `Hello, {name}`, a catchy mood line ("What's the mood today?"), and a prominent chat entry. Optionally a quick glance at weather and a "Surprise me" shortcut.
4. **Chat / Stylist** — conversational thread; agent's clarifying questions render as quick-tap chips where possible; outfit results render as visual outfit cards.
5. **Outfit detail** — the full outfit with each item photo, rationale, actions (favorite, "I'll wear this", request tweak).
6. **Closet** — grid of all items, filter by category/color, add/edit/delete.
7. **(v2) History / Favorites** — past worn outfits and saved looks.

---

## 9. Design System

Direction: **warm, modern, clean, round, minimal.** Generous whitespace, soft shadows, large corner radii, calm pacing. It should feel like a serene, premium closet — not a busy utility app.

**Color palette (starting tokens — tune in build):**
- Background: warm off-white / cream (`#FBF7F2`)
- Surface / cards: white with a warm tint (`#FFFDFB`)
- Primary text: warm near-black (`#2B2622`)
- Secondary text: warm grey (`#8A817A`)
- Accent (primary action): soft terracotta / clay (`#C97B5A`)
- Accent secondary: muted sage or dusty rose (`#A7B0A0` / `#D8A8A0`)
- Borders/dividers: very light warm grey (`#ECE6DF`)

**Type:** one clean, slightly warm/rounded sans (e.g. a friendly geometric sans). Clear hierarchy, comfortable line height. Avoid hard, corporate fonts.

**Shape & motion:** large radii (cards ~20–24px, buttons fully rounded/pill where suitable), soft diffuse shadows, subtle fade/slide transitions, no harsh edges.

**Components:** pill buttons, chip-style quick replies, rounded image cards, bottom nav (Home / Closet / Chat). Mobile-first; everything reachable with one thumb.

---

## 10. Recommended Tech Stack (suggestion — adjust to taste)
- **Frontend:** React (Next.js or Vite), mobile-first, Tailwind CSS, installable as a PWA.
- **Backend:** Next.js API routes (or a small Node/Express service) to keep API keys server-side.
- **Auth + DB + Storage:** Supabase (Postgres + Auth + file storage in one) — pairs well with this app's needs (user accounts, item images, structured metadata).
- **AI:** Anthropic Claude API — a cost-effective vision-capable model for tagging on upload, and a strong reasoning model for the styling chat. Always call the API server-side; never expose the key in the client. Check `docs.claude.com` for current model names and the latest SDK usage rather than hardcoding from memory.
- **Weather:** a location-based weather API (e.g. OpenWeather or similar) called server-side.

---

## 11. MVP Scope vs. Later

**MVP (build first):**
- Auth.
- Wardrobe upload + auto-tagging into the item model.
- Closet view (browse, delete).
- Stylist chat: clarifying questions → 2–3 outfit suggestions rendered from real item photos, using live weather + occasion + color reasoning.
- Basic wear tracking ("I'll wear this" → increment counts; agent favors low-count items).

**v1.1 / v2 (later):**
- Manual tag editing.
- Favorites & outfit history / calendar.
- "Least worn" insights and nudges.
- Multi-item-per-photo upload + background removal.
- Packing / travel mode.
- Capsule-wardrobe analytics.

---

## 12. Assumptions & Decisions to Confirm
- **One item per photo** for v1 tagging (multi-item later). Confirm this matches how you expect to upload.
- **Weather is fetched automatically** from the user's location/day; user can override.
- **Outfit rendering = stacked/collaged real photos**, not AI-generated imagery.
- The stylist always asks at least one clarifying round before its first set of results, unless the request is already fully specified.
- App is a mobile web app / PWA (not native).

---

## 13. Open Questions
1. How many items minimum before the stylist is useful — should onboarding require a minimum count?
2. Do you want outfit suggestions to include accessories/shoes always, or only when relevant?
3. Should the agent have a named persona/voice, or stay neutral and warm?
4. Privacy: are wardrobe photos private-by-default per user (recommended yes)?
