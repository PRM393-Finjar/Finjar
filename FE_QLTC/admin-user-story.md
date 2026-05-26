# Admin User Stories (Short Format)

- As an admin, I want to log in to the admin portal so that I can manage the system securely.  
  -> (API to admin login)

- As an admin, I want to view and search users so that I can quickly find specific accounts to support operations.  
  -> (API to get user list with filters)

- As an admin, I want to lock or unlock a user account so that I can prevent abuse and restore access when appropriate.  
  -> (API to ban or unban users)

- As an admin, I want to send broadcast notifications so that I can announce maintenance, alerts, or new features to all users.  
  -> (API to create or send broadcast notification)

- As an admin, I want to view notification history so that I can audit past communications.  
  -> (API to get broadcast history)

- As an admin, I want to view operational dashboard metrics so that I can monitor system health and performance.  
  -> (API to get admin dashboard metrics)

- As an admin, I want to manage default categories so that new users have standardized spending setup.  
  -> (API to CRUD default categories)

- As an admin, I want to view audit logs so that I can trace sensitive admin actions for compliance and investigation.  
  -> (API to get audit logs)

## Additional User Stories (Dashboard & Analytics)

- As an admin, I want to view total users, new users, and active users so that I can track platform growth over time.  
  -> (API to get user growth metrics)

- As an admin, I want to view DAU, WAU, and MAU so that I can measure product engagement quality.  
  -> (API to get engagement metrics)

- As an admin, I want to view recent active users so that I can quickly identify current usage behavior.  
  -> (API to get recent active users)

- As an admin, I want to view traffic and login trends by date so that I can detect unusual spikes or drops in access.  
  -> (API to get access and login trends)

- As an admin, I want to view total transactions and daily transaction volume so that I can monitor business activity in near real time.  
  -> (API to get transaction volume metrics)

- As an admin, I want to view top spending categories across users so that I can understand common financial behavior patterns.  
  -> (API to get top spending categories metrics)

- As an admin, I want to view retention and churn metrics so that I can evaluate whether users keep using the product after onboarding.  
  -> (API to get retention and churn metrics)

- As an admin, I want to filter dashboard data by time range so that I can analyze trends for specific periods.  
  -> (API to get dashboard metrics with fromDate and toDate)

- As an admin, I want to compare current period vs previous period so that I can evaluate growth and performance changes clearly.  
  -> (API to get period comparison metrics)

- As an admin, I want to view system integration error rate so that I can detect OCR, notification, and bank sync incidents early.  
  -> (API to get integration health metrics)

- As an admin, I want to export dashboard reports so that I can share performance insights with stakeholders.  
  -> (API to export dashboard report CSV or XLSX)

- As an admin, I want to view the number of banned users and unban actions so that I can track account moderation effectiveness.  
  -> (API to get moderation metrics)
# Admin User Stories (Short Format)

- As an admin, I want to log in to the admin portal so that I can manage the system securely.  
  -> (API to admin login)

- As an admin, I want to view and search users so that I can quickly find specific accounts to support operations.  
  -> (API to get user list with filters)

- As an admin, I want to lock a user account so that I can prevent abusive or suspicious activities.  
  -> (API to lock user account)

- As an admin, I want to unlock a user account so that I can restore access after verification.  
  -> (API to unlock user account)

- As an admin, I want to view support tickets so that I can track and resolve user issues on time.  
  -> (API to get support tickets)

- As an admin, I want to update ticket status so that I can manage the support workflow effectively.  
  -> (API to update ticket status)

- As an admin, I want to reply to a support ticket so that users can receive guidance and resolution updates.  
  -> (API to reply ticket)

- As an admin, I want to send broadcast notifications so that I can announce maintenance, alerts, or new features to all users.  
  -> (API to create or send broadcast notification)

- As an admin, I want to view notification history so that I can audit past communications.  
  -> (API to get broadcast history)

- As an admin, I want to view operational dashboard metrics so that I can monitor system health and performance.  
  -> (API to get admin dashboard metrics)

- As an admin, I want to manage default categories so that new users have standardized spending setup.  
  -> (API to CRUD default categories)

- As an admin, I want to manage jar templates so that onboarding recommendations match user profiles.  
  -> (API to CRUD jar templates)

- As an admin, I want to configure spending insight rules so that the system can provide more relevant financial suggestions.  
  -> (API to CRUD insight rules)

