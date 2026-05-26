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
| **MVP mobile** | 18 màn hình user (không gồm 6 màn admin — admin giữ trên web) |
| **API** | Dùng chung BE với web: `http://<host>:5284/api/v1` |
| **Auth** | JWT qua header `Authorization: Bearer <token>` (giống `FE_QLTC/src/lib/axios.ts`) |
| **UI** | Neo-brutalism / brutal style tương tự web (border đậm, shadow cứng, màu tương phản) |

### 18 màn hình (map từ `router.tsx`)

| # | Màn hình Flutter | Route web | File web tham chiếu |
|---|------------------|-----------|---------------------|
| 1 | `LoginScreen` | `/login` | `features/auth/pages/LoginPage.tsx` |
| 2 | `RegisterScreen` | `/register` | `features/auth/pages/RegisterPage.tsx` |
| 3 | `OnboardingScreen` | `/onboarding` | `features/onboarding/pages/OnboardingPage.tsx` |
| 4 | `DashboardScreen` | `/dashboard` | `features/dashboard/pages/DashboardPage.tsx` |
| 5 | `TransactionsScreen` | `/transactions` | `features/transactions/pages/TransactionsPage.tsx` |
| 6 | `AddTransactionScreen` | `/transactions/add` | `features/transactions/pages/AddTransactionPage.tsx` |
| 7 | `TransactionDetailScreen` | `/transactions/:id` | `features/transactions/pages/TransactionDetailPage.tsx` |
| 8 | `OcrImportScreen` | `/imports/ocr` | `features/imports/pages/OcrImportPage.tsx` |
| 9 | `AccountsScreen` | `/accounts` | `features/financial-accounts/pages/AccountsPage.tsx` |
| 10 | `JarsScreen` | `/jars` | `features/jars/pages/JarsPage.tsx` |
| 11 | `BudgetScreen` | `/budget` | `features/budget/pages/BudgetPage.tsx` |
| 12 | `CategoriesScreen` | `/categories` | `features/categories/pages/CategoriesPage.tsx` |
| 13 | `RemindersScreen` | `/reminders` | `features/reminders/pages/RemindersPage.tsx` |
| 14 | `GoalsScreen` | `/goals` | `shared/pages/UserGoalsPage.tsx` |
| 15 | `NotificationsScreen` | `/notifications` | `shared/pages/UserNotificationsPage.tsx` |
| 16 | `ProfileScreen` | `/profile` | `features/profile/pages/UserProfilePage.tsx` |
| 17 | `UnauthorizedScreen` | `/unauthorized` | `shared/pages/UnauthorizedPage.tsx` |
| 18 | `NotFoundScreen` | `*` | `shared/pages/NotFoundPage.tsx` |

> **Ghi chú:** `/limits` trên web trùng `BudgetPage` — mobile chỉ cần một `BudgetScreen`.  
> **Phase 2 (tùy chọn):** 6 màn admin (`/admin/*`) — không tính trong 18 màn MVP.

---

## 2. Cấu trúc repo Flutter đề xuất

Tạo repo mới trên org (ví dụ `finjar-mobile`) hoặc thư mục `mobile/` trong monorepo:

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

## 3. Phân công 5 người (18 màn hình)

### Vai trò tổng quan

| Người | Vai trò | Số màn | Ưu tiên tuần 1 |
|-------|---------|--------|----------------|
| **A** | Tech lead — **core** (scaffold, API, router, theme) + auth | **3** + core | Setup repo, merge `develop`; **không** code feature mới từ tuần 2 |
| **B** | Transactions & Dashboard | 4 | Luồng chính sau đăng nhập |
| **C** | Tài khoản, hũ, ngân sách, danh mục | 4 | CRUD + form |
| **D** | Mục tiêu, nhắc nhở, thông báo, hồ sơ | 4 | List + pagination |
| **E** | OCR import + màn lỗi + **điều phối** QA | **3** | OCR + Unauthorized/NotFound; smoke cuối sprint |

