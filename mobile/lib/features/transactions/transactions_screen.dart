import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/core/theme/currency_input.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({Key? key}) : super(key: key);

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  final _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _transactions = [];
  List<dynamic> _categories = [];
  List<dynamic> _accounts = [];

  // Filter values
  String _selectedType = 'all'; // 'all', 'income', 'expense'
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    AppSettings().categoriesRefreshNotifier.addListener(_fetchCategories);
    AppSettings().transactionsRefreshNotifier.addListener(_fetchTransactions);
    _loadInitialData();
  }

  @override
  void dispose() {
    AppSettings().categoriesRefreshNotifier.removeListener(_fetchCategories);
    AppSettings()
        .transactionsRefreshNotifier
        .removeListener(_fetchTransactions);
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      await Future.wait([
        _fetchTransactions(),
        _fetchCategories(),
        _fetchAccounts(),
      ]);
    } catch (e) {
      setState(() {
        _transactions = [];
        _categories = [];
        _accounts = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchTransactions() async {
    final response = await _apiClient.get('transactions');
    if (response.statusCode == 200) {
      final data = response.data;
      List<dynamic> parsed = [];
      if (data is Map) {
        parsed = data['data'] ?? data['Data'] ?? [];
      } else if (data is List) {
        parsed = data;
      }
      if (!mounted) return;
      setState(() {
        _transactions = parsed;
      });
    }
  }

  Future<void> _fetchCategories() async {
    final response = await _apiClient.get('categories');
    if (response.statusCode == 200) {
      final data = response.data;
      List<dynamic> combined = [];
      if (data is Map) {
        final defaultCats =
            data['defaultCategories'] ?? data['DefaultCategories'] ?? [];
        final customCats =
            data['customCategories'] ?? data['CustomCategories'] ?? [];
        combined.addAll(defaultCats);
        combined.addAll(customCats);
      } else if (data is List) {
        combined = data;
      }
      setState(() {
        _categories = combined;
      });
    }
  }

  Future<void> _fetchAccounts() async {
    final response = await _apiClient.get('financial-accounts');
    if (response.statusCode == 200) {
      final data = response.data;
      List<dynamic> parsed = [];
      if (data is Map) {
        parsed = data['data'] ?? data['Data'] ?? [];
      } else if (data is List) {
        parsed = data;
      }
      setState(() {
        _accounts = parsed;
      });
    }
  }

  Future<void> _deleteTransaction(String id) async {
    try {
      await _apiClient.delete('transactions/$id');
      await _fetchTransactions();
      AppSettings().triggerDashboardRefresh();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Xóa giao dịch thành công!')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể xóa giao dịch. Hãy thử lại.')),
      );
    }
  }

  void _showAddTransactionDialog() {
    final titleController = TextEditingController();
    final amountController = TextEditingController();
    String type = 'expense';
    String? selectedCategoryId =
        _categories.isNotEmpty ? _idOf(_categories.first['id']) : null;
    String? selectedAccountId =
        _accounts.isNotEmpty ? _idOf(_accounts.first['id']) : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
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
                    Text('Thêm giao dịch mới 📝',
                        style: BrutalStyles.titleStyle(size: 20)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: BrutalButton(
                            text: 'Chi tiêu',
                            color: type == 'expense'
                                ? BrutalColors.destructive
                                : BrutalColors.cardBg,
                            onTap: () {
                              setModalState(() {
                                type = 'expense';
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: BrutalButton(
                            text: 'Thu nhập',
                            color: type == 'income'
                                ? BrutalColors.green
                                : BrutalColors.cardBg,
                            onTap: () {
                              setModalState(() {
                                type = 'income';
                              });
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    BrutalInput(
                      label: 'Tiêu đề',
                      hint: 'Nhập tên chi tiêu...',
                      controller: titleController,
                    ),
                    const SizedBox(height: 12),
                    BrutalCurrencyInput(
                      label: 'Số tiền',
                      hint: '100.000',
                      controller: amountController,
                    ),
                    const SizedBox(height: 12),
                    Text('Danh mục',
                        style: BrutalStyles.bodyStyle(
                            size: 14, weight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: BrutalStyles.border,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedCategoryId,
                          isExpanded: true,
                          style: BrutalStyles.bodyStyle(size: 14),
                          items:
                              _categories.map<DropdownMenuItem<String>>((cat) {
                            return DropdownMenuItem<String>(
                              value: _idOf(cat['id']),
                              child: Text(cat['name'] ?? 'Danh mục'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setModalState(() {
                              selectedCategoryId = val;
                            });
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Tài khoản',
                        style: BrutalStyles.bodyStyle(
                            size: 14, weight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: BrutalStyles.border,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedAccountId,
                          isExpanded: true,
                          style: BrutalStyles.bodyStyle(size: 14),
                          items: _accounts.map<DropdownMenuItem<String>>((acc) {
                            return DropdownMenuItem<String>(
                              value: _idOf(acc['id']),
                              child: Text(acc['name'] ?? 'Tài khoản'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setModalState(() {
                              selectedAccountId = val;
                            });
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    BrutalButton(
                      text: 'TẠO GIAO DỊCH',
                      color: BrutalColors.green,
                      onTap: () async {
                        final title = titleController.text.trim();
                        final amount = amountController.rawValue;

                        if (title.isNotEmpty && amount > 0) {
                          try {
                            await _apiClient.post('transactions', data: {
                              'financialAccountId': selectedAccountId,
                              'type': type == 'income' ? 'Income' : 'Expense',
                              'transactionsAmount': amount,
                              'categoryId': selectedCategoryId,
                              'note': title,
                              'date': DateTime.now().toIso8601String(),
                            });
                            await _fetchTransactions();
                            AppSettings().triggerDashboardRefresh();
                            if (context.mounted) Navigator.pop(context);
                          } catch (e) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text(
                                      'Không thể tạo giao dịch. Hãy thử lại.')),
                            );
                          }
                        }
                      },
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

  String _formatCurrency(double amount) {
    return AppSettings().formatCurrency(amount);
  }

  String _idOf(dynamic value) => value?.toString() ?? '';

  String _transactionType(dynamic tx) {
    return (tx['type'] ?? '').toString().toLowerCase();
  }

  bool _isIncomeTransaction(dynamic tx) => _transactionType(tx) == 'income';

  double _transactionAmount(dynamic tx) {
    final value = tx['transactionsAmount'] ?? tx['amount'] ?? 0;
    if (value is num) return value.toDouble().abs();
    return double.tryParse(value.toString())?.abs() ?? 0;
  }

  String _transactionTitle(dynamic tx) {
    return (tx['note'] ?? tx['title'] ?? tx['description'] ?? 'Giao dịch')
        .toString();
  }

  String _transactionCategoryName(dynamic tx) {
    final category = tx['category'];
    if (category is Map) {
      return (category['name'] ?? 'Khác').toString();
    }
    return (tx['categoryName'] ?? category ?? 'Khác').toString();
  }

  String _transactionCategoryId(dynamic tx) {
    final category = tx['category'];
    if (category is Map) {
      return _idOf(category['id']);
    }
    return _idOf(tx['categoryId'] ?? category);
  }

  @override
  Widget build(BuildContext context) {
    final filteredTransactions = _transactions.where((tx) {
      final matchesType =
          _selectedType == 'all' || _transactionType(tx) == _selectedType;
      final matchesCategory = _selectedCategory == null ||
          _transactionCategoryId(tx) == _selectedCategory;
      return matchesType && matchesCategory;
    }).toList();

    return ListenableBuilder(
      listenable: AppSettings(),
      builder: (context, _) {
        return Scaffold(
          backgroundColor: BrutalColors.bg,
          appBar: AppBar(
            backgroundColor: BrutalColors.cardBg,
            elevation: 0,
            title: Text('Sổ Giao Dịch 📖',
                style: BrutalStyles.titleStyle(size: 22)),
            shape:
                Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
          ),
          body: Column(
            children: [
              // Filter section
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(child: _buildFilterChip('Tất cả', 'all')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildFilterChip('Thu', 'income')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildFilterChip('Chi', 'expense')),
                  ],
                ),
              ),
              Divider(height: 1, thickness: 2, color: BrutalColors.ink),

              // Main list
              Expanded(
                child: _isLoading
                    ? Center(
                        child:
                            CircularProgressIndicator(color: BrutalColors.ink))
                    : filteredTransactions.isEmpty
                        ? Center(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(24),
                              child: BrutalCard(
                                color: BrutalColors.cardBg,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    const Text('📖',
                                        style: TextStyle(fontSize: 48),
                                        textAlign: TextAlign.center),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Không tìm thấy giao dịch nào. Hãy bấm nút + ở góc để thêm giao dịch mới!',
                                      textAlign: TextAlign.center,
                                      style: BrutalStyles.bodyStyle(
                                          size: 14,
                                          color: BrutalColors.grey,
                                          weight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                        : ListView.builder(
                            itemCount: filteredTransactions.length,
                            padding: const EdgeInsets.all(16),
                            itemBuilder: (context, index) {
                              final tx = filteredTransactions[index];
                              final isIncome = _isIncomeTransaction(tx);
                              final amount = _transactionAmount(tx);
                              final transactionId = _idOf(tx['id']);

                              return Dismissible(
                                key: Key(transactionId.isNotEmpty
                                    ? transactionId
                                    : index.toString()),
                                direction: DismissDirection.endToStart,
                                background: Container(
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 20),
                                  decoration: BoxDecoration(
                                    color: BrutalColors.destructive,
                                    borderRadius: BorderRadius.circular(16),
                                    border: BrutalStyles.border,
                                  ),
                                  child: const Icon(Icons.delete_forever,
                                      color: Colors.white, size: 28),
                                ),
                                onDismissed: (direction) =>
                                    _deleteTransaction(transactionId),
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: BrutalCard(
                                    padding: const EdgeInsets.all(14),
                                    child: Row(
                                      children: [
                                        CircleAvatar(
                                          backgroundColor: isIncome
                                              ? BrutalColors.green
                                              : BrutalColors.purple,
                                          radius: 20,
                                          child: Icon(
                                            isIncome ? Icons.add : Icons.remove,
                                            color: BrutalColors.ink,
                                            size: 20,
                                          ),
                                        ),
                                        const SizedBox(width: 14),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                _transactionTitle(tx),
                                                style: BrutalStyles.bodyStyle(
                                                    size: 15,
                                                    weight: FontWeight.w800),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                _transactionCategoryName(tx),
                                                style: BrutalStyles.labelStyle(
                                                    size: 12),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          '${isIncome ? "+" : "-"}${_formatCurrency(amount)}',
                                          style: BrutalStyles.bodyStyle(
                                            size: 15,
                                            weight: FontWeight.w800,
                                            color: isIncome
                                                ? BrutalColors.successText
                                                : BrutalColors.destructive,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
              ),
            ],
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

  Widget _buildFilterChip(String label, String typeValue) {
    final isActive = _selectedType == typeValue;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedType = typeValue;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
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
    );
  }
}
