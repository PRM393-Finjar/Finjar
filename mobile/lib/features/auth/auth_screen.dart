import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/config/env.dart';
import 'package:finjar_mobile/core/config/test_data.dart';
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
  final _otpController = TextEditingController();

  final _apiClient = ApiClient();
  bool _isLoading = false;
  bool _awaitingOtp = false;
  String _pendingEmail = '';
  String? _errorMessage;
  String? _infoMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) setState(() {});
    });
    if (true) {
      // Prefill tài khoản demo để test trên device/USB nhanh hơn.
      _emailController.text = TestData.userEmail;
      _passwordController.text = TestData.userPassword;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _usernameController.dispose();
    _otpController.dispose();
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
        final data = response.data;
        final token = data is Map
            ? (data['accessToken'] ?? data['AccessToken'] ?? data['token'])
            : null;
        if (token != null && token.toString().isNotEmpty) {
          await SecureStorage.saveToken(token.toString());
          await SecureStorage.recordSuccessfulLogin(_emailController.text.trim());
          final onboardingDone = data is Map &&
              (data['isOnboardingCompleted'] == true ||
                  data['IsOnboardingCompleted'] == true);
          await SecureStorage.saveOnboardingCompleted(onboardingDone);
          if (!mounted) return;
          context.go(onboardingDone ? '/dashboard' : '/onboarding');
          return;
        }
        setState(() {
          _errorMessage = 'Đăng nhập thất bại: API không trả token.';
        });
        return;
      }
      setState(() {
        _errorMessage = 'Đăng nhập thất bại (mã ${response.statusCode}).';
      });
    } on DioException catch (e) {
      setState(() {
        if (e.type == DioExceptionType.connectionError ||
            e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout ||
            e.type == DioExceptionType.sendTimeout) {
          _errorMessage =
              'Không kết nối được backend tại ${Env.apiBaseUrl}. Free tier Render có thể đang ngủ — đợi ~30–60s rồi thử lại.';
        } else if (e.response?.statusCode == 403) {
          final email = _emailController.text.trim();
          if (email.isNotEmpty && mounted) {
            context.go('/verify-email/pending?email=${Uri.encodeComponent(email)}');
            return;
          }
          final msg = e.response?.data?['message']?.toString() ?? e.response?.data?['error']?.toString();
          _errorMessage = msg ?? 'Email chưa được xác thực. Nhập mã OTP để hoàn tất đăng ký.';
        } else if (e.response?.statusCode == 400 || e.response?.statusCode == 401) {
          final msg = e.response?.data?['message']?.toString() ?? e.response?.data?['error']?.toString();
          _errorMessage = msg ??
              'Sai email hoặc mật khẩu. Dùng: ${TestData.userEmail} / ${TestData.userPassword}';
        } else if (e.response?.statusCode == 500) {
          final msg = e.response?.data?['message']?.toString() ?? e.response?.data?['error']?.toString();
          _errorMessage =
              'Server lỗi khi đăng nhập (${msg ?? '500'}). Thường do chưa có user trên DB Render — bật SeedAccounts hoặc đăng ký mới.';
        } else {
          _errorMessage = 'Đăng nhập thất bại: ${e.message ?? 'Lỗi không xác định'}';
        }
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Đăng nhập thất bại: $e';
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
        username = _emailController.text.trim();
      }

      final response = await _apiClient.post('auth/register', data: {
        'username': username,
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'firstName': firstName,
        'lastName': lastName,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        final requiresVerify = data is Map &&
            ((data['requiresEmailVerification'] ?? data['RequiresEmailVerification']) == true);
        final token = data is Map
            ? (data['accessToken'] ?? data['AccessToken'] ?? data['token'])
            : null;

        if (requiresVerify || token == null || token.toString().isEmpty) {
          if (!mounted) return;
          setState(() {
            _awaitingOtp = true;
            _pendingEmail = _emailController.text.trim();
            _infoMessage = 'Mã OTP đã gửi tới $_pendingEmail. Nhập mã để hoàn tất đăng ký.';
            _errorMessage = null;
          });
          return;
        }

        if (token != null && token.toString().isNotEmpty) {
          await SecureStorage.saveToken(token.toString());
          await SecureStorage.recordSuccessfulLogin(_emailController.text.trim());
          await SecureStorage.saveOnboardingCompleted(false);
          if (mounted) context.go('/onboarding');
          return;
        }
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
            }
          } else {
            msg = data.toString();
          }
        } else {
          msg = 'Không kết nối được máy chủ (${e.message})';
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

  Future<void> _handleVerifyOtp() async {
    final email = _pendingEmail.trim();
    final otp = _otpController.text.trim();
    if (email.isEmpty || otp.length != 6) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    try {
      await _apiClient.post('auth/verify-email', data: {'email': email, 'otp': otp});
      if (!mounted) return;
      setState(() {
        _awaitingOtp = false;
        _otpController.clear();
        _infoMessage = 'Đăng ký thành công! Bạn có thể đăng nhập.';
      });
      _tabController.animateTo(0);
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.response?.data?['message']?.toString() ?? 'Mã OTP không đúng hoặc đã hết hạn.';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleResendOtp() async {
    if (_pendingEmail.trim().isEmpty) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      await _apiClient.post('auth/resend-verification', data: {'email': _pendingEmail.trim()});
      setState(() {
        _infoMessage = 'Đã gửi lại mã OTP (nếu email hợp lệ).';
      });
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.response?.data?['message']?.toString() ?? 'Không gửi được mã OTP.';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
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
                  height: _tabController.index == 0 ? 320 : (_awaitingOtp ? 380 : 420),
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
                      _awaitingOtp
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  'Nhập mã OTP gửi tới $_pendingEmail',
                                  style: BrutalStyles.bodyStyle(size: 14),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Dev: xem mã OTP trong log backend.',
                                  style: BrutalStyles.bodyStyle(size: 12, color: BrutalColors.grey),
                                ),
                                const SizedBox(height: 16),
                                TextField(
                                  controller: _otpController,
                                  keyboardType: TextInputType.number,
                                  textAlign: TextAlign.center,
                                  maxLength: 6,
                                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                  style: BrutalStyles.titleStyle(size: 28),
                                  decoration: InputDecoration(
                                    counterText: '',
                                    hintText: '000000',
                                    filled: true,
                                    fillColor: BrutalColors.cardBg,
                                    border: OutlineInputBorder(
                                      borderSide: BorderSide(color: BrutalColors.ink, width: 2),
                                      borderRadius: BorderRadius.circular(BrutalStyles.borderRadiusValue),
                                    ),
                                  ),
                                  onChanged: (_) => setState(() {}),
                                ),
                                const Spacer(),
                                if (_isLoading)
                                  Center(child: CircularProgressIndicator(color: BrutalColors.ink))
                                else ...[
                                  BrutalButton(
                                    text: 'XÁC THỰC & HOÀN TẤT',
                                    onTap: _otpController.text.length == 6 ? _handleVerifyOtp : () {},
                                    color: BrutalColors.green,
                                  ),
                                  const SizedBox(height: 12),
                                  BrutalButton(
                                    text: 'GỬI LẠI MÃ OTP',
                                    onTap: _handleResendOtp,
                                    color: BrutalColors.purple,
                                  ),
                                  const SizedBox(height: 12),
                                  BrutalButton(
                                    text: 'QUAY LẠI',
                                    onTap: () => setState(() {
                                      _awaitingOtp = false;
                                      _otpController.clear();
                                      _infoMessage = null;
                                    }),
                                    color: BrutalColors.lightGrey,
                                  ),
                                ],
                              ],
                            )
                          : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          BrutalInput(
                            label: 'Họ và tên',
                            hint: 'Nguyễn Văn A',
                            controller: _nameController,
                            textCapitalization: TextCapitalization.words,
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

              if (_infoMessage != null) ...[
                const SizedBox(height: 16),
                BrutalCard(
                  color: BrutalColors.successBg,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Text(
                    _infoMessage!,
                    style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.successText, weight: FontWeight.w700),
                  ),
                ),
              ],

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

              if (kDebugMode) ...[
                const SizedBox(height: 12),
                Text(
                  'Test user: ${TestData.userEmail} / ${TestData.userPassword}',
                  textAlign: TextAlign.center,
                  style: BrutalStyles.bodyStyle(size: 11, color: BrutalColors.grey, weight: FontWeight.w500),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
