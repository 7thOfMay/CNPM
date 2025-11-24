const API_BASE_URL = 'http://localhost:3000/api';
const AI_SERVICE_URL = 'http://localhost:5000/api';

// State management
let currentUser = null;
let authToken = null;
let allCourses = [];
let currentChatRoom = null;
let chatRefreshInterval = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadUserFromStorage();
    loadCourses();
    checkSystemHealth();
    setupEventListeners();
    updateAuthUI();
    
    // Auto-redirect to dashboard if logged in
    if (currentUser) {
        redirectToRoleDashboard();
    }
});

// Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('href').substring(1);
            navigateToSection(section);
        });
    });

    // Registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Tutor form
    const tutorForm = document.getElementById('tutorForm');
    if (tutorForm) {
        tutorForm.addEventListener('submit', handleTutorQuestion);
    }

    // Create course form
    const createCourseForm = document.getElementById('createCourseForm');
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', handleCreateCourse);
    }

    // Quick tutor form (student dashboard)
    const quickTutorForm = document.getElementById('quickTutorForm');
    if (quickTutorForm) {
        quickTutorForm.addEventListener('submit', handleQuickTutorQuestion);
    }
    
    // Chat event listeners
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', openNewChatModal);
    }
    
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', closeNewChatModal);
    }
    
    const chatMessageForm = document.getElementById('chatMessageForm');
    if (chatMessageForm) {
        chatMessageForm.addEventListener('submit', sendChatMessage);
    }
}

// Authentication
function loadUserFromStorage() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
    }
}

function saveUserToStorage(user, token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    authToken = token;
    currentUser = user;
}

function clearUserFromStorage() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
}

function updateAuthUI() {
    const logoutBtn = document.getElementById('logoutBtn');
    const studentDashLink = document.getElementById('studentDashLink');
    const tutorDashLink = document.getElementById('tutorDashLink');
    const adminDashLink = document.getElementById('adminDashLink');
    const chatLink = document.getElementById('chatLink');
    const notificationsLink = document.getElementById('notificationsLink');
    
    if (currentUser) {
        logoutBtn.classList.remove('hidden');
        chatLink.classList.remove('hidden');
        notificationsLink.classList.remove('hidden');
        
        // Show role-specific dashboard link only
        if (currentUser.role === 'student') {
            studentDashLink.classList.remove('hidden');
            tutorDashLink.classList.add('hidden');
            adminDashLink.classList.add('hidden');
        } else if (currentUser.role === 'tutor') {
            studentDashLink.classList.add('hidden');
            tutorDashLink.classList.remove('hidden');
            adminDashLink.classList.add('hidden');
        } else if (currentUser.role === 'admin') {
            studentDashLink.classList.add('hidden');
            tutorDashLink.classList.add('hidden');
            adminDashLink.classList.remove('hidden');
        }
        
        // Start checking for unread messages and notifications
        checkUnreadMessages();
        loadNotifications();
        if (!chatRefreshInterval) {
            chatRefreshInterval = setInterval(() => {
                checkUnreadMessages();
                loadNotifications();
            }, 10000);
        }
    } else {
        logoutBtn.classList.add('hidden');
        studentDashLink.classList.add('hidden');
        tutorDashLink.classList.add('hidden');
        adminDashLink.classList.add('hidden');
        chatLink.classList.add('hidden');
        notificationsLink.classList.add('hidden');
        
        if (chatRefreshInterval) {
            clearInterval(chatRefreshInterval);
            chatRefreshInterval = null;
        }
    }
}

function getAuthHeaders() {
    if (authToken) {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };
    }
    return { 'Content-Type': 'application/json' };
}

