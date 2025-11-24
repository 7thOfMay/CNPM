// In-memory data store
// This replaces the global variables in index.js

const users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@tutorpro.com',
        password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', // admin123
        role: 'admin',
        createdAt: new Date().toISOString()
    }
];

const courses = [
    { id: 1, title: 'Introduction to Mathematics', subject: 'math', level: 'beginner', enrolled: 0, tutorId: null, enrolledStudents: [] },
    { id: 2, title: 'Advanced Physics', subject: 'science', level: 'advanced', enrolled: 0, tutorId: null, enrolledStudents: [] },
    { id: 3, title: 'Web Development Basics', subject: 'programming', level: 'beginner', enrolled: 0, tutorId: null, enrolledStudents: [] },
    { id: 4, title: 'Data Structures', subject: 'programming', level: 'intermediate', enrolled: 0, tutorId: null, enrolledStudents: [] }
];

const sessions = [];
const ratings = [];
const notifications = [];
const progressRecords = [];
const resources = [];
const emailLogs = [];
const forumPosts = [];
const forumComments = [];
const ssoTokens = {};

// Mock Data for Integrations
const datacoreRecords = [
    { studentId: '2012345', name: 'Nguyen Van A', email: 'a.nguyen@hcmut.edu.vn', faculty: 'Computer Science', year: 2020, verified: true },
    { studentId: '2012346', name: 'Tran Thi B', email: 'b.tran@hcmut.edu.vn', faculty: 'Electrical Engineering', year: 2021, verified: true },
    { studentId: '2012347', name: 'Le Van C', email: 'c.le@hcmut.edu.vn', faculty: 'Mechanical Engineering', year: 2019, verified: true }
];

const libraryResources = [
    { id: 1, title: 'Introduction to Algorithms', author: 'Cormen et al.', category: 'Computer Science', available: true, link: 'http://library.hcmut.edu.vn/book/1' },
    { id: 2, title: 'Physics for Scientists', author: 'Serway', category: 'Physics', available: true, link: 'http://library.hcmut.edu.vn/book/2' },
    { id: 3, title: 'Calculus Early Transcendentals', author: 'Stewart', category: 'Mathematics', available: true, link: 'http://library.hcmut.edu.vn/book/3' },
    { id: 4, title: 'Data Structures and Algorithms in Java', author: 'Goodrich', category: 'Computer Science', available: false, link: 'http://library.hcmut.edu.vn/book/4' }
];

module.exports = {
    users,
    courses,
    sessions,
    ratings,
    notifications,
    progressRecords,
    resources,
    emailLogs,
    forumPosts,
    forumComments,
    ssoTokens,
    datacoreRecords,
    libraryResources
};
