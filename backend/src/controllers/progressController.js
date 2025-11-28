const { courses, sessions, users, progressRecords, studentNotes, notifications } = require('../models/dataStore');

// Helper to calculate GPA and Classification
const calculateClassification = (grade) => {
    if (grade >= 9.0) return 'Excellent';
    if (grade >= 8.0) return 'Very Good';
    if (grade >= 7.0) return 'Good';
    if (grade >= 5.0) return 'Average';
    return 'Weak';
};

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
                
                // Risk Analysis
                let riskLevel = 'Low';
                let riskReason = [];
                
                const attendanceRate = totalSessions > 0 ? (completedSessions / totalSessions) : 1;
                if (attendanceRate < 0.5) {
                    riskLevel = 'High';
                    riskReason.push('Low Attendance (<50%)');
                } else if (attendanceRate < 0.75) {
                    if (riskLevel !== 'High') riskLevel = 'Medium';
                    riskReason.push('Moderate Attendance');
                }

                if (record) {
                    if (record.grade < 5.0) {
                        riskLevel = 'High';
                        riskReason.push('Failing Grade');
                    } else if (record.grade < 7.0) {
                        if (riskLevel !== 'High') riskLevel = 'Medium';
                        riskReason.push('Low Grade');
                    }
                }

                // Get Notes
                const notes = studentNotes.filter(n => n.studentId === studentId && n.courseId === courseId);

                studentsProgress.push({
                    studentId: student.id,
                    studentName: student.username,
                    email: student.email,
                    totalSessions: totalSessions,
                    completedSessions: completedSessions,
                    attendanceRate: (attendanceRate * 100).toFixed(0),
                    grade: record ? record.grade : 'N/A',
                    riskLevel,
                    riskReason: riskReason.join(', '),
                    notes: notes,
                    details: record ? {
                        midterm: record.midtermScore,
                        assignment: record.assignmentScore,
                        lab: record.labScore,
                        final: record.finalScore
                    } : null
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

exports.addProgressNote = (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const studentId = parseInt(req.params.studentId);
    const { note } = req.body;

    if (!note) {
        return res.status(400).json({ error: 'Note content is required' });
    }

    const newNote = {
        id: studentNotes.length + 1,
        studentId,
        courseId,
        tutorId: req.user.id,
        note,
        createdAt: new Date().toISOString()
    };

    studentNotes.push(newNote);

    // Notify student? Maybe not for internal notes, but let's say yes for "Feedback"
    // For this use case, it says "ghi nhận nhận xét/can thiệp", implying it might be shared or just for tracking.
    // Let's assume it's shared if it's a "Feedback", but here we just call it a Note.
    // We will create a notification for the student that they have new feedback.
    
    const notification = {
        id: notifications.length + 1,
        userId: studentId,
        title: 'New Progress Feedback',
        message: `Your tutor has added a note regarding your progress in course ${courseId}.`,
        type: 'feedback',
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(notification);

    res.status(201).json(newNote);
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
    
    res.json({
        courseId: courseId,
        courseTitle: course.title,
        tutorName: tutor ? tutor.username : 'Unknown',
        progress: {
            totalSessions,
            completedSessions,
            percentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
        },
        grade: record ? record.grade : 'N/A',
        details: record ? {
            midterm: record.midtermScore,
            assignment: record.assignmentScore,
            lab: record.labScore,
            final: record.finalScore,
            classification: calculateClassification(record.grade)
        } : null
    });
};

exports.getStudentTranscript = (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const student = users.find(u => u.id === studentId && u.role === 'student');

    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }

    const studentRecords = progressRecords.filter(r => r.studentId === studentId);
    
    const transcript = studentRecords.map(record => {
        const course = courses.find(c => c.id === record.courseId);
        return {
            courseId: record.courseId,
            courseTitle: course ? course.title : 'Unknown Course',
            semester: record.semester,
            midterm: record.midtermScore,
            assignment: record.assignmentScore,
            lab: record.labScore,
            final: record.finalScore,
            grade: record.grade,
            classification: calculateClassification(record.grade)
        };
    });

    // Calculate GPA (Simple average for demo)
    const totalGrade = transcript.reduce((sum, item) => sum + item.grade, 0);
    const gpa = transcript.length > 0 ? (totalGrade / transcript.length).toFixed(2) : 0;

    res.json({
        studentId: student.id,
        studentName: student.username,
        email: student.email,
        gpa: gpa,
        transcript: transcript
    });
};

exports.getAllStudents = (req, res) => {
    const students = users.filter(u => u.role === 'student').map(s => ({
        id: s.id,
        username: s.username,
        email: s.email
    }));
    res.json({ students });
};
