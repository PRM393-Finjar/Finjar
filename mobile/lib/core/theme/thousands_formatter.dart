import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class ThousandsSeparatorInputFormatter extends TextInputFormatter {
  static final NumberFormat _formatter = NumberFormat.decimalPattern('vi_VN');

  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    if (newValue.text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    // Strip all non-digits (except we can keep digit characters)
    final String cleanText = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (cleanText.isEmpty) {
      return const TextEditingValue();
    }

    final double? value = double.tryParse(cleanText);
    if (value == null) {
      return oldValue;
    }

    // Format using vi_VN locale which uses dot '.' as thousands separator
    final String newText = _formatter.format(value);

    // Keep cursor at the end
    return newValue.copyWith(
      text: newText,
      selection: TextSelection.collapsed(offset: newText.length),
    );
  }
}
