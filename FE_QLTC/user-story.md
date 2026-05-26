# User Stories

## Mục đích tài liệu

Tài liệu này tổng hợp lại user stories và admin stories của dự án theo hướng ưu tiên triển khai.  
Mỗi story gồm 3 phần:
- Mô tả nghiệp vụ theo format user story.
- Dòng suy ra kỹ thuật với ký hiệu `→`.
- Chú thích mức độ ưu tiên: `core`, `scale`, hoặc `optional`.

## Quy ước ưu tiên

- `core`: Chức năng cốt lõi, cần ưu tiên trong 1 tháng đầu.
- `scale`: Nên triển khai sau khi các luồng chính đã ổn định.
- `optional`: Chức năng mở rộng cho giai đoạn sau.

---

## 1. User Stories

### 1.1. Core User Stories

1. As a user, I want to register and login to the app so that I can securely access my personal finance data. (core)  
   → (API: User registration, login, access token, JWT-based authentication, password hashing, profile bootstrap)

2. As a user, I want to complete an initial onboarding survey so that the system can understand my spending habits and suggest appropriate jars and categories. (core)  
   → (API: Submit onboarding survey, save onboarding answers, return initial jar/category recommendations)

3. As a user, I want to view my profile and basic financial setup so that I can understand what information the system is using for budgeting. (core)  
   → (API: Get/update user profile, onboarding summary, preferred budgeting settings)

4. As a user, I want to create, edit, delete, and view my spending jars so that I can allocate money to different spending purposes and goals. (core)  
   → (API: CRUD jars, jar balance summary, jar status validation)

5. As a user, I want to allocate money into jars and transfer money between jars so that my budget is reflected correctly across spending purposes. (core)  
   → (API: Allocate funds to jar, transfer funds between jars, transaction-safe balance update, transfer history)

6. As a user, I want to record income and expense transactions so that I can track every money movement accurately and quickly. (core)  
   → (API: CRUD transactions, income/expense type handling, ownership validation, transaction-to-jar/category mapping)

7. As a user, I want to view my transaction history with search and filters so that I can easily review past spending. (core)  
   → (API: Get transaction list with filters by date, type, jar, category, keyword, pagination)

8. As a user, I want to import a bank statement file and review parsed transactions before saving so that I can add many transactions quickly without entering them one by one. (core)  
   → (API: Upload statement file, parse imported data, preview parsed transactions, confirm import, import job status)

9. As a user, I want to use default categories provided by admin or create my own custom categories so that categorizing transactions is standardized and convenient. (core)  
   → (API: Get default categories, CRUD custom categories, category ownership rules, category assignment to transactions)

10. As a user, I want to view my personal dashboard so that I can see total balance, spending charts, recent transactions, and jar status at a glance. (core)  
    → (API: Get user dashboard metrics, current balance summary, recent transactions, spending by category/jar, goal progress snapshot)

11. As a user, I want to set spending limits for each jar or category so that I can control my budget by day or month. (core)  
    → (API: CRUD spending limits, daily/monthly period configuration, limit-to-jar/category mapping)

12. As a user, I want to set up spending alerts so that I receive warnings when I am close to or have exceeded my limit. (core)  
    → (API: Configure alert thresholds, evaluate budget thresholds on transaction change, create alert notifications)

13. As a user, I want to view my notification inbox so that I can see system alerts, spending warnings, reminders, and broadcast messages from admin. (core)  
    → (API: Get user notifications, filter by type/status, pagination, notification delivery records)

14. As a user, I want to mark notifications/alerts as read so that I can manage my alert inbox more clearly. (core)  
    → (API: Mark notification as read/unread, unread counter refresh)

15. As a user, I want to set financial goals so that I can track progress toward savings targets over a flexible period. (core)  
    → (API: CRUD financial goals, target amount, due date, progress summary, goal status tracking)

16. As a user, I want to contribute money from my balance or jars into a financial goal so that my saving progress is recorded over time. (core)  
    → (API: Add contribution to goal, deduct related balance source, contribution history, progress recalculation)

17. As a user, I want to view goal progress and the amount I should save periodically so that I know whether I am on track. (core)  
    → (API: Get goal progress, suggested periodic contribution (AI/rule-based), remaining amount and remaining time calculation)

18. As a user, I want to set recurring payment reminders so that I do not miss bills such as rent, tuition, subscriptions, or debt payments. (core)  
    → (API: CRUD recurring reminders, scheduler job, notification trigger for due reminders)

