import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/onboarding_theme.dart';

class BrutalCard extends StatelessWidget {
  final Widget child;
  final Color backgroundColor;
  final double borderRadius;
  final double shadowOffset;
  final EdgeInsetsGeometry padding;

  const BrutalCard({
    super.key,
    required this.child,
    this.backgroundColor = BrutalTheme.white,
    this.borderRadius = 16.0,
    this.shadowOffset = 4.0,
    this.padding = const EdgeInsets.all(16.0),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: BrutalTheme.ink, width: 2),
        boxShadow: shadowOffset > 0
            ? [
                BoxShadow(
                  color: BrutalTheme.ink,
                  offset: Offset(shadowOffset, shadowOffset),
                  blurRadius: 0,
                  spreadRadius: 0,
                )
              ]
            : null,
      ),
      child: child,
    );
  }
}
