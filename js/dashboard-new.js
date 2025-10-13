
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, writeBatch, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZK0bKgBqfVlcMXq3_vo5x42-QQZPqbVo",
  authDomain: "todo-list-chat-bot.firebaseapp.com",
  projectId: "todo-list-chat-bot",
  storageBucket: "todo-list-chat-bot.firebasestorage.app",
  messagingSenderId: "701330320999",
  appId: "1:701330320999:web:08d8df41178a1f0ae12ec2",
  measurementId: "G-JDJWS4QY69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Get user data from Firestore
const getUserData = async (userId) => {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data();
  } else {
    console.log("No such document! for user:", userId);
    return null;
  }
};

// Get folders for a specific user
const getFolders = async (userId) => {
    const folders = [];
    try {
        const q = query(collection(db, "folders"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            folders.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error("Error fetching folders: ", error);
    }
    return folders;
};

// Get tasks for a specific user, optionally filtered by folder
const getTasks = async (userId, folderId = null) => {
    const tasks = [];
    try {
        let q;
        if (folderId) {
            q = query(collection(db, "tasks"), where("userId", "==", userId), where("folderId", "==", folderId));
        } else {
            q = query(collection(db, "tasks"), where("userId", "==", userId));
        }
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error("Error fetching tasks: ", error);
    }
    return tasks;
};

// Update a task's completion status
const updateTaskStatus = async (taskId, isCompleted) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    try {
        await updateDoc(taskDocRef, {
            completed: isCompleted
        });
    } catch (error) {
        console.error("Error updating task status: ", error);
    }
};

// Create a new folder for a specific user
const createFolder = async (userId, folderData) => {
    try {
        const docRef = await addDoc(collection(db, "folders"), {
            userId,
            ...folderData,
            progress: 0,
            taskCount: 0,
            lastUpdated: 'Just now',
        });
        // Return the full folder object including the new ID
        const newFolder = {
            id: docRef.id,
            userId,
            ...folderData,
            progress: 0,
            taskCount: 0,
            lastUpdated: 'Just now',
        };
        return newFolder;
    } catch (error) {
        console.error("Error creating folder: ", error);
        return null;
    }
};

// Seed initial data for a new user
const seedInitialData = async (userId, userName) => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        console.log("User data already exists. Skipping seed.");
        return;
    }

    console.log(`Seeding initial data for new user ${userId} with name ${userName}`);
    const batch = writeBatch(db);

    batch.set(userDocRef, {
        name: userName || "New User",
        bio: "Productivity enthusiast · AI-powered goal achiever",
        avatar: `https://i.pravatar.cc/120?u=${userId}`,
        currentStreak: 0,
        highestStreak: 0,
    });

    const folders = [
        { name: 'Morning Routine', description: 'Daily tasks to start the day right', color: '#FF6B35', progress: 0, taskCount: 2, lastUpdated: 'Just now', userId },
        { name: 'Health', description: 'Medication and appointments', color: '#4A90E2', progress: 0, taskCount: 1, lastUpdated: 'Just now', userId },
    ];

    const folderRefs = folders.map(() => doc(collection(db, "folders")));
    folders.forEach((folder, i) => batch.set(folderRefs[i], folder));

    const tasks = [
      { title: 'Morning Workout', time: '7:00 AM', completed: false, dueBarColor: '#4CAF50', userId, folderId: folderRefs[0].id },
      { title: 'Plan your day', time: '7:30 AM', completed: false, dueBarColor: '#FF9800', userId, folderId: folderRefs[0].id },
      { title: 'Take Vitamin D', time: '8:00 AM', completed: false, dueBarColor: '#2196F3', userId, folderId: folderRefs[1].id },
    ];

    tasks.forEach(task => {
        const taskRef = doc(collection(db, "tasks"));
        batch.set(taskRef, task);
    });

    try {
        await batch.commit();
        console.log("Initial data seeded successfully.");
    } catch (error) {
        console.error("Error seeding data: ", error);
    }
};

let currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            const newUserName = sessionStorage.getItem('newUserName');
            if (newUserName) {
                await seedInitialData(currentUserId, newUserName);
                sessionStorage.removeItem('newUserName');
            }
            await renderDashboard(currentUserId);
        } else {
            window.location.href = 'index.html';
        }
    });
});

