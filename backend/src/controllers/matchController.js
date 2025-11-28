const { users, courses, tutorSelections, notifications } = require('../models/dataStore');

const isTutorMatch = (tutor, course) => {
    if (tutor.role !== 'tutor') return false;
    
    // Check faculty
    if (tutor.faculty && tutor.faculty.toLowerCase().includes(course.subject.toLowerCase())) return true;
    
    // Special mapping for demo
    if (course.subject === 'programming' && tutor.faculty === 'Computer Science') return true;
    if (course.subject === 'math' && tutor.username === 'tutor_math') return true;

    // Check skills (if array)
    if (tutor.skills && Array.isArray(tutor.skills)) {
        return tutor.skills.some(skill => skill.toLowerCase().includes(course.subject.toLowerCase()));
    }
    
    // Fallback for demo: if subject is 'general', allow all tutors
    if (course.subject === 'general') return true;

    return false;
};

exports.getAvailableTutors = (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const course = courses.find(c => c.id === courseId);

    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    const availableTutors = users.filter(u => isTutorMatch(u, course)).map(t => ({
        id: t.id,
        username: t.username,
        fullName: t.fullName,
        faculty: t.faculty,
        skills: t.skills,
        bio: t.bio,
        // Mock availability status
        isFull: Math.random() > 0.8 // 20% chance of being full
    }));

    res.json({ tutors: availableTutors });
};

exports.selectTutor = (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const { tutorId } = req.body;
    const studentId = req.user.id;

    const course = courses.find(c => c.id === courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const tutor = users.find(u => u.id === parseInt(tutorId) && u.role === 'tutor');
    if (!tutor) return res.status(404).json({ error: 'Tutor not found' });

    // Check if already selected
    const existingSelection = tutorSelections.find(s => s.studentId === studentId && s.courseId === courseId);
    if (existingSelection) {
        return res.status(400).json({ error: 'Tutor already selected for this course' });
    }

    // Save selection
    const selection = {
        id: tutorSelections.length + 1,
        studentId,
        courseId,
        tutorId: tutor.id,
        selectedAt: new Date().toISOString(),
        method: 'manual'
    };
    tutorSelections.push(selection);

    // Notify Tutor
    const notification = {
        id: notifications.length + 1,
        userId: tutor.id,
        title: 'New Student Assigned',
        message: `Student ${req.user.username} has selected you for course ${course.title}.`,
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    res.status(201).json({ 
        message: 'Tutor selected successfully',
        selection
    });
};

exports.autoSelectTutor = (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const studentId = req.user.id;

    const course = courses.find(c => c.id === courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Reuse logic to find tutors
    const availableTutors = users.filter(u => isTutorMatch(u, course));

    if (availableTutors.length === 0) {
        return res.status(404).json({ error: 'No suitable tutors found for auto-selection' });
    }

    // Randomly pick one
    const randomTutor = availableTutors[Math.floor(Math.random() * availableTutors.length)];

    // Check if already selected
    const existingSelection = tutorSelections.find(s => s.studentId === studentId && s.courseId === courseId);
    if (existingSelection) {
        return res.status(400).json({ error: 'Tutor already selected for this course' });
    }

    // Save selection
    const selection = {
        id: tutorSelections.length + 1,
        studentId,
        courseId,
        tutorId: randomTutor.id,
        selectedAt: new Date().toISOString(),
        method: 'auto'
    };
    tutorSelections.push(selection);

    // Notify Tutor
    const notification = {
        id: notifications.length + 1,
        userId: randomTutor.id,
        title: 'New Student Assigned (Auto)',
        message: `Student ${req.user.username} was auto-assigned to you for course ${course.title}.`,
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    res.status(201).json({ 
        message: 'Tutor auto-selected successfully',
        tutor: {
            id: randomTutor.id,
            username: randomTutor.username,
            fullName: randomTutor.fullName
        },
        selection
    });
};
