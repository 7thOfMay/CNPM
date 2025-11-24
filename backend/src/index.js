const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { authMiddleware, optionalAuth, requireRole, generateToken } = require('./middleware/auth');
const chat = require('./chat');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory database for demo
// Hardcoded admin account: email: admin@tutorpro.com, password: admin123
const users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@tutorpro.com',
        password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS',
        role: 'admin',
        createdAt: new Date().toISOString()
    }
];
const courses = [
    { id: 1, title: 'Introduction to Mathematics', subject: 'math', level: 'beginner', enrolled: 0, tutorId: null, enrolledStudents: [] },
    { id: 2, title: 'Advanced Physics', subject: 'science', level: 'advanced', enrolled: 0, tutorId: null, enrolledStudents: [] },
    { id: 3, title: 'Web Development Basics', subject: 'programming', level: 'beginner', enrolled: 0, tutorId: null, enrolledStudents: [] },
    { id: 4, title: 'Data Structures', subject: 'programming', level: 'intermediate', enrolled: 0, tutorId: null, enrolledStudents: [] }
];

// Sessions/Schedule Management
const sessions = [];
let sessionIdCounter = 1;

// Ratings & Feedback
const ratings = [];
let ratingIdCounter = 1;

// Notifications
const notifications = [];
let notificationIdCounter = 1;

// Progress tracking
const progressRecords = [];

// SSO Mock - simulate HCMUT_SSO
const ssoTokens = {}; // Map: ssoToken -> userId
let ssoTokenCounter = 1;

// Resources/Learning Materials
const resources = [];
let resourceIdCounter = 1;

// Email logs (Mock)
const emailLogs = [];

