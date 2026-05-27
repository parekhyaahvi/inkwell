**InkWell**

**Product Requirements Document**

A Modern Blogging Experience for Everyday Writers

Version 1.0 \| May 2026

**1. Product Overview**

InkWell is a full-stack, modern blogging platform purpose-built for
everyday writers. It combines distraction-free composition with a
glassmorphism UI aesthetic, a social reading community, and a
personalised content feed --- all accessible without any framework
dependency on the frontend.

**2. Product Goals & Success Metrics**

**2.1 Goals**

-   Enable any writer to publish beautifully formatted long-form content
    within 2 minutes of signing up.

-   Provide readers with a personalised, algorithm-driven content feed
    powered by tag filtering.

-   Foster community through frictionless commenting, following, and
    bookmarking.

-   Deliver a consistent glassmorphism visual experience across all
    screen sizes (mobile, tablet, desktop).

-   Maintain zero-framework frontend to maximise performance and
    portability.

**2.2 Success Metrics**

  -----------------------------------------------------------------------
  **Metric**                  **Target (3 months)** **Target (12
                                                    months)**
  --------------------------- --------------------- ---------------------
  Time-to-first-publish       \< 3 minutes          \< 2 minutes

  Monthly Active Writers      500                   5,000

  Monthly Active Readers      2,000                 25,000

  Average Session Duration    \> 4 min              \> 6 min

  Core Web Vitals (LCP)       \< 2.5 s              \< 2.0 s
  -----------------------------------------------------------------------

**3. User Personas**

**3.1 The Everyday Writer (Primary)**

  ------------------- ---------------------------------------------------
  **Name**            Priya --- Freelance Content Creator

  **Goal**            Publish polished articles without fighting the
                      editor or the UI

  **Pain Points**     Medium paywall fatigue; Substack too
                      newsletter-centric; Dev.to too technical

  **Needs**           Distraction-free editor, cover image upload, tag
                      pills, publish/draft actions
  ------------------- ---------------------------------------------------

**3.2 The Curious Reader (Secondary)**

  ------------------- ---------------------------------------------------
  **Name**            Rohan --- Tech-savvy knowledge seeker

  **Goal**            Discover high-quality posts in specific niches (AI,
                      Design, Web3)

  **Pain Points**     Algorithm bubbles on mainstream platforms; too many
                      ads

  **Needs**           Tag-based feed, bookmarks, immersive
                      distraction-free reading mode
  ------------------- ---------------------------------------------------

**4. Feature Requirements**

**4.1 Public Landing Page**

  ----------------------------------------------------------------------------
  **\#**   **Feature**           **Description**               **Priority**
  -------- --------------------- ----------------------------- ---------------
  F-01     Hero Section          Clear value prop headline,    P0
                                 Get Started CTA button, Learn 
                                 More link                     

  F-02     Featured Content Grid Show top 6 posts from the     P0
                                 platform visible to           
                                 unauthenticated visitors      

  F-03     Trending Tags Sidebar Clickable hashtags that       P1
                                 filter the public feed        

  F-04     Frictionless          Persistent top nav with Log   P0
           Navigation            In / Start Writing buttons    
  ----------------------------------------------------------------------------

**4.2 Authentication**

  ----------------------------------------------------------------------------
  **\#**   **Feature**           **Description**               **Priority**
  -------- --------------------- ----------------------------- ---------------
  F-05     Registration          Name, Email, Password fields  P0
                                 with rounded inputs and       
                                 glowing submit button         

  F-06     Login                 Email + Password with         P0
                                 seamless toggle to Register   
                                 screen                        

  F-07     Session Persistence   JWT stored in httpOnly        P0
                                 cookie, 7-day rolling expiry  

  F-08     Password Reset        Email-based OTP flow          P1
  ----------------------------------------------------------------------------

