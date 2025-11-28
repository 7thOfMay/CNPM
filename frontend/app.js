const API_BASE_URL = 'http://localhost:3000/api';

// State management
let currentUser = null;
let authToken = null;
let allCourses = [];
let currentChatRoom = null;
let chatRefreshInterval = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadUserFromStorage();
    
    // Only load courses if we are on a page that needs them
    if (document.getElementById('coursesList') || document.getElementById('studentCoursesList')) {
        loadCourses();
    }
    
    checkSystemHealth();
    setupEventListeners();
    updateAuthUI();
    
    // Auto-redirect logic is now handled by individual pages
});

// Event Listeners
function setupEventListeners() {
    // Navigation - Only for index.html SPA-like sections if they exist
    // We removed the global nav listener to avoid conflicts with dashboard tabs

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

    // Create course form
    const createCourseForm = document.getElementById('createCourseForm');
    if (createCourseForm) {
        createCourseForm.addEventListener('submit', handleCreateCourse);
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
    try {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        
        if (token && token !== 'undefined' && token !== 'null' && user) {
            authToken = token;
            currentUser = JSON.parse(user);
        } else {
            // If either is missing, clear both to ensure consistent state
            console.warn('Invalid storage state, clearing...');
            clearUserFromStorage();
        }
    } catch (error) {
        console.error('Error loading user from storage:', error);
        clearUserFromStorage();
    }
}

function saveUserToStorage(user, token) {
    if (!token || token === 'undefined' || token === 'null') {
        console.error('Attempted to save invalid token:', token);
        return;
    }
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
    const libraryLink = document.getElementById('libraryLink');
    const forumLink = document.getElementById('forumLink');
    const getStartedBtn = document.getElementById('getStartedBtn');
    
    if (currentUser) {
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (chatLink) chatLink.classList.remove('hidden');
        if (notificationsLink) notificationsLink.classList.remove('hidden');
        if (libraryLink) libraryLink.classList.remove('hidden');
        if (forumLink) forumLink.classList.remove('hidden');
        if (getStartedBtn) getStartedBtn.classList.add('hidden');
        
        // Show role-specific dashboard link only
        if (currentUser.role === 'student') {
            if (studentDashLink) studentDashLink.classList.remove('hidden');
            if (tutorDashLink) tutorDashLink.classList.add('hidden');
            if (adminDashLink) adminDashLink.classList.add('hidden');
        } else if (currentUser.role === 'tutor') {
            if (studentDashLink) studentDashLink.classList.add('hidden');
            if (tutorDashLink) tutorDashLink.classList.remove('hidden');
            if (adminDashLink) adminDashLink.classList.add('hidden');
        } else if (currentUser.role === 'admin') {
            if (studentDashLink) studentDashLink.classList.add('hidden');
            if (tutorDashLink) tutorDashLink.classList.add('hidden');
            if (adminDashLink) adminDashLink.classList.remove('hidden');
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
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (studentDashLink) studentDashLink.classList.add('hidden');
        if (tutorDashLink) tutorDashLink.classList.add('hidden');
        if (adminDashLink) adminDashLink.classList.add('hidden');
        if (chatLink) chatLink.classList.add('hidden');
        if (notificationsLink) notificationsLink.classList.add('hidden');
        if (libraryLink) libraryLink.classList.add('hidden');
        if (forumLink) forumLink.classList.add('hidden');
        if (getStartedBtn) getStartedBtn.classList.remove('hidden');
        
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
    window.location.href = 'login.html';
}

// Redirect to role-specific dashboard
function redirectToRoleDashboard() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    if (currentUser.role === 'student') {
        window.location.href = 'student.html';
    } else if (currentUser.role === 'tutor') {
        window.location.href = 'tutor.html';
    } else if (currentUser.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Student Dashboard Functions
function loadStudentDashboard() {
    const welcomeEl = document.getElementById('studentWelcome');
    if (welcomeEl && currentUser) {
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
    if (!coursesList) return;
    
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

async function loadEnrolledCourses() {
    const enrolledList = document.getElementById('myEnrolledCourses');
    if (!enrolledList) return;

    console.log('Loading enrolled courses...');
    try {
        const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
            headers: getAuthHeaders()
        });
        console.log('Enrolled courses response status:', response.status);
        
        const data = await response.json();
        console.log('Enrolled courses data:', data);
        
        if (data.courses && data.courses.length > 0) {
            enrolledList.innerHTML = data.courses.map(course => `
                <div class="course-card" onclick="openStudentCourseDetails(${course.id})" style="cursor: pointer;">
                    <div class="course-card-header ${course.subject}"></div>
                    <div class="course-card-body">
                        <h3>${course.title}</h3>
                        <p>Subject: ${course.subject}</p>
                        <span class="course-badge">${course.level}</span>
                        ${course.hasSelectedTutor ? 
                            `<button class="btn btn-primary" onclick="event.stopPropagation(); startChatWith(${course.tutorId}, '${course.tutorName}', '${course.tutorRole}')" style="margin-top: 1rem; width: 100%;">
                                Chat with Tutor
                            </button>` :
                            `<button class="btn btn-secondary" onclick="event.stopPropagation(); openTutorSelectionModal(${course.id})" style="margin-top: 1rem; width: 100%; background-color: #f59e0b; border-color: #f59e0b; color: white;">
                                Select Tutor
                            </button>`
                        }
                    </div>
                </div>
            `).join('');
        } else {
            enrolledList.innerHTML = '<p>You are not enrolled in any courses yet.</p>';
        }
    } catch (error) {
        console.error('Failed to load enrolled courses:', error);
        enrolledList.innerHTML = '<p>Failed to load courses.</p>';
    }
}

// Tutor - Create Course
async function handleCreateCourse(e) {
    e.preventDefault();
    
    const title = document.getElementById('courseTitle').value;
    const subject = document.getElementById('courseSubject').value;
    const level = document.getElementById('courseLevel').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/courses`, {
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
        const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        // Cache for use in session creation
        window.tutorCoursesCache = data.courses || [];

        const tutorCoursesList = document.getElementById('tutorCoursesList');
        if (!tutorCoursesList) return;

        if (data.courses && data.courses.length > 0) {
            tutorCoursesList.innerHTML = data.courses.map(course => `
                <div class="course-card" onclick="openCourseDetails(${course.id})">
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
        const totalSessionsEl = document.getElementById('totalSessions');
        if (totalSessionsEl) totalSessionsEl.textContent = data.totalSessions || 0;
        
        const avgRatingEl = document.getElementById('avgRating');
        if (avgRatingEl) avgRatingEl.textContent = data.avgRating || 'N/A';
        
        const completionRateEl = document.getElementById('completionRate');
        if (completionRateEl) completionRateEl.textContent = data.completionRate || 0;
        
        const activeUsersEl = document.getElementById('activeUsers');
        if (activeUsersEl) activeUsersEl.textContent = data.activeUsers || 0;
        
        const adminStats = document.getElementById('adminStats');
        if (adminStats) {
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
        }

        // Render System Grades
        const systemGradesEl = document.getElementById('systemGrades');
        if (systemGradesEl && data.systemGrades) {
            systemGradesEl.innerHTML = `
                <div class="stats-grid" style="margin-bottom: 1rem;">
                    <div class="stat-card">
                        <h3>${data.systemGrades.average}</h3>
                        <p>System Average Grade</p>
                    </div>
                    <div class="stat-card">
                        <h3>${data.systemGrades.totalRecords}</h3>
                        <p>Total Grade Records</p>
                    </div>
                </div>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Course</th>
                                <th>Grade</th>
                                <th>Semester</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.systemGrades.details.map(record => `
                                <tr>
                                    <td>${record.studentName}</td>
                                    <td>${record.courseName}</td>
                                    <td><span class="course-badge">${record.grade}</span></td>
                                    <td>${record.semester}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load admin stats:', error);
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

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
    } else if (sectionId === 'library' && currentUser) {
        loadLibraryCategories();
    } else if (sectionId === 'forum' && currentUser) {
        loadForumPosts();
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
    
    if (!coursesList) return; // Fix: Check if element exists
    
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

let pendingEnrollmentCourseId = null;

function enrollCourse(courseId) {
    // Ensure user is loaded
    loadUserFromStorage();

    if (!currentUser || !authToken) {
        alert('Please login first!');
        window.location.href = 'login.html';
        return;
    }
    
    if (currentUser.role !== 'student') {
        alert('Only students can enroll in courses!');
        return;
    }

    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;

    pendingEnrollmentCourseId = courseId;
    
    // Populate Modal
    // Use synced data if available, otherwise fallback to username
    const displayName = currentUser.fullName || currentUser.username;
    const displayId = currentUser.studentId ? `Student ID: ${currentUser.studentId}` : `User ID: ${currentUser.id}`;
    const displayFaculty = currentUser.faculty || "Syncing from HCMUT_DATACORE...";

    document.getElementById('confirmStudentName').textContent = displayName;
    document.getElementById('confirmStudentId').textContent = displayId;
    document.getElementById('confirmFaculty').textContent = displayFaculty;
    document.getElementById('confirmCourseName').textContent = course.title;
    
    const modal = document.getElementById('enrollmentModal');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        // Fallback if modal is missing (e.g. on index.html)
        if(confirm(`Enroll in ${course.title}? Data will be synced from HCMUT_DATACORE.`)) {
            // Mock the confirm action
            pendingEnrollmentCourseId = courseId;
            confirmEnrollment();
        }
    }
}

function closeEnrollmentModal() {
    const modal = document.getElementById('enrollmentModal');
    if (modal) modal.classList.add('hidden');
    pendingEnrollmentCourseId = null;
}

async function confirmEnrollment() {
    if (!pendingEnrollmentCourseId) return;
    
    const confirmBtn = document.querySelector('#enrollmentModal .btn-primary');
    let originalText = 'Confirm Registration';
    if (confirmBtn) {
        originalText = confirmBtn.textContent;
        confirmBtn.textContent = 'Syncing & Registering...';
        confirmBtn.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/courses/${pendingEnrollmentCourseId}/enroll`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeEnrollmentModal();
            
            // Update local user state with synced data
            if (data.syncedData && currentUser) {
                currentUser.fullName = data.syncedData.fullName;
                currentUser.studentId = data.syncedData.studentId;
                currentUser.faculty = data.syncedData.faculty;
                saveUserToStorage(currentUser, authToken);
                
                // Update welcome message if on dashboard
                const welcomeEl = document.getElementById('studentWelcome');
                if (welcomeEl) {
                    welcomeEl.textContent = `Welcome back, ${currentUser.fullName || currentUser.username}!`;
                }
            }

            // Refresh notifications to show the new enrollment message
            loadNotifications();
            
            // Open Tutor Selection Modal
            openTutorSelectionModal(pendingEnrollmentCourseId);
            
            // Optional: Switch to notifications tab or just show a small toast
            // For now, we just reload the courses
            loadCourses();
            // Always reload enrolled courses to ensure dashboard is up to date
            loadEnrolledCourses();
            if (window.location.hash === '#student-dashboard') {
                loadStudentDashboard();
            }
        } else {
            const errorData = data;
            console.error('Enrollment error:', errorData);
            
            if (response.status === 401) {
                alert(`Authentication Error: ${errorData.error}\nPlease login again.`);
                handleLogout();
            } else if (response.status === 403) {
                alert('Only students can enroll in courses!');
            } else {
                alert(errorData.error || 'Enrollment failed');
            }
            closeEnrollmentModal();
        }
    } catch (error) {
        alert('Network error. Please try again.');
        closeEnrollmentModal();
    } finally {
        if (confirmBtn) {
            confirmBtn.textContent = originalText;
            confirmBtn.disabled = false;
        }
    }
}

// AI Tutor functions removed

// System Health
async function checkSystemHealth() {
    const healthStatus = document.getElementById('healthStatus');
    if (!healthStatus) return; // Fix: Check if element exists
    
    // Only check Backend
    const services = [
        { name: 'Backend API', url: 'http://localhost:3000/health' }
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
            
            // Switch to chat view
            if (window.showTab) {
                // Check if we are in admin dashboard (which uses 'messages' tab)
                if (currentUser && currentUser.role === 'admin') {
                    window.showTab('messages');
                } else {
                    window.showTab('chat');
                }
            } else {
                navigateToSection('chat');
            }

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
        if (badge) {
            if (data.unreadCount > 0) {
                badge.textContent = data.unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
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
        const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
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

function loadCourseStudents() {
    const courseId = document.getElementById('sessionCourse').value;
    const inviteSelect = document.getElementById('sessionInvites');
    inviteSelect.innerHTML = '';

    if (!courseId) {
        inviteSelect.innerHTML = '<option value="" disabled>Select a course first</option>';
        return;
    }

    const course = window.tutorCoursesCache.find(c => c.id === parseInt(courseId));
    if (course && course.enrolledStudentDetails && course.enrolledStudentDetails.length > 0) {
        inviteSelect.innerHTML = course.enrolledStudentDetails.map(s => `
            <option value="${s.id}">${s.username} (${s.email})</option>
        `).join('');
    } else {
        inviteSelect.innerHTML = '<option value="" disabled>No students enrolled in this course</option>';
    }
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
    
    // New Fields
    const goals = document.getElementById('sessionGoals').value;
    const type = document.querySelector('input[name="sessionFormat"]:checked').value;
    
    // Materials (from global variable in tutor.html)
    // Note: attachedMaterials is defined in the HTML script block. 
    // We need to access it safely.
    const materials = (typeof attachedMaterials !== 'undefined') ? attachedMaterials : [];

    // Invites
    const inviteSelect = document.getElementById('sessionInvites');
    const invitedStudents = Array.from(inviteSelect.selectedOptions).map(opt => parseInt(opt.value));

    // Recurrence
    const isRecurring = document.querySelector('input[name="sessionType"]:checked').value === 'recurring';
    const recurrenceWeeks = document.getElementById('sessionWeeks').value;

    try {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                courseId, date, startTime, endTime, maxStudents, location, description,
                isRecurring, recurrenceWeeks,
                type, goals, materials, invitedStudents
            })
        });
        const data = await response.json();
        
        if (response.ok) {
            showMessage('createSessionMessage', data.message || 'Sessions created successfully!', 'success');
            document.getElementById('createSessionForm').reset();
            // Reset recurrence UI
            document.getElementById('recurrenceOptions').classList.add('hidden');
            document.querySelector('input[value="one-time"]').checked = true;
            // Reset materials
            if (typeof attachedMaterials !== 'undefined') {
                attachedMaterials.length = 0; // Clear array
                if (typeof updateMaterialsList === 'function') updateMaterialsList();
            }
            
            loadTutorSessions();
        } else {
            if (response.status === 409) {
                // Conflict
                if (confirm(`${data.error}: ${data.message}\n\n${data.suggestion}\n\nWould you like to see your current schedule?`)) {
                    showTab('sessions'); // Already there, but maybe scroll to list
                }
            }
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
        const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
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
            
            // Store data for modal use
            if (!window.courseProgressData) window.courseProgressData = {};
            window.courseProgressData[course.id] = progressData.students;

            html += `
                <div style="margin-bottom: 2rem; background: white; padding: 1rem; border-radius: 8px; box-shadow: var(--shadow-sm);">
                    <h4 style="margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">${course.title}</h4>
                    ${progressData.students && progressData.students.length > 0 ? `
                        <table class="progress-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Attendance</th>
                                    <th>Grade</th>
                                    <th>Risk Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${progressData.students.map(s => {
                                    let riskClass = 'risk-low';
                                    let riskLabel = 'On Track';
                                    if (s.riskLevel === 'High') { riskClass = 'risk-high'; riskLabel = 'High Risk'; }
                                    else if (s.riskLevel === 'Medium') { riskClass = 'risk-medium'; riskLabel = 'At Risk'; }

                                    return `
                                        <tr>
                                            <td>
                                                <div style="font-weight: bold;">${s.studentName}</div>
                                                <div style="font-size: 0.8rem; color: #666;">${s.email}</div>
                                            </td>
                                            <td>
                                                <div class="progress-bar">
                                                    <div class="progress-fill" style="width: ${s.attendanceRate}%"></div>
                                                </div>
                                                <span style="font-size: 0.85rem;">${s.completedSessions}/${s.totalSessions} (${s.attendanceRate}%)</span>
                                            </td>
                                            <td><span class="course-badge">${s.grade}</span></td>
                                            <td><span class="badge ${riskClass}">${riskLabel}</span></td>
                                            <td>
                                                <button class="btn btn-small btn-secondary" onclick="openStudentProgressModal(${course.id}, ${s.studentId})">Details</button>
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

// Student Progress Modal
let currentProgressStudent = null;
let currentProgressCourse = null;

function openStudentProgressModal(courseId, studentId) {
    const students = window.courseProgressData[courseId];
    const student = students.find(s => s.studentId === studentId);
    
    if (!student) return;

    currentProgressStudent = student;
    currentProgressCourse = courseId;

    document.getElementById('progressStudentName').textContent = student.studentName;
    document.getElementById('progressGrade').textContent = student.grade;
    document.getElementById('progressAttendance').textContent = `${student.attendanceRate}%`;
    
    const riskEl = document.getElementById('progressRiskBadge');
    riskEl.textContent = student.riskLevel === 'Low' ? 'On Track' : `${student.riskLevel} Risk`;
    riskEl.className = `risk-badge risk-${student.riskLevel.toLowerCase()}`;
    
    document.getElementById('progressRiskReason').textContent = student.riskReason ? `Risk Factors: ${student.riskReason}` : '';

    renderNotes(student.notes || []);

    document.getElementById('studentProgressModal').classList.remove('hidden');
}

function renderNotes(notes) {
    const list = document.getElementById('progressNotesList');
    if (notes.length === 0) {
        list.innerHTML = '<p style="font-style: italic; color: #666;">No notes yet.</p>';
    } else {
        list.innerHTML = notes.map(n => `
            <div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee;">
                <div style="font-size: 0.9rem;">${n.note}</div>
                <div style="font-size: 0.75rem; color: #999;">${new Date(n.createdAt).toLocaleString()}</div>
            </div>
        `).join('');
    }
}

async function handleAddNote(e) {
    e.preventDefault();
    const content = document.getElementById('newNoteContent').value;
    
    if (!content || !currentProgressStudent) return;

    try {
        const response = await fetch(`${API_BASE_URL}/progress/course/${currentProgressCourse}/student/${currentProgressStudent.studentId}/note`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ note: content })
        });
        
        if (response.ok) {
            const newNote = await response.json();
            if (!currentProgressStudent.notes) currentProgressStudent.notes = [];
            currentProgressStudent.notes.push(newNote);
            renderNotes(currentProgressStudent.notes);
            document.getElementById('newNoteContent').value = '';
        } else {
            alert('Failed to add note');
        }
    } catch (error) {
        console.error('Error adding note:', error);
    }
}

function closeStudentProgressModal() {
    document.getElementById('studentProgressModal').classList.add('hidden');
}

function scheduleFollowUp() {
    closeStudentProgressModal();
    showTab('sessions');
    
    // Pre-fill session form
    document.getElementById('sessionCourse').value = currentProgressCourse;
    document.getElementById('sessionDescription').value = `Follow-up session for ${currentProgressStudent.studentName}. Focus on: ${currentProgressStudent.riskReason || 'General Progress'}`;
    document.getElementById('sessionGoals').value = 'Review progress and address risk factors.';
    
    // Trigger change to load students
    loadCourseStudents();
    
    // Select the student (needs a small timeout for the options to populate)
    setTimeout(() => {
        const inviteSelect = document.getElementById('sessionInvites');
        for (let i = 0; i < inviteSelect.options.length; i++) {
            if (parseInt(inviteSelect.options[i].value) === currentProgressStudent.studentId) {
                inviteSelect.options[i].selected = true;
                break;
            }
        }
    }, 500);
    
    // Scroll to form
    document.getElementById('createSessionForm').scrollIntoView({ behavior: 'smooth' });
}

function sendReminder() {
    alert(`Reminder sent to ${currentProgressStudent.studentName} to check their progress.`);
    // In real app, call API to send email/notification
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
        const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
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
    const fileInput = document.getElementById('resourceFile');
    const description = document.getElementById('resourceDescription').value;
    
    if (fileInput.files.length === 0) {
        alert('Please select a file');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);
    formData.append('description', description);
    if (courseId) formData.append('courseId', courseId);
    formData.append('file', fileInput.files[0]);
    
    try {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/resources`, {
            method: 'POST',
            headers: headers,
            body: formData
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

// HCMUT Library Functions
async function loadLibraryCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/library/categories`, {
            headers: getAuthHeaders()
        });
        const categories = await response.json();
        
        const select = document.getElementById('libraryCategoryFilter');
        if (select) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load library categories:', error);
    }
}

async function searchLibrary() {
    const query = document.getElementById('librarySearchInput').value;
    const category = document.getElementById('libraryCategoryFilter').value;
    
    try {
        let url = `${API_BASE_URL}/library/search?`;
        if (query) url += `query=${encodeURIComponent(query)}&`;
        if (category) url += `category=${encodeURIComponent(category)}`;
        
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        const results = await response.json();
        
        const resultsDiv = document.getElementById('libraryResults');
        if (results.length > 0) {
            resultsDiv.innerHTML = results.map(book => `
                <div class="library-item ${book.available ? '' : 'unavailable'}">
                    <h4>${book.title}</h4>
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>Category:</strong> ${book.category}</p>
                    <p><strong>Status:</strong> ${book.available ? 'Available' : 'Checked Out'}</p>
                    ${book.available ? `<a href="${book.link}" target="_blank" class="btn btn-small btn-primary">View Book</a>` : ''}
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<p>No books found.</p>';
        }
    } catch (error) {
        console.error('Failed to search library:', error);
    }
}

// Community Forum Functions
async function loadForumPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/forum/posts`, {
            headers: getAuthHeaders()
        });
        const posts = await response.json();
        
        const postsDiv = document.getElementById('forumPosts');
        if (posts.length > 0) {
            postsDiv.innerHTML = posts.map(post => `
                <div class="forum-post">
                    <h3>${post.title}</h3>
                    <div class="forum-post-meta">
                        <span>By ${post.author ? post.author.username : 'Unknown'}</span>
                        <span>${post.category}</span>
                        <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>${post.content}</p>
                    <div class="forum-post-actions">
                        <button class="btn btn-small" onclick="viewPostComments(${post.id})">${post.commentsCount} Comments</button>
                        ${post.userId === currentUser.id || currentUser.role === 'admin' ? 
                            `<button class="btn btn-small btn-danger" onclick="deleteForumPost(${post.id})">Delete</button>` : ''}
                    </div>
                    <div id="comments-${post.id}" class="forum-comments hidden"></div>
                </div>
            `).join('');
        } else {
            postsDiv.innerHTML = '<p>No posts yet. Be the first to create one!</p>';
        }
    } catch (error) {
        console.error('Failed to load forum posts:', error);
    }
}

function showCreatePostForm() {
    document.getElementById('createPostForm').classList.remove('hidden');
}

function hideCreatePostForm() {
    document.getElementById('createPostForm').classList.add('hidden');
    document.getElementById('forumPostForm').reset();
}

document.getElementById('forumPostForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const category = document.getElementById('postCategory').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/forum/posts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, content, category })
        });
        
        if (response.ok) {
            hideCreatePostForm();
            loadForumPosts();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to create post');
        }
    } catch (error) {
        console.error('Failed to create post:', error);
        alert('Network error');
    }
});

async function viewPostComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    
    if (commentsDiv.classList.contains('hidden')) {
        try {
            const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/comments`, {
                headers: getAuthHeaders()
            });
            const comments = await response.json();
            
            commentsDiv.innerHTML = `
                <div class="comment-form">
                    <textarea id="comment-input-${postId}" placeholder="Write a comment..." rows="2"></textarea>
                    <button class="btn btn-small btn-primary" onclick="addComment(${postId})">Post Comment</button>
                </div>
                <div class="comments-list">
                    ${comments.map(c => `
                        <div class="comment">
                            <strong>${c.author ? c.author.username : 'Unknown'}</strong>
                            <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                            <p>${c.content}</p>
                        </div>
                    `).join('') || '<p>No comments yet.</p>'}
                </div>
            `;
            commentsDiv.classList.remove('hidden');
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    } else {
        commentsDiv.classList.add('hidden');
    }
}

async function addComment(postId) {
    const content = document.getElementById(`comment-input-${postId}`).value;
    if (!content.trim()) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            viewPostComments(postId);
            viewPostComments(postId); // Reload comments
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to add comment');
        }
    } catch (error) {
        console.error('Failed to add comment:', error);
    }
}

async function deleteForumPost(postId) {
    if (!confirm('Delete this post and all comments?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/forum/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            loadForumPosts();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete post');
        }
    } catch (error) {
        console.error('Failed to delete post:', error);
    }
}

// Load library categories on page load
if (document.getElementById('libraryCategoryFilter')) {
    loadLibraryCategories();
}

// Admin Export Functions
async function exportReport() {
    const type = document.getElementById('exportType').value;
    const format = document.getElementById('exportFormat').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/export?type=${type}&format=${format}`, {
            headers: getAuthHeaders()
        });
        
        if (format === 'csv') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } else {
            const data = await response.json();
            alert(`Export complete! Data: ${JSON.stringify(data).substring(0, 100)}...`);
        }
    } catch (error) {
        console.error('Failed to export:', error);
        alert('Export failed');
    }
}

