# Phân tích Stakeholders - Dự án TutorPro

## So sánh giữa Yêu cầu và Dự án hiện tại

### ĐÃ CÓ (Implemented)

#### 1. **Sinh viên (Student)**
- [DONE] Đăng nhập dễ dàng (Login/Register)
- [DONE] Đăng ký khóa học (Course enrollment)
- [DONE] Xem danh sách khóa học có sẵn
- [DONE] Chat với tutor đã enroll
- [DONE] Dashboard riêng với courses đã enroll
- **THIẾU:**
  - Chức năng SSO (HCMUT_SSO integration)
  - Đăng ký/huỷ/chỉnh sửa lịch học
  - Nhận thông báo tự động
  - Ghép cặp tutor tự động (AI-based)
  - Phản hồi và đánh giá buổi học
  - Tài nguyên học tập từ HCMUT_Library

#### 2. **Tutor**
- [DONE] Tạo và quản lý khóa học
- [DONE] Chat với học sinh đã enroll
- [DONE] Dashboard riêng để quản lý courses
- **THIẾU:**
  - Theo dõi tiến độ sinh viên chi tiết
  - Ghi nhận kết quả buổi học
  - Tham gia cộng đồng trao đổi
  - Quản lý lịch học
  - Xem báo cáo học sinh

#### 3. **Admin/Phòng đào tạo/Khoa**
- [DONE] Quản lý người dùng (xem, xóa)
- [DONE] Xem thống kê tổng hợp (users, courses, enrollments)
- [DONE] Phân quyền truy cập hệ thống (role-based)
- [DONE] Chat với tất cả users
- **THIẾU:**
  - Báo cáo chi tiết hơn (progress, attendance)
  - Đánh giá chất lượng hoạt động
  - Export reports
  - Analytics dashboard nâng cao

### CHƯA CÓ (Missing Components)

#### 4. **HCMUT_SSO**
- [MISSING] Không có tích hợp SSO
- [MISSING] Đang dùng JWT authentication riêng
- **Cần thêm:**
  - OAuth2/SAML integration
  - SSO login flow
  - Token exchange với HCMUT_SSO

#### 5. **HCMUT_Datacore**
- [MISSING] Không có kết nối database trường
- [MISSING] Đang dùng in-memory database
- **Cần thêm:**
  - API integration với Datacore
  - Sync thông tin sinh viên/giảng viên
  - Verify student/tutor credentials

#### 6. **HCMUT_Library**
- [MISSING] Không có tích hợp thư viện
- **Cần thêm:**
  - API connection to library system
  - Resource browser/search
  - Direct links to learning materials

- **Một phần có:**
  - [DONE] AI Tutor chatbot (Q&A)
  - [DONE] AI recommendations (sessions, recommendations endpoints)
- [MISSING] **Thiếu:**
  - Ghép cặp tutor-student thông minh
  - Gợi ý học tập cá nhân hóa dựa trên progress
  - Phân tích learning patterns

---


1. Authentication & Authorization
2. Role-based Access Control (Student/Tutor/Admin)
3. Course Management
4. Enrollment System
5. Real-time Chat (với enrollment-based restrictions)
6. Basic Admin Dashboard
7. AI Chatbot Integration

1. *Schedule Management System*
   - Đăng ký/huỷ/chỉnh sửa lịch học
   - Calendar view
   - Session booking

2. *Rating & Feedback System*
   - Đánh giá buổi học
   - Review tutor
   - Quality assessment

3. *Notification System*
   - Real-time notifications
   - Email notifications
   - Schedule reminders

4. *Progress Tracking*
   - Student progress dashboard
   - Attendance tracking
   - Learning analytics

5. **AI-based Tutor Matching**
   - Smart pairing algorithm
   - Skill/subject matching
   - Availability matching

6. **Advanced Reporting**
   - Detailed analytics
   - Export reports (PDF/Excel)
   - Performance metrics

7. **Resource Management**
   - Upload/share learning materials
   - Document library
   - Integration with HCMUT_Library

8. *HCMUT_SSO Integration*
   - SSO authentication
   - Auto-sync accounts

9. *HCMUT_Datacore Integration*
   - Student/staff verification
   - Auto-import profiles

10. *Community Features*
    - Discussion forums
    - Tutor collaboration space
    - Knowledge sharing

---

## Kết luận

### **Có đủ stakeholders cơ bản:** CÓ
- Sinh viên [DONE]
- Tutor [DONE]
- Admin [DONE]

### **Đáp ứng đầy đủ nhu cầu:** CHƯA (khoảng 40-50%)

#### Các nhu cầu đã đáp ứng:
- Authentication & User Management
- Basic Course Management
- Chat Communication
- Role-based Permissions
- Basic Dashboard & Stats
- AI Q&A Support

#### Các nhu cầu còn thiếu:
- SSO Integration
- Schedule/Calendar Management
- Rating & Feedback System
- Notification System
- Progress Tracking
- AI-based Matching
- External System Integrations (SSO, Datacore, Library)
- Advanced Analytics & Reporting

---

## Khuyến nghị

### Để đáp ứng đầy đủ yêu cầu stakeholders, cần bổ sung:

1. **Phase 1 - Core Features** (2-3 tuần)
   - Schedule Management System
   - Rating & Feedback
   - Notification System
   - Progress Tracking

2. **Phase 2 - AI Enhancement** (1-2 tuần)
   - AI-based Tutor Matching
   - Personalized Recommendations
   - Learning Path Suggestions

3. **Phase 3 - Integrations** (3-4 tuần)
   - HCMUT_SSO
   - HCMUT_Datacore
   - HCMUT_Library
   - Advanced Analytics

**Tổng thời gian ước tính:** 6-9 tuần để hoàn thiện đầy đủ