async function renderDashboard(userId) {
    const [userData, folders, tasks] = await Promise.all([
        getUserData(userId),
        getFolders(userId),
        getTasks(userId)
    ]);

    if (!userData) {
        console.error("Failed to load user data. This might be due to Firestore rules.");
        const mainContainer = document.querySelector('.main-container');
        if(mainContainer) mainContainer.innerHTML = '<h1>Welcome!</h1><p>We are setting up your account. Please wait a moment and refresh the page. If this message persists, please check your Firestore security rules.</p>';
        return;
    }

    renderUserProfile(userData);
    renderSidebar(tasks, folders);
    renderAnalytics(tasks, folders, userData);
    renderFolders(folders, '#folders-grid');
    renderTasks(tasks, '#task-list-container');

    initializeCounters();
    initializeCharts(tasks);
    initializeTaskCheckboxes();
    initializeNewFolderModal();
}

function renderUserProfile(user) {
    const profileCard = document.querySelector('.profile-card');
    const userMenuName = document.querySelector('.user-menu .user-name');
    const userMenuAvatar = document.querySelector('.user-menu .user-avatar');

    if (userMenuName) userMenuName.textContent = user.name || 'User';
    if (userMenuAvatar) userMenuAvatar.src = user.avatar || '';
    
    if (profileCard) {
        profileCard.innerHTML = `
            <div class="profile-header">
                <div class="profile-left">
                    <img src="${user.avatar || ''}" alt="Profile" class="profile-photo" />
                    <div class="profile-info">
                        <h2 class="profile-name">${user.name || 'User'}</h2>
                        <p class="profile-bio">${user.bio || ''}</p>
                    </div>
                </div>
                <div class="profile-stats">
                    <div class="stat-item"><span class="stat-icon">🔥</span><div class="stat-content"><div class="stat-value" data-target="${user.currentStreak || 0}">0</div><div class="stat-label">Current Streak</div></div></div>
                    <div class="stat-divider"></div>
                    <div class="stat-item"><span class="stat-icon">🏆</span><div class="stat-content"><div class="stat-value" data-target="${user.highestStreak || 0}">0</div><div class="stat-label">Highest Streak</div></div></div>
                </div>
            </div>
        `;
    }
}

function renderSidebar(tasks, folders) {
    const navContainer = document.querySelector('.sidebar-nav');
    if (!navContainer) return;
    const upcomingCount = tasks.filter(t => !t.completed).length;
    navContainer.innerHTML = `
        <a href="dashboard-new.html" class="nav-link active" data-page="profile">
            <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
            <span>Dashboard</span>
        </a>
        <a href="folders.html" class="nav-link" data-page="folders">
            <svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>
            <span>Folders</span>
            <span class="count">${folders.length}</span>
        </a>
        <a href="upcoming.html" class="nav-link" data-page="upcoming">
            <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"></path></svg>
            <span>Upcoming</span>
            <span class="count">${upcomingCount}</span>
        </a>
        <a href="settings.html" class="nav-link" data-page="settings">
            <svg viewBox="0 0 24 24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path></svg>
            <span>Settings</span>
        </a>
    `;
}

function renderAnalytics(tasks, folders, user) {
    const container = document.getElementById('analytics-grid');
    if (!container) return;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    container.innerHTML = `
        <div class="card analytics-card">
            <div class="card-icon" style="background: #E6F3FF; color: #4A90E2;"><svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></svg></div>
            <div class="card-info">
                <span class="card-title">Tasks Completed</span>
                <span class="card-value">${completedTasks}/${totalTasks}</span>
            </div>
            <div class="card-chart">
                <div class="progress-bar" style="width: ${completionPercentage}%; background: #4A90E2;"></div>
            </div>
        </div>
        <div class="card analytics-card">
            <div class="card-icon" style="background: #FFF5E6; color: #FF9F0A;"><svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg></div>
            <div class="card-info">
                <span class="card-title">Folders</span>
                <span class="card-value">${folders.length}</span>
            </div>
        </div>
        <div class="card analytics-card">
            <div class="card-icon" style="background: #FFEBEB; color: #D0021B;"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path></svg></div>
            <div class="card-info">
                <span class="card-title">Highest Streak</span>
                <span class="card-value">${user.highestStreak || 0} Days</span>
            </div>
        </div>
    `;
}

