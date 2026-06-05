import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class ThousandsSeparatorInputFormatter extends TextInputFormatter {
  static final NumberFormat _formatter = NumberFormat.decimalPattern('vi_VN');

  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    if (newValue.text.isEmpty) {
      return const TextEditingValue(
        text: '',
        selection: TextSelection.collapsed(offset: 0),
        composing: TextRange.empty,
      );
    }

    // Strip all non-digit characters
    final String cleanText = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (cleanText.isEmpty) {
      return const TextEditingValue(
        text: '',
        selection: TextSelection.collapsed(offset: 0),
        composing: TextRange.empty,
      );
    }

    final double? value = double.tryParse(cleanText);
    if (value == null) {
      // Return oldValue but guarantee its selection/composing is in-range
      final safeOffset = oldValue.text.length;
      return TextEditingValue(
        text: oldValue.text,
        selection: TextSelection.collapsed(offset: safeOffset),
        composing: TextRange.empty,
      );
    }

    // Format using vi_VN locale which uses dot '.' as thousands separator
    final String newText = _formatter.format(value);

    // Guard: clamp offset to text length to prevent Flutter Web assertion crash:
    // "range.end >= 0 && range.end <= text.length"
    final int safeOffset = newText.length.clamp(0, newText.length);

    return TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: safeOffset),
      composing: TextRange.empty,
    );
  }
}
