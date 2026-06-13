import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class Env {
  /// Bật mock API: flutter run --dart-define=USE_MOCK_DATA=true
  static bool get useMockData {
    const flag = String.fromEnvironment('USE_MOCK_DATA');
    return flag.toLowerCase() == 'true';
  }

  // Can be configured at build time using: flutter run --dart-define=API_BASE_URL=http://localhost:5284/api/v1
  static String get apiBaseUrl {
    const String baseUrl = String.fromEnvironment('API_BASE_URL');
    if (baseUrl.isNotEmpty) {
      return baseUrl;
    }
    if (kIsWeb) {
      return 'http://localhost:5284/api/v1';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:5284/api/v1';
    } else {
      return 'http://localhost:5284/api/v1';
    }
  }
}
