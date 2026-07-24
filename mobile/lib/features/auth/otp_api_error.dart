import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Maps auth/OTP API error payloads to UX messages and optional navigation.
class OtpApiError {
  const OtpApiError({
    required this.code,
    required this.message,
    this.goLogin = false,
    this.goRegister = false,
  });

  final String code;
  final String message;
  final bool goLogin;
  final bool goRegister;

  static OtpApiError fromDio(DioException e) {
    final data = e.response?.data;
    final code = _extractCode(data);
    final serverMsg = data is Map
        ? (data['message'] ?? data['error'])?.toString()
        : null;

    switch (code) {
      case 'OTP_RESEND_TOO_SOON':
        return OtpApiError(
          code: 'OTP_RESEND_TOO_SOON',
          message: serverMsg ?? 'Vui lòng đợi thêm vài giây trước khi gửi lại mã OTP.',
        );
      case 'OTP_RATE_LIMITED':
        return OtpApiError(
          code: 'OTP_RATE_LIMITED',
          message: serverMsg ?? 'Bạn đã gửi quá nhiều mã OTP. Thử lại sau.',
        );
      case 'EMAIL_SEND_FAILED':
      case 'OTP_PERSIST_FAILED':
        return OtpApiError(
          code: code!,
          message: serverMsg ?? 'Gửi email OTP thất bại. Kiểm tra kết nối và thử lại.',
        );
      case 'EMAIL_NOT_PENDING':
        return OtpApiError(
          code: 'EMAIL_NOT_PENDING',
          message: serverMsg ?? 'Không có đăng ký chờ xác thực. Vui lòng đăng ký lại.',
          goRegister: true,
        );
      case 'EMAIL_ALREADY_VERIFIED':
      case 'EMAIL_ALREADY_REGISTERED':
        return OtpApiError(
          code: code!,
          message: serverMsg ?? 'Email đã được xác thực. Vui lòng đăng nhập.',
          goLogin: true,
        );
      default:
        return OtpApiError(
          code: code ?? 'UNKNOWN',
          message: serverMsg ?? 'Không gửi được mã OTP.',
        );
    }
  }

  static String? _extractCode(dynamic data) {
    if (data is! Map) return null;
    final details = data['details'];
    if (details is Map) {
      final nested = details['details'];
      if (nested is Map && nested['code'] != null) {
        return nested['code'].toString();
      }
      if (details['code'] != null) {
        return details['code'].toString();
      }
    }
    if (data['code'] != null) return data['code'].toString();
    return null;
  }

  void applyNavigation(BuildContext context) {
    if (!context.mounted) return;
    if (goLogin) {
      context.go('/auth');
    } else if (goRegister) {
      context.go('/auth');
    }
  }
}
