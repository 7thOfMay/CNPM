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
