import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:intl/intl.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/core/theme/thousands_formatter.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({Key? key}) : super(key: key);

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  final _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _goals = [];

  final _titleController = TextEditingController();
  final _targetController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchGoals();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _targetController.dispose();
    super.dispose();
  }

  Future<void> _fetchGoals() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiClient.get('goals');
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> parsedGoals = [];
        if (data is Map) {
          parsedGoals = data['data'] ?? data['Data'] ?? [];
        } else if (data is List) {
          parsedGoals = data;
        }
        setState(() {
          _goals = parsedGoals;
        });
      }
    } catch (e) {
      setState(() {
        _goals = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _addGoal() async {
    final title = _titleController.text.trim();
    final target = double.tryParse(_targetController.text.replaceAll('.', '')) ?? 0.0;

    if (title.isEmpty || target <= 0) return;

    try {
      final response = await _apiClient.post('goals', data: {
        'title': title,
        'targetAmount': target,
        'dueDate': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
        'note': 'Tạo từ ứng dụng di động',
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        _titleController.clear();
        _targetController.clear();
        Navigator.pop(context);
        _fetchGoals();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể thêm mục tiêu. Hãy thử lại.')),
      );
      _titleController.clear();
      _targetController.clear();
      Navigator.pop(context);
    }
  }

  void _confirmDelete(String id, String goalTitle) {
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
            'Xác nhận xóa ⚠️',
            style: BrutalStyles.titleStyle(size: 18),
          ),
          content: Text(
            'Bạn có chắc chắn muốn xóa mục tiêu tích lũy "$goalTitle" không? Thao tác này không thể hoàn tác.',
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
                _deleteGoal(id);
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteGoal(String id) async {
    try {
      await _apiClient.delete('goals/$id');
      _fetchGoals();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xóa mục tiêu tích lũy thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể xóa mục tiêu này.')),
        );
      }
    }
  }

  void _showEditGoalDialog(dynamic goal) {
    final editTitleController = TextEditingController(text: goal['title']);
    final initialTargetAmt = (goal['targetAmount'] ?? 0.0).toDouble();
    final editTargetController = TextEditingController(
      text: NumberFormat.decimalPattern('vi_VN').format(initialTargetAmt),
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
              Text('Chỉnh sửa mục tiêu 🎯', style: BrutalStyles.titleStyle(size: 20)),
              const SizedBox(height: 16),
              BrutalInput(
                label: 'Tên mục tiêu',
                hint: 'Ví dụ: Mua xe máy, Quỹ tiết kiệm...',
                controller: editTitleController,
              ),
              const SizedBox(height: 16),
              BrutalInput(
                label: 'Số tiền cần đạt được',
                hint: '10.000.000',
                controller: editTargetController,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandsSeparatorInputFormatter()],
              ),
              const SizedBox(height: 24),
              BrutalButton(
                text: 'CẬP NHẬT',
                color: BrutalColors.green,
                onTap: () async {
                  final title = editTitleController.text.trim();
                  final target = double.tryParse(editTargetController.text.replaceAll('.', '')) ?? 0.0;

                  if (title.isNotEmpty && target > 0) {
                    try {
                      await _apiClient.patch('goals/${goal['id']}', data: {
                        'title': title,
                        'targetAmount': target,
                      });
                      _fetchGoals();
                      if (mounted) Navigator.pop(context);
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Không thể cập nhật mục tiêu.')),
                      );
                    }
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAddGoalDialog() {
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
              Text('Đặt mục tiêu tích lũy mới 🎯', style: BrutalStyles.titleStyle(size: 20)),
              const SizedBox(height: 16),
              BrutalInput(
                label: 'Tên mục tiêu',
                hint: 'Ví dụ: Mua xe máy, Quỹ tiết kiệm...',
                controller: _titleController,
              ),
              const SizedBox(height: 16),
              BrutalInput(
                label: 'Số tiền cần đạt được',
                hint: '10.000.000',
                controller: _targetController,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandsSeparatorInputFormatter()],
              ),
              const SizedBox(height: 24),
              BrutalButton(
                text: 'TẠO MỤC TIÊU',
                color: BrutalColors.green,
                onTap: _addGoal,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrutalColors.bg,
      appBar: AppBar(
        backgroundColor: BrutalColors.cardBg,
        elevation: 0,
        title: Text('Mục Tiêu Tích Lũy 🎯', style: BrutalStyles.titleStyle(size: 20)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: BrutalColors.ink),
          onPressed: () => Navigator.pop(context),
        ),
        shape: Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
          : _goals.isEmpty
              ? Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: BrutalCard(
                      color: BrutalColors.cardBg,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('🎯', style: TextStyle(fontSize: 48), textAlign: TextAlign.center),
                          const SizedBox(height: 16),
                          Text(
                            'Không tìm thấy mục tiêu tích lũy. Vui lòng tạo mục tiêu mới.',
                            textAlign: TextAlign.center,
                            style: BrutalStyles.bodyStyle(size: 15, color: BrutalColors.grey, weight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              : ListView.builder(
                  itemCount: _goals.length,
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (context, index) {
                    final goal = _goals[index];
                    final target = (goal['targetAmount'] ?? goal['TargetAmount'] ?? 0.0).toDouble();
                    final current = (goal['savedAmount'] ?? goal['SavedAmount'] ?? goal['currentAmount'] ?? 0.0).toDouble();
                    final progress = (current / target).clamp(0.0, 1.0);
                    final percentage = (progress * 100).toInt();

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: BrutalCard(
                        color: BrutalColors.cardBg,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    goal['title'] ?? 'Mục tiêu',
                                    style: BrutalStyles.titleStyle(size: 16),
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
                                      onPressed: () => _showEditGoalDialog(goal),
                                    ),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      icon: Icon(Icons.delete_outline, color: BrutalColors.destructive, size: 20),
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      onPressed: () => _confirmDelete(goal['id'], goal['title'] ?? 'Mục tiêu'),
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
                                  'Đã tích lũy: ${_formatCurrency(current)}',
                                  style: BrutalStyles.bodyStyle(size: 13),
                                ),
                                Text(
                                  'Mục tiêu: ${_formatCurrency(target)}',
                                  style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.grey),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            // progress indicator bar
                            Container(
                              height: 14,
                              decoration: BoxDecoration(
                                color: BrutalColors.bg,
                                border: BrutalStyles.border,
                                borderRadius: BorderRadius.circular(9999),
                              ),
                              child: FractionallySizedBox(
                                alignment: Alignment.centerLeft,
                                widthFactor: progress,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: percentage == 100 ? BrutalColors.green : BrutalColors.purple,
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
                ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'goals_fab',
        onPressed: _showAddGoalDialog,
        backgroundColor: BrutalColors.green,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: BrutalColors.ink, width: 2.5),
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 0,
        child: Icon(Icons.add, color: BrutalColors.ink, size: 28),
      ),
    );
  }
}