> **Tổng màn UI:** 3 + 4 + 4 + 4 + 3 = **18** (cột “+ core” của A là scaffold/router/theme, **không** tính thêm màn).  
> **Cân bằng A ↔ E (đã chỉnh):** A bớt `Unauthorized` → E; E có **3 màn** (không phải 4). QA **chia cho cả nhóm** — E chỉ giữ checklist cuối sprint.

---

### Người A — Core & Auth (3 màn + nền tảng)

**Màn hình:** 1 Login, 2 Register, 3 Onboarding  

**Task chi tiết — Sprint 1 (bắt buộc xong trước nhóm):**

- [ ] Khởi tạo project Flutter, `pubspec`, folder `features/`
- [ ] `api_client.dart` + lưu token `flutter_secure_storage`
- [ ] `go_router`: redirect chưa login → Login; chưa onboarding → Onboarding
- [ ] `LoginScreen` + `RegisterScreen` (`auth/login`, `auth/register`)
- [ ] Sau login: `GET user/me` → nếu cần setup → Onboarding
- [ ] `OnboardingScreen` — `POST onboarding`
- [ ] Theme brutal dùng chung (`BrutalTheme`, colors, typography, widget `BrutalButton`/`BrutalCard`)
- [ ] `README` setup máy dev + chạy BE local
- [ ] Nhánh `develop`, quy tắc PR (template ngắn)

**Task chi tiết — Sprint 2–3 (không thêm màn mới):**

- [ ] Review + merge PR B/C/D/E (tối đa 1h/ngày)
- [ ] Chỉ sửa `core/`, `router`, `theme` khi có breaking change — báo trên group trước khi merge
- [ ] Hỗ trợ tích hợp bottom nav / shell layout (phối hợp B)

**Không thuộc A:** `UnauthorizedScreen`, `NotFoundScreen`, OCR (→ E).

**Nhánh Git:** `feature/core-auth-onboarding`

**Definition of Done (DoD):** Đăng nhập thật với BE local, token persist, điều hướng đúng 3 màn auth; B/C/D/E clone được và chạy `flutter run` không cần sửa core.

---

### Người B — Dashboard & Giao dịch (4 màn)

**Màn hình:** 4 Dashboard, 5 Transactions, 6 Add Transaction, 7 Transaction Detail  

**Task chi tiết:**

- [ ] `DashboardScreen` — `GET dashboard` (chart/summary theo web)
- [ ] `TransactionsScreen` — list + filter + phân trang
- [ ] `AddTransactionScreen` — `POST transactions`
- [ ] `TransactionDetailScreen` — `GET/PATCH/DELETE transactions/:id`
- [ ] Bottom nav hoặc drawer item "Giao dịch" / "Tổng quan" (phối hợp A)

**Phụ thuộc:** A merge `core` + router trước khi B rebase.

**Nhánh Git:** `feature/dashboard-transactions`

**DoD:** CRUD giao dịch hoàn chỉnh, dashboard hiển thị số liệu từ API.

---

### Người C — Tài chính & phân loại (4 màn)

**Màn hình:** 9 Accounts, 10 Jars, 11 Budget, 12 Categories  

**Task chi tiết:**

- [ ] `AccountsScreen` — `financial-accounts` CRUD
- [ ] `JarsScreen` — `jars` (phân bổ hũ)
- [ ] `BudgetScreen` — `limits` (ngân sách/giới hạn)
- [ ] `CategoriesScreen` — `categories` list (user)
- [ ] Form validation, empty state, loading skeleton

**Nhánh Git:** `feature/accounts-jars-budget-categories`

**DoD:** Tạo/sửa/xóa tài khoản và hũ; budget hiển thị theo kỳ; danh mục load được.

---

### Người D — Mục tiêu & người dùng (4 màn)

**Màn hình:** 13 Reminders, 14 Goals, 15 Notifications, 16 Profile  

**Task chi tiết:**

- [ ] `RemindersScreen` — `reminders`
- [ ] `GoalsScreen` — `goals` CRUD
- [ ] `NotificationsScreen` — `notifications` + đánh dấu đã đọc (`PATCH`)
- [ ] `ProfileScreen` — `user/me`, logout `auth/logout`
- [ ] Pagination giống web (`pageIndex`, `pageSize`)