- As an admin, I want to monitor integration errors so that I can detect and respond to OCR, notification, and bank sync failures quickly.  
  -> (API to get integration error logs)

- As an admin, I want to view audit logs so that I can trace sensitive admin actions for compliance and investigation.  
  -> (API to get audit logs)
# User Story - Role Admin (Personal Finance App)

## 1) Mục tiêu vai trò Admin

Admin đảm bảo hệ thống vận hành ổn định, an toàn, hỗ trợ người dùng kịp thời, và tối ưu trải nghiệm tài chính thông qua quản trị user, nội dung thông báo, cấu hình nghiệp vụ cốt lõi, và theo dõi vận hành.

---

## 2) Danh sách Epic cho Admin

- EPIC A: Xác thực & phân quyền quản trị
- EPIC B: Quản lý người dùng
- EPIC C: Quản lý ticket CSKH
- EPIC D: Quản lý thông báo toàn hệ thống
- EPIC E: Dashboard vận hành & báo cáo
- EPIC F: Quản lý danh mục mặc định, template hũ, rule gợi ý
- EPIC G: Giám sát lỗi tích hợp và cơ chế xử lý sự cố
- EPIC H: Audit log & tuân thủ thao tác quản trị

---

## 3) User Stories chi tiết

## EPIC A - Xác thực & phân quyền quản trị

### US-A1 - Đăng nhập Admin
**User Story**  
Là một **Admin**, tôi muốn **đăng nhập vào trang quản trị bằng tài khoản có quyền admin** để **thực hiện các nghiệp vụ quản trị hệ thống**.

**Acceptance Criteria**
- Chỉ tài khoản có role `Admin` mới đăng nhập được trang quản trị.
- Nếu sai thông tin đăng nhập, hệ thống hiển thị lỗi rõ ràng.
- Nếu tài khoản bị khóa, hệ thống từ chối đăng nhập và thông báo lý do.
- Sau đăng nhập thành công, admin được chuyển tới dashboard vận hành.

**Priority**: Must Have

### US-A2 - Phân quyền theo nhóm chức năng
**User Story**  
Là một **Admin trưởng**, tôi muốn **giới hạn quyền theo từng nhóm chức năng cho admin phụ trách** để **tránh thao tác vượt thẩm quyền**.

**Acceptance Criteria**
- Có thể gán quyền theo module (User, Ticket, Broadcast, Rule, Report).
- Admin không có quyền không nhìn thấy hoặc không thao tác được chức năng tương ứng.
- Mọi thay đổi phân quyền được ghi vào audit log.

**Priority**: Should Have

---

## EPIC B - Quản lý người dùng

### US-B1 - Tìm kiếm và xem danh sách người dùng
**User Story**  
Là một **Admin**, tôi muốn **tìm kiếm user theo email/tên/trạng thái** để **xử lý nhanh các yêu cầu vận hành**.

**Acceptance Criteria**
- Hỗ trợ filter theo: trạng thái tài khoản, ngày tạo, mức độ hoạt động.
- Danh sách có phân trang và sắp xếp theo cột cơ bản.
- Hiển thị thông tin tối thiểu: user id, email, tên hiển thị, trạng thái, ngày tạo, lần truy cập gần nhất.

**Priority**: Must Have

### US-B2 - Khóa tài khoản người dùng
**User Story**  
Là một **Admin**, tôi muốn **khóa tài khoản user vi phạm/chạy bất thường** để **bảo vệ hệ thống và các user khác**.

**Acceptance Criteria**
- Admin bắt buộc chọn lý do khóa tài khoản.
- Khi khóa thành công, user không thể đăng nhập.
- Hệ thống gửi thông báo in-app/email cho user về trạng thái bị khóa.
- Hành động khóa và lý do được lưu audit log.

**Priority**: Must Have

### US-B3 - Mở khóa tài khoản người dùng
**User Story**  
Là một **Admin**, tôi muốn **mở khóa tài khoản sau khi user đã xác minh/xử lý xong vấn đề** để **khôi phục quyền sử dụng dịch vụ cho user**.

**Acceptance Criteria**
- Chỉ admin có quyền phù hợp mới được mở khóa.
- Sau mở khóa, user có thể đăng nhập lại bình thường.
- Gửi thông báo cho user khi mở khóa thành công.
- Ghi đầy đủ ai mở khóa, thời điểm mở khóa trong audit log.

