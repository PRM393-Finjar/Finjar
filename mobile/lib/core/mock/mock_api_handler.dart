import 'package:dio/dio.dart';

class MockApiHandler {
  int _nextId = 100;
  final List<Map<String, dynamic>> _transactions = [
    {
      'id': 1,
      'type': 'Expense',
      'amount': 45000,
      'description': 'Cà phê sáng',
      'transactionDate': DateTime.now().toIso8601String(),
      'categoryName': 'Ăn uống',
    },
    {
      'id': 2,
      'type': 'Income',
      'amount': 15000000,
      'description': 'Lương tháng',
      'transactionDate': DateTime.now().toIso8601String(),
      'categoryName': 'Thu nhập',
    },
  ];
  final List<Map<String, dynamic>> _accounts = [
    {'id': 1, 'name': 'Tiền mặt', 'balance': 2500000, 'accountType': 'Manual'},
  ];
  final List<Map<String, dynamic>> _jars = [
    {
      'id': 1,
      'name': 'Sinh hoạt',
      'balance': 1200000,
      'icon': '🏠',
      'color': '#FF6B6B'
    },
    {
      'id': 2,
      'name': 'Ăn uống',
      'balance': 800000,
      'icon': '🍜',
      'color': '#4ECDC4'
    },
  ];
  final List<Map<String, dynamic>> _categories = [
    {
      'id': 1,
      'name': 'Ăn uống',
      'icon': '🍜',
      'color': '#4ECDC4',
      'isActive': true
    },
    {
      'id': 2,
      'name': 'Di chuyển',
      'icon': '🚌',
      'color': '#45B7D1',
      'isActive': true
    },
  ];
  final List<Map<String, dynamic>> _goals = [
    {
      'id': 1,
      'name': 'Tiết kiệm mua laptop',
      'targetAmount': 20000000,
      'currentAmount': 5000000
    },
  ];
  final List<Map<String, dynamic>> _limits = [
    {
      'id': 1,
      'name': 'Ăn uống',
      'limitAmount': 2000000,
      'currentSpent': 450000
    },
  ];
  final List<Map<String, dynamic>> _reminders = [
    {
      'id': 1,
      'title': 'Thanh toán điện',
      'amount': 350000,
      'reminderDate':
          DateTime.now().add(const Duration(days: 3)).toIso8601String(),
      'isCompleted': false,
    },
  ];
  final List<Map<String, dynamic>> _notifications = [
    {
      'id': 1,
      'title': 'Chào mừng Finjar',
      'message': 'Bạn đang dùng chế độ demo.',
      'isRead': false
    },
  ];

