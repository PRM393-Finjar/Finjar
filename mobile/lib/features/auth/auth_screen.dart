import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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
      setState(() {
        _errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleRegister() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final name = _nameController.text.trim();
      List<String> nameParts = name.split(' ');
      String lastName = nameParts.isNotEmpty ? nameParts[0] : 'User';
      String firstName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : 'Name';
      String username = _usernameController.text.trim();
      if (username.isEmpty) {
        username = _emailController.text.split('@')[0];
      }

      final response = await _apiClient.post('auth/register', data: {
        'username': username,
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'firstName': firstName,
        'lastName': lastName,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Clear password and personal details, keeping the email pre-filled
        _passwordController.clear();
        _nameController.clear();
        _usernameController.clear();
        // Switch to login tab
        _tabController.animateTo(0);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đăng ký thành công! Hãy đăng nhập.')),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Đăng ký thất bại. Email đã tồn tại hoặc không hợp lệ.';
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
                  height: 320,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // Login flow
                      Column(
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
                          const Spacer(),
                          _isLoading
                              ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
                              : BrutalButton(
                                  text: 'ĐĂNG NHẬP',
                                  onTap: _handleLogin,
                                  color: BrutalColors.green,
                                ),
                        ],
                      ),
                      // Register flow
                      Column(
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
                          const Spacer(),
                          _isLoading
                              ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
                              : BrutalButton(
                                  text: 'ĐĂNG KÝ',
                                  onTap: _handleRegister,
                                  color: BrutalColors.purple,
                                ),
                        ],
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