**Nhánh Git:** `feature/goals-notifications-profile-reminders`

**DoD:** Profile hiển thị user; logout xóa token; notifications phân trang.

---

### Người E — Import, màn lỗi & QA (3 màn)

**Màn hình:** 8 OCR Import, 17 Unauthorized, 18 Not Found (+ route fallback `go_router` — không tính thêm màn)

**Task chi tiết — UI & API:**

- [ ] `OcrImportScreen` — `image_picker`, `POST imports/image`, confirm draft
- [ ] `UnauthorizedScreen` — nút quay Dashboard/Login (theo web)
- [ ] `NotFoundScreen` — route `*` / unknown path
- [ ] Đăng ký 3 route trên `go_router` (phối hợp A sau khi core merge)

**Task chi tiết — QA (chia nhóm, không gánh một mình):**

| Ai | Trách nhiệm test |
|----|------------------|
| **B** | Smoke: Dashboard → Transactions → Add |
| **C** | Smoke: Accounts → Jars → Budget |
| **D** | Smoke: Goals → Notifications → Profile → Logout |
| **E** | Chạy **checklist mục 6** cuối Sprint 3; ghi bug lên Issues |
| **A** | `flutter analyze` + merge gate trước khi vào `develop` |

- [ ] Mỗi người tự fix conflict trong `lib/features/<module của mình>/` trước khi nhờ review
- [ ] E **không** sửa code feature của B/C/D — chỉ mở issue hoặc comment PR

**Phụ thuộc:** A merge `core` trước; E rebase và thêm route lỗi/OCR.

**Nhánh Git:** `feature/ocr-and-error-screens`

**DoD:** OCR upload → draft; route sai → NotFound; user không đủ quyền → Unauthorized; checklist mục 6 pass trên build `develop`.

---

## 4. Lịch làm việc gợi ý (3 sprint × 1 tuần)

| Sprint | Mục tiêu | Người |
|--------|---------|-------|
| **S1** | Scaffold + Auth + Router + Theme | **A** (xong trước ngày 3), B/C/D/E setup branch |
| **S2** | 4 màn / người song song | B, C, D, **E** (OCR + Unauthorized + NotFound); **A** chỉ review/merge |
| **S3** | Nav tích hợp, polish, demo | B/C/D/E code nhẹ; **E** chạy checklist; **A** merge `develop` → demo |

**Daily:** 15 phút — blocker API / merge conflict.  
**Review:** 1 PR / người / sprint, không merge trực tiếp `main`.

---

## 5. Quy trình Git & push code lên [PRM393-Finjar](https://github.com/PRM393-Finjar)

Org hiện **chưa có public repo** — team lead tạo repo private (ví dụ `finjar-mobile`) và mời 5 thành viên.

### 5.1. Setup lần đầu (mỗi thành viên)

```bash
# Cài Flutter: https://docs.flutter.dev/get-started/install
flutter doctor

# Clone (thay URL sau khi lead tạo repo)
git clone https://github.com/PRM393-Finjar/finjar-mobile.git
cd finjar-mobile

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
3. Tiêu đề PR: `[B] Dashboard + Transactions (4 screens)`
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

**Sprint 3 — ngày cuối:** E chạy lần lượt, mỗi mục ghi Pass/Fail trên Issue. A xác nhận trước khi tag demo.

Sau khi merge tất cả nhánh vào `develop`:

- [ ] Guest: Login → Register → quay Login
- [ ] User mới: Login → Onboarding → Dashboard
- [ ] Tab/nav: Dashboard ↔ Transactions ↔ Accounts ↔ Profile
- [ ] Thêm giao dịch → thấy trên Dashboard
- [ ] OCR: chọn ảnh → draft → confirm (nếu BE bật)
- [ ] Logout → về Login, token đã xóa
- [ ] Route sai → NotFound
- [ ] User không đủ quyền → Unauthorized
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
| `imports` | `imports` |
| `financial-accounts` | `financial_accounts` |
| `jars` | `jars` |
| `budget` | `budget` |
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

**Cập nhật:** 26/05/2026 — Phiên bản 1.0 (18 màn user, 5 dev, Flutter).
