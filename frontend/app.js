const API_BASE_URL = 'http://localhost:3000/api';
const AI_SERVICE_URL = 'http://localhost:5000/api';

// State management
let currentUser = null;
let authToken = null;
let allCourses = [];

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
    
    if (currentUser) {
        logoutBtn.classList.remove('hidden');
        
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
    } else {
        logoutBtn.classList.add('hidden');
        studentDashLink.classList.add('hidden');
        tutorDashLink.classList.add('hidden');
        adminDashLink.classList.add('hidden');
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
            <h3>${course.title}</h3>
            <p>Subject: ${course.subject}</p>
            <span class="course-badge">${course.level}</span>
            <p style="margin-top: 1rem;">Enrolled: ${course.enrolled} students</p>
            <button class="btn btn-primary" onclick="enrollCourse(${course.id})" style="margin-top: 1rem;">
                Enroll Now
            </button>
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
                    <h3>${course.title}</h3>
                    <p>Subject: ${course.subject}</p>
                    <p>Level: ${course.level}</p>
                    <p>Enrolled: ${course.enrolled} students</p>
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
            <h3>${course.title}</h3>
            <p>Subject: ${course.subject}</p>
            <span class="course-badge">${course.level}</span>
            <p style="margin-top: 1rem;">Enrolled: ${course.enrolled} students</p>
            ${isStudent ? `
                <button class="btn btn-primary" onclick="enrollCourse(${course.id})" style="margin-top: 1rem;">
                    Enroll Now
                </button>
            ` : `
                <button class="btn btn-secondary" disabled style="margin-top: 1rem;">
                    Students Only
                </button>
            `}
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
            alert('Successfully enrolled!');
            loadCourses();
        } else {
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                handleLogout();
            } else if (response.status === 403) {
                alert('Only students can enroll in courses!');
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

// Refresh health status periodically
setInterval(checkSystemHealth, 30000);