// SSO Login Handler
async function loginWithSSO() {
    try {
        // Step 1: Initiate SSO
        const initiateResponse = await fetch(`${API_BASE_URL}/auth/sso/initiate?redirect_uri=${window.location.origin}`);
        const initiateData = await initiateResponse.json();
        
        // Mock: Show dialog to simulate SSO login (in production, would redirect to HCMUT_SSO)
        const mockEmail = prompt('Mock HCMUT SSO Login\n\nEnter your HCMUT email (or leave blank for random):', 'student@hcmut.edu.vn');
        
        if (mockEmail === null) {
            // User cancelled
            return;
        }
        
        // Step 2: Exchange SSO token for JWT
        const callbackResponse = await fetch(`${API_BASE_URL}/auth/sso/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sso_token: initiateData.sso_token,
                email: mockEmail || undefined
            })
        });
        
        const callbackData = await callbackResponse.json();
        
        if (callbackResponse.ok) {
            // Store token and user info
            saveUserToStorage(callbackData.user, callbackData.token);
            updateAuthUI();
            
            showMessage('loginMessage', `Welcome ${callbackData.user.username}! SSO login successful.`, 'success');
            
            // Navigate to appropriate dashboard
            setTimeout(() => {
                redirectToRoleDashboard();
            }, 1000);
        } else {
            showMessage('loginMessage', callbackData.error || 'SSO authentication failed', 'error');
        }
    } catch (error) {
        console.error('SSO login error:', error);
        showMessage('loginMessage', 'SSO login failed. Please try again.', 'error');
    }
}

// User Registration
async function handleRegistration(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            saveUserToStorage(data.user, data.token);
            updateAuthUI();
            showMessage('registerMessage', 'Registration successful!', 'success');
            setTimeout(() => {
                redirectToRoleDashboard();
            }, 1500);
        } else {
            showMessage('registerMessage', data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('registerMessage', 'Network error. Please try again.', 'error');
    }
}

// User Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            saveUserToStorage(data.user, data.token);
            updateAuthUI();
            showMessage('loginMessage', 'Login successful!', 'success');
            setTimeout(() => {
                redirectToRoleDashboard();
            }, 1500);
        } else {
            showMessage('loginMessage', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Network error. Please try again.', 'error');
    }
}

// User Logout
function handleLogout() {
    clearUserFromStorage();
    updateAuthUI();
    navigateToSection('home');
    alert('Logged out successfully');
}

// Redirect to role-specific dashboard
function redirectToRoleDashboard() {
    if (!currentUser) {
        navigateToSection('home');
        return;
    }
    
    if (currentUser.role === 'student') {
        navigateToSection('student-dashboard');
    } else if (currentUser.role === 'tutor') {
        navigateToSection('tutor-dashboard');
    } else if (currentUser.role === 'admin') {
        navigateToSection('admin');
    } else {
        navigateToSection('home');
    }
}

// Student Dashboard Functions
function loadStudentDashboard() {
    const welcomeEl = document.getElementById('studentWelcome');
    if (currentUser) {
        welcomeEl.textContent = `Welcome back, ${currentUser.username}!`;
    }
    loadStudentCourses();
    loadEnrolledCourses();
    loadStudentSchedule();
    loadNotifications();
    loadStudentResources();
}

async function loadStudentCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/courses`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        allCourses = data.courses || [];
        displayStudentCourses(allCourses);
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
}

function displayStudentCourses(courses) {
    const coursesList = document.getElementById('studentCoursesList');
    
    if (courses.length === 0) {
        coursesList.innerHTML = '<p>No courses available.</p>';
        return;
    }
    
    coursesList.innerHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-card-header ${course.subject}"></div>
            <div class="course-card-body">
                <h3>${course.title}</h3>
                <p>Subject: ${course.subject}</p>
                <span class="course-badge">${course.level}</span>
                <span class="course-badge">Enrolled: ${course.enrolled}</span>
                <button class="btn btn-primary" onclick="enrollCourse(${course.id})" style="margin-top: 1rem; width: 100%;">
                    Enroll Now
                </button>
            </div>
        </div>
    `).join('');
}

function filterStudentCourses() {
    const subject = document.getElementById('studentSubjectFilter').value;
    const level = document.getElementById('studentLevelFilter').value;
    
    let filtered = allCourses;
    
    if (subject) {
        filtered = filtered.filter(c => c.subject === subject);
    }
    if (level) {
        filtered = filtered.filter(c => c.level === level);
    }
    
    displayStudentCourses(filtered);
}

function loadEnrolledCourses() {
    const enrolledList = document.getElementById('myEnrolledCourses');
    enrolledList.innerHTML = '<p>Your enrolled courses will appear here after enrollment.</p>';
}

// Tutor - Create Course
async function handleCreateCourse(e) {
    e.preventDefault();
    
    const title = document.getElementById('courseTitle').value;
    const subject = document.getElementById('courseSubject').value;
    const level = document.getElementById('courseLevel').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/tutor/courses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, subject, level })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('createCourseMessage', 'Course created successfully!', 'success');
            document.getElementById('createCourseForm').reset();
            loadTutorCourses();
            loadCourses();
        } else {
            showMessage('createCourseMessage', data.error || 'Failed to create course', 'error');
        }
    } catch (error) {
        showMessage('createCourseMessage', 'Network error. Please try again.', 'error');
    }
}

function loadTutorDashboard() {
    loadTutorCourses();
    setupCreateSessionForm();
    loadTutorSessions();
    loadTutorProgress();
    loadNotifications();
    setupCreateResourceForm();
    loadTutorResources();
}

async function loadTutorCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/tutor/courses`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const tutorCoursesList = document.getElementById('tutorCoursesList');
        if (data.courses && data.courses.length > 0) {
            tutorCoursesList.innerHTML = data.courses.map(course => `
                <div class="course-card">
                    <div class="course-card-header ${course.subject}"></div>
                    <div class="course-card-body">
                        <h3>${course.title}</h3>
                        <p>Subject: ${course.subject}</p>
                        <span class="course-badge">${course.level}</span>
                        <span class="course-badge">Enrolled: ${course.enrolled}</span>
                    </div>
                </div>
            `).join('');
        } else {
            tutorCoursesList.innerHTML = '<p>You haven\'t created any courses yet.</p>';
        }
    } catch (error) {
        console.error('Failed to load tutor courses:', error);
    }
}

// Admin Functions
function loadAdminDashboard() {
    loadAdminStats();
    loadAllUsers();
}

async function loadAdminStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        // Update metric cards with enhanced data
        document.getElementById('totalSessions').textContent = data.totalSessions || 0;
        document.getElementById('avgRating').textContent = data.avgRating || 'N/A';
        document.getElementById('completionRate').textContent = data.completionRate || 0;
        document.getElementById('activeUsers').textContent = data.activeUsers || 0;
        
        const adminStats = document.getElementById('adminStats');
        adminStats.innerHTML = `
            <div class="stat-card">
                <h3>${data.totalUsers}</h3>
                <p>Total Users</p>
            </div>
            <div class="stat-card">
                <h3>${data.totalCourses}</h3>
                <p>Total Courses</p>
            </div>
            <div class="stat-card">
                <h3>${data.usersByRole.students}</h3>
                <p>Students</p>
            </div>
            <div class="stat-card">
                <h3>${data.usersByRole.tutors}</h3>
                <p>Tutors</p>
            </div>
            <div class="stat-card">
                <h3>${data.totalEnrollments}</h3>
                <p>Total Enrollments</p>
            </div>
            <div class="stat-card">
                <h3>${data.totalResources || 0}</h3>
                <p>Resources</p>
            </div>
            <div class="stat-card">
                <h3>${data.emailsSent || 0}</h3>
                <p>Emails Sent</p>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load admin stats:', error);
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const usersList = document.getElementById('usersList');
        if (data.users && data.users.length > 0) {
            usersList.innerHTML = `
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.username}</td>
                                <td>${user.email}</td>
                                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                                <td>
                                    ${user.role !== 'admin' ? `<button class="btn btn-small" onclick="deleteUser(${user.id})">Delete</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            usersList.innerHTML = '<p>No users found.</p>';
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            alert('User deleted successfully');
            loadAllUsers();
            loadAdminStats();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete user');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// Navigation
function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Load data for specific sections
    if (sectionId === 'student-dashboard' && currentUser && currentUser.role === 'student') {
        loadStudentDashboard();
    } else if (sectionId === 'tutor-dashboard' && currentUser && currentUser.role === 'tutor') {
        loadTutorDashboard();
    } else if (sectionId === 'admin' && currentUser && currentUser.role === 'admin') {
        loadAdminDashboard();
    } else if (sectionId === 'chat' && currentUser) {
        loadChatSection();
    }

    // Update active nav link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

function showSection(sectionId) {
    navigateToSection(sectionId);
}

// Courses
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/courses`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        allCourses = data.courses || [];
        displayCourses(allCourses);
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
}

