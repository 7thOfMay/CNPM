const API_BASE_URL = 'http://localhost:3000/api';
const AI_SERVICE_URL = 'http://localhost:5000/api';

// State management
let currentUser = null;
let allCourses = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    checkSystemHealth();
    setupEventListeners();
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

    // Tutor form
    const tutorForm = document.getElementById('tutorForm');
    if (tutorForm) {
        tutorForm.addEventListener('submit', handleTutorQuestion);
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

// User Registration
async function handleRegistration(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data;
            showMessage('registerMessage', 'Registration successful!', 'success');
            setTimeout(() => {
                navigateToSection('courses');
            }, 1500);
        } else {
            showMessage('registerMessage', data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('registerMessage', 'Network error. Please try again.', 'error');
    }
}

// Courses
async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/courses`);
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
        alert('Please register first!');
        navigateToSection('register');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Successfully enrolled!');
            loadCourses();
        } else {
            alert(data.error || 'Enrollment failed');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// AI Tutor
async function handleTutorQuestion(e) {
    e.preventDefault();
    
    const question = document.getElementById('question').value;
    const subject = document.getElementById('subject').value;
    
    // Display user message
    addChatMessage('user', question);
    
    // Clear input
    document.getElementById('question').value = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/tutoring/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, subject })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            addChatMessage('ai', data.answer);
        } else {
            addChatMessage('ai', 'Sorry, I encountered an error. Please try again.');
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
