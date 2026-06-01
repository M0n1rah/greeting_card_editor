/*--------------------------------------------------
                     CONFIG
----------------------------------------------------*/

const API_BASE = "";
 
/*--------------------------------------------------
               SESSION MANAGEMENT
----------------------------------------------------*/

function getSession() {
  try {
    const raw = localStorage.getItem("greetings_session");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
 
function setSession(user, token) {
  localStorage.setItem("greetings_session", JSON.stringify({ user, token }));
}
 
function clearSession() {
  localStorage.removeItem("greetings_session");
}
 
function getAuthHeaders() {
  const session = getSession();
  const headers = { "Content-Type": "application/json" };
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;
  return headers;
}

/*--------------------------------------------------
                      NAV
----------------------------------------------------*/

const hamburger = document.querySelector(".hamburger");
const mobileMenu   = document.querySelector(".mobile-menu");
 
if (hamburger) {
  hamburger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", open);
  });
}
 
function updateNav() {
  const session = getSession();

  //Desktop

  const desktopNav = document.querySelector(".nav-links");
  if (desktopNav && session && !desktopNav.querySelector(".nav-username")) {
    desktopNav.querySelectorAll("button[data-auth]").forEach(btn => {
      btn.parentElement.style.display = "none";
    })

    const userLi = document.createElement("li");
    userLi.className = "nav-username";
    userLi.textContent = `Hi, ${session.user.username}`;
    userLi.style.padding = "0.45rem 1.05rem";
    userLi.style.pointerEvents = "none";

    const logoutLi = document.createElement("li");
    const logoutBtn = document.createElement("button");
    logoutBtn.className = "button";
    logoutBtn.style.marginTop = "0";
    logoutBtn.style.fontSize = "1rem";
    logoutBtn.style.padding = "0.85em 2em";
    logoutBtn.textContent = "Log out";
    logoutBtn.addEventListener("click", handleLogout);
    logoutLi.appendChild(logoutBtn);

    desktopNav.appendChild(userLi);
    desktopNav.appendChild(logoutLi);
  }

  //Mobile

  if (!mobileMenu) return;
  if (session && !mobileMenu.querySelector(".nav-username")) {
    mobileMenu.querySelectorAll("button[data-auth]").forEach(btn => {
      btn.style.display = "none";
    });

    const userBtn = document.createElement("button");
    userBtn.className = "nav-username";
    userBtn.textContent = `Hi, ${session.user.username}`;
    userBtn.style.pointerEvents = "none";
    userBtn.style.padding = "1rem 2rem";
    userBtn.style.textAlign = "center";
    userBtn.style.background = "none";
    userBtn.style.border = "none";
    userBtn.style.borderBottom = "1px solid var(--border)";
    userBtn.style.font = "inherit";
    userBtn.style.width = "100%";

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Log out";
    logoutBtn.className = "button";
    logoutBtn.style.display = "block";
    logoutBtn.style.margin = "1rem auto";
    logoutBtn.addEventListener("click", handleLogout);

    mobileMenu.appendChild(userBtn);
    mobileMenu.appendChild(logoutBtn);
  }
}
 
async function handleLogout() {
  const session = getSession();
  try {
    await fetch(`${API_BASE}/users/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email: session?.user?.email ?? "" }),
    });
  } catch {}
  clearSession();
  window.location.href = "index.html";
}
 
(function guardAuthPages() {
  const page = window.location.pathname.split("/").pop();
  if ((page === "login.html" || page === "signup.html") && getSession()) {
    window.location.href = "index.html";
  }
})();
 
updateNav();

/*--------------------------------------------------
                  AUTH DRAWER
----------------------------------------------------*/
 
const authDrawer  = document.getElementById("auth-drawer");
const authOverlay = document.getElementById("auth-overlay");
const authClose   = document.getElementById("auth-close");
let activeTab = "login";
 
function openAuthDrawer(tab) {
  switchTab(tab || "login");
  authDrawer.classList.add("open");
  authOverlay.classList.add("open");
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    const firstInput = authDrawer.querySelector(`#panel-${activeTab} input`);
    if (firstInput) firstInput.focus();
  }, 380);
}
 
function closeAuthDrawer() {
  authDrawer.classList.remove("open");
  authOverlay.classList.remove("open");
  document.body.style.overflow = "";
  clearAuthErrors();
}
 
