const { sessions, courses, users, notifications } = require('../models/dataStore');
const { sendEmail } = require('../utils/emailService');

let sessionIdCounter = 5; // Start after manual IDs
let notificationIdCounter = 1;

// Helper to create notification
function createNotification(userId, title, message, type = 'info') {
    const notification = {
        id: notificationIdCounter++,
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(notification);
    
    // Send email notification
    const user = users.find(u => u.id === userId);
    if (user && user.email) {
        sendEmail(user.email, `Notification: ${title}`, message);
    }
    
    return notification;
}

exports.createSession = (req, res) => {
    const { courseId, date, startTime, endTime, maxStudents, location, description } = req.body;
    
    if (!courseId || !date || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const course = courses.find(c => c.id === parseInt(courseId));
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.tutorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to create sessions for this course' });
    }
    
    const session = {
        id: sessionIdCounter++,
        courseId: parseInt(courseId),
        tutorId: req.user.id,
        date,
        startTime,
        endTime,
        maxStudents: parseInt(maxStudents) || 1,
        location: location || 'Online',
        description: description || '',
        status: 'scheduled', // scheduled, completed, cancelled
        bookedStudents: [], // Array of student IDs
        createdAt: new Date().toISOString()
    };
    
    sessions.push(session);
    
    // Notify enrolled students
    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
        course.enrolledStudents.forEach(studentId => {
            createNotification(
                studentId,
                'New Session Available',
                `A new session for ${course.title} has been scheduled on ${date} at ${startTime}.`,
                'session_alert'
            );
        });
    }
    
    res.status(201).json(session);
};

exports.getSessions = (req, res) => {
    const { courseId, startDate, endDate } = req.query;
    let filteredSessions = sessions;
    
    // Role-based filtering
    if (req.user.role === 'tutor') {
        filteredSessions = filteredSessions.filter(s => s.tutorId === req.user.id);
    } else if (req.user.role === 'student') {
        // Get courses student is enrolled in
        const enrolledCourseIds = courses
            .filter(c => c.enrolledStudents && c.enrolledStudents.includes(req.user.id))
            .map(c => c.id);
            
        filteredSessions = filteredSessions.filter(s => enrolledCourseIds.includes(s.courseId));
    }
    
    if (courseId) {
        filteredSessions = filteredSessions.filter(s => s.courseId === parseInt(courseId));
    }
    
    // Filter by date range if provided
    if (startDate) {
        filteredSessions = filteredSessions.filter(s => s.date >= startDate);
    }
    
    if (endDate) {
        filteredSessions = filteredSessions.filter(s => s.date <= endDate);
    }
    
    // Enrich with course info
    const enrichedSessions = filteredSessions.map(s => {
        const course = courses.find(c => c.id === s.courseId);
        const tutor = users.find(u => u.id === s.tutorId);
        return {
            ...s,
            courseName: course ? course.title : 'Unknown Course',
            courseSubject: course ? course.subject : 'Unknown',
            tutorName: tutor ? tutor.username : 'Unknown Tutor',
            bookedStudents: s.bookedStudents || []
        };
    });
    
    res.json({ sessions: enrichedSessions });
};

exports.bookSession = (req, res) => {
    const sessionId = parseInt(req.params.id);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'scheduled') {
        return res.status(400).json({ error: 'Session is not available for booking' });
    }
    
    if (session.bookedStudents.includes(req.user.id)) {
        return res.status(400).json({ error: 'Already booked this session' });
    }
    
    if (session.bookedStudents.length >= session.maxStudents) {
        return res.status(400).json({ error: 'Session is full' });
    }
    
    session.bookedStudents.push(req.user.id);
    
    // Notify tutor
    createNotification(
        session.tutorId,
        'New Booking',
        `A student has booked your session for ${session.date} at ${session.startTime}.`,
        'booking_alert'
    );
    
    res.json({ message: 'Session booked successfully', session });
};

exports.cancelBooking = (req, res) => {
    const sessionId = parseInt(req.params.id);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const studentIndex = session.bookedStudents.indexOf(req.user.id);
    if (studentIndex === -1) {
        return res.status(400).json({ error: 'You have not booked this session' });
    }
    
    session.bookedStudents.splice(studentIndex, 1);
    
    // Notify tutor
    createNotification(
        session.tutorId,
        'Booking Cancelled',
        `A student has cancelled their booking for ${session.date}.`,
        'cancellation_alert'
    );
    
    res.json({ message: 'Booking cancelled successfully' });
};

exports.updateSession = (req, res) => {
    const sessionId = parseInt(req.params.id);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.tutorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { status, location, description } = req.body;
    
    if (status) session.status = status;
    if (location) session.location = location;
    if (description) session.description = description;
    
    // Notify students if cancelled
    if (status === 'cancelled') {
        session.bookedStudents.forEach(studentId => {
            createNotification(
                studentId,
                'Session Cancelled',
                `The session on ${session.date} has been cancelled by the tutor.`,
                'cancellation_alert'
            );
        });
    }
    
    res.json(session);
};

exports.deleteSession = (req, res) => {
    const sessionId = parseInt(req.params.id);
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = sessions[sessionIndex];
    
    if (session.tutorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Notify students
    session.bookedStudents.forEach(studentId => {
        createNotification(
            studentId,
            'Session Cancelled',
            `The session on ${session.date} has been deleted.`,
            'cancellation_alert'
        );
    });
    
    sessions.splice(sessionIndex, 1);
    res.json({ message: 'Session deleted successfully' });
};
