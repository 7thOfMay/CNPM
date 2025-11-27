const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.log('Auth Error: Missing Authorization header');
            return res.status(401).json({ error: 'MISSING_AUTH_HEADER: No Authorization header provided' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.log('Auth Error: Invalid header format');
            return res.status(401).json({ error: 'INVALID_AUTH_FORMAT: Header must start with Bearer' });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            console.log('Auth Error: Missing token');
            return res.status(401).json({ error: 'MISSING_TOKEN: No token found in header' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Auth Error:', error.message);
        return res.status(401).json({ error: `TOKEN_INVALID: ${error.message}` });
    }
};

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions' });
        }
        
        next();
    };
};

const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        next();
    } catch (error) {
        next();
    }
};

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

module.exports = {
    authMiddleware,
    optionalAuth,
    requireRole,
    generateToken,
    JWT_SECRET
};
