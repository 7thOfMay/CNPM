// In-memory chat storage
const chatRooms = [];
const messages = [];

let messageIdCounter = 1;
let roomIdCounter = 1;

// Get or create a chat room between two users
function getOrCreateRoom(user1Id, user2Id) {
    // Find existing room
    const existingRoom = chatRooms.find(room => 
        (room.user1Id === user1Id && room.user2Id === user2Id) ||
        (room.user1Id === user2Id && room.user2Id === user1Id)
    );
    
    if (existingRoom) {
        return existingRoom;
    }
    
    // Create new room
    const newRoom = {
        id: roomIdCounter++,
        user1Id,
        user2Id,
        createdAt: new Date().toISOString()
    };
    
    chatRooms.push(newRoom);
    return newRoom;
}

// Get all rooms for a user
function getUserRooms(userId) {
    return chatRooms.filter(room => 
        room.user1Id === userId || room.user2Id === userId
    );
}

// Send a message
function sendMessage(roomId, senderId, content) {
    const message = {
        id: messageIdCounter++,
        roomId,
        senderId,
        content,
        createdAt: new Date().toISOString(),
        read: false
    };
    
    messages.push(message);
    return message;
}

// Get messages in a room
function getRoomMessages(roomId, limit = 50) {
    return messages
        .filter(msg => msg.roomId === roomId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .reverse();
}

// Mark messages as read
function markMessagesAsRead(roomId, userId) {
    messages.forEach(msg => {
        if (msg.roomId === roomId && msg.senderId !== userId) {
            msg.read = true;
        }
    });
}

// Get unread count for a user
function getUnreadCount(userId) {
    const userRooms = getUserRooms(userId);
    const roomIds = userRooms.map(r => r.id);
    
    return messages.filter(msg => 
        roomIds.includes(msg.roomId) && 
        msg.senderId !== userId && 
        !msg.read
    ).length;
}

module.exports = {
    getOrCreateRoom,
    getUserRooms,
    sendMessage,
    getRoomMessages,
    markMessagesAsRead,
    getUnreadCount
};
