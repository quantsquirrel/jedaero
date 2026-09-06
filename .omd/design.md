# Design contract

> This file is the persistent design contract for this project. It is the upstream
> authority for every surface decision. Established by `omd design`, maintained by
> the designer. Everything under `.omd/` is English; this contract is no exception.

---

## Source of truth

- **Status**: draft
- **Date**: 2026-09-06
- **Surfaces**: No existing surface detected
- **Repository app/toolchain evidence**: next.config.ts
- **Evidence**: 1 reference capture: designsystem.digital.gov.smoke-test-alert
- **Framework**: next (detected via package.json)
- **Tokens**: No token files found — define `:root` CSS custom properties or a theme config

---

## Brand

- **Personality**: <!-- Open question: what three adjectives describe this brand's character? -->
- **Trust signals**: <!-- Open question: what makes users trust this product? domain expertise, testimonials, price transparency, certifications? -->
- **Avoid**: <!-- Open question: what aesthetics, tones, or references does this brand explicitly reject? -->

---

## Product goals

Derived from .omd/frame.md:
  ---
  why: >-
    ### 증거 (우선순위 순 — 현재 브리프 > 현재 사용자 명시 > 선행 프로젝트 취향 > 에이전트 선택)

<!-- Open question: what are the top two or three measurable outcomes this product must achieve? -->

---

## Personas & jobs

<!-- Open question: who uses this product and what job are they hiring it to do?
     Format: Persona name — one sentence on who they are and what they need to accomplish. -->

---

## Information architecture

<!-- List the surfaces, their hierarchy, and the primary user path through them.
     Example:
       - / (home) — first impression, conversion
       - /pricing — decision
       - /docs — activation
     Primary path: home → pricing → sign up

     UX decision constraints (see theory/ux.md):
     - Name the primary task the user arrives with on each surface.
     - Name the most frequent action per surface (defaults are set for this case).
     - Name the costliest error per surface and confirm a recovery path exists.
     - Every state the user can reach must have an exit (no dead ends). -->

---

## Design principles

<!-- Two to four product-specific principles that resolve conflicts when two valid choices both work.
     Example: "Clarity beats cleverness — when a UI pattern is clever but unfamiliar, use the familiar one." -->

---

## Visual language

### Color
<!-- Token names and roles. Fill from .omd/attribution.md if present. -->

### Typography
<!-- Type scale, font families, weight ladder. -->

### Spacing
<!-- Spacing ladder. -->

### Radius
<!-- Corner radius ladder. -->

### Motion
<!-- Open question: duration range, easing vocabulary, and whether motion is decorative or functional. -->

---

## Components

### Reused (already built)
<!-- List components already in the codebase with their location. -->

### New (to be built)
<!-- List components that do not yet exist and must be built. -->

### Variants
<!-- Which components need size/color/state variants? List them. -->

### States
<!-- Which components carry interaction states? Cross-reference Interaction states section below. -->

---

## Accessibility

- **Target**: WCAG 2.2 AA minimum
- **Language**: <!-- primary language, e.g. "ko" for Korean. Determines word-break rules. -->
- **Focus management**: <!-- any non-standard focus routing (modals, skip-nav, single-page navigation)? -->

---

## Responsive behavior

- **Breakpoints**: 375px (base) / 768px / 1280px
- **Mobile-first**: yes — base styles target 375px, larger viewports layer on top
- **Exceptions**: <!-- any surfaces that are desktop-only or have non-standard breakpoints? -->

---

## Interaction states

Every interactive surface must account for all applicable states. Each state is either
implemented or explicitly skipped with a reason recorded in `omd decision`.

### Loading
<!-- How does the UI signal that data is in flight? Skeleton, spinner, shimmer, or disabled state?
     Which surfaces show loading: forms (after submit), data lists, async navigation? -->

### Empty
<!-- What does a data list, feed, or result set show when there is nothing to display?
     An empty container is a design defect. Every list needs an empty state. -->

### Error
<!-- How are error conditions surfaced? Form validation errors (field-level + summary),
     network failures, permission errors. Minimum: role=alert on error messages,
     aria-invalid on failed fields, visible error copy that states what to do next. -->

### Success
<!-- How is a completed action confirmed? Inline confirmation, toast, page transition,
     or a dedicated success screen? Duration and dismissal behaviour. -->

### Disabled
<!-- Disabled elements must still communicate why they are disabled. A greyed-out button
     with no tooltip is an accessibility failure. Either remove the element when the
     action is unavailable, or pair the disabled state with explanatory copy. -->

### Offline
<!-- Does this product have any offline capability or offline-detection UI?
     If not, document that it is an explicit non-requirement. -->

---

## Content voice

<!-- Open question: what register does this product use? Formal/informal, warm/authoritative, Korean 해요체/합니다체. Cite a voice study capture from the reference board. -->

---

## Implementation constraints

- **Stack precedence**: explicit user request > existing repository stack/toolchain (including existing vanilla HTML) > React + Vite + TypeScript only for a truly blank greenfield
- **Build-time stack policy**: Preserve the detected next repository stack/toolchain.
- **Dependencies**: Do not add unnecessary dependencies to this existing project.
- **Browser targets**: last 2 major versions of Chrome, Firefox, Safari, Edge
- **Performance**: <!-- any specific performance budget? LCP target, bundle size limit? -->
- **Frameworks/libraries already in use**: next (detected via package.json)
- **Additional constraints**: <!-- any deploy environment, CMS, or accessibility certification constraints? -->

---

## Open questions

<!-- Collect unresolved decisions here. Each question should name who can answer it
     and what the consequence of the default assumption is.

     Template:
       - Q: [question]
         Default assumption: [what will be implemented if unanswered]
         Consequence if wrong: [what breaks or must be rebuilt]
         Owner: [designer / product / engineering]
-->
