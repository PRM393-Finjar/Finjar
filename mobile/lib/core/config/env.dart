class Env {
  /// Backend công khai (Render). Nhờ vậy ai clone repo/cài APK cũng chạy được
  /// mà KHÔNG cần tự bật backend + PostgreSQL trên máy họ.
  ///
  /// Backend Render công khai (Finjar).
  static const String _productionApiBaseUrl =
      'https://finjar-gnlc.onrender.com/api/v1';

  /// Bật mock API: flutter run --dart-define=USE_MOCK_DATA=true
  static bool get useMockData {
    const flag = String.fromEnvironment('USE_MOCK_DATA');
    return flag.toLowerCase() == 'true';
  }

  /// Mặc định trỏ về backend công khai. Khi dev muốn chạy backend local:
  ///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5284/api/v1  (Android emulator)
  ///   flutter run --dart-define=API_BASE_URL=http://localhost:5284/api/v1 (web/desktop)
  static String get apiBaseUrl {
    const String baseUrl = String.fromEnvironment('API_BASE_URL');
    if (baseUrl.isNotEmpty) {
      return baseUrl;
    }
    return _productionApiBaseUrl;
  }
}