function displayCourses(courses) {
    const coursesList = document.getElementById('coursesList');
    
    if (courses.length === 0) {
        coursesList.innerHTML = '<p>No courses available.</p>';
        return;
    }
    
    const isStudent = currentUser && currentUser.role === 'student';
    
    coursesList.innerHTML = courses.map(course => `
        <div class="course-card">
            <div class="course-card-header ${course.subject}"></div>
            <div class="course-card-body">
                <h3>${course.title}</h3>
                <p>Subject: ${course.subject}</p>
                <span class="course-badge">${course.level}</span>
                <span class="course-badge">Enrolled: ${course.enrolled}</span>
                ${isStudent ? `
                    <button class="btn btn-primary" onclick="enrollCourse(${course.id})" style="margin-top: 1rem; width: 100%;">
                        Enroll Now
                    </button>
                ` : `
                    <button class="btn btn-secondary" disabled style="margin-top: 1rem; width: 100%;">
                        Students Only
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

function filterCourses() {
    const subject = document.getElementById('subjectFilter').value;
    const level = document.getElementById('levelFilter').value;
    
    let filtered = allCourses;
    
    if (subject) {
        filtered = filtered.filter(c => c.subject === subject);
    }
    if (level) {
        filtered = filtered.filter(c => c.level === level);
    }
    
    displayCourses(filtered);
}

async function enrollCourse(courseId) {
    if (!currentUser) {
        alert('Please login first!');
        navigateToSection('login');
        return;
    }
    
    if (currentUser.role !== 'student') {
        alert('Only students can enroll in courses!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Successfully enrolled! You can now chat with the course tutor.');
            loadCourses();
            if (window.location.hash === '#student-dashboard') {
                loadStudentDashboard();
            }
        } else {
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                handleLogout();
            } else if (response.status === 403) {
                alert('Only students can enroll in courses!');
            } else if (response.status === 400) {
                alert(data.error || 'Enrollment failed');
            } else {
                alert(data.error || 'Enrollment failed');
            }
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// AI Tutor
async function handleTutorQuestion(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login to use AI Tutor!');
        navigateToSection('login');
        return;
    }
    
    if (currentUser.role !== 'student') {
        alert('Only students can use the AI Tutor!');
        return;
    }
    
    const question = document.getElementById('question').value;
    const subject = document.getElementById('subject').value;
    
    // Display user message
    addChatMessage('user', question);
    
    // Clear input
    document.getElementById('question').value = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/tutoring/ask`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ question, subject })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            addChatMessage('ai', data.answer);
        } else {
            if (response.status === 401) {
                addChatMessage('ai', 'Session expired. Please login again.');
                handleLogout();
            } else if (response.status === 403) {
                addChatMessage('ai', 'Only students can use the AI Tutor!');
            } else {
                addChatMessage('ai', 'Sorry, I encountered an error. Please try again.');
            }
        }
    } catch (error) {
        addChatMessage('ai', 'Network error. Please check your connection.');
    }
}

function addChatMessage(type, message) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = message;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Quick AI Tutor for Student Dashboard
async function handleQuickTutorQuestion(e) {
    e.preventDefault();
    
    const question = document.getElementById('quickQuestion').value;
    const subject = document.getElementById('quickSubject').value;
    
    // Display user message
    addQuickChatMessage('user', question);
    
    // Clear input
    document.getElementById('quickQuestion').value = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/tutoring/ask`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ question, subject })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            addQuickChatMessage('ai', data.answer);
        } else {
            if (response.status === 401) {
                addQuickChatMessage('ai', 'Session expired. Please login again.');
                handleLogout();
            } else {
                addQuickChatMessage('ai', 'Sorry, I encountered an error. Please try again.');
            }
        }
    } catch (error) {
        addQuickChatMessage('ai', 'Network error. Please check your connection.');
    }
}