function createTaskRowHTML(task) {
    return `
    <div class="task-row ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-left">
            <label class="checkbox-container">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
            <div class="task-details">
                <span class="task-title">${task.title}</span>
                <span class="task-time">${task.time}</span>
            </div>
        </div>
        <div class="task-right">
            <div class="task-due-bar" style="background: ${task.dueBarColor};"></div>
        </div>
    </div>
    `;
}

function renderTasks(tasks, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (tasks.length === 0) {
        container.innerHTML = '<div class="task-row"><p>No tasks for today. Create one to get started!</p></div>';
        return;
    }
    container.innerHTML = tasks.map(createTaskRowHTML).join('');
}

function createFolderCardHTML(folder) {
    const circumference = 2 * Math.PI * 20;
    const offset = circumference - (folder.progress / 100) * circumference;
    return `
        <div class="card folder-card" data-folder-id="${folder.id}" style="opacity:0; transform: translateY(20px);">
            <div class="folder-card-header">
                <div class="folder-icon" style="background: ${folder.color}20;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${folder.color}" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></div>
                <div class="folder-progress-ring">
                    <svg width="48" height="48">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="#f0f0f0" stroke-width="4"></circle>
                        <circle cx="24" cy="24" r="20" fill="none" stroke="${folder.color}" stroke-width="4" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 24 24)"></circle>
                    </svg>
                    <span class="folder-progress-text">${folder.progress}%</span>
                </div>
            </div>
            <h3 class="folder-title">${folder.name}</h3>
            <p class="folder-desc">${folder.description}</p>
            <div class="folder-meta"><span class="folder-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Updated ${folder.lastUpdated}</span><span class="folder-meta-item">${folder.taskCount} tasks</span></div>
        </div>
    `;
}

function renderFolders(folders, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (folders.length === 0) {
        container.innerHTML = '<p>No folders found. Create one to get started!</p>';
        return;
    }
    container.innerHTML = folders.map(createFolderCardHTML).join('');
    const folderCards = container.querySelectorAll('.folder-card');
    gsap.to(folderCards, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
}


function initializeCounters() {
    const counters = document.querySelectorAll('.stat-value');
    counters.forEach(counter => {
        gsap.to(counter, {
            textContent: counter.dataset.target,
            duration: 1.5,
            ease: "power1.inOut",
            roundProps: "textContent",
            scrambleText: { text: "X", chars: "0123456789", speed: 0.3 }
        });
    });
}
function initializeCharts(tasks) { 
    // Placeholder for future chart initializations
}

function initializeTaskCheckboxes() {
    const taskList = document.getElementById('task-list-container');
    if (!taskList) return;
    taskList.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            const taskRow = e.target.closest('.task-row');
            const taskId = taskRow.dataset.taskId;
            const isCompleted = e.target.checked;
            updateTaskStatus(taskId, isCompleted);
            gsap.to(taskRow, { opacity: isCompleted ? 0.6 : 1, duration: 0.3 });
        }
    });
}

function initializeNewFolderModal() {
    const modal = document.getElementById('new-folder-modal');
    const btn = document.getElementById('new-folder-btn');
    const span = document.getElementsByClassName("close-button")[0];
    const form = document.getElementById('new-folder-form');

    if (!modal || !btn || !span || !form) return;

    btn.onclick = () => modal.style.display = "block";
    span.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    form.onsubmit = async (event) => {
        event.preventDefault();
        const folderName = document.getElementById('folder-name').value;
        const folderDesc = document.getElementById('folder-description').value;
        const folderColor = document.getElementById('folder-color').value;

        const newFolderData = { name: folderName, description: folderDesc, color: folderColor };
        const newFolder = await createFolder(currentUserId, newFolderData);

        if (newFolder) {
            const folderGrid = document.getElementById('folders-grid');
            const newFolderHTML = createFolderCardHTML(newFolder);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newFolderHTML;
            const newFolderCard = tempDiv.firstChild;
            folderGrid.appendChild(newFolderCard);

            gsap.to(newFolderCard, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
            
            modal.style.display = "none";
            form.reset();
        }
    };
}