function switchTab(tab) {
  activeTab = tab;
  const indicator = document.getElementById("auth-tab-indicator");
  const tabsEl = document.querySelector(".auth-tabs");

  const isMainTab = (tab === "login" || tab === "signup");
  if (tabsEl) tabsEl.style.display = isMainTab ? "" : "none";
 
  document.querySelectorAll(".auth-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.querySelectorAll(".auth-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `panel-${tab}`);
  });
 
  if (indicator) {
    indicator.classList.toggle("right", tab === "signup");
  }
  clearAuthErrors();
}
 
function clearAuthErrors() {
  ["login-error", "signup-error", "forgot-error", "otp-error", "reset-error"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
  document.querySelectorAll(".auth-field.incorrect").forEach(f => f.classList.remove("incorrect"));
}

document.querySelectorAll(".nav-auth-btn, .mobile-auth-btn").forEach(btn => {
  btn.addEventListener("click", () => openAuthDrawer(btn.dataset.auth));
});

document.querySelectorAll(".auth-tab").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

document.querySelectorAll(".auth-switch-btn").forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

if (authOverlay) authOverlay.addEventListener("click", closeAuthDrawer);
if (authClose)   authClose.addEventListener("click", closeAuthDrawer);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && authDrawer?.classList.contains("open")) closeAuthDrawer();
});

switchTab("login");
 
/*--------------------------------------------------
               AUTH FORM HANDLERS
----------------------------------------------------*/
 
const loginForm  = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
 
if (loginForm) {
  loginForm.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      input.closest(".auth-field")?.classList.remove("incorrect");
      const err = document.getElementById("login-error");
      if (err) err.textContent = "";
    });
  });
 
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailEl    = document.getElementById("login-email");
    const passwordEl = document.getElementById("login-password");
    const errorEl    = document.getElementById("login-error");
    const submitBtn  = loginForm.querySelector("button[type='submit']");
 
    const errors = [];
    if (!emailEl.value.trim()) {
      errors.push("Email is required");
      emailEl.closest(".auth-field").classList.add("incorrect");
    }
    if (!passwordEl.value) {
      errors.push("Password is required");
      passwordEl.closest(".auth-field").classList.add("incorrect");
    }
    if (errors.length) { errorEl.textContent = errors.join(". "); return; }
 
    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait…";
 
    try {
      const res  = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailEl.value.trim(), password: passwordEl.value }),
      });
      const data = await res.json();
 
      if (!res.ok) {
        errorEl.textContent = data.message || "Login failed. Please try again.";
        if (res.status === 400) {
          emailEl.closest(".auth-field").classList.add("incorrect");
          passwordEl.closest(".auth-field").classList.add("incorrect");
        }
        submitBtn.disabled = false;
        submitBtn.textContent = "Log In";
        return;
      }
 
      setSession(data.user, data.token);
      window.location.reload();
 
    } catch {
      errorEl.textContent = "Could not reach the server. Please try again.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Log In";
    }
  });
}
 
if (signupForm) {
  signupForm.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      input.closest(".auth-field")?.classList.remove("incorrect");
      const err = document.getElementById("signup-error");
      if (err) err.textContent = "";
    });
  });
 
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usernameEl  = document.getElementById("signup-username");
    const emailEl     = document.getElementById("signup-email");
    const passwordEl  = document.getElementById("signup-password");
    const password2El = document.getElementById("signup-password2");
    const errorEl     = document.getElementById("signup-error");
    const submitBtn   = signupForm.querySelector("button[type='submit']");
 
    const errors = [];
    if (!usernameEl.value.trim()) {
      errors.push("Username is required");
      usernameEl.closest(".auth-field").classList.add("incorrect");
    }
    if (!emailEl.value.trim()) {
      errors.push("Email is required");
      emailEl.closest(".auth-field").classList.add("incorrect");
    }
    if (!passwordEl.value) {
      errors.push("Password is required");
      passwordEl.closest(".auth-field").classList.add("incorrect");
    } else if (passwordEl.value.length < 6) {
      errors.push("Password must be at least 6 characters");
      passwordEl.closest(".auth-field").classList.add("incorrect");
    }
    if (passwordEl.value !== password2El.value) {
      errors.push("Passwords do not match");
      passwordEl.closest(".auth-field").classList.add("incorrect");
      password2El.closest(".auth-field").classList.add("incorrect");
    }
    if (errors.length) { errorEl.textContent = errors.join(". "); return; }
 
    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait…";
 
    try {
      const res  = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameEl.value.trim(),
          email:    emailEl.value.trim(),
          password: passwordEl.value,
        }),
      });
      const data = await res.json();
 
      if (!res.ok) {
        errorEl.textContent = data.message || "Sign up failed. Please try again.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
        return;
      }
 
      setSession(data.user, data.token);
      window.location.reload();
 
    } catch {
      errorEl.textContent = "Could not reach the server. Please try again.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign Up";
    }
  });
}

