import { apiFetch, showToast, getTagColorStyles, toggleTheme } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // Session check
  const sessionStr = localStorage.getItem('userSession');
  if (!sessionStr) {
    window.location.href = '/auth';
    return;
  }
  const user = JSON.parse(sessionStr);

  const feedContainer = document.getElementById('feedContainer');
  const trendingTagsList = document.getElementById('trendingTagsList');
  const feedTitle = document.getElementById('feedTitle');
  const filterIndicator = document.getElementById('filterIndicator');
  const activeFilterTag = document.getElementById('activeFilterTag');
  const clearFilterBtn = document.getElementById('clearFilterBtn');
  const createNewPostBtn = document.getElementById('createNewPostBtn');
  const createBlogBtnTop = document.getElementById('createBlogBtnTop');
  const createBlogBtnNav = document.getElementById('createBlogBtnNav');
  const feedFooter = document.getElementById('feedFooter');
  
  // Navigation elements
  const navHome = document.getElementById('navHome');
  const navProfileLink = document.getElementById('navProfileLink');
  const navSettings = document.getElementById('navSettings');
  const navBookmarks = document.getElementById('navBookmarks');
  const navThemeToggle = document.getElementById('navThemeToggle');
  const navUserArea = document.getElementById('navUserArea');

  let currentCursor = null;
  let activeTag = null;

  const updateAuthUI = () => {
    if (!navUserArea) return;
    if (user) {
      navUserArea.innerHTML = `
        <img src="${user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username}" 
             class="nav-avatar" 
             style="width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.2); cursor: pointer;"
             id="navProfileToggle">
      `;
      
      const img = document.getElementById('navProfileToggle');
      img?.addEventListener('click', () => {
        if (confirm('Logout of InkWell?')) {
          localStorage.removeItem('userSession');
          window.location.href = '/auth';
        }
      });
    } else {
      navUserArea.innerHTML = `<a class="btn btn-ghost" href="/auth" style="text-decoration: none;">Log In</a>`;
    }
  };

  let feedType = 'personalised'; // 'personalised'
  let isLoading = false;
  let hasMore = true;

  // Initialize view: Trigger feed fetch
  const init = async () => {
    updateAuthUI();
    await fetchPosts(true);
  };

  const setFeedHeaderTitle = (title) => {
    if (feedTitle) {
      feedTitle.textContent = title;
    }
  };

  // Navigations routing triggers
  navHome?.addEventListener('click', () => {
    window.location.hash = '';
    if (feedType === 'personalised' && !activeTag) return;
    setActiveNav(navHome);
    feedType = 'personalised';
    setFeedHeaderTitle('Personalised Feed');
    activeTag = null;
    if (filterIndicator) filterIndicator.style.display = 'none';
    fetchPosts(true);
  });

  navBookmarks?.addEventListener('click', () => {
    window.location.hash = 'bookmarks';
    setActiveNav(navBookmarks);
    feedType = 'bookmarks';
    setFeedHeaderTitle('Bookmarked blogs');
    activeTag = null;
    if (filterIndicator) {
      filterIndicator.style.display = 'flex';
      filterIndicator.querySelector('.filter-label').textContent = 'Bookmarked blogs';
      activeFilterTag.textContent = 'Bookmarked blogs';
    }
    fetchPosts(true);
  });

  navProfileLink?.addEventListener('click', () => {
    window.location.href = `/profile/${user.username}`;
  });

  navSettings?.addEventListener('click', () => {
    window.location.href = '/settings';
  });

  navThemeToggle?.addEventListener('click', () => {
    toggleTheme();
  });

  const handleCreatePost = () => {
    // Navigate to create post view
    window.location.hash = 'create';
  };

  createBlogBtnTop?.addEventListener('click', handleCreatePost);
  createBlogBtnNav?.addEventListener('click', handleCreatePost);
  createNewPostBtn?.addEventListener('click', handleCreatePost);

  clearFilterBtn?.addEventListener('click', () => {
    activeTag = null;
    if (filterIndicator) filterIndicator.style.display = 'none';
    fetchPosts(true);
  });

  const setActiveNav = (activeEl) => {
    [navHome, navSettings, createBlogBtnNav, navBookmarks].forEach(nav => {
      if (nav) nav.classList.remove('active');
    });
    activeEl?.classList.add('active');
  };

  const syncNavState = () => {
    if (window.location.hash === '#create') {
      setActiveNav(createBlogBtnNav);
      setFeedHeaderTitle('Personalised Feed');
    } else if (window.location.hash === '#bookmarks') {
      setActiveNav(navBookmarks);
      setFeedHeaderTitle('Bookmarked blogs');
    } else {
      setActiveNav(navHome);
      setFeedHeaderTitle('Personalised Feed');
    }
  };

  window.addEventListener('hashchange', syncNavState);
  window.addEventListener('popstate', syncNavState);
  syncNavState();

  // Skeletal loaders shimmer injection
  const injectSkeletons = () => {
    feedContainer.innerHTML += `
      <div class="glass-card skeleton-card animate-shimmer" style="height: 300px; margin-bottom: 20px;"></div>
      <div class="glass-card skeleton-card animate-shimmer" style="height: 300px; margin-bottom: 20px;"></div>
      <div class="glass-card skeleton-card animate-shimmer" style="height: 300px; margin-bottom: 20px;"></div>
    `;
  };

  const removeSkeletons = () => {
    document.querySelectorAll('.skeleton-card').forEach(el => el.remove());
  };

  // Trending tags retrieval
  const fetchTrendingTags = async () => {
    if (!trendingTagsList) return;
    try {
      const response = await apiFetch('/api/tags/trending');
      const result = await response.json();
      
      if (result.success) {
        trendingTagsList.innerHTML = '';
        result.data.forEach(tag => {
          const item = document.createElement('div');
          item.className = 'trending-item';
          item.innerHTML = `
            <span class="trending-tag">#${tag.name}</span>
            <span class="trending-count">${tag.postCount} posts</span>
          `;
          
          item.querySelector('.trending-tag').addEventListener('click', () => {
            activeTag = tag.name;
            if (activeFilterTag) {
              activeFilterTag.textContent = `#${tag.name}`;
              activeFilterTag.style = getTagColorStyles(tag.name);
            }
            if (filterIndicator) filterIndicator.style.display = 'inline-flex';
            fetchPosts(true);
          });
          
          trendingTagsList.appendChild(item);
        });
      }
    } catch (err) {
      console.error(err);
      if (trendingTagsList) {
        trendingTagsList.innerHTML = `<div style="color: var(--text-muted); font-size: var(--fs-meta)">Failed to load tags.</div>`;
      }
    }
  };

  // Posts retrieval
  const fetchPosts = async (reset = false) => {
    if (isLoading) return;
    isLoading = true;
    
    if (reset && feedContainer) {
      feedContainer.innerHTML = '';
      currentCursor = null;
      hasMore = true;
    }
    
    if (feedContainer) injectSkeletons();

    try {
      // Build API query parameters
      let url = '/api/posts?limit=5';
      if (currentCursor) url += `&cursor=${currentCursor}`;
      if (activeTag) url += `&tag=${activeTag}`;
      if (feedType === 'personalised' && !activeTag) url += `&feed=personalised`;
      
      // If bookmarked tab is selected
      if (feedType === 'bookmarks') {
        url = '/api/bookmarks';
      }

      const headers = {};
      if (user && user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await apiFetch(url, { headers });
      const result = await response.json();

      removeSkeletons();

      if (result.success) {
        const posts = result.data;
        
        if (posts.length === 0 && reset) {
          feedContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 120px 20px; color: rgba(255,255,255,0.3)">
              <div style="font-size: 3rem; margin-bottom: 24px; opacity: 0.5;">🌑</div>
              <h2 style="color: #fff; font-size: 2rem; margin-bottom: 12px;">No articles found</h2>
              <p style="font-size: 1.1rem; max-width: 400px; margin: 0 auto;">Be the first to share your thoughts by starting a new post.</p>
            </div>
          `;
          hasMore = false;
          return;
        }

        // Render posts cards with staggered entry delays
        posts.forEach((post, idx) => {
          const card = document.createElement('article');
          card.className = 'post-card-premium animate-fade-in';
          card.style.animationDelay = `${idx * 100}ms`;
          
          // Random premium icons for the cards
          const icons = ['🌟', '🏆', '💎', '🎨', '🚀'];
          const randomIcon = icons[idx % icons.length];
          const iconColors = ['#ff9f43', '#feca57', '#5f27cd', '#ff6b6b', '#48dbfb'];
          const randomColor = iconColors[idx % iconColors.length];

          // Determine if we should show cover image
          let coverHTML = '';
          if (post.cover) {
            coverHTML = `
              <div class="post-card-visual" style="height: 180px; width: 100%; overflow: hidden; border-radius: 12px; margin-bottom: 20px;">
                <img src="${post.cover}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            `;
          } else {
            coverHTML = `
              <div class="post-card-icon" style="background: ${randomColor}20; border: 1px solid ${randomColor}40;">
                ${randomIcon}
              </div>
            `;
          }

          let deleteBtnHTML = '';
          if (user && user.id === post.author.id) {
            deleteBtnHTML = `<button class="delete-post-btn btn btn-ghost" data-id="${post.id}" style="position: absolute; top: 12px; right: 12px; background: rgba(239, 68, 68, 0.9); color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; border: none; z-index: 10;">Delete</button>`;
            card.style.position = 'relative';
          }

          card.innerHTML = `
            ${deleteBtnHTML}
            ${coverHTML}
            <h3 class="post-card-title">${post.title}</h3>
            <p class="post-card-excerpt">${post.excerpt || 'Read this fascinating story by ' + post.author.displayName + '...'}</p>

            <ul class="post-card-features">
              <li class="post-card-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Published by ${post.author.displayName}
              </li>
              <li class="post-card-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ${new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
              </li>
              <li class="post-card-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ${post.likeCount} global reactions
              </li>
            </ul>

            <a class="post-card-btn" href="/post/${post.slug}" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">Read Article</a>
          `;

          feedContainer.appendChild(card);
          
          const delBtn = card.querySelector('.delete-post-btn');
          if (delBtn) {
            delBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this post?')) {
                try {
                  const res = await apiFetch('/api/posts/' + post.id, {
                    method: 'DELETE'
                  });
                  const rep = await res.json();
                  if (rep.success) {
                    card.remove();
                    showToast('Deleted', 'Post successfully deleted.', 'success');
                  } else {
                    showToast('Error', rep.message || 'Failed to delete post.', 'error');
                  }
                } catch(err) {
                  showToast('Error', 'Network error.', 'error');
                  console.error(err);
                }
              }
            });
          }
        });

        // Set next pagination elements
        if (result.meta && result.meta.nextCursor) {
          currentCursor = result.meta.nextCursor;
          hasMore = true;
        } else {
          hasMore = false;
        }
      } else {
        showToast('Feed Error', result.message || 'Unable to retrieve feed articles.', 'error');
      }
    } catch (err) {
      console.error(err);
      removeSkeletons();
      showToast('Network Error', 'Server is currently unreachable.', 'error');
    } finally {
      isLoading = false;
    }
  };

  // IntersectionObserver for Infinite Scroll pagination mapping
  const observer = new IntersectionObserver((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoading) {
      fetchPosts();
    }
  }, {
    threshold: 0.1 // triggers when 10% of footer element is visible
  });

  observer.observe(feedFooter);

  // Initialize Layout call
  init();
});
