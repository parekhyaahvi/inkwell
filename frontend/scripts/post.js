import { apiFetch, showToast, getTagColorStyles, toggleTheme, BLANK_AVATAR } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const sessionStr = localStorage.getItem('userSession');
  const user = sessionStr ? JSON.parse(sessionStr) : null;

  // Resolve slug from route parameters (/post/:slug)
  const pathParts = window.location.pathname.split('/').filter(p => p);
  const slug = pathParts[pathParts.length - 1];
  if (!slug || pathParts[0] !== 'post') {
    window.location.href = '/dashboard';
    return;
  }

  // DOM bindings
  const navUserArea = document.getElementById('navUserArea');

  // New standardized nav elements
  const navHome = document.getElementById('navHome');
  const navProfileLink = document.getElementById('navProfileLink');
  const navSettings = document.getElementById('navSettings');
  const navBookmarks = document.getElementById('navBookmarks');
  const navThemeToggle = document.getElementById('navThemeToggle');
  const createBlogBtnNav = document.getElementById('createBlogBtnNav');

  navHome?.addEventListener('click', () => window.location.href = '/dashboard');
  navBookmarks?.addEventListener('click', () => window.location.href = '/dashboard#bookmarks');
  navProfileLink?.addEventListener('click', () => {
    if (user) window.location.href = `/profile/${user.username}`;
    else window.location.href = '/auth';
  });
  navSettings?.addEventListener('click', () => {
    if (user) window.location.href = '/settings';
    else window.location.href = '/auth';
  });
  navThemeToggle?.addEventListener('click', () => toggleTheme());
  createBlogBtnNav?.addEventListener('click', () => window.location.href = '/dashboard#create');

  const postHero = document.getElementById('postHero');
  const postHeroImg = document.getElementById('postHeroImg');
  const postTitle = document.getElementById('postTitle');
  const authorAvatar = document.getElementById('authorAvatar');
  const authorName = document.getElementById('authorName');
  const postDate = document.getElementById('postDate');
  const authorLink = document.getElementById('authorLink');
  const postBodyContent = document.getElementById('postBodyContent');
  const stickyEngageBar = document.getElementById('stickyEngageBar');
  const likeBtn = document.getElementById('likeBtn');
  const likeCount = document.getElementById('likeCount');
  const bookmarkBtn = document.getElementById('bookmarkBtn');
  
  const commentsSection = document.getElementById('commentsSection');
  const commentsCount = document.getElementById('commentsCount');
  const commentThreadList = document.getElementById('commentThreadList');
  const commentInputText = document.getElementById('commentInputText');
  const submitCommentBtn = document.getElementById('submitCommentBtn');
  const commentFormContainer = document.getElementById('commentFormContainer');
  const unauthCommentPrompt = document.getElementById('unauthCommentPrompt');

  let postId = null;
  let totalComments = 0;

  // 1. Navigation area states
  if (user) {
    navUserArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-weight: 500; font-size: var(--fs-ui); cursor: pointer;" id="navToDashBtn">Dashboard</span>
        <img src="${user.avatarUrl || BLANK_AVATAR}" style="width: 36px; height: 36px; border-radius: 50%; cursor: pointer;" id="navAvatarBtn">
      </div>
    `;
    
    document.getElementById('navToDashBtn').addEventListener('click', () => {
      window.location.href = '/dashboard';
    });
    document.getElementById('navAvatarBtn').addEventListener('click', () => {
      window.location.href = `/profile/${user.username}`;
    });
  } else {
    navUserArea.innerHTML = `<a class="btn btn-ghost" href="/auth" style="text-decoration: none; display: flex; align-items: center;">Log In</a>`;
    commentFormContainer.style.display = 'none';
    unauthCommentPrompt.style.display = 'block';
  }

  // 2. Fetch Post Details
  const fetchPostDetails = async () => {
    try {
      const response = await apiFetch(`/api/posts/${slug}`);
      const result = await response.json();

      if (!result.success) {
        postBodyContent.innerHTML = `
          <div style="text-align: center; padding: var(--space-12) 0;">
            <h2>Article not found</h2>
            <p style="color: var(--text-muted); margin-top: 12px;">The post you are trying to read does not exist or has been deleted.</p>
            <a href="/dashboard" class="btn btn-primary" style="margin-top: 24px; display: inline-flex;">Go to Feed</a>
          </div>
        `;
        return;
      }

      const post = result.data;
      postId = post.id;
      
      // Update DOM
      postTitle.textContent = post.title;
      authorName.textContent = post.author.displayName;
      postDate.textContent = new Date(post.publishedAt || post.createdAt).toLocaleDateString();
      authorAvatar.src = post.author.avatarUrl || BLANK_AVATAR;
      
      authorLink.addEventListener('click', () => {
        window.location.href = `/profile/${post.author.username}`;
      });

      // Show Edit/Delete if author
      if (user && user.id === post.author.id) {
        const authorActions = document.getElementById('authorActions');
        if (authorActions) authorActions.style.display = 'flex';
        
        document.getElementById('editPostBtn')?.addEventListener('click', () => {
          window.location.href = `/dashboard#edit-${post.id}`;
        });

        document.getElementById('deletePostBtn')?.addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            try {
              const response = await apiFetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
              });
              const result = await response.json();
              if (result.success) {
                showToast('Deleted', 'Article has been removed.', 'success');
                setTimeout(() => window.location.href = '/dashboard', 1500);
              } else {
                showToast('Error', result.error || 'Failed to delete article.', 'error');
              }
            } catch (err) {
              showToast('Error', 'Network error during deletion.', 'error');
            }
          }
        });
      }

      if (post.cover) {
        postHeroImg.src = post.cover;
        postHero.style.display = 'block';
        
        // Scroll Parallax Effect
        window.addEventListener('scroll', () => {
          const scrollPos = window.scrollY;
          postHeroImg.style.transform = `translateY(${scrollPos * 0.3}px) scale(1.05)`;
        });
      } else {
        // Renders minimalist default title header if cover is absent
        postHero.style.display = 'block';
        postHero.style.height = 'auto';
        postHero.style.minHeight = 'auto';
        postHeroImg.style.display = 'none';
        postHero.querySelector('.immersive-hero-overlay').style.position = 'relative';
        postHero.querySelector('.immersive-hero-overlay').style.background = 'none';
        postHero.querySelector('.immersive-hero-overlay').style.paddingTop = 'var(--space-12)';
      }

      // Renders sanitized content HTML directly
      postBodyContent.innerHTML = post.content;
      
      // Setup sticky engagement counter values
      likeCount.textContent = post.likeCount;
      stickyEngageBar.style.display = 'flex';
      
      // Check engagement states if logged in
      if (user) {
        checkUserLikeAndBookmarkStates(post.id);
      }

      // Fetch comments list
      commentsSection.style.display = 'block';
      fetchComments();

    } catch (err) {
      console.error(err);
      showToast('Network Error', 'Failed to retrieve article details from server.', 'error');
    }
  };

  const checkUserLikeAndBookmarkStates = async (postId) => {
    try {
      // 1. Bookmarks state
      const resB = await apiFetch('/api/bookmarks');
      const repB = await resB.json();
      if (repB.success) {
        const isBookmarked = repB.data.some(b => b.id === postId);
        if (isBookmarked) {
          bookmarkBtn.classList.add('bookmarked');
          bookmarkBtn.querySelector('svg').setAttribute('fill', 'currentColor');
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // 3. Heart Likes Toggles (Optimistic UI)
  likeBtn.addEventListener('click', async () => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    const svg = likeBtn.querySelector('svg');
    const isLiked = likeBtn.classList.contains('liked');

    if (isLiked) {
      likeBtn.classList.remove('liked');
      svg.setAttribute('fill', 'none');
      likeCount.textContent = Number(likeCount.textContent) - 1;
    } else {
      likeBtn.classList.add('liked');
      svg.setAttribute('fill', 'currentColor');
      likeCount.textContent = Number(likeCount.textContent) + 1;
    }

    try {
      const res = await apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
      const rep = await res.json();
      
      if (!rep.success) throw new Error();
      
      // Update absolute sync counts
      likeCount.textContent = rep.data.likeCount;
      if (rep.data.liked) {
        likeBtn.classList.add('liked');
        svg.setAttribute('fill', 'currentColor');
      } else {
        likeBtn.classList.remove('liked');
        svg.setAttribute('fill', 'none');
      }
    } catch (err) {
      // Rollback UI
      if (isLiked) {
        likeBtn.classList.add('liked');
        svg.setAttribute('fill', 'currentColor');
        likeCount.textContent = Number(likeCount.textContent) + 1;
      } else {
        likeBtn.classList.remove('liked');
        svg.setAttribute('fill', 'none');
        likeCount.textContent = Number(likeCount.textContent) - 1;
      }
      showToast('Engagement Error', 'Unable to toggle post heart like.', 'error');
    }
  });

  // 4. Bookmark Toggle (Optimistic UI)
  bookmarkBtn.addEventListener('click', async () => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    const svg = bookmarkBtn.querySelector('svg');
    const isBookmarked = bookmarkBtn.classList.contains('bookmarked');

    if (isBookmarked) {
      bookmarkBtn.classList.remove('bookmarked');
      svg.setAttribute('fill', 'none');
    } else {
      bookmarkBtn.classList.add('bookmarked');
      svg.setAttribute('fill', 'currentColor');
    }

    try {
      const res = await apiFetch(`/api/bookmarks/${postId}`, { method: 'POST' });
      const rep = await res.json();

      if (!rep.success) throw new Error();

      if (rep.data.bookmarked) {
        bookmarkBtn.classList.add('bookmarked');
        svg.setAttribute('fill', 'currentColor');
        showToast('Saved', 'Article added to bookmarks.', 'success');
      } else {
        bookmarkBtn.classList.remove('bookmarked');
        svg.setAttribute('fill', 'none');
        showToast('Removed', 'Article removed from bookmarks.', 'info');
      }
    } catch (err) {
      if (isBookmarked) {
        bookmarkBtn.classList.add('bookmarked');
        svg.setAttribute('fill', 'currentColor');
      } else {
        bookmarkBtn.classList.remove('bookmarked');
        svg.setAttribute('fill', 'none');
      }
      showToast('Storage Error', 'Unable to toggle bookmark state.', 'error');
    }
  });

  // 5. Discussion Thread fetch
  const fetchComments = async () => {
    try {
      const response = await apiFetch(`/api/comments/${postId}`);
      const result = await response.json();

      if (result.success) {
        commentThreadList.innerHTML = '';
        totalComments = 0;
        
        result.data.forEach(node => {
          renderCommentNode(node, commentThreadList, true);
        });

        commentsCount.textContent = totalComments;
      }
    } catch (err) {
      console.error(err);
      commentThreadList.innerHTML = `<div style="color: var(--text-muted); font-size: var(--fs-meta);">Failed to load comments list.</div>`;
    }
  };

  // Recursively render comment trees
  const renderCommentNode = (node, container, isRoot = false) => {
    totalComments++;
    
    const wrapper = document.createElement('div');
    wrapper.className = `comment-node ${isRoot ? 'root' : ''}`;
    wrapper.id = `commentNode-${node.id}`;

    // Show delete option if authenticated user is author of comment
    const isOwner = user && user.id === node.author.id;
    const deleteMarkup = isOwner 
      ? `<span class="comment-action-link comment-delete-link" id="deleteComment-${node.id}">Delete</span>`
      : '';

    // Reply link for auth users
    const replyMarkup = user 
      ? `<span class="comment-action-link" id="replyComment-${node.id}">Reply</span>`
      : '';

    wrapper.innerHTML = `
      <div class="comment-card">
        <div class="comment-header">
          <div class="comment-user">
            <img src="${node.author.avatarUrl || BLANK_AVATAR}" class="comment-avatar">
            <span class="comment-username">${node.author.displayName}</span>
          </div>
          <span class="comment-time">${new Date(node.createdAt).toLocaleString()}</span>
        </div>
        <div class="comment-body">${node.body}</div>
        <div class="comment-actions">
          ${replyMarkup}
          ${deleteMarkup}
        </div>
        <div id="replyFormContainer-${node.id}" style="display: none;"></div>
      </div>
      <div class="comment-replies" id="commentReplies-${node.id}"></div>
    `;

    // Handle replies trigger
    if (user) {
      const replyBtn = wrapper.querySelector(`#replyComment-${node.id}`);
      const replyContainer = wrapper.querySelector(`#replyFormContainer-${node.id}`);
      
      replyBtn.addEventListener('click', () => {
        if (replyContainer.style.display === 'block') {
          replyContainer.style.display = 'none';
          replyContainer.innerHTML = '';
          replyBtn.textContent = 'Reply';
        } else {
          replyContainer.style.display = 'block';
          replyContainer.innerHTML = `
            <div class="reply-form-inline">
              <textarea class="comment-input-box" style="min-height: 70px;" id="replyInput-${node.id}" placeholder="Write your reply..."></textarea>
              <div style="display: flex; justify-content: flex-end; gap: var(--space-2);">
                <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 12px;" id="cancelReply-${node.id}">Cancel</button>
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" id="submitReply-${node.id}">Reply</button>
              </div>
            </div>
          `;
          replyBtn.textContent = 'Cancel';

          document.getElementById(`cancelReply-${node.id}`).addEventListener('click', () => {
            replyBtn.click();
          });

          document.getElementById(`submitReply-${node.id}`).addEventListener('click', async () => {
            const input = document.getElementById(`replyInput-${node.id}`);
            const bodyText = input.value.trim();
            if (!bodyText) return;

            try {
              const res = await apiFetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  postId,
                  parentId: node.id,
                  body: bodyText
                })
              });
              const rep = await res.json();
              if (rep.success) {
                showToast('Replied', 'Your reply has been posted.', 'success');
                replyBtn.click(); // close form
                fetchComments(); // Reload discussion
              } else {
                showToast('Failed', rep.message || 'Error occurred.', 'error');
              }
            } catch (err) {
              console.error(err);
            }
          });
        }
      });
    }

    // Handle delete comment
    if (isOwner) {
      wrapper.querySelector(`#deleteComment-${node.id}`).addEventListener('click', async () => {
        const confirmed = confirm('Are you sure you want to delete this comment?');
        if (!confirmed) return;

        try {
          const res = await apiFetch(`/api/comments/${node.id}`, { method: 'DELETE' });
          const rep = await res.json();
          if (rep.success) {
            showToast('Deleted', 'Comment successfully removed.', 'info');
            fetchComments(); // Reload comments
          } else {
            showToast('Failed', rep.message, 'error');
          }
        } catch (err) {
          console.error(err);
        }
      });
    }

    // Append replies recursively
    const repliesContainer = wrapper.querySelector(`#commentReplies-${node.id}`);
    node.replies.forEach(reply => {
      renderCommentNode(reply, repliesContainer, false);
    });

    container.appendChild(wrapper);
  };

  // Submit root comment
  submitCommentBtn.addEventListener('click', async () => {
    const text = commentInputText.value.trim();
    if (!text) return;

    try {
      submitCommentBtn.disabled = true;
      const res = await apiFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          body: text
        })
      });

      const rep = await res.json();
      if (rep.success) {
        showToast('Commented', 'Your comment has been posted.', 'success');
        commentInputText.value = '';
        fetchComments();
      } else {
        showToast('Failed', rep.message, 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      submitCommentBtn.disabled = false;
    }
  });

  // Initialize page details
  fetchPostDetails();
});