/*--------------------------------------------------
           FORGOT PASSWORD FLOW
----------------------------------------------------*/
 
let forgotPasswordEmail = "";
 
const forgotPasswordLink = document.getElementById("forgot-password-link");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", () => switchTab("forgot-password"));
}
 
const backToLogin  = document.getElementById("back-to-login");
const backToForgot = document.getElementById("back-to-forgot");
if (backToLogin)  backToLogin.addEventListener("click",  () => switchTab("login"));
if (backToForgot) backToForgot.addEventListener("click", () => switchTab("forgot-password"));

const forgotPasswordForm = document.getElementById("forgot-password-form");
if (forgotPasswordForm) {
  const forgotEmailEl = document.getElementById("forgot-email");
  forgotEmailEl?.addEventListener("input", () => {
    forgotEmailEl.closest(".auth-field")?.classList.remove("incorrect");
    const err = document.getElementById("forgot-error");
    if (err) err.textContent = "";
  });
 
  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl  = document.getElementById("forgot-error");
    const submitBtn = forgotPasswordForm.querySelector("button[type='submit']");
    const email    = forgotEmailEl.value.trim();
 
    if (!email) {
      errorEl.textContent = "Email is required.";
      forgotEmailEl.closest(".auth-field").classList.add("incorrect");
      return;
    }
 
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
 
    try {
      const res  = await fetch(`${API_BASE}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
 
      if (!res.ok) {
        errorEl.textContent = data.message || "Something went wrong. Please try again.";
        forgotEmailEl.closest(".auth-field").classList.add("incorrect");
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Code";
        return;
      }
 
      forgotPasswordEmail = email;
 
      const otpSub = document.getElementById("otp-sub");
      if (otpSub) otpSub.textContent = `We sent a 6-digit code to ${email}.`;
 
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Code";
      switchTab("otp");
 
    } catch {
      errorEl.textContent = "Could not reach the server. Please try again.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Code";
    }
  });
}

const otpForm = document.getElementById("otp-form");
if (otpForm) {
  const otpInput = document.getElementById("otp-input");
  otpInput?.addEventListener("input", () => {
    otpInput.closest(".auth-field")?.classList.remove("incorrect");
    const err = document.getElementById("otp-error");
    if (err) err.textContent = "";
  });
 
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl  = document.getElementById("otp-error");
    const submitBtn = otpForm.querySelector("button[type='submit']");
    const otp      = otpInput.value.trim();
 
    if (!otp || otp.length !== 6) {
      errorEl.textContent = "Please enter the 6-digit code.";
      otpInput.closest(".auth-field").classList.add("incorrect");
      return;
    }
 
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying…";
 
    try {
      const res  = await fetch(`${API_BASE}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail, otp: Number(otp) }),
      });
      const data = await res.json();
 
      if (!res.ok) {
        errorEl.textContent = data.message || "Invalid or expired code. Please try again.";
        otpInput.closest(".auth-field").classList.add("incorrect");
        submitBtn.disabled = false;
        submitBtn.textContent = "Verify Code";
        return;
      }
 
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify Code";
      switchTab("reset-password");
 
    } catch {
      errorEl.textContent = "Could not reach the server. Please try again.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify Code";
    }
  });
}

