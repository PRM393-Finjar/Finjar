import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:intl/intl.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/core/theme/currency_input.dart';

class RemindersScreen extends StatefulWidget {
  const RemindersScreen({Key? key}) : super(key: key);

  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> {
  final _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _reminders = [];

  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  DateTime? _selectedDate;
  String _selectedFrequency = 'Monthly'; // 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'

  @override
  void initState() {
    super.initState();
    _fetchReminders();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _fetchReminders() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiClient.get('reminders');
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> parsedReminders = [];
        if (data is Map) {
          parsedReminders = data['data'] ?? data['Data'] ?? [];
        } else if (data is List) {
          parsedReminders = data;
        }
        setState(() {
          _reminders = parsedReminders;
        });
      }
    } catch (e) {
      setState(() {
        _reminders = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _addReminder() async {
    final title = _titleController.text.trim();
    final amount = _amountController.rawValue;
    final date = _selectedDate ?? DateTime.now().add(const Duration(days: 7));

    if (title.isEmpty) return;

    try {
      final response = await _apiClient.post('reminders', data: {
        'title': title,
        'amount': amount,
        'frequency': _selectedFrequency,
        'startDate': date.toIso8601String(),
        'note': 'Tạo từ ứng dụng di động',
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        _titleController.clear();
        _amountController.clear();
        _selectedDate = null;
        _selectedFrequency = 'Monthly';
        Navigator.pop(context);
        _fetchReminders();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể thêm nhắc nhở. Hãy thử lại.')),
      );
      _titleController.clear();
      _amountController.clear();
      _selectedDate = null;
      Navigator.pop(context);
    }
  }

  void _confirmDelete(String id, String reminderTitle) {
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
            'Bạn có chắc chắn muốn xóa nhắc nhở "$reminderTitle" không? Thao tác này không thể hoàn tác.',
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
                _deleteReminder(id);
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteReminder(String id) async {
    try {
      await _apiClient.delete('reminders/$id');
      _fetchReminders();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xóa nhắc nhở hóa đơn thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể xóa nhắc nhở này.')),
        );
      }
    }
  }

  Future<void> _togglePaid(String id, bool currentStatus) async {
    try {
      await _apiClient.patch('reminders/$id', data: {
        'status': !currentStatus ? 'Paid' : 'Unpaid',
      });
      _fetchReminders();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể cập nhật trạng thái nhắc nhở.')),
      );
    }
  }

  void _showEditReminderDialog(dynamic rem) {
    final editTitleController = TextEditingController(text: rem['title']);
    final initialAmount = (rem['amount'] ?? 0.0).toDouble();
    final editAmountController = TextEditingController(
      text: initialAmount.toInt().toString(),
    );
    // Normalize to match dropdown items casing
    String editFrequency = 'Monthly';
    final rawFreq = rem['frequency']?.toString() ?? '';
    if (rawFreq.toLowerCase() == 'daily') editFrequency = 'Daily';
    if (rawFreq.toLowerCase() == 'weekly') editFrequency = 'Weekly';
    if (rawFreq.toLowerCase() == 'monthly') editFrequency = 'Monthly';
    if (rawFreq.toLowerCase() == 'quarterly') editFrequency = 'Quarterly';
    if (rawFreq.toLowerCase() == 'yearly') editFrequency = 'Yearly';

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
                  Text('Chỉnh sửa nhắc nhở ⏰', style: BrutalStyles.titleStyle(size: 20)),
                  const SizedBox(height: 16),
                  BrutalInput(
                    label: 'Tên khoản phí nhắc nhở',
                    hint: 'Ví dụ: Hóa đơn điện nước...',
                    controller: editTitleController,
                  ),
                  const SizedBox(height: 12),
                  BrutalCurrencyInput(
                    label: 'Số tiền ước lượng',
                    hint: '500.000',
                    controller: editAmountController,
                  ),
                  const SizedBox(height: 16),
                  Text('Chu kỳ', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
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
                        value: editFrequency,
                        isExpanded: true,
                        style: BrutalStyles.bodyStyle(size: 14),
                        onChanged: (val) {
                          if (val != null) {
                            setModalState(() {
                              editFrequency = val;
                            });
                          }
                        },
                        items: const [
                          DropdownMenuItem(value: 'Daily', child: Text('Hàng ngày')),
                          DropdownMenuItem(value: 'Weekly', child: Text('Hàng tuần')),
                          DropdownMenuItem(value: 'Monthly', child: Text('Hàng tháng')),
                          DropdownMenuItem(value: 'Quarterly', child: Text('Hàng quý')),
                          DropdownMenuItem(value: 'Yearly', child: Text('Hàng năm')),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  BrutalButton(
                    text: 'CẬP NHẬT',
                    color: BrutalColors.green,
                    onTap: () async {
                      final title = editTitleController.text.trim();
                      final amount = editAmountController.rawValue;

                      if (title.isNotEmpty && amount > 0) {
                        try {
                          await _apiClient.patch('reminders/${rem['id']}', data: {
                            'title': title,
                            'amount': amount,
                            'frequency': editFrequency,
                          });
                          _fetchReminders();
                          if (mounted) Navigator.pop(context);
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Không thể cập nhật nhắc nhở.')),
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
      },
    );
  }

  void _showAddReminderDialog() {
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
                  Text('Thêm nhắc nhở chi trả ⏰', style: BrutalStyles.titleStyle(size: 20)),
                  const SizedBox(height: 16),
                  BrutalInput(
                    label: 'Tên khoản phí nhắc nhở',
                    hint: 'Ví dụ: Hóa đơn điện nước...',
                    controller: _titleController,
                  ),
                  const SizedBox(height: 12),
                  BrutalCurrencyInput(
                    label: 'Số tiền ước lượng',
                    hint: '500.000',
                    controller: _amountController,
                  ),
                  const SizedBox(height: 12),
                  Text('Chu kỳ', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
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
                        value: _selectedFrequency,
                        isExpanded: true,
                        style: BrutalStyles.bodyStyle(size: 14),
                        onChanged: (val) {
                          if (val != null) {
                            setModalState(() {
                              _selectedFrequency = val;
                            });
                          }
                        },
                        items: const [
                          DropdownMenuItem(value: 'Daily', child: Text('Hàng ngày')),
                          DropdownMenuItem(value: 'Weekly', child: Text('Hàng tuần')),
                          DropdownMenuItem(value: 'Monthly', child: Text('Hàng tháng')),
                          DropdownMenuItem(value: 'Quarterly', child: Text('Hàng quý')),
                          DropdownMenuItem(value: 'Yearly', child: Text('Hàng năm')),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('Ngày bắt đầu / Ngày đến hạn', style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        setModalState(() {
                          _selectedDate = picked;
                        });
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: BrutalColors.cardBg,
                        border: BrutalStyles.border,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [BrutalStyles.shadowSm],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _selectedDate == null 
                              ? 'Chọn ngày đến hạn' 
                              : DateFormat('dd/MM/yyyy').format(_selectedDate!),
                            style: BrutalStyles.bodyStyle(size: 14),
                          ),
                          Icon(Icons.calendar_today_outlined, color: BrutalColors.ink, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  BrutalButton(
                    text: 'TẠO NHẮC NHỞ',
                    color: BrutalColors.green,
                    onTap: _addReminder,
                  ),
                ],
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
    return Scaffold(
      backgroundColor: BrutalColors.bg,
      appBar: AppBar(
        backgroundColor: BrutalColors.cardBg,
        elevation: 0,
        title: Text('Nhắc Nhở Hóa Đơn ⏰', style: BrutalStyles.titleStyle(size: 20)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: BrutalColors.ink),
          onPressed: () => Navigator.pop(context),
        ),
        shape: Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
          : _reminders.isEmpty
              ? Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: BrutalCard(
                      color: BrutalColors.cardBg,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('⏰', style: TextStyle(fontSize: 48), textAlign: TextAlign.center),
                          const SizedBox(height: 16),
                          Text(
                            'Không tìm thấy nhắc nhở chi trả. Vui lòng tạo nhắc nhở mới.',
                            textAlign: TextAlign.center,
                            style: BrutalStyles.bodyStyle(size: 15, color: BrutalColors.grey, weight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              : ListView.builder(
                  itemCount: _reminders.length,
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (context, index) {
                    final rem = _reminders[index];
                    final amount = (rem['amount'] ?? 0.0).toDouble();
                    final isPaid = rem['status'] == 'Paid' || (rem['isPaid'] ?? false);
                    final startDateStr = rem['nextDueDate'] ?? rem['NextDueDate'] ?? rem['startDate'] ?? rem['dueDate'] ?? '';
                    final dueDate = DateTime.tryParse(startDateStr) ?? DateTime.now();

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: BrutalCard(
                        color: isPaid ? BrutalColors.successBg : BrutalColors.cardBg,
                        child: Row(
                          children: [
                            Checkbox(
                              value: isPaid,
                              activeColor: BrutalColors.ink,
                              onChanged: (val) => _togglePaid(rem['id'], isPaid),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    rem['title'] ?? 'Nhắc nhở',
                                    style: BrutalStyles.bodyStyle(
                                      size: 15,
                                      weight: FontWeight.w800,
                                      color: isPaid ? Colors.black54 : BrutalColors.ink,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Hạn: ${DateFormat('dd/MM/yyyy').format(dueDate)} (${rem['frequency']?.toString().toLowerCase() == 'weekly' ? 'Hàng tuần' : rem['frequency']?.toString().toLowerCase() == 'daily' ? 'Hàng ngày' : rem['frequency']?.toString().toLowerCase() == 'quarterly' ? 'Hàng quý' : rem['frequency']?.toString().toLowerCase() == 'yearly' ? 'Hàng năm' : 'Hàng tháng'})',
                                    style: BrutalStyles.labelStyle(size: 12),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              _formatCurrency(amount),
                              style: BrutalStyles.bodyStyle(
                                size: 15,
                                weight: FontWeight.w800,
                                color: isPaid ? Colors.black54 : BrutalColors.destructive,
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: Icon(Icons.edit_outlined, color: BrutalColors.ink, size: 20),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () => _showEditReminderDialog(rem),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: Icon(Icons.delete_outline, color: BrutalColors.destructive, size: 20),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () => _confirmDelete(rem['id'], rem['title'] ?? 'Nhắc nhở'),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fab-reminders',
        onPressed: _showAddReminderDialog,
        backgroundColor: BrutalColors.green,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: BrutalColors.ink, width: 2.5),
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 0,
        child: Icon(Icons.alarm_add, color: BrutalColors.ink, size: 28),
      ),
    );
  }
}
