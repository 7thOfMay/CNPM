const request = require('supertest');
const { app } = require('../src/index');
const { users, courses, tutorSelections } = require('../src/models/dataStore');

describe('Tutor Selection Endpoints', () => {
    let studentToken;
    let studentId;
    let courseId;
    let tutorId;

    beforeAll(async () => {
        // Register a new student
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'match_test_student',
                email: 'match_test@student.com',
                password: 'password123',
                role: 'student'
            });
            
        studentToken = registerRes.body.token;
        studentId = registerRes.body.user.id;
        
        // Use existing course and tutor
        courseId = 5; // Intro to Computing (subject: programming)
        tutorId = 2; // tutor_demo (skills: C++, Java, Python)
    });

    it('should list available tutors for a course', async () => {
        const res = await request(app)
            .get(`/api/match/course/${courseId}/tutors`)
            .set('Authorization', `Bearer ${studentToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.tutors).toBeDefined();
        expect(Array.isArray(res.body.tutors)).toBe(true);
        expect(res.body.tutors.length).toBeGreaterThan(0);
        
        // Check if tutor_demo is in the list
        const tutor = res.body.tutors.find(t => t.id === tutorId);
        expect(tutor).toBeDefined();
        expect(tutor.username).toBe('tutor_demo');
    });

    it('should select a tutor manually', async () => {
        // Ensure no previous selection
        const index = tutorSelections.findIndex(s => s.studentId === studentId && s.courseId === courseId);
        if (index !== -1) tutorSelections.splice(index, 1);

        const res = await request(app)
            .post(`/api/match/course/${courseId}/select`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ tutorId });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Tutor selected successfully');
        expect(res.body.selection.tutorId).toBe(tutorId);
    });

    it('should reject duplicate selection', async () => {
        const res = await request(app)
            .post(`/api/match/course/${courseId}/select`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ tutorId });
        
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('already selected');
    });

    it('should auto-select a tutor', async () => {
        // Clear selection first
        const index = tutorSelections.findIndex(s => s.studentId === studentId && s.courseId === courseId);
        if (index !== -1) tutorSelections.splice(index, 1);

        const res = await request(app)
            .post(`/api/match/course/${courseId}/auto-select`)
            .set('Authorization', `Bearer ${studentToken}`);
        
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Tutor auto-selected successfully');
        expect(res.body.tutor).toBeDefined();
        expect(res.body.selection).toBeDefined();
    });
});
