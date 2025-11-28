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
    console.log(`User ${req.user.id} attempting to enroll in course ${courseId}`);
    
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
        console.log('Course not found');
        return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if already enrolled
    if (course.enrolledStudents && course.enrolledStudents.includes(req.user.id)) {
        console.log('User already enrolled');
        return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    // Initialize array if needed
    if (!course.enrolledStudents) {
        course.enrolledStudents = [];
    }
    
    course.enrolled++;
    course.enrolledStudents.push(req.user.id);
    console.log(`Enrollment successful. Course ${courseId} now has students: [${course.enrolledStudents}]`);
    
    res.json({ 
        message: 'Enrolled successfully',
        course
    });
};

exports.getMyCourses = (req, res) => {
    console.log('getMyCourses called for user:', req.user.id, req.user.role);
    let myCourses = [];
    
    if (req.user.role === 'student') {
        myCourses = courses.filter(c => {
            const isEnrolled = c.enrolledStudents && c.enrolledStudents.includes(req.user.id);
            return isEnrolled;
        }).map(course => {
            const tutor = users.find(u => u.id === course.tutorId);
            return {
                ...course,
                tutorName: tutor ? tutor.username : 'Unknown Tutor',
                tutorRole: tutor ? tutor.role : 'tutor'
            };
        });
    } else if (req.user.role === 'tutor') {
        myCourses = courses.filter(c => c.tutorId === req.user.id);
    }
    
    console.log(`Found ${myCourses.length} courses for user ${req.user.id}`);
    res.json({ courses: myCourses });
};
