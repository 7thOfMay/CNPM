const { users, courses, sessions, resources, forumPosts, emailLogs, progressRecords, ratings } = require('../models/dataStore');

exports.getStats = (req, res) => {
    // Calculate average rating
    const avgRating = ratings.length > 0 
        ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1) 
        : 'N/A';

    // Calculate completion rate (mock based on progress records vs enrollments)
    const totalEnrollments = courses.reduce((acc, c) => acc + c.enrolled, 0);
    const completionRate = totalEnrollments > 0 
        ? ((progressRecords.length / totalEnrollments) * 100).toFixed(0) + '%' 
        : '0%';

    // Calculate average grade
    const avgGrade = progressRecords.length > 0
        ? (progressRecords.reduce((acc, r) => acc + r.grade, 0) / progressRecords.length).toFixed(2)
        : 'N/A';

    // Enrich progress records with student and course names for admin view
    const enrichedGrades = progressRecords.map(record => {
        const student = users.find(u => u.id === record.studentId);
        const course = courses.find(c => c.id === record.courseId);
        return {
            ...record,
            studentName: student ? student.username : 'Unknown',
            courseName: course ? course.title : 'Unknown'
        };
    });

    const stats = {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalSessions: sessions.length,
        totalEnrollments: totalEnrollments,
        totalResources: resources.length,
        emailsSent: emailLogs.length,
        activeUsers: users.length, // Simplified
        completionRate: completionRate,
        avgRating: avgRating,
        usersByRole: {
            students: users.filter(u => u.role === 'student').length,
            tutors: users.filter(u => u.role === 'tutor').length,
            admins: users.filter(u => u.role === 'admin').length
        },
        // Add grade stats for "grades of the entire system"
        systemGrades: {
            average: avgGrade,
            totalRecords: progressRecords.length,
            details: enrichedGrades
        }
    };
    
    res.json(stats);
};

exports.exportData = (req, res) => {
    const { type } = req.query;
    
    let data;
    let filename;
    
    switch (type) {
        case 'users':
            data = users.map(u => {
                const { password, ...userWithoutPassword } = u;
                return userWithoutPassword;
            });
            filename = 'users_export.json';
            break;
        case 'courses':
            data = courses;
            filename = 'courses_export.json';
            break;
        case 'sessions':
            data = sessions;
            filename = 'sessions_export.json';
            break;
        default:
            return res.status(400).json({ error: 'Invalid export type' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
};

exports.getDataCore = (req, res) => {
    // Mock DataCore integration
    res.json({
        status: 'connected',
        syncStatus: 'synced',
        lastSync: new Date().toISOString(),
        metrics: {
            storageUsed: '450MB',
            apiCalls: 1250,
            errors: 2
        }
    });
};

exports.getAllUsers = (req, res) => {
    const userList = users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
    res.json({ users: userList });
};

exports.deleteUser = (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting self
    if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    users.splice(userIndex, 1);
    res.json({ message: 'User deleted successfully' });
};

exports.getReports = (req, res) => {
    const { semester, faculty, role } = req.query;

    // Filter users based on role and faculty
    let filteredUsers = users;
    if (role) {
        filteredUsers = filteredUsers.filter(u => u.role === role);
    }
    if (faculty) {
        filteredUsers = filteredUsers.filter(u => u.faculty === faculty);
    }

    // Generate Report Data
    const reportData = filteredUsers.map(user => {
        if (user.role === 'student') {
            // Student KPIs
            // 1. GPA (from progressRecords)
            const studentRecords = progressRecords.filter(r => r.studentId === user.id && (!semester || r.semester === semester));
            const gpa = studentRecords.length > 0 
                ? (studentRecords.reduce((acc, r) => acc + r.grade, 0) / studentRecords.length).toFixed(2) 
                : 0;

            // 2. Participation Rate
            // Find all sessions for courses the student is enrolled in
            // For simplicity in this demo, we check 'bookedStudents' in sessions vs total sessions of enrolled courses
            // In a real DB, we'd query enrollments -> courses -> sessions
            const enrolledCourseIds = courses.filter(c => c.enrolledStudents.includes(user.id)).map(c => c.id);
            const relevantSessions = sessions.filter(s => enrolledCourseIds.includes(s.courseId));
            const attendedSessions = relevantSessions.filter(s => s.bookedStudents.includes(user.id)).length;
            const totalRelevantSessions = relevantSessions.length;
            const participationRate = totalRelevantSessions > 0 
                ? ((attendedSessions / totalRelevantSessions) * 100).toFixed(0) 
                : 0;

            // 3. Recommendations
            const scholarship = parseFloat(gpa) >= 8.0 && parseFloat(participationRate) >= 80;
            const trainingPoints = parseFloat(participationRate) >= 50 ? 10 : 0; // +10 points if > 50% participation

            return {
                id: user.id,
                name: user.fullName || user.username,
                role: 'student',
                faculty: user.faculty,
                gpa: gpa,
                participationRate: `${participationRate}%`,
                attended: attendedSessions,
                totalSessions: totalRelevantSessions,
                scholarship: scholarship ? 'Eligible' : 'No',
                trainingPoints: `+${trainingPoints}`
            };
        } else if (user.role === 'tutor') {
            // Tutor KPIs
            // 1. Feedback Score
            const tutorRatings = ratings.filter(r => r.tutorId === user.id);
            const avgRating = tutorRatings.length > 0 
                ? (tutorRatings.reduce((acc, r) => acc + r.rating, 0) / tutorRatings.length).toFixed(1) 
                : 'N/A';

            // 2. Tutoring Hours (Mock: 2 hours per session)
            const tutorSessions = sessions.filter(s => s.tutorId === user.id);
            const totalHours = tutorSessions.length * 2;

            // 3. Utilization (Sessions with > 50% capacity)
            const busySessions = tutorSessions.filter(s => s.bookedStudents.length >= (s.maxStudents / 2)).length;
            const utilizationRate = tutorSessions.length > 0 
                ? ((busySessions / tutorSessions.length) * 100).toFixed(0) 
                : 0;

            return {
                id: user.id,
                name: user.fullName || user.username,
                role: 'tutor',
                faculty: user.faculty,
                avgRating: avgRating,
                totalHours: totalHours,
                utilizationRate: `${utilizationRate}%`,
                sessionsCount: tutorSessions.length
            };
        }
        return null;
    }).filter(item => item !== null);

    res.json({
        generatedAt: new Date().toISOString(),
        filters: { semester, faculty, role },
        data: reportData
    });
};
