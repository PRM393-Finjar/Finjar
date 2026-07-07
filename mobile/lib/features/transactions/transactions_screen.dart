import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:intl/intl.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:dio/dio.dart';
import 'package:finjar_mobile/core/theme/currency_input.dart';

class TransactionsScreen extends StatefulWidget {
  final ApiClient? apiClient;
  const TransactionsScreen({super.key, this.apiClient});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  late final ApiClient _apiClient;

  @override
  void initState() {
    super.initState();
    _apiClient = widget.apiClient ?? ApiClient();
    AppSettings().categoriesRefreshNotifier.addListener(_fetchCategories);
    _loadInitialData();
  }
  bool _isLoading = false;
  List<dynamic> _transactions = [];
  List<dynamic> _categories = [];
  List<dynamic> _accounts = [];
  List<dynamic> _jars = [];

  // Filter values
  String _selectedType = 'all'; // 'all', 'income', 'expense'
  String? _selectedCategory;
  bool _showDeleted = false;


  @override
  void dispose() {
    AppSettings().categoriesRefreshNotifier.removeListener(_fetchCategories);
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
        _fetchJars(),
      ]);
    } catch (e) {
      setState(() {
        _transactions = [];
        _categories = [];
        _accounts = [];
        _jars = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchTransactions() async {
    try {
      final response = await _apiClient.get('transactions', queryParameters: {'isDeleted': _showDeleted});
      if (response.statusCode == 200) {
        setState(() {
          _transactions = response.data is Map ? response.data['data'] ?? [] : (response.data is List ? response.data : []);
          print('DEBUG: _transactions length: ${_transactions.length}');
        });
      }
    } catch (e) {
      print('DEBUG: _fetchTransactions error: $e');
      setState(() {
        _transactions = [];
      });
    }
  }

  Future<void> _fetchCategories() async {
    final response = await _apiClient.get('categories');
    if (response.statusCode == 200) {
      final data = response.data;
      List<dynamic> combined = [];
      if (data is Map) {
        final defaultCats = data['defaultCategories'] ?? data['DefaultCategories'] ?? [];
        final customCats = data['customCategories'] ?? data['CustomCategories'] ?? [];
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

  Future<void> _fetchJars() async {
    final response = await _apiClient.get('jars');
    if (response.statusCode == 200) {
      final data = response.data;
      List<dynamic> parsed = [];
      if (data is Map) {
        parsed = data['data'] ?? data['Data'] ?? [];
      } else if (data is List) {
        parsed = data;
      }
      setState(() {
        _jars = parsed;
      });
    }
  }

  Future<void> _deleteTransaction(String id) async {
    try {
      await _apiClient.delete('transactions/$id');
      await _fetchTransactions();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Xóa giao dịch thành công!')),
      );
    } catch (e) {
      String msg = 'Không thể xóa giao dịch. Hãy thử lại.';
      if (e is DioException && e.response?.data != null) {
        msg = e.response?.data['details']?['code'] ?? e.response?.data['message'] ?? msg;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
    }
  }

  Future<void> _restoreTransaction(String id) async {
    try {
      await _apiClient.post('transactions/$id/restore');
      await _fetchTransactions();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Khôi phục giao dịch thành công!')),
      );
    } catch (e) {
      String msg = 'Không thể khôi phục giao dịch. Hãy thử lại.';
      if (e is DioException && e.response?.data != null) {
        final code = e.response?.data['details']?['code'];
        if (code == 'INSUFFICIENT_FUNDS_FOR_REVERSAL') {
          msg = 'Số dư không đủ để khôi phục (giao dịch đã tiêu phần này).';
        } else if (code == 'CONCURRENCY_ERROR') {
          msg = 'Lỗi đồng bộ, vui lòng thử lại.';
        } else {
          msg = code ?? e.response?.data['message'] ?? msg;
        }
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
    }
  }


  void _showAddTransactionDialog() {
    final titleController = TextEditingController();
    final amountController = TextEditingController();
    String type = 'expense';
    String? selectedCategoryId = _categories.isNotEmpty ? _categories.first['id'].toString() : null;
    String? selectedAccountId = _accounts.isNotEmpty ? _accounts.first['id'].toString() : null;
    String? selectedFromJarId = _jars.isNotEmpty ? _jars.first['id'].toString() : null;
    String? selectedToJarId = _jars.isNotEmpty ? _jars.first['id'].toString() : null;

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
                    Text('Thêm giao dịch mới 📝', style: BrutalStyles.titleStyle(size: 20)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: BrutalButton(
                            text: 'Chi',
                            color: type == 'expense' ? BrutalColors.destructive : BrutalColors.cardBg,
                            onTap: () {
                              setModalState(() {
                                type = 'expense';
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: BrutalButton(
                            text: 'Thu',
                            color: type == 'income' ? BrutalColors.green : BrutalColors.cardBg,
                            onTap: () {
                              setModalState(() {
                                type = 'income';
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: BrutalButton(
                            text: 'Chuyển',
                            color: type == 'Transfer' ? BrutalColors.purple : BrutalColors.cardBg,
                            onTap: () {
                              setModalState(() {
                                type = 'Transfer';
                              });
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    BrutalInput(
                      label: 'Tiêu đề',
                      hint: 'Nhập ghi chú...',
                      controller: titleController,
                    ),
                    const SizedBox(height: 12),
                    BrutalCurrencyInput(
                      label: 'Số tiền',
                      hint: '100.000',
                      controller: amountController,
                    ),
                    const SizedBox(height: 12),
                    if (type != 'Transfer') ...[
                      Text('Danh mục', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
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
                            items: _categories.map<DropdownMenuItem<String>>((cat) {
                              return DropdownMenuItem<String>(
                                value: cat['id'].toString(),
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
                      Text('Tài khoản', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
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
                                value: acc['id'].toString(),
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
                    ] else ...[
                      Text('Hũ nguồn', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
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
                            value: selectedFromJarId,
                            isExpanded: true,
                            style: BrutalStyles.bodyStyle(size: 14),
                            items: _jars.map<DropdownMenuItem<String>>((jar) {
                              return DropdownMenuItem<String>(
                                value: jar['id'].toString(),
                                child: Text(jar['name'] ?? 'Hũ'),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setModalState(() {
                                selectedFromJarId = val;
                              });
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text('Hũ đích', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
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
                            value: selectedToJarId,
                            isExpanded: true,
                            style: BrutalStyles.bodyStyle(size: 14),
                            items: _jars.map<DropdownMenuItem<String>>((jar) {
                              return DropdownMenuItem<String>(
                                value: jar['id'].toString(),
                                child: Text(jar['name'] ?? 'Hũ'),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setModalState(() {
                                selectedToJarId = val;
                              });
                            },
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    BrutalButton(
                      text: 'TẠO GIAO DỊCH',
                      color: BrutalColors.green,
                      onTap: () async {
                        final title = titleController.text.trim();
                        final amount = amountController.rawValue;

                        if (type == 'Transfer' && selectedFromJarId == selectedToJarId) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Hũ nguồn và hũ đích phải khác nhau!')),
                          );
                          return;
                        }

                        if (title.isNotEmpty && amount > 0) {
                          try {
                            final data = <String, dynamic>{
                              'type': type == 'Transfer' ? 'Transfer' : (type == 'income' ? 'Income' : 'Expense'),
                              'transactionsAmount': amount,
                              'note': title,
                              'date': DateTime.now().toIso8601String(),
                            };
                            if (type == 'Transfer') {
                              data['fromJarId'] = selectedFromJarId;
                              data['toJarId'] = selectedToJarId;
                            } else {
                              data['financialAccountId'] = selectedAccountId;
                              data['categoryId'] = selectedCategoryId;
                            }
                            await _apiClient.post('transactions', data: data);
                            await _fetchTransactions();
                          } catch (e) {
                            String msg = 'Không thể tạo giao dịch. Hãy thử lại.';
                            if (e is DioException && e.response?.data != null) {
                              final code = e.response?.data['details']?['code'];
                              if (code == 'INSUFFICIENT_FUNDS') {
                                msg = 'Số dư không đủ.';
                              } else if (code == 'INVALID_DATE') {
                                msg = 'Ngày không hợp lệ.';
                              } else if (code == 'CONCURRENCY_ERROR') {
                                msg = 'Lỗi đồng bộ, vui lòng thử lại.';
                              } else {
                                msg = code ?? e.response?.data['message'] ?? msg;
                              }
                            }
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(msg)),
                            );
                          }
                          if (mounted) Navigator.pop(context);
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

  void _showEditTransactionDialog(Map<String, dynamic> tx) {
    if (tx['isDeleted'] == true) return; // Cannot edit deleted tx
    final titleController = TextEditingController(text: tx['note'] ?? tx['title'] ?? '');
    final amountController = TextEditingController(text: (tx['transactionsAmount'] ?? tx['amount'] ?? 0).toString());
    String type = (tx['type'] ?? '').toString().toLowerCase();
    
    String? selectedCategoryId;
    if (tx['category'] is Map) {
      selectedCategoryId = tx['category']['id']?.toString();
    } else {
      selectedCategoryId = tx['categoryId']?.toString();
    }
    
    // Ensure category id is valid
    if (selectedCategoryId != null && !_categories.any((c) => c['id'].toString() == selectedCategoryId)) {
      selectedCategoryId = null;
    }

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
                    Text('Sửa giao dịch 📝', style: BrutalStyles.titleStyle(size: 20)),
                    const SizedBox(height: 16),
                    BrutalInput(
                      label: 'Tiêu đề',
                      hint: 'Nhập ghi chú...',
                      controller: titleController,
                    ),
                    const SizedBox(height: 12),
                    BrutalCurrencyInput(
                      label: 'Số tiền',
                      hint: '100.000',
                      controller: amountController,
                    ),
                    const SizedBox(height: 12),
                    if (type != 'transfer') ...[
                      Text('Danh mục', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
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
                            items: _categories.map<DropdownMenuItem<String>>((cat) {
                              return DropdownMenuItem<String>(
                                value: cat['id'].toString(),
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
                      const SizedBox(height: 24),
                    ],
                    BrutalButton(
                      text: 'CẬP NHẬT',
                      color: BrutalColors.green,
                      onTap: () async {
                        final title = titleController.text.trim();
                        final amount = amountController.rawValue;

                        if (amount > 0) {
                          try {
                            final data = <String, dynamic>{
                              'transactionsAmount': amount,
                              'note': title,
                            };
                            if (type != 'transfer') {
                              data['categoryId'] = selectedCategoryId;
                            }
                            await _apiClient.patch('transactions/${tx['id']}', data: data);
                            await _fetchTransactions();
                          } catch (e) {
                            String msg = 'Không thể cập nhật giao dịch. Hãy thử lại.';
                            if (e is DioException && e.response?.data != null) {
                              final code = e.response?.data['details']?['code'];
                              msg = code ?? e.response?.data['message'] ?? msg;
                            }
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(msg)),
                            );
                          }
                          if (mounted) Navigator.pop(context);
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

  @override
  Widget build(BuildContext context) {
    final filteredTransactions = _transactions.where((tx) {
      final matchesType = _selectedType == 'all' || tx['type'] == _selectedType;
      final matchesCategory = _selectedCategory == null || tx['category'] == _selectedCategory;
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
            title: Text('Sổ Giao Dịch 📖', style: BrutalStyles.titleStyle(size: 22)),
            shape: Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
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
                    const SizedBox(width: 8),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _showDeleted = !_showDeleted;
                          });
                          _fetchTransactions();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: _showDeleted ? BrutalColors.ink : BrutalColors.cardBg,
                            border: BrutalStyles.border,
                            borderRadius: BorderRadius.circular(9999),
                            boxShadow: _showDeleted ? null : [BrutalStyles.shadowSm],
                          ),
                          child: Text(
                            'Đã xóa',
                            style: BrutalStyles.bodyStyle(
                              size: 13,
                              color: _showDeleted ? BrutalColors.cardBg : BrutalColors.ink,
                              weight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, thickness: 2, color: BrutalColors.ink),
    
              // Main list
              Expanded(
                child: _isLoading
                    ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
                    : filteredTransactions.isEmpty
                        ? Center(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(24),
                              child: BrutalCard(
                                color: BrutalColors.cardBg,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const Text('📖', style: TextStyle(fontSize: 48), textAlign: TextAlign.center),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Không tìm thấy giao dịch nào. Hãy bấm nút + ở góc để thêm giao dịch mới!',
                                      textAlign: TextAlign.center,
                                      style: BrutalStyles.bodyStyle(size: 14, color: BrutalColors.grey, weight: FontWeight.w700),
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
                              final txType = (tx['type'] ?? '').toString().toLowerCase();
                              final isIncome = txType == 'income';
                              final isTransfer = txType == 'transfer';
                              final amount = (tx['transactionsAmount'] ?? tx['amount'] ?? 0.0).toDouble();
                              final isDeleted = tx['isDeleted'] == true;
    
                              return Dismissible(
                                key: Key(tx['id']?.toString() ?? index.toString()),
                                direction: DismissDirection.endToStart,
                                background: Container(
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 20),
                                  decoration: BoxDecoration(
                                    color: isDeleted ? BrutalColors.green : BrutalColors.destructive,
                                    borderRadius: BorderRadius.circular(16),
                                    border: BrutalStyles.border,
                                  ),
                                  child: Icon(
                                    isDeleted ? Icons.restore : Icons.delete_forever, 
                                    color: Colors.white, 
                                    size: 28
                                  ),
                                ),
                                onDismissed: (direction) {
                                  if (isDeleted) {
                                    _restoreTransaction(tx['id']?.toString() ?? '');
                                  } else {
                                    _deleteTransaction(tx['id']?.toString() ?? '');
                                  }
                                },
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: GestureDetector(
                                    onTap: () => _showEditTransactionDialog(tx),
                                    child: BrutalCard(
                                      color: isDeleted ? BrutalColors.cardBg.withOpacity(0.5) : BrutalColors.cardBg,
                                      padding: const EdgeInsets.all(14),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            backgroundColor: isDeleted 
                                              ? Colors.grey.shade400 
                                              : (isTransfer ? BrutalColors.purple : (isIncome ? BrutalColors.green : BrutalColors.destructive)),
                                            radius: 20,
                                            child: Icon(
                                              isDeleted ? Icons.block : (isTransfer ? Icons.swap_horiz : (isIncome ? Icons.add : Icons.remove)),
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
                                                  tx['note'] ?? tx['title'] ?? (isTransfer ? 'Chuyển tiền' : (isIncome ? 'Thu nhập' : 'Chi tiêu')),
                                                  style: BrutalStyles.bodyStyle(size: 15, weight: FontWeight.w800),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  isTransfer
                                                    ? (tx['jarName'] ?? tx['toJarName'] ?? 'Hũ')
                                                    : (tx['financialAccountName'] ?? tx['categoryName'] ?? (tx['category'] is Map ? (tx['category']['name'] ?? 'Khác') : (tx['category'] ?? 'Khác'))),
                                                  style: BrutalStyles.labelStyle(size: 12),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Text(
                                            '${isTransfer ? "" : (isIncome ? "+" : "-")}${_formatCurrency(amount)}',
                                            style: BrutalStyles.bodyStyle(
                                              size: 15,
                                              weight: FontWeight.w800,
                                              color: isTransfer ? BrutalColors.ink : (isIncome ? BrutalColors.successText : BrutalColors.destructive),
                                            ),
                                          ),
                                        ],
                                      ),
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
