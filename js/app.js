import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// --- 1. Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyCZK0bKgBqfVlcMXq3_vo5x42-QQZPqbVo",
    authDomain: "todo-list-chat-bot.firebaseapp.com",
    projectId: "todo-list-chat-bot",
    storageBucket: "todo-list-chat-bot.appspot.com",
    messagingSenderId: "701330320999",
    appId: "1:701330320999:web:08d8df41178a1f0ae12ec2"
};

// --- 2. Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 3. Common UI Functions (from common.js) ---

async function loadCommonUI() {
    try {
        const [topbar, sidebar] = await Promise.all([
            fetch('topbar.html').then(res => res.text()),
            fetch('sidebar.html').then(res => res.text())
        ]);

        document.querySelector('.topbar').innerHTML = topbar;
        document.querySelector('.sidebar').innerHTML = sidebar;

        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        const activeLink = document.querySelector(`.nav-link[data-page="${currentPage}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    } catch (error) {
        console.error("Error loading common UI fragments: ", error);
    }
}

// --- Login Functions ---
function handleLogin() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'dashboard-new.html';
            } catch (error) {
                console.error('Login failed:', error);
                alert(`Login failed: ${error.message}`);
            }
        });
    }

    const googleSignin = document.getElementById('google-signin');
    if (googleSignin) {
        googleSignin.addEventListener('click', async () => {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                window.location.href = 'dashboard-new.html';
            } catch (error) {
                console.error('Google sign-in failed:', error);
                alert(`Google sign-in failed: ${error.message}`);
            }
        });
    }
}

function updateUserInfo(user) {
    const dropdownUsername = document.getElementById('dropdown-username');
    const dropdownUserEmail = document.getElementById('dropdown-user-email');
    const userAvatar = document.getElementById('user-avatar-img');

    if (dropdownUsername) dropdownUsername.textContent = user.displayName || 'User';
    if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
    if (userAvatar && user.photoURL) {
        userAvatar.src = user.photoURL;
    }
}

function initializeAuthActions(auth) {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error("Sign out error: ", error);
            });
        });
    }

    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', () => {
            const dropdown = document.getElementById('user-dropdown');
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
}


// --- 4. Page-Specific Logic (from completed.js) ---

// Global State
let currentUserId = null;
let completedTasks = [];
let folderCache = {};

// Main Initializer
document.addEventListener('DOMContentLoaded', main);

async function main() {
    await loadCommonUI();

    // Initialize login handlers if on login page
    if (window.location.pathname.includes('index.html')) {
        handleLogin();
    }

    onAuthStateChanged(auth, user => {
        if (user) {
            currentUserId = user.uid;
            updateUserInfo(user);
            initializeAuthActions(auth);
            loadInitialData();
            setupEventListeners();
        } else {
            console.log("No user authenticated");
            if (window.location.pathname !== '/index.html') {
                window.location.href = 'index.html';
            }
        }
    });
}

// Data Fetching and Rendering
async function loadInitialData() {
    if (!currentUserId) return;

    try {
        const folderQuery = query(collection(db, "folders"), where("userId", "==", currentUserId));
        const folderSnapshot = await getDocs(folderQuery);
        folderCache = {};
        folderSnapshot.forEach(doc => {
            folderCache[doc.id] = doc.data().name;
        });

        const tasksQuery = query(
            collection(db, "tasks"),
            where("userId", "==", currentUserId),
            where("completed", "==", true)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        let tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort tasks by completion date (newest first), handling tasks without a date
        tasks.sort((a, b) => {
            const dateA = a.completedAt ? a.completedAt.toDate() : new Date(); // Treat missing date as now
            const dateB = b.completedAt ? b.completedAt.toDate() : new Date();
            return dateB - dateA; // Sort descending
        });

        completedTasks = tasks;

        renderGroupedTasks('date');
        updateSummaryStats(completedTasks);
    } catch (error) {
        console.error("Error loading completed tasks:", error);
        const listContainer = document.getElementById('completed-tasks-list');
        listContainer.innerHTML = '<p class="empty-list-message">Error loading tasks. Please check the console for details.</p>';
    }
}

function renderGroupedTasks(grouping) {
    const listContainer = document.getElementById('completed-tasks-list');
    listContainer.innerHTML = '';

    if (completedTasks.length === 0) {
        listContainer.innerHTML = '<p class="empty-list-message">No completed tasks yet. Great job clearing your list!</p>';
        return;
    }

    const groups = {};
    completedTasks.forEach(task => {
        let key;
        if (grouping === 'date') {
            key = task.completedAt && task.completedAt.toDate ? task.completedAt.toDate().toLocaleDateString() : 'Recently';
        } else { 
            key = folderCache[task.folderId] || 'Unassigned';
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
    });

    let animationDelay = 0;
    for (const [groupName, tasks] of Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))) {
        const groupHeader = document.createElement('h4');
        groupHeader.className = 'group-header';
        groupHeader.textContent = groupName;
        listContainer.appendChild(groupHeader);

        tasks.forEach(task => {
            const card = createCompletedTaskCard(task);
            listContainer.appendChild(card);
            gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: animationDelay });
            animationDelay += 0.05;
        });
    }
}

function createCompletedTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'completed-task-card';

    const folderName = folderCache[task.folderId] || 'Unassigned';
    const completionDate = task.completedAt && task.completedAt.toDate ? `Completed on ${task.completedAt.toDate().toLocaleString()}` : 'Completed recently';

    card.innerHTML = `
        <div class="task-checkbox-completed">
            <svg fill="#fff" viewBox="0 0 16 16" height="1em" width="1em"><path d="M13.485 1.431a1.473 1.473 0 012.104 2.062l-7.84 9.801a1.473 1.473 0 01-2.12.04L.431 8.138a1.473 1.473 0 012.084-2.083l4.111 4.112 6.82-8.69a.486.486 0 01.04-.045z"></path></svg>
        </div>
        <div class="task-main-completed">
            <div class="task-title">${task.title}</div>
            <div class="task-meta-completed">
                <span class="folder-tag-completed">${folderName}</span>
                <span class="completion-date">${completionDate}</span>
            </div>
        </div>
    `;
    return card;
}

// --- 5. Statistics Calculation ---
function calculateCurrentStreak(tasks) {
    if (tasks.length === 0) return 0;

    const completedDates = [...new Set(tasks
        .map(t => t.completedAt && t.completedAt.toDate().setHours(0, 0, 0, 0))
        .filter(d => d))
    ].sort((a, b) => b - a);

    if (completedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today).setDate(new Date(today).getDate() - 1);

    if (completedDates[0] === today || completedDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < completedDates.length; i++) {
            const expectedPreviousDay = new Date(completedDates[i - 1]).setDate(new Date(completedDates[i - 1]).getDate() - 1);
            if (completedDates[i] === expectedPreviousDay) {
                streak++;
            } else {
                break;
            }
        }
    }

    return streak;
}

// --- 6. UI Updates & Event Listeners ---
async function updateSummaryStats(tasks) {
    const totalCompleted = tasks.length;
    
    const totalEl = document.getElementById('total-completed');
    if (totalEl) {
        totalEl.textContent = totalCompleted;
        gsap.fromTo(totalEl, { innerText: 0 }, { innerText: totalCompleted, duration: 1, snap: 'innerText' });
    }

    const streak = calculateCurrentStreak(tasks);
    document.getElementById('current-streak').textContent = `${streak} Days`;

    const labels = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const data = labels.map(label => {
        return tasks.filter(t => {
            if (!t.completedAt || !t.completedAt.toDate) return false;
            const completedDate = t.completedAt.toDate();
            return completedDate.toLocaleDateString('en-US', { weekday: 'short' }) === label;
        }).length;
    });

    const ctx = document.getElementById('completed-chart').getContext('2d');
    if(window.completedChart instanceof Chart) {
        window.completedChart.destroy();
    }
    window.completedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks Completed',
                data: data,
                backgroundColor: '#a9cffc',
                borderColor: '#4A90E2',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, suggestedMax: 10 } },
            plugins: { legend: { display: false } }
        }
    });
}

function setupEventListeners() {
    const filterTabs = document.querySelector('.filter-tabs');
    if (filterTabs) {
        filterTabs.addEventListener('click', e => {
            if (e.target.classList.contains('filter-tab') && !e.target.classList.contains('active')) {
                document.querySelector('.filter-tab.active').classList.remove('active');
                e.target.classList.add('active');
                renderGroupedTasks(e.target.dataset.group);
            }
        });
    }
}