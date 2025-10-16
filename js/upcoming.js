import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyCZK0bKgBqfVlcMXq3_vo5x42-QQZPqbVo",
    authDomain: "todo-list-chat-bot.firebaseapp.com",
    projectId: "todo-list-chat-bot",
    storageBucket: "todo-list-chat-bot.firebasestorage.app",
    messagingSenderId: "701330320999",
    appId: "1:701330320999:web:08d8df41178a1f0ae12ec2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserId = null;
let allTasks = [];
let folderCache = {};

// Helper function to get user data
const getUserData = async (userId) => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists() ? userDocSnap.data() : null;
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            currentUserId = user.uid;
            loadInitialData();
            setupEventListeners();
            initializeModal(currentUserId);
        } else {
            window.location.href = 'index.html';
        }
    });
});

async function loadInitialData() {
    if (!currentUserId) return;

    const [userData, folderSnapshot, tasksSnapshot, allTasksSnapshot] = await Promise.all([
        getUserData(currentUserId),
        getDocs(query(collection(db, "folders"), where("userId", "==", currentUserId))),
        getDocs(query(collection(db, "tasks"), where("userId", "==", currentUserId), where("completed", "==", false), orderBy("dueDate", "asc"))),
        getDocs(query(collection(db, "tasks"), where("userId", "==", currentUserId)))
    ]);

    folderCache = {};
    folderSnapshot.forEach(doc => {
        folderCache[doc.id] = doc.data().name;
    });

    allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const allTasksForSidebar = allTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (userData) renderHeader(userData);
    renderSidebar(allTasksForSidebar);
    renderTasks(allTasks);
    updateAnalytics(allTasks);
}

function renderHeader(user) {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    topbar.innerHTML = `
        <div class="topbar-left"><img src="assets/logo.svg" alt="LifeTrack AI" class="logo"> <span>LifeTrack AI</span></div>
        <div class="topbar-right">
            <div class="user-menu"><span class="user-name">${user.name || 'User'}</span> <img src="${user.avatar || 'https://i.pravatar.cc/120'}" alt="${user.name || 'User'}" class="user-avatar"></div>
            <button class="btn-logout" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </button>
        </div>
    `;
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Failed to logout. Please try again.');
            }
        });
    }
}

function renderSidebar(tasks) {
    const upcomingCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;
    const navContainer = document.querySelector('.sidebar-nav');
    if (!navContainer) return;
    navContainer.innerHTML = `
        <a href="dashboard-new.html" class="nav-link"><i class="fas fa-user-circle"></i> Profile</a>
        <a href="folders.html" class="nav-link"><i class="fas fa-folder"></i> Folders</a>
        <a href="upcoming.html" class="nav-link active"><i class="fas fa-calendar-alt"></i> Upcoming <span class="count">${upcomingCount}</span></a>
        <a href="completed.html" class="nav-link"><i class="fas fa-check-circle"></i> Completed <span class="count">${completedCount}</span></a>
        <a href="settings.html" class="nav-link"><i class="fas fa-cog"></i> Settings</a>
    `;
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<p class="empty-list-message">No upcoming tasks found.</p>';
        return;
    }

    tasks.forEach((task, index) => {
        const card = createTaskCard(task);
        taskList.appendChild(card);
        // GSAP Animation
        gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: index * 0.05 });
    });
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.taskId = task.id;

    const folderName = folderCache[task.folderId] || 'Unassigned';
    const dueDate = task.dueDate ? task.dueDate.toDate() : null;
    const isRepeating = task.isRecurring;

    // Time remaining logic
    let timeRemainingLabel = '';
    let progressBarWidth = '0%';
    let progressBarColor = '#4CAF50'; // Green

    if (dueDate) {
        const now = new Date();
        const totalDuration = dueDate.getTime() - (task.createdAt ? task.createdAt.toDate().getTime() : now.getTime());
        const elapsed = now.getTime() - (task.createdAt ? task.createdAt.toDate().getTime() : now.getTime());
        const progress = Math.min(100, (elapsed / totalDuration) * 100);

        progressBarWidth = `${progress}%`;

        const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 1) {
            progressBarColor = '#FF6B35'; // Red
            timeRemainingLabel = 'Due today';
        } else if (diffDays <= 7) {
            progressBarColor = '#FF9800'; // Orange
            timeRemainingLabel = `${diffDays} days left`;
        } else {
            timeRemainingLabel = new Intl.DateTimeFormat().format(dueDate);
        }
    }

    card.innerHTML = `
        <label class="task-checkbox">
            <input type="checkbox">
            <span class="checkmark"></span>
        </label>
        <div class="task-main">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                <span class="folder-tag">${folderName}</span>
                <div class="due-date-bar">
                    <div class="due-date-fill" style="width: ${progressBarWidth}; background-color: ${progressBarColor};"></div>
                </div>
            </div>
        </div>
        <div class="task-icons">
            ${dueDate ? `<span>⏰ ${timeRemainingLabel}</span>` : ''}
            ${isRepeating ? '<svg viewBox="0 0 24 24"><use href="assets/icons.svg#repeat"></use></svg>' : ''}
        </div>
    `;

    card.querySelector('.task-checkbox input').addEventListener('change', async (e) => {
        await completeTask(task.id, e.target.checked);
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateX(-30px)';
        setTimeout(() => card.remove(), 300);
    });

    return card;
}