const resetPasswordForm = document.getElementById("reset-password-form");
if (resetPasswordForm) {
  resetPasswordForm.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      input.closest(".auth-field")?.classList.remove("incorrect");
      const err = document.getElementById("reset-error");
      if (err) err.textContent = "";
    });
  });
 
  resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPwEl   = document.getElementById("reset-new-password");
    const newPw2El  = document.getElementById("reset-new-password2");
    const errorEl   = document.getElementById("reset-error");
    const submitBtn = resetPasswordForm.querySelector("button[type='submit']");
    const otpVal    = document.getElementById("otp-input")?.value.trim();
 
    const errors = [];
    if (!newPwEl.value) {
      errors.push("Password is required.");
      newPwEl.closest(".auth-field").classList.add("incorrect");
    } else if (newPwEl.value.length < 6) {
      errors.push("Password must be at least 6 characters.");
      newPwEl.closest(".auth-field").classList.add("incorrect");
    }
    if (newPwEl.value !== newPw2El.value) {
      errors.push("Passwords do not match.");
      newPwEl.closest(".auth-field").classList.add("incorrect");
      newPw2El.closest(".auth-field").classList.add("incorrect");
    }
    if (errors.length) { errorEl.textContent = errors.join(" "); return; }
 
    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting…";
 
    try {
      const res  = await fetch(`${API_BASE}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:       forgotPasswordEmail,
          otp:         Number(otpVal),
          newPassword: newPwEl.value,
        }),
      });
      const data = await res.json();
 
      if (!res.ok) {
        errorEl.textContent = data.message || "Reset failed. Please try again.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Reset Password";
        return;
      }
 
      forgotPasswordEmail = "";
      if (document.getElementById("otp-input")) document.getElementById("otp-input").value = "";
 
      closeAuthDrawer();
      showToast("Password reset! You can now log in.");
      switchTab("login");
 
    } catch {
      errorEl.textContent = "Could not reach the server. Please try again.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Reset Password";
    }
  });
}

/*--------------------------------------------------
                   Homepage
--------------------------------------------------*/

const CARDS = [
  {
    id: 1,
    title: "Bloom",
    tag: "Thinking of You",
    draw: (ctx, w, h, callback) => drawBloom(ctx, w, h, callback),
  },
  {
    id: 2,
    title: "Colors",
    tag: "Birthday",
    draw: (ctx, w, h, callback) => drawCelebration(ctx, w, h, callback),
  },
  {
    id: 3,
    title: "New Moon",
    tag: "Holiday",
    draw: (ctx, w, h, callback) => drawNewMoon(ctx, w, h, callback),
  },
];

const _imgCache = {};

function _getCardImage(src, ctx, w, h, callback) {
  if (_imgCache[src] && _imgCache[src].complete && _imgCache[src].naturalWidth > 0) {
    ctx.drawImage(_imgCache[src], 0, 0, w, h);
    if (callback) callback();
    return;
  }
 
  if (!_imgCache[src]) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    _imgCache[src] = img;
    img.src = src;
  }
 
  const img = _imgCache[src];
 
  img.addEventListener("load", function onLoad() {
    img.removeEventListener("load", onLoad);
    ctx.drawImage(img, 0, 0, w, h);
    if (callback) callback();
  });
}


function drawBloom(ctx, w, h, callback) {
  _getCardImage("assets/Greeting_Card_1.png", ctx, w, h, callback);
}

function drawCelebration(ctx, w, h, callback) {
  _getCardImage("assets/Greeting_Card_2.png", ctx, w, h, callback);
}

function drawNewMoon(ctx, w, h, callback) {
  _getCardImage("assets/Greeting_Card_3.png", ctx, w, h, callback);
}

function openEditor(card) {
  window.location.href = `card-editor.html?id=${card.id}`;
}

function buildGrid() {
  const grid = document.getElementById("card-grid");
  if (!grid) return;
  grid.innerHTML = "";

CARDS.forEach((card, i) => {
    const thumb = document.createElement("div");
    thumb.className = "card-thumb";
    thumb.style.animationDelay = `${i * 0.08}s`;
 
    const canvas = document.createElement("canvas");
    canvas.width  = 1800;
    canvas.height = 1200;
 
    const footer = document.createElement("div");
    footer.className = "card-thumb-footer";
    footer.innerHTML = `
      <span class="card-thumb-title">${card.title}</span>
      <span class="card-thumb-tag">${card.tag}</span>
    `;
 
    thumb.appendChild(canvas);
    thumb.appendChild(footer);
    grid.appendChild(thumb);
 
    const ctx = canvas.getContext("2d");
    card.draw(ctx, canvas.width, canvas.height, () => {});
 
    thumb.addEventListener("click", () => openEditor(card));
  });
}

/*--------------------------------------------------
                Card Editor Page
--------------------------------------------------*/
 
let currentCard = CARDS[0];
const params = new URLSearchParams(window.location.search);
const urlId = parseInt(params.get("id"));
 
if (urlId) {
  const found = CARDS.find(c => c.id === urlId);
  if (found) currentCard = found;
}
 
let textColor = "#111111";
 
function renderPreview() {
  const canvas = document.getElementById("preview-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  currentCard.draw(ctx, canvas.width, canvas.height);
}
 
document.querySelectorAll(".swatch").forEach(s => {
  s.addEventListener("click", () => {
    document.querySelectorAll(".swatch").forEach(x => x.classList.remove("selected"));
    s.classList.add("selected");
    textColor = s.dataset.color;
    const focused = document.querySelector(".text-overlay-box.focused");
    if (focused) {
      focused.querySelector("textarea").style.color = textColor;
      focused._data.color = textColor;
    }
  });
});
 
function applyFontToFocused() {
  const focused = document.querySelector(".text-overlay-box.focused");
  if (!focused) return;
  const font  = document.getElementById("font-select").value;
  const size  = Math.max(12, Math.min(64, parseInt(document.getElementById("font-size").value) || 28));
  const ta    = focused.querySelector("textarea");
  ta.style.font = `${size}px ${font}`;
  focused._data.font  = font;
  focused._data.size  = size;
}
 
document.getElementById("font-select")?.addEventListener("change", applyFontToFocused);
document.getElementById("font-size")?.addEventListener("input",  applyFontToFocused);

document.querySelectorAll(".align-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const align   = btn.dataset.align;
    const focused = document.querySelector(".text-overlay-box.focused");
 
    document.querySelectorAll(".align-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
 
    if (focused) {
      focused.querySelector("textarea").style.textAlign = align;
      focused._data.align = align;
    }
  });
});
 
const addTextBtn = document.getElementById("add-text-btn");
if (addTextBtn) {
  addTextBtn.addEventListener("click", () => {
    const wrap = document.querySelector(".canvas-wrap");
    if (!wrap) return;
    const font  = document.getElementById("font-select").value;
    const size  = Math.max(12, Math.min(64, parseInt(document.getElementById("font-size").value) || 28));
    createTextBox(wrap, { x: 10, y: 10, font, size, color: textColor, align: "left" });
  });
}

const canvasWrap = document.querySelector(".canvas-wrap");
if (canvasWrap) {
  canvasWrap.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".text-overlay-box")) {
      document.querySelectorAll(".text-overlay-box").forEach(b => b.classList.remove("focused"));
    }
  });
}
 
function createTextBox(wrap, opts) {
  const box = document.createElement("div");
  box.className = "text-overlay-box";
 
  box._data = { font: opts.font, size: opts.size, color: opts.color, align: opts.align || "left" };
 
  box.style.left   = opts.x + "%";
  box.style.top    = opts.y + "%";
  box.style.width  = "30%";
 
  const handle = document.createElement("div");
  handle.className = "text-overlay-handle";
  handle.title = "Drag to move";
 
  const grip = document.createElement("div");
  grip.className = "text-overlay-drag-grip";
  for (let i = 0; i < 6; i++) grip.appendChild(document.createElement("span"));
  handle.appendChild(grip);
 
  const del = document.createElement("button");
  del.className = "text-overlay-delete";
  del.textContent = "✕";
  del.title = "Remove text box";
  del.addEventListener("click", (e) => { e.stopPropagation(); box.remove(); });
  handle.appendChild(del);
 
  const ta = document.createElement("textarea");
  ta.className = "text-overlay-textarea";
  ta.placeholder = "Type here…";
  ta.style.font      = `${opts.size}px ${opts.font}`;
  ta.style.color     = opts.color;
  ta.style.textAlign = box._data.align;
 
  ta.addEventListener("focus", () => {
    document.querySelectorAll(".text-overlay-box").forEach(b => b.classList.remove("focused"));
    box.classList.add("focused");
 
    document.querySelectorAll(".swatch").forEach(sw => {
      sw.classList.toggle("selected", sw.dataset.color === box._data.color);
    });
    textColor = box._data.color;
 
    const fontSel = document.getElementById("font-select");
    const sizeInp = document.getElementById("font-size");
    if (fontSel) fontSel.value = box._data.font;
    if (sizeInp) sizeInp.value = box._data.size;
 
    document.querySelectorAll(".align-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.align === box._data.align);
    });
  });
 
  ta.addEventListener("input", () => {
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  });
 
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "text-overlay-resize";
  resizeHandle.title = "Drag to resize";
 
  box.appendChild(handle);
  box.appendChild(ta);
  box.appendChild(resizeHandle);
  wrap.appendChild(box);
 
  let dragging = false, dragStartX, dragStartY, boxStartX, boxStartY;
 
  function startDrag(clientX, clientY) {
    dragging   = true;
    dragStartX = clientX;
    dragStartY = clientY;
    const wRect = wrap.getBoundingClientRect();
    boxStartX   = (parseFloat(box.style.left) / 100) * wRect.width;
    boxStartY   = (parseFloat(box.style.top)  / 100) * wRect.height;
  }
 
  function moveDrag(clientX, clientY) {
    if (!dragging) return;
    const wRect = wrap.getBoundingClientRect();
    const newX  = Math.min(Math.max(0, boxStartX + clientX - dragStartX), wRect.width  - box.offsetWidth);
    const newY  = Math.min(Math.max(0, boxStartY + clientY - dragStartY), wRect.height - box.offsetHeight);
    box.style.left = (newX / wRect.width  * 100) + "%";
    box.style.top  = (newY / wRect.height * 100) + "%";
  }
 
  handle.addEventListener("mousedown", (e) => {
    if (e.target === del) return;
    startDrag(e.clientX, e.clientY);
    e.preventDefault();
  });
 
  document.addEventListener("mousemove", (e) => { if (dragging && !resizing) moveDrag(e.clientX, e.clientY); });
  document.addEventListener("mouseup",   () => { dragging = false; });
 
  handle.addEventListener("touchstart", (e) => {
    if (e.target === del) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
 
  document.addEventListener("touchmove", (e) => {
    if (!dragging || resizing) return;
    const t = e.touches[0];
    moveDrag(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
 
  document.addEventListener("touchend", () => { dragging = false; });
 
  let resizing = false, resizeStartX, resizeStartY, resizeStartW, resizeStartH;
 
  function startResize(clientX, clientY) {
    resizing      = true;
    resizeStartX  = clientX;
    resizeStartY  = clientY;
    resizeStartW  = box.offsetWidth;
    resizeStartH  = box.offsetHeight;
  }
 
  function doResize(clientX, clientY) {
    if (!resizing) return;
    const wRect  = wrap.getBoundingClientRect();
    const newW   = Math.max(80,  resizeStartW + (clientX - resizeStartX));
    const newH   = Math.max(44,  resizeStartH + (clientY - resizeStartY));
    const maxW   = wRect.width  - box.offsetLeft;
    const maxH   = wRect.height - box.offsetTop;
    box.style.width  = Math.min(newW, maxW) + "px";
    box.style.height = Math.min(newH, maxH) + "px";
    ta.style.height  = (Math.min(newH, maxH) - handle.offsetHeight) + "px";
  }
 
  resizeHandle.addEventListener("mousedown", (e) => {
    startResize(e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
  });
 
  document.addEventListener("mousemove", (e) => { if (resizing) doResize(e.clientX, e.clientY); });
  document.addEventListener("mouseup",   () => { resizing = false; });
 
  resizeHandle.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    startResize(t.clientX, t.clientY);
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });
 
  document.addEventListener("touchmove", (e) => {
    if (!resizing) return;
    const t = e.touches[0];
    doResize(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
 
  document.addEventListener("touchend", () => { resizing = false; });
 
  box.addEventListener("mousedown", (e) => {
    if (e.target === resizeHandle || handle.contains(e.target)) return;
    ta.focus();
  });
 
  ta.focus();
  return box;
}
 
async function _renderCardToCanvas(canvas, ctx, wrap) {
 
  const overlayBoxes = document.querySelectorAll(".text-overlay-box");
  overlayBoxes.forEach(b => b.style.visibility = "hidden");
 
  try {
  return await new Promise((resolve) => {
    const wRect  = wrap.getBoundingClientRect();
    const scaleX = canvas.width  / wRect.width;
    const scaleY = canvas.height / wRect.height;
 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
 
    currentCard.draw(ctx, canvas.width, canvas.height, () => {
      document.querySelectorAll(".text-overlay-box").forEach(box => {
        const ta   = box.querySelector("textarea");
        const text = ta.value.trim();
        if (!text) return;
 
        const bRect   = box.getBoundingClientRect();
        const canvasX = (bRect.left - wRect.left) * scaleX;
        const canvasY = (bRect.top  - wRect.top)  * scaleY;
        const maxW    = bRect.width * scaleX;
 
        const { font, size, color, align } = box._data;
        const scaledSize  = size * scaleY;
        const textAlign   = align || "left";
 
        ctx.font         = `${scaledSize}px ${font}`;
        ctx.fillStyle    = color;
        ctx.textAlign    = textAlign;
        ctx.textBaseline = "top";
 
        let alignX;
        if (textAlign === "right")       alignX = canvasX + maxW;
        else if (textAlign === "center") alignX = canvasX + maxW / 2;
        else                             alignX = canvasX;
 
        const lines = [];
        text.split("\n").forEach(paragraph => {
          const words = paragraph.split(" ");
          let line = "";
          words.forEach(word => {
            const test = line ? line + " " + word : word;
            if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
            else line = test;
          });
          lines.push(line);
        });
 
        const lineH = scaledSize * 1.4;
        lines.forEach((l, i) => ctx.fillText(l, alignX, canvasY + i * lineH));
      });
 
      resolve({ scaleX, scaleY });
    });
  });
} finally {
  overlayBoxes.forEach(b => b.style.visibility = "");
  }
}
 
async function _uploadCardToR2(canvas, fileName) {
  const imageBase64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
 
  const res = await fetch(`${API_BASE}/cards/save`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ imageBase64, mimeType: "image/jpeg" }),
  });
 
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");
 
  return `https://greetings-friend.netlify.app/card.html?id=${data.cardId}`;
}
 
async function saveCard() {
  const previewCanvas = document.getElementById("preview-canvas");
  const wrap = document.querySelector(".canvas-wrap");
  if (!previewCanvas || !wrap) return;
 
  const saveBtn = document.getElementById("save-card-btn");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving…"; }
 
  const fileName = `${currentCard.title.toLowerCase().replace(/ /g, "-")}-card.jpeg`;
 
  const canvas = document.createElement("canvas");
  canvas.width  = previewCanvas.width;
  canvas.height = previewCanvas.height;
  const ctx = canvas.getContext("2d");
 
  try {
    await _renderCardToCanvas(canvas, ctx, wrap);
 
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/jpeg", 0.85);
    link.click();
 
    showToast("Card saved!");
  } catch (err) {
    console.error("Save failed:", err);
    showToast("Could not save card — please try again.");
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Save Card"; }
  }
}
 
/*--------------------------------------------------
                  SHARE CARD
----------------------------------------------------*/
 
async function shareCard() {
  const previewCanvas = document.getElementById("preview-canvas");
  const wrap = document.querySelector(".canvas-wrap");
  if (!previewCanvas || !wrap) return;

  const shareBtn    = document.getElementById("share-card-btn");
  const shareStatus = document.getElementById("share-status");

  if (shareBtn)    { shareBtn.disabled = true; shareBtn.textContent = "Share Card"; }
  if (shareStatus) { shareStatus.textContent = "Generating your link, please wait…"; }

  const fileName = `${currentCard.title.toLowerCase().replace(/ /g, "-")}-card.jpeg`;

  const canvas = document.createElement("canvas");
  canvas.width  = previewCanvas.width;
  canvas.height = previewCanvas.height;
  const ctx = canvas.getContext("2d");

  try {
    await _renderCardToCanvas(canvas, ctx, wrap);
    const shareUrl = await _uploadCardToR2(canvas, fileName);
    _openShareModal(canvas, fileName, shareUrl);

  } catch (err) {
    console.error("Share failed:", err);
    showToast("Could not prepare card for sharing — please try again.");
  } finally {
    if (shareBtn)    { shareBtn.disabled = false; shareBtn.textContent = "Share Card"; }
    if (shareStatus) { shareStatus.textContent = ""; }
  }
}
 
function _openShareModal(canvas, fileName, r2Url) {
  const dataUrl = canvas.toDataURL("image/png");
 
  const img = document.getElementById("share-preview-img");
  if (img) img.src = dataUrl;
 
  const linkInput = document.getElementById("share-link-input");
  if (linkInput) linkInput.value = r2Url || dataUrl.substring(0, 80) + "\u2026";
 
  const dlBtn = document.getElementById("share-download-btn");
  if (dlBtn) {
    dlBtn.onclick = () => {
      const a = document.createElement("a");
      a.download = fileName;
      a.href = r2Url || dataUrl;
      a.click();
      showToast("Card downloaded!");
    };
  }
 
  const copyBtn = document.getElementById("share-copy-btn");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        if (r2Url) {
          await navigator.clipboard.writeText(r2Url);
          showToast("Link copied to clipboard!");
        } else {
          canvas.toBlob(async (blob) => {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
              showToast("Image copied to clipboard!");
            } catch {
              await navigator.clipboard.writeText(dataUrl);
              showToast("Image URL copied!");
            }
          }, "image/png");
        }
      } catch {
        showToast("Could not copy \u2014 try Download instead.");
      }
    };
  }
 
  const modal   = document.getElementById("share-modal");
  const overlay = document.getElementById("share-overlay");
  if (modal)   modal.classList.add("open");
  if (overlay) overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
 
