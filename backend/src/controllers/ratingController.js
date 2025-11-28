const { ratings, sessions, users, notifications } = require('../models/dataStore');

exports.createRating = (req, res) => {
    const { sessionId, criteria, comment } = req.body;
    const studentId = req.user.id;

    if (!sessionId || !criteria) {
        return res.status(400).json({ error: 'Session ID and criteria are required' });
    }

    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    // Check if student booked this session
    if (!session.bookedStudents.includes(studentId)) {
        return res.status(403).json({ error: 'You can only rate sessions you have booked' });
    }

    // Check if already rated
    const existingRating = ratings.find(r => r.sessionId === parseInt(sessionId) && r.studentId === studentId);
    if (existingRating) {
        return res.status(400).json({ error: 'You have already rated this session' });
    }

    // Validate criteria scores (0-10)
    const { communication, expertise, punctuality } = criteria;
    if (
        typeof communication !== 'number' || communication < 0 || communication > 10 ||
        typeof expertise !== 'number' || expertise < 0 || expertise > 10 ||
        typeof punctuality !== 'number' || punctuality < 0 || punctuality > 10
    ) {
        return res.status(400).json({ error: 'Ratings must be between 0 and 10' });
    }

    // Calculate overall rating (average)
    const overallRating = parseFloat(((communication + expertise + punctuality) / 3).toFixed(1));

    const newRating = {
        id: ratings.length + 1,
        tutorId: session.tutorId,
        studentId,
        sessionId: parseInt(sessionId),
        rating: overallRating,
        criteria: {
            communication,
            expertise,
            punctuality
        },
        comment: comment || '',
        createdAt: new Date().toISOString()
    };

    ratings.push(newRating);

    // Notify Tutor
    const notification = {
        id: notifications.length + 1,
        userId: session.tutorId,
        title: 'New Rating Received',
        message: `A student rated your session "${session.description || 'Session'}" with ${overallRating}/10.`,
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    res.status(201).json({ message: 'Rating submitted successfully', rating: newRating });
};

exports.getTutorRatings = (req, res) => {
    const tutorId = req.user.id;
    
    const tutorRatings = ratings.filter(r => r.tutorId === tutorId).map(r => {
        const student = users.find(u => u.id === r.studentId);
        const session = sessions.find(s => s.id === r.sessionId);
        return {
            ...r,
            studentName: student ? student.username : 'Unknown Student',
            sessionTitle: session ? (sessions.find(s => s.id === r.sessionId).courseName || 'Session') : 'Unknown Session'
        };
    });

    // Calculate averages
    let avgCommunication = 0, avgExpertise = 0, avgPunctuality = 0, avgOverall = 0;
    
    if (tutorRatings.length > 0) {
        avgCommunication = tutorRatings.reduce((acc, r) => acc + r.criteria.communication, 0) / tutorRatings.length;
        avgExpertise = tutorRatings.reduce((acc, r) => acc + r.criteria.expertise, 0) / tutorRatings.length;
        avgPunctuality = tutorRatings.reduce((acc, r) => acc + r.criteria.punctuality, 0) / tutorRatings.length;
        avgOverall = tutorRatings.reduce((acc, r) => acc + r.rating, 0) / tutorRatings.length;
    }

    res.json({
        ratings: tutorRatings,
        averages: {
            communication: avgCommunication.toFixed(1),
            expertise: avgExpertise.toFixed(1),
            punctuality: avgPunctuality.toFixed(1),
            overall: avgOverall.toFixed(1)
        }
    });
};
