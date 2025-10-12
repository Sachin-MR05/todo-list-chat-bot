// LifeTrack AI - Folders Page

document.addEventListener('DOMContentLoaded', () => {
  initializeModal();
  initializeFolderCards();
  initializeChart();
  animateFolders();
});

// Modal Functionality
function initializeModal() {
  const modal = document.getElementById('folderModal');
  const createBtn = document.getElementById('createFolderBtn');
  const createCard = document.getElementById('createFolderCard');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('folderForm');

  // Open modal
  const openModal = () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Close modal
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    form.reset();
  };

  createBtn.addEventListener('click', openModal);
  createCard.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const folderName = document.getElementById('folderName').value;
    const folderDescription = document.getElementById('folderDescription').value;
    const selectedColor = document.querySelector('input[name="color"]:checked').value;
    
    console.log('Creating folder:', { folderName, folderDescription, selectedColor });
    
    // Show success animation
    if (window.gsap) {
      gsap.to(form, {
        scale: 0.95,
        opacity: 0.5,
        duration: 0.2,
        onComplete: () => {
          closeModal();
          // Here you would typically create the folder in your backend
          showSuccessNotification('Folder created successfully!');
        }
      });
    } else {
      closeModal();
      showSuccessNotification('Folder created successfully!');
    }
  });
}

// Success Notification
function showSuccessNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 32px;
    background: #4CAF50;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    font-weight: 500;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  if (window.gsap) {
    gsap.from(notification, {
      x: 100,
      opacity: 0,
      duration: 0.3
    });

    gsap.to(notification, {
      x: 100,
      opacity: 0,
      duration: 0.3,
      delay: 3,
      onComplete: () => notification.remove()
    });
  } else {
    setTimeout(() => notification.remove(), 3000);
  }
}

// Folder Card Interactions
function initializeFolderCards() {
  const folderCards = document.querySelectorAll('.folder-card:not(.create-folder-card)');
  
  folderCards.forEach(card => {
    card.addEventListener('click', () => {
      const folderId = card.getAttribute('data-folder-id');
      const folderTitle = card.querySelector('.folder-title').textContent;
      
      console.log('Opening folder:', folderId, folderTitle);
      
      // Animate card before navigation
      if (window.gsap) {
        gsap.to(card, {
          scale: 0.95,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            // Navigate to folder detail page
            window.location.href = `folder-detail.html?id=${folderId}`;
            console.log('Navigate to folder detail page');
          }
        });
      }
    });
  });

  // Animate progress bars
  const progressFills = document.querySelectorAll('.progress-fill');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const progress = entry.target.getAttribute('data-progress');
        entry.target.style.width = progress + '%';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  progressFills.forEach(fill => {
    fill.style.width = '0%';
    observer.observe(fill);
  });
}

// Initialize Chart
function initializeChart() {
  const ctx = document.getElementById('tasksChart');
  if (!ctx || !window.Chart) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Morning Routine', 'Tablets', 'Pregnancy Check'],
      datasets: [{
        data: [8, 5, 10],
        backgroundColor: [
          '#FF6B35',
          '#4A90E2',
          '#7B68EE'
        ],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: {
              size: 11,
              family: 'Inter'
            },
            color: '#6c757d',
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#2c3e50',
          bodyColor: '#6c757d',
          borderColor: '#e9ecef',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context) => {
              return ` ${context.label}: ${context.parsed} tasks`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// GSAP Animations
function animateFolders() {
  if (!window.gsap) return;

  // Animate folder cards
  const cards = document.querySelectorAll('.folder-card');
  


  // Hover effects
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -6,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });

  // Animate stats panel
  gsap.from('.stats-panel', {
    x: 50,
    opacity: 0,
    duration: 0.8,
    delay: 0.4,
    ease: 'power2.out'
  });
}

// Navigation active state
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    if (link.getAttribute('href').startsWith('#')) {
      e.preventDefault();
    }
  });
});
