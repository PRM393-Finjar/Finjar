import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/network/api_endpoints.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/core/theme/currency_input.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final _apiClient = ApiClient();
  final _searchController = TextEditingController();

  bool _isLoading = false;
  List<dynamic> _transactions = [];
  List<dynamic> _categories = [];
  List<dynamic> _accounts = [];
  List<dynamic> _jars = [];

  String _selectedType = 'all';
  String? _selectedCategory;
  String? _selectedAccount;
  String? _selectedJar;
  DateTime? _fromDate;
  DateTime? _toDate;

  int _pageIndex = 1;
  final int _pageSize = 20;
  int _totalCount = 0;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    AppSettings().categoriesRefreshNotifier.addListener(_fetchCategories);
    AppSettings().transactionsRefreshNotifier.addListener(_refreshTransactions);
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    AppSettings().categoriesRefreshNotifier.removeListener(_fetchCategories);
    AppSettings()
        .transactionsRefreshNotifier
        .removeListener(_refreshTransactions);
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      await Future.wait([
        _fetchCategories(),
        _fetchAccounts(),
        _fetchJars(),
        _fetchTransactions(),
      ]);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _transactions = [];
        _categories = [];
        _accounts = [];
        _jars = [];
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _refreshTransactions() async {
    _pageIndex = 1;
    await _fetchTransactions();
  }

  Future<void> _fetchTransactions() async {
    final response = await _apiClient.get(
      ApiEndpoints.transactions,
      queryParameters: _buildTransactionQuery(),
    );
    if (!mounted) return;
    if (response.statusCode == 200) {
      final data = response.data;
      List<dynamic> parsed = [];
      int totalCount = 0;
      int totalPages = 1;
      int page = _pageIndex;

      if (data is Map) {
        parsed = _asList(data['data'] ?? data['Data']);
        final pagination = _asMap(data['pagination'] ?? data['Pagination']);
        totalCount = _asInt(pagination['totalCount'] ??
            pagination['TotalCount'] ??
            parsed.length);
        totalPages =
            _asInt(pagination['totalPages'] ?? pagination['TotalPages'] ?? 1);
        page = _asInt(pagination['page'] ?? pagination['Page'] ?? _pageIndex);
      } else if (data is List) {
        parsed = data;
        totalCount = parsed.length;
      }

      setState(() {
        _transactions = parsed;
        _totalCount = totalCount;
        _totalPages = totalPages < 1 ? 1 : totalPages;
        _pageIndex = page < 1 ? 1 : page;
      });
    }
  }

  Map<String, dynamic> _buildTransactionQuery() {
    final query = <String, dynamic>{
      'pageIndex': _pageIndex,
      'pageSize': _pageSize,
      'sortBy': 'date',
      'sortDir': 'desc',
    };

    if (_selectedType != 'all') query['type'] = _selectedType;
    if (_selectedCategory != null) query['categoryId'] = _selectedCategory;
    if (_selectedAccount != null) {
      query['financialAccountId'] = _selectedAccount;
    }
    if (_selectedJar != null) query['jarId'] = _selectedJar;
    final keyword = _searchController.text.trim();
    if (keyword.isNotEmpty) query['keyword'] = keyword;
    if (_fromDate != null) query['fromDate'] = _dateOnly(_fromDate!);
    if (_toDate != null) query['toDate'] = _dateOnly(_toDate!);

    return query;
  }

  Future<void> _fetchCategories() async {
    final response = await _apiClient.get(ApiEndpoints.categories);
    if (!mounted) return;
    if (response.statusCode == 200) {
      final data = response.data;
      final combined = <dynamic>[];
      if (data is Map) {
        combined.addAll(
            _asList(data['defaultCategories'] ?? data['DefaultCategories']));
        combined.addAll(
            _asList(data['customCategories'] ?? data['CustomCategories']));
      } else if (data is List) {
        combined.addAll(data);
      }
      setState(() => _categories = combined);
    }
  }

  Future<void> _fetchAccounts() async {
    final response = await _apiClient.get(ApiEndpoints.financialAccounts);
    if (!mounted) return;
    if (response.statusCode == 200) {
      final data = response.data;
      setState(() =>
          _accounts = data is Map ? _asList(data['data']) : _asList(data));
    }
  }

  Future<void> _fetchJars() async {
    final response = await _apiClient.get(ApiEndpoints.jars);
    if (!mounted) return;
    if (response.statusCode == 200) {
      final data = response.data;
      setState(
          () => _jars = data is Map ? _asList(data['data']) : _asList(data));
    }
  }

  Future<void> _createTransaction(Map<String, dynamic> payload) async {
    await _apiClient.post(ApiEndpoints.transactions, data: payload);
    await _fetchTransactions();
    await Future.wait([_fetchAccounts(), _fetchJars()]);
    AppSettings().triggerDashboardRefresh();
    AppSettings().triggerWalletRefresh();
  }

  Future<void> _updateTransaction(
    String id,
    Map<String, dynamic> payload,
  ) async {
    await _apiClient.patch('${ApiEndpoints.transactions}/$id', data: payload);
    await _fetchTransactions();
    await Future.wait([_fetchAccounts(), _fetchJars()]);
    AppSettings().triggerDashboardRefresh();
    AppSettings().triggerWalletRefresh();
  }

  Future<void> _deleteTransaction(String id) async {
    if (id.isEmpty) return;
    try {
      await _apiClient.delete('${ApiEndpoints.transactions}/$id');
      await _fetchTransactions();
      await Future.wait([_fetchAccounts(), _fetchJars()]);
      AppSettings().triggerDashboardRefresh();
      AppSettings().triggerWalletRefresh();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Xóa giao dịch thành công!')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_extractErrorMessage(e))),
      );
    }
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 5),
      lastDate: now,
      initialDateRange: _fromDate != null && _toDate != null
          ? DateTimeRange(start: _fromDate!, end: _toDate!)
          : null,
    );
    if (range == null || !mounted) return;
    setState(() {
      _fromDate = range.start;
      _toDate = range.end;
      _pageIndex = 1;
    });
    await _fetchTransactions();
  }

  Future<DateTime?> _pickDateTime(DateTime initial) async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: initial.isAfter(now) ? now : initial,
      firstDate: DateTime(now.year - 5),
      lastDate: now,
    );
    if (date == null || !mounted) return null;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return null;
    final picked = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    return picked.isAfter(now) ? now : picked;
  }

  void _clearFilters() {
    setState(() {
      _selectedType = 'all';
      _selectedCategory = null;
      _selectedAccount = null;
      _selectedJar = null;
      _fromDate = null;
      _toDate = null;
      _searchController.clear();
      _pageIndex = 1;
    });
    _fetchTransactions();
  }

  String _extractErrorMessage(dynamic error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map) {
        final details = data['details'];
        if (details is String && details.isNotEmpty) return details;
        if (details is Map) {
          final firstError = details.values.first;
          if (firstError is List && firstError.isNotEmpty) {
            return firstError.first.toString();
          }
          if (firstError is String) return firstError;
        }
        final message = data['message'] ?? data['Message'];
        if (message != null && message.toString().isNotEmpty) {
          return message.toString();
        }
      }
    }
    return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }

  void _showAddTransactionDialog() {
    final amountController = TextEditingController();
    final noteController = TextEditingController();
    String type = 'Expense';
    String transferMode = 'jarToJar';
    String? selectedCategoryId;
    String? selectedAccountId =
        _manualAccounts.isNotEmpty ? _idOf(_manualAccounts.first['id']) : null;
    String? fromJarId = _jars.isNotEmpty ? _idOf(_jars.first['id']) : null;
    String? toJarId = _jars.length > 1 ? _idOf(_jars[1]['id']) : null;
    DateTime selectedDate = DateTime.now();
    String? formError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Future<void> submit() async {
              final amount = amountController.rawValue;
              if (amount <= 0) {
                setModalState(() => formError = 'Nhập số tiền lớn hơn 0.');
                return;
              }

              final payload = <String, dynamic>{
                'type': type,
                'transactionsAmount': amount,
                'categoryId': selectedCategoryId,
                'note': noteController.text.trim().isEmpty
                    ? null
                    : noteController.text.trim(),
              };

              payload['date'] = selectedDate.toIso8601String();

              if (type == 'Expense') {
                if (fromJarId == null || fromJarId!.isEmpty) {
                  setModalState(() => formError = 'Chọn hũ nguồn để chi.');
                  return;
                }
                payload['fromJarId'] = fromJarId;
                payload['toJarId'] = null;
                payload['financialAccountId'] = null;
              } else if (type == 'Income') {
                if (selectedAccountId == null || selectedAccountId!.isEmpty) {
                  setModalState(
                      () => formError = 'Chọn tài khoản nhận thu nhập.');
                  return;
                }
                payload['financialAccountId'] = selectedAccountId;
                payload['fromJarId'] = null;
                payload['toJarId'] = null;
              } else if (transferMode == 'jarToJar') {
                if (fromJarId == null ||
                    toJarId == null ||
                    fromJarId == toJarId) {
                  setModalState(() => formError =
                      'Chọn hai hũ khác nhau cho giao dịch chuyển.');
                  return;
                }
                payload['fromJarId'] = fromJarId;
                payload['toJarId'] = toJarId;
                payload['financialAccountId'] = null;
              } else if (transferMode == 'accountToJar') {
                if (selectedAccountId == null || toJarId == null) {
                  setModalState(() => formError = 'Chọn tài khoản và hũ nhận.');
                  return;
                }
                payload['financialAccountId'] = selectedAccountId;
                payload['toJarId'] = toJarId;
                payload['fromJarId'] = null;
              } else {
                if (fromJarId == null || selectedAccountId == null) {
                  setModalState(
                      () => formError = 'Chọn hũ nguồn và tài khoản nhận.');
                  return;
                }
                payload['fromJarId'] = fromJarId;
                payload['financialAccountId'] = selectedAccountId;
                payload['toJarId'] = null;
              }

              try {
                await _createTransaction(payload);
                if (!sheetContext.mounted) return;
                Navigator.pop(sheetContext);
              } catch (e) {
                if (!sheetContext.mounted) return;
                setModalState(
                    () => formError = _extractErrorMessage(e));
              }
            }

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Thêm giao dịch',
                        style: BrutalStyles.titleStyle(size: 20)),
                    const SizedBox(height: 16),
                    _buildSegmented(
                      values: const ['Expense', 'Income', 'Transfer'],
                      labels: const ['Chi', 'Thu', 'Chuyển'],
                      selected: type,
                      onSelected: (value) {
                        setModalState(() {
                          type = value;
                          formError = null;
                        });
                      },
                    ),
                    if (type == 'Transfer') ...[
                      const SizedBox(height: 12),
                      _buildSegmented(
                        values: const [
                          'jarToJar',
                          'accountToJar',
                          'jarToAccount'
                        ],
                        labels: const ['Hũ > Hũ', 'TK > Hũ', 'Hũ > TK'],
                        selected: transferMode,
                        onSelected: (value) {
                          setModalState(() {
                            transferMode = value;
                            formError = null;
                          });
                        },
                      ),
                    ],
                    const SizedBox(height: 16),
                    BrutalCurrencyInput(
                      label: 'Số tiền',
                      hint: '100.000',
                      controller: amountController,
                    ),
                    const SizedBox(height: 12),
                    _buildDateButton(
                      label: 'Thời gian',
                      value: _formatDateTime(selectedDate),
                      onTap: () async {
                        final picked = await _pickDateTime(selectedDate);
                        if (picked != null) {
                          setModalState(() => selectedDate = picked);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    BrutalInput(
                      label: 'Ghi chú',
                      hint: 'Ví dụ: Ăn trưa, lương tháng...',
                      controller: noteController,
                    ),
                    const SizedBox(height: 12),
                    _buildDropdown(
                      label: 'Danh mục',
                      value: selectedCategoryId,
                      items: _categories,
                      emptyLabel: 'Không chọn danh mục',
                      onChanged: (value) {
                        setModalState(() => selectedCategoryId = value);
                      },
                    ),
                    if (type == 'Expense' ||
                        (type == 'Transfer' && transferMode != 'accountToJar'))
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: _buildDropdown(
                          label: 'Hũ nguồn',
                          value: fromJarId,
                          items: _jars,
                          emptyLabel: 'Chọn hũ nguồn',
                          onChanged: (value) {
                            setModalState(() => fromJarId = value);
                          },
                        ),
                      ),
                    if (type == 'Income' ||
                        (type == 'Transfer' && transferMode != 'jarToJar'))
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: _buildDropdown(
                          label:
                              type == 'Income' || transferMode == 'accountToJar'
                                  ? 'Tài khoản'
                                  : 'Tài khoản nhận',
                          value: selectedAccountId,
                          items: _manualAccounts,
                          emptyLabel: 'Chọn tài khoản thủ công',
                          onChanged: (value) {
                            setModalState(() => selectedAccountId = value);
                          },
                        ),
                      ),
                    if (type == 'Transfer' && transferMode != 'jarToAccount')
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: _buildDropdown(
                          label: 'Hũ nhận',
                          value: toJarId,
                          items: _jars,
                          emptyLabel: 'Chọn hũ nhận',
                          onChanged: (value) {
                            setModalState(() => toJarId = value);
                          },
                        ),
                      ),
                    if (formError != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        formError!,
                        style: BrutalStyles.bodyStyle(
                          size: 13,
                          color: BrutalColors.destructive,
                          weight: FontWeight.w800,
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    BrutalButton(
                      text: 'Lưu giao dịch',
                      color: BrutalColors.green,
                      onTap: submit,
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showTransactionDetail(dynamic tx) {
    final transactionId = _idOf(_value(tx, 'id'));
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Chi tiết giao dịch',
                    style: BrutalStyles.titleStyle(size: 20)),
                const SizedBox(height: 16),
                BrutalCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _detailRow('Loại', _transactionTypeLabel(tx)),
                      _detailRow(
                          'Số tiền', _formatCurrency(_transactionAmount(tx))),
                      _detailRow('Ghi chú', _transactionTitle(tx)),
                      _detailRow('Danh mục', _transactionCategoryName(tx)),
                      _detailRow('Tài khoản', _transactionAccountName(tx)),
                      _detailRow('Hũ', _transactionJarName(tx)),
                      _detailRow(
                          'Thời gian', _formatDateTime(_transactionDate(tx))),
                    ],
                  ),
                ),
                if (_transactionTypeKey(tx) != 'transfer') ...[
                  const SizedBox(height: 16),
                  BrutalButton(
                    text: 'Sửa giao dịch',
                    color: BrutalColors.purple,
                    onTap: () {
                      Navigator.pop(sheetContext);
                      _showEditTransactionDialog(tx);
                    },
                  ),
                ],
                const SizedBox(height: 10),
                BrutalButton(
                  text: 'Xóa giao dịch',
                  color: BrutalColors.destructive,
                  onTap: () async {
                    Navigator.pop(sheetContext);
                    await _confirmDelete(transactionId);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showEditTransactionDialog(dynamic tx) {
    final transactionId = _idOf(_value(tx, 'id'));
    final amountController = TextEditingController(
      text: _transactionAmount(tx).round().toString(),
    );
    final noteController = TextEditingController(text: _transactionTitle(tx));
    String? selectedCategoryId = _transactionCategoryId(tx);
    String? formError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Future<void> submit() async {
              final amount = amountController.rawValue;
              if (amount <= 0) {
                setModalState(() => formError = 'Nhập số tiền lớn hơn 0.');
                return;
              }
              try {
                await _updateTransaction(transactionId, {
                  'transactionsAmount': amount,
                  'categoryId': selectedCategoryId,
                  'note': noteController.text.trim(),
                });
                if (!sheetContext.mounted) return;
                Navigator.pop(sheetContext);
              } catch (e) {
                if (!sheetContext.mounted) return;
                setModalState(
                    () => formError = _extractErrorMessage(e));
              }
            }

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Sửa giao dịch',
                        style: BrutalStyles.titleStyle(size: 20)),
                    const SizedBox(height: 16),
                    BrutalCurrencyInput(
                      label: 'Số tiền',
                      hint: '100.000',
                      controller: amountController,
                    ),
                    const SizedBox(height: 12),
                    BrutalInput(
                      label: 'Ghi chú',
                      hint: 'Ghi chú',
                      controller: noteController,
                    ),
                    const SizedBox(height: 12),
                    _buildDropdown(
                      label: 'Danh mục',
                      value: selectedCategoryId,
                      items: _categories,
                      emptyLabel: 'Không chọn danh mục',
                      onChanged: (value) {
                        setModalState(() => selectedCategoryId = value);
                      },
                    ),
                    if (formError != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        formError!,
                        style: BrutalStyles.bodyStyle(
                          size: 13,
                          color: BrutalColors.destructive,
                          weight: FontWeight.w800,
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    BrutalButton(
                      text: 'Cập nhật',
                      color: BrutalColors.green,
                      onTap: submit,
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _confirmDelete(String id) async {
    if (id.isEmpty) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: BrutalColors.bg,
        title: const Text('Xóa giao dịch?'),
        content: const Text('Thao tác này sẽ hoàn tác số dư liên quan.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _deleteTransaction(id);
    }
  }

  List<dynamic> get _manualAccounts {
    return _accounts.where((account) {
      final connectionMode = (_value(account, 'connectionMode') ??
              _value(account, 'ConnectionMode') ??
              '')
          .toString()
          .toLowerCase();
      return connectionMode.isEmpty ||
          connectionMode == 'manual' ||
          connectionMode == 'thủ công';
    }).toList();
  }

  String _formatCurrency(double amount) => AppSettings().formatCurrency(amount);

  String _dateOnly(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }

  String _formatDateTime(DateTime date) {
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '${_formatDate(date)} $hour:$minute';
  }

  String _idOf(dynamic value) => value?.toString() ?? '';

  dynamic _value(dynamic source, String key) {
    if (source is Map) return source[key] ?? source[_pascal(key)];
    return null;
  }

  String _pascal(String key) {
    if (key.isEmpty) return key;
    return key[0].toUpperCase() + key.substring(1);
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return {};
  }

  List<dynamic> _asList(dynamic value) => value is List ? value : [];

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _transactionType(dynamic tx) {
    return (_value(tx, 'type') ?? '').toString();
  }

  String _transactionTypeKey(dynamic tx) => _transactionType(tx).toLowerCase();

  String _transactionTypeLabel(dynamic tx) {
    switch (_transactionTypeKey(tx)) {
      case 'income':
        return 'Thu nhập';
      case 'expense':
        return 'Chi tiêu';
      case 'transfer':
        return 'Chuyển tiền';
      default:
        return _transactionType(tx);
    }
  }

  bool _isIncomeTransaction(dynamic tx) => _transactionTypeKey(tx) == 'income';

  bool _isTransferTransaction(dynamic tx) =>
      _transactionTypeKey(tx) == 'transfer';

  double _transactionAmount(dynamic tx) {
    final value = _value(tx, 'transactionsAmount') ?? _value(tx, 'amount') ?? 0;
    return _asDouble(value).abs();
  }

  DateTime _transactionDate(dynamic tx) {
    final raw = _value(tx, 'date') ??
        _value(tx, 'transactionDate') ??
        DateTime.now().toIso8601String();
    return DateTime.tryParse(raw.toString()) ?? DateTime.now();
  }

  String _transactionTitle(dynamic tx) {
    final note = _value(tx, 'note');
    if (note != null && note.toString().trim().isNotEmpty) {
      return note.toString();
    }
    return _transactionCategoryName(tx) == 'Khác'
        ? _transactionTypeLabel(tx)
        : _transactionCategoryName(tx);
  }

  String _transactionCategoryName(dynamic tx) {
    final category = _value(tx, 'category');
    if (category is Map) {
      return (category['name'] ?? category['Name'] ?? 'Khác').toString();
    }
    return (_value(tx, 'categoryName') ?? category ?? 'Khác').toString();
  }

  String? _transactionCategoryId(dynamic tx) {
    final category = _value(tx, 'category');
    if (category is Map) return _idOf(category['id'] ?? category['Id']);
    final id = _idOf(_value(tx, 'categoryId') ?? category);
    return id.isEmpty ? null : id;
  }

  String _transactionAccountName(dynamic tx) {
    final account = _value(tx, 'financialAccount');
    if (account is Map) {
      return (account['name'] ?? account['Name'] ?? 'Không có').toString();
    }
    return (_value(tx, 'financialAccountName') ?? 'Không có').toString();
  }

  String _transactionJarName(dynamic tx) {
    final jar = _value(tx, 'jar');
    if (jar is Map) {
      return (jar['name'] ?? jar['Name'] ?? 'Không có').toString();
    }
    return (_value(tx, 'jarName') ?? 'Không có').toString();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSettings(),
      builder: (context, _) {
        return Scaffold(
          backgroundColor: BrutalColors.bg,
           appBar: AppBar(
            backgroundColor: BrutalColors.cardBg,
            elevation: 0,
            title:
                Text('Sổ giao dịch', style: BrutalStyles.titleStyle(size: 22)),
            leading: IconButton(
              icon: Icon(Icons.arrow_back, color: BrutalColors.ink),
              onPressed: () => GoRouter.of(context).go('/dashboard'),
            ),
            actions: [
              IconButton(
                onPressed: _clearFilters,
                icon: Icon(Icons.filter_alt_off, color: BrutalColors.ink),
              ),
            ],
            shape:
                Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
          ),
          body: RefreshIndicator(
            onRefresh: _fetchTransactions,
            color: BrutalColors.ink,
            child: Column(
              children: [
                _buildFilters(),
                Divider(height: 1, thickness: 2, color: BrutalColors.ink),
                Expanded(
                  child: _isLoading
                      ? Center(
                          child: CircularProgressIndicator(
                              color: BrutalColors.ink))
                      : _transactions.isEmpty
                          ? _buildEmptyState()
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _transactions.length + 1,
                              itemBuilder: (context, index) {
                                if (index == _transactions.length) {
                                  return _buildPagination();
                                }
                                return _buildTransactionRow(
                                    _transactions[index], index);
                              },
                            ),
                ),
              ],
            ),
          ),
          floatingActionButton: FloatingActionButton(
            heroTag: 'fab-transactions',
            onPressed: _showAddTransactionDialog,
            backgroundColor: BrutalColors.green,
            shape: RoundedRectangleBorder(
              side: BorderSide(color: BrutalColors.ink, width: 2.5),
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 0,
            child: Icon(Icons.add, color: BrutalColors.ink, size: 28),
          ),
        );
      },
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) {
              _pageIndex = 1;
              _fetchTransactions();
            },
            decoration: InputDecoration(
              hintText: 'Tìm theo ghi chú...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                onPressed: () {
                  _searchController.clear();
                  _pageIndex = 1;
                  _fetchTransactions();
                },
                icon: const Icon(Icons.close),
              ),
              filled: true,
              fillColor: BrutalColors.cardBg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: BrutalColors.ink, width: 2),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: BrutalColors.ink, width: 2),
              ),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('Tất cả', 'all'),
                _buildFilterChip('Thu', 'Income'),
                _buildFilterChip('Chi', 'Expense'),
                _buildFilterChip('Chuyển', 'Transfer'),
                _buildPickerChip(
                  label: _selectedCategory == null ? 'Danh mục' : 'Đã chọn DM',
                  onTap: () => _showFilterPicker(
                    title: 'Danh mục',
                    items: _categories,
                    value: _selectedCategory,
                    onChanged: (value) {
                      setState(() {
                        _selectedCategory = value;
                        _pageIndex = 1;
                      });
                      _fetchTransactions();
                    },
                  ),
                ),
                _buildPickerChip(
                  label: _selectedAccount == null ? 'Tài khoản' : 'Đã chọn TK',
                  onTap: () => _showFilterPicker(
                    title: 'Tài khoản',
                    items: _accounts,
                    value: _selectedAccount,
                    onChanged: (value) {
                      setState(() {
                        _selectedAccount = value;
                        _pageIndex = 1;
                      });
                      _fetchTransactions();
                    },
                  ),
                ),
                _buildPickerChip(
                  label: _selectedJar == null ? 'Hũ' : 'Đã chọn hũ',
                  onTap: () => _showFilterPicker(
                    title: 'Hũ',
                    items: _jars,
                    value: _selectedJar,
                    onChanged: (value) {
                      setState(() {
                        _selectedJar = value;
                        _pageIndex = 1;
                      });
                      _fetchTransactions();
                    },
                  ),
                ),
                _buildPickerChip(
                  label: _fromDate == null
                      ? 'Ngày'
                      : '${_formatDate(_fromDate!)} - ${_formatDate(_toDate!)}',
                  onTap: _pickDateRange,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionRow(dynamic tx, int index) {
    final isIncome = _isIncomeTransaction(tx);
    final isTransfer = _isTransferTransaction(tx);
    final amount = _transactionAmount(tx);
    final transactionId = _idOf(_value(tx, 'id'));
    final amountColor = isIncome
        ? BrutalColors.successText
        : isTransfer
            ? BrutalColors.ink
            : BrutalColors.destructive;
    final amountPrefix = isIncome
        ? '+'
        : isTransfer
            ? '↔ '
            : '-';

    return Dismissible(
      key: Key(transactionId.isNotEmpty ? transactionId : index.toString()),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) => showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Xóa giao dịch?'),
          content: const Text('Bạn có chắc muốn xóa giao dịch này?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Hủy'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Xóa'),
            ),
          ],
        ),
      ),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: BrutalColors.destructive,
          borderRadius: BorderRadius.circular(16),
          border: BrutalStyles.border,
        ),
        child: const Icon(Icons.delete_forever, color: Colors.white, size: 28),
      ),
      onDismissed: (_) => _deleteTransaction(transactionId),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: BrutalCard(
          padding: const EdgeInsets.all(14),
          onTap: () => _showTransactionDetail(tx),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: isIncome
                    ? BrutalColors.green
                    : isTransfer
                        ? BrutalColors.cardBg
                        : BrutalColors.purple,
                radius: 20,
                child: Icon(
                  isIncome
                      ? Icons.add
                      : isTransfer
                          ? Icons.swap_horiz
                          : Icons.remove,
                  color: BrutalColors.ink,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _transactionTitle(tx),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: BrutalStyles.bodyStyle(
                        size: 15,
                        weight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_transactionTypeLabel(tx)} · ${_formatDateTime(_transactionDate(tx))}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: BrutalStyles.labelStyle(size: 12),
                    ),
                  ],
                ),
              ),
              Text(
                '$amountPrefix${_formatCurrency(amount)}',
                style: BrutalStyles.bodyStyle(
                  size: 15,
                  weight: FontWeight.w800,
                  color: amountColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPagination() {
    if (_totalCount <= 0) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 90, top: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Trang $_pageIndex/$_totalPages · $_totalCount giao dịch',
              style: BrutalStyles.labelStyle(size: 12),
            ),
          ),
          IconButton(
            onPressed: _pageIndex <= 1
                ? null
                : () {
                    setState(() => _pageIndex--);
                    _fetchTransactions();
                  },
            icon: const Icon(Icons.chevron_left),
          ),
          IconButton(
            onPressed: _pageIndex >= _totalPages
                ? null
                : () {
                    setState(() => _pageIndex++);
                    _fetchTransactions();
                  },
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: BrutalCard(
          color: BrutalColors.cardBg,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.receipt_long_outlined, size: 48),
              const SizedBox(height: 16),
              Text(
                'Không có giao dịch phù hợp.',
                textAlign: TextAlign.center,
                style: BrutalStyles.bodyStyle(
                  size: 14,
                  color: BrutalColors.grey,
                  weight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String typeValue) {
    final isActive = _selectedType == typeValue;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedType = typeValue;
            _pageIndex = 1;
          });
          _fetchTransactions();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
          decoration: BoxDecoration(
            color: isActive ? BrutalColors.ink : BrutalColors.cardBg,
            border: BrutalStyles.border,
            borderRadius: BorderRadius.circular(9999),
            boxShadow: isActive ? null : [BrutalStyles.shadowSm],
          ),
          child: Text(
            label,
            style: BrutalStyles.bodyStyle(
              size: 13,
              color: isActive ? BrutalColors.cardBg : BrutalColors.ink,
              weight: FontWeight.w800,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPickerChip(
      {required String label, required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
          decoration: BoxDecoration(
            color: BrutalColors.cardBg,
            border: BrutalStyles.border,
            borderRadius: BorderRadius.circular(9999),
            boxShadow: [BrutalStyles.shadowSm],
          ),
          child: Text(
            label,
            style: BrutalStyles.bodyStyle(size: 13, weight: FontWeight.w800),
          ),
        ),
      ),
    );
  }

  void _showFilterPicker({
    required String title,
    required List<dynamic> items,
    required String? value,
    required ValueChanged<String?> onChanged,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: BrutalColors.bg,
      builder: (context) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(16),
          children: [
            Text(title, style: BrutalStyles.titleStyle(size: 18)),
            const SizedBox(height: 8),
            ListTile(
              title: const Text('Tất cả'),
              selected: value == null,
              onTap: () {
                Navigator.pop(context);
                onChanged(null);
              },
            ),
            ...items.map((item) {
              final itemId = _idOf(_value(item, 'id'));
              return ListTile(
                title: Text(_nameOf(item)),
                selected: value == itemId,
                onTap: () {
                  Navigator.pop(context);
                  onChanged(itemId);
                },
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildSegmented({
    required List<String> values,
    required List<String> labels,
    required String selected,
    required ValueChanged<String> onSelected,
  }) {
    return Row(
      children: List.generate(values.length, (index) {
        final value = values[index];
        final isActive = value == selected;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: index == values.length - 1 ? 0 : 8),
            child: GestureDetector(
              onTap: () => onSelected(value),
              child: Container(
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  color: isActive ? BrutalColors.ink : BrutalColors.cardBg,
                  border: BrutalStyles.border,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  labels[index],
                  style: BrutalStyles.bodyStyle(
                    size: 12,
                    color: isActive ? BrutalColors.cardBg : BrutalColors.ink,
                    weight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildDateButton({
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
        const SizedBox(height: 6),
        BrutalCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          onTap: onTap,
          child: Row(
            children: [
              Expanded(
                child: Text(value, style: BrutalStyles.bodyStyle(size: 14)),
              ),
              const Icon(Icons.calendar_today_outlined, size: 18),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<dynamic> items,
    required String emptyLabel,
    required ValueChanged<String?> onChanged,
  }) {
    final normalizedItems = items
        .map((item) => MapEntry(_idOf(_value(item, 'id')), _nameOf(item)))
        .where((entry) => entry.key.isNotEmpty)
        .toList();
    final hasValue = normalizedItems.any((entry) => entry.key == value);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: BrutalStyles.border,
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String?>(
              value: hasValue ? value : null,
              isExpanded: true,
              hint: Text(emptyLabel),
              style: BrutalStyles.bodyStyle(size: 14),
              items: [
                DropdownMenuItem<String?>(
                  value: null,
                  child: Text(emptyLabel),
                ),
                ...normalizedItems.map(
                  (entry) => DropdownMenuItem<String?>(
                    value: entry.key,
                    child: Text(entry.value),
                  ),
                ),
              ],
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  String _nameOf(dynamic item) {
    return (_value(item, 'name') ??
            _value(item, 'jarName') ??
            _value(item, 'categoryName') ??
            'Không tên')
        .toString();
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
            child: Text(
              label,
              style: BrutalStyles.labelStyle(size: 12),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: BrutalStyles.bodyStyle(size: 13, weight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
