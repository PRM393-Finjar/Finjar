import 'package:flutter/material.dart';

class BrutalTheme {
  // Brand colors
  static const Color bg = Color(0xFFF4F4F5);
  static const Color onboardingBg = Color(0xFFEEF1FB);
  static const Color ink = Color(0xFF0A0A0A);
  static const Color green = Color(0xFFA8E087);
  static const Color purple = Color(0xFFA5A6F6);
  static const Color white = Colors.white;
  static const Color red = Color(0xFFB91C1C);
  static const Color grey = Color(0xFF525252);
  static const Color lightGrey = Color(0xFFE5E5E5);

  static ThemeData get themeData {
    return ThemeData(
      scaffoldBackgroundColor: bg,
      primaryColor: green,
      colorScheme: const ColorScheme.light(
        primary: green,
        secondary: purple,
        surface: bg,
        onPrimary: ink,
        onSecondary: ink,
        onError: white,
        error: red,
      ),
      fontFamily: 'Roboto', // Default standard font, falls back to system font if not imported
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          color: ink,
          fontSize: 32,
          fontWeight: FontWeight.w900,
          letterSpacing: -1.0,
        ),
        headlineMedium: TextStyle(
          color: ink,
          fontSize: 24,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        titleLarge: TextStyle(
          color: ink,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        bodyLarge: TextStyle(
          color: ink,
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
        bodyMedium: TextStyle(
          color: ink,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        labelLarge: TextStyle(
          color: ink,
          fontSize: 14,
          fontWeight: FontWeight.w700,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: ink, width: 2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: green, width: 2.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: red, width: 2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: red, width: 2.5),
        ),
        labelStyle: const TextStyle(
          color: ink,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
        hintStyle: const TextStyle(
          color: grey,
          fontWeight: FontWeight.normal,
          fontSize: 14,
        ),
      ),
    );
  }
}
