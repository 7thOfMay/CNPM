const { users, datacoreRecords } = require('../models/dataStore');

const getProfile = (req, res) => {
    const userId = req.user.id;
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Return safe user data
    const profile = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName || '',
        studentId: user.studentId || '',
        phone: user.phone || '',
        address: user.address || '',
        faculty: user.faculty || '',
        bio: user.bio || '',
        skills: user.skills || []
    };

    res.json(profile);
};

const updateProfile = (req, res) => {
    const userId = req.user.id;
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const { phone, address, bio, skills } = req.body;

    // Update allowed fields
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined && Array.isArray(skills)) user.skills = skills;

    res.json({ message: 'Profile updated successfully', user: {
        id: user.id,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        skills: user.skills
    }});
};

const syncDatacore = (req, res) => {
    const userId = req.user.id;
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Find matching record in Datacore by email
    const datacoreRecord = datacoreRecords.find(r => r.email === user.email);

    if (!datacoreRecord) {
        return res.status(404).json({ message: 'No matching record found in HCMUT_DATACORE' });
    }

    // Sync data
    user.fullName = datacoreRecord.name;
    user.faculty = datacoreRecord.faculty;
    if (user.role === 'student') {
        user.studentId = datacoreRecord.studentId;
    }

    res.json({ 
        message: 'Profile synced with HCMUT_DATACORE successfully', 
        syncedData: {
            fullName: user.fullName,
            faculty: user.faculty,
            studentId: user.studentId
        }
    });
};

module.exports = {
    getProfile,
    updateProfile,
    syncDatacore
};
