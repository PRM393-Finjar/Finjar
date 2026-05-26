Hệ thống quản lý tài chính cá nhân

 Tổng quan về dự án 
Nơi quản lý chi tiêu dựa trên phương pháp có thể tạo ra  nhiều hũ chi tiêu, đối tượng hướng đến là các người nội trợ, người không có khả năng hay time quản lý tiền bạc, các doanh nghiệp đang cần giải pháp thay thế cho việc tính toán tài chính.
 Đưa ra vấn đề 
 Vấn đề là gì? (So với những phương pháp quản lí chi tiêu thông thường → sử dụng excel, sổ, … thì điểm khó khăn của nó là gì khiến người ta cần 1 cái app quản lý tài chính)
Như trong phim Doraemon thì mẹ của nobita mỗi tháng thường lấy cuốn sổ chi tiêu để tính toán => bị cực và lâu.
Đôi khi vì quỹ thời gian không nhiều hoặc khả năng tính toán xây dựng kế hoạch chi tiêu không tốt nên 1 số người bỏ qua việc quản lý chi tiêu
Người dùng gặp khó khăn trong việc trích xuất lại các thông tin đã chi tiêu
Đa số ứng dụng chỉ dừng lại ở việc thống kê quá khứ, chưa đưa ra được cảnh báo hoặc kế hoạch chi tiêu
Nhập liệu thủ công từng khoản chi nhỏ gây nhàm chán
Bị vượt quá chi tiêu khi có nhiều khoản tiền nhỏ lặt vặt cộng dồn.
Thiếu Realtime awareness → Không biết khi nào mình sắp hết tiền.
Không gắn với các mục tiêu tài chính → Không liên kết với mục tiêu, không biết mình đang gần hay xa mục tiêu.
Không nhắc nhở cảnh báo → cảnh báo tới hạn đống tiền.
Phân mục trong chi tiêu chưa được tự động hoá.
 Giải pháp
Xây dựng 1 hệ thống giải quyết những nhu cầu kế toán cơ bản và tự động mà người dùng không cần phải tự tay tính toán. (1)(2)(5)
Cảm thấy ban đầu trước khi vào được chi tiêu thì nên đặt các khảo sát xu hướng người dùng thế nào 

Gợi ý và cho lời khuyên dựa trên tiêu dùng của user. Vd: như nếu hủ chi tiêu người đó sài lố mục tiêu tính toán ban đầu ở muc ăn uống đi thì gợi ý cách cách cho người tiết kiệm được tiền ăn (9,10)
Tự động hóa quá trình nhập liệu (5)
Có sẵn những công thức phù hợp cho việc quản lí chi tiêu
2. App chi tiêu sẽ thay user công việc tính toán chi tiêu giúp tiết kiệm thời gian, qua việc app dễ dùng cũng  giúp user tạo thói quen  quản lý chi 
Cảnh báo user nếu như số tiền bị vượt quá mức range, tiêu dùng đã được setup trc đó (9)
Cho user chọn phân mục khi nhập dữ liệu chi tiêu (10)
Đặt ra một móc cho user nhập là khoảng cảnh báo, và 1 móc do hệ thống mình tự đặt ra [có thể là dưới 20% tài khoản thì cảnh báo] (7)(6)
Thiết lập các quỹ để User phân nguồn tiền bản thân vào quỹ mục tiêu đó. So sánh nó với mục tiêu góc → tương tự chức năng quỹ của MOMO (8)
SetUp một hệ thống cảnh báo đóng tiền dựa trên số ngày cần phải đóng tiền định kỳ → 30 ngày thì thanh toán điện nước, 90 ngày thì đóng tiền học (9)
 Luồng nghiệp vụ

 Yêu cầu chức năng (Tự đặt các câu hỏi rồi tự implement)
Các câu hỏi đặt ra?
		- Có bao nhiêu actor chính trong dự án? 2 role
