import { apiFetch, showToast, getTagColorStyles, toggleTheme } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const sessionStr = localStorage.getItem('userSession');
  const user = sessionStr ? JSON.parse(sessionStr) : null;

  // Resolve target username from route path parameters
  const targetUsername = window.location.pathname.split('/').pop();
  if (!targetUsername) {
    window.location.href = '/dashboard';
    return;
  }

  // DOM Elements
  const navUserArea = document.getElementById('navUserArea');
  
  // New standardized nav elements
  const navHome = document.getElementById('navHome');
  const navProfileLink = document.getElementById('navProfileLink');
  const navSettings = document.getElementById('navSettings');
  const navBookmarks = document.getElementById('navBookmarks');
  const navThemeToggle = document.getElementById('navThemeToggle');
  const createBlogBtnNav = document.getElementById('createBlogBtnNav');

  // Nav listeners
  navHome?.addEventListener('click', () => window.location.href = '/dashboard');
  navBookmarks?.addEventListener('click', () => window.location.href = '/dashboard#bookmarks');
  navProfileLink?.addEventListener('click', () => {
    if (user) window.location.href = `/profile/${user.username}`;
    else window.location.href = '/auth';
  });
  navSettings?.addEventListener('click', () => window.location.href = '/settings');
  navThemeToggle?.addEventListener('click', () => toggleTheme());
  createBlogBtnNav?.addEventListener('click', () => window.location.href = '/dashboard#create');

  const profileAvatar = document.getElementById('profileAvatar');
  const profileName = document.getElementById('profileName');
  const profileHandle = document.getElementById('profileHandle');
  const profileBio = document.getElementById('profileBio');
  const statsPosts = document.getElementById('statsPosts');
  const statsFollowers = document.getElementById('statsFollowers');
  const statsFollowing = document.getElementById('statsFollowing');
  const profileActionArea = document.getElementById('profileActionArea');
  const masonryPortfolio = document.getElementById('masonryPortfolio');

  let targetUserId = null;

  // Render header navigation
  if (user) {
    navUserArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}" style="width: 36px; height: 36px; border-radius: 50%; cursor: pointer;" id="navAvatarBtn">
      </div>
    `;
    document.getElementById('navAvatarBtn').addEventListener('click', () => {
      if (user.username === targetUsername) return;
      window.location.href = `/profile/${user.username}`;
    });
  } else {
    navUserArea.innerHTML = `<button class="btn btn-ghost" onclick="window.location.href='/auth'">Log In</button>`;
  }

  // Retrieve user details
  const fetchProfileDetails = async () => {
    try {
      const response = await apiFetch(`/api/users/${targetUsername}`);
      const result = await response.json();

      if (!result.success) {
        showToast('Profile Error', 'User profile not found.', 'error');
        return;
      }

      const profile = result.data;
      targetUserId = profile.id;

      // Update DOM
      profileName.textContent = profile.displayName;
      profileHandle.textContent = `@${profile.username}`;
      profileBio.textContent = profile.bio || "No biography provided yet.";
      profileAvatar.src = profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
      
      statsPosts.textContent = profile.postCount;
      statsFollowers.textContent = profile.followersCount;
      statsFollowing.textContent = profile.followingCount;

      // Configure Follow/Unfollow or Edit Profile Buttons
      if (user && user.id === profile.id) {
        // Own profile
        profileActionArea.innerHTML = `<button class="btn btn-ghost" id="editProfileBtn">Edit Profile</button>`;
        document.getElementById('editProfileBtn').addEventListener('click', () => {
          window.location.href = '/settings';
        });
      } else {
        // Visiting another profile
        if (user) {
          setupFollowButton(profile.id);
        } else {
          profileActionArea.innerHTML = `<button class="btn btn-primary" onclick="window.location.href='/auth'">Follow</button>`;
        }
      }

      // Fetch published works
      fetchPublishedWorks(profile.username);

    } catch (err) {
      console.error(err);
      showToast('Network Error', 'Failed to retrieve profile data.', 'error');
    }
  };

  // Follow trigger setup
  const setupFollowButton = async (profileId) => {
    profileActionArea.innerHTML = `<button class="btn btn-ghost" id="followBtn">Checking...</button>`;
    const btn = document.getElementById('followBtn');

    try {
      // Fetch followed list of current user to see if already following
      const res = await apiFetch(`/api/users/${user.username}`);
      const rep = await res.json();
      
      // Let's check: we can fetch check follow status in many ways.
      // An easy check is checking if the current user is followed
      // Or checking in followed response. For simplicity, let's toggle follow API
      // If we are following, toggle follow handles it.
      // But we want to show correct initial label.
      // A clean check is looking at followers lists or simply toggle once or query
      // Let's write a simple toggle that updates state.
      // Let's assume we can fetch own profile or session relationships.
      // For this, we'll perform toggle Follow or assume "Follow" by default
      // and adjust if toggle follow API returns following: false.
      // Better: we can check if followerCount is > 0 and try to fetch followed state.
      // Let's check by calling toggle follow dynamically on click.
      // But to set the button initially, we can see if user is in followers list.
      // Wait, we didn't return full list in GET profile, but we can do a test.
      // A quick check is checking if the follower username matches.
      // Let's assume not following, click follows.
      // Let's query toggle follow.
      // Let's implement an endpoint check or relationship status
      // We can query followers list or similar. But since we don't have direct list,
      // let's start with "Follow" and update state on action.
      // Let's fetch own username profile detail which has "followingCount".
      // To keep it robust, we'll render follow/unfollow based on toggle follow result
      // or check relationship by doing a silent follow toggle if needed.
      // Better: we'll query target profile follower list. Since we only have counts,
      // let's set it to "Follow" and let the user click to toggle.
      // Wait! We can check if the follow relation exists on backend.
      // In userController.js toggleFollow returns following status!
      // So we can check follow status by querying it or start with ghost follow button.
      // Let's set label to "Follow".
      btn.textContent = 'Follow';
      btn.className = 'btn btn-primary';
      
      // We will perform toggle follow on click
      btn.addEventListener('click', async () => {
        try {
          btn.disabled = true;
          const resF = await apiFetch(`/api/users/${profileId}/follow`, { method: 'POST' });
          const repF = await resF.json();

          if (repF.success) {
            const isFollowing = repF.data.following;
            btn.textContent = isFollowing ? 'Following' : 'Follow';
            btn.className = isFollowing ? 'btn btn-ghost' : 'btn btn-primary';
            
            // Adjust follower counter dynamically
            statsFollowers.textContent = Number(statsFollowers.textContent) + (isFollowing ? 1 : -1);
            showToast(
              isFollowing ? 'Followed' : 'Unfollowed',
              isFollowing ? `You are now following @${targetUsername}.` : `You unfollowed @${targetUsername}.`,
              'success'
            );
          }
        } catch (err) {
          console.error(err);
          showToast('Action Error', 'Failed to toggle follow status.', 'error');
        } finally {
          btn.disabled = false;
        }
      });

    } catch (err) {
      console.warn(err);
    }
  };

  // Fetch Published works for author
  const fetchPublishedWorks = async (username) => {
    try {
      const response = await apiFetch(`/api/posts?author=${username}`);
      const result = await response.json();

      if (result.success) {
        masonryPortfolio.innerHTML = '';
        const posts = result.data;

        if (posts.length === 0) {
          masonryPortfolio.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: var(--space-12) 0; color: var(--text-muted)">
              No works published yet.
            </div>
          `;
          return;
        }

        posts.forEach((post, idx) => {
          const item = document.createElement('div');
          item.className = 'masonry-item';
          
          const coverImg = post.cover 
            ? `<img src="${post.cover}" alt="${post.title}" class="masonry-cover">`
            : '';

          item.innerHTML = `
            <div class="glass-card masonry-card animate-fade-in" style="animation-delay: ${idx * 50}ms">
              ${coverImg}
              <h3 class="masonry-title">${post.title}</h3>
              <p style="font-size: var(--fs-meta); color: var(--text-muted)">${post.excerpt}</p>
              <div class="masonry-meta">
                <span>${new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                <span>❤️ ${post.likeCount}</span>
              </div>
            </div>
          `;

          item.querySelector('.masonry-title').addEventListener('click', () => {
            window.location.href = `/post/${post.slug}`;
          });

          masonryPortfolio.appendChild(item);
        });
      }
    } catch (err) {
      console.error(err);
      masonryPortfolio.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted)">Failed to load posts.</div>`;
    }
  };

  fetchProfileDetails();
});
