# Note UI/UX OCR và kết nối service FE

Tài liệu này ghi lại phần giao diện OCR hóa đơn trong frontend hiện tại để có thể chuyển sang repo mới mà không mất flow nghiệp vụ. Phần OCR không tạo giao dịch ngay sau khi upload; FE cho người dùng xem lại dữ liệu nháp, chỉnh các trường quan trọng, rồi mới confirm để backend tạo transaction thật.

## 1. Route và vị trí trong app

- Route chính: `ROUTES.IMPORTS_OCR = "/imports/ocr"`.
- Page chính: `OcrImportPage`, export từ `src/features/imports`.
- Router map route này trong khu vực user đã đăng nhập, bên trong `UserLayout`.
- Navigation:
  - Desktop sidebar có item `OCR hóa đơn`, icon `ScanLine`, trỏ tới `/imports/ocr`.
  - Mobile drawer cũng có item `OCR hóa đơn`.
  - OCR không nằm trong bottom nav mobile chính; người dùng mở menu drawer để vào.

## 2. UI/UX màn hình OCR hóa đơn

### Khối upload

- Tiêu đề màn hình: `OCR hóa đơn`.
- Mô tả nghiệp vụ: tải hóa đơn lên để tạo bản nháp giao dịch trước khi xác nhận.
- Form upload gồm:
  - File input `accept="image/*,.pdf"`, hỗ trợ ảnh và PDF.
  - Select `FinancialAccount`, lấy từ `useFinancialAccounts()`.
  - Nút gửi hóa đơn, icon `Upload`.
- FE bắt buộc:
  - Có file trước khi gửi.
  - Có tài khoản nhận giao dịch trước khi gửi.
- Tài khoản mặc định:
  - Lọc `financialAccounts` theo `isActive`.
  - Ưu tiên account có `isDefault`.
  - Nếu không có default thì lấy active account đầu tiên.

### Trạng thái upload/OCR

- Khi submit, FE set `pending = true`, xóa `result` cũ và `confirmedMessage` cũ.
- Request upload gửi `layout: "invoice"`, `runOcr: true`, `includeDebug: false`.
- Sau khi có response, FE đổ dữ liệu OCR vào form nháp:
  - `amount`
  - `type`
  - `dateLocal`
  - `categoryId`
  - `note`
- Toast thành công dùng `res.message` nếu có, fallback là thông báo đã tải hóa đơn lên.
- Nếu lỗi thì toast lỗi từ `Error.message`, fallback là tải lên thất bại.

### Khối kết quả OCR

Sau upload thành công, page hiển thị card `Kết quả OCR` gồm:

- Badge trạng thái:
  - `AwaitingReview`: Chờ rà soát.
  - `Completed`: Đã xác nhận.
  - `Pending` hoặc `uploaded`: Đã tải lên.
  - `Failed`: Lỗi OCR.
  - `success`: OCR xong.
- Preview ảnh:
  - Dùng `preview.imageUrl`.
  - Nếu URL bắt đầu bằng `/`, FE resolve theo `apiClient.defaults.baseURL`.
  - Nếu không có ảnh thì hiển thị empty state với icon `FileImage`.
- Thông tin file:
  - `originalFileName` hoặc tên file người dùng vừa chọn.
  - Tài khoản đang chọn.
  - Dung lượng nếu backend trả `sizeInBytes`.

### Dữ liệu OCR hiển thị cho người dùng

FE ưu tiên dữ liệu từ `preview.transaction`, sau đó fallback sang `receipt`:

- Đơn vị bán:
  - `preview.transaction.merchantName`
  - fallback `receipt.merchantName`
  - fallback cuối: `Chưa nhận diện`
- Tổng tiền:
  - `preview.transaction.amount`
  - fallback `preview.summary.total`
  - fallback `receipt.totalAmount`
- Ngày giao dịch:
  - `preview.transaction.date`
  - fallback `receipt.transactionDate`
- Danh mục gợi ý:
  - `preview.transaction.suggestedCategoryName`
  - fallback `receipt.suggestedCategoryName`
  - có thể hiển thị thêm `matchedBy` hoặc `categoryMatchedBy`.
- Danh sách dòng hóa đơn:
  - Dùng `preview.items`.
  - Mỗi dòng hiển thị `name` và `amount`.