async function completeTask(taskId, isCompleted) {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completed: isCompleted });
    // Optionally, re-load or just update analytics
    const completedTaskIndex = allTasks.findIndex(t => t.id === taskId);
    if (completedTaskIndex > -1) {
        allTasks.splice(completedTaskIndex, 1);
        updateAnalytics(allTasks);
    }
}

function setupEventListeners() {
    const filterTabs = document.querySelector('.filter-tabs');
    filterTabs.addEventListener('click', e => {
        if (e.target.classList.contains('filter-tab')) {
            document.querySelector('.filter-tab.active').classList.remove('active');
            e.target.classList.add('active');
            applyFilters(e.target.dataset.filter);
        }
    });

    const sortDropdown = document.getElementById('sort-tasks');
    sortDropdown.addEventListener('change', () => {
        applyFilters(document.querySelector('.filter-tab.active').dataset.filter);
    });
}

function applyFilters(filter) {
    let filteredTasks = [...allTasks];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

    if (filter === 'today') {
        filteredTasks = allTasks.filter(t => t.dueDate && t.dueDate.toDate().toDateString() === today.toDateString());
    } else if (filter === 'week') {
        filteredTasks = allTasks.filter(t => t.dueDate && t.dueDate.toDate() >= today && t.dueDate.toDate() <= endOfWeek);
    } else if (filter === 'overdue') {
        filteredTasks = allTasks.filter(t => t.dueDate && t.dueDate.toDate() < today);
    }

    const sortBy = document.getElementById('sort-tasks').value;
    if (sortBy === 'folder') {
        filteredTasks.sort((a, b) => (folderCache[a.folderId] || '').localeCompare(folderCache[b.folderId] || ''));
    } else if (sortBy === 'priority') {
        // Assuming a priority field exists
        filteredTasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    } else {
        // Default sort by date
        filteredTasks.sort((a, b) => (a.dueDate ? a.dueDate.toMillis() : Infinity) - (b.dueDate ? b.dueDate.toMillis() : Infinity));
    }

    renderTasks(filteredTasks);
}

function updateAnalytics(tasks) {
    document.getElementById('total-upcoming').textContent = tasks.length;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueTodayCount = tasks.filter(t => t.dueDate && t.dueDate.toDate().toDateString() === todayStart.toDateString()).length;
    document.getElementById('due-today').textContent = dueTodayCount;

    // Chart.js - 7 Day Forecast
    const sevenDayLabels = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const sevenDayData = sevenDayLabels.map((label, i) => {
        const day = new Date(now);
        day.setDate(now.getDate() + i);
        return tasks.filter(t => t.dueDate && t.dueDate.toDate().toDateString() === day.toDateString()).length;
    });

    const ctx = document.getElementById('seven-day-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: { labels: sevenDayLabels, datasets: [{ data: sevenDayData, borderColor: '#4A90E2', tension: 0.3, fill: false }] },
        options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });
}

function initializeModal(userId) {
    const modal = document.getElementById('add-task-modal');
    const openBtn = document.getElementById('quick-add-task-btn');
    const cancelBtn = document.getElementById('cancel-modal');
    const form = document.getElementById('add-task-form');
    const folderSelect = document.getElementById('folder-selection');

    openBtn.addEventListener('click', () => {
        gsap.to(modal, { autoAlpha: 1, duration: 0.3 });
        // Populate folders
        folderSelect.innerHTML = '<option value="">Select Folder</option>';
        for (const [id, name] of Object.entries(folderCache)) {
            folderSelect.innerHTML += `<option value="${id}">${name}</option>`;
        }
    });

    const closeModal = () => {
        gsap.to(modal, { autoAlpha: 0, duration: 0.3 });
        form.reset();
    };

    cancelBtn.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('task-name').value;
        const folderId = folderSelect.value;

        if (!title || !folderId) {
            alert('Please provide a task name and select a folder.');
            return;
        }

        await addDoc(collection(db, 'tasks'), {
            userId: userId,
            folderId: folderId,
            title: title,
            completed: false,
            dueDate: null, // Simplified for this example
            createdAt: serverTimestamp()
        });

        closeModal();
        loadInitialData(); // Refresh data
    });
}
