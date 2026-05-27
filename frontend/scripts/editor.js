import { showToast, getTagColorStyles } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // Navigation matching: Resolve if editor view should show
  const feedView = document.getElementById('feedView');
  const editorView = document.getElementById('editorView');
  const rightSidebar = document.querySelector('.right-sidebar');
  const floatingCta = document.getElementById('createNewPostBtn');
  const editorTitle = document.getElementById('editorTitle');
  const editorBody = document.getElementById('editorBody');
  const coverUploadZone = document.getElementById('coverUploadZone');
  const coverFileInput = document.getElementById('coverFileInput');
  const coverImgPreview = document.getElementById('coverImgPreview');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const slashMenu = document.getElementById('slashMenu');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const publishBtn = document.getElementById('publishBtn');
  const editorStatus = document.getElementById('editorStatus');

  const getRouteState = () => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash.startsWith('edit-')) {
      return { mode: 'edit', postId: hash.slice(5) };
    }
    if (hash === 'create') {
      return { mode: 'create' };
    }
    return { mode: 'feed' };
  };

  const populateEditor = (post) => {
    editorTitle.innerHTML = post.title || '';
    editorBody.innerHTML = post.content || '';
    if (post.cover) {
      coverImgPreview.src = post.cover;
      coverImgPreview.style.display = 'block';
      uploadPlaceholder.style.display = 'none';
    } else {
      coverImgPreview.style.display = 'none';
      uploadPlaceholder.style.display = 'block';
    }
    editorStatus.textContent = 'Editing';
  };

  const loadPostForEdit = async (postId) => {
    editorStatus.textContent = 'Loading...';
    const response = await fetch(`/api/posts/${postId}`);
    const result = await response.json();

    if (!result.success) {
      showToast('Edit Error', result.message || 'Unable to load the post for editing.', 'error');
      window.location.hash = 'create';
      resetEditor();
      return;
    }

    createdPostId = result.data.id;
    populateEditor(result.data);
  };

  const checkRoute = () => {
    if (!feedView || !editorView) return;
    const routeState = getRouteState();

    if (routeState.mode === 'create') {
      feedView.style.display = 'none';
      editorView.style.display = 'block';
      resetEditor();
      editorStatus.textContent = 'Saved';
    } else if (routeState.mode === 'edit') {
      feedView.style.display = 'none';
      editorView.style.display = 'block';
      resetEditor();
      loadPostForEdit(routeState.postId);
    } else {
      editorView.style.display = 'none';
      feedView.style.display = 'block';
    }
  };

  // Listen to path changes from feed.js router
  window.addEventListener('popstate', checkRoute);
  window.addEventListener('hashchange', checkRoute);
  
  // Custom router hook trigger override
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    checkRoute();
  };

  let activeTags = [];
  let coverFile = null;
  let coverImgUrlPreview = null;
  let autoSaveTimer = null;
  let createdPostId = null;

  const resetEditor = () => {
    editorTitle.innerHTML = '';
    editorBody.innerHTML = '';
    activeTags = [];
    coverFile = null;
    coverImgUrlPreview = null;
    createdPostId = null;
    coverImgPreview.style.display = 'none';
    uploadPlaceholder.style.display = 'block';
    editorStatus.textContent = 'Saved';
  };

  // 1. Cover Image File Upload Zone Click
  coverUploadZone.addEventListener('click', () => {
    coverFileInput.click();
  });

  coverFileInput.addEventListener('change', () => {
    const file = coverFileInput.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Maximum file size is 5MB.', 'error');
      return;
    }

    coverFile = file;
    
    // Preview locally before uploading with post data
    const reader = new FileReader();
    reader.onload = (e) => {
      coverImgPreview.src = e.target.result;
      coverImgPreview.style.display = 'block';
      uploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    triggerAutoSave();
  });

  // 3. Notion Slash `/` Block Commands Menu Popover implementation
  let lastSlashPosition = 0;
  
  editorBody.addEventListener('keyup', (e) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const textBeforeCursor = range.startContainer.textContent || '';
    
    // Detect slash character '/'
    if (e.key === '/') {
      const rect = range.getBoundingClientRect();
      slashMenu.style.left = `${rect.left + window.scrollX}px`;
      slashMenu.style.top = `${rect.bottom + window.scrollY + 5}px`;
      slashMenu.style.display = 'block';
      lastSlashPosition = range.startOffset;
    } else if (e.key === 'Escape' || !textBeforeCursor.endsWith('/')) {
      slashMenu.style.display = 'none';
    }
  });

  document.querySelectorAll('.slash-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const blockType = item.getAttribute('data-block');
      insertBlock(blockType);
      slashMenu.style.display = 'none';
    });
  });

  const insertBlock = (type) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    
    // Remove slash character
    const container = range.startContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      const text = container.textContent;
      container.textContent = text.substring(0, lastSlashPosition - 1) + text.substring(range.startOffset);
    }
    
    // Insert structured HTML Node block
    let newElement = document.createElement('p');
    if (type === 'h1') newElement = document.createElement('h1');
    if (type === 'h2') newElement = document.createElement('h2');
    if (type === 'h3') newElement = document.createElement('h3');
    if (type === 'blockquote') {
      newElement = document.createElement('blockquote');
      newElement.style.borderLeft = '4px solid var(--color-primary)';
      newElement.style.paddingLeft = '12px';
      newElement.style.color = 'var(--text-muted)';
    }
    if (type === 'code') {
      newElement = document.createElement('pre');
      newElement.style.background = 'rgba(0,0,0,0.2)';
      newElement.style.padding = '12px';
      newElement.style.borderRadius = '8px';
      newElement.style.fontFamily = 'monospace';
    }
    
    newElement.innerHTML = '<br>';
    range.insertNode(newElement);
    
    // Focus selection inside new element block
    const newRange = document.createRange();
    newRange.selectNodeContents(newElement);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  };

  // Close slash menu on window click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.slash-menu') && e.target !== editorBody) {
      slashMenu.style.display = 'none';
    }
  });

  // 4. Saving routines
  const getEditorFormData = (status = 'draft') => {
    const formData = new FormData();
    formData.append('title', editorTitle.textContent.trim());
    formData.append('content', editorBody.innerHTML.trim());
    formData.append('status', status);
    formData.append('tags', JSON.stringify(activeTags));
    
    if (coverFile) {
      formData.append('cover', coverFile);
    }
    
    return formData;
  };

  const triggerAutoSave = () => {
    editorStatus.textContent = 'Saving...';
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
      await saveContent(true);
    }, 2000); // Trigger auto-save 2 seconds after user stops typing
  };

  [editorTitle, editorBody].forEach(el => {
    el.addEventListener('input', triggerAutoSave);
  });

  const saveContent = async (isAuto = false) => {
    const title = editorTitle.textContent.trim();
    if (!title) {
      editorStatus.textContent = 'Saved';
      return; // Must have title to save
    }

    const formData = getEditorFormData('draft');

    try {
      const url = createdPostId ? `/api/posts/${createdPostId}` : '/api/posts';
      const method = createdPostId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData
      });
      const rep = await res.json();

      if (rep.success) {
        editorStatus.textContent = 'Saved';
        if (!createdPostId) {
          createdPostId = rep.data.id;
        }
        // If we uploaded a file, the server returns the new URL
        if (rep.data.cover) {
          coverImgUrlPreview = rep.data.cover;
          // coverFile = null; // Optional: clear after upload if you want to avoid re-uploading
        }
        if (!isAuto) {
          showToast('Draft Saved', 'Your article draft has been saved.', 'success');
        }
      } else {
        editorStatus.textContent = 'Save error';
      }
    } catch (err) {
      console.error(err);
      editorStatus.textContent = 'Save error';
    }
  };

  saveDraftBtn.addEventListener('click', async () => {
    await saveContent(false);
  });

  // 5. Publishing
  publishBtn.addEventListener('click', async () => {
    const title = editorTitle.textContent.trim();
    const content = editorBody.innerHTML.trim();
    
    if (!title) {
      showToast('Validation Error', 'Article title is required to publish.', 'error');
      return;
    }
    if (!content) {
      showToast('Validation Error', 'Article body content cannot be empty.', 'error');
      return;
    }

    const confirmed = confirm('Are you sure? Your post will be publicly visible.');
    if (!confirmed) return;

    try {
      publishBtn.disabled = true;
      publishBtn.textContent = 'Publishing...';

      const formData = getEditorFormData('published');
      const url = createdPostId ? `/api/posts/${createdPostId}` : '/api/posts';
      const method = createdPostId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData
      });
      const rep = await res.json();

      if (rep.success) {
        showToast('Published!', 'Article published successfully!', 'success');
        resetEditor();
        
        setTimeout(() => {
          window.location.href = `/post/${rep.data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        }, 1000);
      } else {
        showToast('Publish Failed', rep.message || 'Error occurred.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'Could not establish connection with server.', 'error');
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = 'Publish';
    }
  });

  // Run initial route checking
  checkRoute();
});
