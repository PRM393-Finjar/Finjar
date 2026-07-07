import 'package:dio/dio.dart';

class MockApiHandler {
  Response? Function(String method, String path, dynamic data)? interceptor;
  
  int _nextId = 100;
  final List<Map<String, dynamic>> _transactions = [
    {
      'id': 1,
      'type': 'Expense',
      'amount': 45000,
      'note': 'Cà phê sáng',
      'transactionDate': DateTime.now().toIso8601String(),
      'categoryName': 'Ăn uống',
    },
    {
      'id': 2,
      'type': 'Income',
      'amount': 15000000,
      'note': 'Lương tháng',
      'transactionDate': DateTime.now().toIso8601String(),
      'categoryName': 'Thu nhập',
    },
  ];
  final List<Map<String, dynamic>> _accounts = [
    {'id': 1, 'name': 'Tiền mặt', 'balance': 2500000, 'accountType': 'Manual'},
  ];
  final List<Map<String, dynamic>> _jars = [
    {'id': 1, 'name': 'Sinh hoạt', 'balance': 1200000, 'icon': '🏠', 'color': '#FF6B6B'},
    {'id': 2, 'name': 'Ăn uống', 'balance': 800000, 'icon': '🍜', 'color': '#4ECDC4'},
  ];
  final List<Map<String, dynamic>> _categories = [
    {'id': 1, 'name': 'Ăn uống', 'icon': '🍜', 'color': '#4ECDC4', 'isActive': true},
    {'id': 2, 'name': 'Di chuyển', 'icon': '🚌', 'color': '#45B7D1', 'isActive': true},
  ];
  final List<Map<String, dynamic>> _goals = [
    {'id': 1, 'name': 'Tiết kiệm mua laptop', 'targetAmount': 20000000, 'currentAmount': 5000000},
  ];
  final List<Map<String, dynamic>> _limits = [
    {'id': 1, 'name': 'Ăn uống', 'limitAmount': 2000000, 'currentSpent': 450000},
  ];
  final List<Map<String, dynamic>> _reminders = [
    {
      'id': 1,
      'title': 'Thanh toán điện',
      'amount': 350000,
      'reminderDate': DateTime.now().add(const Duration(days: 3)).toIso8601String(),
      'isCompleted': false,
    },
  ];
  final List<Map<String, dynamic>> _notifications = [
    {'id': 1, 'title': 'Chào mừng Finjar', 'message': 'Bạn đang dùng chế độ demo.', 'isRead': false},
  ];

  Future<Response> handle({
    required String method,
    required String path,
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 20));
    final normalized = path.replaceAll(RegExp(r'^/+|/+$'), '');

    if (interceptor != null) {
      final interceptedResponse = interceptor!(method, normalized, data);
      if (interceptedResponse != null) {
        return interceptedResponse;
      }
    }

