const { courses, resources } = require('../models/dataStore');

exports.getRecommendations = (req, res) => {
    // Mock AI recommendation logic
    // In a real app, this would call an ML model or recommendation engine
    
    const recommendedCourses = courses
        .filter(c => c.status === 'active')
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
        
    const recommendedResources = resources
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    
    res.json({
        courses: recommendedCourses,
        resources: recommendedResources,
        reason: "Based on your recent activity and interests"
    });
};

exports.analyzeLearningPath = (req, res) => {
    // Mock AI analysis
    res.json({
        progress: 65,
        strengths: ['JavaScript', 'React'],
        weaknesses: ['Database Design', 'Testing'],
        nextSteps: [
            'Complete the Advanced Node.js module',
            'Practice SQL queries',
            'Build a full-stack project'
        ]
    });
};

exports.chat = (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message required' });
    }
    
    // Simple keyword-based response for demo
    let response = "I'm not sure how to help with that. Try asking about courses or tutors.";
    
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('course') || lowerMsg.includes('learn')) {
        response = "We have many great courses available. You can browse them in the Courses section.";
    } else if (lowerMsg.includes('tutor') || lowerMsg.includes('help')) {
        response = "Our tutors are ready to help! You can book a session in the Tutors section.";
    } else if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
        response = "Course prices vary. Please check specific course details for pricing information.";
    } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        response = "Hello! How can I assist you with your learning journey today?";
    }
    
    res.json({
        response,
        timestamp: new Date().toISOString()
    });
};
