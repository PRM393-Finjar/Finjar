import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'jwt_token';
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

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
