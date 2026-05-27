**InkWell**

**Design Document --- Frontend Guidelines**

Visual Language, Component Patterns & Implementation Rules

Version 1.0 \| May 2026

**1. Design Philosophy**

InkWell\'s visual identity is built on glassmorphism --- frosted glass
surfaces floating on deep gradient backgrounds --- paired with luminous
accent colours and generous whitespace. The aesthetic must serve the
content: every decorative choice must reduce cognitive load, not add to
it.

Three pillars:

-   Immersion: The UI disappears; the content takes over.

-   Delight: Subtle glows, micro-animations, and tactile inputs make
    every interaction feel premium.

-   Performance: Zero framework. Pure CSS3 and Vanilla JS keep bundles
    tiny and rendering fast.

**2. Colour System**

**2.1 Primary Palette**

  --------------------------------------------------------------------------------------
  **Token**                 **Hex Value**            **Usage**
  ------------------------- ------------------------ -----------------------------------
  \--color-primary          #3B82F6                  Primary CTA buttons, active states,
                                                     links

  \--color-primary-glow     rgba(59,130,246,0.4)     Button shadow, input focus ring
                                                     glow

  \--color-accent           #8B5CF6                  Tag pills (random hue rotation),
                                                     headings accent

  \--color-bg-dark          #0A0F1E                  Dark mode page background

  \--color-surface-dark     rgba(255,255,255,0.06)   Dark mode card/glass surface

  \--color-surface-border   rgba(255,255,255,0.12)   Card borders in dark mode

  \--color-bg-light         #F8FAFC                  Light mode page background

  \--color-surface-light    #FFFFFF                  Light mode card surface

  \--color-text-primary     #1A202C / #F7FAFC        Body text (dark/light)

  \--color-text-muted       #718096 / #A0AEC0        Meta text, timestamps
  --------------------------------------------------------------------------------------

**2.2 Tag Pill Colours**

Tag pills rotate through a predefined palette injected via JavaScript.
Each tag name is hashed to one of 8 hues: Blue, Violet, Teal, Rose,
Amber, Cyan, Lime, Fuchsia. Ensure 4.5:1 contrast between text and pill
background in both themes.

**3. Typography**

  -------------------------------------------------------------------------
  **Element**       **Font**       **Size /       **Usage**
                                   Weight**       
  ----------------- -------------- -------------- -------------------------
  Display / Hero    Inter or       48--64 px /    Landing page headline
                    System         800            

  Page Title (H1)   Inter          36 px / 700    Post title on reading
                                                  view

  Section (H2)      Inter          24 px / 600    Dashboard section headers

  Sub-section (H3)  Inter          18 px / 600    Widget headings

  Body Copy         Georgia /      16--18 px /    Article body text
                    Serif          400            

  UI Labels         Inter          14 px / 500    Buttons, nav items, tags

  Caption / Meta    Inter          12 px / 400    Timestamps, author name
  -------------------------------------------------------------------------

Line height for body copy: 1.8 (reading comfort). Max content width for
articles: 680 px (centres on wide screens).

**4. Glassmorphism Component Patterns**

**4.1 The Glass Card**

CSS recipe (dark mode):

.glass-card { background: rgba(255,255,255,0.06); border: 1px solid
rgba(255,255,255,0.12); border-radius: 16px; backdrop-filter:
blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 8px 32px
rgba(0,0,0,0.4); }

Light mode override: background: rgba(255,255,255,0.8); border: 1px
solid rgba(0,0,0,0.08);

**4.2 Glowing Button**

-   Background: linear-gradient(135deg, #3B82F6, #6366F1).

-   Box-shadow: 0 0 20px rgba(59,130,246,0.5), 0 4px 16px
    rgba(59,130,246,0.3).

-   Hover state: scale(1.03) transform + increased glow opacity.

-   Active state: scale(0.98) transform.

-   Transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1).

**4.3 Rounded Inputs**

-   Border-radius: 999px (pill-shaped).

