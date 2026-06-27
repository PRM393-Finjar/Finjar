import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:intl/intl.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/core/theme/currency_input.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({Key? key}) : super(key: key);

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _apiClient = ApiClient();
  bool _isLoading = false;

  List<dynamic> _accounts = [];
  List<dynamic> _jars = [];
  List<dynamic> _limits = [];
  List<dynamic> _categories = []; // Loaded for limits creation dropdown

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {}); // Refresh FAB dynamically when tab switches
    });
    AppSettings().categoriesRefreshNotifier.addListener(_fetchCategories);
    _loadWalletData();
  }

  @override
  void dispose() {
    AppSettings().categoriesRefreshNotifier.removeListener(_fetchCategories);
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadWalletData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      await Future.wait([
        _fetchAccounts(),
        _fetchJars(),
        _fetchLimits(),
        _fetchCategories(),
      ]);
    } catch (e) {
      setState(() {
        _accounts = [];
        _jars = [];
        _limits = [];
        _categories = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
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

  Future<void> _fetchLimits() async {
    final response = await _apiClient.get('limits');
    if (response.statusCode == 200) {
      final data = response.data;
      List<dynamic> parsed = [];
      if (data is Map) {
        parsed = data['data'] ?? data['Data'] ?? [];
      } else if (data is List) {
        parsed = data;
      }
      setState(() {
        _limits = parsed;
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

  // --- Financial Account CRUD operations ---
  Future<void> _addAccount(String name, String type, double balance) async {
    try {
      String mappedType = 'Cash';
      if (type.toLowerCase() == 'saving') {
        mappedType = 'Bank';
      }
      await _apiClient.post('financial-accounts/Manual', data: {
        'name': name,
        'accountType': mappedType,
        'currentBalance': balance,
        'currency': 'VND',
        'isDefault': false,
      });
      _fetchAccounts();
      AppSettings().triggerDashboardRefresh();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tạo tài khoản thành công!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể tạo tài khoản. Hãy thử lại.')),
      );
    }
  }

  Future<void> _updateAccount(String id, String name, double balance) async {
    try {
      await _apiClient.patch('financial-accounts/$id', data: {
        'name': name,
        'currentBalance': balance,
      });
      _fetchAccounts();
      AppSettings().triggerDashboardRefresh();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể cập nhật tài khoản.')),
      );
    }
  }

  void _confirmDeleteAccount(String id, String accountName) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: BrutalColors.bg,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: BrutalColors.ink, width: 3),
            borderRadius: BorderRadius.all(Radius.circular(20)),
          ),
          title: Text(
            'Xác nhận xóa tài khoản ⚠️',
            style: BrutalStyles.titleStyle(size: 18),
          ),
          content: Text(
            'Bạn có chắc chắn muốn xóa tài khoản "$accountName" không? Thao tác này không thể hoàn tác.',
            style: BrutalStyles.bodyStyle(size: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Hủy',
                style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700, color: BrutalColors.grey),
              ),
            ),
            BrutalButton(
              text: 'XÓA',
              color: BrutalColors.destructive,
              isFullWidth: false,
              onTap: () {
                Navigator.pop(context);
                _deleteAccount(id);
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteAccount(String id) async {
    try {
      await _apiClient.delete('financial-accounts/$id');
      _fetchAccounts();
      AppSettings().triggerDashboardRefresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xóa tài khoản thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể xóa tài khoản này.')),
        );
      }
    }
  }

  void _showAddAccountDialog() {
    final nameController = TextEditingController();
    final balanceController = TextEditingController();
    String type = 'cash'; // 'cash', 'saving'

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
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Thêm tài khoản mới 💳', style: BrutalStyles.titleStyle(size: 20)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: BrutalButton(
                          text: 'Tiền mặt',
                          color: type == 'cash' ? BrutalColors.green : BrutalColors.cardBg,
                          onTap: () {
                            setModalState(() {
                              type = 'cash';
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: BrutalButton(
                          text: 'Tiết kiệm',
                          color: type == 'saving' ? BrutalColors.purple : BrutalColors.cardBg,
                          onTap: () {
                            setModalState(() {
                              type = 'saving';
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  BrutalInput(
                    label: 'Tên tài khoản / Ngân hàng',
                    hint: 'Ví dụ: Vietcombank, Ví cá nhân...',
                    controller: nameController,
                  ),
                  const SizedBox(height: 12),
                  BrutalCurrencyInput(
                    label: 'Số dư ban đầu',
                    hint: '1.000.000',
                    controller: balanceController,
                  ),
                  const SizedBox(height: 24),
                  BrutalButton(
                    text: 'TẠO TÀI KHOẢN',
                    color: BrutalColors.green,
                    onTap: () async {
                      final name = nameController.text.trim();
                      final balance = balanceController.rawValue;
                      if (name.isNotEmpty) {
                        await _addAccount(name, type, balance);
                        if (mounted) Navigator.pop(context);
                      }
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showEditAccountDialog(dynamic acc) {
    final editNameController = TextEditingController(text: acc['name']);
    final initialBalance = (acc['balance'] ?? acc['currentBalance'] ?? 0.0).toDouble();
    final editBalanceController = TextEditingController(
      text: initialBalance.toInt().toString(),
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Chỉnh sửa tài khoản 💳', style: BrutalStyles.titleStyle(size: 20)),
              const SizedBox(height: 16),
              BrutalInput(
                label: 'Tên tài khoản / Ngân hàng',
                hint: 'Ví dụ: Vietcombank, Ví cá nhân...',
                controller: editNameController,
              ),
              const SizedBox(height: 12),
              BrutalCurrencyInput(
                label: 'Số dư hiện tại',
                hint: '1.000.000',
                controller: editBalanceController,
              ),
              const SizedBox(height: 24),
              BrutalButton(
                text: 'CẬP NHẬT',
                color: BrutalColors.green,
                onTap: () async {
                  final name = editNameController.text.trim();
                  final balance = editBalanceController.rawValue;
                  if (name.isNotEmpty) {
                    await _updateAccount(acc['id'], name, balance);
                    if (mounted) Navigator.pop(context);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // --- Jar CRUD operations ---
  Future<void> _updateJarName(String id, String name) async {
    try {
      await _apiClient.patch('jars/$id', data: {
        'name': name,
      });
      _fetchJars();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể đổi tên hũ tài chính.')),
      );
    }
  }

  void _showEditJarDialog(dynamic jar) {
    final editNameController = TextEditingController(text: jar['name']);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Đổi tên hũ tài chính 🏷️', style: BrutalStyles.titleStyle(size: 20)),
              const SizedBox(height: 16),
              BrutalInput(
                label: 'Tên hũ mới',
                hint: 'Ví dụ: Quỹ giáo dục, Giải trí...',
                controller: editNameController,
              ),
              const SizedBox(height: 24),
              BrutalButton(
                text: 'ĐỔI TÊN HŨ',
                color: BrutalColors.purple,
                onTap: () async {
                  final name = editNameController.text.trim();
                  if (name.isNotEmpty) {
                    await _updateJarName(jar['id'], name);
                    if (mounted) Navigator.pop(context);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // --- Limit CRUD operations ---
  Future<void> _addLimit(String categoryId, double limitAmt, double alertPercentage) async {
    try {
      await _apiClient.post('limits', data: {
        'targetType': 'category',
        'targetId': categoryId,
        'limitAmount': limitAmt,
        'period': 'monthly',
        'alertAtPercentage': alertPercentage,
      });
      _fetchLimits();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tạo hạn mức thành công!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể tạo hạn mức. Hãy thử lại.')),
      );
    }
  }

  Future<void> _updateLimit(String id, double limitAmt, double alertPercentage) async {
    try {
      await _apiClient.patch('limits/$id', data: {
        'limitAmount': limitAmt,
        'alertAtPercentage': alertPercentage,
      });
      _fetchLimits();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể cập nhật hạn mức.')),
      );
    }
  }

  void _confirmDeleteLimit(String id, String categoryName) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: BrutalColors.bg,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: BrutalColors.ink, width: 3),
            borderRadius: BorderRadius.all(Radius.circular(20)),
          ),
          title: Text(
            'Xác nhận xóa hạn mức ⚠️',
            style: BrutalStyles.titleStyle(size: 18),
          ),
          content: Text(
            'Bạn có chắc chắn muốn xóa hạn mức chi tiêu cho danh mục "$categoryName" không? Thao tác này không thể hoàn tác.',
            style: BrutalStyles.bodyStyle(size: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Hủy',
                style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700, color: BrutalColors.grey),
              ),
            ),
            BrutalButton(
              text: 'XÓA',
              color: BrutalColors.destructive,
              isFullWidth: false,
              onTap: () {
                Navigator.pop(context);
                _deleteLimit(id);
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteLimit(String id) async {
    try {
      await _apiClient.delete('limits/$id');
      _fetchLimits();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xóa hạn mức thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể xóa hạn mức này.')),
        );
      }
    }
  }

  void _showAddLimitDialog() {
    String? selectedCategoryId = _categories.isNotEmpty ? _categories.first['id'] : null;
    final limitAmountController = TextEditingController();
    final alertController = TextEditingController(text: '80');

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
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Thêm hạn mức chi tiêu mới ⚠️', style: BrutalStyles.titleStyle(size: 20)),
                  const SizedBox(height: 16),
                  Text('Chọn danh mục chi tiêu', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
                  const SizedBox(height: 6),
                   Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: BrutalColors.cardBg,
                      border: BrutalStyles.border,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BrutalStyles.shadowSm],
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedCategoryId,
                        isExpanded: true,
                        style: BrutalStyles.bodyStyle(size: 14),
                        onChanged: (val) {
                          if (val != null) {
                            setModalState(() {
                              selectedCategoryId = val;
                            });
                          }
                        },
                        items: _categories.map<DropdownMenuItem<String>>((cat) {
                          return DropdownMenuItem<String>(
                            value: cat['id'],
                            child: Text(cat['name'] ?? 'Danh mục'),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  BrutalCurrencyInput(
                    label: 'Số tiền giới hạn tối đa',
                    hint: '5.000.000',
                    controller: limitAmountController,
                  ),
                  const SizedBox(height: 12),
                  BrutalInput(
                    label: 'Cảnh báo khi đạt % chi tiêu',
                    hint: '80',
                    controller: alertController,
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 24),
                  BrutalButton(
                    text: 'TẠO HẠN MỨC',
                    color: BrutalColors.green,
                    onTap: () async {
                      final limitAmt = limitAmountController.rawValue;
                      final alertPercentage = double.tryParse(alertController.text) ?? 80.0;

                      if (selectedCategoryId != null && limitAmt > 0) {
                        await _addLimit(selectedCategoryId!, limitAmt, alertPercentage);
                        if (mounted) Navigator.pop(context);
                      }
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showEditLimitDialog(dynamic limit) {
    final initialLimitAmt = (limit['limitAmount'] ?? limit['LimitAmount'] ?? 0.0).toDouble();
    final editAmountController = TextEditingController(
      text: initialLimitAmt.toInt().toString(),
    );
    final editAlertController = TextEditingController(text: (limit['alertAtPercentage'] ?? limit['AlertAtPercentage'] ?? 80.0).toString());

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Chỉnh sửa hạn mức chi tiêu ⚠️', style: BrutalStyles.titleStyle(size: 20)),
              const SizedBox(height: 16),
              BrutalCurrencyInput(
                label: 'Số tiền giới hạn tối đa',
                hint: '5.000.000',
                controller: editAmountController,
              ),
              const SizedBox(height: 12),
              BrutalInput(
                label: 'Cảnh báo khi đạt % chi tiêu',
                hint: '80',
                controller: editAlertController,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 24),
              BrutalButton(
                text: 'CẬP NHẬT',
                color: BrutalColors.green,
                onTap: () async {
                  final limitAmt = editAmountController.rawValue;
                  final alertPercentage = double.tryParse(editAlertController.text) ?? 80.0;

                  if (limitAmt > 0) {
                    await _updateLimit(limit['id'], limitAmt, alertPercentage);
                    if (mounted) Navigator.pop(context);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatCurrency(double amount) {
    return AppSettings().formatCurrency(amount);
  }

  Widget _buildWalletTabChip(String label, int index) {
    final isActive = _tabController.index == index;
    return GestureDetector(
      onTap: () {
        _tabController.animateTo(index);
        setState(() {});
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
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: BrutalStyles.bodyStyle(
            size: 13,
            color: isActive ? BrutalColors.cardBg : BrutalColors.ink,
            weight: FontWeight.w800,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeIndex = _tabController.index;

    return ListenableBuilder(
      listenable: AppSettings(),
      builder: (context, _) {
        return Scaffold(
          backgroundColor: BrutalColors.bg,
          appBar: AppBar(
            backgroundColor: BrutalColors.cardBg,
            elevation: 0,
            title: Text('Ví & Hũ Tài Chính 🎒', style: BrutalStyles.titleStyle(size: 22)),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(60),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  children: [
                    Expanded(child: _buildWalletTabChip('Tài khoản', 0)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildWalletTabChip('Hũ tài chính', 1)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildWalletTabChip('Hạn mức', 2)),
                  ],
                ),
              ),
            ),
            shape: Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
          ),
          body: _isLoading
              ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    // 1. Accounts Tab
                    _buildAccountsTab(),
                    // 2. Jars Tab
                    _buildJarsTab(),
                    // 3. Limits Tab
                    _buildLimitsTab(),
                  ],
                ),
          floatingActionButton: activeIndex == 1
              ? null // No FAB for preset 6-Jars allocations
              : FloatingActionButton(
                  heroTag: 'fab-wallet',
                  onPressed: activeIndex == 0 ? _showAddAccountDialog : _showAddLimitDialog,
                  backgroundColor: BrutalColors.green,
                  shape: RoundedRectangleBorder(
                    side: BorderSide(color: BrutalColors.ink, width: 2.5),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                  child: Icon(
                    activeIndex == 0 ? Icons.add_card : Icons.add_alert,
                    color: BrutalColors.ink,
                    size: 28,
                  ),
                ),
        );
      },
    );
  }

  Widget _buildAccountsTab() {
    if (_accounts.isEmpty) {
      return _buildEmptyState('Không tìm thấy tài khoản tài chính.');
    }
    return ListView.builder(
      itemCount: _accounts.length,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final acc = _accounts[index];
        final balance = (acc['balance'] ?? acc['currentBalance'] ?? 0.0).toDouble();
        final isNegative = balance < 0;

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: BrutalCard(
            color: isNegative ? BrutalColors.alertBg : BrutalColors.cardBg,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        acc['name'] ?? 'Tài khoản',
                        style: BrutalStyles.bodyStyle(size: 16, weight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        (acc['type'] ?? acc['accountType'] ?? '') == 'saving' ? 'Tài khoản tiết kiệm' : 'Tài khoản tiền mặt',
                        style: BrutalStyles.labelStyle(size: 12),
                      ),
                    ],
                  ),
                ),
                Row(
                  children: [
                    Text(
                      _formatCurrency(balance),
                      style: BrutalStyles.bodyStyle(
                        size: 16,
                        weight: FontWeight.w800,
                        color: isNegative ? BrutalColors.destructive : BrutalColors.successText,
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(Icons.edit_outlined, color: BrutalColors.ink, size: 20),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => _showEditAccountDialog(acc),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(Icons.delete_outline, color: BrutalColors.destructive, size: 20),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => _confirmDeleteAccount(acc['id'], acc['name'] ?? 'Tài khoản'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  int _estimateJarPercentage(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('thiết yếu') || lower.contains('necessity') || lower.contains('nec')) return 55;
    if (lower.contains('hưởng thụ') || lower.contains('play') || lower.contains('pl')) return 10;
    if (lower.contains('giáo dục') || lower.contains('education') || lower.contains('edu')) return 10;
    if (lower.contains('tiết kiệm') || lower.contains('saving') || lower.contains('ltss')) return 10;
    if (lower.contains('tự do tài chính') || lower.contains('freedom') || lower.contains('ffa')) return 10;
    if (lower.contains('từ thiện') || lower.contains('give') || lower.contains('charity')) return 5;
    return 15; // default fallback
  }

  Widget _buildJarsTab() {
    if (_jars.isEmpty) {
      return _buildEmptyState('Không tìm thấy hũ tài chính.');
    }
    return ListView.builder(
      itemCount: _jars.length,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final jar = _jars[index];
        final balance = (jar['balance'] ?? 0.0).toDouble();
        final percentage = jar['percentage'] ?? _estimateJarPercentage(jar['name'] ?? '');

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: BrutalCard(
            color: BrutalColors.cardBg,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        jar['name'] ?? 'Hũ tài chính',
                        style: BrutalStyles.bodyStyle(size: 15, weight: FontWeight.w800),
                      ),
                    ),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: BrutalColors.purple,
                            border: BrutalStyles.border,
                            borderRadius: BorderRadius.circular(9999),
                          ),
                          child: Text(
                            '$percentage%',
                            style: BrutalStyles.bodyStyle(size: 12, weight: FontWeight.w800),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: Icon(Icons.edit_outlined, color: BrutalColors.ink, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => _showEditJarDialog(jar),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Số dư: ${_formatCurrency(balance)}',
                  style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                // visual bar
                Container(
                  height: 12,
                  decoration: BoxDecoration(
                    color: BrutalColors.bg,
                    border: BrutalStyles.border,
                    borderRadius: BorderRadius.circular(9999),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: (percentage / 100).clamp(0.0, 1.0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: BrutalColors.green,
                        borderRadius: BorderRadius.circular(9999),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLimitsTab() {
    if (_limits.isEmpty) {
      return _buildEmptyState('Không tìm thấy hạn mức chi tiêu.');
    }
    return ListView.builder(
      itemCount: _limits.length,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final limit = _limits[index];
        final limitAmt = (limit['limitAmount'] ?? limit['LimitAmount'] ?? 0.0).toDouble();
        final spentAmt = (limit['currentSpent'] ?? limit['CurrentSpent'] ?? limit['spentAmount'] ?? 0.0).toDouble();
        final isExceeded = spentAmt > limitAmt;
        final pct = limitAmt > 0 ? (spentAmt / limitAmt).clamp(0.0, 1.0) : 0.0;

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: BrutalCard(
            color: isExceeded ? BrutalColors.alertBg : BrutalColors.cardBg,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        limit['targetName'] ?? limit['TargetName'] ?? limit['category'] ?? 'Khác',
                        style: BrutalStyles.bodyStyle(size: 15, weight: FontWeight.w800),
                      ),
                    ),
                    Row(
                      children: [
                        Text(
                          isExceeded ? 'Vượt hạn mức! ⚠️' : 'Trong hạn mức',
                          style: BrutalStyles.bodyStyle(
                            size: 12,
                            weight: FontWeight.w800,
                            color: isExceeded ? BrutalColors.destructive : BrutalColors.successText,
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: Icon(Icons.edit_outlined, color: BrutalColors.ink, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => _showEditLimitDialog(limit),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: Icon(Icons.delete_outline, color: BrutalColors.destructive, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () => _confirmDeleteLimit(limit['id'], limit['targetName'] ?? limit['TargetName'] ?? limit['category'] ?? 'Khác'),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Đã dùng: ${_formatCurrency(spentAmt)}',
                      style: BrutalStyles.bodyStyle(size: 13),
                    ),
                    Text(
                      'Hạn mức: ${_formatCurrency(limitAmt)}',
                      style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.grey),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  height: 12,
                  decoration: BoxDecoration(
                    color: BrutalColors.bg,
                    border: BrutalStyles.border,
                    borderRadius: BorderRadius.circular(9999),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: pct,
                    child: Container(
                      decoration: BoxDecoration(
                        color: isExceeded ? BrutalColors.destructive : BrutalColors.purple,
                        borderRadius: BorderRadius.circular(9999),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: BrutalCard(
          color: BrutalColors.cardBg,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('📂', style: TextStyle(fontSize: 48), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: BrutalStyles.bodyStyle(size: 15, color: BrutalColors.grey, weight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
