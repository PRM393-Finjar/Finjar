import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/brutal_theme.dart';
import '../../../shared/widgets/brutal_button.dart';
import '../../../shared/widgets/brutal_card.dart';
import '../../auth/providers/auth_provider.dart';

class DashboardPlaceholderScreen extends ConsumerWidget {
  const DashboardPlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Finjar Dashboard',
          style: TextStyle(color: BrutalTheme.ink, fontWeight: FontWeight.bold),
        ),
        backgroundColor: BrutalTheme.green,
        elevation: 0,
        shape: const Border(
          bottom: BorderSide(color: BrutalTheme.ink, width: 2),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BrutalCard(
              backgroundColor: BrutalTheme.purple.withOpacity(0.15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Xin chào, ${authState.username ?? 'Thành viên Finjar'}!',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontSize: 20,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Email: ${authState.email ?? 'N/A'}',
                    style: const TextStyle(color: BrutalTheme.grey),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Chúc mừng! Bạn đã hoàn thành các bước khảo sát Onboarding ban đầu. Đây là trang Dashboard demo đại diện cho các tính năng quản lý tài chính chính.',
                    style: TextStyle(fontSize: 13, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            BrutalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Trạng thái tài khoản',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text('Liên kết Backend:'),
                      Text(
                        'Đã kết nối',
                        style: TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text('Onboarding Status:'),
                      Text(
                        'Hoàn thành',
                        style: TextStyle(
                          color: BrutalTheme.ink,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            BrutalButton(
              text: 'Đăng xuất',
              backgroundColor: BrutalTheme.white,
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Đã đăng xuất thành công.'),
                      backgroundColor: BrutalTheme.ink,
                    ),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
