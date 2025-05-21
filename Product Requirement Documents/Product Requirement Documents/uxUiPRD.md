# idiy – UX / UI PRD

> **Status:** Draft v0.1  
> **Last updated:** 20 May 2025

## 1 · Purpose
Define platform-wide interaction patterns, layout grid, components and visual language for idiy, ensuring consistency across Web + PWA and guiding designers & front-end engineers.

## 2 · Scope (MVP)
* Three-column layout (Sidebar · Main · Floating Panel)
* Seven primary pages (Dashboard, My Tasks, Inbox, Projects, Calendar, Reports, Settings)
* Five project views (Outline, Table, Kanban, Calendar, Timeline)
* Dark/Light themes, responsive from ≥1280 px to 375 px

## 3 · Information Architecture
```
/ (root)
 ├ dashboard
 ├ my-tasks
 ├ inbox
 ├ projects
 │   ├ :projectId
 │   │   ├ outline (default)
 │   │   ├ table
 │   │   ├ kanban
 │   │   ├ calendar
 │   │   └ timeline
 ├ calendar
 ├ reports
 └ settings
```

## 4 · Layout Grid
| Region | Width | Behaviour |
|--------|-------|-----------|
| Sidebar | 72 px (expanded) · 48 px (collapsed) | Sticky, can auto-hide on < 768 px |
| Main | `calc(100% – sidebar – floatingPanel)` | Scrolls vertically. Tab bar lives under header when inside project. |
| Floating Panel | 220 px | Toggles with ⌘→; overlays on mobile (Radix Sheet). |
| Top Bar (mobile only) | — | Hamburger toggles Sidebar; global Quick Add “+” button. |

## 5 · Navigation Components
| Component | Details |
|-----------|---------|
| **SidebarItem** | Icon (lucide) + Label. Tooltip on hover when collapsed. Badge for Inbox unseen. |
| **Breadcrumb** | Appears in Project subpages: `Projects › Marketing Site › Kanban`. |
| **TopBar (mobile)** | Hamburger, logo, Quick Add (+) on right. |

## 6 · Primary Screens
### 6.1 Inbox
* Quick Add bar pinned on top; auto-focus on page load.
* Table list; inline edit on double-click; Shift select for bulk move.
* Header chip filters: Tag · Creator.

### 6.2 Project Workspace Tabs
| Tab | Key Interactions |
|-----|------------------|
| Outline | Expand (▶) / Collapse (⌥-Click to toggle subtree). Quick Add child with ⌘⏎. |
| Table | Resizable cols; Filter row; Ctrl+Click multi-sort. |
| Kanban | Drag to reorder column; column WIP badge. |
| Calendar | Drag to reschedule; multi-select by rectangle (shift-drag). |
| Timeline | Horizontal scroll + zoom slider (week ↔ quarter). |

### 6.3 Calendar (global)
* Dual-pane: Month grid & right mini list of tasks.
* Toggle Sat/Sun chips (S / U / SU).

## 7 · Component Library (shadcn / Radix)
| Group | Components |
|-------|------------|
| Data display | Card, Table, Badge, Avatar, ProgressBar |
| Inputs | Button, Input, Select, DatePicker (Radix Popover+Calendar), Switch, Slider |
| Overlays | Dialog, Tooltip, Sheet, DropdownMenu, Command Palette (⌘K) |
| Motion | Framer Motion variants: FadeInUp, SlideLeft, ConfettiBurst |

## 8 · Theming
Tailwind tokens (excerpt):
```js
"primary":      "#2563EB",
"primary-foreground": "#ffffff",
"background":   "#FFFFFF",
"background-dark":"#0F1116",
"surface":      "#F9FAFB",
"surface-dark": "#1B1E24",
```
Dark mode = `[data-theme="dark"]` root attr, toggled by UserSettings.

## 9 · Accessibility & i18n
* Keyboard focus ring (#3B82F6, 2 px).  
* All interactive elements ≥ 44 × 44 px on mobile.  
* RTL ready (via `dir="rtl"` testing).  
* Locale switch (en-US / vi-VN) in Settings; dates via day.js i18n.

## 10 · Edge Cases
* Sidebar collapsed + Floating Panel open at < 1280 px → main content gets min-width 680 px then horizontal scroll warning.
* Kanban column > 400 tasks → virtualised list.
* Timeline zoomed out (≥ 2 years) → milestones aggregate dots.

## 11 · Open Questions
1. Should Floating Panel include dedicated **Checklist** tab?  
2. Reports page: confirm chart set (velocity, CFD, gantt burn-up?)  
3. Mobile Inbox: keep Quick Add pinned?  

> Update this spec by editing **uxUiPRD.md** or comment in canvas.
