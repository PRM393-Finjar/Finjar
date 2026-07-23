import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:intl/intl.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/core/theme/thousands_formatter.dart';

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
    _loadInitialData();
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
      setState(() {
        _transactions = response.data['data'] ?? [];
      });
    }
  }

  Future<void> _fetchCategories() async {
    final response = await _apiClient.get('categories');
    if (response.statusCode == 200) {
      setState(() {
        _categories = response.data ?? [];
      });
    }
  }

  Future<void> _fetchAccounts() async {
    final response = await _apiClient.get('financial-accounts');
    if (response.statusCode == 200) {
      setState(() {
        _accounts = response.data ?? [];
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
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể xóa giao dịch. Hãy thử lại.')),
      );
    }
  }

  void _showAddTransactionDialog() {
    final titleController = TextEditingController();
    final amountController = TextEditingController();
    String type = 'expense';
    String? selectedCategoryId = _categories.isNotEmpty ? _categories.first['id'] : null;
    String? selectedAccountId = _accounts.isNotEmpty ? _accounts.first['id'] : null;

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
                            text: 'Chi tiêu',
                            color: type == 'expense' ? BrutalColors.destructive : BrutalColors.cardBg,
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
                            color: type == 'income' ? BrutalColors.green : BrutalColors.cardBg,
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
                    BrutalInput(
                      label: 'Số tiền',
                      hint: '100.000',
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [ThousandsSeparatorInputFormatter()],
                    ),
                    const SizedBox(height: 12),
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
                              value: cat['id'],
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
                              value: acc['id'],
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
                        final amount = double.tryParse(amountController.text.replaceAll('.', '')) ?? 0.0;

                        if (title.isNotEmpty && amount > 0) {
                          try {
                            await _apiClient.post('transactions', data: {
                              'financialAccountId': selectedAccountId,
                              'type': type,
                              'transactionsAmount': amount,
                              'categoryId': selectedCategoryId,
                              'note': title,
                              'date': DateTime.now().toIso8601String(),
                            });
                            await _fetchTransactions();
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Không thể tạo giao dịch. Hãy thử lại.')),
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
                              final isIncome = tx['type'] == 'income';
                              final amount = (tx['transactionsAmount'] ?? tx['amount'] ?? 0.0).toDouble();
    
                              return Dismissible(
                                key: Key(tx['id'] ?? index.toString()),
                                direction: DismissDirection.endToStart,
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
                                onDismissed: (direction) => _deleteTransaction(tx['id']),
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: BrutalCard(
                                    padding: const EdgeInsets.all(14),
                                    child: Row(
                                      children: [
                                        CircleAvatar(
                                          backgroundColor: isIncome ? BrutalColors.green : BrutalColors.purple,
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
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                tx['note'] ?? tx['title'] ?? 'Chi tiêu',
                                                style: BrutalStyles.bodyStyle(size: 15, weight: FontWeight.w800),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                tx['category'] is Map
                                                    ? (tx['category']['name'] ?? 'Khác')
                                                    : (tx['category'] ?? 'Khác'),
                                                style: BrutalStyles.labelStyle(size: 12),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          '${isIncome ? "+" : "-"}${_formatCurrency(amount)}',
                                          style: BrutalStyles.bodyStyle(
                                            size: 15,
                                            weight: FontWeight.w800,
                                            color: isIncome ? BrutalColors.successText : BrutalColors.destructive,
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
            heroTag: 'transactions_fab',
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
