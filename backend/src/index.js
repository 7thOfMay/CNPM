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
        password: '$2a$10$8K1p/a0dL3.I7KU.PvzP3eZ9zqGzM5vO4qJ9R1Xw9QC1qKfE8rZHm',
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
    const stats = {
        totalUsers: users.length,
        totalCourses: courses.length,
        usersByRole: {
            students: users.filter(u => u.role === 'student').length,
            tutors: users.filter(u => u.role === 'tutor').length,
            admins: users.filter(u => u.role === 'admin').length
        },
        totalEnrollments: courses.reduce((sum, c) => sum + c.enrolled, 0)
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
