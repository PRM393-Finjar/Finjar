import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';

class BrutalColors {
  static Color get bg => AppSettings().isDarkMode ? const Color(0xFF121212) : const Color(0xFFF4F4F5);
  static Color get ink => AppSettings().isDarkMode ? const Color(0xFFF4F4F5) : const Color(0xFF0A0A0A);
  static Color get green => const Color(0xFFA8E087);
  static Color get purple => const Color(0xFFA5A6F6);
  static Color get cardBg => AppSettings().isDarkMode ? const Color(0xFF1E1E1E) : const Color(0xFFFFFFFF);
  static Color get destructive => const Color(0xFFEF4444);
  static Color get warning => const Color(0xFFFBBF24);
  static Color get info => const Color(0xFF60A5FA);
  static Color get grey => AppSettings().isDarkMode ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
  static Color get lightGrey => AppSettings().isDarkMode ? const Color(0xFF27272A) : const Color(0xFFE4E4E7);
  static Color get alertBg => AppSettings().isDarkMode ? const Color(0xFF3B1E1E) : const Color(0xFFFEF2F2);
  static Color get successBg => AppSettings().isDarkMode ? const Color(0xFF1E3A24) : const Color(0xFFECFDF5);
  static Color get successText => AppSettings().isDarkMode ? const Color(0xFFA8E087) : Colors.green[800]!;
}

class BrutalStyles {
  static const double borderWidth = 2.0;
  static const double borderRadiusValue = 16.0;

  static Border get border => Border.all(
    color: BrutalColors.ink,
    width: borderWidth,
  );

  static BoxShadow get shadow => BoxShadow(
    color: BrutalColors.ink,
    blurRadius: 0,
    spreadRadius: 0,
    offset: const Offset(4, 4),
  );

  static BoxShadow get shadowSm => BoxShadow(
    color: BrutalColors.ink,
    blurRadius: 0,
    spreadRadius: 0,
    offset: const Offset(2.5, 2.5),
  );

  static BoxDecoration cardDecoration({Color? color, double radius = borderRadiusValue}) {
    final effectiveColor = color ?? BrutalColors.cardBg;
    return BoxDecoration(
      color: effectiveColor,
      border: border,
      borderRadius: BorderRadius.circular(radius),
      boxShadow: [shadow],
    );
  }

  static BoxDecoration cardDecorationFlat({Color? color, double radius = borderRadiusValue}) {
    final effectiveColor = color ?? BrutalColors.cardBg;
    return BoxDecoration(
      color: effectiveColor,
      border: border,
      borderRadius: BorderRadius.circular(radius),
    );
  }

  static const List<String> fontFallbacks = [
    'Segoe UI Emoji',
    'Apple Color Emoji',
    'Noto Color Emoji',
  ];

  static TextStyle titleStyle({double size = 20, Color? color}) {
    return TextStyle(
      fontFamily: 'Segoe UI',
      fontSize: size,
      fontWeight: FontWeight.w800,
      color: color ?? BrutalColors.ink,
      letterSpacing: -0.5,
      fontFamilyFallback: fontFallbacks,
    );
  }

  static TextStyle bodyStyle({double size = 14, Color? color, FontWeight weight = FontWeight.w600}) {
    return TextStyle(
      fontFamily: 'Segoe UI',
      fontSize: size,
      fontWeight: weight,
      color: color ?? BrutalColors.ink,
      fontFamilyFallback: fontFallbacks,
    );
  }

  static TextStyle labelStyle({double size = 12, Color? color, FontWeight weight = FontWeight.w500}) {
    return TextStyle(
      fontFamily: 'Segoe UI',
      fontSize: size,
      fontWeight: weight,
      color: color ?? BrutalColors.grey,
      fontFamilyFallback: fontFallbacks,
    );
  }
}

class BrutalCard extends StatelessWidget {
  final Widget child;
  final Color? color;
  final double radius;
  final EdgeInsetsGeometry padding;
  final bool hasShadow;
  final VoidCallback? onTap;

  const BrutalCard({
    Key? key,
    required this.child,
    this.color,
    this.radius = BrutalStyles.borderRadiusValue,
    this.padding = const EdgeInsets.all(16.0),
    this.hasShadow = true,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? BrutalColors.cardBg;
    final decoration = hasShadow 
      ? BrutalStyles.cardDecoration(color: effectiveColor, radius: radius)
      : BrutalStyles.cardDecorationFlat(color: effectiveColor, radius: radius);

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 100),
          decoration: decoration,
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      );
    }

    return Container(
      decoration: decoration,
      child: Padding(
        padding: padding,
        child: child,
      ),
    );
  }
}

class BrutalButton extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  final Color? color;
  final bool isFullWidth;
  final Widget? icon;

  const BrutalButton({
    Key? key,
    required this.text,
    this.onTap,
    this.color,
    this.isFullWidth = true,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? BrutalColors.green;
    final textColor = effectiveColor.computeLuminance() < 0.45
        ? BrutalColors.cardBg
        : BrutalColors.ink;
    Widget buttonContent = Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      children: [
        if (icon != null) ...[
          icon!,
          const SizedBox(width: 8),
        ],
        Text(
          text,
          style: BrutalStyles.titleStyle(size: 16, color: textColor),
        ),
      ],
    );

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
        decoration: BrutalStyles.cardDecoration(color: effectiveColor, radius: 9999),
        child: buttonContent,
      ),
    );
  }
}

class BrutalInput extends StatelessWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? errorText;
  final Widget? suffixIcon;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;

  const BrutalInput({
    Key? key,
    required this.label,
    required this.hint,
    required this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.errorText,
    this.suffixIcon,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.none,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: BrutalColors.cardBg,
            border: BrutalStyles.border,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [BrutalStyles.shadowSm],
          ),
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            keyboardType: keyboardType,
            textCapitalization: textCapitalization,
            inputFormatters: inputFormatters,
            style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w600),
            // Disable browser IME composing to prevent Flutter Web assertion crash:
            // "Range end N is out of text of length M"
            // Chrome's IME sends composing ranges that no longer match the
            // formatter-modified text. Flutter validates BEFORE the formatter runs.
            autocorrect: false,
            enableSuggestions: false,
            smartDashesType: SmartDashesType.disabled,
            smartQuotesType: SmartQuotesType.disabled,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: BrutalStyles.labelStyle(size: 14, color: BrutalColors.grey),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: InputBorder.none,
              suffixIcon: suffixIcon,
            ),
          ),
        ),
        if (errorText != null) ...[
          const SizedBox(height: 6),
          Text(
            errorText!,
            style: BrutalStyles.bodyStyle(size: 12, color: BrutalColors.destructive, weight: FontWeight.w700),
          ),
        ],
      ],
    );
  }
}
