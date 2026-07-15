import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/network/api_endpoints.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/storage/secure_storage.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _apiClient = ApiClient();
  bool _isLoading = false;
  bool _isDarkMode = false;

  String _firstName = '';
  String _lastName = '';
  String _userName = '';
  String _userEmail = '';
  String _currency = 'VND';
  String? _avatarUrl;

  static const List<String> _currencies = [
    'VND', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'SGD', 'THB', 'CNY'
  ];

  // Emoji avatars for selection
  static const List<String> _avatarEmojis = [
    '🐷', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🦄', '🐙',
    '🦋', '🐬', '🦅', '🐲', '🌟', '🎯', '💎', '🚀', '🌈', '🎸',
  ];

  @override
  void initState() {
    super.initState();
    _isDarkMode = AppSettings().isDarkMode;
    _fetchProfileData();
  }

  Future<void> _fetchProfileData() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiClient.get('user/me');
      if (response.statusCode == 200) {
        final data = response.data;
        setState(() {
          _firstName = data['firstName'] ?? data['FirstName'] ?? '';
          _lastName = data['lastName'] ?? data['LastName'] ?? '';
          _userName = data['userName'] ?? data['UserName'] ?? '';
          _userEmail = data['email'] ?? data['Email'] ?? 'Chưa có email';
          if (_userEmail.isNotEmpty && _userEmail != 'Chưa có email') {
            SecureStorage.saveUserEmail(_userEmail);
          }
          _currency = data['preferredCurrency'] ?? data['PreferredCurrency'] ?? 'VND';
          AppSettings().setCurrency(_currency);
          _avatarUrl = data['avatarUrl'] ?? data['AvatarUrl'];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể tải thông tin người dùng.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String get _displayName {
    final full = '$_firstName $_lastName'.trim();
    return full.isNotEmpty ? full : (_userName.isNotEmpty ? _userName : 'Chưa đặt tên');
  }

  // ── Edit Name ──────────────────────────────────────────────
  void _showEditNameDialog() {
    final firstCtrl = TextEditingController(text: _firstName);
    final lastCtrl = TextEditingController(text: _lastName);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Đổi tên hiển thị ✏️', style: BrutalStyles.titleStyle(size: 20)),
            const SizedBox(height: 16),
            BrutalInput(label: 'Họ', hint: 'Nguyễn', controller: firstCtrl),
            const SizedBox(height: 12),
            BrutalInput(label: 'Tên', hint: 'Văn A', controller: lastCtrl),
            const SizedBox(height: 24),
            BrutalButton(
              text: 'CẬP NHẬT TÊN',
              color: BrutalColors.green,
              onTap: () async {
                try {
                  await _apiClient.patch('user/me', data: {
                    'firstName': firstCtrl.text.trim(),
                    'lastName': lastCtrl.text.trim(),
                  });
                  setState(() {
                    _firstName = firstCtrl.text.trim();
                    _lastName = lastCtrl.text.trim();
                  });
                  if (mounted) Navigator.pop(ctx);
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Cập nhật tên thành công!')),
                  );
                } catch (e) {
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Không thể cập nhật tên.')),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  // ── Change Avatar ──────────────────────────────────────────
  void _showChangeAvatarDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Chọn avatar 🎭', style: BrutalStyles.titleStyle(size: 20)),
            const SizedBox(height: 16),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 5,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: _avatarEmojis.length,
              itemBuilder: (_, i) {
                final emoji = _avatarEmojis[i];
                final isSelected = _avatarUrl == emoji;
                return GestureDetector(
                  onTap: () async {
                    try {
                      await _apiClient.patch('user/me', data: {'avatarUrl': emoji});
                      setState(() => _avatarUrl = emoji);
                      if (mounted) Navigator.pop(ctx);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đổi avatar thành công!')),
                      );
                    } catch (e) {
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Không thể đổi avatar.')),
                      );
                    }
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected ? BrutalColors.green : BrutalColors.cardBg,
                      border: Border.all(
                        color: isSelected ? BrutalColors.ink : Colors.grey.shade300,
                        width: isSelected ? 2.5 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(emoji, style: const TextStyle(fontSize: 28)),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ── Change Currency ────────────────────────────────────────
  void _showChangeCurrencyDialog() {
    String selected = _currency;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Đơn vị tiền tệ 💱', style: BrutalStyles.titleStyle(size: 20)),
                const SizedBox(height: 16),
                ..._currencies.map((c) => GestureDetector(
                  onTap: () => setModalState(() => selected = c),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: selected == c ? BrutalColors.green : BrutalColors.cardBg,
                      border: Border.all(
                        color: selected == c ? BrutalColors.ink : Colors.grey.shade300,
                        width: selected == c ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(c, style: BrutalStyles.bodyStyle(size: 16, weight: FontWeight.w700)),
                        if (selected == c) Icon(Icons.check_circle, color: BrutalColors.ink, size: 20),
                      ],
                    ),
                  ),
                )),
                const SizedBox(height: 16),
                BrutalButton(
                  text: 'LƯU TIỀN TỆ',
                  color: BrutalColors.purple,
                  onTap: () async {
                    try {
                      await _apiClient.patch('user/me', data: {'preferredCurrency': selected});
                      setState(() => _currency = selected);
                      AppSettings().setCurrency(selected);
                      if (mounted) Navigator.pop(ctx);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Đã đổi tiền tệ sang $selected!')),
                      );
                    } catch (e) {
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Không thể đổi đơn vị tiền tệ.')),
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Change Password ────────────────────────────────────────
  void _showChangePasswordDialog() {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool showCurrent = false;
    bool showNew = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Đổi mật khẩu 🔐', style: BrutalStyles.titleStyle(size: 20)),
                const SizedBox(height: 16),
                BrutalInput(
                  label: 'Mật khẩu hiện tại',
                  hint: '••••••••',
                  controller: currentCtrl,
                  obscureText: !showCurrent,
                  suffixIcon: IconButton(
                    icon: Icon(showCurrent ? Icons.visibility_off : Icons.visibility, color: BrutalColors.grey),
                    onPressed: () => setModalState(() => showCurrent = !showCurrent),
                  ),
                ),
                const SizedBox(height: 12),
                BrutalInput(
                  label: 'Mật khẩu mới (tối thiểu 6 ký tự)',
                  hint: '••••••••',
                  controller: newCtrl,
                  obscureText: !showNew,
                  suffixIcon: IconButton(
                    icon: Icon(showNew ? Icons.visibility_off : Icons.visibility, color: BrutalColors.grey),
                    onPressed: () => setModalState(() => showNew = !showNew),
                  ),
                ),
                const SizedBox(height: 12),
                BrutalInput(
                  label: 'Xác nhận mật khẩu mới',
                  hint: '••••••••',
                  controller: confirmCtrl,
                  obscureText: true,
                ),
                const SizedBox(height: 24),
                BrutalButton(
                  text: 'ĐỔI MẬT KHẨU',
                  color: BrutalColors.green,
                  onTap: () async {
                    if (newCtrl.text != confirmCtrl.text) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Mật khẩu xác nhận không khớp!')),
                      );
                      return;
                    }
                    if (newCtrl.text.length < 6) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Mật khẩu mới phải có ít nhất 6 ký tự!')),
                      );
                      return;
                    }
                    try {
                      await _apiClient.patch('user/me/password', data: {
                        'currentPassword': currentCtrl.text,
                        'newPassword': newCtrl.text,
                      });
                      if (mounted) Navigator.pop(ctx);
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đổi mật khẩu thành công! 🎉')),
                      );
                    } catch (e) {
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.')),
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    final passwordCtrl = TextEditingController();
    var isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Xác nhận đăng xuất', style: BrutalStyles.titleStyle(size: 20)),
              const SizedBox(height: 8),
              Text(
                'Nhập lại mật khẩu để đăng xuất an toàn.',
                style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.grey),
              ),
              const SizedBox(height: 16),
              BrutalInput(
                label: 'Mật khẩu',
                hint: '••••••••',
                controller: passwordCtrl,
                obscureText: true,
              ),
              const SizedBox(height: 24),
              BrutalButton(
                text: isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐĂNG XUẤT',
                color: BrutalColors.destructive,
                onTap: isSubmitting
                    ? null
                    : () async {
                        if (passwordCtrl.text.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Vui lòng nhập mật khẩu.')),
                          );
                          return;
                        }

                        setSheetState(() => isSubmitting = true);
                        final success = await _handleLogout(passwordCtrl.text);
                        if (!context.mounted) return;

                        if (success) {
                          Navigator.pop(ctx);
                        } else {
                          setSheetState(() => isSubmitting = false);
                        }
                      },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<bool> _handleLogout(String password) async {
    final email = (await SecureStorage.getUserEmail()) ?? _userEmail;
    if (email.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không tìm thấy email đăng nhập. Vui lòng đăng nhập lại.')),
        );
      }
      await SecureStorage.clearSession();
      if (mounted) context.go('/auth');
      return true;
    }

    setState(() => _isLoading = true);
    try {
      await _apiClient.post(ApiEndpoints.login, data: {
        'email': email,
        'password': password,
      });
    } on DioException catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mật khẩu không đúng. Không thể đăng xuất.')),
        );
      }
      if (mounted) setState(() => _isLoading = false);
      return false;
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể xác minh mật khẩu. Thử lại sau.')),
        );
      }
      if (mounted) setState(() => _isLoading = false);
      return false;
    }

    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {}

    await SecureStorage.clearSession();
    if (mounted) {
      setState(() => _isLoading = false);
      context.go('/auth');
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrutalColors.bg,
      appBar: AppBar(
        backgroundColor: BrutalColors.cardBg,
        elevation: 0,
        title: Text('Cá Nhân 👤', style: BrutalStyles.titleStyle(size: 22)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: BrutalColors.ink),
          onPressed: () => GoRouter.of(context).go('/dashboard'),
        ),
        shape: Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh, color: BrutalColors.ink),
            onPressed: _fetchProfileData,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
          : RefreshIndicator(
              onRefresh: _fetchProfileData,
              color: BrutalColors.ink,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Avatar + Name card ─────────────────────
                    BrutalCard(
                      color: BrutalColors.purple,
                      child: Column(
                        children: [
                          // Avatar with edit button
                          Stack(
                            alignment: Alignment.bottomRight,
                            children: [
                              GestureDetector(
                                onTap: _showChangeAvatarDialog,
                                child: Container(
                                  width: 90,
                                  height: 90,
                                  decoration: BoxDecoration(
                                    color: BrutalColors.cardBg,
                                    border: BrutalStyles.border,
                                    shape: BoxShape.circle,
                                    boxShadow: [BrutalStyles.shadowSm],
                                  ),
                                  child: Center(
                                    child: Text(
                                      _avatarUrl ?? '🐷',
                                      style: const TextStyle(fontSize: 44),
                                    ),
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: _showChangeAvatarDialog,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: BrutalColors.green,
                                    border: BrutalStyles.border,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Icons.edit, size: 14, color: BrutalColors.ink),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            _displayName,
                            style: BrutalStyles.titleStyle(size: 22),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _userEmail,
                            style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.ink),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 14),
                          // Edit name button
                          BrutalButton(
                            text: 'ĐỔI TÊN HIỂN THỊ',
                            color: BrutalColors.cardBg,
                            onTap: _showEditNameDialog,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── Settings section ───────────────────────
                    Text('Tùy chỉnh hệ thống', style: BrutalStyles.titleStyle(size: 18)),
                    const SizedBox(height: 12),

                    BrutalCard(
                      color: BrutalColors.cardBg,
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          // Currency
                          _buildTappableTile(
                            icon: Icons.currency_exchange_outlined,
                            title: 'Đơn vị tiền tệ',
                            trailing: _currency,
                            trailingColor: BrutalColors.purple,
                            onTap: _showChangeCurrencyDialog,
                          ),
                          Divider(height: 1, thickness: 2, color: BrutalColors.ink),

                          // Dark mode toggle
                          _buildToggleTile(
                            icon: Icons.dark_mode_outlined,
                            title: 'Chế độ tối (Dark Mode)',
                            value: _isDarkMode,
                            onChanged: (val) {
                              setState(() => _isDarkMode = val);
                              AppSettings().setDarkMode(val);
                            },
                          ),
                          Divider(height: 1, thickness: 2, color: BrutalColors.ink),

                          // Change password
                          _buildTappableTile(
                            icon: Icons.lock_outline,
                            title: 'Đổi mật khẩu',
                            trailing: '→',
                            trailingColor: BrutalColors.ink,
                            onTap: _showChangePasswordDialog,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // ── Logout ─────────────────────────────────
                    BrutalButton(
                      text: 'ĐĂNG XUẤT',
                      color: BrutalColors.destructive,
                      onTap: _showLogoutDialog,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Phiên đăng nhập hết hạn sau 14 ngày không đăng nhập lại.',
                      textAlign: TextAlign.center,
                      style: BrutalStyles.bodyStyle(size: 11, color: BrutalColors.grey, weight: FontWeight.w500),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTappableTile({
    required IconData icon,
    required String title,
    required String trailing,
    Color? trailingColor,
    required VoidCallback onTap,
  }) {
    final effectiveTrailingColor = trailingColor ?? BrutalColors.grey;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, color: BrutalColors.ink, size: 20),
                const SizedBox(width: 12),
                Text(title, style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w800)),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: effectiveTrailingColor.withOpacity(0.15),
                border: Border.all(color: effectiveTrailingColor, width: 1.5),
                borderRadius: BorderRadius.circular(9999),
              ),
              child: Text(
                trailing,
                style: BrutalStyles.bodyStyle(size: 12, weight: FontWeight.w800, color: effectiveTrailingColor),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleTile({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: BrutalColors.ink, size: 20),
              const SizedBox(width: 12),
              Text(title, style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w800)),
            ],
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: BrutalColors.ink,
            activeTrackColor: BrutalColors.green,
          ),
        ],
      ),
    );
  }
}
