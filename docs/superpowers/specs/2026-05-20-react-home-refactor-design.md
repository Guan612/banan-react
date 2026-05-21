## Overview

Refactor the React homepage so it follows the business structure of `C:\Users\Administrator\code\banana\frontend-vue3\src\views\Home.vue` while still using modern React architecture, small components, and TanStack Query-based data flow.

This refactor is limited to homepage structure and data display. It does not implement the full Vue homepage creation workflow.

## Goals

- Replace the current simplified React homepage with a product-oriented homepage
- Align the homepage information architecture with the Vue version's core sections
- Use real backend homepage data where appropriate
- Keep the React implementation idiomatic and componentized
- Avoid large single-file page components with mixed data, UI, and modal logic

## Non-Goals

- Rebuilding the Vue homepage pixel-for-pixel
- Implementing the full "start creating" workflow
- Implementing real style preset loading and submission
- Reproducing all Vue motion and animation details
- Refactoring unrelated routes or the broader workbench product structure
- Replacing the existing auth flow that has already been added

## Source Reference

The Vue homepage in `frontend-vue3/src/views/Home.vue` currently includes three meaningful business layers:

- Hero entry area with story input and creation CTA
- Authenticated recent projects area backed by `GET /api/sora2-workflow?skip=0&limit=6`
- Public user works area backed by `GET /api/home-videos/public`

The React refactor should mirror those layers conceptually, but with React-first composition and smaller responsibilities per file.

## Route Scope

Only the `/` route is being refactored in this pass.

The auth routes already added remain in place:

- `/`
- `/login`
- `/register`

## Page Structure

The homepage should be composed of four sections.

### 1. Hero Section

Purpose:

- communicate product positioning
- provide a strong first-screen entry point
- visually echo the Vue homepage's "creative workspace entry" idea

Content:

- badge or short product descriptor
- headline
- supporting copy
- large input area styled like a creation surface
- style selection trigger button for presentation only
- primary CTA

Behavior in first pass:

- input is local UI state only
- style selector is presentational or placeholder interaction only
- CTA does not create a workflow yet
- guest CTA should guide toward login or registration
- authenticated CTA should guide to the work area or show a placeholder action that does not claim full creation is implemented

### 2. Recent Projects Section

Purpose:

- give authenticated users continuity from homepage to workspace

Behavior:

- visible only when the user is authenticated
- backed by `GET /api/sora2-workflow?skip=0&limit=6`
- show a small, concise list of recent projects
- clicking a project should navigate into the related project route

### 3. User Works Section

Purpose:

- provide public homepage content that reflects real product usage

Behavior:

- backed by `GET /api/home-videos/public`
- visible to all users
- show responsive cards derived from homepage video data
- clicking a card opens a lightweight video preview modal

First-pass layout requirement:

- do not introduce a complex waterfall dependency unless truly necessary
- prefer a stable responsive grid or masonry-like layout using current CSS capabilities

### 4. Footer Quote / Closing Copy

Purpose:

- retain a motivational closing note inspired by the Vue page
- keep the product tone coherent without directly copying the original verbatim if that feels out of place

## React Architecture

The homepage must be broken into focused units.

### Route Layer

- `src/routes/index.tsx`
  - decides authenticated vs guest page composition at a high level
  - does not own detailed card mapping, modal state orchestration, or API shaping beyond composition

### Feature Components

- `src/features/home/home-page.tsx`
- `src/features/home/hero-section.tsx`
- `src/features/home/recent-projects.tsx`
- `src/features/home/public-video-gallery.tsx`
- `src/features/home/video-preview-modal.tsx`
- `src/features/home/footer-quote.tsx`

### Data Hooks

- `src/features/home/use-home-videos.ts`
- `src/features/home/use-recent-projects.ts`

### Shared Types / Mapping

- `src/features/home/home-types.ts`

The intent is:

- hooks fetch and normalize backend data
- components render already-shaped props
- route composes sections and login-aware visibility

## Data Flow

### Auth State

Continue using the existing auth model:

- `useProfile()` determines whether the user is authenticated
- the homepage should not duplicate token or profile resolution logic

### Home Videos

`useHomeVideos()` should:

- request `GET /api/home-videos/public`
- return normalized card-friendly objects
- expose loading, empty, and error-friendly states

### Recent Projects

`useRecentProjects()` should:

- request `GET /api/sora2-workflow?skip=0&limit=6`
- only enable when authenticated
- map workflow records into lightweight card/chip models

### UI State

Use local component state for:

- hero textarea content
- currently selected preview video
- preview modal open/close state

Do not introduce new global state for homepage-only interactions.

## API Expectations

Homepage refactor should connect to these endpoints:

- `GET /api/home-videos/public`
- `GET /api/sora2-workflow?skip=0&limit=6`

No homepage refactor code should claim that workflow creation is complete unless the API flow is actually implemented in a later task.

## UX Decisions

### Hero CTA

First pass should avoid fake completion claims.

Recommended behavior:

- guest users: CTA links to login or register
- authenticated users: CTA links to an existing workspace route instead of pretending to create a project

This keeps the entry point useful without overpromising incomplete behavior.

### Video Preview

Use a simple modal preview:

- poster or cover still visible in the card
- click opens a modal with the video element
- no heavy custom player logic in first pass

### Responsive Layout

Ensure:

- hero remains readable on narrow screens
- recent projects wrap cleanly
- user works cards adapt from 1 column on mobile to multiple columns on larger screens

## Styling Strategy

The React homepage should:

- reuse the current project design tokens and visual language
- preserve the existing shell, typography tokens, and glass/island surfaces when appropriate
- avoid pasting the Vue page's scoped CSS wholesale

The result should feel like the same product family, but implemented in a React-native way.

## Error and Empty States

### Home Videos

- loading: show lightweight loading placeholders or loading copy
- empty: show a meaningful empty message
- failure: degrade gracefully to an empty-state-style message rather than breaking the page

### Recent Projects

- no projects: show a small empty-state hint for authenticated users
- failure: avoid breaking the rest of the homepage; hide or degrade the section cleanly

## Testing Strategy

Implementation should follow TDD.

Minimum coverage for this refactor:

- `useHomeVideos()` success and empty/error handling
- `useRecentProjects()` disabled state when unauthenticated
- homepage guest rendering includes hero and public works section
- homepage authenticated rendering includes recent projects section
- clicking a work card opens the preview modal
- responsive and visual details are not snapshot-tested; test behavior and structure instead

## Acceptance Criteria

- `/` is no longer a starter template page
- homepage structure clearly reflects the Vue homepage's core business sections
- public user works are loaded from `/api/home-videos/public`
- authenticated users can see recent projects loaded from `/api/sora2-workflow?skip=0&limit=6`
- hero section is present and styled as a product entry surface
- homepage is composed from focused React components, not a single large page file
- modal preview for video cards works
- mobile and desktop layouts are both usable

## Implementation Notes

- keep the first pass limited to homepage structure and data display
- do not introduce unnecessary new libraries if current CSS/layout tools are enough
- prefer small, composable pieces over a literal Vue-to-React translation
