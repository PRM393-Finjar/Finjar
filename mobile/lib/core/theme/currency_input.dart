import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'brutal_theme.dart';

/// A currency/number input that formats on blur instead of during typing.
///
/// This avoids the Flutter Web assertion crash:
///   "Range end N is out of text of length M"
///
/// Root cause: Chrome's IME sends composing ranges that are stale relative to
/// the formatter-modified text. Flutter validates composing ranges BEFORE the
/// formatter runs, so the formatter cannot fix it in time.
///
/// Solution: No formatter during typing. The controller holds raw digits.
/// On focus lost, the display updates to a formatted string.
/// Callers should read the raw value via [rawValue] getter, NOT controller.text.
class BrutalCurrencyInput extends StatefulWidget {
  final String label;
  final String hint;
  final TextEditingController controller;
  final String? errorText;
  final Widget? suffixIcon;

  const BrutalCurrencyInput({
    Key? key,
    required this.label,
    required this.hint,
    required this.controller,
    this.errorText,
    this.suffixIcon,
  }) : super(key: key);

  @override
  State<BrutalCurrencyInput> createState() => _BrutalCurrencyInputState();
}

class _BrutalCurrencyInputState extends State<BrutalCurrencyInput> {
  static final NumberFormat _fmt = NumberFormat.decimalPattern('vi_VN');
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);

    // If the controller already has a formatted value (e.g., edit dialog),
    // normalize it to raw digits so we have a consistent starting state.
    final existing = widget.controller.text;
    if (existing.isNotEmpty) {
      final raw = existing.replaceAll(RegExp(r'\D'), '');
      final value = double.tryParse(raw);
      if (value != null && value > 0) {
        // Show formatted when initially not focused
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted && !_focusNode.hasFocus) {
            _setFormatted(value);
          }
        });
      }
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    if (_focusNode.hasFocus) {
      // On focus: strip formatting → show raw digits only
      // This prevents Chrome IME from inheriting a stale composing range
      final raw = widget.controller.text.replaceAll(RegExp(r'\D'), '');
      // Use postFrameCallback to avoid setting value mid-focus-transition
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _focusNode.hasFocus) {
          widget.controller.value = TextEditingValue(
            text: raw,
            selection: TextSelection.collapsed(offset: raw.length),
            composing: TextRange.empty,
          );
        }
      });
    } else {
      // On blur: format the raw number
      final raw = widget.controller.text.replaceAll(RegExp(r'\D'), '');
      final value = double.tryParse(raw);
      if (value != null && value > 0) {
        _setFormatted(value);
      }
    }
  }

  void _setFormatted(double value) {
    final formatted = _fmt.format(value);
    widget.controller.value = TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
      composing: TextRange.empty,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
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
            controller: widget.controller,
            focusNode: _focusNode,
            // Only allow digits while typing — no formatter at all
            // This is the key: Chrome cannot create an IME composing range
            // on a field that only accepts raw digits via FilteringTextInputFormatter.
            keyboardType: const TextInputType.numberWithOptions(decimal: false),
            inputFormatters: [
              // Only allow digit characters while the field is active.
              // This formatter never changes text LENGTH, so composing range
              // from the browser always stays valid.
              FilteringTextInputFormatter.digitsOnly,
            ],
            style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w600),
            // These help reduce (but don't eliminate) IME composing on Chrome
            autocorrect: false,
            enableSuggestions: false,
            smartDashesType: SmartDashesType.disabled,
            smartQuotesType: SmartQuotesType.disabled,
            decoration: InputDecoration(
              hintText: widget.hint,
              hintStyle: BrutalStyles.labelStyle(size: 14, color: BrutalColors.grey),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: InputBorder.none,
              suffixIcon: widget.suffixIcon,
            ),
          ),
        ),
        if (widget.errorText != null) ...[
          const SizedBox(height: 6),
          Text(
            widget.errorText!,
            style: BrutalStyles.bodyStyle(
                size: 12,
                color: BrutalColors.destructive,
                weight: FontWeight.w700),
          ),
        ],
      ],
    );
  }
}

/// Helper extension to read the raw numeric value from a controller
/// that may contain formatted text (e.g., "1.000.000").
extension CurrencyControllerExt on TextEditingController {
  double get rawValue {
    final raw = text.replaceAll(RegExp(r'\D'), '');
    return double.tryParse(raw) ?? 0.0;
  }
}
