// main.js

const API_BASE = 'https://blog-backend-5-nas2.onrender.com/api'; // REPLACE with your backend URL

// Utility: get token & user info from localStorage
function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function getUsername() {
  return localStorage.getItem('username');
}

function isLoggedIn() {
  return !!getAccessToken();
}

// Load partials: header and footer
async function loadPartials() {
  // Load header
  const headerDiv = document.getElementById('header');
  if (headerDiv) {
    const res = await fetch('/partials/header.html');
    headerDiv.innerHTML = await res.text();
    setupHeader(); // setup nav & auth dropdown
  }

  // Load footer
  const footerDiv = document.getElementById('footer');
  if (footerDiv) {
    const res = await fetch('/partials/footer.html');
    footerDiv.innerHTML = await res.text();
  }
}

// Setup header navigation and user dropdown based on login state
function setupHeader() {
  // Show username if logged in
  const usernameSpan = document.getElementById('usernameDisplay');
  const authMenu = document.getElementById('authMenu');
  const myBlogsLink = document.querySelector('nav a[href="my_blogs.html"]');

  if (isLoggedIn()) {
    // Show username
    const username = getUsername();
    if (usernameSpan) {
      usernameSpan.textContent = username;
      usernameSpan.classList.remove('d-none');
    }

    // Show "My Blogs" link (already in nav but might be hidden by CSS)
    if (myBlogsLink) myBlogsLink.style.display = 'inline';

    // Setup dropdown menu: Logout
    if (authMenu) {
      authMenu.innerHTML = `
        <li><a class="dropdown-item" href="profile.html">Profile</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><button id="logoutBtn" class="dropdown-item">Logout</button></li>
      `;

      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html'; // Redirect to home after logout
      });
    }
  } else {
    // Hide username
    if (usernameSpan) {
      usernameSpan.textContent = '';
      usernameSpan.classList.add('d-none');
    }
    // Hide My Blogs link
    if (myBlogsLink) myBlogsLink.style.display = 'none';

    // Setup dropdown menu: Login / Register
    if (authMenu) {
      authMenu.innerHTML = `
        <li><a class="dropdown-item" href="login.html">Login</a></li>
        <li><a class="dropdown-item" href="register.html">Register</a></li>
      `;
    }
  }
}

// Protect pages that require login (like my_blogs.html)
function protectPage() {
  if (!isLoggedIn()) {
    alert('You must be logged in to view this page.');
    window.location.href = 'login.html';
  }
}

// Fetch posts (all or by author) and render them into container
async function fetchAndRenderPosts(containerId, authorId = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<p>Loading posts...</p>`;

  let url = `${API_BASE}/posts/`;
  if (authorId) url += `?author=${authorId}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch posts');
    const posts = await res.json();

    if (posts.length === 0) {
      container.innerHTML = `<p class="text-muted">No posts yet.</p>`;
      return;
    }

    container.innerHTML = ''; // clear loading text

    posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'col-md-6 col-lg-4 mb-3';

      const authorName = post.author?.username || 'Unknown';

      card.innerHTML = `
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${post.title}</h5>
            <p class="card-text text-truncate">${post.content}</p>
            <div class="mt-auto">
              <a href="post_detail.html?id=${post.id}" class="btn btn-sm btn-outline-primary">Read More</a>
            </div>
          </div>
          <div class="card-footer text-muted small">
            By ${authorName} • ${new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Failed to load posts.</div>`;
  }
}

// On DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();

  const path = window.location.pathname;

  if (path.endsWith('my_blogs.html')) {
    protectPage();
    // fetch posts for logged-in user
    const username = getUsername();
    const userId = localStorage.getItem('userId'); // Store userId when login happens
    if (userId) {
      await fetchAndRenderPosts('postsContainer', userId);
    }
  }

  if (path.endsWith('index.html') || path === '/' || path === '') {
    await fetchAndRenderPosts('postsContainer');
  }
});