### 1.2. Scale User Stories

1. As a user, I want to upload a receipt photo so that the system can automatically extract the amount, category, date, and description using OCR. (scale)  
   → (API: Upload receipt image, OCR processing, extracted transaction draft, editable review before save)

2. As a user, I want to review and edit OCR or imported transaction drafts before final save so that extraction mistakes do not create incorrect records. (scale)  
   → (API: Get extracted draft, edit extracted fields, confirm final transaction creation)

3. As a user, I want to receive AI-powered advice based on my spending pattern so that I can manage money more effectively. (scale)  
   → (API: Generate spending insights, AI/rule-based recommendation engine, recommendation history storage)

4. As a user, I want to receive suggested saving plans for my financial goals so that I can follow a realistic path to complete them. (scale)  
   → (API: Generate goal plans, monthly saving suggestion logic, AI-assisted or rule-based planning output)

5. As a user, I want to export my transaction history so that I can store or review my financial data outside the system when needed. (scale)  
   → (API: Export transaction history to CSV/XLSX, filtered export, async export job if needed)

### 1.3. Optional User Stories

1. As a user, I want to link my bank account so that I can sync balance and transactions automatically if external integration is supported later. (optional)  
   → (API: Link bank account, bank token management, sync transactions, integration status tracking)

2. As a user, I want to invite friends or family to join a shared jar so that we can manage common expenses together. (optional)  
   → (API: Create shared jar, invite members, member permissions, shared transaction visibility)

3. As a user, I want to chat with an AI assistant about my spending so that I can ask questions and receive interactive financial guidance. (optional)  
   → (API: Chat session, prompt context assembly, AI response generation, message history storage)

---

## 2. Admin Stories

### 2.1. Core Admin Stories

1. As an admin, I want to log in to the admin portal so that I can manage the system securely. (core)  
   → (API: Admin login, admin JWT/session, role-based authorization, protected admin routes)

2. As an admin, I want to view and search users so that I can quickly find specific accounts to support operations. (core)  
   → (API: Get user list with filters, keyword search, pagination, user status summary)

3. As an admin, I want to view user account details so that I can support account-related issues more effectively. (core)  
   → (API: Get user detail summary, onboarding info, jar count, transaction summary, account status)

4. As an admin, I want to lock or unlock a user account so that I can prevent abusive or suspicious activities. (core)  
   → (API: Ban/unban users, status update, moderation reason, moderation audit trail)

5. As an admin, I want to manage default categories so that new users have a standardized spending setup from the beginning. (core)  
   → (API: CRUD default categories, category activation status, ordering, soft delete if needed)

6. As an admin, I want to send broadcast notifications so that I can announce maintenance, alerts, or new features to all users. (core)  
   → (API: Create/send broadcast notification, target audience selection, notification delivery job)

7. As an admin, I want to view notification history so that I can audit past communications. (core)  
   → (API: Get broadcast history, delivery summary, filter by date/type/status)

8. As an admin, I want to view operational dashboard metrics so that I can monitor platform activity at a basic level. (core)  
   → (API: Get admin dashboard metrics including total users, new users, active users, total transactions, recent activity)

9. As an admin, I want important admin actions to be recorded automatically so that sensitive operations can be traced later. (core)  
   → (System/API: Auto-write audit logs for login, ban/unban, category changes, notification sends, settings changes)

10. As an admin, I want to view audit logs so that I can trace sensitive admin actions for investigation and accountability. (core)  
    → (API: Get audit logs with filters by admin, action type, date range, entity type)

11. As an admin, I want to configure AI settings so that the system can control prompt behavior, model usage, and external AI cost. (core)  
    → (API: Get/update AI settings, system prompt config, model selection, API key management with secure storage)

### 2.2. Scale Admin Stories

1. As an admin, I want to manage jar templates so that onboarding recommendations can match different user profiles. (scale)  
   → (API: CRUD jar templates, template-category allocation rules, template recommendation mapping)

2. As an admin, I want to configure spending insight rules so that the system can provide more relevant financial suggestions even without complex AI logic. (scale)  
   → (API: CRUD insight rules, rule conditions, rule outputs, enable/disable insight strategies)

3. As an admin, I want to filter dashboard data by time range so that I can analyze platform trends for specific periods. (scale)  
   → (API: Dashboard metrics with fromDate/toDate filters, reusable aggregation queries)

4. As an admin, I want to compare the current period with the previous period so that I can evaluate growth and performance changes more clearly. (scale)  
   → (API: Period comparison metrics, delta and growth-rate calculation)

