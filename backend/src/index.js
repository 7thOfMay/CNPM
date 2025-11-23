const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory database for demo
const users = [];
const courses = [
    { id: 1, title: 'Introduction to Mathematics', subject: 'math', level: 'beginner', enrolled: 0 },
    { id: 2, title: 'Advanced Physics', subject: 'science', level: 'advanced', enrolled: 0 },
    { id: 3, title: 'Web Development Basics', subject: 'programming', level: 'beginner', enrolled: 0 },
    { id: 4, title: 'Data Structures', subject: 'programming', level: 'intermediate', enrolled: 0 }
];

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'backend',
        timestamp: new Date().toISOString()
    });
});

// User routes
app.post('/api/users/register', (req, res) => {
    try {
        const { username, email, role = 'student' } = req.body;
        
        if (!username || !email) {
            return res.status(400).json({ error: 'Username and email are required' });
        }
        
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        const newUser = {
            id: users.length + 1,
            username,
            email,
            role,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', (req, res) => {
    res.json({ users });
});

app.get('/api/users/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
});

// Course routes
app.get('/api/courses', (req, res) => {
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

app.get('/api/courses/:id', (req, res) => {
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
});

app.post('/api/courses/:id/enroll', (req, res) => {
    const { userId } = req.body;
    const course = courses.find(c => c.id === parseInt(req.params.id));
    
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    course.enrolled += 1;
    res.json({
        message: 'Successfully enrolled',
        course: course,
        user: user
    });
});

// AI integration routes
app.post('/api/tutoring/ask', async (req, res) => {
    try {
        const { question, subject } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }
        
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/query`, {
            question,
            subject
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

app.post('/api/tutoring/recommendations', async (req, res) => {
    try {
        const { userId, level, interests } = req.body;
        
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/recommend`, {
            level,
            interests
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

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`AI Service URL: ${AI_SERVICE_URL}`);
});
