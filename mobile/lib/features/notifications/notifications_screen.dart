import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:intl/intl.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiClient.get('notifications');
      if (response.statusCode == 200) {
        setState(() {
          _notifications = response.data ?? [];
        });
      }
    } catch (e) {
      setState(() {
        _notifications = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }



  Future<void> _markAsRead(String id) async {
    try {
      await _apiClient.patch('notifications/$id', data: {'isRead': true});
      _fetchNotifications();
    } catch (e) {
      // Offline fallback: do nothing silently
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrutalColors.bg,
      appBar: AppBar(
        backgroundColor: BrutalColors.cardBg,
        elevation: 0,
        title: Text('Thông Báo 🔔', style: BrutalStyles.titleStyle(size: 20)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: BrutalColors.ink),
          onPressed: () => Navigator.pop(context),
        ),
        shape: Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
          : _notifications.isEmpty
              ? Center(
                  child: Text(
                    'Không có thông báo nào.',
                    style: BrutalStyles.bodyStyle(size: 14, color: BrutalColors.grey),
                  ),
                )
              : ListView.builder(
                  itemCount: _notifications.length,
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (context, index) {
                    final notif = _notifications[index];
                    final isRead = notif['isRead'] ?? false;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: GestureDetector(
                        onTap: () {
                          if (!isRead) _markAsRead(notif['id']);
                        },
                        child: BrutalCard(
                          color: isRead ? BrutalColors.cardBg : const Color(0xFFECFDF5),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      notif['title'] ?? 'Thông báo',
                                      style: BrutalStyles.bodyStyle(
                                        size: 15,
                                        weight: isRead ? FontWeight.w700 : FontWeight.w900,
                                      ),
                                    ),
                                  ),
                                  if (!isRead)
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        color: BrutalColors.green,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                notif['message'] ?? '',
                                style: BrutalStyles.bodyStyle(
                                  size: 13,
                                  color: BrutalColors.ink,
                                  weight: isRead ? FontWeight.w500 : FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                DateFormat('dd/MM/yyyy HH:mm').format(
                                  DateTime.tryParse(notif['createdAt'] ?? '') ?? DateTime.now(),
                                ),
                                style: BrutalStyles.labelStyle(size: 11),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
