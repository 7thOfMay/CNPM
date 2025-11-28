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
    // Tutors
    { id: 2, username: 'tutor_demo', email: 'tutor_demo@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'tutor', createdAt: new Date().toISOString() },
    { id: 3, username: 'tutor_math', email: 'math@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'tutor', createdAt: new Date().toISOString() },
    { id: 4, username: 'tutor_physics', email: 'physics@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'tutor', createdAt: new Date().toISOString() },
    { id: 5, username: 'tutor_english', email: 'english@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'tutor', createdAt: new Date().toISOString() },
    { id: 6, username: 'tutor_cs_hw', email: 'hardware@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'tutor', createdAt: new Date().toISOString() },
    { id: 7, username: 'tutor_cs_theory', email: 'theory@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'tutor', createdAt: new Date().toISOString() },
    { id: 8, username: 'tutor_general', email: 'general@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'tutor', createdAt: new Date().toISOString() },
    
    // Students
    { id: 100, username: 'student_demo', email: 'student_demo@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 101, username: 'student_1', email: 'student1@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 102, username: 'student_2', email: 'student2@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 103, username: 'student_3', email: 'student3@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 104, username: 'student_4', email: 'student4@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 105, username: 'student_5', email: 'student5@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 106, username: 'student_6', email: 'student6@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 107, username: 'student_7', email: 'student7@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 108, username: 'student_8', email: 'student8@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 109, username: 'student_9', email: 'student9@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() },
    { id: 110, username: 'student_10', email: 'student10@hcmut.edu.vn', password: '$2a$10$a/7gYlRcekT5S3fQzgPc9uqhZ6b9BQjYampHyNLia6R.TyejOSZKS', role: 'student', createdAt: new Date().toISOString() }
];

const courses = [
    // Semester 1
    { id: 1, title: 'English 1 (LA1003)', subject: 'english', level: 'beginner', enrolled: 5, tutorId: 5, enrolledStudents: [101, 102, 103, 104, 105] },
    { id: 2, title: 'Physical Education (PE001)', subject: 'general', level: 'beginner', enrolled: 5, tutorId: 8, enrolledStudents: [106, 107, 108, 109, 110] },
    { id: 3, title: 'Calculus 1 (MT1003)', subject: 'math', level: 'beginner', enrolled: 5, tutorId: 3, enrolledStudents: [100, 105, 106, 107, 108] }, // student_demo enrolled
    { id: 4, title: 'General Physics 1 (PH1003)', subject: 'physics', level: 'beginner', enrolled: 5, tutorId: 4, enrolledStudents: [101, 102, 103, 109, 110] },
    { id: 5, title: 'Introduction to Computing (CO1005)', subject: 'programming', level: 'beginner', enrolled: 5, tutorId: 2, enrolledStudents: [100, 101, 102, 103, 104] }, // student_demo enrolled, tutor_demo teaches
    { id: 6, title: 'Digital Systems (CO1023)', subject: 'hardware', level: 'beginner', enrolled: 5, tutorId: 6, enrolledStudents: [105, 106, 107, 108, 109] },

    // Semester 2
    { id: 7, title: 'English 2 (LA1005)', subject: 'english', level: 'intermediate', enrolled: 5, tutorId: 5, enrolledStudents: [101, 103, 105, 107, 109] },
    { id: 8, title: 'Physical Education 2 (PE002)', subject: 'general', level: 'beginner', enrolled: 5, tutorId: 8, enrolledStudents: [102, 104, 106, 108, 110] },
    { id: 9, title: 'Calculus 2 (MT1005)', subject: 'math', level: 'intermediate', enrolled: 5, tutorId: 3, enrolledStudents: [101, 102, 103, 104, 105] },
    { id: 10, title: 'Linear Algebra (MT1007)', subject: 'math', level: 'intermediate', enrolled: 5, tutorId: 3, enrolledStudents: [106, 107, 108, 109, 110] },
    { id: 11, title: 'Discrete Structures (CO1007)', subject: 'theory', level: 'intermediate', enrolled: 5, tutorId: 7, enrolledStudents: [101, 102, 103, 104, 105] },
    { id: 12, title: 'Programming Fundamentals (CO1027)', subject: 'programming', level: 'intermediate', enrolled: 5, tutorId: 2, enrolledStudents: [100, 106, 107, 108, 109] }, // student_demo enrolled, tutor_demo teaches
    { id: 13, title: 'General Physics Labs (PH1007)', subject: 'physics', level: 'beginner', enrolled: 5, tutorId: 4, enrolledStudents: [101, 103, 105, 107, 109] },
    { id: 14, title: 'Military Training (MI1003)', subject: 'general', level: 'beginner', enrolled: 5, tutorId: 8, enrolledStudents: [102, 104, 106, 108, 110] },

    // Semester 3
    { id: 15, title: 'English 3 (LA1007)', subject: 'english', level: 'advanced', enrolled: 5, tutorId: 5, enrolledStudents: [101, 102, 103, 104, 105] },
    { id: 16, title: 'Marxist - Leninist Philosophy (SP1031)', subject: 'general', level: 'intermediate', enrolled: 5, tutorId: 8, enrolledStudents: [106, 107, 108, 109, 110] },
    { id: 17, title: 'Computer Architecture (CO2007)', subject: 'hardware', level: 'advanced', enrolled: 5, tutorId: 6, enrolledStudents: [101, 103, 105, 107, 109] },
    { id: 18, title: 'Mathematical Modeling (CO2011)', subject: 'math', level: 'advanced', enrolled: 5, tutorId: 8, enrolledStudents: [102, 104, 106, 108, 110] },
    { id: 19, title: 'Data Structures and Algorithms (CO2003)', subject: 'theory', level: 'advanced', enrolled: 5, tutorId: 7, enrolledStudents: [101, 102, 103, 104, 105] }
];

// Helper to generate dates
const getFutureDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const sessions = [
    {
        id: 1,
        courseId: 5, // Intro to Computing
        tutorId: 2, // tutor_demo
        date: getFutureDate(1), // Tomorrow
        startTime: '08:00',
        endTime: '10:00',
        maxStudents: 20,
        location: 'Online (Zoom)',
        description: 'Introduction to C++ Syntax and Basic Types',
        status: 'scheduled',
        bookedStudents: [100, 101, 102] // student_demo booked
    },
    {
        id: 2,
        courseId: 12, // Programming Fundamentals
        tutorId: 2, // tutor_demo
        date: getFutureDate(3), // In 3 days
        startTime: '13:00',
        endTime: '15:00',
        maxStudents: 15,
        location: 'Room H6-101',
        description: 'Deep dive into Pointers and Memory Management',
        status: 'scheduled',
        bookedStudents: [100, 106] // student_demo booked
    },
    {
        id: 3,
        courseId: 3, // Calculus 1
        tutorId: 3, // tutor_math
        date: getFutureDate(5), // In 5 days
        startTime: '09:00',
        endTime: '11:00',
        maxStudents: 30,
        location: 'Online (Teams)',
        description: 'Review of Limits and Continuity',
        status: 'scheduled',
        bookedStudents: [100, 105] // student_demo booked
    },
    {
        id: 4,
        courseId: 5, // Intro to Computing
        tutorId: 2, // tutor_demo
        date: getFutureDate(7), // Next week
        startTime: '08:00',
        endTime: '10:00',
        maxStudents: 20,
        location: 'Online (Zoom)',
        description: 'Control Flow: Loops and Conditionals',
        status: 'scheduled',
        bookedStudents: [101, 102] // student_demo NOT booked (available to book)
    }
];

const ratings = [
    { id: 1, tutorId: 2, rating: 5, comment: "Great explanation of loops!" },
    { id: 2, tutorId: 2, rating: 4, comment: "Very helpful with C++ syntax." },
    { id: 3, tutorId: 3, rating: 5, comment: "Calculus made easy." }
];
const notifications = [];

// Generate progress records for all enrolled students
const progressRecords = [];
let recordId = 1;

courses.forEach(course => {
    course.enrolledStudents.forEach(studentId => {
        // Random grade between 5.0 and 10.0
        const grade = (Math.random() * 5 + 5).toFixed(1);
        progressRecords.push({
            id: recordId++,
            studentId: studentId,
            courseId: course.id,
            grade: parseFloat(grade),
            semester: course.id <= 6 ? 'HK1' : (course.id <= 14 ? 'HK2' : 'HK3'),
            completed: true
        });
    });
});

const resources = [];
const emailLogs = [];
const forumPosts = [];
const forumComments = [];
const ssoTokens = {};
const loginAttempts = {};

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
