const { users, courses, ratings } = require('../models/dataStore');

exports.getRecommendedTutors = (req, res) => {
    try {
        const { subject, level } = req.query;
        
        // 1. Find courses that match the criteria
        let matchingCourses = courses;
        
        if (subject && subject !== 'all') {
            matchingCourses = matchingCourses.filter(c => c.subject === subject);
        }
        
        if (level && level !== 'all') {
            matchingCourses = matchingCourses.filter(c => c.level === level);
        }
        
        // 2. Get unique tutor IDs from these courses
        const tutorIds = [...new Set(matchingCourses.map(c => c.tutorId).filter(id => id !== null))];
        
        // 3. Get tutor details
        const tutors = tutorIds.map(tutorId => {
            const tutor = users.find(u => u.id === tutorId);
            if (!tutor) return null;
            
            // Calculate ratings
            const tutorRatings = ratings.filter(r => r.tutorId === tutorId);
            const totalRatings = tutorRatings.length;
            const averageRating = totalRatings > 0 
                ? (tutorRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1) 
                : "N/A";
                
            // Get tutor's courses (for display)
            const tutorCourses = courses.filter(c => c.tutorId === tutorId);
            
            // Calculate match score (simple logic: if they teach the subject, high score)
            // In a real AI system, this would use more complex factors
            let matchScore = 85 + Math.floor(Math.random() * 15); // Random 85-100%
            
            return {
                id: tutor.id,
                tutorName: tutor.username,
                tutorEmail: tutor.email,
                averageRating,
                totalRatings,
                courses: tutorCourses.map(c => ({ subject: c.subject, level: c.level })),
                matchScore
            };
        }).filter(t => t !== null);
        
        res.json({ tutors });
        
    } catch (error) {
        console.error('Error in getRecommendedTutors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
