import 'package:flutter/material.dart';
import '../../core/theme/brutal_theme.dart';

class BrutalButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final bool isLoading;
  final bool isFullWidth;
  final double borderRadius;

  const BrutalButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.backgroundColor = BrutalTheme.green,
    this.isLoading = false,
    this.isFullWidth = true,
    this.borderRadius = 9999, // default pill shape
  });

  @override
  State<BrutalButton> createState() => _BrutalButtonState();
}

class _BrutalButtonState extends State<BrutalButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDisabled = widget.onPressed == null || widget.isLoading;

    // Neubrutalist button physics:
    // When pressed, translate down-right by (3, 3) and remove shadow.
    // When not pressed, translation is (0, 0) and shadow is (3, 3).
    final double offsetVal = isDisabled ? 0.0 : (_isPressed ? 3.0 : 0.0);
    final double shadowVal = isDisabled ? 0.0 : (_isPressed ? 0.0 : 3.0);

    Widget buttonContent = Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
      decoration: BoxDecoration(
        color: isDisabled ? widget.backgroundColor.withOpacity(0.55) : widget.backgroundColor,
        borderRadius: BorderRadius.circular(widget.borderRadius),
        border: Border.all(color: BrutalTheme.ink, width: 2),
        boxShadow: shadowVal > 0
            ? [
                BoxShadow(
                  color: BrutalTheme.ink,
                  offset: Offset(shadowVal, shadowVal),
                  blurRadius: 0,
                  spreadRadius: 0,
                )
              ]
            : null,
      ),
      child: Center(
        child: widget.isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(BrutalTheme.ink),
                ),
              )
            : Text(
                widget.text,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: BrutalTheme.ink,
                      fontSize: 16,
                    ),
              ),
      ),
    );

    if (isDisabled) {
      return buttonContent;
    }

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onPressed?.call();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: Transform.translate(
        offset: Offset(offsetVal, offsetVal),
        child: widget.isFullWidth
            ? SizedBox(width: double.infinity, child: buttonContent)
            : buttonContent,
      ),
    );
  }
}
