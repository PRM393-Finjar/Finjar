# Finjar Mobile — Hướng dẫn Flutter & phân công 5 người

> **Dự án:** Phiên bản mobile của web app Quản lý tài chính cá nhân (Finjar)  
> **Web tham chiếu:** `FE_QLTC/` (React + Vite)  
> **Backend:** `Personal_Finance_App_Be-main/` (.NET 8, API `api/v1`)  
> **Tổ chức GitHub:** [PRM393-Finjar](https://github.com/PRM393-Finjar)  
> **Công nghệ mobile:** Flutter 3.x + Dart

---

## 1. Mục tiêu & phạm vi

| Hạng mục | Mô tả |
|----------|--------|
| **MVP mobile** | 10 màn hình user (rút gọn từ 18 màn, vẫn giữ core flow) |
| **API** | Dùng chung BE với web: `http://<host>:5284/api/v1` |
| **Auth** | JWT qua header `Authorization: Bearer <token>` (giống `FE_QLTC/src/lib/axios.ts`) |
| **UI** | Neo-brutalism / brutal style tương tự web (border đậm, shadow cứng, màu tương phản) |

### 10 màn hình MVP (gộp từ `router.tsx`, vẫn giữ core)

| # | Màn hình Flutter | Gộp từ route web | Ghi chú triển khai |
|---|------------------|-------------------|--------------------|
| 1 | `AuthScreen` | `/login`, `/register` | 2 tab Login/Register |
| 2 | `OnboardingScreen` | `/onboarding` | Giữ nguyên |
| 3 | `DashboardScreen` | `/dashboard` | Giữ nguyên |
| 4 | `TransactionsScreen` | `/transactions`, `/transactions/add`, `/transactions/:id` | Add/Detail bằng sheet |
| 5 | `WalletScreen` | `/accounts`, `/jars`, `/budget` | 3 tab: Accounts/Jars/Budget |
| 6 | `CategoriesScreen` | `/categories` | Giữ nguyên |
| 7 | `GoalsScreen` | `/goals` | Giữ nguyên |
| 8 | `NotificationsScreen` | `/notifications` | Giữ nguyên |
| 9 | `ProfileScreen` | `/profile` | Giữ nguyên |
| 10 | `RemindersScreen` | `/reminders` | Giữ nguyên (MVP) |

> **Route không làm màn riêng ở MVP:** `/unauthorized`, `*` dùng `ErrorView` chung + `go_router` redirect.  
> **Phase 2 (tùy chọn):** OCR (`/imports/ocr`) và 6 màn admin (`/admin/*`).

---

## 2. Cấu trúc repo Flutter đề xuất

Tạo thư mục `mobile/` trong monorepo `Finjar` hoặc dùng repo riêng nếu nhóm muốn tách:

```
finjar_mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart                    # MaterialApp + theme
│   ├── core/
│   │   ├── config/env.dart         # baseUrl api/v1
│   │   ├── network/
│   │   │   ├── api_client.dart     # Dio + interceptor Bearer
│   │   │   └── api_endpoints.dart  # map từ apiEndpoint.ts
│   │   ├── router/app_router.dart  # go_router
│   │   ├── theme/brutal_theme.dart
│   │   └── storage/secure_storage.dart
│   ├── shared/
│   │   ├── widgets/                # BrutalButton, BrutalCard, ...
│   │   └── utils/
│   └── features/
│       ├── auth/
│       ├── onboarding/
│       ├── dashboard/
│       ├── transactions/
│       ├── imports/
│       ├── financial_accounts/
│       ├── jars/
│       ├── budget/
│       ├── categories/
│       ├── reminders/
│       ├── goals/
│       ├── notifications/
│       └── profile/
├── test/
├── assets/
├── pubspec.yaml
└── README.md
```

### Package gợi ý (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.4.0
  flutter_riverpod: ^2.5.0
  go_router: ^14.0.0
  flutter_secure_storage: ^9.0.0
  freezed_annotation: ^2.4.0
  json_annotation: ^4.9.0
  intl: ^0.19.0
  image_picker: ^1.0.0          # OCR import
```

### Biến môi trường

| Biến | Ví dụ | Tương đương web |
|------|--------|------------------|
| `API_BASE_URL` | `http://10.0.2.2:5284/api/v1` (Android emulator) | `VITE_API_LOCAL_URL` |
| | `http://localhost:5284/api/v1` (iOS sim) | |

**Android emulator:** dùng `10.0.2.2` thay `localhost` để trỏ máy host chạy BE.

### API endpoints (copy từ web)

Tham chiếu `FE_QLTC/src/shared/constants/apiEndpoint.ts`:

- Auth: `auth/login`, `auth/register`, `auth/logout`
- User: `user/me`, `user/me/setup`
- Onboarding: `onboarding`
- Dashboard: `dashboard`
- Transactions: `transactions`
- Accounts: `financial-accounts`
- Jars: `jars`
- Goals: `goals`
- Notifications: `notifications`
- Categories: `categories`
- Limits/Budget: `limits`
- Reminders: `reminders`
- Imports/OCR: `imports`, `imports/image`, ...

---

## 3. Phân công 5 người (MVP 10 màn)

### Vai trò tổng quan

| Người | Vai trò | Scope chính | Ưu tiên tuần 1 |
|-------|---------|-------------|----------------|
| **A** | Tech lead + foundation | Core app + Auth + Onboarding | Khóa kiến trúc, unblock team |
| **B** | Luồng giao dịch chính | Dashboard + Transactions | Luồng ghi nhận chi tiêu/thu nhập |
| **C** | Ví & cấu hình tài chính | Wallet + Categories | CRUD tài khoản/hũ/ngân sách/danh mục |
| **D** | Gắn kết người dùng | Goals + Notifications + Profile | Hoàn thiện vòng đời người dùng |
| **E** | Ổn định tích hợp | Reminders + Error handling + QA điều phối | Dọn lỗi, test end-to-end |

> **Tổng màn UI:** A(2) + B(2) + C(2) + D(3) + E(1) = **10 màn**.  
> Chia theo **độ phức tạp**, không chia đều số lượng màn hình.

---

### Người A — Foundation + Auth/Onboarding (2 màn + nền tảng)

**Màn hình:** `AuthScreen`, `OnboardingScreen`  
**Nhánh:** `feature/foundation-auth-onboarding`

**Phần việc chi tiết:**

- [ ] Tạo project Flutter, folder chuẩn (`core`, `shared`, `features`), rule lint/format.
- [ ] Thiết lập `Dio` + interceptor Bearer + xử lý `401` thống nhất.
- [ ] Thiết lập `go_router` guard: chưa login -> Auth, chưa onboarding -> Onboarding.
- [ ] Làm `AuthScreen` dạng tab (Login/Register), validate form, hiển thị lỗi API.
- [ ] Làm `OnboardingScreen` (submit `POST onboarding`), chuyển `Dashboard` khi thành công.
- [ ] Xây `BrutalTheme`, component dùng chung (`AppButton`, `AppInput`, `StateView`).

**Expected output:**

- Team pull về chạy được ngay bằng 1 lệnh `flutter run`.
- Các module khác chỉ cần gọi shared component, không tự tạo style riêng.

**DoD:**

- Login/Register thật với BE local.
- Restart app vẫn giữ session token.
- B/C/D/E chạy nhánh riêng không cần sửa core.

---

### Người B — Dashboard + Transactions (2 màn core nặng)

**Màn hình:** `DashboardScreen`, `TransactionsScreen`  
**Nhánh:** `feature/dashboard-transactions`

**Phần việc chi tiết:**

- [ ] `DashboardScreen`: số dư tổng, thu/chi tháng, widget tóm tắt.
- [ ] `TransactionsScreen`: list + filter (type/category/date) + phân trang.
- [ ] Thêm/sửa/xóa giao dịch bằng `showModalBottomSheet` hoặc `DraggableScrollableSheet` (không tách route).
- [ ] Đồng bộ dữ liệu: sau khi thêm/sửa giao dịch thì dashboard refresh.
- [ ] Trạng thái loading/empty/error rõ ràng cho cả dashboard và transactions.

**Expected output:**

- User mở app là thấy được tài chính tổng quan và ghi giao dịch nhanh trong 1 flow.

**DoD:**

- `GET dashboard`, `GET/POST/PATCH/DELETE transactions` chạy ổn.
- Không crash khi đổi filter hoặc quay lại từ sheet.

---

### Người C — Wallet + Categories (2 màn)

**Màn hình:** `WalletScreen`, `CategoriesScreen`  
**Nhánh:** `feature/wallet-categories`

**Phần việc chi tiết:**

- [ ] `WalletScreen` với `TabBar`: Accounts / Jars / Budget.
- [ ] CRUD Accounts (`financial-accounts`), Jars (`jars`), Budget (`limits`) theo từng tab.
- [ ] `CategoriesScreen`: list + add/edit category dùng cho Transactions.
- [ ] Rule dữ liệu: không cho xóa category đang được transaction sử dụng (nếu API trả lỗi, hiển thị message rõ).
- [ ] Đồng bộ với B: form transaction lấy category/account từ dữ liệu C quản lý.

**Expected output:**

- Team có 1 điểm quản lý tài nguyên tài chính tập trung, không cần nhiều màn rời.

**DoD:**

- 3 tab Wallet hoạt động độc lập, không reset sai state khi chuyển tab.
- Categories cập nhật tức thời cho màn Transactions.

---

### Người D — Goals + Notifications + Profile (3 màn)

**Màn hình:** `GoalsScreen`, `NotificationsScreen`, `ProfileScreen`  
**Nhánh:** `feature/goals-notifications-profile`

**Phần việc chi tiết:**

- [ ] `GoalsScreen`: CRUD mục tiêu + progress.
- [ ] `NotificationsScreen`: list phân trang + đánh dấu đã đọc (`PATCH notifications`).
- [ ] `ProfileScreen`: thông tin user (`GET user/me`) + logout (`POST auth/logout`).
- [ ] Đồng bộ unread count cho icon chuông trên AppBar/nav.
- [ ] Chuẩn UX: pull-to-refresh, skeleton, thông báo lỗi thân thiện.

**Expected output:**

- Có vòng đời user hoàn chỉnh: đặt mục tiêu, nhận thông báo, quản lý phiên đăng nhập.

**DoD:**

- Logout xóa token local và quay về `AuthScreen`.
- Notifications cập nhật số chưa đọc chính xác.

---

### Người E — Reminders + Error handling + QA điều phối (1 màn + tích hợp)

**Màn hình:** `RemindersScreen`  
**Nhánh:** `feature/reminders-and-qa`

**Phần việc chi tiết:**

- [ ] `RemindersScreen`: list/create/update reminder (`reminders` API).
- [ ] Làm `ErrorView` dùng chung cho Unauthorized/NotFound/network error (không tạo màn riêng).
- [ ] Thiết lập checklist QA theo module và tạo template bug report.
- [ ] Chạy smoke test cuối mỗi sprint trên nhánh `develop`, tổng hợp lỗi theo mức độ.
- [ ] Theo dõi regression sau khi merge PR của B/C/D.

**Expected output:**

- App có lớp kiểm soát chất lượng rõ ràng, giảm lỗi tích hợp phút cuối.

**DoD:**

- Reminders chạy đủ CRUD cơ bản.
- ErrorView được dùng lại ở ít nhất 3 case lỗi khác nhau.
- Sprint 3 có báo cáo QA hoàn chỉnh (Pass/Fail + bug link).

---

## 4. Lịch làm việc gợi ý (3 sprint × 1 tuần, 10 màn)

| Sprint | Mục tiêu | Người |
|--------|---------|-------|
| **S1** | Foundation + Auth/Onboarding + skeleton module | A lead; B/C/D/E setup module contracts |
| **S2** | Hoàn thiện feature chính (Dashboard/Transactions/Wallet/Categories/Goals/Profile/Notifications/Reminders) | B/C/D/E code song song; A review + resolve shared core |
| **S3** | Tích hợp tổng, tối ưu UX, fix regression, demo | E điều phối QA; A merge gate; cả nhóm fix bug theo severity |

**Daily:** 15 phút — blocker API / merge conflict.  
**Review:** 1 PR / người / sprint, không merge trực tiếp `main`.

---

## 5. Quy trình Git & push code lên [PRM393-Finjar](https://github.com/PRM393-Finjar)

Repo nhóm hiện tại: `https://github.com/PRM393-Finjar/Finjar`.

### 5.1. Setup lần đầu (mỗi thành viên)

```bash
# Cài Flutter: https://docs.flutter.dev/get-started/install
flutter doctor

# Clone repo nhóm
git clone https://github.com/PRM393-Finjar/Finjar.git
cd Finjar

git checkout develop
flutter pub get
```

### 5.2. Nhánh & naming

| Loại | Quy tắc | Ví dụ |
|------|---------|--------|
| Nhánh chính | `main` (production), `develop` (tích hợp) | — |
| Feature | `feature/<mô-tả-ngắn>` | `feature/dashboard-transactions` |
| Fix | `fix/<mô-tả>` | `fix/login-token-expired` |

**Không push thẳng lên `main`.** Chỉ merge qua Pull Request.

### 5.3. Quy trình mỗi task

```bash
# 1. Cập nhật develop
git checkout develop
git pull origin develop

# 2. Tạo nhánh feature
git checkout -b feature/ten-man-hinh

# 3. Code + test local
flutter analyze
flutter test
flutter run

# 4. Commit (message rõ ràng, tiếng Việt hoặc English thống nhất)
git add lib/features/ten_feature/
git commit -m "feat(transactions): add transaction list screen"

# 5. Push nhánh
git push -u origin feature/ten-man-hinh
```

### 5.4. Tạo Pull Request trên GitHub

1. Vào repo → **Compare & pull request** sau khi push.
2. **Base:** `develop` ← **Compare:** `feature/...`
3. Tiêu đề PR: `[B] Dashboard + Transactions (MVP 10-screen plan)`
4. Mô tả PR mẫu:

```markdown
## Màn hình
- [x] DashboardScreen
- [x] TransactionsScreen
- [ ] AddTransactionScreen (WIP)

## API đã nối
- GET dashboard
- GET/POST transactions

## Cách test
1. Chạy BE tại localhost:5284
2. `flutter run` với API_BASE_URL=...
3. Đăng nhập user test → vào Dashboard

## Ảnh chụp màn hình
(đính kèm 1–2 screenshot)
```

5. Gán reviewer: **Người A** (lead) + 1 người khác.  
6. Chờ CI pass (nếu có) → **Squash and merge** vào `develop`.

### 5.5. Tránh conflict khi 5 người làm song song

| Quy tắc | Chi tiết |
|---------|----------|
| **Sở hữu thư mục** | Mỗi người chỉ sửa `lib/features/<module của mình>/` |
| **File dùng chung** | `app_router.dart`, `theme` → **A** merge; route lỗi/OCR → **E** đề xuất diff, A review |
| **Rebase thường xuyên** | Trước khi push: `git fetch && git rebase origin/develop` |
| **PR nhỏ** | Ưu tiên 1 PR / 2–4 màn, không gộp cả sprint một PR |
| **Conflict** | Tự resolve trong module của mình; không nhờ E/A sửa hộ |

### 5.6. Bảo mật khi push

- **Không commit:** `.env`, API key, mật khẩu test thật.
- Thêm vào `.gitignore`: `*.env`, `local.properties`, key store Android.
- Dùng `--dart-define=API_BASE_URL=...` khi build, không hardcode production URL trong code.

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5284/api/v1
```

### 5.7. Release (cuối đồ án)

```bash
git checkout develop
git pull
git checkout -b release/1.0.0
# fix version pubspec, changelog
git push -u origin release/1.0.0
# PR release → main, tag v1.0.0
```

---

## 6. Checklist tích hợp (E điều phối, cả nhóm thực hiện)

**Sprint 3 — ngày cuối:** E chạy checklist, mỗi mục ghi Pass/Fail trên Issue; A duyệt release.

Sau khi merge tất cả nhánh vào `develop`:

- [ ] Guest: Login <-> Register tab trên `AuthScreen`
- [ ] User mới: Login → Onboarding → Dashboard
- [ ] Tab/nav: Dashboard ↔ Transactions ↔ Wallet ↔ Profile
- [ ] Thêm giao dịch → thấy trên Dashboard
- [ ] Wallet tabs: Accounts/Jars/Budget đều load và CRUD được
- [ ] Categories cập nhật và dùng được khi tạo transaction
- [ ] Goals CRUD + Notifications read/unread hoạt động
- [ ] Reminders CRUD hoạt động
- [ ] Logout → về Login, token đã xóa
- [ ] Route lỗi/401 hiển thị `ErrorView` đúng hành vi
- [ ] `flutter analyze` không lỗi
- [ ] Build APK debug: `flutter build apk --debug`

---

## 7. Map nhanh: Web feature → Flutter folder

| Web (`FE_QLTC/src/features/`) | Flutter `lib/features/` |
|-------------------------------|-------------------------|
| `auth` | `auth` |
| `onboarding` | `onboarding` |
| `dashboard` | `dashboard` |
| `transactions` | `transactions` |
| `financial-accounts`, `jars`, `budget` | `wallet` (3 tab) |
| `categories` | `categories` |
| `reminders` | `reminders` |
| `shared/pages` (goals, notifications) | `goals`, `notifications` |
| `profile` | `profile` |

---

## 8. Liên hệ & tài liệu

| Tài liệu | Đường dẫn |
|----------|-----------|
| Router web | `FE_QLTC/src/app/router.tsx` |
| Routes constants | `FE_QLTC/src/shared/constants/routes.ts` |
| API endpoints | `FE_QLTC/src/shared/constants/apiEndpoint.ts` |
| Flutter docs | https://docs.flutter.dev |
| GitHub org | https://github.com/PRM393-Finjar |

---

**Cập nhật:** 28/05/2026 — Phiên bản 2.0 (MVP 10 màn, chia task theo độ phức tạp).