**Priority**: Must Have

---

## EPIC C - Quản lý ticket CSKH

### US-C1 - Tiếp nhận và phân loại ticket
**User Story**  
Là một **Admin CSKH**, tôi muốn **xem ticket mới và phân loại mức độ ưu tiên** để **đảm bảo xử lý đúng SLA**.

**Acceptance Criteria**
- Ticket có trạng thái: Open, In Progress, Resolved.
- Có thể gắn mức độ ưu tiên: High, Medium, Low.
- Có thể lọc ticket theo trạng thái, ưu tiên, ngày tạo.
- Ticket mới phải hiển thị trong danh sách xử lý ngay sau khi user tạo.

**Priority**: Must Have

### US-C2 - Phản hồi ticket và cập nhật trạng thái
**User Story**  
Là một **Admin CSKH**, tôi muốn **phản hồi user trong ticket và cập nhật trạng thái xử lý** để **đóng vấn đề minh bạch**.

**Acceptance Criteria**
- Admin có thể gửi phản hồi nhiều lần trong một ticket.
- Khi phản hồi, user nhận thông báo in-app.
- Có thể chuyển trạng thái Open -> In Progress -> Resolved.
- Lưu lịch sử trao đổi theo timeline.

**Priority**: Must Have

---

## EPIC D - Quản lý thông báo toàn hệ thống

### US-D1 - Tạo và gửi broadcast cho toàn bộ user
**User Story**  
Là một **Admin**, tôi muốn **gửi thông báo hệ thống diện rộng** để **truyền thông sự kiện quan trọng (bảo trì, cập nhật tính năng, cảnh báo)**.

**Acceptance Criteria**
- Có thể nhập tiêu đề, nội dung, thời gian gửi.
- Có thể chọn gửi ngay hoặc lên lịch.
- Hệ thống xác nhận số lượng user nhận thông báo.
- Sau khi gửi, trạng thái chiến dịch là Sent/Failed cùng thống kê cơ bản.

**Priority**: Must Have

### US-D2 - Quản lý lịch sử thông báo
**User Story**  
Là một **Admin**, tôi muốn **xem lịch sử các đợt broadcast** để **theo dõi hiệu quả và phục vụ đối soát vận hành**.

**Acceptance Criteria**
- Danh sách hiển thị: tiêu đề, người gửi, thời gian, trạng thái, số lượng nhận.
- Có thể tìm kiếm theo từ khóa và thời gian.
- Có thể xem chi tiết nội dung từng broadcast đã gửi.

**Priority**: Should Have

---

## EPIC E - Dashboard vận hành & báo cáo

### US-E1 - Xem dashboard realtime mức vận hành
**User Story**  
Là một **Admin**, tôi muốn **xem nhanh các chỉ số vận hành trọng yếu** để **phát hiện bất thường và ra quyết định kịp thời**.

**Acceptance Criteria**
- Dashboard có ít nhất các chỉ số: user mới, user active, số giao dịch/ngày, số lỗi tích hợp.
- Cho phép chọn mốc thời gian (ngày/tuần/tháng).
- Dữ liệu làm mới theo chu kỳ gần realtime.
- Nếu có lỗi tăng đột biến, hiển thị cảnh báo trực quan.

**Priority**: Must Have

### US-E2 - Xuất báo cáo vận hành định kỳ
**User Story**  
Là một **Admin**, tôi muốn **xuất báo cáo vận hành theo kỳ** để **phục vụ quản trị nội bộ và review tiến độ dự án**.

**Acceptance Criteria**
- Có thể xuất báo cáo theo khoảng thời gian tùy chọn.
- Báo cáo gồm nhóm chỉ số user, giao dịch, ticket, cảnh báo lỗi.
- Hỗ trợ định dạng tải về cơ bản (CSV hoặc XLSX).

**Priority**: Should Have

---

## EPIC F - Quản lý danh mục mặc định, template hũ, rule gợi ý

### US-F1 - Quản lý danh mục mặc định của hệ thống
**User Story**  
Là một **Admin sản phẩm**, tôi muốn **thêm/sửa/ẩn danh mục mặc định** để **chuẩn hóa trải nghiệm onboarding cho user mới**.