- App có được giữ tiền của User không? : có hoặc kh
- App hay Web hay Web App?: Web/app (pwa/tamgui)
- App thực hiện quản lí tài chính là Chi tiêu - Tiết Kiệm
- App phục vụ lượng truy cập như thế nào? phù hợp để scale là dc

		- Mỗi role có các nghiệp vụ ntn?
	         
	 - App có tính tăng kết nối giữa các User hay không ?(optional)
	 - App có tích hợp API bên ngoài hay không ? Tích hợp rất nhiều
	 - Nếu App giữ tiền thì App có được thực hiện các khoản chi tự động hay không ? K Nên vì rất lớn
	 - Nếu App không giữ tiền thì App sẽ theo dõi số dư trực tiếp trên bank account của khách hàng hay xử lí trên số tiền mà khách hàng phải nhập khi bước vào app ? 
 - App có cần đưa ra lời khuyên chi tiêu cho User hay không?  Cần đưa ra lời khuyên cho user
 - App có phân mục các khoản chi hay không ? Phải có -> Có thể xếp hạn hoặc chọn hủ mặc định cho việc chuyển khoản
- Các công nghệ/thirdparty đặc thù sẽ implement vào project, (maybe có Sepay hoặc công nghệ nào để biết được là người dùng )(?)
- Thời gian trong bao lâu?: 1 Tháng
- Tối ưu UI-UX như thế nào?: Dễ dùng và tường minh là được
		- Thiết kế DB ở local hay deploy Docker?: Deploy docker
		
Feature của user
CRUD dữ liệu chi tiêu
Thêm ngân hàng liên kết 
Chọn danh sách các phương pháp muốn quản lí chi tiêu(N hủ chi tiêu, …)
Dashboard quản lý tổng quan số dư, biểu đồ thu chi và các danh sách giao dịch gần đây
Đặt hạn mức chi tiêu tháng/ngày, theo từng hạng mục
Setup cảnh báo chi tiêu khi gần vượt hạn mức
Tự tạo hoặc sử dụng các hạng mục mặc định (ăn uống, di chuyển, shopping, ...)
Chụp ảnh hóa đơn thông minh, hệ thống từ điền thông tin dựa trên hóa đơn
Mời bạn bè tham gia quản lý ví chung (optional)
Đưa plan, đề xuất để hoàn thành mục tiêu tiết kiệm → support user hoàn thành mục tiêu tốt hơn

Feature của admin
  		    - Quản lý người dùng (xem, tìm kiếm, khóa//mở khóa tài khoản)
   - Quản lý thông báo, gửi thông báo cho toàn bộ người dùng
  - Dashboard thống kê, phân tích số lượng người dùng mới, lượng giao dịch đang được xử lý trên hệ thống
- Cấu hình cái system promt cho AI(Nghiêm khắc hoặc thoải mái)
- Chọn model, thêm API key cho AI
- Control cả FE và BE (optional)
Feature của Hệ thống
Tích hợp AI tự động đưa lời khuyên thay vì setup bằng tay ở mức cảnh báo
gợi ý lời khuyên đề xuất để hoàn thành mục tiêu tiết kiệm


Triển khai kỹ thuật
Các giai đoạn triển khai
Yêu cầu kỹ thuật
Backend: Dotnet 8. 
Frontend: React-vite
Db: Postgres
….. (API được sử dụng)
Thời gian & Các mốc quan trọng (15/4-15/5)
15/4- 19/4: Hoàn thành APIs giả định cho FE lẫn BE, setup repo
19/4 - 23/4: Entity, DB, Fix lỗi DB, thiết kế giao diện 
23/4 - 7/5 : implement các nghiệp vụ của các role đã đề cập ở trên
7/5-15/5: Maintain dự án, test

Kết quả mong đợi
Cải tiến kỹ thuật
Giá trị dài hạn :  
Đánh giá rủi ro
Nếu app giữ tiền: có thể sẽ bị mất lịch sử giao dịch hoặc giao lịch bị lỗi. 
Các mốc bị trễ so với đề ra: Tranh thủ rush và hối task member
Kh phân biệt được hũ nào dành cho người dùng nào, Nếu 1 hũ của người dùng bị mất thì tiền sẽ mất hay qua hũ nào? (_)
Nếu setup range cảnh báo cho hũ mà nếu vượt ngưỡng mà kh thông báo thì sẽ giải quết ntn?
Trong quá trình đang chuyển tiền qua lại giữa các hũ mà hũ rớt thì sao?: back lại hũ cũ và thông báo có lỗi
Nếu người dùng nhập dư 1 vài số trc khi chuyển tiền vào hũ? nếu vượt quá số tiền user có thì thông báo chuyển tiền kh thành công
Đồng bộ dữ liệu giữa nhiều thiết bị bị conflict

    

