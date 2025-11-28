const { courses, sessions, users, progressRecords } = require('../models/dataStore');

exports.getCourseProgress = (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const course = courses.find(c => c.id === courseId);

    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    // Ensure the user is the tutor of the course or an admin
    if (req.user.role !== 'admin' && course.tutorId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const courseSessions = sessions.filter(s => s.courseId === courseId);
    const totalSessions = courseSessions.length;

    const studentsProgress = [];

    if (course.enrolledStudents) {
        course.enrolledStudents.forEach(studentId => {
            const student = users.find(u => u.id === studentId);
            if (student) {
                // Count sessions this student is booked for
                const completedSessions = courseSessions.filter(s => 
                    s.bookedStudents && s.bookedStudents.includes(studentId)
                ).length;

                // Find grade record
                const record = progressRecords.find(r => r.courseId === courseId && r.studentId === studentId);
                const grade = record ? record.grade : 'N/A';

                studentsProgress.push({
                    studentId: student.id,
                    studentName: student.username,
                    totalSessions: totalSessions,
                    completedSessions: completedSessions,
                    grade: grade
                });
            }
        });
    }

    res.json({
        courseId: courseId,
        courseTitle: course.title,
        students: studentsProgress
    });
};

exports.getStudentCourseProgress = (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const studentId = req.user.id;

    const course = courses.find(c => c.id === courseId);
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    // Check if student is enrolled
    if (!course.enrolledStudents || !course.enrolledStudents.includes(studentId)) {
        return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    const tutor = users.find(u => u.id === course.tutorId);
    const courseSessions = sessions.filter(s => s.courseId === courseId);
    const totalSessions = courseSessions.length;
    const completedSessions = courseSessions.filter(s => 
        s.bookedStudents && s.bookedStudents.includes(studentId)
    ).length;

    const record = progressRecords.find(r => r.courseId === courseId && r.studentId === studentId);
    const grade = record ? record.grade : 'N/A';

    res.json({
        courseId: courseId,
        courseTitle: course.title,
        tutorName: tutor ? tutor.username : 'Unknown',
        progress: {
            totalSessions,
            completedSessions,
            percentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
        },
        grade: grade
    });
};