function addQuickChatMessage(type, message) {
    const chatHistory = document.getElementById('quickChatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    messageDiv.textContent = message;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// System Health
async function checkSystemHealth() {
    const healthStatus = document.getElementById('healthStatus');
    
    const services = [
        { name: 'Backend', url: 'http://localhost:3000/health' },
        { name: 'AI Service', url: 'http://localhost:5000/health' }
    ];
    
    const statusHTML = await Promise.all(services.map(async (service) => {
        try {
            const response = await fetch(service.url);
            const data = await response.json();
            const status = response.ok ? 'healthy' : 'unhealthy';
            
            return `
                <div class="status-card ${status}">
                    <h4>${service.name}</h4>
                    <p>Status: ${data.status}</p>
                    <small>${data.timestamp}</small>
                </div>
            `;
        } catch (error) {
            return `
                <div class="status-card unhealthy">
                    <h4>${service.name}</h4>
                    <p>Status: Offline</p>
                    <small>Cannot connect</small>
                </div>
            `;
        }
    }));
    
    healthStatus.innerHTML = statusHTML.join('');
}

// Utility Functions
function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
}

// Chat Functions
async function loadChatSection() {
    await loadChatRooms();
}

async function loadChatRooms() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/rooms`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const roomsList = document.getElementById('chatRoomsList');
        if (data.rooms && data.rooms.length > 0) {
            roomsList.innerHTML = data.rooms.map(room => `
                <div class="chat-room-item" onclick="openChatRoom(${room.id}, ${room.otherUser.id}, '${room.otherUser.username}', '${room.otherUser.role}')">
                    <div class="chat-room-avatar">${room.otherUser.username[0].toUpperCase()}</div>
                    <div class="chat-room-info">
                        <div class="chat-room-name">${room.otherUser.username}</div>
                        <div class="chat-room-role">${room.otherUser.role}</div>
                        ${room.lastMessage ? `<div class="chat-room-last">${room.lastMessage.content.substring(0, 30)}...</div>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            roomsList.innerHTML = '<p style="padding: 1rem; text-align: center;">No conversations yet</p>';
        }
    } catch (error) {
        console.error('Failed to load chat rooms:', error);
    }
}

async function openNewChatModal() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/users`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const modal = document.getElementById('newChatModal');
        const usersList = document.getElementById('availableUsersList');
        
        if (data.users && data.users.length > 0) {
            usersList.innerHTML = data.users.map(user => `
                <div class="user-item-modal" onclick="startChatWith(${user.id}, '${user.username}', '${user.role}')">
                    <div class="user-avatar">${user.username[0].toUpperCase()}</div>
                    <div class="user-info">
                        <div class="user-name">${user.username}</div>
                        <div class="user-role-badge ${user.role}">${user.role}</div>
                    </div>
                </div>
            `).join('');
        } else {
            if (currentUser.role === 'student') {
                usersList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No tutors available. Please enroll in a course first to chat with tutors.</p>';
            } else if (currentUser.role === 'tutor') {
                usersList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No students yet. Students will appear here when they enroll in your courses.</p>';
            } else {
                usersList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No users available</p>';
            }
        }
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function closeNewChatModal() {
    document.getElementById('newChatModal').classList.add('hidden');
}

async function startChatWith(userId, username, role) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/room`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userId })
        });
        const data = await response.json();
        
        if (response.ok) {
            closeNewChatModal();
            await loadChatRooms();
            openChatRoom(data.room.id, userId, username, role);
        } else {
            console.error('Failed to create chat:', data);
        }
    } catch (error) {
        console.error('Failed to create chat room:', error);
    }
}

async function openChatRoom(roomId, userId, username, role) {
    currentChatRoom = roomId;
    
    const chatHeader = document.getElementById('chatHeader');
    chatHeader.innerHTML = `
        <div class="chat-header-user">
            <div class="chat-avatar">${username[0].toUpperCase()}</div>
            <div>
                <div class="chat-username">${username}</div>
                <div class="chat-user-role">${role}</div>
            </div>
        </div>
    `;
    
    document.getElementById('chatInputArea').classList.remove('hidden');
    
    await loadChatMessages(roomId);
}

async function loadChatMessages(roomId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/messages/${roomId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const messagesArea = document.getElementById('chatMessagesArea');
        if (data.messages && data.messages.length > 0) {
            messagesArea.innerHTML = data.messages.map(msg => {
                const isOwn = msg.senderId === currentUser.id;
                return `
                    <div class="chat-message-item ${isOwn ? 'own' : 'other'}">
                        <div class="message-content">${msg.content}</div>
                        <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString()}</div>
                    </div>
                `;
            }).join('');
        } else {
            messagesArea.innerHTML = '<p style="text-align: center; padding: 2rem;">No messages yet. Start the conversation!</p>';
        }
        
        messagesArea.scrollTop = messagesArea.scrollHeight;
        checkUnreadMessages();
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

async function sendChatMessage(e) {
    e.preventDefault();
    
    if (!currentChatRoom) return;
    
    const input = document.getElementById('chatMessageInput');
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ roomId: currentChatRoom, content })
        });
        
        if (response.ok) {
            input.value = '';
            await loadChatMessages(currentChatRoom);
            await loadChatRooms();
        }
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

async function checkUnreadMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/unread`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const badge = document.getElementById('unreadBadge');
        if (data.unreadCount > 0) {
            badge.textContent = data.unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Failed to check unread messages:', error);
    }
}