async function syncDatacore() {
    if (!confirm('Sync student data from HCMUT Datacore?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/datacore/sync`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        alert(`${data.message}\nSynced: ${data.syncedUsers} users`);
        loadAllUsers(); // Reload users list
    } catch (error) {
        console.error('Failed to sync datacore:', error);
        alert('Datacore sync failed');
    }
}

// Refresh health status periodically
setInterval(checkSystemHealth, 30000);

// ==================== COURSE DETAILS MODAL ====================
let currentDetailCourseId = null;

async function openCourseDetails(courseId) {
    currentDetailCourseId = courseId;
    const modal = document.getElementById('courseDetailsModal');
    modal.classList.remove('hidden');
    
    // Reset tabs
    switchModalTab('resources');
    
    // Load Course Info
    try {
        // We can find the course in the already loaded list or fetch it
        // For simplicity, let's fetch details if we had an endpoint, but we can just use the ID to fetch related data
        document.getElementById('modalCourseTitle').textContent = 'Loading...';
        
        // Fetch Resources
        loadModalResources(courseId);
        
        // Fetch Sessions
        loadModalSessions(courseId);
        
        // Fetch Students/Progress
        loadModalStudents(courseId);
        
    } catch (error) {
        console.error('Error opening course details:', error);
    }
}

function closeCourseDetailsModal() {
    document.getElementById('courseDetailsModal').classList.add('hidden');
    currentDetailCourseId = null;
}

function switchModalTab(tabName) {
    // Update buttons
    document.querySelectorAll('.modal-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.modal-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`modal-tab-${tabName}`).classList.remove('hidden');
}

async function loadModalResources(courseId) {
    const container = document.getElementById('modalResourcesList');
    container.innerHTML = '<p>Loading resources...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/resources?courseId=${courseId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.resources && data.resources.length > 0) {
            container.innerHTML = data.resources.map(resource => `
                <div class="resource-item">
                    <div class="resource-info">
                        <div class="resource-icon">${resource.type.toUpperCase()}</div>
                        <div class="resource-details">
                            <h4>${resource.title}</h4>
                            <p>${resource.description || 'No description'}</p>
                        </div>
                    </div>
                    <div class="resource-actions">
                        <a href="${resource.url}" target="_blank" class="btn btn-small btn-primary">View</a>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No resources uploaded for this course.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load resources.</p>';
    }
}

async function loadModalSessions(courseId) {
    const container = document.getElementById('modalSessionsList');
    container.innerHTML = '<p>Loading schedule...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/sessions?courseId=${courseId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.sessions && data.sessions.length > 0) {
            container.innerHTML = data.sessions.map(session => `
                <div class="session-card" style="margin-bottom: 1rem;">
                    <div class="session-header">
                        <div class="session-title">${new Date(session.date).toLocaleDateString()} - ${session.startTime}</div>
                        <span class="session-status ${session.status}">${session.status}</span>
                    </div>
                    <div class="session-meta">
                        <span>Location: ${session.location}</span>
                        <span>Booked: ${session.bookedStudents.length}/${session.maxStudents}</span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No sessions scheduled.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load sessions.</p>';
    }
}

async function loadModalStudents(courseId) {
    const container = document.getElementById('modalStudentsList');
    container.innerHTML = '<p>Loading students...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress/course/${courseId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        
        // Update Title with Course Name
        if (data.courseTitle) {
            document.getElementById('modalCourseTitle').textContent = data.courseTitle;
        }
        
        if (data.students && data.students.length > 0) {
            container.innerHTML = `
                <table class="progress-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Attendance</th>
                            <th>Progress</th>
                            <th>Detailed Grades</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.students.map(s => {
                            const percent = s.totalSessions > 0 ? (s.completedSessions / s.totalSessions * 100).toFixed(0) : 0;
                            return `
                                <tr>
                                    <td>${s.studentName}</td>
                                    <td>${s.completedSessions} / ${s.totalSessions} sessions</td>
                                    <td>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${percent}%"></div>
                                        </div>
                                        <span style="font-size: 0.85rem;">${percent}%</span>
                                    </td>
                                    <td>
                                        <div style="font-size: 0.85rem;">
                                            <span style="display: inline-block; width: 80px;">Midterm:</span> <strong>${s.midtermScore !== undefined ? s.midtermScore : '-'}</strong><br>
                                            <span style="display: inline-block; width: 80px;">Assign:</span> <strong>${s.assignmentScore !== undefined ? s.assignmentScore : '-'}</strong><br>
                                            <span style="display: inline-block; width: 80px;">Lab:</span> <strong>${s.labScore !== undefined ? s.labScore : '-'}</strong><br>
                                            <span style="display: inline-block; width: 80px;">Final:</span> <strong>${s.finalScore !== undefined ? s.finalScore : '-'}</strong><br>
                                            <div style="border-top: 1px solid #eee; margin-top: 4px; padding-top: 4px;">
                                                <span style="display: inline-block; width: 80px;">Total:</span> <span class="course-badge">${s.grade !== undefined ? s.grade : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<p>No students enrolled yet.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load student progress.</p>';
    }
}

// ==================== STUDENT COURSE DETAILS MODAL ====================
let currentStudentDetailCourseId = null;

async function openStudentCourseDetails(courseId) {
    currentStudentDetailCourseId = courseId;
    const modal = document.getElementById('studentCourseDetailsModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // Reset tabs
    switchStudentModalTab('overview');
    
    // Load Data
    loadStudentModalOverview(courseId);
    loadStudentModalResources(courseId);
}

function closeStudentCourseDetails() {
    const modal = document.getElementById('studentCourseDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentStudentDetailCourseId = null;
}

function switchStudentModalTab(tabName) {
    // Update buttons
    document.querySelectorAll('#studentCourseDetailsModal .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('#studentCourseDetailsModal .modal-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`studentModalTab-${tabName}`).classList.remove('hidden');
}

async function loadStudentModalOverview(courseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/progress/student/course/${courseId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to fetch progress');
        
        const data = await response.json();
        
        document.getElementById('studentModalCourseTitle').textContent = data.courseTitle;
        document.getElementById('studentModalTutorName').textContent = data.tutorName;
        
        // Detailed Grade Breakdown
        document.getElementById('studentModalGrade').innerHTML = `
            <div style="text-align: left; font-size: 0.9rem; margin-top: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Midterm (20%):</span> <strong>${data.midtermScore !== undefined ? data.midtermScore : '-'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Assignment (20%):</span> <strong>${data.assignmentScore !== undefined ? data.assignmentScore : '-'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Lab (20%):</span> <strong>${data.labScore !== undefined ? data.labScore : '-'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Final (40%):</span> <strong>${data.finalScore !== undefined ? data.finalScore : '-'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; font-weight: bold; font-size: 1.1rem; color: var(--primary-blue);">
                    <span>Total Grade:</span> <span>${data.grade !== undefined ? data.grade : 'N/A'}</span>
                </div>
            </div>
        `;
        
        const percent = data.progress.percentage;
        document.getElementById('studentModalProgressBar').style.width = `${percent}%`;
        document.getElementById('studentModalProgressText').textContent = `${data.progress.completedSessions}/${data.progress.totalSessions} Sessions (${percent}%)`;
        
    } catch (error) {
        console.error('Failed to load student overview:', error);
        document.getElementById('studentModalCourseTitle').textContent = 'Error loading details';
    }
}

async function loadStudentModalResources(courseId) {
    const container = document.getElementById('studentModalResourcesList');
    container.innerHTML = '<p>Loading resources...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/resources?courseId=${courseId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.resources && data.resources.length > 0) {
            container.innerHTML = data.resources.map(resource => `
                <div class="resource-item">
                    <div class="resource-info">
                        <div class="resource-icon">${resource.type.toUpperCase()}</div>
                        <div class="resource-details">
                            <h4>${resource.title}</h4>
                            <p>${resource.description || 'No description'}</p>
                        </div>
                    </div>
                    <div class="resource-actions">
                        <a href="${resource.url}" target="_blank" class="btn btn-small btn-primary">View</a>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>No resources available for this course.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load resources.</p>';
    }
}

// ==================== ADMIN TRANSCRIPT FUNCTIONS ====================
// Merged into Reports section
async function viewStudentTranscript(studentId) {
    const viewDiv = document.getElementById('transcriptView');
    const listDiv = document.getElementById('transcriptList').parentElement;
    const contentDiv = document.getElementById('transcriptContent');
    
    listDiv.classList.add('hidden');
    viewDiv.classList.remove('hidden');
    contentDiv.innerHTML = '<p>Loading transcript...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress/transcript/${studentId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const studentName = data.studentName;
        const email = data.email;
        const courses = data.transcript;
        const gpa = data.gpa;
        
        // Calculate overall classification based on GPA
        let classification = 'Weak';
        if (gpa >= 9.0) classification = 'Excellent';
        else if (gpa >= 8.0) classification = 'Very Good';
        else if (gpa >= 7.0) classification = 'Good';
        else if (gpa >= 5.0) classification = 'Average';
        
        contentDiv.innerHTML = `
            <div class="transcript-header" style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem;">
                <h2>OFFICIAL ACADEMIC TRANSCRIPT</h2>
                <p>TutorPro Learning Management System</p>
            </div>
            
            <div class="student-info" style="margin-bottom: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <p><strong>Student Name:</strong> ${studentName}</p>
                    <p><strong>Student ID:</strong> ${data.studentId}</p>
                    <p><strong>Email:</strong> ${email}</p>
                </div>
                <div style="text-align: right;">
                    <p><strong>Date Issued:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>GPA:</strong> ${gpa}</p>
                    <p><strong>Classification:</strong> <span class="role-badge ${classification.toLowerCase().replace(' ', '-')}">${classification}</span></p>
                </div>
            </div>
            
            <table class="users-table" style="width: 100%; border: 1px solid #ddd;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th>Course</th>
                        <th>Midterm (20%)</th>
                        <th>Assignment (20%)</th>
                        <th>Lab (20%)</th>
                        <th>Final (40%)</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${courses.map(c => `
                        <tr>
                            <td>${c.courseTitle}</td>
                            <td>${c.midterm !== undefined ? c.midterm : '-'}</td>
                            <td>${c.assignment !== undefined ? c.assignment : '-'}</td>
                            <td>${c.lab !== undefined ? c.lab : '-'}</td>
                            <td>${c.final !== undefined ? c.final : '-'}</td>
                            <td><strong>${c.grade !== undefined ? c.grade : '-'}</strong></td>
                            <td>${c.grade >= 5.0 ? 'PASSED' : 'FAILED'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="transcript-footer" style="margin-top: 3rem; display: flex; justify-content: space-between;">
                <div>
                    <p><strong>Grading Scale:</strong></p>
                    <small>0.0 - 10.0</small>
                </div>
                <div style="text-align: center;">
                    <p><strong>Registrar Signature</strong></p>
                    <div style="height: 50px;"></div>
                    <p>_______________________</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load transcript:', error);
        contentDiv.innerHTML = '<p class="error">Failed to load transcript data.</p>';
    }
}

function closeTranscriptView() {
    document.getElementById('transcriptView').classList.add('hidden');
    document.getElementById('transcriptList').parentElement.classList.remove('hidden');
}

function printTranscript() {
    const content = document.getElementById('transcriptContent').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Transcript</title>');
    printWindow.document.write('<link rel="stylesheet" href="styles.css">');
    printWindow.document.write('<style>body { padding: 2rem; font-family: sans-serif; } .users-table { width: 100%; border-collapse: collapse; } .users-table th, .users-table td { border: 1px solid #ddd; padding: 8px; text-align: left; } .role-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; } .role-badge.excellent { background: #d1fae5; color: #065f46; } .role-badge.good { background: #dbeafe; color: #1e40af; } .role-badge.average { background: #fef3c7; color: #92400e; } .role-badge.poor { background: #fee2e2; color: #991b1b; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// ==================== ADMIN REPORTS ====================
async function loadAdminReports() {
    const semester = document.getElementById('reportSemester').value;
    const faculty = document.getElementById('reportFaculty').value;
    const role = document.getElementById('reportRole').value;
    
    const resultsDiv = document.getElementById('reportResults');
    resultsDiv.innerHTML = '<p>Loading reports...</p>';
    
    try {
        let url = `${API_BASE_URL}/admin/reports?role=${role}`;
        if (semester) url += `&semester=${semester}`;
        if (faculty) url += `&faculty=${encodeURIComponent(faculty)}`;
        
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            if (role === 'student') {
                resultsDiv.innerHTML = `
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Faculty</th>
                                <th>GPA</th>
                                <th>Participation</th>
                                <th>Scholarship</th>
                                <th>Training Points</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.data.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.faculty || 'N/A'}</td>
                                    <td><strong>${item.gpa}</strong></td>
                                    <td>
                                        ${item.participationRate} 
                                        <small style="color: #666;">(${item.attended}/${item.totalSessions})</small>
                                    </td>
                                    <td>
                                        ${item.scholarship === 'Eligible' 
                                            ? '<span class="role-badge excellent">Eligible</span>' 
                                            : '<span class="role-badge poor">No</span>'}
                                    </td>
                                    <td><span class="role-badge good">${item.trainingPoints}</span></td>
                                    <td>
                                        <button class="btn btn-small btn-primary" onclick="viewStudentTranscript(${item.id})">View Transcript</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                resultsDiv.innerHTML = `
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Faculty</th>
                                <th>Avg Rating</th>
                                <th>Total Hours</th>
                                <th>Utilization</th>
                                <th>Sessions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.data.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.faculty || 'N/A'}</td>
                                    <td><strong>${item.avgRating}</strong> ⭐</td>
                                    <td>${item.totalHours} hrs</td>
                                    <td>${item.utilizationRate}</td>
                                    <td>${item.sessionsCount}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        } else {
            resultsDiv.innerHTML = '<p>No data found for the selected filters.</p>';
        }
    } catch (error) {
        console.error('Failed to load reports:', error);
        resultsDiv.innerHTML = '<p class="error">Failed to load reports. Please ensure the backend server is running and updated.</p>';
    }
}

function exportReportPDF() {
    const content = document.getElementById('reportResults').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Report Export</title>');
    printWindow.document.write('<link rel="stylesheet" href="styles.css">');
    printWindow.document.write('<style>body { padding: 2rem; font-family: sans-serif; } .users-table { width: 100%; border-collapse: collapse; } .users-table th, .users-table td { border: 1px solid #ddd; padding: 8px; text-align: left; } .role-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; } .role-badge.excellent { background: #d1fae5; color: #065f46; } .role-badge.good { background: #dbeafe; color: #1e40af; } .role-badge.poor { background: #fee2e2; color: #991b1b; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>TutorPro System Report</h2>');
    printWindow.document.write(`<p>Generated on: ${new Date().toLocaleString()}</p>`);
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// ==================== ADMIN TRANSCRIPT FUNCTIONS ====================
// Merged into Reports section
async function viewStudentTranscript(studentId) {
    const viewDiv = document.getElementById('transcriptView');
    const reportResults = document.getElementById('reportResults');
    const reportFilters = document.getElementById('reportFilters');
    const contentDiv = document.getElementById('transcriptContent');
    
    reportResults.classList.add('hidden');
    reportFilters.classList.add('hidden');
    viewDiv.classList.remove('hidden');
    contentDiv.innerHTML = '<p>Loading transcript...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress/transcript/${studentId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const studentName = data.studentName;
        const email = data.email;
        const courses = data.transcript;
        const gpa = data.gpa;
        
        // Calculate overall classification based on GPA
        let classification = 'Weak';
        if (gpa >= 9.0) classification = 'Excellent';
        else if (gpa >= 8.0) classification = 'Very Good';
        else if (gpa >= 7.0) classification = 'Good';
        else if (gpa >= 5.0) classification = 'Average';
        
        contentDiv.innerHTML = `
            <div class="transcript-header" style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem;">
                <h2>OFFICIAL ACADEMIC TRANSCRIPT</h2>
                <p>TutorPro Learning Management System</p>
            </div>
            
            <div class="student-info" style="margin-bottom: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <p><strong>Student Name:</strong> ${studentName}</p>
                    <p><strong>Student ID:</strong> ${data.studentId}</p>
                    <p><strong>Email:</strong> ${email}</p>
                </div>
                <div style="text-align: right;">
                    <p><strong>Date Issued:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>GPA:</strong> ${gpa}</p>
                    <p><strong>Classification:</strong> <span class="role-badge ${classification.toLowerCase().replace(' ', '-')}">${classification}</span></p>
                </div>
            </div>
            
            <table class="users-table" style="width: 100%; border: 1px solid #ddd;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th>Course</th>
                        <th>Midterm (20%)</th>
                        <th>Assignment (20%)</th>
                        <th>Lab (20%)</th>
                        <th>Final (40%)</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${courses.map(c => `
                        <tr>
                            <td>${c.courseTitle}</td>
                            <td>${c.midterm !== undefined ? c.midterm : '-'}</td>
                            <td>${c.assignment !== undefined ? c.assignment : '-'}</td>
                            <td>${c.lab !== undefined ? c.lab : '-'}</td>
                            <td>${c.final !== undefined ? c.final : '-'}</td>
                            <td><strong>${c.grade !== undefined ? c.grade : '-'}</strong></td>
                            <td>${c.grade >= 5.0 ? 'PASSED' : 'FAILED'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="transcript-footer" style="margin-top: 3rem; display: flex; justify-content: space-between;">
                <div>
                    <p><strong>Grading Scale:</strong></p>
                    <small>0.0 - 10.0</small>
                </div>
                <div style="text-align: center;">
                    <p><strong>Registrar Signature</strong></p>
                    <div style="height: 50px;"></div>
                    <p>_______________________</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Failed to load transcript:', error);
        contentDiv.innerHTML = '<p class="error">Failed to load transcript data.</p>';
    }
}

function closeTranscriptView() {
    document.getElementById('transcriptView').classList.add('hidden');
    document.getElementById('reportResults').classList.remove('hidden');
    document.getElementById('reportFilters').classList.remove('hidden');
}

function printTranscript() {
    const content = document.getElementById('transcriptContent').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Transcript</title>');
    printWindow.document.write('<link rel="stylesheet" href="styles.css">');
    printWindow.document.write('<style>body { padding: 2rem; font-family: sans-serif; } .users-table { width: 100%; border-collapse: collapse; } .users-table th, .users-table td { border: 1px solid #ddd; padding: 8px; text-align: left; } .role-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; } .role-badge.excellent { background: #d1fae5; color: #065f46; } .role-badge.good { background: #dbeafe; color: #1e40af; } .role-badge.average { background: #fef3c7; color: #92400e; } .role-badge.poor { background: #fee2e2; color: #991b1b; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// ==================== ADMIN CHAT FUNCTIONS ====================
// Admin chat functions have been unified with the generic chat functions.
// See loadChatRooms, openChatRoom, and sendChatMessage above.


// ==================== PROFILE MANAGEMENT ====================
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            headers: getAuthHeaders()
        });
        const profile = await response.json();
        
        // Update Header Info
        const nameEl = document.getElementById('profileName');
        const roleEl = document.getElementById('profileRole');
        const emailEl = document.getElementById('profileEmail');
        const avatarEl = document.getElementById('profileAvatarInitials');
        
        if (nameEl) nameEl.textContent = profile.fullName || profile.username;
        if (roleEl) roleEl.textContent = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
        if (emailEl) emailEl.textContent = profile.email;
        if (avatarEl) avatarEl.textContent = (profile.fullName || profile.username).charAt(0).toUpperCase();
        
        // Update Form Fields
        const studentIdInput = document.getElementById('profileStudentId');
        const facultyInput = document.getElementById('profileFaculty');
        const phoneInput = document.getElementById('profilePhone');
        const addressInput = document.getElementById('profileAddress');
        const bioInput = document.getElementById('profileBio');
        const skillsInput = document.getElementById('profileSkills');
        
        if (studentIdInput) studentIdInput.value = profile.studentId || '';
        if (facultyInput) facultyInput.value = profile.faculty || '';
        if (phoneInput) phoneInput.value = profile.phone || '';
        if (addressInput) addressInput.value = profile.address || '';
        if (bioInput) bioInput.value = profile.bio || '';
        if (skillsInput) skillsInput.value = (profile.skills || []).join(', ');
        
    } catch (error) {
        console.error('Failed to load profile:', error);
        // alert('Failed to load profile data');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const phone = document.getElementById('profilePhone').value;
    const address = document.getElementById('profileAddress').value;
    const bio = document.getElementById('profileBio').value;
    
    const data = { phone, address, bio };
    
    // Add skills if it exists (tutor only)
    const skillsInput = document.getElementById('profileSkills');
    if (skillsInput) {
        data.skills = skillsInput.value.split(',').map(s => s.trim()).filter(s => s);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('Profile updated successfully!');
            loadProfile(); // Reload to refresh header info if needed
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        alert('Network error');
    }
}

async function syncProfileWithDatacore() {
    try {
        const response = await fetch(`${API_BASE_URL}/profile/sync`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            loadProfile();
        } else {
            alert(data.message || 'Sync failed');
        }
    } catch (error) {
        console.error('Failed to sync profile:', error);
        alert('Network error');
    }
}

// ==================== TUTOR SELECTION ====================
let currentSelectionCourseId = null;

function openTutorSelectionModal(courseId) {
    currentSelectionCourseId = courseId;
    const modal = document.getElementById('tutorSelectionModal');
    if (modal) {
        modal.classList.remove('hidden');
        loadAvailableTutors(courseId);
    }
}

function closeTutorSelectionModal() {
    const modal = document.getElementById('tutorSelectionModal');
    if (modal) modal.classList.add('hidden');
    currentSelectionCourseId = null;
}

async function loadAvailableTutors(courseId) {
    const listDiv = document.getElementById('availableTutorsList');
    listDiv.innerHTML = '<p>Loading tutors...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/match/course/${courseId}/tutors`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.tutors && data.tutors.length > 0) {
            listDiv.innerHTML = data.tutors.map(tutor => `
                <div class="course-card" style="border: ${tutor.isFull ? '1px solid #ccc' : '1px solid var(--primary-blue)'}">
                    <div class="course-card-body">
                        <h3>${tutor.fullName || tutor.username}</h3>
                        <p style="font-size: 0.9rem; color: #666;">${tutor.faculty || 'General Faculty'}</p>
                        <div style="margin: 0.5rem 0;">
                            ${(tutor.skills || []).map(s => `<span class="course-badge">${s}</span>`).join('')}
                        </div>
                        <p style="font-size: 0.85rem; margin-bottom: 1rem;">${tutor.bio || 'No bio available.'}</p>
                        
                        ${tutor.isFull ? 
                            `<button class="btn btn-secondary" disabled style="width: 100%;">Full / Busy</button>` : 
                            `<button class="btn btn-primary" onclick="handleSelectTutor(${tutor.id})" style="width: 100%;">Select Tutor</button>`
                        }
                    </div>
                </div>
            `).join('');
        } else {
            listDiv.innerHTML = '<p>No tutors found for this course subject.</p>';
        }
    } catch (error) {
        console.error('Failed to load tutors:', error);
        listDiv.innerHTML = '<p>Error loading tutors.</p>';
    }
}

async function handleSelectTutor(tutorId) {
    if (!currentSelectionCourseId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/match/course/${currentSelectionCourseId}/select`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ tutorId })
        });
        
        const data = await response.json();

        if (response.ok) {
            alert('Tutor selected successfully!');
            closeTutorSelectionModal();
            loadEnrolledCourses(); // Refresh to show tutor info if we update that UI
        } else {
            alert(data.error || 'Failed to select tutor');
        }
    } catch (error) {
        console.error('Error selecting tutor:', error);
        alert('Network error');
    }
}

async function handleAutoSelectTutor() {
    if (!currentSelectionCourseId) return;

    if (!confirm('System will randomly assign a suitable tutor for you. Continue?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/match/course/${currentSelectionCourseId}/auto-select`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(`Auto-selection successful! You have been matched with ${data.tutor.fullName || data.tutor.username}.`);
            closeTutorSelectionModal();
            loadEnrolledCourses();
        } else {
            alert(data.error || 'Failed to auto-select tutor');
        }
    } catch (error) {
        console.error('Error auto-selecting tutor:', error);
        alert('Network error');
    }
}

// ==================== RATING SYSTEM ====================
let currentRatingSessionId = null;

function rateSession(sessionId) {
    currentRatingSessionId = sessionId;
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('ratingForm').reset();
    } else {
        // Fallback for pages without the modal
        const rating = prompt('Rate this session (0-10):');
        if (rating) {
            submitRating(sessionId, parseInt(rating), prompt('Feedback:'));
        }
    }
}

function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) modal.classList.add('hidden');
    currentRatingSessionId = null;
}

async function handleRatingSubmit(e) {
    e.preventDefault();
    if (!currentRatingSessionId) return;

    const communication = parseInt(document.getElementById('rateComm').value);
    const expertise = parseInt(document.getElementById('rateExpertise').value);
    const punctuality = parseInt(document.getElementById('ratePunctuality').value);
    const comment = document.getElementById('rateComment').value;

    const criteria = { communication, expertise, punctuality };

    try {
        const response = await fetch(`${API_BASE_URL}/ratings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                sessionId: currentRatingSessionId, 
                criteria, 
                comment 
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Thank you for your feedback!');
            closeRatingModal();
            loadStudentSchedule(); // Refresh to update UI if needed
        } else {
            alert(data.error || 'Failed to submit rating');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert('Network error');
    }
}

// For Tutor Dashboard
async function loadTutorRatings() {
    try {
        const response = await fetch(`${API_BASE_URL}/ratings/my-ratings`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        const ratingsDiv = document.getElementById('tutorRatingsList');
        if (!ratingsDiv) return;

        if (data.ratings && data.ratings.length > 0) {
            // Show Averages
            const averagesHtml = `
                <div class="stats-grid" style="margin-bottom: 2rem;">
                    <div class="stat-card"><h3>${data.averages.overall}</h3><p>Overall</p></div>
                    <div class="stat-card"><h3>${data.averages.communication}</h3><p>Communication</p></div>
                    <div class="stat-card"><h3>${data.averages.expertise}</h3><p>Expertise</p></div>
                    <div class="stat-card"><h3>${data.averages.punctuality}</h3><p>Punctuality</p></div>
                </div>
            `;

            const listHtml = data.ratings.map(r => `
                <div class="notification-item">
                    <div class="notification-header">
                        <div class="notification-title">${r.sessionTitle}</div>
                        <div class="notification-time">${new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style="margin: 0.5rem 0;">
                        <span class="course-badge">Overall: ${r.rating}</span>
                        <span class="course-badge" style="background: #e0f2fe; color: #0369a1;">Comm: ${r.criteria.communication}</span>
                        <span class="course-badge" style="background: #f0fdf4; color: #15803d;">Exp: ${r.criteria.expertise}</span>
                    </div>
                    <p style="font-style: italic; color: #666;">"${r.comment}"</p>
                    <div style="font-size: 0.8rem; color: #999; margin-top: 0.5rem;">By ${r.studentName}</div>
                </div>
            `).join('');

            ratingsDiv.innerHTML = averagesHtml + '<h3>Recent Reviews</h3>' + listHtml;
        } else {
            ratingsDiv.innerHTML = '<p>No ratings received yet.</p>';
        }
    } catch (error) {
        console.error('Failed to load ratings:', error);
    }
}

