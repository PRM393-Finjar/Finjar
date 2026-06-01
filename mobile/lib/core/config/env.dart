class Env {
  // Can be configured at build time using: flutter run --dart-define=API_BASE_URL=http://localhost:5284/api/v1
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5284/api/v1', // Standard default for Android emulators connecting to host localhost
  );
}