// ==================== SCHEDULE MANAGEMENT ====================
async function loadStudentSchedule() {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const scheduleDiv = document.getElementById('studentSchedule');
        if (data.sessions && data.sessions.length > 0) {
            scheduleDiv.innerHTML = data.sessions.map(session => `
                <div class="session-card">
                    <div class="session-header">
                        <div>
                            <div class="session-title">${session.courseName}</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">by ${session.tutorName}</div>
                        </div>
                        <span class="session-status ${session.status}">${session.status}</span>
                    </div>
                    <div class="session-meta">
                        <span>Date: ${session.date}</span>
                        <span>Time: ${session.startTime} - ${session.endTime}</span>
                        <span>Location: ${session.location}</span>
                        <span>Capacity: ${session.bookedStudents.length}/${session.maxStudents}</span>
                    </div>
                    ${session.description ? `<p style="color: var(--text-secondary); margin-bottom: 1rem;">${session.description}</p>` : ''}
                    <div class="session-actions">
                        ${session.bookedStudents.includes(currentUser.id) ? `
                            <button class="btn btn-secondary" onclick="cancelBooking(${session.id})">Cancel Booking</button>
                            <button class="btn btn-primary" onclick="rateSession(${session.id})">Rate Session</button>
                        ` : `
                            <button class="btn btn-primary" onclick="bookSession(${session.id})" ${session.bookedStudents.length >= session.maxStudents ? 'disabled' : ''}>
                                ${session.bookedStudents.length >= session.maxStudents ? 'Fully Booked' : 'Book Session'}
                            </button>
                        `}
                    </div>
                </div>
            `).join('');
        } else {
            scheduleDiv.innerHTML = '<p>No sessions available. Enroll in courses to see available sessions.</p>';
        }
    } catch (error) {
        console.error('Failed to load schedule:', error);
    }
}

async function bookSession(sessionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/book`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (response.ok) {
            alert('Session booked successfully!');
            loadStudentSchedule();
        } else {
            alert(data.error || 'Failed to book session');
        }
    } catch (error) {
        console.error('Failed to book session:', error);
        alert('Network error. Please try again.');
    }
}

async function cancelBooking(sessionId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/book`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            alert('Booking cancelled');
            loadStudentSchedule();
        }
    } catch (error) {
        console.error('Failed to cancel booking:', error);
    }
}

