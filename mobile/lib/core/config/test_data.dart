/// Tài khoản seed từ `appsettings.json` (backend local).
/// Cần chạy API + PostgreSQL trước khi đăng nhập.
class TestData {
  /// Tài khoản có sẵn trên DB local (PersonalFinanceManagementDb).
  static const userEmail = 'vupho200304@gmail.com';
  static const userPassword = 'User@123456';
  static const userUsername = 'vupho200304';
  static const userFullName = 'Test User';

  static const adminEmail = 'admin@gmail.com';
  static const adminPassword = 'Admin@123456';
  static const adminUsername = 'admindz';

  /// Dùng khi đăng ký tài khoản mới (đổi email nếu đã tồn tại).
  static const registerExample = RegisterExample(
    fullName: 'Nguyễn Văn A',
    email: 'vana.test@finjar.local',
    password: 'User@123456',
    username: 'vana_test',
  );
}

class RegisterExample {
  final String fullName;
  final String email;
  final String password;
  final String username;

  const RegisterExample({
    required this.fullName,
    required this.email,
    required this.password,
    required this.username,
  });
}