  Future<Response> handle({
    required String method,
    required String path,
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    final normalized = path.replaceAll(RegExp(r'^/+|/+$'), '');

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
      final totalIncome = _transactions
          .where((tx) => _transactionType(tx) == 'income')
          .fold<num>(0, (sum, tx) => sum + _transactionAmount(tx));
      final totalExpense = _transactions
          .where((tx) => _transactionType(tx) == 'expense')
          .fold<num>(0, (sum, tx) => sum + _transactionAmount(tx));
      final totalBalance = _accounts.fold<num>(
        0,
        (sum, account) =>
            sum +
            ((account['currentBalance'] ?? account['balance'] ?? 0) as num),
      );

      return _ok({
        'balanceSummary': {
          'totalBalance': totalBalance,
          'allocatedBalance': _jars.fold<num>(
              0, (sum, jar) => sum + ((jar['balance'] ?? 0) as num)),
          'unallocatedBalance': totalBalance,
          'totalIncome': totalIncome,
          'totalExpense': totalExpense,
          'netChange': totalIncome - totalExpense,
        },
        'financialAccounts': _accounts,
        'jarSummary': _jars.map((jar) {
          final spent = _transactions
              .where((tx) =>
                  _transactionType(tx) == 'expense' &&
                  tx['fromJarId']?.toString() == jar['id'].toString())
              .fold<num>(0, (sum, tx) => sum + _transactionAmount(tx));
          final balance = (jar['balance'] ?? 0) as num;
          return {
            'jarId': jar['id'],
            'jarName': jar['name'],
            'balance': balance,
            'spent': spent,
            'spentPercentage':
                balance + spent == 0 ? 0 : (spent / (balance + spent) * 100),
          };
        }).toList(),
        'categoryBreakdown': _categories.map((category) {
          final total = _transactions
              .where((tx) =>
                  _transactionType(tx) == 'expense' &&
                  tx['categoryId']?.toString() == category['id'].toString())
              .fold<num>(0, (sum, tx) => sum + _transactionAmount(tx));
          return {
            'categoryId': category['id'],
            'categoryName': category['name'],
            'totalAmount': total,
            'percentage': totalExpense == 0 ? 0 : (total / totalExpense * 100),
          };
        }).toList(),
        'recentTransactions': _transactions.take(5).toList(),
        'goalProgress': _goals.map((goal) {
          final target = (goal['targetAmount'] ?? 0) as num;
          final current = (goal['currentAmount'] ?? 0) as num;
          return {
            'goalId': goal['id'],
            'title': goal['title'] ?? goal['name'],
            'progressPercentage': target == 0 ? 0 : (current / target * 100),
            'daysRemaining': 30,
          };
        }).toList(),
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
      final query = queryParameters ?? {};
      var rows = _transactions.where((tx) {
        final type = query['type']?.toString().toLowerCase();
        if (type != null && type.isNotEmpty && _transactionType(tx) != type) {
          return false;
        }
        final categoryId = query['categoryId']?.toString();
        if (categoryId != null &&
            categoryId.isNotEmpty &&
            tx['categoryId']?.toString() != categoryId) {
          return false;
        }
        final accountId = query['financialAccountId']?.toString();
        if (accountId != null &&
            accountId.isNotEmpty &&
            tx['financialAccountId']?.toString() != accountId) {
          return false;
        }
        final jarId = query['jarId']?.toString();
        if (jarId != null && jarId.isNotEmpty) {
          final fromJar = tx['fromJarId']?.toString();
          final toJar = tx['toJarId']?.toString();
          if (fromJar != jarId && toJar != jarId) return false;
        }
        final keyword = query['keyword']?.toString().toLowerCase();
        if (keyword != null && keyword.isNotEmpty) {
          final note =
              (tx['note'] ?? tx['description'] ?? '').toString().toLowerCase();
          if (!note.contains(keyword)) return false;
        }
        return true;
      }).toList();

      rows.sort((a, b) {
        final aDate = DateTime.tryParse(
                (a['date'] ?? a['transactionDate'] ?? '').toString()) ??
            DateTime.fromMillisecondsSinceEpoch(0);
        final bDate = DateTime.tryParse(
                (b['date'] ?? b['transactionDate'] ?? '').toString()) ??
            DateTime.fromMillisecondsSinceEpoch(0);
        return bDate.compareTo(aDate);
      });

      final pageIndex = int.tryParse(query['pageIndex']?.toString() ?? '') ?? 1;
      final pageSize = int.tryParse(query['pageSize']?.toString() ?? '') ?? 20;
      final totalCount = rows.length;
      final totalPages =
          totalCount == 0 ? 1 : ((totalCount - 1) ~/ pageSize) + 1;
      final start = ((pageIndex < 1 ? 1 : pageIndex) - 1) * pageSize;
      final data = start >= rows.length
          ? <Map<String, dynamic>>[]
          : rows.skip(start).take(pageSize).toList();
      return _ok({
        'data': data,
        'pagination': {
          'page': pageIndex,
          'pageSize': pageSize,
          'totalCount': totalCount,
          'totalPages': totalPages,
        },
      });
    }
    if (method == 'POST' && normalized == 'transactions') {
      final item = Map<String, dynamic>.from(data as Map);
      item['id'] = _nextId++;
      final categoryId = item['categoryId']?.toString();
      final matchedCategory =
          _categories.cast<Map<String, dynamic>?>().firstWhere(
                (category) => category?['id']?.toString() == categoryId,
                orElse: () => null,
              );
      if (matchedCategory != null) {
        item['category'] = {
          'id': matchedCategory['id'],
          'name': matchedCategory['name'],
        };
        item['categoryName'] = matchedCategory['name'];
      }
      _applyTransactionToMockAccount(item, isReversal: false);
      _transactions.insert(0, item);
      return _ok(item, statusCode: 201);
    }
    if (method == 'PATCH' && normalized.startsWith('transactions/')) {
      final id = normalized.split('/').last;
      final index = _transactions.indexWhere((e) => e['id']?.toString() == id);
      if (index >= 0) {
        _applyTransactionToMockAccount(_transactions[index], isReversal: true);
        final patch = Map<String, dynamic>.from(data as Map);
        _transactions[index].addAll({
          if (patch.containsKey('transactionsAmount'))
            'transactionsAmount': patch['transactionsAmount'],
          if (patch.containsKey('categoryId'))
            'categoryId': patch['categoryId'],
          if (patch.containsKey('note')) 'note': patch['note'],
        });
        final categoryId = _transactions[index]['categoryId']?.toString();
        final matchedCategory =
            _categories.cast<Map<String, dynamic>?>().firstWhere(
                  (category) => category?['id']?.toString() == categoryId,
                  orElse: () => null,
                );
        if (matchedCategory != null) {
          _transactions[index]['category'] = {
            'id': matchedCategory['id'],
            'name': matchedCategory['name'],
          };
          _transactions[index]['categoryName'] = matchedCategory['name'];
        }
        _applyTransactionToMockAccount(_transactions[index], isReversal: false);
        return _ok(_transactions[index]);
      }
      return _ok({'message': 'not found'}, statusCode: 404);
    }
    if (method == 'DELETE' && normalized.startsWith('transactions/')) {
      final id = normalized.split('/').last;
      final index = _transactions.indexWhere((e) => e['id']?.toString() == id);
      if (index >= 0) {
        _applyTransactionToMockAccount(_transactions[index], isReversal: true);
        _transactions.removeAt(index);
      }
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
    if (method == 'POST' && normalized == 'financial-accounts/sepay/connect') {
      final payload = Map<String, dynamic>.from(data as Map);
      final accountNumber = payload['accountNumber']?.toString() ?? '';
      final bankCode = payload['bankCode']?.toString() ?? 'VCB';
      final bankName = switch (bankCode) {
        'MB' => 'MB Bank',
        'TCB' => 'Techcombank',
        _ => 'Vietcombank',
      };
      final masked = accountNumber.length > 4
          ? '${'*' * (accountNumber.length - 4)}${accountNumber.substring(accountNumber.length - 4)}'
          : accountNumber;
      final item = {
        'id': _nextId++,
        'name': bankName,
        'accountType': 'Bank',
        'connectionMode': 'LinkedApi',
        'providerCode': 'SEPAY',
        'providerName': 'SePay',
        'externalAccountRef': accountNumber,
        'maskedAccountNumber': masked,
        'accountHolderName': payload['accountName'],
        'currentBalance': 0,
        'balance': 0,
        'currency': 'VND',
        'syncStatus': 'Active',
        'isActive': true,
      };
      _accounts.add(item);
      return _ok(item, statusCode: 201);
    }
    if (method == 'GET' && normalized == 'financial-accounts/sepay/status') {
      final account = _accounts.cast<Map<String, dynamic>?>().firstWhere(
            (item) =>
                item?['connectionMode'] == 'LinkedApi' &&
                item?['providerCode'] == 'SEPAY' &&
                item?['isActive'] != false,
            orElse: () => null,
          );
      return _ok({
        'connected': account != null,
        'bank': account?['name'],
        'lastSync': account?['lastSyncedAt'],
        'syncStatus': account?['syncStatus'] ?? 'Disconnected',
      });
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

  String _transactionType(Map<String, dynamic> transaction) {
    return transaction['type'].toString().toLowerCase();
  }

  num _transactionAmount(Map<String, dynamic> transaction) {
    final rawAmount =
        transaction['transactionsAmount'] ?? transaction['amount'] ?? 0;
    return rawAmount is num
        ? rawAmount
        : num.tryParse(rawAmount.toString()) ?? 0;
  }

  Map<String, dynamic>? _findAccount(dynamic id) {
    final accountId = id?.toString();
    if (accountId == null || accountId.isEmpty) return null;
    return _accounts.cast<Map<String, dynamic>?>().firstWhere(
          (item) => item?['id']?.toString() == accountId,
          orElse: () => null,
        );
  }

  Map<String, dynamic>? _findJar(dynamic id) {
    final jarId = id?.toString();
    if (jarId == null || jarId.isEmpty) return null;
    return _jars.cast<Map<String, dynamic>?>().firstWhere(
          (item) => item?['id']?.toString() == jarId,
          orElse: () => null,
        );
  }

  void _addAccountBalance(Map<String, dynamic> account, num delta) {
    final currentBalance =
        (account['currentBalance'] ?? account['balance'] ?? 0) as num;
    final nextBalance = currentBalance + delta;
    account['balance'] = nextBalance;
    account['currentBalance'] = nextBalance;
  }

  void _addJarBalance(Map<String, dynamic> jar, num delta) {
    final currentBalance = (jar['balance'] ?? 0) as num;
    jar['balance'] = currentBalance + delta;
  }

  void _applyTransactionToMockAccount(Map<String, dynamic> transaction,
      {required bool isReversal}) {
    final amount = _transactionAmount(transaction);
    final direction = isReversal ? -1 : 1;
    final type = _transactionType(transaction);

    if (type == 'expense') {
      final fromJar = _findJar(transaction['fromJarId']);
      final account = _findAccount(transaction['financialAccountId']);
      if (fromJar != null) _addJarBalance(fromJar, -amount * direction);
      if (account != null) _addAccountBalance(account, -amount * direction);
      return;
    }

    if (type == 'income') {
      final account = _findAccount(transaction['financialAccountId']);
      if (account != null) _addAccountBalance(account, amount * direction);
      return;
    }

    if (type == 'transfer') {
      final fromJar = _findJar(transaction['fromJarId']);
      final toJar = _findJar(transaction['toJarId']);
      final account = _findAccount(transaction['financialAccountId']);

      if (fromJar != null && toJar != null) {
        _addJarBalance(fromJar, -amount * direction);
        _addJarBalance(toJar, amount * direction);
      } else if (account != null && toJar != null) {
        _addAccountBalance(account, -amount * direction);
        _addJarBalance(toJar, amount * direction);
      } else if (fromJar != null && account != null) {
        _addJarBalance(fromJar, -amount * direction);
        _addAccountBalance(account, amount * direction);
      }
      return;
    }

    final accountId = transaction['financialAccountId']?.toString();
    if (accountId == null || accountId.isEmpty) return;

    final account = _accounts.cast<Map<String, dynamic>?>().firstWhere(
          (item) => item?['id']?.toString() == accountId,
          orElse: () => null,
        );
    if (account == null) return;

    final currentBalance =
        (account['currentBalance'] ?? account['balance'] ?? 0) as num;
    final isIncome = type == 'income';
    final delta = isIncome ? amount : -amount;
    final nextBalance = currentBalance + (isReversal ? -delta : delta);

    account['balance'] = nextBalance;
    account['currentBalance'] = nextBalance;
  }
}