-   Default border: 1px solid rgba(255,255,255,0.15).

-   Focus ring: box-shadow 0 0 0 3px rgba(59,130,246,0.4) --- never use
    the browser default outline.

-   Padding: 12 px 20 px.

**4.4 Skeleton Loader Cards**

-   Use CSS animation: shimmer 1.5s infinite linear.

-   Background: linear-gradient(90deg, surface 25%, lighter 50%, surface
    75%) 200% / 400%.

-   Three cards rendered during feed loading state.

-   Replaced with real cards once data resolves (fade-in 0.3 s).

**5. Layout System**

**5.1 Page Grid**

-   Dashboard: CSS Grid --- 64 px left sidebar \| 1fr main content \|
    280 px right sidebar.

-   Mobile (\< 768 px): sidebar collapses to bottom tab bar; right
    sidebar hidden; single-column feed.

-   Tablet (768--1199 px): left sidebar shows icon-only (48 px); right
    sidebar collapses into a bottom sheet.

**5.2 Spacing Scale (8-pt grid)**

  -----------------------------------------------------------------------
  **Token**           **Value**     **Usage**
  ------------------- ------------- -------------------------------------
  \--space-1          4 px          Icon micro-padding

  \--space-2          8 px          Tag pill internal padding

  \--space-3          12 px         Input internal padding (vertical)

  \--space-4          16 px         Card internal padding

  \--space-6          24 px         Section gap

  \--space-8          32 px         Card gap in grid

  \--space-12         48 px         Page section vertical margin
  -----------------------------------------------------------------------

**6. Micro-Animations**

**6.1 Rules**

-   All transitions: 0.2 s ease-out unless specified otherwise.

-   Never animate layout properties (width, height, top, left) --- use
    transform and opacity only.

-   Respect prefers-reduced-motion: wrap all keyframe animations in
    \@media (prefers-reduced-motion: no-preference).

**6.2 Key Animations**

  -----------------------------------------------------------------------------
  **Component**       **Animation**         **Duration / Easing**
  ------------------- --------------------- -----------------------------------
  Button hover        scale(1.03) + glow    200 ms ease-out
                      intensify             

  Card hover          translateY(-4px) +    200 ms ease-out
                      shadow intensify      

  Feed card entry     opacity 0→1 +         300 ms ease-out, staggered 60 ms
                      translateY(16px→0)    

  Skeleton shimmer    background-position   1500 ms linear infinite
                      scroll                

  Auth form toggle    cross-fade between    250 ms ease-in-out
                      forms                 

  Tag pill add        scale(0→1)            200 ms spring

  Toast notification  slideIn from bottom + 300 ms + 3 s hold
                      auto-dismiss          
  -----------------------------------------------------------------------------

**7. Theme Implementation**

Themes are implemented via CSS custom properties on the :root element.
The data-theme=\'dark\' attribute on \<html\> overrides the defaults.

-   Default (Light): :root { \--bg: #F8FAFC; \--surface: #FFFFFF;
    \--text: #1A202C; }

-   Dark: \[data-theme=\'dark\'\] { \--bg: #0A0F1E; \--surface:
    rgba(255,255,255,0.06); \--text: #F7FAFC; }

-   Theme toggled by JS: document.documentElement.dataset.theme =
    \'dark\'.

-   Persisted to localStorage and synced to user account via PATCH
    /api/users/me on next auth.

**8. Component File Structure**

-   / (root)

    -   /components/ --- reusable UI components (GlassCard, Button,
        Input, TagPill, Modal, Skeleton)

    -   /pages/ --- route-level HTML files (index, dashboard, post,
        profile, auth, settings)

    -   /styles/ --- global.css, variables.css, themes.css,
        animations.css, components.css

    -   /scripts/ --- app.js (router), auth.js, feed.js, editor.js,
        profile.js, utils.js

    -   /assets/ --- icons (SVG sprite), logo variants

All CSS in external files (no inline styles except dynamic values). All
JS modules use ES Modules with type=\'module\' on script tags.
