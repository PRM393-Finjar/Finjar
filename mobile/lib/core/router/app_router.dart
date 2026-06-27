import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/storage/secure_storage.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/features/auth/auth_screen.dart';
import 'package:finjar_mobile/features/auth/verify_email_pending_screen.dart';
import 'package:finjar_mobile/features/onboarding/screens/onboarding_screen.dart';
import 'package:finjar_mobile/features/dashboard/dashboard_screen.dart';
import 'package:finjar_mobile/features/transactions/transactions_screen.dart';
import 'package:finjar_mobile/features/wallet/wallet_screen.dart';
import 'package:finjar_mobile/features/profile/profile_screen.dart';
import 'package:finjar_mobile/features/categories/categories_screen.dart';
import 'package:finjar_mobile/features/goals/goals_screen.dart';
import 'package:finjar_mobile/features/notifications/notifications_screen.dart';
import 'package:finjar_mobile/features/reminders/reminders_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _shellNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'shell');

/// Key used by AppShell to trigger a data refresh on DashboardScreen
/// whenever the user switches back to the Dashboard tab.
final GlobalKey<DashboardScreenState> dashboardKey =
    GlobalKey<DashboardScreenState>();

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/dashboard',
  redirect: (BuildContext context, GoRouterState state) async {
    final token = await SecureStorage.getToken();
    final onboardingCompleted = await SecureStorage.isOnboardingCompleted();
    final location = state.matchedLocation;
    final isAuth = location == '/auth';
    final isOnboarding = location == '/onboarding';
    final isVerifyEmail = location.startsWith('/verify-email');

    if (token != null &&
        token.isNotEmpty &&
        await SecureStorage.isSessionExpired()) {
      await SecureStorage.clearSession();
      return isAuth || isVerifyEmail ? null : '/auth';
    }

    if (token == null || token.isEmpty) {
      return isAuth || isVerifyEmail ? null : '/auth';
    }

    if (!onboardingCompleted) {
      return isOnboarding ? null : '/onboarding';
    }

    if (isAuth || isOnboarding) {
      return '/dashboard';
    }

    return null;
  },
  routes: [
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),
    GoRoute(
      path: '/verify-email',
      redirect: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        if (email.isNotEmpty) {
          return '/verify-email/pending?email=${Uri.encodeComponent(email)}';
        }
        return '/verify-email/pending';
      },
    ),
    GoRoute(
      path: '/verify-email/pending',
      builder: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        return VerifyEmailPendingScreen(email: email);
      },
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) {
        return AppShell(
          location: state.matchedLocation,
          child: child,
        );
      },
      routes: [
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const SizedBox.shrink(),
        ),
        GoRoute(
          path: '/transactions',
          builder: (context, state) => const SizedBox.shrink(),
        ),
        GoRoute(
          path: '/wallet',
          builder: (context, state) => const SizedBox.shrink(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const SizedBox.shrink(),
        ),
      ],
    ),
    GoRoute(
      path: '/categories',
      builder: (context, state) => const CategoriesScreen(),
    ),
    GoRoute(
      path: '/goals',
      builder: (context, state) => const GoalsScreen(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/reminders',
      builder: (context, state) => const RemindersScreen(),
    ),
  ],
);

// Unified shell providing responsive Neubrutalist bottom navigation
// Uses IndexedStack + Offstage to KEEP ALL TAB STATES alive permanently.
// This prevents WalletScreen (and other tabs) from being recreated on tab switch.
class AppShell extends StatefulWidget {
  final String location;
  final Widget child; // unused visually but required by ShellRoute
  const AppShell({Key? key, required this.location, required this.child})
      : super(key: key);

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;

  static const List<String> _paths = [
    '/dashboard',
    '/transactions',
    '/wallet',
    '/profile',
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = _indexFromLocation(widget.location);
  }

  @override
  void didUpdateWidget(AppShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    final newIndex = _indexFromLocation(widget.location);
    if (newIndex != _currentIndex) {
      // Refresh Dashboard whenever navigating back to it
      if (newIndex == 0) {
        dashboardKey.currentState?.refresh();
      } else if (newIndex == 1) {
        AppSettings().triggerTransactionsRefresh();
      }
      setState(() {
        _currentIndex = newIndex;
      });
    }
  }

  int _indexFromLocation(String location) {
    if (location.startsWith('/transactions')) return 1;
    if (location.startsWith('/wallet')) return 2;
    if (location.startsWith('/profile')) return 3;
    return 0; // default: dashboard
  }

  void _onItemTapped(int index) {
    if (index == _currentIndex) return;
    // Refresh Dashboard data whenever user navigates back to it
    if (index == 0) {
      dashboardKey.currentState?.refresh();
    } else if (index == 1) {
      AppSettings().triggerTransactionsRefresh();
    }
    GoRouter.of(context).go(_paths[index]);
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSettings(),
      builder: (context, _) {
        // Construct the screens dynamically inside the builder without const to force element updates
        final screens = [
          DashboardScreen(key: dashboardKey),
          TransactionsScreen(),
          WalletScreen(),
          ProfileScreen(),
        ];

        return Scaffold(
          backgroundColor: BrutalColors.bg,
          body: SafeArea(
            child: Stack(
              children: List.generate(screens.length, (i) {
                return Offstage(
                  offstage: i != _currentIndex,
                  child: screens[i],
                );
              }),
            ),
          ),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: BrutalColors.ink, width: 3),
              ),
            ),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: _onItemTapped,
              backgroundColor: BrutalColors.cardBg,
              selectedItemColor: BrutalColors.ink,
              unselectedItemColor: BrutalColors.grey,
              selectedLabelStyle:
                  const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
              unselectedLabelStyle:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
              type: BottomNavigationBarType.fixed,
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined),
                  activeIcon: Icon(Icons.dashboard),
                  label: 'Tổng quan',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.account_balance_wallet_outlined),
                  activeIcon: Icon(Icons.account_balance_wallet),
                  label: 'Giao dịch',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.pie_chart_outline),
                  activeIcon: Icon(Icons.pie_chart),
                  label: 'Tài chính',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline),
                  activeIcon: Icon(Icons.person),
                  label: 'Cá nhân',
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