function _closeShareModal() {
  const modal   = document.getElementById("share-modal");
  const overlay = document.getElementById("share-overlay");
  if (modal)   modal.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}
 
(function wireShareModal() {
  const closeBtn = document.getElementById("share-modal-close");
  const overlay  = document.getElementById("share-overlay");
  if (closeBtn) closeBtn.addEventListener("click", _closeShareModal);
  if (overlay)  overlay.addEventListener("click", _closeShareModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("share-modal")?.classList.contains("open")) {
      _closeShareModal();
    }
  });
})();

/*--------------------------------------------------
             Sign Up and Log In Pages
--------------------------------------------------*/

const form = document.getElementById("form");
 
if (form) {
  const username_input        = document.getElementById("username-input");
  const email_input           = document.getElementById("email-input");
  const password_input        = document.getElementById("password-input");
  const repeat_password_input = document.getElementById("repeat-password-input");
  const error_message         = document.getElementById("error-message");
 
  [username_input, email_input, password_input, repeat_password_input]
    .filter(Boolean)
    .forEach(input => {
      input.addEventListener("input", () => {
        if (input.parentElement.classList.contains("incorrect")) {
          input.parentElement.classList.remove("incorrect");
          error_message.innerText = "";
        }
      });
    });
 
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
 
    const errors = username_input
      ? getSignupFormErrors(
          username_input.value,
          email_input.value,
          password_input.value,
          repeat_password_input.value
        )
      : getLoginFormErrors(email_input.value, password_input.value);
 
    if (errors.length > 0) {
      error_message.innerText = errors.join(". ");
      return;
    }
 
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait…";
 
    try {
      if (username_input) {
        const res  = await fetch(`${API_BASE}/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username_input.value.trim(),
            email:    email_input.value.trim(),
            password: password_input.value,
          }),
        });
        const data = await res.json();
 
        if (!res.ok) {
          error_message.innerText = data.message || "Sign up failed. Please try again.";
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign Up";
          return;
        }
 
        setSession(data.user, data.token);
        window.location.href = "index.html";
 
      } else {
        const res  = await fetch(`${API_BASE}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email:    email_input.value.trim(),
            password: password_input.value,
          }),
        });
        const data = await res.json();
 
        if (!res.ok) {
          error_message.innerText = data.message || "Login failed. Please try again.";
          
          if (res.status === 400) {
            email_input.parentElement.classList.add("incorrect");
            password_input.parentElement.classList.add("incorrect");
          }
          submitBtn.disabled = false;
          submitBtn.textContent = "Log In";
          return;
        }
 
        setSession(data.user, data.token);
        window.location.href = "index.html";
      }
 
    } catch (err) {
      error_message.innerText = "Could not reach the server. Please try again.";
      submitBtn.disabled = false;
      submitBtn.textContent = username_input ? "Sign Up" : "Log In";
    }
  });
}
 
