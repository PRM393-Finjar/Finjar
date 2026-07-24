class OcrLineItem {
  OcrLineItem({required this.name, this.amount});

  final String name;
  final double? amount;

  factory OcrLineItem.fromJson(Map<String, dynamic> json) {
    final amountRaw = json['amount'] ?? json['Amount'];
    return OcrLineItem(
      name: (json['name'] ?? json['Name'] ?? 'Dòng chưa đặt tên').toString(),
      amount: amountRaw == null ? null : (amountRaw as num).toDouble(),
    );
  }
}

class OcrUploadResult {
  OcrUploadResult({
    required this.importJobId,
    this.status,
    this.message,
    this.financialAccountId,
    this.fileName,
    this.originalFileName,
    this.sizeInBytes,
    this.merchantName,
    this.amount,
    this.transactionDate,
    this.suggestedCategoryName,
    this.suggestedCategoryId,
    this.matchedBy,
    this.note,
    this.draftId,
    this.ocrSuccess,
    this.ocrError,
    this.warnings = const [],
    this.items = const [],
    this.subtotal,
    this.discount,
    this.total,
    this.rawText,
  });

  final String importJobId;
  final String? status;
  final String? message;
  final String? financialAccountId;
  final String? fileName;
  final String? originalFileName;
  final int? sizeInBytes;
  final String? merchantName;
  final double? amount;
  final DateTime? transactionDate;
  final String? suggestedCategoryName;
  final String? suggestedCategoryId;
  final String? matchedBy;
  final String? note;
  final String? draftId;
  final bool? ocrSuccess;
  final String? ocrError;
  final List<String> warnings;
  final List<OcrLineItem> items;
  final double? subtotal;
  final double? discount;
  final double? total;
  final String? rawText;

  bool get hasDetectedAmount => amount != null && amount! > 0;

  factory OcrUploadResult.fromJson(Map<String, dynamic> json) {
    final preview = _asMap(json['preview'] ?? json['Preview']);
    final transaction = _asMap(
      preview['transaction'] ?? preview['Transaction'],
    );
    final receipt = _asMap(json['receipt'] ?? json['Receipt']);
    final summary = _asMap(preview['summary'] ?? preview['Summary']);
    final ocr = _asMap(json['ocrResult'] ?? json['OcrResult']);

    final amountRaw = transaction['amount'] ??
        transaction['Amount'] ??
        receipt['totalAmount'] ??
        receipt['TotalAmount'] ??
        summary['total'] ??
        summary['Total'];
    final dateRaw = transaction['date'] ??
        transaction['Date'] ??
        receipt['transactionDate'] ??
        receipt['TransactionDate'];

    final warningRaw = preview['warnings'] ??
        preview['Warnings'] ??
        receipt['warnings'] ??
        receipt['Warnings'] ??
        const [];
    final warnings = warningRaw is List
        ? warningRaw.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList()
        : <String>[];

    final itemsRaw = preview['items'] ?? preview['Items'] ?? const [];
    final items = itemsRaw is List
        ? itemsRaw
            .whereType<Map>()
            .map((e) => OcrLineItem.fromJson(
                  e.map((k, v) => MapEntry(k.toString(), v)),
                ))
            .toList()
        : <OcrLineItem>[];

    final sizeRaw = json['sizeInBytes'] ?? json['SizeInBytes'];

    return OcrUploadResult(
      importJobId: (json['id'] ?? json['Id'] ?? json['importJobId'] ?? '')
          .toString(),
      status: (json['status'] ?? json['Status'] ?? preview['status'] ?? preview['Status'])
          ?.toString(),
      message: (json['message'] ?? json['Message'])?.toString(),
      financialAccountId:
          (json['financialAccountId'] ?? json['FinancialAccountId'])
              ?.toString(),
      fileName: (json['fileName'] ?? json['FileName'])?.toString(),
      originalFileName:
          (json['originalFileName'] ?? json['OriginalFileName'])?.toString(),
      sizeInBytes: sizeRaw == null ? null : (sizeRaw as num).toInt(),
      merchantName: (transaction['merchantName'] ??
              transaction['MerchantName'] ??
              receipt['merchantName'] ??
              receipt['MerchantName'])
          ?.toString(),
      amount: amountRaw == null ? null : (amountRaw as num).toDouble(),
      transactionDate: dateRaw == null
          ? null
          : DateTime.tryParse(dateRaw.toString())?.toLocal(),
      suggestedCategoryName: (transaction['suggestedCategoryName'] ??
              transaction['SuggestedCategoryName'] ??
              receipt['suggestedCategoryName'] ??
              receipt['SuggestedCategoryName'])
          ?.toString(),
      suggestedCategoryId: (transaction['suggestedCategoryId'] ??
              transaction['SuggestedCategoryId'] ??
              transaction['categoryId'] ??
              transaction['CategoryId'] ??
              receipt['suggestedCategoryId'] ??
              receipt['SuggestedCategoryId'])
          ?.toString(),
      matchedBy: (transaction['matchedBy'] ??
              transaction['MatchedBy'] ??
              transaction['categoryMatchedBy'] ??
              receipt['matchedBy'] ??
              receipt['MatchedBy'] ??
              receipt['categoryMatchedBy'] ??
              receipt['CategoryMatchedBy'])
          ?.toString(),
      note: (transaction['note'] ??
              transaction['Note'] ??
              transaction['merchantName'] ??
              receipt['merchantName'])
          ?.toString(),
      ocrSuccess: ocr['isSuccess'] as bool? ??
          ocr['IsSuccess'] as bool? ??
          ((json['status'] ?? json['Status'])?.toString().toLowerCase() ==
              'awaitingreview'),
      ocrError: (ocr['errorMessage'] ??
              ocr['ErrorMessage'] ??
              json['errorMessage'] ??
              json['ErrorMessage'])
          ?.toString(),
      warnings: warnings,
      items: items,
      subtotal: _asDouble(summary['subtotal'] ?? summary['Subtotal']),
      discount: _asDouble(summary['discount'] ?? summary['Discount']),
      total: _asDouble(summary['total'] ?? summary['Total'] ?? amountRaw),
      rawText: (receipt['rawText'] ?? receipt['RawText'] ?? ocr['text'] ?? ocr['Text'])
          ?.toString(),
    );
  }

  OcrUploadResult copyWith({String? draftId}) {
    return OcrUploadResult(
      importJobId: importJobId,
      status: status,
      message: message,
      financialAccountId: financialAccountId,
      fileName: fileName,
      originalFileName: originalFileName,
      sizeInBytes: sizeInBytes,
      merchantName: merchantName,
      amount: amount,
      transactionDate: transactionDate,
      suggestedCategoryName: suggestedCategoryName,
      suggestedCategoryId: suggestedCategoryId,
      matchedBy: matchedBy,
      note: note,
      draftId: draftId ?? this.draftId,
      ocrSuccess: ocrSuccess,
      ocrError: ocrError,
      warnings: warnings,
      items: items,
      subtotal: subtotal,
      discount: discount,
      total: total,
      rawText: rawText,
    );
  }

  static double? _asDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  static Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }
    return <String, dynamic>{};
  }
}