// Mock email service
function sendEmail(to, subject, body) {
    const email = {
        to,
        subject,
        body,
        sentAt: new Date().toISOString(),
        status: 'sent'
    };
    emailLogs.push(email);
    console.log(`Email sent to ${to}: ${subject}`);
    return email;
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'backend',
        timestamp: new Date().toISOString()
    });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, role = 'student' } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const validRoles = ['student', 'tutor'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be student or tutor' });
        }
        
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        const token = generateToken(newUser);
        
        const { password: _, ...userWithoutPassword } = newUser;
        
        res.status(201).json({ 
            user: userWithoutPassword,
            token 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = generateToken(user);
        
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({ 
            user: userWithoutPassword,
            token 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// User routes (legacy - keeping for backward compatibility)
app.post('/api/users/register', async (req, res) => {
    return res.status(301).json({ 
        error: 'This endpoint is deprecated. Please use /api/auth/register' 
    });
});

app.get('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json({ users: usersWithoutPasswords });
});

app.get('/api/admin/stats', authMiddleware, requireRole('admin'), (req, res) => {
    // Session metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;
    
    // Rating metrics
    const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : 0;
    
    // Active users (users with activity in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = users.filter(u => 
        notifications.some(n => n.userId === u.id && new Date(n.createdAt) > sevenDaysAgo)
    ).length;
    
    const stats = {
        totalUsers: users.length,
        totalCourses: courses.length,
        usersByRole: {
            students: users.filter(u => u.role === 'student').length,
            tutors: users.filter(u => u.role === 'tutor').length,
            admins: users.filter(u => u.role === 'admin').length
        },
        totalEnrollments: courses.reduce((sum, c) => sum + c.enrolled, 0),
        totalSessions: totalSessions,
        completedSessions: completedSessions,
        completionRate: parseFloat(completionRate),
        avgRating: parseFloat(avgRating),
        activeUsers: activeUsers,
        totalResources: resources.length,
        totalNotifications: notifications.length,
        emailsSent: emailLogs.length
    };
    res.json(stats);
});

app.delete('/api/admin/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (users[userIndex].role === 'admin') {
        return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    
    users.splice(userIndex, 1);
    res.json({ message: 'User deleted successfully' });
});

app.post('/api/tutor/courses', authMiddleware, requireRole('tutor', 'admin'), (req, res) => {
    const { title, subject, level } = req.body;
    
    if (!title || !subject || !level) {
        return res.status(400).json({ error: 'Title, subject, and level are required' });
    }
    
    const newCourse = {
        id: courses.length + 1,
        title,
        subject,
        level,
        enrolled: 0,
        tutorId: req.user.id,
        createdBy: req.user.username
    };
    
    courses.push(newCourse);
    res.status(201).json(newCourse);
});

app.get('/api/tutor/courses', authMiddleware, requireRole('tutor', 'admin'), (req, res) => {
    const tutorCourses = courses.filter(c => c.tutorId === req.user.id);
    res.json({ courses: tutorCourses });
});

// Helper functions for chat permissions
function canStudentChatWithTutor(studentId, tutorId) {
    return courses.some(course => 
        course.tutorId === tutorId && 
        course.enrolledStudents && 
        course.enrolledStudents.includes(studentId)
    );
}

function canTutorChatWithStudent(tutorId, studentId) {
    return courses.some(course => 
        course.tutorId === tutorId && 
        course.enrolledStudents && 
        course.enrolledStudents.includes(studentId)
    );
}

function getAllowedChatUsers(currentUserId, currentUserRole) {
    if (currentUserRole === 'admin') {
        return users.filter(u => u.id !== currentUserId);
    }
    
    if (currentUserRole === 'student') {
        const enrolledCourses = courses.filter(c => 
            c.enrolledStudents && c.enrolledStudents.includes(currentUserId)
        );
        const tutorIds = [...new Set(enrolledCourses.map(c => c.tutorId).filter(id => id !== null))];
        
        return users.filter(u => 
            u.id !== currentUserId && 
            (tutorIds.includes(u.id) || u.role === 'admin')
        );
    }
    
    if (currentUserRole === 'tutor') {
        const tutorCourses = courses.filter(c => c.tutorId === currentUserId);
        const studentIds = [...new Set(tutorCourses.flatMap(c => c.enrolledStudents || []))];
        
        return users.filter(u => 
            u.id !== currentUserId && 
            (studentIds.includes(u.id) || u.role === 'admin')
        );
    }
    
    return [];
}

// Chat routes
app.get('/api/chat/users', authMiddleware, (req, res) => {
    const allowedUsers = getAllowedChatUsers(req.user.id, req.user.role);
    const usersWithoutPasswords = allowedUsers.map(({ password, ...user }) => user);
    res.json({ users: usersWithoutPasswords });
});

app.post('/api/chat/room', authMiddleware, (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    
    const otherUser = users.find(u => u.id === userId);
    if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const allowedUsers = getAllowedChatUsers(req.user.id, req.user.role);
    const canChat = allowedUsers.some(u => u.id === userId);
    
    if (!canChat) {
        return res.status(403).json({ 
            error: 'You are not allowed to chat with this user',
            message: req.user.role === 'student' 
                ? 'You can only chat with tutors of courses you are enrolled in'
                : 'You can only chat with students enrolled in your courses'
        });
    }
    
    const room = chat.getOrCreateRoom(req.user.id, userId);
    res.json({ room, otherUser: { id: otherUser.id, username: otherUser.username, role: otherUser.role } });
});

app.get('/api/chat/rooms', authMiddleware, (req, res) => {
    const rooms = chat.getUserRooms(req.user.id);
    
    const enrichedRooms = rooms.map(room => {
        const otherUserId = room.user1Id === req.user.id ? room.user2Id : room.user1Id;
        const otherUser = users.find(u => u.id === otherUserId);
        const roomMessages = chat.getRoomMessages(room.id, 1);
        
        return {
            ...room,
            otherUser: otherUser ? { id: otherUser.id, username: otherUser.username, role: otherUser.role } : null,
            lastMessage: roomMessages.length > 0 ? roomMessages[0] : null
        };
    });
    
    res.json({ rooms: enrichedRooms });
});

app.post('/api/chat/message', authMiddleware, (req, res) => {
    const { roomId, content } = req.body;
    
    if (!roomId || !content) {
        return res.status(400).json({ error: 'roomId and content are required' });
    }
    
    const message = chat.sendMessage(roomId, req.user.id, content);
    res.json({ message });
});

app.get('/api/chat/messages/:roomId', authMiddleware, (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const messages = chat.getRoomMessages(roomId);
    
    chat.markMessagesAsRead(roomId, req.user.id);
    
    res.json({ messages });
});

app.get('/api/chat/unread', authMiddleware, (req, res) => {
    const count = chat.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
});

app.get('/api/users/:id', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// Course routes
app.get('/api/courses', optionalAuth, (req, res) => {
    const { subject, level } = req.query;
    let filteredCourses = courses;
    
    if (subject) {
        filteredCourses = filteredCourses.filter(c => c.subject === subject);
    }
    if (level) {
        filteredCourses = filteredCourses.filter(c => c.level === level);
    }
    
    res.json({ courses: filteredCourses });
});

app.get('/api/courses/:id', optionalAuth, (req, res) => {
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
});

app.post('/api/courses/:id/enroll', authMiddleware, requireRole('student'), (req, res) => {
    const course = courses.find(c => c.id === parseInt(req.params.id));
    
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already enrolled
    if (course.enrolledStudents && course.enrolledStudents.includes(req.user.id)) {
        return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    course.enrolled += 1;
    if (!course.enrolledStudents) {
        course.enrolledStudents = [];
    }
    course.enrolledStudents.push(req.user.id);
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
        message: 'Successfully enrolled',
        course: course,
        user: userWithoutPassword
    });
});

// AI integration routes
app.post('/api/tutoring/ask', authMiddleware, requireRole('student'), async (req, res) => {
    try {
        const { question, subject } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }
        
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/query`, {
            question,
            subject,
            userId: req.user.id
        });
        
        res.json(aiResponse.data);
    } catch (error) {
        console.error('AI service error:', error.message);
        res.status(503).json({
            error: 'AI service unavailable',
            fallback: 'Please try again later or contact support.'
        });
    }
});

app.post('/api/tutoring/recommendations', authMiddleware, requireRole('student'), async (req, res) => {
    try {
        const { level, interests } = req.body;
        
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/recommend`, {
            level,
            interests,
            userId: req.user.id
        });
        
        res.json(aiResponse.data);
    } catch (error) {
        console.error('AI service error:', error.message);
        res.status(503).json({ error: 'AI service unavailable' });
    }
});

