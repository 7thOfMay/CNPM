const request = require('supertest');
const { app, server } = require('../src/index');

describe('Authentication Endpoints', () => {

    describe('POST /api/auth/register', () => {
        it('should register a new student successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                    role: 'student'
                });

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.role).toBe('student');
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should register a tutor successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'tutoruser',
                    email: 'tutor@example.com',
                    password: 'password123',
                    role: 'tutor'
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.user.role).toBe('tutor');
        });

        it('should reject admin role registration', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'adminuser',
                    email: 'admin@example.com',
                    password: 'password123',
                    role: 'admin'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toContain('Invalid role');
        });

        it('should reject invalid role', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'invaliduser',
                    email: 'invalid@example.com',
                    password: 'password123',
                    role: 'superuser'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toContain('Invalid role');
        });

        it('should reject registration with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject registration with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'test2@example.com',
                    password: '123',
                    role: 'student'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toContain('at least 6 characters');
        });

        it('should reject duplicate email registration', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'user1',
                    email: 'duplicate@example.com',
                    password: 'password123',
                    role: 'student'
                });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'user2',
                    email: 'duplicate@example.com',
                    password: 'password456',
                    role: 'student'
                });

            expect(response.statusCode).toBe(409);
            expect(response.body.error).toContain('already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeAll(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'loginuser',
                    email: 'login@example.com',
                    password: 'password123',
                    role: 'student'
                });
        });

        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should reject login with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toContain('Tài khoản hoặc mật khẩu không hợp lệ');
        });

        it('should reject login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toContain('Tài khoản hoặc mật khẩu không hợp lệ');
        });

        it('should reject login with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com'
                });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('GET /api/auth/me', () => {
        let authToken;

        beforeAll(async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'meuser',
                    email: 'me@example.com',
                    password: 'password123',
                    role: 'student'
                });
            authToken = response.body.token;
        });

        it('should return user info with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.email).toBe('me@example.com');
            expect(response.body).not.toHaveProperty('password');
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.statusCode).toBe(401);
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalidtoken123');

            expect(response.statusCode).toBe(401);
        });
    });
});

describe('Role-Based Access Control', () => {
    let studentToken, tutorToken, adminToken;

    beforeAll(async () => {
        const student = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'student1',
                email: 'student1@example.com',
                password: 'password123',
                role: 'student'
            });
        studentToken = student.body.token;

        const tutor = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'tutor1',
                email: 'tutor1@example.com',
                password: 'password123',
                role: 'tutor'
            });
        tutorToken = tutor.body.token;

        const admin = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@tutorpro.com',
                password: 'admin123'
            });
        adminToken = admin.body.token;
    });

    describe('Admin-only endpoints', () => {
        it('should allow admin to access /api/users', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('users');
        });

        it('should deny student access to /api/users', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.statusCode).toBe(403);
            expect(response.body.error).toContain('Access denied');
        });

        it('should allow admin to access /api/admin/stats', async () => {
            const response = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('totalUsers');
            expect(response.body).toHaveProperty('totalCourses');
            expect(response.body).toHaveProperty('usersByRole');
        });

        it('should deny tutor access to /api/admin/stats', async () => {
            const response = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${tutorToken}`);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Tutor endpoints', () => {
        it('should allow tutor to create course', async () => {
            const response = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${tutorToken}`)
                .send({
                    title: 'Test Course',
                    subject: 'math',
                    level: 'beginner'
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.title).toBe('Test Course');
            expect(response.body).toHaveProperty('tutorId');
        });

        it('should deny student from creating course', async () => {
            const response = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    title: 'Student Course',
                    subject: 'math',
                    level: 'beginner'
                });

            expect(response.statusCode).toBe(403);
        });

        it('should allow admin to create course', async () => {
            const response = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Admin Course',
                    subject: 'science',
                    level: 'advanced'
                });

            expect(response.statusCode).toBe(201);
        });

        it('should allow tutor to view their courses', async () => {
            const response = await request(app)
                .get('/api/courses/my-courses')
                .set('Authorization', `Bearer ${tutorToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('courses');
        });

        it('should deny tutor from enrolling in courses', async () => {
            const response = await request(app)
                .post('/api/courses/1/enroll')
                .set('Authorization', `Bearer ${tutorToken}`);

            expect(response.statusCode).toBe(403);
        });
    });

    describe('Student-only endpoints', () => {
        it('should allow student to enroll in courses', async () => {
            const response = await request(app)
                .post('/api/courses/1/enroll')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.statusCode).toBe(200);
        });

        it('should deny admin from enrolling in courses', async () => {
            const response = await request(app)
                .post('/api/courses/1/enroll')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.statusCode).toBe(403);
        });
    });
});

describe('Course Endpoints', () => {

    describe('GET /api/courses', () => {
        it('should return all courses', async () => {
            const response = await request(app)
                .get('/api/courses');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('courses');
            expect(Array.isArray(response.body.courses)).toBe(true);
            expect(response.body.courses.length).toBeGreaterThan(0);
        });

        it('should filter courses by subject', async () => {
            const response = await request(app)
                .get('/api/courses?subject=math');

            expect(response.statusCode).toBe(200);
            expect(response.body.courses.every(c => c.subject === 'math')).toBe(true);
        });

        it('should filter courses by level', async () => {
            const response = await request(app)
                .get('/api/courses?level=beginner');

            expect(response.statusCode).toBe(200);
            expect(response.body.courses.every(c => c.level === 'beginner')).toBe(true);
        });
    });

    describe('GET /api/courses/:id', () => {
        it('should return a specific course', async () => {
            const response = await request(app)
                .get('/api/courses/1');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('id', 1);
            expect(response.body).toHaveProperty('title');
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .get('/api/courses/999');

            expect(response.statusCode).toBe(404);
        });
    });

    describe('POST /api/courses/:id/enroll', () => {
        let authToken;

        beforeAll(async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'enrolluser',
                    email: 'enroll@example.com',
                    password: 'password123',
                    role: 'student'
                });
            authToken = response.body.token;
        });

        it('should enroll user in course with valid token', async () => {
            const response = await request(app)
                .post('/api/courses/1/enroll')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('course');
            expect(response.body).toHaveProperty('syncedData');
        });

        it('should reject enrollment without token', async () => {
            const response = await request(app)
                .post('/api/courses/1/enroll');

            expect(response.statusCode).toBe(401);
        });

        it('should return 404 for non-existent course', async () => {
            const response = await request(app)
                .post('/api/courses/999/enroll')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(404);
        });

        it('should sync user data from Datacore upon enrollment', async () => {
            // 1. Register a user that exists in Datacore
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'sync_test_user',
                    email: 'a.nguyen@hcmut.edu.vn', // Exists in Datacore
                    password: 'password123',
                    role: 'student'
                });
            
            const token = registerResponse.body.token;

            // 2. Enroll in a course
            const response = await request(app)
                .post('/api/courses/1/enroll')
                .set('Authorization', `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('syncedData');
            expect(response.body.syncedData.fullName).toBe('Nguyen Van A');
            expect(response.body.syncedData.faculty).toBe('Computer Science');
            expect(response.body.syncedData.studentId).toBe('2012345');
        });
    });
});

describe('Health Check', () => {

    it('should return healthy status', async () => {
        const response = await request(app)
            .get('/health');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('status', 'healthy');
        expect(response.body).toHaveProperty('service', 'backend');
        expect(response.body).toHaveProperty('timestamp');
    });
});
