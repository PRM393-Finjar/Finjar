import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:finjar_mobile/core/storage/secure_storage.dart';

class AppSettings extends ChangeNotifier {
  static final AppSettings _instance = AppSettings._internal();
  factory AppSettings() => _instance;

  AppSettings._internal() {
    _loadSettings();
  }

  String _currency = 'VND';
  bool _isDarkMode = false;
  bool _isInitialized = false;

  final ChangeNotifier dashboardRefreshNotifier = ChangeNotifier();
  final ChangeNotifier categoriesRefreshNotifier = ChangeNotifier();

  void triggerDashboardRefresh() {
    dashboardRefreshNotifier.notifyListeners();
  }

  void triggerCategoriesRefresh() {
    categoriesRefreshNotifier.notifyListeners();
  }

  String get currency => _currency;
  bool get isDarkMode => _isDarkMode;
  bool get isInitialized => _isInitialized;

  Future<void> _loadSettings() async {
    try {
      final savedCurrency = await SecureStorage.getPreferredCurrency();
      final savedDarkMode = await SecureStorage.getDarkMode();
      
      if (savedCurrency != null) {
        _currency = savedCurrency;
      }
      _isDarkMode = savedDarkMode;
      _isInitialized = true;
      notifyListeners();
    } catch (_) {
      _isInitialized = true;
    }
  }

  Future<void> setCurrency(String newCurrency) async {
    if (_currency == newCurrency) return;
    _currency = newCurrency;
    notifyListeners();
    try {
      await SecureStorage.savePreferredCurrency(newCurrency);
    } catch (_) {}
  }

  Future<void> setDarkMode(bool val) async {
    if (_isDarkMode == val) return;
    _isDarkMode = val;
    notifyListeners();
    try {
      await SecureStorage.saveDarkMode(val);
    } catch (_) {}
  }

  String formatCurrency(double amount) {
    switch (_currency) {
      case 'USD':
        return NumberFormat.currency(locale: 'en_US', symbol: '\$').format(amount);
      case 'EUR':
        return NumberFormat.currency(locale: 'de_DE', symbol: '€').format(amount);
      case 'GBP':
        return NumberFormat.currency(locale: 'en_GB', symbol: '£').format(amount);
      case 'JPY':
        return NumberFormat.currency(locale: 'ja_JP', symbol: '¥', decimalDigits: 0).format(amount);
      case 'KRW':
        return NumberFormat.currency(locale: 'ko_KR', symbol: '₩', decimalDigits: 0).format(amount);
      case 'SGD':
        return NumberFormat.currency(locale: 'en_SG', symbol: 'S\$').format(amount);
      case 'THB':
        return NumberFormat.currency(locale: 'th_TH', symbol: '฿').format(amount);
      case 'CNY':
        return NumberFormat.currency(locale: 'zh_CN', symbol: '¥').format(amount);
      case 'VND':
      default:
        return NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0).format(amount);
    }
  }
}