// Tutor - Create Session
async function setupCreateSessionForm() {
    const form = document.getElementById('createSessionForm');
    if (!form) return;
    
    // Load tutor courses into select
    try {
        const response = await fetch(`${API_BASE_URL}/tutor/courses`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const select = document.getElementById('sessionCourse');
        if (data.courses && data.courses.length > 0) {
            select.innerHTML = data.courses.map(c => `
                <option value="${c.id}">${c.title}</option>
            `).join('');
        } else {
            select.innerHTML = '<option value="">Create a course first</option>';
        }
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
    
    form.addEventListener('submit', handleCreateSession);
}

async function handleCreateSession(e) {
    e.preventDefault();
    
    const courseId = document.getElementById('sessionCourse').value;
    const date = document.getElementById('sessionDate').value;
    const startTime = document.getElementById('sessionStartTime').value;
    const endTime = document.getElementById('sessionEndTime').value;
    const maxStudents = document.getElementById('sessionMaxStudents').value;
    const location = document.getElementById('sessionLocation').value;
    const description = document.getElementById('sessionDescription').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ courseId, date, startTime, endTime, maxStudents, location, description })
        });
        const data = await response.json();
        
        if (response.ok) {
            showMessage('createSessionMessage', 'Session created successfully!', 'success');
            document.getElementById('createSessionForm').reset();
            loadTutorSessions();
        } else {
            showMessage('createSessionMessage', data.error || 'Failed to create session', 'error');
        }
    } catch (error) {
        showMessage('createSessionMessage', 'Network error', 'error');
    }
}

async function loadTutorSessions() {
    try {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const sessionsDiv = document.getElementById('tutorSessionsList');
        if (data.sessions && data.sessions.length > 0) {
            sessionsDiv.innerHTML = data.sessions.map(session => `
                <div class="session-card">
                    <div class="session-header">
                        <div>
                            <div class="session-title">${session.courseName}</div>
                        </div>
                        <span class="session-status ${session.status}">${session.status}</span>
                    </div>
                    <div class="session-meta">
                        <span>Date: ${session.date}</span>
                        <span>Time: ${session.startTime} - ${session.endTime}</span>
                        <span>Location: ${session.location}</span>
                        <span>Capacity: ${session.bookedStudents.length}/${session.maxStudents} booked</span>
                    </div>
                    ${session.description ? `<p style="color: var(--text-secondary); margin-bottom: 1rem;">${session.description}</p>` : ''}
                    <div class="session-actions">
                        <button class="btn btn-secondary" onclick="deleteSession(${session.id})">Delete Session</button>
                    </div>
                </div>
            `).join('');
        } else {
            sessionsDiv.innerHTML = '<p>No sessions created yet.</p>';
        }
    } catch (error) {
        console.error('Failed to load sessions:', error);
    }
}

async function deleteSession(sessionId) {
    if (!confirm('Are you sure? This will notify all booked students.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            alert('Session deleted');
            loadTutorSessions();
        }
    } catch (error) {
        console.error('Failed to delete session:', error);
    }
}

// ==================== RATING & FEEDBACK ====================
function rateSession(sessionId) {
    const rating = prompt('Rate this session (1-5 stars):');
    if (!rating || rating < 1 || rating > 5) return;
    
    const feedback = prompt('Optional feedback:');
    
    submitRating(sessionId, parseInt(rating), feedback);
}

