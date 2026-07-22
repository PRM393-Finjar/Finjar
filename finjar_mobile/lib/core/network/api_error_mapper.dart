import 'package:dio/dio.dart';

class ApiErrorMapper {
  static const dailyTransactionQuotaExceeded =
      'DAILY_TRANSACTION_QUOTA_EXCEEDED';

  static const Map<String, String> _messages = {
    dailyTransactionQuotaExceeded:
        'Bạn đã sử dụng hết 10 lượt tạo giao dịch hôm nay.\nVui lòng quay lại vào ngày mai hoặc nâng cấp Premium.',
  };

  static String messageFromDioException(
    DioException error, {
    required String fallback,
  }) {
    final data = error.response?.data;
    final message = _readString(data, 'message') ?? _readString(data, 'error');
    final code = _readCode(data);

    if (code == dailyTransactionQuotaExceeded &&
        message != null &&
        _isBackendUserFacingMessage(message)) {
      return message;
    }

    if (code != null && _messages.containsKey(code)) {
      return _messages[code]!;
    }

    return message ?? fallback;
  }

  static String? _readCode(dynamic data) {
    if (data is! Map) {
      return null;
    }

    final details = data['details'];
    if (details is Map) {
      final code = details['code'];
      if (code is String && code.isNotEmpty) {
        return code;
      }
    }

    final code = data['code'];
    if (code is String && code.isNotEmpty) {
      return code;
    }

    return null;
  }

  static String? _readString(dynamic data, String key) {
    if (data is! Map) {
      return null;
    }

    final value = data[key];
    if (value is String && value.isNotEmpty) {
      return value;
    }

    return null;
  }

  static bool _isBackendUserFacingMessage(String message) {
    return RegExp(
      r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]',
      caseSensitive: false,
    ).hasMatch(message);
  }
}