// ==================== SCHEDULE MANAGEMENT ====================
// Create a tutoring session
app.post('/api/sessions', authMiddleware, requireRole('tutor'), (req, res) => {
    try {
        const { courseId, date, startTime, endTime, maxStudents = 10, location, description } = req.body;
        
        if (!courseId || !date || !startTime || !endTime) {
            return res.status(400).json({ error: 'Course, date, start time, and end time are required' });
        }
        
        const course = courses.find(c => c.id === parseInt(courseId));
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        if (course.tutorId && course.tutorId !== req.user.id) {
            return res.status(403).json({ error: 'You can only create sessions for your own courses' });
        }
        
        const session = {
            id: sessionIdCounter++,
            courseId: parseInt(courseId),
            tutorId: req.user.id,
            tutorName: req.user.username,
            courseName: course.title,
            date,
            startTime,
            endTime,
            maxStudents,
            location: location || 'Online',
            description: description || '',
            bookedStudents: [],
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };
        
        sessions.push(session);
        
        // Create notification for enrolled students
        course.enrolledStudents.forEach(studentId => {
            createNotification(
                studentId,
                'New Session Available',
                `New session for "${course.title}" on ${date} at ${startTime}`,
                'session',
                session.id
            );
        });
        
        res.status(201).json({ session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all sessions (with filters)
app.get('/api/sessions', authMiddleware, (req, res) => {
    try {
        const { courseId, date, status } = req.query;
        let filtered = sessions;
        
        if (courseId) {
            filtered = filtered.filter(s => s.courseId === parseInt(courseId));
        }
        
        if (date) {
            filtered = filtered.filter(s => s.date === date);
        }
        
        if (status) {
            filtered = filtered.filter(s => s.status === status);
        }
        
        // Filter based on user role
        if (req.user.role === 'tutor') {
            filtered = filtered.filter(s => s.tutorId === req.user.id);
        } else if (req.user.role === 'student') {
            // Show sessions for enrolled courses
            const enrolledCourseIds = courses
                .filter(c => c.enrolledStudents.includes(req.user.id))
                .map(c => c.id);
            filtered = filtered.filter(s => enrolledCourseIds.includes(s.courseId));
        }
        
        res.json({ sessions: filtered });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Book a session (student)
app.post('/api/sessions/:id/book', authMiddleware, requireRole('student'), (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        if (session.status !== 'scheduled') {
            return res.status(400).json({ error: 'Session is not available for booking' });
        }
        
        const course = courses.find(c => c.id === session.courseId);
        if (!course.enrolledStudents.includes(req.user.id)) {
            return res.status(403).json({ error: 'You must be enrolled in the course to book this session' });
        }
        
        if (session.bookedStudents.includes(req.user.id)) {
            return res.status(400).json({ error: 'You have already booked this session' });
        }
        
        if (session.bookedStudents.length >= session.maxStudents) {
            return res.status(400).json({ error: 'Session is fully booked' });
        }
        
        session.bookedStudents.push(req.user.id);
        
        // Create notification for tutor
        createNotification(
            session.tutorId,
            'New Session Booking',
            `${req.user.username} booked your session on ${session.date}`,
            'booking',
            session.id
        );
        
        res.json({ message: 'Session booked successfully', session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel booking (student)
app.delete('/api/sessions/:id/book', authMiddleware, requireRole('student'), (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const index = session.bookedStudents.indexOf(req.user.id);
        if (index === -1) {
            return res.status(400).json({ error: 'You have not booked this session' });
        }
        
        session.bookedStudents.splice(index, 1);
        
        // Notify tutor
        createNotification(
            session.tutorId,
            'Booking Cancelled',
            `${req.user.username} cancelled booking for session on ${session.date}`,
            'cancellation',
            session.id
        );
        
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update session (tutor)
app.put('/api/sessions/:id', authMiddleware, requireRole('tutor'), (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        if (session.tutorId !== req.user.id) {
            return res.status(403).json({ error: 'You can only update your own sessions' });
        }
        
        const { date, startTime, endTime, maxStudents, location, description, status } = req.body;
        
        if (date) session.date = date;
        if (startTime) session.startTime = startTime;
        if (endTime) session.endTime = endTime;
        if (maxStudents) session.maxStudents = maxStudents;
        if (location) session.location = location;
        if (description !== undefined) session.description = description;
        if (status) session.status = status;
        
        // Notify all booked students
        session.bookedStudents.forEach(studentId => {
            createNotification(
                studentId,
                'Session Updated',
                `Session "${session.courseName}" on ${session.date} has been updated`,
                'update',
                session.id
            );
        });
        
        res.json({ message: 'Session updated successfully', session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete session (tutor)
app.delete('/api/sessions/:id', authMiddleware, requireRole('tutor'), (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex === -1) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const session = sessions[sessionIndex];
        
        if (session.tutorId !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own sessions' });
        }
        
        // Notify all booked students
        session.bookedStudents.forEach(studentId => {
            createNotification(
                studentId,
                'Session Cancelled',
                `Session "${session.courseName}" on ${session.date} has been cancelled`,
                'cancellation',
                session.id
            );
        });
        
        sessions.splice(sessionIndex, 1);
        
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== RATING & FEEDBACK ====================
// Submit rating for a session
app.post('/api/ratings', authMiddleware, requireRole('student'), (req, res) => {
    try {
        const { sessionId, rating, feedback } = req.body;
        
        if (!sessionId || !rating) {
            return res.status(400).json({ error: 'Session ID and rating are required' });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        const session = sessions.find(s => s.id === parseInt(sessionId));
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        if (!session.bookedStudents.includes(req.user.id)) {
            return res.status(403).json({ error: 'You can only rate sessions you attended' });
        }
        
        // Check if already rated
        const existingRating = ratings.find(r => r.sessionId === parseInt(sessionId) && r.studentId === req.user.id);
        if (existingRating) {
            return res.status(400).json({ error: 'You have already rated this session' });
        }
        
        const newRating = {
            id: ratingIdCounter++,
            sessionId: parseInt(sessionId),
            studentId: req.user.id,
            studentName: req.user.username,
            tutorId: session.tutorId,
            courseId: session.courseId,
            rating,
            feedback: feedback || '',
            createdAt: new Date().toISOString()
        };
        
        ratings.push(newRating);
        
        // Record progress
        recordProgress(req.user.id, session.courseId, session.id, 'completed');
        
        // Notify tutor
        createNotification(
            session.tutorId,
            'New Rating Received',
            `${req.user.username} rated your session ${rating}/5`,
            'rating',
            newRating.id
        );
        
        res.status(201).json({ rating: newRating });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ratings for a tutor
app.get('/api/ratings/tutor/:tutorId', authMiddleware, (req, res) => {
    try {
        const tutorId = parseInt(req.params.tutorId);
        const tutorRatings = ratings.filter(r => r.tutorId === tutorId);
        
        const avgRating = tutorRatings.length > 0
            ? tutorRatings.reduce((sum, r) => sum + r.rating, 0) / tutorRatings.length
            : 0;
        
        res.json({
            ratings: tutorRatings,
            averageRating: avgRating.toFixed(2),
            totalRatings: tutorRatings.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ratings for a course
app.get('/api/ratings/course/:courseId', authMiddleware, (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const courseRatings = ratings.filter(r => r.courseId === courseId);
        
        const avgRating = courseRatings.length > 0
            ? courseRatings.reduce((sum, r) => sum + r.rating, 0) / courseRatings.length
            : 0;
        
        res.json({
            ratings: courseRatings,
            averageRating: avgRating.toFixed(2),
            totalRatings: courseRatings.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== NOTIFICATION SYSTEM ====================
// Helper function to create notification
function createNotification(userId, title, message, type, relatedId = null) {
    const notification = {
        id: notificationIdCounter++,
        userId,
        title,
        message,
        type,
        relatedId,
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(notification);
    
    // Send email notification
    const user = users.find(u => u.id === userId);
    if (user && user.email) {
        sendEmail(user.email, title, message);
    }
    
    return notification;
}

// Get user notifications
app.get('/api/notifications', authMiddleware, (req, res) => {
    try {
        const userNotifications = notifications
            .filter(n => n.userId === req.user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const unreadCount = userNotifications.filter(n => !n.read).length;
        
        res.json({
            notifications: userNotifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const notification = notifications.find(n => n.id === notificationId);
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        if (notification.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        notification.read = true;
        
        res.json({ notification });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authMiddleware, (req, res) => {
    try {
        notifications
            .filter(n => n.userId === req.user.id && !n.read)
            .forEach(n => n.read = true);
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete notification
app.delete('/api/notifications/:id', authMiddleware, (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex === -1) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        const notification = notifications[notificationIndex];
        
        if (notification.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        notifications.splice(notificationIndex, 1);
        
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PROGRESS TRACKING ====================
// Helper function to record progress
function recordProgress(studentId, courseId, sessionId, status) {
    const existing = progressRecords.find(
        p => p.studentId === studentId && p.courseId === courseId && p.sessionId === sessionId
    );
    
    if (existing) {
        existing.status = status;
        existing.updatedAt = new Date().toISOString();
    } else {
        progressRecords.push({
            studentId,
            courseId,
            sessionId,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
}

// Get student progress
app.get('/api/progress/student/:studentId', authMiddleware, (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        
        // Only student themselves or admin can view
        if (req.user.role !== 'admin' && req.user.id !== studentId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const studentProgress = progressRecords.filter(p => p.studentId === studentId);
        
        // Group by course
        const progressByCourse = {};
        studentProgress.forEach(p => {
            if (!progressByCourse[p.courseId]) {
                const course = courses.find(c => c.id === p.courseId);
                progressByCourse[p.courseId] = {
                    courseId: p.courseId,
                    courseName: course ? course.title : 'Unknown',
                    totalSessions: 0,
                    completedSessions: 0,
                    sessions: []
                };
            }
            
            progressByCourse[p.courseId].totalSessions++;
            if (p.status === 'completed') {
                progressByCourse[p.courseId].completedSessions++;
            }
            progressByCourse[p.courseId].sessions.push(p);
        });
        
        res.json({
            studentId,
            progress: Object.values(progressByCourse)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get course progress (for tutors)
app.get('/api/progress/course/:courseId', authMiddleware, requireRole('tutor', 'admin'), (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const course = courses.find(c => c.id === courseId);
        
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        if (req.user.role === 'tutor' && course.tutorId !== req.user.id) {
            return res.status(403).json({ error: 'You can only view progress for your own courses' });
        }
        
        const courseProgress = progressRecords.filter(p => p.courseId === courseId);
        
        // Group by student
        const progressByStudent = {};
        courseProgress.forEach(p => {
            if (!progressByStudent[p.studentId]) {
                const student = users.find(u => u.id === p.studentId);
                progressByStudent[p.studentId] = {
                    studentId: p.studentId,
                    studentName: student ? student.username : 'Unknown',
                    totalSessions: 0,
                    completedSessions: 0
                };
            }
            
            progressByStudent[p.studentId].totalSessions++;
            if (p.status === 'completed') {
                progressByStudent[p.studentId].completedSessions++;
            }
        });
        
        res.json({
            courseId,
            courseName: course.title,
            students: Object.values(progressByStudent)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== AI-BASED TUTOR MATCHING ====================
// Get recommended tutors for a student
app.get('/api/match/tutors', authMiddleware, requireRole('student'), (req, res) => {
    try {
        const { subject, level } = req.query;
        
        // Get all tutors
        const tutors = users.filter(u => u.role === 'tutor');
        
        // Get tutor courses and ratings
        const tutorData = tutors.map(tutor => {
            const tutorCourses = courses.filter(c => c.tutorId === tutor.id);
            const tutorRatings = ratings.filter(r => r.tutorId === tutor.id);
            const avgRating = tutorRatings.length > 0
                ? tutorRatings.reduce((sum, r) => sum + r.rating, 0) / tutorRatings.length
                : 0;
            
            let matchScore = 0;
            
            // Score based on subject match
            if (subject) {
                const hasSubject = tutorCourses.some(c => c.subject === subject);
                if (hasSubject) matchScore += 40;
            }
            
            // Score based on level match
            if (level) {
                const hasLevel = tutorCourses.some(c => c.level === level);
                if (hasLevel) matchScore += 30;
            }
            
            // Score based on rating
            matchScore += avgRating * 6;
            
            return {
                tutorId: tutor.id,
                tutorName: tutor.username,
                tutorEmail: tutor.email,
                courses: tutorCourses.map(c => ({
                    id: c.id,
                    title: c.title,
                    subject: c.subject,
                    level: c.level
                })),
                averageRating: avgRating.toFixed(2),
                totalRatings: tutorRatings.length,
                matchScore: matchScore.toFixed(2)
            };
        });
        
        // Sort by match score
        tutorData.sort((a, b) => b.matchScore - a.matchScore);
        
        res.json({ tutors: tutorData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== RESOURCE MANAGEMENT ====================
// Upload/Create a resource (Tutor/Admin)
app.post('/api/resources', authMiddleware, requireRole('tutor', 'admin'), (req, res) => {
    try {
        const { title, description, type, url, courseId } = req.body;
        
        if (!title || !type) {
            return res.status(400).json({ error: 'Title and type are required' });
        }
        
        if (courseId) {
            const course = courses.find(c => c.id === parseInt(courseId));
            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }
            
            if (req.user.role === 'tutor' && course.tutorId !== req.user.id) {
                return res.status(403).json({ error: 'You can only add resources to your own courses' });
            }
        }
        
        const resource = {
            id: resourceIdCounter++,
            title,
            description: description || '',
            type, // 'pdf', 'video', 'link', 'document'
            url: url || '',
            courseId: courseId ? parseInt(courseId) : null,
            uploadedBy: req.user.id,
            uploaderName: req.user.username,
            uploaderRole: req.user.role,
            createdAt: new Date().toISOString()
        };
        
        resources.push(resource);
        
        // Notify enrolled students if course-specific
        if (courseId) {
            const course = courses.find(c => c.id === parseInt(courseId));
            if (course && course.enrolledStudents) {
                course.enrolledStudents.forEach(studentId => {
                    createNotification(
                        studentId,
                        'New Learning Resource',
                        `New ${type} added to "${course.title}": ${title}`,
                        'resource',
                        resource.id
                    );
                });
            }
        }
        
        res.status(201).json({ resource });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all resources (with filters)
app.get('/api/resources', authMiddleware, (req, res) => {
    try {
        const { courseId, type } = req.query;
        let filtered = resources;
        
        if (courseId) {
            const course = courses.find(c => c.id === parseInt(courseId));
            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }
            
            // Check enrollment for students
            if (req.user.role === 'student' && !course.enrolledStudents.includes(req.user.id)) {
                return res.status(403).json({ error: 'You must be enrolled in this course to access resources' });
            }
            
            filtered = filtered.filter(r => r.courseId === parseInt(courseId) || r.courseId === null);
        } else {
            // For students, only show resources from enrolled courses or public (no courseId)
            if (req.user.role === 'student') {
                const enrolledCourseIds = courses
                    .filter(c => c.enrolledStudents.includes(req.user.id))
                    .map(c => c.id);
                filtered = filtered.filter(r => !r.courseId || enrolledCourseIds.includes(r.courseId));
            }
            // Tutors see their course resources + public
            else if (req.user.role === 'tutor') {
                const tutorCourseIds = courses
                    .filter(c => c.tutorId === req.user.id)
                    .map(c => c.id);
                filtered = filtered.filter(r => !r.courseId || tutorCourseIds.includes(r.courseId));
            }
            // Admin sees all
        }
        
        if (type) {
            filtered = filtered.filter(r => r.type === type);
        }
        
        res.json({ resources: filtered });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single resource
app.get('/api/resources/:id', authMiddleware, (req, res) => {
    try {
        const resourceId = parseInt(req.params.id);
        const resource = resources.find(r => r.id === resourceId);
        
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        // Check access permissions
        if (resource.courseId) {
            const course = courses.find(c => c.id === resource.courseId);
            if (req.user.role === 'student' && !course.enrolledStudents.includes(req.user.id)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            if (req.user.role === 'tutor' && course.tutorId !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }
        
        res.json({ resource });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update resource
app.put('/api/resources/:id', authMiddleware, requireRole('tutor', 'admin'), (req, res) => {
    try {
        const resourceId = parseInt(req.params.id);
        const resource = resources.find(r => r.id === resourceId);
        
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        // Only uploader or admin can update
        if (req.user.role !== 'admin' && resource.uploadedBy !== req.user.id) {
            return res.status(403).json({ error: 'You can only update your own resources' });
        }
        
        const { title, description, type, url } = req.body;
        
        if (title) resource.title = title;
        if (description !== undefined) resource.description = description;
        if (type) resource.type = type;
        if (url !== undefined) resource.url = url;
        
        res.json({ resource });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete resource
app.delete('/api/resources/:id', authMiddleware, requireRole('tutor', 'admin'), (req, res) => {
    try {
        const resourceId = parseInt(req.params.id);
        const resourceIndex = resources.findIndex(r => r.id === resourceId);
        
        if (resourceIndex === -1) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        const resource = resources[resourceIndex];
        
        // Only uploader or admin can delete
        if (req.user.role !== 'admin' && resource.uploadedBy !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own resources' });
        }
        
        resources.splice(resourceIndex, 1);
        
        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`AI Service URL: ${AI_SERVICE_URL}`);
});

module.exports = { app, server };
