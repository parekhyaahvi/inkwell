**InkWell**

**Website Flow Document**

End-to-End User Journey --- Every Screen, Every Action

Version 1.0 \| May 2026

**Overview**

This document describes the complete user journey through InkWell, from
first visit through ongoing engagement. It covers every screen
transition, micro-interaction, and decision point for both
unauthenticated visitors and authenticated members.

**1. Entry Point --- Public Landing Page**

**1.1 First Visit (Unauthenticated)**

1.  User arrives at inkwell.app via browser.

2.  Browser renders the landing page: hero section (headline + CTA),
    featured post grid, trending tag pills.

3.  User can scroll and view 6 featured posts without logging in
    (read-only preview).

4.  Clicking a tag pill filters the featured grid to posts matching that
    tag --- no page reload.

5.  Clicking a post card opens the Single Post Reading View (read-only,
    no like/comment interaction).

**1.2 Navigation Bar State (Unauthenticated)**

-   Left: InkWell logo (links back to /)

-   Right: \'Log In\' button (ghost style) + \'Start Writing\' button
    (primary glowing blue)

-   Both buttons route to the Auth screen

**2. Authentication Flow**

**2.1 Register**

6.  User clicks \'Start Writing\' or \'Log In\'.

7.  Auth screen renders with Register form active by default.

8.  Fields: Name (text), Email (email), Password (password with toggle
    visibility icon).

9.  User fills in all fields. Inline validation fires on blur: empty
    field = red border + helper text.

10. User clicks the glowing \'Sign Up\' button.

11. Client POSTs to /api/auth/register.

12. On success: server sets httpOnly JWT cookie + redirects to
    /dashboard.

13. On error (email taken): form shows inline error message below email
    field.

**2.2 Login**

14. User clicks \'Seamless with Log In\' toggle at the bottom of
    Register form.

15. Form animates to Login fields: Email, Password.

16. User enters credentials and clicks \'Log In\'.

17. Client POSTs to /api/auth/login.

18. On success: JWT cookie set, redirect to /dashboard.

19. On error: \'Invalid credentials\' banner shown.

**2.3 Logout**

20. User clicks avatar in top-right navbar.

21. Dropdown shows: My Profile, My Drafts, Settings, Logout.

22. Clicking Logout: client calls /api/auth/logout (clears cookie),
    redirect to /.

**3. Dashboard --- Personalised Feed**

**3.1 First Load**

23. Dashboard fetches /api/posts?feed=personalised with auth cookie.

24. Skeleton loader cards animate while data loads (3 cards).

25. Feed renders blog feed cards: cover thumbnail, title, author
    avatar + name, date, excerpt.

26. Right sidebar renders Trending Tags from /api/tags/trending.

**3.2 Browsing the Feed**

27. User scrolls through cards --- infinite scroll triggers
    /api/posts?page=N when user reaches 80% of page height.

28. User clicks a tag pill in the sidebar --- feed re-fetches filtered
    results (/api/posts?tag=AI).

29. User clicks bookmark icon on a card --- POST
    /api/bookmarks/{postId}; icon fills to indicate saved.

30. User clicks a card → navigates to /post/{slug} (Single Post Reading
    View).

**3.3 Left Sidebar Navigation**

-   Home (active state: filled icon)

-   Explore (discover new writers)

-   Notifications (bell with badge count)

-   Profile (avatar icon)

-   Settings (gear icon, bottom-pinned)

**4. Writer\'s Canvas --- Creating a Post**

**4.1 Opening the Editor**

31. User clicks the floating \'+\' CTA button on the dashboard.

32. Route changes to /new-post; Writer\'s Canvas renders.

33. Page shows: Cover Image upload zone, Article Title placeholder, Tag
    pills input, rich body editor.

**4.2 Writing a Post**

34. User clicks cover image zone → system file picker opens. User
    selects image.

35. Image uploads to cloud storage; preview renders immediately in the
    zone.

36. User clicks Article Title placeholder → types the post title.

37. User types in tag input → autocomplete dropdown suggests existing
    tags. Enter/comma adds a tag pill.

38. User clicks the body area and begins writing. Slash commands (/)
    reveal block options: Heading, Quote, Code, Image.

39. Auto-save fires every 30 seconds; \'Saving\...\' indicator appears
    top-right then changes to \'Saved\'.

**4.3 Publishing**

40. User clicks the primary \'Publish\' button (top-right toolbar).

41. Confirmation modal: \'Are you sure? Your post will be publicly
    visible.\' with Confirm / Cancel.

42. On Confirm: POST /api/posts with body {title, content, tags,
    coverImage, status:\'published\'}.

43. On success: redirect to /post/{new-slug} (reading view of their
    published post).

**4.4 Saving a Draft**

44. User clicks \'Save Draft\' button.

45. POST /api/posts with {status:\'draft\'} --- no redirect; toast
    notification \'Draft saved\' appears 3 s.

46. Draft accessible later via My Drafts in profile dropdown.

**5. Single Post Reading View**

47. Route: /post/{slug}

48. Full-width cover image renders as immersive hero (parallax subtle
    scroll effect).

49. Author info block: avatar, name (links to profile), publish date.

50. Body text renders with generous line-height (1.8), max-width 680 px
    centred.

51. Sticky right sidebar engagement bar (visible on scroll): Like button
    (heart), Bookmark button.

52. Authenticated users: clicking Like sends POST /api/posts/{id}/like;
    count updates optimistically.

53. Comment section loads below article. Existing comments shown
    chronologically.

54. Authenticated users: type in comment box → click Reply → POST
    /api/comments.

55. Author can delete own comments (trash icon); POST
    /api/comments/{id}/delete.

56. Unauthenticated users see comments but \'Log in to comment\' prompt
    replaces input box.

**6. User Profile**

57. Route: /profile/{username}

58. Renders: large avatar, display name, bio, Posts / Followers /
    Following counters.

59. Follow button (filled if already following) --- authenticated users
    only.

60. Published works grid: masonry thumbnail gallery of all public posts.

61. Clicking a post thumbnail → navigates to /post/{slug}.

62. Visiting own profile: Edit Profile button appears →
    /settings/profile.

**7. Settings**

63. Route: /settings

64. Sub-sections: Profile (avatar, name, bio), Account (email,
    password), Appearance (Light/Dark theme toggle).

65. Saving profile: PATCH /api/users/me.

**8. Theme Toggle (Global)**

66. User clicks theme icon in top-right navbar.

67. CSS variable set swaps instantly (no page reload). Preference stored
    in localStorage and user account.

68. Light mode: white card backgrounds, dark text. Dark mode:
    glassmorphism deep-navy, white text.
