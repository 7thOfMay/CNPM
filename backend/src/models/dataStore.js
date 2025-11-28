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
    },
    {
        id: 2,
        username: 'math_tutor',
        email: 'math@tutor.com',
        password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS',
        role: 'tutor',
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        username: 'science_tutor',
        email: 'science@tutor.com',
        password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS',
        role: 'tutor',
        createdAt: new Date().toISOString()
    },
    {
        id: 4,
        username: 'coding_tutor',
        email: 'code@tutor.com',
        password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS',
        role: 'tutor',
        createdAt: new Date().toISOString()
    },
    {
        id: 5,
        username: 'student_user',
        email: 'student@hcmut.edu.vn',
        password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', // admin123 (same hash for simplicity)
        role: 'student',
        createdAt: new Date().toISOString()
    }
];

const courses = [
    { id: 1, title: 'Introduction to Mathematics', subject: 'math', level: 'beginner', enrolled: 0, tutorId: 2, enrolledStudents: [] },
    { id: 2, title: 'Advanced Physics', subject: 'science', level: 'advanced', enrolled: 0, tutorId: 3, enrolledStudents: [] },
    { id: 3, title: 'Web Development Basics', subject: 'programming', level: 'beginner', enrolled: 0, tutorId: 4, enrolledStudents: [] },
    { id: 4, title: 'Data Structures', subject: 'programming', level: 'intermediate', enrolled: 0, tutorId: 4, enrolledStudents: [] }
];

const sessions = [];
const ratings = [
    { id: 1, tutorId: 2, rating: 5, comment: "Great tutor!" },
    { id: 2, tutorId: 2, rating: 4, comment: "Good explanation" },
    { id: 3, tutorId: 4, rating: 5, comment: "Excellent coding help" }
];
const notifications = [];
const progressRecords = [];
const resources = [];
const emailLogs = [];
const forumPosts = [];
const forumComments = [];
const ssoTokens = {};
const loginAttempts = {}; // { email: { count: 0, lockUntil: null } }

// Mock Data for Integrations
const datacoreRecords = [
    { studentId: '2012345', name: 'Nguyen Van A', email: 'a.nguyen@hcmut.edu.vn', faculty: 'Computer Science', year: 2020, verified: true, role: 'student' },
    { studentId: '2012346', name: 'Tran Thi B', email: 'b.tran@hcmut.edu.vn', faculty: 'Electrical Engineering', year: 2021, verified: true, role: 'student' },
    { studentId: '2012347', name: 'Le Van C', email: 'c.le@hcmut.edu.vn', faculty: 'Mechanical Engineering', year: 2019, verified: true, role: 'student' },
    { studentId: null, name: 'Dr. Tutor', email: 'tutor@hcmut.edu.vn', faculty: 'Computer Science', year: null, verified: true, role: 'tutor' },
    { studentId: null, name: 'Admin Staff', email: 'admin@hcmut.edu.vn', faculty: 'Academic Affairs', year: null, verified: true, role: 'admin' }
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
    loginAttempts,
    datacoreRecords,
    libraryResources
};
