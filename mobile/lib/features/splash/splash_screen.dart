import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/storage/secure_storage.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';

/// Màn khởi động có UI rõ ràng — tránh màn hình đen khi GoRouter redirect async.
class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    var target = '/auth';
    try {
      final token = await SecureStorage.getToken()
          .timeout(const Duration(seconds: 2), onTimeout: () => null);
      final expired = await SecureStorage.isSessionExpired()
          .timeout(const Duration(seconds: 2), onTimeout: () => true);
      var onboardingDone = await SecureStorage.isOnboardingCompleted()
          .timeout(const Duration(seconds: 2), onTimeout: () => false);

      if (token == null || token.isEmpty || expired) {
        if (expired && token != null && token.isNotEmpty) {
          await SecureStorage.clearSession();
        }
        target = '/auth';
      } else {
        // Đồng bộ cờ onboarding với BE (không chặn UI quá lâu).
        if (!onboardingDone) {
          try {
            final api = ApiClient();
            final me = await api
                .get('user/me')
                .timeout(const Duration(seconds: 4));
            final data = me.data;
            final done = data is Map &&
                (data['isOnboardingCompleted'] == true ||
                    data['IsOnboardingCompleted'] == true);
            if (done) {
              await SecureStorage.saveOnboardingCompleted(true);
              onboardingDone = true;
            }
          } catch (_) {}
        }
        target = onboardingDone ? '/dashboard' : '/onboarding';
      }
    } catch (_) {
      target = '/auth';
    }

    if (!mounted) return;
    context.go(target);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F5),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: BrutalColors.green,
                border: Border.all(color: Colors.black, width: 3),
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(color: Colors.black, offset: Offset(4, 4)),
                ],
              ),
              child: const Text('💰', style: TextStyle(fontSize: 36)),
            ),
            const SizedBox(height: 16),
            Text(
              'Finjar',
              style: BrutalStyles.titleStyle(size: 28, color: Colors.black),
            ),
            const SizedBox(height: 24),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
