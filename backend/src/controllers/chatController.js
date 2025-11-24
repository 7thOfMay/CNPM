const chat = require('../chat');
const { users, courses } = require('../models/dataStore');

// Helper functions for chat permissions
function canStudentChatWithTutor(studentId, tutorId) {
    return courses.some(course => 
        course.tutorId === tutorId && 
        course.enrolledStudents && 
        course.enrolledStudents.includes(studentId)
    );
}

function canTutorChatWithStudent(tutorId, studentId) {
    return courses.some(course => 
        course.tutorId === tutorId && 
        course.enrolledStudents && 
        course.enrolledStudents.includes(studentId)
    );
}

function getAllowedChatUsers(currentUserId, currentUserRole) {
    if (currentUserRole === 'admin') {
        return users.filter(u => u.id !== currentUserId);
    }
    
    if (currentUserRole === 'student') {
        const enrolledCourses = courses.filter(c => 
            c.enrolledStudents && c.enrolledStudents.includes(currentUserId)
        );
        const tutorIds = [...new Set(enrolledCourses.map(c => c.tutorId).filter(id => id !== null))];
        
        return users.filter(u => 
            u.id !== currentUserId && 
            (tutorIds.includes(u.id) || u.role === 'admin')
        );
    }
    
    if (currentUserRole === 'tutor') {
        const tutorCourses = courses.filter(c => c.tutorId === currentUserId);
        const studentIds = [...new Set(tutorCourses.flatMap(c => c.enrolledStudents || []))];
        
        return users.filter(u => 
            u.id !== currentUserId && 
            (studentIds.includes(u.id) || u.role === 'admin')
        );
    }
    
    return [];
}

exports.getChatUsers = (req, res) => {
    const allowedUsers = getAllowedChatUsers(req.user.id, req.user.role);
    const usersWithoutPasswords = allowedUsers.map(({ password, ...user }) => user);
    res.json({ users: usersWithoutPasswords });
};

exports.createRoom = (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    
    const otherUser = users.find(u => u.id === userId);
    if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const allowedUsers = getAllowedChatUsers(req.user.id, req.user.role);
    const canChat = allowedUsers.some(u => u.id === userId);
    
    if (!canChat) {
        return res.status(403).json({ 
            error: 'You are not allowed to chat with this user',
            message: req.user.role === 'student' 
                ? 'You can only chat with tutors of courses you are enrolled in'
                : 'You can only chat with students enrolled in your courses'
        });
    }
    
    const room = chat.getOrCreateRoom(req.user.id, userId);
    res.json({ room, otherUser: { id: otherUser.id, username: otherUser.username, role: otherUser.role } });
};

exports.getRooms = (req, res) => {
    const rooms = chat.getUserRooms(req.user.id);
    
    const enrichedRooms = rooms.map(room => {
        const otherUserId = room.user1Id === req.user.id ? room.user2Id : room.user1Id;
        const otherUser = users.find(u => u.id === otherUserId);
        const roomMessages = chat.getRoomMessages(room.id, 1);
        
        return {
            ...room,
            otherUser: otherUser ? { id: otherUser.id, username: otherUser.username, role: otherUser.role } : null,
            lastMessage: roomMessages.length > 0 ? roomMessages[0] : null
        };
    });
    
    res.json({ rooms: enrichedRooms });
};

exports.sendMessage = (req, res) => {
    const { roomId, content } = req.body;
    
    if (!roomId || !content) {
        return res.status(400).json({ error: 'roomId and content are required' });
    }
    
    const message = chat.sendMessage(roomId, req.user.id, content);
    res.json({ message });
};

exports.getMessages = (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const messages = chat.getRoomMessages(roomId);
    
    chat.markMessagesAsRead(roomId, req.user.id);
    
    res.json({ messages });
};

exports.getUnreadCount = (req, res) => {
    const count = chat.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
};
