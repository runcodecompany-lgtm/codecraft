# UI/UX Design System Audit & Refactor — TODO

## Foundation (Tokens / Direction / Accessibility)
- [ ] Unify design tokens: make `app/design-tokens.css` the single source of truth
- [ ] Refactor `app/globals.css` to remove duplicated tokens/utilities that conflict
- [ ] Ensure consistent RTL/LTR behavior (logical CSS + correct `dir`)
- [ ] Verify focus states and icon-only controls have accessible labels

## Components / Navigation
- [ ] Audit `components/navbar.tsx` vs `components/ui/navbar.tsx` and consolidate
- [ ] Audit `components/ui/button.tsx`, `card.tsx`, `input.tsx` and align to unified tokens

## Page-by-page UI/UX Audit
- [ ] Landing page (`app/page.tsx`)
- [ ] Auth pages (`app/login`, `app/register`, `app/verify-email`, reset flow)
- [ ] Student dashboard (`app/dashboard/student/*`)
- [ ] Teacher dashboard (`app/dashboard/teacher/*`)
- [ ] Admin dashboard (`app/dashboard/admin/*`)
- [ ] Courses/Lessons/Quizzes/Community pages

## Responsive + RTL fixes
- [ ] Ensure no horizontal overflow on mobile/tablet/large screens
- [ ] RTL tables/forms/modal alignment fixes across key flows

## Verification
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Final visual audit in Light/Dark + RTL
- [ ] Compute completion percentage + remaining issues list
