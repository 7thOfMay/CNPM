const { users, courses, sessions, resources, forumPosts } = require('../models/dataStore');

exports.getStats = (req, res) => {
    const stats = {
        users: {
            total: users.length,
            students: users.filter(u => u.role === 'student').length,
            tutors: users.filter(u => u.role === 'tutor').length,
            admins: users.filter(u => u.role === 'admin').length
        },
        courses: {
            total: courses.length,
            active: courses.filter(c => c.status === 'active').length
        },
        sessions: {
            total: sessions.length,
            completed: sessions.filter(s => s.status === 'completed').length,
            upcoming: sessions.filter(s => s.status === 'scheduled').length
        },
        resources: resources.length,
        forumPosts: forumPosts.length
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
