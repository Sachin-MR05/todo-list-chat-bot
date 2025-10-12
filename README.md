# LifeTrack AI - Todo List & Routine Management App

> **"Progress. Consistency. Smarter Every Day."**

A futuristic, AI-powered productivity dashboard with elegant glassmorphism design, smooth animations, and comprehensive task tracking features.

## 🎨 Features

### Login Page (`index.html`)
- **Two-column layout** with Lottie animation and glassmorphic login card
- **Pastel gradient theme** (soft blues, violets, whites)
- **Floating background elements** (animated orbs and streaks)
- **Smooth animations** (fade-in, slide-in effects)
- **Responsive design** (desktop, tablet, mobile)
- **Form features**: Email/Password, Remember Me, Forgot Password, Google Sign-In

### Dashboard Page (`dashboard.html`)
- **Sticky Header Bar**
  - App logo and branding
  - Dynamic greeting (Good Morning/Afternoon/Evening)
  - Live clock and date
  - Animated avatar with glowing border

- **Floating Sidebar Navigation**
  - Profile, Folders, Upcoming Tasks, Completed Tasks, Settings
  - Smooth indicator animation
  - Hover glow effects
  - Responsive (collapses to icons on mobile)

- **Main Profile Card**
  - Circular profile image with hover animation
  - Animated metric cards:
    - 🔥 Current Streak (animated counter)
    - 🏆 Highest Streak (animated counter)
    - ⭐ Level Badge (Consistency Hero)

- **Progress Section**
  - Animated line chart (Chart.js)
  - Weekly completion rate visualization
  - Smooth chart animation on page load
  - Interactive tooltips

- **Quick Summary Panel**
  - Today's top 3 tasks with animated progress bars
  - Motivational quote card with fade-in effect
  - Achievement badge with rotating icon
  - Confetti animation for 100% task completion

- **Ambient Background**
  - Floating orbs with blur effects
  - Slow-moving particles (glowing dots)
  - Radial gradients for depth

## 🚀 Technologies Used

- **HTML5** - Semantic structure
- **CSS3** - Glassmorphism, gradients, animations
- **JavaScript (ES6+)** - Interactive features
- **Chart.js** - Animated data visualization
- **GSAP** - Advanced animations and transitions
- **Lottie** - Vector animations (login page)
- **Google Fonts** - Inter typeface

## 📁 Project Structure

```
todo-list-chat-bot/
├── index.html              # Login page
├── dashboard.html          # Main dashboard
├── css/
│   ├── style.css          # Login page styles
│   └── dashboard.css      # Dashboard styles
├── js/
│   ├── app.js             # Login page scripts
│   └── dashboard.js       # Dashboard scripts
├── assets/
│   └── logo.svg           # App logo
└── README.md              # Documentation
```

## 🎯 Getting Started

### Option 1: Direct Open
1. Double-click `index.html` for the login page
2. Double-click `dashboard.html` for the dashboard

### Option 2: Local Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to:
- Login: `http://localhost:8000/index.html`
- Dashboard: `http://localhost:8000/dashboard.html`

## 🎨 Customization

### Colors
Edit CSS variables in `:root` section:
```css
:root {
  --primary: #6b8cff;      /* Primary blue */
  --accent: #b28bff;       /* Accent violet */
  --success: #5fdd9d;      /* Success green */
  /* ... more variables */
}
```

### Branding
- Replace `assets/logo.svg` with your logo
- Update app name in HTML files
- Modify tagline and greeting text

### Lottie Animation
Update the animation path in `js/app.js`:
```javascript
path: 'your-animation-url.json'
```

### Chart Data
Modify chart data in `js/dashboard.js`:
```javascript
chart.data.datasets[0].data = [75, 82, 68, 90, 85, 78, 92];
```

## ✨ Animation Features

### Login Page
- Fade-in for form elements
- Slide-in for illustration panel
- Floating orbs and streaks
- Staggered element animations

### Dashboard
- **GSAP animations**: Profile avatar rotation, card stagger effects
- **Counter animations**: Smooth number counting for metrics
- **Chart animations**: Smooth line drawing with easing
- **Progress bars**: Animated width transitions
- **Confetti**: Celebration effect for completed tasks
- **Hover effects**: Scale and glow on interaction
- **Sidebar indicator**: Smooth position transitions

## 📱 Responsive Breakpoints

- **Desktop**: Full layout with sidebar and summary panel
- **Tablet (< 1400px)**: Summary panel moves below main content
- **Mobile (< 1024px)**: Sidebar shows icons only
- **Small Mobile (< 768px)**: Sidebar moves to bottom, single column layout

## 🎮 Easter Eggs

Try the **Konami Code** on the dashboard:
```
↑ ↑ ↓ ↓ ← → ← → B A
```
Unlocks a special confetti celebration! 🎉

## 🔧 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 Future Enhancements

- [ ] Backend integration (authentication, data persistence)
- [ ] Real-time task updates
- [ ] Dark mode toggle
- [ ] Custom theme builder
- [ ] Export/import data
- [ ] Notification system
- [ ] AI-powered task suggestions
- [ ] Habit tracking with calendar view
- [ ] Team collaboration features

## 📄 License

This project is open source and available for personal and commercial use.

## 👨‍💻 Author

**Sachin MR**  
Built with ❤️ for productivity enthusiasts

---

**LifeTrack AI** - Your Smart Routine Partner
