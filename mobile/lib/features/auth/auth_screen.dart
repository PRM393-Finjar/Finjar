import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/storage/secure_storage.dart';
import 'package:finjar_mobile/core/network/api_client.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({Key? key}) : super(key: key);

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();

  final _apiClient = ApiClient();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _nameController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.post('auth/login', data: {
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = response.data['token'] ?? response.data['accessToken'];
        if (token != null) {
          await SecureStorage.saveToken(token);
          // Navigate to dashboard
          if (mounted) context.go('/dashboard');
        }
      }
    } catch (e) {
      String msg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.';
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          msg = data['message'].toString();
        }
      }
      setState(() {
        _errorMessage = msg;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleRegister() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (name.isEmpty) {
      setState(() {
        _errorMessage = 'Vui lòng nhập Họ và tên.';
      });
      return;
    }

    if (email.isEmpty || !email.contains('@')) {
      setState(() {
        _errorMessage = 'Vui lòng nhập địa chỉ Email hợp lệ.';
      });
      return;
    }

    if (password.isEmpty || confirmPassword.isEmpty) {
      setState(() {
        _errorMessage = 'Vui lòng nhập đầy đủ mật khẩu và xác nhận mật khẩu.';
      });
      return;
    }

    if (password != confirmPassword) {
      setState(() {
        _errorMessage = 'Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      List<String> nameParts = name.split(RegExp(r'\s+'));
      String lastName = nameParts.isNotEmpty && nameParts[0].isNotEmpty ? nameParts[0] : name;
      String firstName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : lastName;
      String username = _usernameController.text.trim();
      if (username.isEmpty) {
        username = email;
      }

      final response = await _apiClient.post('auth/register', data: {
        'username': username,
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Clear password and personal details, keeping the email pre-filled
        _passwordController.clear();
        _confirmPasswordController.clear();
        _nameController.clear();
        _usernameController.clear();
        // Switch to login tab
        _tabController.animateTo(0);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đăng ký thành công! Hãy đăng nhập.')),
        );
      }
    } catch (e) {
      String msg = 'Đăng ký thất bại.';
      if (e is DioException) {
        if (e.response?.data != null) {
          final data = e.response!.data;
          if (data is Map) {
            final serverMsg = (data['message'] ?? data['error'] ?? '').toString();
            if (serverMsg.toLowerCase().contains('email already exists')) {
              msg = 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.';
            } else if (serverMsg.toLowerCase().contains('username already exists')) {
              msg = 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.';
            } else if (serverMsg.isNotEmpty) {
              msg = serverMsg;
            } else {
              msg = 'Lỗi dữ liệu gửi lên máy chủ.';
            }
            if (data['details'] != null) {
              final details = data['details'];
              if (details is List && details.isNotEmpty) {
                final errs = details.map((d) => d is Map ? (d['error'] ?? d['message'] ?? d.toString()) : d.toString()).join(', ');
                msg = '$msg ($errs)';
              }
            }
          } else {
            msg = data.toString();
          }
        } else {
          msg = 'Không thể kết nối đến máy chủ API (${e.message})';
        }
      } else {
        msg = '$e';
      }
      setState(() {
        _errorMessage = msg;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrutalColors.bg,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo Finjar
              Text(
                '💰 Finjar',
                textAlign: TextAlign.center,
                style: BrutalStyles.titleStyle(size: 36),
              ),
              const SizedBox(height: 8),
              Text(
                'Quản lý tài chính cá nhân chuẩn Neubrutalism',
                textAlign: TextAlign.center,
                style: BrutalStyles.bodyStyle(size: 14, color: BrutalColors.grey),
              ),
              const SizedBox(height: 32),

              // Tabs
              Container(
                decoration: BoxDecoration(
                  color: BrutalColors.cardBg,
                  border: BrutalStyles.border,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BrutalStyles.shadowSm],
                ),
                child: TabBar(
                  controller: _tabController,
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  indicator: BoxDecoration(
                    color: BrutalColors.ink,
                    borderRadius: const BorderRadius.all(Radius.circular(10)),
                  ),
                  labelColor: BrutalColors.cardBg,
                  unselectedLabelColor: BrutalColors.ink,
                  labelStyle: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w800),
                  tabs: const [
                    Tab(text: 'Đăng nhập'),
                    Tab(text: 'Đăng ký'),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Card containing inputs
              BrutalCard(
                child: SizedBox(
                  height: 440,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // Login flow
                      SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            BrutalInput(
                              label: 'Email / Tên đăng nhập',
                              hint: 'user@example.com',
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 16),
                            BrutalInput(
                              label: 'Mật khẩu',
                              hint: '••••••••',
                              controller: _passwordController,
                              obscureText: true,
                            ),
                            const SizedBox(height: 32),
                            _isLoading
                                ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
                                : BrutalButton(
                                    text: 'ĐĂNG NHẬP',
                                    onTap: _handleLogin,
                                    color: BrutalColors.green,
                                  ),
                          ],
                        ),
                      ),
                      // Register flow
                      SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            BrutalInput(
                              label: 'Họ và tên',
                              hint: 'Nguyễn Văn A',
                              controller: _nameController,
                            ),
                            const SizedBox(height: 12),
                            BrutalInput(
                              label: 'Email',
                              hint: 'user@example.com',
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 12),
                            BrutalInput(
                              label: 'Mật khẩu',
                              hint: '••••••••',
                              controller: _passwordController,
                              obscureText: true,
                            ),
                            const SizedBox(height: 12),
                            BrutalInput(
                              label: 'Xác nhận mật khẩu',
                              hint: '••••••••',
                              controller: _confirmPasswordController,
                              obscureText: true,
                            ),
                            const SizedBox(height: 20),
                            _isLoading
                                ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
                                : BrutalButton(
                                    text: 'ĐĂNG KÝ',
                                    onTap: _handleRegister,
                                    color: BrutalColors.purple,
                                  ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                BrutalCard(
                  color: const Color(0xFFFEE2E2),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Text(
                    _errorMessage!,
                    style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.destructive, weight: FontWeight.w700),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
