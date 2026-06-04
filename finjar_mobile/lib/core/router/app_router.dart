import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/screens/auth_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/dashboard/screens/dashboard_placeholder_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/auth',
    redirect: (context, state) {
      final isLoggedIn = authState.token != null;
      final isOnboardingCompleted = authState.isOnboardingCompleted;
      final isGoingToAuth = state.matchedLocation == '/auth';
      final isGoingToOnboarding = state.matchedLocation == '/onboarding';

      if (!isLoggedIn) {
        // User is not logged in. Force them to stay on the Auth screen.
        if (!isGoingToAuth) {
          return '/auth';
        }
        return null;
      }

      // User is logged in.
      if (!isOnboardingCompleted) {
        // Onboarding is not completed. Force them to go to Onboarding.
        if (!isGoingToOnboarding) {
          return '/onboarding';
        }
        return null;
      }

      // User is logged in and onboarding is completed.
      // If they try to access Auth or Onboarding, redirect to Dashboard.
      if (isGoingToAuth || isGoingToOnboarding) {
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
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardPlaceholderScreen(),
      ),
    ],
  );
});
