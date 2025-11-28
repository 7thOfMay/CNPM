const request = require('supertest');
const { app } = require('../src/index');

describe('Rating Endpoints', () => {
    let tutorToken, studentToken, tutorId, studentId, sessionId, courseId;

    beforeAll(async () => {
        // 1. Register Tutor
        const tutorRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'ratingtutor',
                email: 'ratingtutor@example.com',
                password: 'password123',
                role: 'tutor'
            });
        tutorToken = tutorRes.body.token;
        tutorId = tutorRes.body.user.id;

        // 2. Register Student
        const studentRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'ratingstudent',
                email: 'ratingstudent@example.com',
                password: 'password123',
                role: 'student'
            });
        studentToken = studentRes.body.token;
        studentId = studentRes.body.user.id;

        // 3. Create Course
        const courseRes = await request(app)
            .post('/api/courses')
            .set('Authorization', `Bearer ${tutorToken}`)
            .send({
                title: 'Rating Test Course',
                subject: 'math',
                level: 'beginner'
            });
        courseId = courseRes.body.id;

        // 4. Create Session
        const sessionRes = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${tutorToken}`)
            .send({
                courseId: courseId,
                date: new Date().toISOString().split('T')[0], // Needs date field
                startTime: '10:00',
                endTime: '11:00',
                maxStudents: 5,
                type: 'one-time'
            });
        sessionId = sessionRes.body.sessions[0].id;

        // 5. Book Session
        await request(app)
            .post(`/api/sessions/${sessionId}/book`)
            .set('Authorization', `Bearer ${studentToken}`);
    });

    describe('POST /api/ratings', () => {
        it('should allow student to rate a booked session', async () => {
            const response = await request(app)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    sessionId: sessionId,
                    criteria: {
                        communication: 9,
                        expertise: 10,
                        punctuality: 8
                    },
                    comment: 'Great session!'
                });

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('message', 'Rating submitted successfully');
            expect(response.body.rating).toHaveProperty('studentId', studentId);
            expect(response.body.rating.criteria.communication).toBe(9);
        });

        it('should prevent duplicate ratings for the same session', async () => {
            const response = await request(app)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    sessionId: sessionId,
                    criteria: { communication: 5, expertise: 5, punctuality: 5 },
                    comment: 'Duplicate'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toContain('already rated');
        });

        it('should prevent rating a session not booked', async () => {
            // Create another session but don't book it
            const otherSessionRes = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${tutorToken}`)
                .send({
                    courseId: courseId,
                    date: new Date().toISOString().split('T')[0],
                    startTime: '12:00',
                    endTime: '13:00',
                    maxStudents: 5,
                    type: 'one-time'
                });
            const otherSessionId = otherSessionRes.body.sessions[0].id;

            const response = await request(app)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    sessionId: otherSessionId,
                    criteria: { communication: 5, expertise: 5, punctuality: 5 },
                    comment: 'Not booked'
                });

            expect(response.statusCode).toBe(403);
            expect(response.body.error).toContain('You can only rate sessions you have booked');
        });

        it('should validate rating values (0-10)', async () => {
            // Create another session and book it to test validation
            const sessionRes = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${tutorToken}`)
                .send({
                    courseId: courseId,
                    date: new Date().toISOString().split('T')[0],
                    startTime: '14:00',
                    endTime: '15:00',
                    maxStudents: 5,
                    type: 'one-time'
                });
            const newSessionId = sessionRes.body.sessions[0].id;
            
            await request(app)
                .post(`/api/sessions/${newSessionId}/book`)
                .set('Authorization', `Bearer ${studentToken}`);

            const response = await request(app)
                .post('/api/ratings')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    sessionId: newSessionId,
                    criteria: { communication: 11, expertise: 5, punctuality: 5 }, // Invalid value
                    comment: 'Invalid'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toContain('between 0 and 10');
        });
    });

    describe('GET /api/ratings/my-ratings', () => {
        it('should return ratings for the tutor', async () => {
            const response = await request(app)
                .get('/api/ratings/my-ratings')
                .set('Authorization', `Bearer ${tutorToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('ratings');
            expect(response.body).toHaveProperty('averages');
            expect(response.body.ratings.length).toBeGreaterThan(0);
            expect(response.body.averages).toHaveProperty('overall');
            expect(response.body.averages).toHaveProperty('communication');
        });

        it('should deny access to students', async () => {
            const response = await request(app)
                .get('/api/ratings/my-ratings')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.statusCode).toBe(403);
        });
    });
});
