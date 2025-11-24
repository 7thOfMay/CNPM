const bcrypt = require('bcryptjs');
const { users, ssoTokens } = require('../models/dataStore');
const { generateToken } = require('../middleware/auth');

let ssoTokenCounter = 1;

exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already exists' });
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
                role: newUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = generateToken(user);
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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
    
    // Find or create user
    let user = users.find(u => u.email === mockEmail);
    
    if (!user) {
        // Auto-register via SSO
        const newUser = {
            id: users.length + 1,
            username: mockEmail.split('@')[0],
            email: mockEmail,
            password: await bcrypt.hash('sso_user', 10), // Dummy password for SSO users
            role: mockEmail.includes('@hcmut.edu.vn') ? 'student' : 'tutor',
            ssoUser: true,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        user = newUser;
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
            role: user.role
        },
        message: 'SSO authentication successful'
    });
};