    if (method == 'POST' && normalized == 'auth/login') {
      return _ok({'token': 'mock-jwt-token', 'accessToken': 'mock-jwt-token'});
    }
    if (method == 'POST' && normalized == 'auth/register') {
      return _ok({'message': 'registered'}, statusCode: 201);
    }
    if (method == 'POST' && normalized == 'auth/logout') {
      return _ok({'message': 'logged out'});
    }
    if (method == 'POST' && normalized == 'onboarding') {
      return _ok({'message': 'onboarding complete'});
    }
    if (method == 'GET' && normalized == 'dashboard') {
      return _ok({
        'balanceSummary': {
          'totalBalance': 2500000,
          'totalIncome': 15000000,
          'totalExpense': 45000,
        },
        'recentTransactions': _transactions.take(5).toList(),
      });
    }
    if (method == 'GET' && normalized == 'user/me') {
      return _ok({
        'id': 1,
        'email': 'demo@finjar.local',
        'username': 'demo',
        'firstName': 'Demo',
        'lastName': 'User',
        'fullName': 'Demo User',
        'phone': '',
        'avatarUrl': '😊',
        'preferredCurrency': 'VND',
      });
    }
    if (method == 'PATCH' && normalized.startsWith('user/me')) {
      return _ok({'message': 'updated'});
    }
    if (method == 'GET' && normalized == 'transactions') {
      return _ok({'data': _transactions});
    }
    if (method == 'POST' && normalized == 'transactions') {
      final item = Map<String, dynamic>.from(data as Map);
      item['id'] = _nextId++;
      _transactions.insert(0, item);
      return _ok(item, statusCode: 201);
    }
    if (method == 'DELETE' && normalized.startsWith('transactions/')) {
      final id = int.parse(normalized.split('/').last);
      _transactions.removeWhere((e) => e['id'] == id);
      return _ok({'message': 'deleted'});
    }
    if (method == 'GET' && normalized == 'financial-accounts') {
      return _ok(_accounts);
    }
    if (method == 'POST' && normalized == 'financial-accounts/Manual') {
      final item = Map<String, dynamic>.from(data as Map);
      item['id'] = _nextId++;
      item['accountType'] = 'Manual';
      item['balance'] = item['balance'] ?? 0;
      _accounts.add(item);
      return _ok(item, statusCode: 201);
    }
    if (method == 'PATCH' && normalized.startsWith('financial-accounts/')) {
      return _ok({'message': 'updated'});
    }
    if (method == 'DELETE' && normalized.startsWith('financial-accounts/')) {
      final id = int.parse(normalized.split('/').last);
      _accounts.removeWhere((e) => e['id'] == id);
      return _ok({'message': 'deleted'});
    }
    if (method == 'GET' && normalized == 'jars') {
      return _ok(_jars);
    }
    if (method == 'PATCH' && normalized.startsWith('jars/')) {
      return _ok({'message': 'updated'});
    }
    if (method == 'GET' && normalized == 'limits') {
      return _ok(_limits);
    }
    if (method == 'POST' && normalized == 'limits') {
      final item = Map<String, dynamic>.from(data as Map);
      item['id'] = _nextId++;
      _limits.add(item);
      return _ok(item, statusCode: 201);
    }
    if (method == 'PATCH' && normalized.startsWith('limits/')) {
      return _ok({'message': 'updated'});
    }
    if (method == 'DELETE' && normalized.startsWith('limits/')) {
      final id = int.parse(normalized.split('/').last);
      _limits.removeWhere((e) => e['id'] == id);
      return _ok({'message': 'deleted'});
    }
    if (method == 'GET' && normalized == 'categories') {
      return _ok(_categories);
    }
    if (method == 'POST' && normalized == 'categories') {
      final item = Map<String, dynamic>.from(data as Map);
      item['id'] = _nextId++;
      item['isActive'] = true;
      _categories.add(item);
      return _ok(item, statusCode: 201);
    }
    if (method == 'PATCH' && normalized.startsWith('categories/')) {
      return _ok({'message': 'updated'});
    }
    if (method == 'DELETE' && normalized.startsWith('categories/')) {
      final id = int.parse(normalized.split('/').last);
      _categories.removeWhere((e) => e['id'] == id);
      return _ok({'message': 'deleted'});
    }
    if (method == 'GET' && normalized == 'goals') {
      return _ok(_goals);
    }
    if (method == 'POST' && normalized == 'goals') {
      final item = Map<String, dynamic>.from(data as Map);
      item['id'] = _nextId++;
      item['currentAmount'] = item['currentAmount'] ?? 0;
      _goals.add(item);
      return _ok(item, statusCode: 201);
    }
    if (method == 'PATCH' && normalized.startsWith('goals/')) {
      return _ok({'message': 'updated'});
    }
    if (method == 'DELETE' && normalized.startsWith('goals/')) {
      final id = int.parse(normalized.split('/').last);
      _goals.removeWhere((e) => e['id'] == id);
      return _ok({'message': 'deleted'});
    }
    if (method == 'GET' && normalized == 'reminders') {
      return _ok(_reminders);
    }
    if (method == 'POST' && normalized == 'reminders') {
      final item = Map<String, dynamic>.from(data as Map);
      item['id'] = _nextId++;
      item['isCompleted'] = false;
      _reminders.add(item);
      return _ok(item, statusCode: 201);
    }
    if (method == 'PATCH' && normalized.startsWith('reminders/')) {
      return _ok({'message': 'updated'});
    }
    if (method == 'DELETE' && normalized.startsWith('reminders/')) {
      final id = int.parse(normalized.split('/').last);
      _reminders.removeWhere((e) => e['id'] == id);
      return _ok({'message': 'deleted'});
    }
    if (method == 'GET' && normalized == 'notifications') {
      return _ok(_notifications);
    }
    if (method == 'PATCH' && normalized.startsWith('notifications/')) {
      return _ok({'message': 'updated'});
    }

    return _ok({'message': 'mock: $method $normalized'});
  }

  Response _ok(dynamic data, {int statusCode = 200}) {
    return Response(
      requestOptions: RequestOptions(path: ''),
      statusCode: statusCode,
      data: data,
    );
  }
}
