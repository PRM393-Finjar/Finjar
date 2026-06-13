import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/router/app_router.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/core/theme/onboarding_theme.dart';

class FinjarApp extends StatelessWidget {
  const FinjarApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSettings(),
      builder: (context, _) {
        return MaterialApp.router(
          title: 'Finjar Mobile',
          debugShowCheckedModeBanner: false,
          themeMode: AppSettings().isDarkMode ? ThemeMode.dark : ThemeMode.light,
          theme: BrutalTheme.themeData,
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            scaffoldBackgroundColor: const Color(0xFF121212),
          ),
          routerConfig: appRouter,
        );
      },
    );
  }
}