async function submitRating(sessionId, rating, feedback) {
    try {
        const response = await fetch(`${API_BASE_URL}/ratings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ sessionId, rating, feedback })
        });
        const data = await response.json();
        
        if (response.ok) {
            alert('Thank you for your feedback!');
            loadStudentSchedule();
        } else {
            alert(data.error || 'Failed to submit rating');
        }
    } catch (error) {
        console.error('Failed to submit rating:', error);
    }
}

async function loadTutorProgress() {
    try {
        const response = await fetch(`${API_BASE_URL}/tutor/courses`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const progressDiv = document.getElementById('tutorProgressView');
        if (!data.courses || data.courses.length === 0) {
            progressDiv.innerHTML = '<p>No courses yet.</p>';
            return;
        }
        
        let html = '';
        for (const course of data.courses) {
            const progressResponse = await fetch(`${API_BASE_URL}/progress/course/${course.id}`, {
                headers: getAuthHeaders()
            });
            const progressData = await progressResponse.json();
            
            html += `
                <div style="margin-bottom: 2rem;">
                    <h4 style="margin-bottom: 1rem;">${course.title}</h4>
                    ${progressData.students && progressData.students.length > 0 ? `
                        <table class="progress-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Sessions</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${progressData.students.map(s => {
                                    const percent = s.totalSessions > 0 ? (s.completedSessions / s.totalSessions * 100).toFixed(0) : 0;
                                    return `
                                        <tr>
                                            <td>${s.studentName}</td>
                                            <td>${s.completedSessions} / ${s.totalSessions}</td>
                                            <td>
                                                <div class="progress-bar">
                                                    <div class="progress-fill" style="width: ${percent}%"></div>
                                                </div>
                                                <span style="font-size: 0.85rem; color: var(--text-secondary);">${percent}%</span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : '<p style="color: var(--text-secondary);">No student progress yet.</p>'}
                </div>
            `;
        }
        progressDiv.innerHTML = html;
    } catch (error) {
        console.error('Failed to load progress:', error);
    }
}

// ==================== NOTIFICATIONS ====================
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const badge = document.getElementById('notificationBadge');
        if (data.unreadCount > 0) {
            badge.textContent = data.unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
        
        const listDiv = document.getElementById('notificationsList');
        if (data.notifications && data.notifications.length > 0) {
            listDiv.innerHTML = data.notifications.map(n => `
                <div class="notification-item ${n.read ? '' : 'unread'}" onclick="markNotificationRead(${n.id})">
                    <div class="notification-header">
                        <div class="notification-title">${n.title}</div>
                        <div class="notification-time">${new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    <div class="notification-message">${n.message}</div>
                </div>
            `).join('');
        } else {
            listDiv.innerHTML = '<p>No notifications</p>';
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

async function markNotificationRead(notificationId) {
    try {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        loadNotifications();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function markAllNotificationsRead() {
    try {
        await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        loadNotifications();
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    }
}

// ==================== AI TUTOR MATCHING ====================
async function loadRecommendedTutors() {
    const subject = document.getElementById('matchSubjectFilter').value;
    const level = document.getElementById('matchLevelFilter').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/match/tutors?subject=${subject}&level=${level}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const listDiv = document.getElementById('recommendedTutorsList');
        if (data.tutors && data.tutors.length > 0) {
            listDiv.innerHTML = data.tutors.map(tutor => `
                <div class="tutor-card">
                    <div class="tutor-header">
                        <div class="tutor-info">
                            <h4>${tutor.tutorName}</h4>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">${tutor.tutorEmail}</p>
                            ${tutor.totalRatings > 0 ? `
                                <div class="tutor-rating">
                                    <span>Rating: ${tutor.averageRating}</span>
                                    <span style="color: var(--text-secondary); font-weight: normal;">(${tutor.totalRatings} reviews)</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="match-score">
                            Match: ${tutor.matchScore}%
                        </div>
                    </div>
                    ${tutor.courses && tutor.courses.length > 0 ? `
                        <div class="tutor-courses">
                            ${tutor.courses.map(c => `
                                <span class="course-badge">${c.subject} - ${c.level}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } else {
            listDiv.innerHTML = '<p>No tutors found matching your criteria.</p>';
        }
    } catch (error) {
        console.error('Failed to load recommended tutors:', error);
    }
}

// Check notifications periodically
setInterval(() => {
    if (currentUser) {
        loadNotifications();
    }
}, 30000);

// Calendar View State
let calendarViewVisible = false;
let currentCalendarMonth = new Date();

// ==================== CALENDAR VIEW ====================
function toggleCalendarView() {
    calendarViewVisible = !calendarViewVisible;
    const calendarDiv = document.getElementById('calendarView');
    const scheduleDiv = document.getElementById('studentSchedule');
    const toggleText = document.getElementById('viewToggleText');
    
    if (calendarViewVisible) {
        calendarDiv.classList.remove('hidden');
        scheduleDiv.classList.add('hidden');
        toggleText.textContent = 'List View';
        renderCalendar();
    } else {
        calendarDiv.classList.add('hidden');
        scheduleDiv.classList.remove('hidden');
        toggleText.textContent = 'Calendar View';
    }
}

async function renderCalendar() {
    const calendarDiv = document.getElementById('calendarView');
    
    // Get sessions data
    let sessionsData = [];
    try {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        sessionsData = data.sessions || [];
    } catch (error) {
        console.error('Failed to load sessions for calendar:', error);
    }
    
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get previous month's last days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let html = `
        <div class="calendar-header">
            <div class="calendar-nav">
                <button onclick="previousMonth()">◀ Prev</button>
                <button onclick="goToToday()">Today</button>
                <button onclick="nextMonth()">Next ▶</button>
            </div>
            <div class="calendar-month">${monthNames[month]} ${year}</div>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-header">Sun</div>
            <div class="calendar-day-header">Mon</div>
            <div class="calendar-day-header">Tue</div>
            <div class="calendar-day-header">Wed</div>
            <div class="calendar-day-header">Thu</div>
            <div class="calendar-day-header">Fri</div>
            <div class="calendar-day-header">Sat</div>
    `;
    
    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-day other-month"><div class="calendar-day-number">${day}</div></div>`;
    }
    
    // Add current month's days
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = (day === todayDate && month === todayMonth && year === todayYear);
        
        // Find sessions for this day
        const daySessions = sessionsData.filter(s => s.date === dateStr);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="viewDaySessions('${dateStr}')">
                <div class="calendar-day-number">${day}</div>
                ${daySessions.map(session => {
                    const isBooked = session.bookedStudents && session.bookedStudents.includes(currentUser.id);
                    return `<div class="calendar-event ${isBooked ? 'booked' : ''}" title="${session.courseName} - ${session.startTime}">${session.startTime} ${session.courseName}</div>`;
                }).join('')}
            </div>
        `;
    }
    
    // Add next month's days
    const remainingDays = 42 - (startingDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        html += `<div class="calendar-day other-month"><div class="calendar-day-number">${day}</div></div>`;
    }
    
    html += '</div>';
    calendarDiv.innerHTML = html;
}

function previousMonth() {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    currentCalendarMonth = new Date();
    renderCalendar();
}

function viewDaySessions(dateStr) {
    alert(`View sessions for ${dateStr}`);
    // Could open a modal with detailed sessions for this day
}

// ==================== RESOURCE MANAGEMENT ====================
// Student - Load resources
async function loadStudentResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/resources`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const listDiv = document.getElementById('studentResourcesList');
        if (data.resources && data.resources.length > 0) {
            listDiv.innerHTML = data.resources.map(resource => renderResourceItem(resource, false)).join('');
        } else {
            listDiv.innerHTML = '<p>No resources available yet.</p>';
        }
    } catch (error) {
        console.error('Failed to load resources:', error);
    }
}

// Tutor - Setup resource form
async function setupCreateResourceForm() {
    const form = document.getElementById('createResourceForm');
    if (!form) return;
    
    // Load courses into select
    try {
        const response = await fetch(`${API_BASE_URL}/tutor/courses`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const select = document.getElementById('resourceCourse');
        let html = '<option value="">Public (All users)</option>';
        if (data.courses && data.courses.length > 0) {
            html += data.courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        select.innerHTML = html;
    } catch (error) {
        console.error('Failed to load courses:', error);
    }
    
    form.addEventListener('submit', handleCreateResource);
}

async function handleCreateResource(e) {
    e.preventDefault();
    
    const courseId = document.getElementById('resourceCourse').value;
    const title = document.getElementById('resourceTitle').value;
    const type = document.getElementById('resourceType').value;
    const url = document.getElementById('resourceUrl').value;
    const description = document.getElementById('resourceDescription').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/resources`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, type, url, description, courseId: courseId || null })
        });
        const data = await response.json();
        
        if (response.ok) {
            showMessage('createResourceMessage', 'Resource added successfully!', 'success');
            document.getElementById('createResourceForm').reset();
            loadTutorResources();
        } else {
            showMessage('createResourceMessage', data.error || 'Failed to add resource', 'error');
        }
    } catch (error) {
        showMessage('createResourceMessage', 'Network error', 'error');
    }
}

async function loadTutorResources() {
    try {
        const response = await fetch(`${API_BASE_URL}/resources`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const listDiv = document.getElementById('tutorResourcesList');
        if (data.resources && data.resources.length > 0) {
            listDiv.innerHTML = data.resources.map(resource => renderResourceItem(resource, true)).join('');
        } else {
            listDiv.innerHTML = '<p>No resources added yet.</p>';
        }
    } catch (error) {
        console.error('Failed to load resources:', error);
    }
}

function renderResourceItem(resource, showActions) {
    const icons = {
        pdf: 'PDF',
        video: 'VIDEO',
        link: 'LINK',
        document: 'DOC'
    };
    
    return `
        <div class="resource-item">
            <div class="resource-info">
                <div class="resource-icon">${icons[resource.type] || 'FILE'}</div>
                <div class="resource-details">
                    <h4>${resource.title}</h4>
                    <p>${resource.description || 'No description'} • Uploaded by ${resource.uploaderName} (${resource.uploaderRole})</p>
                </div>
            </div>
            <div class="resource-actions">
                ${resource.url ? `<a href="${resource.url}" target="_blank" class="btn btn-primary">Open</a>` : ''}
                ${showActions ? `<button class="btn btn-secondary" onclick="deleteResource(${resource.id})">Delete</button>` : ''}
            </div>
        </div>
    `;
}

async function deleteResource(resourceId) {
    if (!confirm('Delete this resource?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            loadTutorResources();
        }
    } catch (error) {
        console.error('Failed to delete resource:', error);
    }
}

// Refresh health status periodically
setInterval(checkSystemHealth, 30000);

