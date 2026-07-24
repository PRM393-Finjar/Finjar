import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:finjar_mobile/core/auth/session_policy.dart';

class SecureStorage {
  // encryptedSharedPreferences tránh treo/blank trên một số máy Android 12+.
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _tokenKey = 'jwt_token';
  static const _onboardingKey = 'is_onboarding_completed';
  static const _lastLoginKey = 'last_login_at_ms';
  static const _userEmailKey = 'user_email';
  static const _userMeKey = 'user_me_data';
  static const _currencyKey = 'preferred_currency';
  static const _darkModeKey = 'dark_mode';

  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  static Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  static Future<void> saveUserData(String userData) async {
    await _storage.write(key: _userMeKey, value: userData);
  }

  static Future<String?> getUserData() async {
    return await _storage.read(key: _userMeKey);
  }

  static Future<void> savePreferredCurrency(String currency) async {
    await _storage.write(key: _currencyKey, value: currency);
  }

  static Future<String?> getPreferredCurrency() async {
    return await _storage.read(key: _currencyKey);
  }

  static Future<void> saveDarkMode(bool isDarkMode) async {
    await _storage.write(key: _darkModeKey, value: isDarkMode.toString());
  }

  static Future<bool> getDarkMode() async {
    final val = await _storage.read(key: _darkModeKey);
    return val == 'true';
  }

  static Future<void> saveOnboardingCompleted(bool completed) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, completed);
  }

  static Future<bool> isOnboardingCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingKey) ?? false;
  }

  static Future<void> saveUserEmail(String email) async {
    await _storage.write(key: _userEmailKey, value: email.trim().toLowerCase());
  }

  static Future<String?> getUserEmail() async {
    return await _storage.read(key: _userEmailKey);
  }

  static Future<void> recordSuccessfulLogin(String email) async {
    await saveUserEmail(email);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_lastLoginKey, DateTime.now().millisecondsSinceEpoch);
  }

  static Future<bool> isSessionExpired() async {
    final prefs = await SharedPreferences.getInstance();
    final lastLoginMs = prefs.getInt(_lastLoginKey);
    if (lastLoginMs == null) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        await prefs.setInt(_lastLoginKey, DateTime.now().millisecondsSinceEpoch);
        return false;
      }
      return true;
    }

    final lastLogin = DateTime.fromMillisecondsSinceEpoch(lastLoginMs);
    final daysSinceLogin = DateTime.now().difference(lastLogin).inDays;
    return daysSinceLogin >= SessionPolicy.maxInactiveDays;
  }

  /// Xóa phiên đăng nhập, giữ cài đặt giao diện (dark mode, currency).
  static Future<void> clearSession() async {
    await deleteToken();
    await _storage.delete(key: _userMeKey);
    await _storage.delete(key: _userEmailKey);

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_onboardingKey);
    await prefs.remove(_lastLoginKey);
  }

  static Future<void> clearAll() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userMeKey);
    await _storage.delete(key: _userEmailKey);
    await _storage.delete(key: _currencyKey);
    await _storage.delete(key: _darkModeKey);

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_onboardingKey);
    await prefs.remove(_lastLoginKey);
  }
}
