import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => DashboardScreenState();
}

class DashboardScreenState extends State<DashboardScreen> {
  final _apiClient = ApiClient();
  bool _isLoading = true;

  double _totalBalance = 0.0;
  double _allocatedBalance = 0.0;
  double _unallocatedBalance = 0.0;
  double _monthlyIncome = 0.0;
  double _monthlyExpenses = 0.0;
  double _netChange = 0.0;

  List<dynamic> _financialAccounts = [];
  List<dynamic> _jarSummary = [];
  List<dynamic> _categoryBreakdown = [];
  List<dynamic> _recentTransactions = [];
  List<dynamic> _goalProgress = [];

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

  void refresh() {
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final response = await _apiClient.get('dashboard');
      if (!mounted) return;
      if (response.statusCode == 200) {
        final root = _unwrapPayload(response.data);
        final summary = _asMap(_value(root, 'balanceSummary'));
        setState(() {
          _totalBalance = _asDouble(_value(summary, 'totalBalance'));
          _allocatedBalance = _asDouble(_value(summary, 'allocatedBalance'));
          _unallocatedBalance =
              _asDouble(_value(summary, 'unallocatedBalance'));
          _monthlyIncome = _asDouble(_value(summary, 'totalIncome'));
          _monthlyExpenses = _asDouble(_value(summary, 'totalExpense'));
          _netChange = _asDouble(_value(summary, 'netChange'));
          _financialAccounts = _asList(_value(root, 'financialAccounts'));
          _jarSummary = _asList(_value(root, 'jarSummary'));
          _categoryBreakdown = _asList(_value(root, 'categoryBreakdown'));
          _recentTransactions = _asList(_value(root, 'recentTransactions'));
          _goalProgress = _asList(_value(root, 'goalProgress'));
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _totalBalance = 0.0;
        _allocatedBalance = 0.0;
        _unallocatedBalance = 0.0;
        _monthlyIncome = 0.0;
        _monthlyExpenses = 0.0;
        _netChange = 0.0;
        _financialAccounts = [];
        _jarSummary = [];
        _categoryBreakdown = [];
        _recentTransactions = [];
        _goalProgress = [];
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Map<String, dynamic> _unwrapPayload(dynamic value) {
    final root = _asMap(value);
    if (_value(root, 'balanceSummary') != null) return root;
    return _asMap(root['data'] ?? root['Data']);
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return {};
  }

  List<dynamic> _asList(dynamic value) => value is List ? value : [];

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  dynamic _value(dynamic source, String key) {
    if (source is Map) return source[key] ?? source[_pascal(key)];
    return null;
  }

  String _pascal(String key) {
    if (key.isEmpty) return key;
    return key[0].toUpperCase() + key.substring(1);
  }

  String _formatCurrency(double amount) => AppSettings().formatCurrency(amount);

  String _transactionType(dynamic tx) {
    return (_value(tx, 'type') ?? '').toString().toLowerCase();
  }

  bool _isIncomeTransaction(dynamic tx) => _transactionType(tx) == 'income';

  bool _isTransferTransaction(dynamic tx) => _transactionType(tx) == 'transfer';

  double _transactionAmount(dynamic tx) {
    final value = _value(tx, 'transactionsAmount') ?? _value(tx, 'amount') ?? 0;
    return _asDouble(value).abs();
  }

  String _transactionTitle(dynamic tx) {
    final note = _value(tx, 'note');
    if (note != null && note.toString().trim().isNotEmpty) {
      return note.toString();
    }
    return _transactionCategoryName(tx);
  }

  String _transactionCategoryName(dynamic tx) {
    final category = _value(tx, 'category');
    if (category is Map) {
      return (category['name'] ?? category['Name'] ?? 'Giao dịch').toString();
    }
    return (_value(tx, 'categoryName') ?? category ?? 'Giao dịch').toString();
  }

  DateTime _transactionDate(dynamic tx) {
    final raw = _value(tx, 'date') ??
        _value(tx, 'transactionDate') ??
        DateTime.now().toIso8601String();
    return DateTime.tryParse(raw.toString()) ?? DateTime.now();
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
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
            title: Text('Finjar', style: BrutalStyles.titleStyle(size: 24)),
            actions: [
              IconButton(
                icon: Icon(
                  Icons.notifications_active_outlined,
                  color: BrutalColors.ink,
                ),
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
                    child: CircularProgressIndicator(color: BrutalColors.ink),
                  )
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildBalanceCard(),
                        const SizedBox(height: 18),
                        _buildQuickActions(context),
                        const SizedBox(height: 18),
                        _buildMetricGrid(),
                        const SizedBox(height: 18),
                        _buildAccountsSection(),
                        const SizedBox(height: 18),
                        _buildJarSection(),
                        const SizedBox(height: 18),
                        _buildCategorySection(),
                        const SizedBox(height: 18),
                        _buildGoalSection(),
                        const SizedBox(height: 18),
                        _buildRecentTransactions(context),
                      ],
                    ),
                  ),
          ),
        );
      },
    );
  }

  Widget _buildBalanceCard() {
    return BrutalCard(
      color: BrutalColors.purple,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tổng số dư khả dụng',
            style: BrutalStyles.bodyStyle(
              size: 14,
              color: BrutalColors.ink,
              weight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(_formatCurrency(_totalBalance),
              style: BrutalStyles.titleStyle(size: 32)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _miniBalance(
                  'Đã phân bổ',
                  _allocatedBalance,
                  Icons.pie_chart_outline,
                ),
              ),
              Expanded(
                child: _miniBalance(
                  'Chưa phân bổ',
                  _unallocatedBalance,
                  Icons.savings_outlined,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _miniBalance(String label, double value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: BrutalColors.ink, size: 17),
        const SizedBox(width: 5),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: BrutalStyles.labelStyle(size: 11)),
              Text(
                _formatCurrency(value),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style:
                    BrutalStyles.bodyStyle(size: 13, weight: FontWeight.w800),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Lối tắt nhanh', style: BrutalStyles.titleStyle(size: 18)),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          children: [
            _buildQuickAction('Danh mục', Icons.category_outlined,
                BrutalColors.green, () => context.push('/categories')),
            _buildQuickAction('Mục tiêu', Icons.track_changes,
                BrutalColors.cardBg, () => context.push('/goals')),
            _buildQuickAction('Nhắc nhở', Icons.alarm, BrutalColors.purple,
                () => context.push('/reminders')),
            _buildQuickAction('Tài chính', Icons.account_balance_outlined,
                Colors.amber[200]!, () => context.go('/wallet')),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.55,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: [
        _metricCard(
            'Thu nhập', _monthlyIncome, Icons.arrow_upward, BrutalColors.green),
        _metricCard('Chi tiêu', _monthlyExpenses, Icons.arrow_downward,
            BrutalColors.destructive),
        _metricCard('Dòng tiền', _netChange, Icons.swap_vert,
            _netChange >= 0 ? BrutalColors.green : BrutalColors.destructive),
        _metricCard('Tài khoản', _financialAccounts.length.toDouble(),
            Icons.account_balance_wallet_outlined, BrutalColors.cardBg,
            isCount: true),
      ],
    );
  }

  Widget _metricCard(
    String label,
    double value,
    IconData icon,
    Color color, {
    bool isCount = false,
  }) {
    return BrutalCard(
      color: color,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: BrutalColors.ink, size: 20),
          Text(label, style: BrutalStyles.labelStyle(size: 12)),
          Text(
            isCount ? value.toInt().toString() : _formatCurrency(value),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: BrutalStyles.bodyStyle(size: 15, weight: FontWeight.w900),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountsSection() {
    return _section(
      title: 'Nguồn tiền',
      emptyText: 'Chưa có tài khoản tài chính.',
      items: _financialAccounts.take(3).map((account) {
        final name = (_value(account, 'name') ?? 'Tài khoản').toString();
        final balance = _asDouble(_value(account, 'currentBalance'));
        final isDefault = _value(account, 'isDefault') == true;
        return _simpleRow(
          icon: isDefault ? Icons.star : Icons.account_balance_wallet_outlined,
          title: name,
          subtitle: isDefault ? 'Mặc định' : 'Nguồn tiền',
          trailing: _formatCurrency(balance),
        );
      }).toList(),
    );
  }

  Widget _buildJarSection() {
    return _section(
      title: 'Tình trạng hũ',
      emptyText: 'Chưa có hũ để theo dõi.',
      items: _jarSummary.take(4).map((jar) {
        final name = (_value(jar, 'jarName') ?? 'Hũ').toString();
        final balance = _asDouble(_value(jar, 'balance'));
        final spent = _asDouble(_value(jar, 'spent'));
        final percent = _asDouble(_value(jar, 'spentPercentage')).clamp(0, 100);
        return _progressRow(
          title: name,
          subtitle: 'Đã chi ${_formatCurrency(spent)}',
          trailing: _formatCurrency(balance),
          percent: percent / 100,
        );
      }).toList(),
    );
  }

  Widget _buildCategorySection() {
    return _section(
      title: 'Chi tiêu theo danh mục',
      emptyText: 'Chưa có dữ liệu danh mục.',
      items: _categoryBreakdown.take(4).map((category) {
        final name =
            (_value(category, 'categoryName') ?? 'Danh mục').toString();
        final total = _asDouble(_value(category, 'totalAmount'));
        final percent = _asDouble(_value(category, 'percentage')).clamp(0, 100);
        return _progressRow(
          title: name,
          subtitle: '${percent.toStringAsFixed(0)}%',
          trailing: _formatCurrency(total),
          percent: percent / 100,
        );
      }).toList(),
    );
  }

  Widget _buildGoalSection() {
    return _section(
      title: 'Tiến độ mục tiêu',
      emptyText: 'Chưa có mục tiêu tài chính.',
      items: _goalProgress.take(3).map((goal) {
        final title = (_value(goal, 'title') ?? 'Mục tiêu').toString();
        final percent =
            _asDouble(_value(goal, 'progressPercentage')).clamp(0, 100);
        final days = _asDouble(_value(goal, 'daysRemaining')).round();
        return _progressRow(
          title: title,
          subtitle: days >= 0 ? 'Còn $days ngày' : 'Quá hạn',
          trailing: '${percent.toStringAsFixed(0)}%',
          percent: percent / 100,
        );
      }).toList(),
    );
  }

  Widget _buildRecentTransactions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Giao dịch gần đây', style: BrutalStyles.titleStyle(size: 18)),
            TextButton(
              onPressed: () => context.go('/transactions'),
              child: Text(
                'Xem thêm',
                style: BrutalStyles.bodyStyle(
                  size: 14,
                  color: BrutalColors.purple,
                  weight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_recentTransactions.isEmpty)
          BrutalCard(
            color: BrutalColors.cardBg,
            child: Text(
              'Chưa có giao dịch nào gần đây.',
              textAlign: TextAlign.center,
              style: BrutalStyles.bodyStyle(size: 14, color: BrutalColors.grey),
            ),
          )
        else
          ..._recentTransactions.take(5).map(_transactionRow),
      ],
    );
  }

  Widget _transactionRow(dynamic tx) {
    final isIncome = _isIncomeTransaction(tx);
    final isTransfer = _isTransferTransaction(tx);
    final amount = _transactionAmount(tx);
    final prefix = isIncome
        ? '+'
        : isTransfer
            ? '↔ '
            : '-';
    final color = isIncome
        ? BrutalColors.successText
        : isTransfer
            ? BrutalColors.ink
            : BrutalColors.destructive;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: BrutalCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: isIncome
                  ? BrutalColors.green
                  : isTransfer
                      ? BrutalColors.cardBg
                      : BrutalColors.purple,
              radius: 18,
              child: Icon(
                isIncome
                    ? Icons.arrow_upward
                    : isTransfer
                        ? Icons.swap_horiz
                        : Icons.arrow_downward,
                color: BrutalColors.ink,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _transactionTitle(tx),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: BrutalStyles.bodyStyle(
                        size: 14, weight: FontWeight.w800),
                  ),
                  Text(
                    _formatDate(_transactionDate(tx)),
                    style: BrutalStyles.labelStyle(size: 12),
                  ),
                ],
              ),
            ),
            Text(
              '$prefix${_formatCurrency(amount)}',
              style: BrutalStyles.bodyStyle(
                size: 14,
                weight: FontWeight.w800,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section({
    required String title,
    required String emptyText,
    required List<Widget> items,
  }) {
    return BrutalCard(
      color: BrutalColors.cardBg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: BrutalStyles.titleStyle(size: 16)),
          const SizedBox(height: 12),
          if (items.isEmpty)
            Text(
              emptyText,
              style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.grey),
            )
          else
            ...items,
        ],
      ),
    );
  }

  Widget _simpleRow({
    required IconData icon,
    required String title,
    required String subtitle,
    required String trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: BrutalColors.ink, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: BrutalStyles.bodyStyle(
                        size: 14, weight: FontWeight.w800)),
                Text(subtitle, style: BrutalStyles.labelStyle(size: 11)),
              ],
            ),
          ),
          Text(trailing,
              style: BrutalStyles.bodyStyle(size: 13, weight: FontWeight.w800)),
        ],
      ),
    );
  }

  Widget _progressRow({
    required String title,
    required String subtitle,
    required String trailing,
    required double percent,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style:
                      BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w800),
                ),
              ),
              Text(trailing, style: BrutalStyles.labelStyle(size: 12)),
            ],
          ),
          const SizedBox(height: 4),
          Text(subtitle, style: BrutalStyles.labelStyle(size: 11)),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              minHeight: 10,
              value: percent.clamp(0, 1),
              backgroundColor: BrutalColors.bg,
              valueColor: AlwaysStoppedAnimation<Color>(BrutalColors.green),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
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