**Acceptance Criteria**
- Admin có thể thêm mới danh mục mặc định.
- Danh mục đã dùng trong giao dịch cũ không được xóa cứng, chỉ được ẩn.
- Thay đổi chỉ áp dụng cho user mới (trừ khi có migration chủ động).
- Mọi thay đổi phải ghi audit log.

**Priority**: Must Have

### US-F2 - Quản lý template hũ chi tiêu theo profile
**User Story**  
Là một **Admin sản phẩm**, tôi muốn **điều chỉnh template hũ và tỷ lệ phân bổ gợi ý** để **tăng độ phù hợp với từng nhóm user**.

**Acceptance Criteria**
- Có thể tạo template theo profile cơ bản (độc thân, gia đình, sinh viên...).
- Có thể chỉnh tỷ lệ phân bổ mặc định cho từng hũ.
- Template chỉ áp dụng từ thời điểm publish trở đi.

**Priority**: Should Have

### US-F3 - Cấu hình rule gợi ý chi tiêu
**User Story**  
Là một **Admin sản phẩm**, tôi muốn **bật/tắt và chỉnh ngưỡng rule gợi ý** để **hệ thống đưa khuyến nghị phù hợp hơn**.

**Acceptance Criteria**
- Có thể cấu hình ngưỡng rule (vd: vượt 80% trong 3 ngày liên tục).
- Có thể bật/tắt từng rule độc lập.
- Rule thay đổi có hiệu lực từ lần tính toán tiếp theo.

**Priority**: Should Have

---

## EPIC G - Giám sát lỗi tích hợp và xử lý sự cố

### US-G1 - Theo dõi lỗi tích hợp OCR/Notification/Bank Sync
**User Story**  
Là một **Admin vận hành**, tôi muốn **xem log lỗi theo từng kênh tích hợp** để **xử lý nhanh và giảm ảnh hưởng người dùng**.

**Acceptance Criteria**
- Có màn hình tổng hợp lỗi theo nguồn: OCR, Notification, Bank Sync.
- Có thể lọc theo thời gian, mức độ, trạng thái xử lý.
- Có chi tiết lỗi tối thiểu: mã lỗi, message, thời điểm, correlation id.

**Priority**: Must Have

### US-G2 - Retry tác vụ thất bại có kiểm soát
**User Story**  
Là một **Admin vận hành**, tôi muốn **retry các job thất bại đủ điều kiện** để **khôi phục dịch vụ nhanh mà không cần can thiệp kỹ thuật sâu**.

**Acceptance Criteria**
- Chỉ tác vụ được đánh dấu retryable mới hiển thị nút retry.
- Retry thành công/thất bại đều được ghi nhận vào lịch sử.
- Có cơ chế chống retry lặp vô hạn (giới hạn số lần).

**Priority**: Could Have

---

## EPIC H - Audit log & tuân thủ thao tác quản trị

### US-H1 - Ghi nhận audit log cho mọi thao tác nhạy cảm
**User Story**  
Là một **Admin trưởng/kiểm soát nội bộ**, tôi muốn **hệ thống ghi nhận đầy đủ thao tác quản trị quan trọng** để **truy vết khi có sự cố và đảm bảo tuân thủ**.

**Acceptance Criteria**
- Các hành động nhạy cảm bắt buộc log: khóa/mở khóa user, đổi rule, broadcast, chỉnh template.
- Log có tối thiểu: người thao tác, hành động, trước/sau thay đổi, timestamp.
- Chỉ role được phép mới truy cập màn hình audit log.

**Priority**: Must Have

---

## 4) Non-functional requirements cho luồng Admin

- Bảo mật: toàn bộ API Admin bắt buộc xác thực và phân quyền chặt chẽ.
- Khả dụng: dashboard/admin pages phản hồi ổn định ở tải MVP.
- Truy vết: thao tác nhạy cảm có audit đầy đủ.
- Dễ dùng: luồng quản trị rõ ràng, giảm tối đa thao tác thừa.

---

## 5) Đề xuất MVP Scope cho Admin (1 tháng)

### Must Have (bắt buộc trong MVP)
- US-A1, US-B1, US-B2, US-B3
- US-C1, US-C2
- US-D1
- US-E1
- US-F1
- US-G1
- US-H1

### Should Have (nếu kịp)
- US-A2, US-D2, US-E2, US-F2, US-F3

### Could Have (phase sau)
- US-G2
