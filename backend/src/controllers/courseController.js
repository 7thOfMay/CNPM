const { courses, users } = require('../models/dataStore');

exports.getAllCourses = (req, res) => {
    const { subject, level, search } = req.query;
    let filteredCourses = courses;
    
    if (subject) {
        filteredCourses = filteredCourses.filter(c => c.subject === subject);
    }
    
    if (level) {
        filteredCourses = filteredCourses.filter(c => c.level === level);
    }
    
    if (search) {
        const searchLower = search.toLowerCase();
        filteredCourses = filteredCourses.filter(c => 
            c.title.toLowerCase().includes(searchLower) || 
            c.subject.toLowerCase().includes(searchLower)
        );
    }
    
    res.json({ courses: filteredCourses });
};

exports.createCourse = (req, res) => {
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
        createdBy: req.user.username,
        enrolledStudents: []
    };
    
    courses.push(newCourse);
    res.status(201).json(newCourse);
};

exports.enrollCourse = (req, res) => {
    const courseId = parseInt(req.params.id);
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if already enrolled
    if (course.enrolledStudents && course.enrolledStudents.includes(req.user.id)) {
        return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    // Initialize array if needed
    if (!course.enrolledStudents) {
        course.enrolledStudents = [];
    }
    
    course.enrolled++;
    course.enrolledStudents.push(req.user.id);
    
    res.json({ 
        message: 'Enrolled successfully',
        course
    });
};

exports.getMyCourses = (req, res) => {
    let myCourses = [];
    
    if (req.user.role === 'student') {
        myCourses = courses.filter(c => c.enrolledStudents && c.enrolledStudents.includes(req.user.id));
    } else if (req.user.role === 'tutor') {
        myCourses = courses.filter(c => c.tutorId === req.user.id);
    }
    
    res.json({ courses: myCourses });
};