5. As an admin, I want to view total users, new users, and active users over time so that I can track platform growth more clearly. (scale)  
   → (API: User growth metrics by date range, grouped aggregation)

6. As an admin, I want to view total transactions and daily transaction volume so that I can monitor business activity in near real time. (scale)  
   → (API: Transaction volume metrics by date, aggregation and chart-ready response)

7. As an admin, I want to view top spending categories across users so that I can understand common financial behavior patterns. (scale)  
   → (API: Top categories metrics across anonymized aggregated user data)

8. As an admin, I want to review failed OCR or import jobs so that I can investigate processing issues early. (scale)  
   → (API: Get OCR/import job logs, job status summary, error reason tracking)

9. As an admin, I want to view system integration error rates so that I can detect OCR, notification, and sync incidents early. (scale)  
   → (API: Get integration health metrics, failure rate by service, incident trend data)

### 2.3. Optional Admin Stories

1. As an admin, I want to view DAU, WAU, and MAU so that I can measure product engagement quality. (optional)  
   → (API: Engagement metrics aggregation, active user event tracking)

2. As an admin, I want to view recent active users so that I can quickly identify current usage behavior. (optional)  
   → (API: Get recent active users, latest session/activity data)

3. As an admin, I want to view traffic and login trends by date so that I can detect unusual spikes or drops in access. (optional)  
   → (API: Access and login trends, daily event aggregation, anomaly-friendly dataset)

4. As an admin, I want to export dashboard reports so that I can share performance insights with stakeholders. (optional)  
   → (API: Export dashboard report CSV/XLSX, async report generation, downloadable file storage)

5. As an admin, I want to view the number of banned users and unban actions so that I can track moderation effectiveness. (optional)  
   → (API: Moderation metrics, ban/unban counts by period)

6. As an admin, I want to view retention and churn metrics so that I can evaluate whether users keep using the product after onboarding. (optional)  
   → (API: Retention/churn metrics, cohort calculation, date-based usage analysis)

---

## 3. Gợi ý chốt scope 1 tháng

Nếu ưu tiên triển khai trong 1 tháng đầu, nhóm nên tập trung hoàn thiện trước các story `core`, đặc biệt là các luồng:
- Xác thực người dùng và quản trị.
- Onboarding.
- Quản lý hũ, giao dịch, danh mục.
- Dashboard cá nhân.
- Hạn mức và cảnh báo.
- Mục tiêu tiết kiệm.
- Import sao kê.
- Quản trị người dùng và thông báo hệ thống.
- API chatbot ở mức MVP nếu còn đủ nguồn lực sau khi các luồng core đã ổn định.

## 4. Thứ tự ưu tiên team làm

- **P0 - Authentication & Admin Foundation**  
  Đăng ký/đăng nhập user, đăng nhập admin, phân quyền, refresh token (nếu chọn chiến lược này), bootstrap hồ sơ ban đầu, audit log thao tác nhạy cảm.

- **P1 - Onboarding + Financial Setup**  
  Onboarding, hồ sơ người dùng, danh mục mặc định/tùy chỉnh, tạo hũ và thiết lập ngân sách cơ bản.

- **P2 - Transaction Management Core**  
  CRUD giao dịch, lịch sử giao dịch, phân loại theo hũ/danh mục, phân bổ tiền vào hũ, chuyển tiền giữa các hũ.

- **P3 - Personal Dashboard**  
  Tổng quan số dư, giao dịch gần đây, thống kê chi tiêu theo danh mục/hũ, snapshot tiến độ mục tiêu.

- **P4 - Limits, Alerts, Goals**  
  Hạn mức chi tiêu, cảnh báo vượt ngưỡng, hộp thư thông báo, mục tiêu tiết kiệm, đóng góp mục tiêu, theo dõi tiến độ.

- **P5 - Import Statement**  
  Import sao kê, parse dữ liệu, màn hình xem trước, xác nhận import.

- **P6 - Admin User Management & System Notifications**  
  Danh sách user, chi tiết tài khoản, khóa/mở khóa tài khoản, gửi broadcast, lịch sử thông báo, dashboard vận hành cơ bản.

- **P7 - Chatbot API MVP**  
  Chat session, gửi/nhận tin nhắn, lưu lịch sử hội thoại, ghép ngữ cảnh từ dashboard/giao dịch/mục tiêu, cấu hình AI cơ bản phía admin.
