import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => DashboardScreenState();
}

class DashboardScreenState extends State<DashboardScreen> {
  final _apiClient = ApiClient();
  bool _isLoading = true;

  double _totalBalance = 0.0;
  double _monthlyIncome = 0.0;
  double _monthlyExpenses = 0.0;
  List<dynamic> _recentTransactions = [];

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
    AppSettings().dashboardRefreshNotifier.addListener(_fetchDashboardData);
  }

  @override
  void dispose() {
    AppSettings().dashboardRefreshNotifier.removeListener(_fetchDashboardData);
    super.dispose();
  }

  /// Called by AppShell via GlobalKey when user switches back to Dashboard tab.
  /// Ensures balance and transactions reflect any changes made in other tabs.
  void refresh() {
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiClient.get('dashboard');
      if (!mounted) return;
      if (response.statusCode == 200) {
        final data = response.data;
        setState(() {
          final summary = data['balanceSummary'];
          _totalBalance = (summary?['totalBalance'] ?? 0.0).toDouble();
          _monthlyIncome = (summary?['totalIncome'] ?? 0.0).toDouble();
          _monthlyExpenses = (summary?['totalExpense'] ?? 0.0).toDouble();
          _recentTransactions = data['recentTransactions'] ?? [];
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _totalBalance = 0.0;
        _monthlyIncome = 0.0;
        _monthlyExpenses = 0.0;
        _recentTransactions = [];
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _formatCurrency(double amount) {
    return AppSettings().formatCurrency(amount);
  }

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
            title: Text('💸 Finjar', style: BrutalStyles.titleStyle(size: 24)),
            actions: [
              IconButton(
                icon: Icon(Icons.notifications_active_outlined,
                    color: BrutalColors.ink),
                onPressed: () => context.push('/notifications'),
              ),
              const SizedBox(width: 8),
            ],
            shape: Border(
              bottom: BorderSide(color: BrutalColors.ink, width: 3),
            ),
          ),
          body: RefreshIndicator(
            onRefresh: _fetchDashboardData,
            color: BrutalColors.ink,
            child: _isLoading
                ? Center(
                    child: CircularProgressIndicator(color: BrutalColors.ink))
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Balance card
                        BrutalCard(
                          color: BrutalColors.purple,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Tổng số dư khả dụng',
                                style: BrutalStyles.bodyStyle(
                                    size: 14,
                                    color: BrutalColors.ink,
                                    weight: FontWeight.w700),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _formatCurrency(_totalBalance),
                                style: BrutalStyles.titleStyle(size: 32),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(Icons.arrow_upward,
                                                color: Colors.green, size: 16),
                                            const SizedBox(width: 4),
                                            Text('Thu nhập',
                                                style: BrutalStyles.labelStyle(
                                                    size: 12,
                                                    color: BrutalColors.ink)),
                                          ],
                                        ),
                                        Text(
                                          _formatCurrency(_monthlyIncome),
                                          style: BrutalStyles.bodyStyle(
                                              size: 14,
                                              weight: FontWeight.w800),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Icon(Icons.arrow_downward,
                                                color: BrutalColors.destructive,
                                                size: 16),
                                            const SizedBox(width: 4),
                                            Text('Chi tiêu',
                                                style: BrutalStyles.labelStyle(
                                                    size: 12,
                                                    color: BrutalColors.ink)),
                                          ],
                                        ),
                                        Text(
                                          _formatCurrency(_monthlyExpenses),
                                          style: BrutalStyles.bodyStyle(
                                              size: 14,
                                              weight: FontWeight.w800),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              )
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Quick Navigation Grid
                        Text('Lối tắt nhanh',
                            style: BrutalStyles.titleStyle(size: 18)),
                        const SizedBox(height: 12),
                        GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: 4,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          children: [
                            _buildQuickAction(
                                'Danh mục',
                                Icons.category_outlined,
                                BrutalColors.green, () {
                              context.push('/categories');
                            }),
                            _buildQuickAction('Mục tiêu', Icons.track_changes,
                                BrutalColors.cardBg, () {
                              context.push('/goals');
                            }),
                            _buildQuickAction(
                                'Nhắc nhở', Icons.alarm, BrutalColors.purple,
                                () {
                              context.push('/reminders');
                            }),
                            _buildQuickAction(
                                'Tài chính',
                                Icons.account_balance_outlined,
                                Colors.amber[200]!, () {
                              context.go('/wallet');
                            }),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Mini graph showing budgeting summary
                        BrutalCard(
                          color: BrutalColors.cardBg,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Tỷ lệ chi tiêu',
                                  style: BrutalStyles.titleStyle(size: 16)),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    flex: _monthlyExpenses == 0 &&
                                            _monthlyIncome == 0
                                        ? 5
                                        : (_monthlyExpenses /
                                                (_monthlyIncome + 0.1) *
                                                100)
                                            .clamp(0, 100)
                                            .toInt(),
                                    child: Container(
                                      height: 24,
                                      decoration: BoxDecoration(
                                        color: BrutalColors.destructive,
                                        border: Border(
                                          top: BorderSide(
                                              color: BrutalColors.ink,
                                              width: 2),
                                          bottom: BorderSide(
                                              color: BrutalColors.ink,
                                              width: 2),
                                          left: BorderSide(
                                              color: BrutalColors.ink,
                                              width: 2),
                                        ),
                                      ),
                                      child: const Center(
                                        child: Text('Đã chi',
                                            style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 10)),
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    flex: _monthlyExpenses == 0 &&
                                            _monthlyIncome == 0
                                        ? 5
                                        : (100 -
                                                (_monthlyExpenses /
                                                        (_monthlyIncome + 0.1) *
                                                        100)
                                                    .clamp(0, 100))
                                            .toInt(),
                                    child: Container(
                                      height: 24,
                                      decoration: BoxDecoration(
                                        color: BrutalColors.green,
                                        border: Border(
                                          top: BorderSide(
                                              color: BrutalColors.ink,
                                              width: 2),
                                          bottom: BorderSide(
                                              color: BrutalColors.ink,
                                              width: 2),
                                          right: BorderSide(
                                              color: BrutalColors.ink,
                                              width: 2),
                                          left: BorderSide(
                                              color: BrutalColors.ink,
                                              width: 2),
                                        ),
                                      ),
                                      child: Center(
                                        child: Text('Còn lại',
                                            style: TextStyle(
                                                color: BrutalColors.ink,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 10)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _monthlyExpenses > _monthlyIncome
                                    ? 'Cảnh báo! Bạn đã chi vượt tổng thu nhập trong tháng.'
                                    : 'Tuyệt vời! Chi tiêu của bạn hiện đang dưới mức ngân sách.',
                                style: BrutalStyles.labelStyle(
                                    size: 12, color: BrutalColors.grey),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Recent Transactions List
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Giao dịch gần đây',
                                style: BrutalStyles.titleStyle(size: 18)),
                            TextButton(
                              onPressed: () => context.go('/transactions'),
                              child: Text('Xem thêm',
                                  style: BrutalStyles.bodyStyle(
                                      size: 14, color: BrutalColors.purple)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _recentTransactions.isEmpty
                            ? BrutalCard(
                                color: BrutalColors.cardBg,
                                child: Text(
                                  'Chưa có giao dịch nào gần đây.',
                                  textAlign: TextAlign.center,
                                  style: BrutalStyles.bodyStyle(
                                      size: 14, color: BrutalColors.grey),
                                ),
                              )
                            : ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _recentTransactions.length,
                                itemBuilder: (context, index) {
                                  final tx = _recentTransactions[index];
                                  final isIncome = _isIncomeTransaction(tx);
                                  final amount = _transactionAmount(tx);

                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 10),
                                    child: BrutalCard(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 12),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            backgroundColor: isIncome
                                                ? BrutalColors.green
                                                : BrutalColors.purple,
                                            radius: 18,
                                            child: Icon(
                                              isIncome
                                                  ? Icons.arrow_upward
                                                  : Icons.arrow_downward,
                                              color: BrutalColors.ink,
                                              size: 18,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  _transactionTitle(tx),
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: BrutalStyles.bodyStyle(
                                                      size: 14,
                                                      weight: FontWeight.w800),
                                                ),
                                                Text(
                                                  _transactionCategoryName(tx),
                                                  style:
                                                      BrutalStyles.labelStyle(
                                                          size: 12),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Text(
                                            '${isIncome ? "+" : "-"}${_formatCurrency(amount)}',
                                            style: BrutalStyles.bodyStyle(
                                              size: 14,
                                              weight: FontWeight.w800,
                                              color: isIncome
                                                  ? BrutalColors.successText
                                                  : BrutalColors.destructive,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ],
                    ),
                  ),
          ),
        );
      },
    );
  }

  Widget _buildQuickAction(
      String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BrutalStyles.cardDecoration(color: color, radius: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: BrutalColors.ink, size: 24),
            const SizedBox(height: 6),
            Text(
              title,
              textAlign: TextAlign.center,
              style: BrutalStyles.bodyStyle(size: 11, weight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}
