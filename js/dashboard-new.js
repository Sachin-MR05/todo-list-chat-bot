
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, writeBatch, updateDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const getUserData = async (userId) => {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);
  return userDocSnap.exists() ? userDocSnap.data() : null;
};

const getFolders = async (userId) => {
    const folders = [];
    const q = query(collection(db, "folders"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => folders.push({ id: doc.id, ...doc.data() }));
    return folders;
};

const getTasks = async (userId) => {
    const tasks = [];
    const q = query(collection(db, "tasks"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => tasks.push({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate() }));
    return tasks;
};

const calculateAvgCompletion = (tasks) => {
    const past7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.setHours(0, 0, 0, 0);
    }).reverse();

    const dailyData = past7Days.map(day => {
        const tasksForDay = tasks.filter(t => t.timestamp && t.timestamp.setHours(0,0,0,0) === day);
        const completed = tasksForDay.filter(t => t.completed).length;
        return tasksForDay.length > 0 ? (completed / tasksForDay.length) * 100 : 0;
    });
    const overallAverage = dailyData.length > 0 ? dailyData.reduce((a, b) => a + b, 0) / dailyData.length : 0;
    return { chartData: dailyData, average: Math.round(overallAverage) };
}

const seedInitialData = async (userId, userName) => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) return;

    const batch = writeBatch(db);
    batch.set(userDocRef, {
        name: userName || "Sachin MR",
        bio: "Productivity enthusiast · AI-powered goal achiever",
        avatar: `https://i.pravatar.cc/120?u=${userId}`,
        currentStreak: 47,
        highestStreak: 89,
    });

    const folders = [
        { name: 'Morning Routine', description: 'Daily tasks to start the day right', color: '#FF9500', progress: 75, userId },
        { name: 'Tablets', description: 'Medication schedule and reminders', color: '#007AFF', progress: 60, userId },
        { name: 'Pregnancy Check', description: 'Health tracking and appointments', color: '#AF52DE', progress: 90, userId },
    ];

    const folderRefs = folders.map(() => doc(collection(db, "folders")));
    folders.forEach((folder, i) => batch.set(folderRefs[i], folder));

    // Seed some task data for the chart
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        batch.set(doc(collection(db, "tasks")), { title: `Task from day ${i}`, completed: Math.random() > 0.3, userId, timestamp: d });
    }

    await batch.commit();
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const newUserName = sessionStorage.getItem('newUserName');
            if (newUserName) {
                await seedInitialData(user.uid, newUserName);
                sessionStorage.removeItem('newUserName');
            }
            renderDashboard(user.uid);
        } else { window.location.href = 'index.html'; }
    });
});

async function renderDashboard(userId) {
    const [userData, folders, tasks] = await Promise.all([ getUserData(userId), getFolders(userId), getTasks(userId) ]);
    if (!userData) { document.body.innerHTML = 'Error loading user data.'; return; }

    renderHeader(userData);
    renderSidebar(tasks, folders);
    renderProfileCard(userData);
    renderAnalytics(tasks, folders);
    renderFolders(folders);
}

function renderHeader(user) {
    const topbar = document.querySelector('.topbar');
    topbar.innerHTML = `
        <div class="topbar-left"><img src="assets/logo.svg" alt="LifeTrack AI" class="logo"> <span>LifeTrack AI</span></div>
        <div class="user-menu"><span class="user-name">${user.name}</span> <img src="${user.avatar}" alt="${user.name}" class="user-avatar"></div>
    `;
}

function renderSidebar(tasks, folders) {
    const upcomingCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;
    const navContainer = document.querySelector('.sidebar-nav');
    if (!navContainer) return;
    navContainer.innerHTML = `
        <a href="dashboard-new.html" class="nav-link active"><i class="fas fa-user-circle"></i> Profile</a>
        <a href="folders.html" class="nav-link"><i class="fas fa-folder"></i> Folders</a>
        <a href="upcoming.html" class="nav-link"><i class="fas fa-calendar-alt"></i> Upcoming <span class="count">${upcomingCount}</span></a>
        <a href="completed.html" class="nav-link"><i class="fas fa-check-circle"></i> Completed <span class="count">${completedCount}</span></a>
        <a href="settings.html" class="nav-link"><i class="fas fa-cog"></i> Settings</a>
    `;
}

function renderProfileCard(user) {
    const container = document.getElementById('profile-card-container');
    if (!container) return;
    container.innerHTML = `
        <div class="profile-info">
            <img src="${user.avatar}" alt="User Avatar" class="profile-avatar">
            <div><h2 class="profile-name">${user.name}</h2><p class="profile-bio">${user.bio}</p></div>
        </div>
        <div class="profile-stats">
            <div class="stat"><span class="stat-icon">🔥</span><span class="stat-value">${user.currentStreak}</span><span class="stat-label">Current Streak</span></div>
            <div class="stat"><span class="stat-icon">🏆</span><span class="stat-value">${user.highestStreak}</span><span class="stat-label">Highest Streak</span></div>
        </div>
    `;
}

function renderAnalytics(tasks, folders) {
    const container = document.getElementById('analytics-grid-container');
    if (!container) return;
    const { chartData, average } = calculateAvgCompletion(tasks);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    container.innerHTML = `
        <div class="card analytics-card">
            <h3>Avg. Daily Completion</h3>
            <div class="avg-completion"><span class="percentage">${average}%</span><canvas id="completion-chart" height="60"></canvas></div>
            <span class="card-footer">This Week</span>
        </div>
        <div class="card analytics-card">
            <h3>Tasks Completed</h3>
            <div class="tasks-completed"><span class="task-count"><b>${completedTasks}</b><small>/ ${totalTasks} tasks</small></span><div class="progress-ring" style="--p:${completionPercentage}"><span>${completionPercentage}%</span></div></div>
            <span class="card-footer">This Week</span>
        </div>
        <div class="card analytics-card active-folders-card">
            <h3>Active Folders</h3>
            <ul>${folders.map(f => `<li><span class="folder-dot" style="background-color:${f.color};"></span>${f.name}</li>`).join('')}</ul>
            <span class="card-footer">${folders.length} folders</span>
        </div>
    `;
    new Chart(document.getElementById('completion-chart'), { type: 'line', data: { labels: ['', '', '', '', '', '', ''], datasets: [{ data: chartData, borderColor: '#007AFF', tension: 0.4, fill: false, pointRadius: 0 }] }, options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } }, layout: { padding: { left: -10, bottom: -10 } } } });
}

function renderFolders(folders) {
    const container = document.getElementById('folder-grid-container');
    if (!container) return;
    container.innerHTML = `
        <div class="folders-header"><h2>Your Folders</h2><button class="btn btn-primary">+ New Folder</button></div>
        <div class="folder-grid">
            ${folders.map(folder => `
                <div class="card folder-card">
                    <div class="folder-card-header">
                        <div class="folder-icon" style="background-color:${folder.color}20; color:${folder.color};"><i class="fas fa-folder"></i></div>
                        <div class="progress-ring-small" style="--p:${folder.progress}"><span>${folder.progress}%</span></div>
                    </div>
                    <h4>${folder.name}</h4><p>${folder.description}</p>
                </div>
            `).join('')}
        </div>
    `;
}
