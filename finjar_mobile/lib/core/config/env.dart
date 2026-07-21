class Env {
  /// Mặc định trỏ Render. Dev local:
  ///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5284/api/v1
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://finjar-i2il.onrender.com/api/v1',
  );
}
