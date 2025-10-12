// Completed Tasks Page - LifeTrack AI

document.addEventListener('DOMContentLoaded', () => {
  initializeCounters();
  initializeGrouping();
  initializeChart();
  animateCards();
});

// Animated Counters
function initializeCounters() {
  const counters = document.querySelectorAll('[data-target]');
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateCounter();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(counter);
  });
}

// Grouping Functionality
function initializeGrouping() {
  const sortDropdown = document.querySelector('.sort-dropdown');
  
  if (sortDropdown) {
    sortDropdown.addEventListener('change', (e) => {
      const groupBy = e.target.value;
      console.log('Grouping by:', groupBy);
      // Here you would implement the actual grouping logic
      // For now, just log the selection
    });
  }
}

// Initialize Chart
function initializeChart() {
  const ctx = document.getElementById('completedChart');
  if (!ctx || !window.Chart) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Tasks Completed',
        data: [5, 8, 6, 9, 7, 4, 6],
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: '#4CAF50',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#2c3e50',
          bodyColor: '#6c757d',
          borderColor: '#e9ecef',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (context) => {
              return ` ${context.parsed.y} tasks completed`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 2,
            font: { size: 11 },
            color: '#6c757d'
          },
          grid: {
            color: '#f5f6f7'
          }
        },
        x: {
          ticks: {
            font: { size: 11 },
            color: '#6c757d'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// GSAP Animations
function animateCards() {
  if (!window.gsap) return;

  // Animate summary cards
  const summaryCards = document.querySelectorAll('.summary-card');
  gsap.from(summaryCards, {
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out'
  });

  // Animate task groups
  const taskGroups = document.querySelectorAll('.task-group');
  taskGroups.forEach((group, index) => {
    gsap.from(group, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      delay: 0.3 + (index * 0.1),
      ease: 'power2.out'
    });
  });

  // Animate stats panel
  gsap.from('.stats-panel', {
    x: 50,
    opacity: 0,
    duration: 0.8,
    delay: 0.5,
    ease: 'power2.out'
  });

  // Hover effects for completed tasks
  const taskCards = document.querySelectorAll('.completed-task-card');
  taskCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        x: 6,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        x: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });

  // Animate achievement badge
  const badge = document.querySelector('.achievement-badge');
  if (badge) {
    gsap.from(badge, {
      scale: 0.8,
      opacity: 0,
      duration: 0.6,
      delay: 1,
      ease: 'back.out(1.7)'
    });
  }
}

// Completion bar animation observer
const completionBars = document.querySelectorAll('.completion-fill');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'fillBar 1s ease-out';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

completionBars.forEach(bar => observer.observe(bar));