- Summary:
  - `subtotal`
  - `discount`
  - `total`
- Warning:
  - Dùng `preview.warnings` trước.
  - fallback `receipt.warnings`.
  - Hiển thị trong khối cảnh báo màu amber với icon `AlertTriangle`.

## 3. Form rà soát trước khi xác nhận

Form này là bước trung gian quan trọng. Người dùng phải rà soát dữ liệu OCR trước khi tạo giao dịch thật.

Các field hiện có:

- `Số tiền`
  - Input number.
  - Validate FE: phải là số hữu hạn và lớn hơn 0.
- `Loại giao dịch`
  - Select native.
  - Giá trị: `Expense` hoặc `Income`.
  - Mặc định là `Expense` nếu OCR không trả `Income`.
- `Ngày giao dịch`
  - Dùng `ScheduleDateTimePicker`.
  - `disablePast={false}`.
  - `allowClear={false}`.
  - FE convert local datetime sang ISO bằng `new Date(value).toISOString()`.
  - Nếu thiếu hoặc invalid thì không cho update/confirm.
- `Danh mục`
  - Select native.
  - Lấy dữ liệu từ `useUserCategories()`.
  - Có option rỗng `Không chọn`.
  - Category default được prefix `[Mặc định]`.
- `Ghi chú`
  - Input text.
  - Gửi lên backend dưới field `editedNote`.

Khi import đã `Completed` hoặc đã có `confirmedMessage`, form bị khóa để tránh confirm lại trên UI.

## 4. Service FE đang gọi

File service chính: `src/features/imports/services.ts`.

### `uploadReceiptImage(file, options)`

- Gửi `FormData` tới `API_ENDPOINT.IMPORTS.IMAGE`.
- Endpoint hiện tại trên FE: `imports/image`.
- Method: `POST`.
- Header: `Content-Type: multipart/form-data`.
- Form data:
  - `file`
  - `financialAccountId`
  - `bankCode`
  - `layout`, mặc định `invoice`
  - `runOcr`, mặc định `true`
  - `includeDebug`, mặc định `false`
- Response được unwrap qua `unwrapImportResult()` để hỗ trợ cả dạng backend trả trực tiếp và dạng `{ body: ... }`.

### `updateFirstDraft(importJobId, payload)`

- Method hiện tại: `PATCH`.
- Endpoint FE hiện tại: `imports/{importJobId}`.
- Payload:
  - `transactionDate`
  - `amount`
  - `type`
  - `editedNote`
  - `editedCategoryId`
  - `editedJarId`
  - `isValid`
  - `validationError`
- Response được normalize qua `normalizeDraft()`.

Lưu ý quan trọng khi chuyển sang repo mới: backend contract chuẩn của flow draft là `PATCH /api/v1/imports/{id}/drafts/{draftId}`. Nếu backend repo mới đã dùng endpoint chuẩn này thì FE cần giữ `draftId` từ response upload/detail và đổi service update draft sang endpoint đó.

### `confirmImport(importJobId, payload)`

- Method: `POST`.
- Endpoint: `imports/{importJobId}/confirm`.
- Payload hiện FE đang dùng:
  - `financialAccountId`
- Payload backend có thể hỗ trợ thêm:
  - `fromJarId`
  - `draftIds`
- Sau confirm thành công, FE cập nhật `result.status`, set `confirmedMessage`, rồi invalidate cache.

## 5. Data flow từ upload đến tạo transaction

Flow hiện tại trên UI:

1. User vào `/imports/ocr`.
2. User chọn file hóa đơn.
3. User chọn `FinancialAccount`.
4. FE gọi `uploadReceiptImage()`.
5. Backend OCR và trả về `ImportImageResult`.
6. FE hiển thị preview OCR và tự fill form rà soát.
7. User chỉnh `amount`, `type`, `date`, `category`, `note`.
8. User bấm `Cập nhật nháp` hoặc `Xác nhận giao dịch`.
9. Nếu bấm confirm:
   - FE gọi update draft trước.
   - Nếu update draft thành công, FE gọi `confirmImport()`.
   - Backend mới tạo transaction thật.
10. FE invalidate các query liên quan để màn hình khác lấy dữ liệu mới.