**4.3 Personalised Dashboard / Feed**

  ----------------------------------------------------------------------------
  **\#**   **Feature**           **Description**               **Priority**
  -------- --------------------- ----------------------------- ---------------
  F-09     Blog Feed Cards       Title, author avatar, date,   P0
                                 cover thumbnail, excerpt      

  F-10     Trending Tags Panel   Right sidebar; clicking a tag P0
                                 filters feed instantly        

  F-11     One-Click Bookmark    Bookmark icon on each card;   P1
                                 stored per user               

  F-12     Create Post CTA       Floating \'+\' button routes  P0
                                 to Writer\'s Canvas           

  F-13     Notifications         Bell icon in sidebar; shows   P2
                                 new comments/followers        
  ----------------------------------------------------------------------------

**4.4 Writer\'s Canvas (Post Editor)**

  ----------------------------------------------------------------------------
  **\#**   **Feature**           **Description**               **Priority**
  -------- --------------------- ----------------------------- ---------------
  F-14     Cover Image Upload    Drag-and-drop or file picker; P0
                                 stored in cloud storage       

  F-15     Article Title Field   Large editable placeholder,   P0
                                 supports rich text title      
                                 styling                       

  F-16     Tag Pills             Searchable tag input; renders P1
                                 colourful pill badges         

  F-17     Rich Body Editor      Notion-inspired blocks:       P0
                                 H1-H3, bold, italic, links,   
                                 code, images                  

  F-18     Publish Action        One-click publish;            P0
                                 transitions post to           
                                 \'published\' state           

  F-19     Save Draft Action     Auto-save every 30 s + manual P1
                                 save; keeps post in \'draft\' 
                                 state                         
  ----------------------------------------------------------------------------

**4.5 Single Post Reading View**

  ----------------------------------------------------------------------------
  **\#**   **Feature**           **Description**               **Priority**
  -------- --------------------- ----------------------------- ---------------
  F-20     Immersive Header      Full-width cover image with   P0
                                 title overlay                 

  F-21     Optimised Typography  Generous line-heights,        P0
                                 constrained content width     
                                 (680 px)                      

  F-22     Sticky Engagement     Like and Bookmark buttons     P1
                                 pinned to right edge while    
                                 scrolling                     

  F-23     Comment Section       Threaded comments, reply,     P1
                                 delete; ordered               
                                 chronologically               
  ----------------------------------------------------------------------------

**4.6 User Profile**

  ----------------------------------------------------------------------------
  **\#**   **Feature**           **Description**               **Priority**
  -------- --------------------- ----------------------------- ---------------
  F-24     Public Profile Page   Avatar, bio, post count,      P0
                                 follower/following counters   

  F-25     Published Works Grid  Masonry/grid thumbnail        P0
                                 gallery of all published      
                                 posts                         

  F-26     Follow / Unfollow     One-click action visible to   P1
                                 any authenticated visitor     

  F-27     Bookmark / Share      Share native share sheet;     P2
                                 bookmark profile for later    
  ----------------------------------------------------------------------------

**5. Non-Functional Requirements**

**5.1 Performance**

-   First Contentful Paint (FCP) \< 1.8 s on 4G connection.

-   Largest Contentful Paint (LCP) \< 2.5 s.

-   Cumulative Layout Shift (CLS) \< 0.1.

-   API response time \< 200 ms (p95) under normal load.

**5.2 Accessibility**

-   WCAG 2.1 AA compliance minimum.

-   All interactive elements keyboard-navigable.

-   Colour contrast ratios \> 4.5:1 for body text.

**5.3 Security**

-   All passwords hashed with bcrypt (cost factor 12).

-   JWT in httpOnly, Secure, SameSite=Strict cookies.

-   Rate limiting on all auth endpoints (10 req/min per IP).

-   Input sanitisation via DOMPurify before storage.

**5.4 Responsiveness**

-   Fully functional at 375 px (mobile), 768 px (tablet), 1440 px
    (desktop).

-   CSS Grid + Flexbox layout engine --- no framework.

**6. Out of Scope (v1.0)**

-   Monetisation / paid subscriptions.

-   Email newsletters.

-   Real-time collaborative editing.

-   Third-party OAuth (Google, GitHub) --- v1.1 roadmap.

-   Mobile native app.
