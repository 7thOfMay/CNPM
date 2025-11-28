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
    const { 
        courseId, date, startTime, endTime, maxStudents, location, description, 
        isRecurring, recurrenceWeeks,
        type, goals, materials, invitedStudents 
    } = req.body;
    
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

    // Conflict Check
    const tutorSessions = sessions.filter(s => s.tutorId === req.user.id && s.status !== 'cancelled');
    const newStart = new Date(`${date}T${startTime}`);
    const newEnd = new Date(`${date}T${endTime}`);

    const hasConflict = (checkDate, checkStart, checkEnd) => {
        return tutorSessions.some(s => {
            if (s.date !== checkDate) return false;
            const existingStart = new Date(`${s.date}T${s.startTime}`);
            const existingEnd = new Date(`${s.date}T${s.endTime}`);
            return (checkStart < existingEnd && checkEnd > existingStart);
        });
    };

    if (hasConflict(date, newStart, newEnd)) {
        return res.status(409).json({ 
            error: 'Schedule Conflict', 
            message: 'You already have a session scheduled during this time slot.',
            suggestion: 'Please choose a different time or date.'
        });
    }
    
    const createdSessions = [];
    const weeks = isRecurring ? (parseInt(recurrenceWeeks) || 1) : 1;
    let currentDate = new Date(date);

    // Validate invites
    let validInvites = [];
    if (invitedStudents && Array.isArray(invitedStudents)) {
        // Ensure they are numbers
        validInvites = invitedStudents.map(id => parseInt(id));
        if (validInvites.length > (parseInt(maxStudents) || 1)) {
             return res.status(400).json({ error: 'Cannot invite more students than the maximum capacity.' });
        }
    }

    for (let i = 0; i < weeks; i++) {
        const sessionDateStr = currentDate.toISOString().split('T')[0];
        
        // Check conflict for recurring instances
        if (i > 0) { // First one already checked
             const currentStart = new Date(`${sessionDateStr}T${startTime}`);
             const currentEnd = new Date(`${sessionDateStr}T${endTime}`);
             if (hasConflict(sessionDateStr, currentStart, currentEnd)) {
                 currentDate.setDate(currentDate.getDate() + 7);
                 continue;
             }
        }

        const session = {
            id: sessionIdCounter++,
            courseId: parseInt(courseId),
            tutorId: req.user.id,
            date: sessionDateStr,
            startTime,
            endTime,
            maxStudents: parseInt(maxStudents) || 1,
            location: location || 'Online',
            description: description || '',
            status: 'scheduled', // scheduled, completed, cancelled
            bookedStudents: [...validInvites], // Auto-book invited students
            createdAt: new Date().toISOString(),
            // New Fields
            type: type || ((parseInt(maxStudents) || 1) > 1 ? 'group' : '1-1'),
            goals: goals || '',
            materials: materials || []
        };
        
        sessions.push(session);
        createdSessions.push(session);
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // Notify enrolled students (General Alert)
    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
        course.enrolledStudents.forEach(studentId => {
            // Don't notify if they are already invited (they get a specific invite below)
            if (!validInvites.includes(studentId)) {
                createNotification(
                    studentId,
                    'New Sessions Available',
                    `New sessions for ${course.title} have been scheduled starting ${date}.`,
                    'session_alert'
                );
            }
        });
    }

    // Notify Invited Students (Specific Invite)
    if (validInvites.length > 0) {
        validInvites.forEach(studentId => {
            createNotification(
                studentId,
                'Session Invitation',
                `You have been invited to a session for ${course.title} on ${date} at ${startTime}.`,
                'invitation'
            );
        });
    }
    
    res.status(201).json({ 
        message: `Successfully created ${createdSessions.length} sessions.`,
        sessions: createdSessions 
    });
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
    
    const { status, location, description, meetingMinutes } = req.body;
    
    if (status) session.status = status;
    if (location) session.location = location;
    if (description) session.description = description;
    if (meetingMinutes) session.meetingMinutes = meetingMinutes;
    
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
