import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/brutal_theme.dart';

class FinjarApp extends ConsumerWidget {
  const FinjarApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Finjar Mobile',
      debugShowCheckedModeBanner: false,
      theme: BrutalTheme.themeData,
      routerConfig: router,
    );
  }
}
