import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/theme/currency_input.dart';

class GroupJarDetailScreen extends StatefulWidget {
  final String groupJarId;

  const GroupJarDetailScreen({Key? key, required this.groupJarId}) : super(key: key);

  @override
  State<GroupJarDetailScreen> createState() => _GroupJarDetailScreenState();
}

class _GroupJarDetailScreenState extends State<GroupJarDetailScreen> {
  final _apiClient = ApiClient();
  final _chatController = TextEditingController();
  final _scrollController = ScrollController();

  bool _isLoading = true;
  String? _currentUserId;
  Map<String, dynamic>? _groupJar;
  List<dynamic> _messages = [];
  List<dynamic> _financialAccounts = [];
  Timer? _pollingTimer;

  final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

  @override
  void initState() {
    super.initState();
    _loadGroupJarData();
    // Poll both jar details (current balance & progress) and chat messages every 3 seconds for real-time updates
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _fetchGroupJarDetails(silent: true);
      _fetchMessages(silent: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _chatController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadGroupJarData() async {
    setState(() => _isLoading = true);
    try {
      await Future.wait([
        _fetchCurrentUserId(),
        _fetchGroupJarDetails(silent: false),
        _fetchFinancialAccounts(),
        _fetchMessages(silent: false),
      ]);
    } catch (e) {
      // Ignore error
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchFinancialAccounts() async {
    try {
      final res = await _apiClient.get('financial-accounts');
      if (res.statusCode == 200) {
        final data = res.data;
        List<dynamic> parsed = [];
        if (data is Map) {
          parsed = data['data'] ?? data['Data'] ?? [];
        } else if (data is List) {
          parsed = data;
        }
        if (mounted) {
          setState(() {
            _financialAccounts = parsed;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchCurrentUserId() async {
    try {
      final res = await _apiClient.get('user/me');
      if (res.statusCode == 200 && res.data is Map) {
        final id = (res.data['id'] ?? res.data['Id'])?.toString();
        if (id != null && mounted) {
          setState(() {
            _currentUserId = id;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchGroupJarDetails({bool silent = false}) async {
    try {
      final res = await _apiClient.get('group-jars/${widget.groupJarId}');
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _groupJar = res.data is Map ? res.data : null;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchMessages({bool silent = false}) async {
    final res = await _apiClient.get('group-jars/${widget.groupJarId}/messages');
    if (res.statusCode == 200) {
      final List<dynamic> newMsgs = res.data is List ? res.data : [];
      if (mounted && newMsgs.length != _messages.length) {
        setState(() {
          _messages = newMsgs;
        });
        _scrollToBottom();
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _chatController.text.trim();
    if (text.isEmpty) return;

    _chatController.clear();
    try {
      await _apiClient.post('group-jars/${widget.groupJarId}/messages', data: {
        'content': text,
      });
      await _fetchMessages(silent: true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể gửi tin nhắn. Thử lại sau.')),
        );
      }
    }
  }

  Future<void> _showInviteDialog() async {
    final emailController = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: BrutalColors.cardBg,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: BrutalColors.ink, width: 2.5),
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text('Mời thành viên mới', style: BrutalStyles.titleStyle(size: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nhập email người dùng Finjar bạn muốn mời vào hũ tiết kiệm nhóm:',
                style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.grey)),
            const SizedBox(height: 12),
            BrutalInput(
              label: 'Email người được mời',
              hint: 'user@example.com',
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('HỦY', style: BrutalStyles.bodyStyle(color: BrutalColors.grey)),
          ),
          BrutalButton(
            text: 'MỜI',
            isFullWidth: false,
            color: BrutalColors.purple,
            onTap: () async {
              final email = emailController.text.trim();
              if (email.isEmpty) return;

              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(ctx);

              try {
                final res = await _apiClient.post('group-jars/${widget.groupJarId}/invite', data: {
                  'email': email,
                });
                if (res.statusCode == 200 || res.statusCode == 201) {
                  _loadGroupJarData();
                  messenger.showSnackBar(
                    SnackBar(content: Text('Đã thêm $email vào hũ tiết kiệm nhóm!')),
                  );
                }
              } catch (e) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Không tìm thấy email người dùng hoặc đã ở trong nhóm.')),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Future<void> _showDepositDialog() async {
    final amountController = TextEditingController();
    final noteController = TextEditingController();
    String? selectedFinancialAccountId = _financialAccounts.isNotEmpty
        ? (_financialAccounts.first['id'] ?? _financialAccounts.first['Id'])?.toString()
        : null;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return AlertDialog(
            backgroundColor: BrutalColors.cardBg,
            shape: RoundedRectangleBorder(
              side: BorderSide(color: BrutalColors.ink, width: 2.5),
              borderRadius: BorderRadius.circular(16),
            ),
            title: Text('💰 Nạp tiền vào Hũ Nhóm', style: BrutalStyles.titleStyle(size: 18)),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Chọn tài khoản ngân hàng/ví trích tiền đóng góp:',
                      style: BrutalStyles.bodyStyle(size: 12, color: BrutalColors.grey)),
                  const SizedBox(height: 12),

                  Text('Tài khoản / Ngân hàng trích tiền',
                      style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
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
                        value: selectedFinancialAccountId,
                        isExpanded: true,
                        style: BrutalStyles.bodyStyle(size: 14),
                        onChanged: (val) {
                          if (val != null) {
                            setModalState(() {
                              selectedFinancialAccountId = val;
                            });
                          }
                        },
                        items: _financialAccounts.map<DropdownMenuItem<String>>((acc) {
                          final accId = (acc['id'] ?? acc['Id']).toString();
                          final name = (acc['name'] ?? acc['Name'] ?? 'Tài khoản').toString();
                          final bal = (acc['currentBalance'] ?? acc['CurrentBalance'] ?? 0.0).toDouble();
                          return DropdownMenuItem<String>(
                            value: accId,
                            child: Text('$name (${currencyFormatter.format(bal)})'),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  BrutalCurrencyInput(
                    label: 'Số tiền nạp (VNĐ)',
                    hint: '100.000',
                    controller: amountController,
                  ),
                  const SizedBox(height: 12),
                  BrutalInput(
                    label: 'Ghi chú / Lời nhắn',
                    hint: 'Tiền đóng góp du lịch tháng này',
                    controller: noteController,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text('HỦY', style: BrutalStyles.bodyStyle(color: BrutalColors.grey)),
              ),
              BrutalButton(
                text: 'NẠP TIỀN',
                isFullWidth: false,
                color: BrutalColors.green,
                onTap: () async {
                  final amount = amountController.rawValue;
                  if (amount <= 0) return;

                  final messenger = ScaffoldMessenger.of(context);
                  Navigator.pop(ctx);

                  try {
                    await _apiClient.post('group-jars/${widget.groupJarId}/deposit', data: {
                      'amount': amount,
                      'financialAccountId': selectedFinancialAccountId,
                      'note': noteController.text.trim(),
                    });
                    _loadGroupJarData();
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Nạp tiền thành công! Tiền đã được trừ trong tài khoản ngân hàng.')),
                    );
                  } on DioException catch (e) {
                    final msg = e.response?.data?['message']?.toString() ?? e.response?.data?['error']?.toString();
                    messenger.showSnackBar(
                      SnackBar(content: Text(msg ?? 'Nạp tiền thất bại. Kiểm tra số dư tài khoản.')),
                    );
                  } catch (e) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Nạp tiền thất bại. Thử lại sau.')),
                    );
                  }
                },
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _showMembersModal() async {
    final members = (_groupJar?['members'] as List?) ?? [];
    final myRole = (_groupJar?['role'] ?? '').toString();
    final isOwner = myRole == 'Owner';

    await showModalBottomSheet(
      context: context,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('👥 Thành viên hũ nhóm (${members.length})',
                      style: BrutalStyles.titleStyle(size: 18)),
                  IconButton(
                    icon: Icon(Icons.person_add_alt_1, color: BrutalColors.purple),
                    onPressed: () {
                      Navigator.pop(context);
                      _showInviteDialog();
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: members.length,
                  itemBuilder: (ctx, index) {
                    final m = members[index];
                    final memberUserId = (m['userId'] ?? m['UserId'] ?? '').toString();
                    final name = (m['fullName'] ?? m['username'] ?? 'User').toString();
                    final email = (m['email'] ?? '').toString();
                    final role = (m['role'] ?? 'Member').toString();
                    final isMemberOwner = role == 'Owner';
                    final isMe = _currentUserId != null &&
                        memberUserId.toLowerCase() == _currentUserId!.toLowerCase();

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: BrutalColors.cardBg,
                        border: BrutalStyles.border,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: isMemberOwner ? BrutalColors.purple : BrutalColors.green,
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : 'U',
                              style: BrutalStyles.titleStyle(size: 14, color: Colors.white),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(name, style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700)),
                                    if (isMemberOwner) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: BrutalColors.purple,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text('Chủ hũ', style: BrutalStyles.titleStyle(size: 10, color: Colors.white)),
                                      ),
                                    ],
                                  ],
                                ),
                                if (email.isNotEmpty)
                                  Text(email, style: BrutalStyles.bodyStyle(size: 11, color: BrutalColors.grey)),
                              ],
                            ),
                          ),
                          if (isOwner && !isMemberOwner && !isMe)
                            IconButton(
                              icon: Icon(Icons.person_remove_outlined, color: BrutalColors.destructive),
                              tooltip: 'Mời khỏi nhóm',
                              onPressed: () async {
                                Navigator.pop(ctx);
                                _confirmKickMember(memberUserId, name);
                              },
                            ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _confirmKickMember(String memberUserId, String name) async {
    final messenger = ScaffoldMessenger.of(context);
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: BrutalColors.cardBg,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: BrutalColors.ink, width: 2.5),
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text('Xác nhận xóa thành viên', style: BrutalStyles.titleStyle(size: 18)),
        content: Text('Bạn có chắc muốn mời "$name" khỏi hũ tiết kiệm nhóm không?',
            style: BrutalStyles.bodyStyle(size: 14)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('HỦY', style: BrutalStyles.bodyStyle(color: BrutalColors.grey)),
          ),
          BrutalButton(
            text: 'XÓA KHỎI NHÓM',
            isFullWidth: false,
            color: BrutalColors.destructive,
            onTap: () => Navigator.pop(ctx, true),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _apiClient.delete('group-jars/${widget.groupJarId}/members/$memberUserId');
        _loadGroupJarData();
        messenger.showSnackBar(
          SnackBar(content: Text('Đã mời $name khỏi hũ nhóm!')),
        );
      } catch (e) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Không thể xóa thành viên này.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: BrutalColors.bg,
        appBar: AppBar(
          backgroundColor: BrutalColors.cardBg,
          elevation: 0,
          title: Text('Hũ tiết kiệm nhóm', style: BrutalStyles.titleStyle()),
        ),
        body: Center(child: CircularProgressIndicator(color: BrutalColors.ink)),
      );
    }

    final jarName = _groupJar?['name'] ?? 'Hũ nhóm';
    final currentBalance = (_groupJar?['currentBalance'] as num?)?.toDouble() ?? 0.0;
    final targetAmount = (_groupJar?['targetAmount'] as num?)?.toDouble() ?? 0.0;
    final members = (_groupJar?['members'] as List?) ?? [];
    final progressRatio = targetAmount > 0 ? (currentBalance / targetAmount).clamp(0.0, 1.0) : 0.0;

    return Scaffold(
      backgroundColor: BrutalColors.bg,
      appBar: AppBar(
        backgroundColor: BrutalColors.cardBg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: BrutalColors.ink),
          onPressed: () {
            GoRouter.of(context).go('/wallet?tab=1');
          },
        ),
        title: GestureDetector(
          onTap: _showMembersModal,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('👥 $jarName', style: BrutalStyles.titleStyle(size: 18)),
              Text('${members.length} thành viên • Quản lý',
                  style: BrutalStyles.bodyStyle(size: 12, color: BrutalColors.purple, weight: FontWeight.w700)),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.person_add_alt_1, color: BrutalColors.ink),
            tooltip: 'Mời thành viên',
            onPressed: _showInviteDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // 1. Group Jar Overview Card Header
          Container(
            width: double.infinity,
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BrutalStyles.cardDecoration(color: BrutalColors.cardBg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('TỔNG TIỀN HIỆN TẠI', style: BrutalStyles.labelStyle(size: 12, weight: FontWeight.w700)),
                    Text('Mục tiêu: ${currencyFormatter.format(targetAmount)}',
                        style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.purple, weight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  currencyFormatter.format(currentBalance),
                  style: BrutalStyles.titleStyle(size: 26, color: BrutalColors.ink),
                ),
                const SizedBox(height: 12),

                // Progress Bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: progressRatio,
                    minHeight: 10,
                    backgroundColor: BrutalColors.lightGrey,
                    color: BrutalColors.green,
                  ),
                ),
                const SizedBox(height: 12),

                // Members Avatar Row & Deposit Action Button
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: _showMembersModal,
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: members.map((m) {
                              final name = (m['fullName'] ?? m['username'] ?? 'User').toString();
                              final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: CircleAvatar(
                                  radius: 14,
                                  backgroundColor: BrutalColors.purple,
                                  child: Text(initial,
                                      style: BrutalStyles.titleStyle(size: 12, color: Colors.white)),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                    ),
                    BrutalButton(
                      text: '+ NẠP TIỀN',
                      isFullWidth: false,
                      color: BrutalColors.green,
                      onTap: _showDepositDialog,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // 2. Chat Section Title Divider
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4),
            child: Row(
              children: [
                Icon(Icons.chat_bubble_outline, size: 16, color: BrutalColors.grey),
                const SizedBox(width: 6),
                Text('TRÒ CHUYỆN & LỊCH SỬ NẠP TIỀN',
                    style: BrutalStyles.labelStyle(size: 12, weight: FontWeight.w800)),
                const Expanded(child: Divider(indent: 8, thickness: 1)),
              ],
            ),
          ),

          // 3. Real-Time Chat Message Stream
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final msgType = msg['messageType'] ?? 'Text';

                if (msgType == 'DepositInvoice') {
                  // Special Interactive Invoice Card Widget for Money Deposits!
                  final amount = (msg['depositAmount'] as num?)?.toDouble() ?? 0.0;
                  final sender = (msg['senderName'] ?? 'Thành viên').toString();
                  final note = (msg['content'] ?? '').toString();
                  final dateStr = msg['createdAt'] != null
                      ? DateFormat('HH:mm - dd/MM/yyyy').format(DateTime.parse(msg['createdAt']))
                      : '';

                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: BrutalColors.cardBg,
                      border: Border.all(color: BrutalColors.green, width: 2.5),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BrutalStyles.shadowSm],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: BrutalColors.green,
                                borderRadius: BorderRadius.circular(6),
                                border: BrutalStyles.border,
                              ),
                              child: Text('🧾 HÓA ĐƠN NẠP TIỀN',
                                  style: BrutalStyles.titleStyle(size: 11)),
                            ),
                            const Spacer(),
                            Text(dateStr, style: BrutalStyles.labelStyle(size: 11)),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text('👤 Người nạp: $sender', style: BrutalStyles.bodyStyle(size: 13)),
                        const SizedBox(height: 4),
                        Text(
                          '+${currencyFormatter.format(amount)}',
                          style: BrutalStyles.titleStyle(size: 20, color: Colors.green[800]),
                        ),
                        if (note.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text('💬 Lời nhắn: "$note"',
                              style: BrutalStyles.bodyStyle(size: 12, color: BrutalColors.grey)),
                        ],
                      ],
                    ),
                  );
                }

                // Regular Text Chat Bubble
                final senderId = (msg['senderId'] ?? msg['SenderId'] ?? '').toString();
                final isMe = _currentUserId != null &&
                    senderId.toLowerCase() == _currentUserId!.toLowerCase();

                final senderName = (msg['senderName'] ?? 'Member').toString();
                final senderText = isMe ? 'Bạn' : senderName;
                final content = (msg['content'] ?? '').toString();
                final dateStr = msg['createdAt'] != null
                    ? DateFormat('HH:mm').format(DateTime.parse(msg['createdAt']))
                    : '';

                return Container(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Column(
                    crossAxisAlignment:
                        isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                    children: [
                      Text('$senderText • $dateStr',
                          style: BrutalStyles.labelStyle(size: 11)),
                      const SizedBox(height: 2),
                      Container(
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.75,
                        ),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isMe ? const Color(0xFFE8E5FF) : BrutalColors.cardBg,
                          border: BrutalStyles.border,
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(12),
                            topRight: const Radius.circular(12),
                            bottomLeft: isMe ? const Radius.circular(12) : Radius.zero,
                            bottomRight: isMe ? Radius.zero : const Radius.circular(12),
                          ),
                          boxShadow: [BrutalStyles.shadowSm],
                        ),
                        child: Text(content,
                            style: BrutalStyles.bodyStyle(size: 14)),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // 4. Message Input Box
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: BrutalColors.cardBg,
              border: Border(top: BorderSide(color: BrutalColors.ink, width: 2)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: BrutalColors.bg,
                      border: BrutalStyles.border,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _chatController,
                      style: BrutalStyles.bodyStyle(size: 14),
                      decoration: InputDecoration(
                        hintText: 'Nhập tin nhắn nhóm...',
                        hintStyle: BrutalStyles.labelStyle(size: 14),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(Icons.send, color: BrutalColors.ink),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
