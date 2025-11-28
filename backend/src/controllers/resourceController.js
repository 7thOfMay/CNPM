const { resources, courses, libraryResources } = require('../models/dataStore');

let resourceIdCounter = 1;

exports.createResource = (req, res) => {
    const { title, type, courseId, description } = req.body;
    const file = req.file;
    
    if (!title || !type || !courseId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!file) {
        return res.status(400).json({ error: 'File upload required' });
    }
    
    const course = courses.find(c => c.id === parseInt(courseId));
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    // Only tutor of the course or admin can upload
    if (course.tutorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to upload resources for this course' });
    }
    
    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}/uploads/${file.filename}`;

    const resource = {
        id: resourceIdCounter++,
        title,
        type, // pdf, video, link, doc
        url: fullUrl,
        courseId: parseInt(courseId),
        description: description || '',
        uploadedBy: req.user.id,
        createdAt: new Date().toISOString()
    };
    
    resources.push(resource);
    res.status(201).json(resource);
};

exports.getResources = (req, res) => {
    const { courseId } = req.query;
    let filteredResources = resources;
    
    if (courseId) {
        filteredResources = filteredResources.filter(r => r.courseId === parseInt(courseId));
        
        // Check access permission
        const course = courses.find(c => c.id === parseInt(courseId));
        if (course) {
            const isEnrolled = course.enrolledStudents && course.enrolledStudents.includes(req.user.id);
            const isTutor = course.tutorId === req.user.id;
            const isAdmin = req.user.role === 'admin';
            
            if (!isEnrolled && !isTutor && !isAdmin) {
                return res.status(403).json({ error: 'You must be enrolled in the course to view resources' });
            }
        }
    } else if (req.user.role === 'tutor') {
        // Tutors see their own resources
        filteredResources = filteredResources.filter(r => r.uploadedBy === req.user.id);
    } else if (req.user.role === 'student') {
        // Students see resources for enrolled courses
        const enrolledCourseIds = courses
            .filter(c => c.enrolledStudents && c.enrolledStudents.includes(req.user.id))
            .map(c => c.id);
        filteredResources = filteredResources.filter(r => enrolledCourseIds.includes(r.courseId));
    }
    
    res.json({ resources: filteredResources });
};

exports.getResourceById = (req, res) => {
    const resourceId = parseInt(req.params.id);
    const resource = resources.find(r => r.id === resourceId);
    
    if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Check permission
    const course = courses.find(c => c.id === resource.courseId);
    if (course) {
        const isEnrolled = course.enrolledStudents && course.enrolledStudents.includes(req.user.id);
        const isTutor = course.tutorId === req.user.id;
        const isAdmin = req.user.role === 'admin';
        
        if (!isEnrolled && !isTutor && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }
    
    res.json(resource);
};

exports.updateResource = (req, res) => {
    const resourceId = parseInt(req.params.id);
    const resource = resources.find(r => r.id === resourceId);
    
    if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Only uploader or admin can update
    if (req.user.role !== 'admin' && resource.uploadedBy !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own resources' });
    }
    
    const { title, description, type, url } = req.body;
    
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type) resource.type = type;
    if (url !== undefined) resource.url = url;
    
    res.json({ resource });
};

exports.deleteResource = (req, res) => {
    const resourceId = parseInt(req.params.id);
    const resourceIndex = resources.findIndex(r => r.id === resourceId);
    
    if (resourceIndex === -1) {
        return res.status(404).json({ error: 'Resource not found' });
    }
    
    const resource = resources[resourceIndex];
    
    // Only uploader or admin can delete
    if (req.user.role !== 'admin' && resource.uploadedBy !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own resources' });
    }
    
    resources.splice(resourceIndex, 1);
    
    res.json({ message: 'Resource deleted successfully' });
};

// Library Integration
exports.searchLibrary = (req, res) => {
    const { query, category } = req.query;
    
    let results = libraryResources;
    
    if (query) {
        const searchQuery = query.toLowerCase();
        results = results.filter(r => 
            r.title.toLowerCase().includes(searchQuery) ||
            r.author.toLowerCase().includes(searchQuery)
        );
    }
    
    if (category) {
        results = results.filter(r => r.category === category);
    }
    
    res.json(results);
};

exports.getLibraryCategories = (req, res) => {
    const categories = [...new Set(libraryResources.map(r => r.category))];
    res.json(categories);
};

exports.getLibraryResource = (req, res) => {
    const resource = libraryResources.find(r => r.id === parseInt(req.params.id));
    
    if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json(resource);
};
