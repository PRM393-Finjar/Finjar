import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/brutal_theme.dart';
import '../../../shared/widgets/brutal_button.dart';
import '../../../shared/widgets/brutal_card.dart';
import '../../../shared/widgets/brutal_text_field.dart';
import '../providers/auth_provider.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _loginFormKey = GlobalKey<FormState>();
  final _registerFormKey = GlobalKey<FormState>();

  // Login controllers
  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();

  // Register controllers
  final _registerUsernameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerFirstNameController = TextEditingController();
  final _registerLastNameController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  final _registerConfirmPasswordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Auto fill defaults in Dev mode if needed
    _loginEmailController.text = "anh@finjar.app";
    _loginPasswordController.text = "123456";
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _registerUsernameController.dispose();
    _registerEmailController.dispose();
    _registerFirstNameController.dispose();
    _registerLastNameController.dispose();
    _registerPasswordController.dispose();
    _registerConfirmPasswordController.dispose();
    super.dispose();
  }

  void _submitLogin() async {
    if (_loginFormKey.currentState?.validate() ?? false) {
      final success = await ref.read(authProvider.notifier).login(
            _loginEmailController.text,
            _loginPasswordController.text,
          );
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đăng nhập thành công!'),
            backgroundColor: BrutalTheme.green,
          ),
        );
      }
    }
  }

  void _submitRegister() async {
    if (_registerFormKey.currentState?.validate() ?? false) {
      if (_registerPasswordController.text != _registerConfirmPasswordController.text) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Mật khẩu xác nhận không trùng khớp.'),
            backgroundColor: BrutalTheme.red,
          ),
        );
        return;
      }

      final success = await ref.read(authProvider.notifier).register(
            username: _registerUsernameController.text,
            email: _registerEmailController.text,
            firstName: _registerFirstNameController.text,
            lastName: _registerLastNameController.text,
            password: _registerPasswordController.text,
          );
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đăng ký tài khoản thành công!'),
            backgroundColor: BrutalTheme.green,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: BrutalTheme.onboardingBg,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo/Brand Name
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: BrutalTheme.green,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: BrutalTheme.ink, width: 2),
                  boxShadow: const [
                    BoxShadow(
                      color: BrutalTheme.ink,
                      offset: Offset(4, 4),
                    )
                  ],
                ),
                child: Text(
                  'FINJAR',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: BrutalTheme.ink,
                        fontSize: 36,
                        letterSpacing: 2.0,
                      ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Quản lý tài chính cá nhân',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: BrutalTheme.grey,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 32),

              // Main Auth Card
              BrutalCard(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Tab Header (Neubrutalism Pill style)
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: BrutalTheme.bg,
                        borderRadius: BorderRadius.circular(9999),
                        border: Border.all(color: BrutalTheme.ink, width: 2),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        indicator: BoxDecoration(
                          color: BrutalTheme.ink,
                          borderRadius: BorderRadius.circular(9999),
                        ),
                        labelColor: BrutalTheme.white,
                        unselectedLabelColor: BrutalTheme.ink,
                        labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                        tabs: const [
                          Tab(text: 'Đăng nhập'),
                          Tab(text: 'Đăng ký'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Error text
                    if (authState.error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: BrutalTheme.red, width: 1.5),
                        ),
                        child: Text(
                          authState.error!,
                          style: const TextStyle(
                            color: BrutalTheme.red,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Tab View Content (Customized without nesting full TabBarView height constraint issues)
                    AnimatedBuilder(
                      animation: _tabController,
                      builder: (context, child) {
                        return IndexedStack(
                          index: _tabController.index,
                          children: [
                            // Login Form
                            Form(
                              key: _loginFormKey,
                              child: Column(
                                children: [
                                  BrutalTextField(
                                    label: 'Địa chỉ email',
                                    hintText: 'ten@email.com',
                                    controller: _loginEmailController,
                                    keyboardType: TextInputType.emailAddress,
                                    validator: (val) {
                                      if (val == null || val.trim().isEmpty) {
                                        return 'Vui lòng nhập email';
                                      }
                                      if (!val.contains('@')) {
                                        return 'Email không hợp lệ';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 16),
                                  BrutalTextField(
                                    label: 'Mật khẩu',
                                    hintText: '••••••••',
                                    controller: _loginPasswordController,
                                    isPassword: true,
                                    validator: (val) {
                                      if (val == null || val.isEmpty) {
                                        return 'Vui lòng nhập mật khẩu';
                                      }
                                      if (val.length < 6) {
                                        return 'Mật khẩu phải từ 6 ký tự';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 24),
                                  BrutalButton(
                                    text: 'Đăng nhập',
                                    isLoading: authState.isLoading,
                                    onPressed: _submitLogin,
                                  ),
                                ],
                              ),
                            ),

                            // Register Form
                            Form(
                              key: _registerFormKey,
                              child: Column(
                                children: [
                                  BrutalTextField(
                                    label: 'Tên đăng nhập',
                                    hintText: 'ten_dang_nhap',
                                    controller: _registerUsernameController,
                                    validator: (val) {
                                      if (val == null || val.trim().isEmpty) {
                                        return 'Vui lòng nhập tên đăng nhập';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: BrutalTextField(
                                          label: 'Họ',
                                          hintText: 'Nguyễn',
                                          controller: _registerLastNameController,
                                          validator: (val) {
                                            if (val == null || val.trim().isEmpty) {
                                              return 'Nhập họ';
                                            }
                                            return null;
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: BrutalTextField(
                                          label: 'Tên',
                                          hintText: 'Văn A',
                                          controller: _registerFirstNameController,
                                          validator: (val) {
                                            if (val == null || val.trim().isEmpty) {
                                              return 'Nhập tên';
                                            }
                                            return null;
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  BrutalTextField(
                                    label: 'Địa chỉ email',
                                    hintText: 'ten@email.com',
                                    controller: _registerEmailController,
                                    keyboardType: TextInputType.emailAddress,
                                    validator: (val) {
                                      if (val == null || val.trim().isEmpty) {
                                        return 'Vui lòng nhập email';
                                      }
                                      if (!val.contains('@')) {
                                        return 'Email không hợp lệ';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 12),
                                  BrutalTextField(
                                    label: 'Mật khẩu',
                                    hintText: '••••••••',
                                    controller: _registerPasswordController,
                                    isPassword: true,
                                    validator: (val) {
                                      if (val == null || val.isEmpty) {
                                        return 'Vui lòng nhập mật khẩu';
                                      }
                                      if (val.length < 6) {
                                        return 'Mật khẩu tối thiểu 6 ký tự';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 12),
                                  BrutalTextField(
                                    label: 'Xác nhận mật khẩu',
                                    hintText: '••••••••',
                                    controller: _registerConfirmPasswordController,
                                    isPassword: true,
                                    validator: (val) {
                                      if (val == null || val.isEmpty) {
                                        return 'Xác nhận lại mật khẩu';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 24),
                                  BrutalButton(
                                    text: 'Tạo tài khoản',
                                    isLoading: authState.isLoading,
                                    onPressed: _submitRegister,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
