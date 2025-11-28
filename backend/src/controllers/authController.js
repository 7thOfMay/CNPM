const bcrypt = require('bcryptjs');
const { users, ssoTokens, datacoreRecords, loginAttempts } = require('../models/dataStore');
const { generateToken } = require('../middleware/auth');

let ssoTokenCounter = 1;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (role === 'admin') {
            return res.status(400).json({ error: 'Invalid role: Admin registration is not allowed via public API' });
        }

        const validRoles = ['student', 'tutor'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        if (users.find(u => u.email === email)) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        const token = generateToken(newUser);
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                fullName: newUser.fullName,
                studentId: newUser.studentId,
                faculty: newUser.faculty
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Check Lockout
        if (loginAttempts[email]) {
            const { count, lockUntil } = loginAttempts[email];
            if (lockUntil && new Date() < new Date(lockUntil)) {
                return res.status(403).json({ 
                    error: 'Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.' 
                });
            }
            if (lockUntil && new Date() >= new Date(lockUntil)) {
                // Reset after lockout expires
                delete loginAttempts[email];
            }
        }

        const user = users.find(u => u.email === email);
        if (!user) {
            // Record failed attempt
            handleFailedLogin(email);
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không hợp lệ.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Record failed attempt
            handleFailedLogin(email);
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không hợp lệ.' });
        }
        
        // Reset attempts on success
        if (loginAttempts[email]) delete loginAttempts[email];

        const token = generateToken(user);
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                studentId: user.studentId,
                faculty: user.faculty
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

function handleFailedLogin(email) {
    if (!loginAttempts[email]) {
        loginAttempts[email] = { count: 0, lockUntil: null };
    }
    loginAttempts[email].count++;
    
    if (loginAttempts[email].count >= MAX_LOGIN_ATTEMPTS) {
        loginAttempts[email].lockUntil = new Date(Date.now() + LOCKOUT_TIME);
    }
}

exports.ssoInitiate = (req, res) => {
    // Mock SSO initiation - simulate HCMUT_SSO redirect
    const mockSSOToken = `SSO_TOKEN_${ssoTokenCounter++}_${Date.now()}`;
    const callbackUrl = `${req.query.redirect_uri || 'http://localhost:8080'}?sso_token=${mockSSOToken}`;
    
    // Store token temporarily (in real SSO, this would be on SSO server)
    res.json({
        redirect_url: callbackUrl,
        sso_token: mockSSOToken,
        message: 'Mock SSO: In production, user would be redirected to HCMUT_SSO login'
    });
};

exports.ssoCallback = async (req, res) => {
    const { sso_token, email } = req.body;
    
    if (!sso_token) {
        return res.status(400).json({ error: 'SSO token required' });
    }
    
    // Mock: Simulate SSO validation (in real SSO, would validate with HCMUT_SSO server)
    const mockEmail = email || `student${Math.floor(Math.random() * 1000)}@hcmut.edu.vn`;
    
    // Role Determination via HCMUT_DATACORE
    const datacoreUser = datacoreRecords.find(r => r.email === mockEmail);
    let role = 'student'; // Default
    let faculty = null;

    if (datacoreUser) {
        role = datacoreUser.role || 'student';
        faculty = datacoreUser.faculty;
    } else if (mockEmail.includes('admin')) {
        role = 'admin';
    } else if (mockEmail.includes('tutor')) {
        role = 'tutor';
    }

    // Find or create user
    let user = users.find(u => u.email === mockEmail);
    
    if (!user) {
        // Auto-register via SSO
        const newUser = {
            id: users.length + 1,
            username: datacoreUser ? datacoreUser.name : mockEmail.split('@')[0],
            email: mockEmail,
            password: await bcrypt.hash('sso_user', 10), // Dummy password for SSO users
            role: role,
            faculty: faculty,
            ssoUser: true,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        user = newUser;
    } else {
        // Update role from Datacore if changed
        if (datacoreUser && user.role !== datacoreUser.role) {
            user.role = datacoreUser.role;
        }
    }
    
    // Store SSO token mapping
    ssoTokens[sso_token] = user.id;
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            studentId: user.studentId,
            faculty: user.faculty
        },
        message: 'SSO authentication successful'
    });
};

exports.getMe = (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
        faculty: user.faculty
    });
};
