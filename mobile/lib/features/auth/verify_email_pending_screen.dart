import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/features/auth/otp_api_error.dart';

class VerifyEmailPendingScreen extends StatefulWidget {
  final String email;

  const VerifyEmailPendingScreen({super.key, required this.email});

  @override
  State<VerifyEmailPendingScreen> createState() => _VerifyEmailPendingScreenState();
}

class _VerifyEmailPendingScreenState extends State<VerifyEmailPendingScreen> {
  final _apiClient = ApiClient();
  final _otpController = TextEditingController();
  bool _isSending = false;
  bool _isVerifying = false;
  String? _infoMessage;
  String? _errorMessage;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final email = widget.email.trim();
    final otp = _otpController.text.trim();
    if (email.isEmpty || otp.length != 6) return;

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
      _infoMessage = null;
    });

    try {
      await _apiClient.post('auth/verify-email', data: {'email': email, 'otp': otp});
      if (!mounted) return;
      setState(() {
        _infoMessage = 'Đăng ký thành công! Bạn có thể đăng nhập.';
      });
      await Future<void>.delayed(const Duration(milliseconds: 800));
      if (mounted) context.go('/auth');
    } on DioException catch (e) {
      setState(() {
        _errorMessage = e.response?.data?['message']?.toString() ?? 'Mã OTP không đúng hoặc đã hết hạn.';
      });
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resend() async {
    if (widget.email.trim().isEmpty) return;
    setState(() {
      _isSending = true;
      _infoMessage = null;
      _errorMessage = null;
    });
    try {
      await _apiClient.post('auth/resend-verification', data: {'email': widget.email.trim()});
      setState(() {
        _infoMessage = 'Đã gửi lại mã OTP tới ${widget.email.trim()}.';
      });
    } on DioException catch (e) {
      final otpError = OtpApiError.fromDio(e);
      setState(() {
        _errorMessage = otpError.message;
      });
      if (!mounted) return;
      otpError.applyNavigation(context);
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = widget.email.trim();

    return Scaffold(
      backgroundColor: BrutalColors.bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: BrutalCard(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Xác thực email', style: BrutalStyles.titleStyle(size: 24)),
                  const SizedBox(height: 12),
                  Text(
                    email.isNotEmpty
                        ? 'Nhập mã OTP 6 số gửi tới $email. Kiểm tra hộp thư (cả thư rác).'
                        : 'Nhập mã OTP từ email để hoàn tất đăng ký.',
                    style: BrutalStyles.bodyStyle(size: 14),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Dev: xem mã OTP trong log backend khi chưa bật SMTP.',
                    style: BrutalStyles.bodyStyle(size: 12, color: BrutalColors.grey),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Mã OTP',
                    style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    maxLength: 6,
                    autofocus: true,
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
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: BrutalColors.ink, width: 2),
                        borderRadius: BorderRadius.circular(BrutalStyles.borderRadiusValue),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: BrutalColors.green, width: 2),
                        borderRadius: BorderRadius.circular(BrutalStyles.borderRadiusValue),
                      ),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 16),
                  if (_infoMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        _infoMessage!,
                        style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.green),
                      ),
                    ),
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        _errorMessage!,
                        style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.destructive),
                      ),
                    ),
                  BrutalButton(
                    text: _isVerifying ? 'ĐANG XÁC THỰC…' : 'XÁC THỰC',
                    onTap: (_isVerifying || _otpController.text.length != 6) ? null : _verify,
                    color: BrutalColors.green,
                  ),
                  const SizedBox(height: 12),
                  BrutalButton(
                    text: _isSending ? 'ĐANG GỬI…' : 'GỬI LẠI MÃ OTP',
                    onTap: _isSending ? null : _resend,
                    color: BrutalColors.purple,
                  ),
                  const SizedBox(height: 12),
                  BrutalButton(
                    text: 'VỀ ĐĂNG NHẬP',
                    onTap: () => context.go('/auth'),
                    color: BrutalColors.lightGrey,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
