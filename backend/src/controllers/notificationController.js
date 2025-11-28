const { notifications } = require('../models/dataStore');

exports.getNotifications = (req, res) => {
    const userNotifications = notifications.filter(n => n.userId === req.user.id);
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    res.json({
        notifications: userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        unreadCount
    });
};

exports.markAsRead = (req, res) => {
    const notificationId = parseInt(req.params.id);
    const notification = notifications.find(n => n.id === notificationId && n.userId === req.user.id);
    
    if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    res.json({ message: 'Marked as read' });
};

exports.markAllAsRead = (req, res) => {
    notifications.forEach(n => {
        if (n.userId === req.user.id) {
            n.read = true;
        }
    });
    
    res.json({ message: 'All marked as read' });
};
