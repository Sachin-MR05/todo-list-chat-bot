# TODO for Adding Register and Forgot Password Pages

## Current Work
Creating register.html and forgot-password.html with simple forms consistent with login page (css/login.css layout, GSAP animations). Updating index.html and js/app.js for navigation: Sign Up and Continue with Google to register.html; Forgot Password to forgot-password.html. Simulating registration (validate password match, redirect to dashboard-new.html) and forgot password (notification, back to login).

## Key Technical Concepts
- HTML Structure: Copy from index.html (grid layout, left-panel brand, right-panel card form).
- CSS: Use css/login.css for consistency (variables, animations).
- JS: GSAP for load animations; form handlers with validation (register: password match; forgot: email log + notification).
- Navigation: JS redirects (no real auth, simulate success).
- Branding: LifeTrack AI, simple fields (register: name, email, password, confirm; forgot: email).

## Relevant Files and Code
- index.html: Login form with Sign Up button, Google button, Forgot link.
  - Update: Add onclick or JS handlers for redirects to register.html and forgot-password.html.
- js/app.js: Current login handlers (submit/Google to dashboard).
  - Update: Change Google to 'register.html'.
- register.html (new): Form with name, email, password, confirm password, Google button; link css/login.css, js/register.js.
- forgot-password.html (new): Email form, submit button; link css/login.css, js/forgot-password.js.
- js/register.js (new): GSAP animations, submit validation (password === confirm), console.log, redirect to dashboard-new.html.
- js/forgot-password.js (new): GSAP animations, submit log email, show notification ("Reset link sent"), redirect to index.html.

## Problem Solving
- No existing pages: Create new files mirroring login structure for consistency.
- Navigation: Use JS handlers for buttons/links to avoid href (simulate flow).
- Validation: Simple JS check for register (password match); notification for forgot (reuse showSuccessNotification if added, or console).
- Styles/Animations: Reuse login.css and GSAP patterns.

## Pending Tasks and Next Steps
- [ ] Create register.html: Copy index.html structure; change title "Register | LifeTrack AI", h2 "Create Account", form fields (add .form-group for name, confirm password); Google button; <link css/login.css>, <script gsap>, <script defer js/register.js>.
  - Form: <input type="text" id="name" placeholder="Full Name" required /> after email.
  - Submit button "Register".
- [ ] Create js/register.js: DOMContentLoaded with GSAP (similar to app.js: left-panel, card, stagger form); form submit: preventDefault, get values, if password !== confirm alert("Passwords don't match"), else console.log, redirect 'dashboard-new.html'; Google click to 'dashboard-new.html' (simulate).
- [ ] Create forgot-password.html: Simplified structure (no left-panel or brand, centered card with h2 "Forgot Password?", subtitle "Enter email to reset", .form-group email input, submit "Send Reset Link", back link to login); <link css/login.css>, <script gsap>, <script defer js/forgot-password.js>.
- [ ] Create js/forgot-password.js: GSAP for card fade; form submit: preventDefault, get email, console.log, show notification "Reset link sent to [email]", redirect 'index.html'.
- [ ] Edit index.html: Update Sign Up button onclick="window.location.href='register.html'"; update js/app.js Google handler to 'register.html'; add <a href="forgot-password.html"> for Forgot Password link.
- [ ] Edit js/app.js: Change Google handler redirect to 'register.html'.
- [ ] After creations, reload index.html: Click Sign Up/Google -> register.html (form validates, submits to dashboard); Forgot -> forgot-password.html (submits notification, back to login).
- [ ] Test responsive and animations on new pages.
- [ ] Update TODO.md with progress after each step.