Các query bị invalidate sau confirm:

- `financial-accounts`
- `transactions`
- `dashboard`

Lý do invalidate:

- `financial-accounts`: balance có thể thay đổi sau khi tạo giao dịch.
- `transactions`: danh sách giao dịch có transaction OCR mới.
- `dashboard`: số liệu tổng quan có thể thay đổi.

## 6. Backend contract cần khớp khi port sang repo mới

Flow backend đầy đủ nên là:

1. `POST /api/v1/imports`
   - Upload file.
   - Chạy OCR nếu `runOcr = true`.
   - Tạo `ImportJob`.
   - Tạo `ImportTransactionDraft`.
   - Trả dữ liệu preview/receipt/draft cho FE rà soát.
2. `PATCH /api/v1/imports/{id}/drafts/{draftId}`
   - FE cập nhật dữ liệu đã rà soát.
   - Dùng để bổ sung ngày giao dịch, amount, category, note, trạng thái hợp lệ.
3. `POST /api/v1/imports/{id}/confirm`
   - Backend validate draft.
   - Backend tạo transaction thật.
   - Backend cập nhật balance account/jar.
   - Backend set import job sang `Completed`.

Endpoint `POST /api/v1/imports/image` có thể được giữ làm alias/backward compatible, nhưng repo mới nên ưu tiên flow chính `POST /api/v1/imports`.

## 7. Những lỗi/edge case cần nhớ

- Nếu thiếu file, FE toast `Chọn ảnh hoặc PDF hóa đơn.`
- Nếu thiếu financial account, FE toast yêu cầu chọn tài khoản.
- Nếu amount không hợp lệ hoặc nhỏ hơn/bằng 0, FE không cho update draft.
- Nếu ngày giao dịch trống hoặc invalid, FE không cho update draft.
- Confirm backend có thể fail với code `DRAFT_TRANSACTION_DATE_REQUIRED` nếu draft chưa có `transactionDate`.
- Cách xử lý lỗi trên:
  - FE phải patch draft với `transactionDate` trước.
  - Sau đó mới gọi confirm.
- OCR có thể trả warning; UI không chặn confirm chỉ vì có warning, nhưng hiển thị rõ để user kiểm tra.
- Nếu OCR không nhận diện được merchant/category/date/amount, UI vẫn cho người dùng nhập lại thủ công trong form rà soát.

## 8. Types chính cần giữ khi tách repo

Các type đang dùng trong FE service:

- `ImportImageResult`
  - Response chính sau upload.
  - Có `id`, `status`, `message`, file info, `receipt`, `preview`, `ocrResult`, `rawOcrJson`.
- `ImportReceiptExtraction`
  - Dữ liệu OCR/parse cấp receipt.
  - Có tổng tiền, text raw, ngày giao dịch, merchant, category gợi ý, warning.
- `ImportReceiptPreview`
  - Dữ liệu preview phục vụ UI.
  - Có `imageUrl`, `transaction`, `items`, `summary`, `warnings`.
- `ImportDraftResult`
  - Dữ liệu draft sau update.
  - Có `transactionDate`, `amount`, `type`, note/category/jar đã edit, `isValid`, `validationError`.
- `UpdateImportDraftPayload`
  - Payload FE gửi khi update draft.
- `ConfirmImportPayload`
  - Payload FE gửi khi confirm.
- `ConfirmImportResult`
  - Response sau khi backend tạo transaction.

## 9. Ghi chú triển khai lại ở repo mới

- Giữ bước review trung gian; không tạo transaction ngay sau upload.
- FE nên lưu được `importJobId` và nếu backend trả nhiều draft thì cần lưu thêm `draftId`.
- Nếu repo mới hỗ trợ nhiều draft trong một import job, UI nên render danh sách draft thay vì form một dòng như hiện tại.
- Nếu có cả nguồn tiền từ ví/hũ, confirm payload cần chọn rõ:
  - `financialAccountId` cho giao dịch đi qua tài khoản.
  - `fromJarId` cho chi tiêu từ hũ.
- Với OCR debug, chỉ bật `includeDebug=true` ở môi trường debug/dev vì response có thể lớn.
- Các màn hình dashboard/transactions/accounts cần được refetch sau confirm để tránh hiển thị số liệu cũ.