/*--------------------------------------------------
             VALIDATION HELPERS
----------------------------------------------------*/

function getSignupFormErrors(username, email, password, repeatPassword) {
  const errors = [];
  const username_input        = document.getElementById("username-input");
  const email_input           = document.getElementById("email-input");
  const password_input        = document.getElementById("password-input");
  const repeat_password_input = document.getElementById("repeat-password-input");
 
  if (!username) {
    errors.push("Username is required");
    username_input.parentElement.classList.add("incorrect");
  }
  if (!email) {
    errors.push("Email is required");
    email_input.parentElement.classList.add("incorrect");
  }
  if (!password) {
    errors.push("Password is required");
    password_input.parentElement.classList.add("incorrect");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
    password_input.parentElement.classList.add("incorrect");
  }
  if (password !== repeatPassword) {
    errors.push("Passwords do not match");
    password_input.parentElement.classList.add("incorrect");
    repeat_password_input.parentElement.classList.add("incorrect");
  }
  return errors;
}
 
function getLoginFormErrors(email, password) {
  const errors = [];
  const email_input    = document.getElementById("email-input");
  const password_input = document.getElementById("password-input");
 
  if (!email) {
    errors.push("Email is required");
    email_input.parentElement.classList.add("incorrect");
  }
  if (!password) {
    errors.push("Password is required");
    password_input.parentElement.classList.add("incorrect");
  }
  return errors;
}

/*--------------------------------------------------
                      TOAST
----------------------------------------------------*/

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

/*--------------------------------------------------
                      INIT
----------------------------------------------------*/

buildGrid();

if (document.getElementById("preview-canvas")) {
  renderPreview();
}