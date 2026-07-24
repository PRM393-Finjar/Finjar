import 'dart:io';

import 'package:dio/dio.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/features/imports/models.dart';

class ImportService {
  ImportService({ApiClient? apiClient}) : _api = apiClient ?? ApiClient();

  final ApiClient _api;

  Future<OcrUploadResult> uploadReceipt({
    required File file,
    required String financialAccountId,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.uri.pathSegments.isNotEmpty
            ? file.uri.pathSegments.last
            : 'receipt.jpg',
      ),
      'financialAccountId': financialAccountId,
      'layout': 'invoice',
      'runOcr': 'true',
      'includeDebug': 'false',
    });

    final response = await _api.dio.post(
      'imports/image',
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
        sendTimeout: const Duration(minutes: 2),
        receiveTimeout: const Duration(minutes: 2),
      ),
    );

    final raw = response.data;
    final map = raw is Map<String, dynamic>
        ? raw
        : raw is Map
            ? raw.map((k, v) => MapEntry(k.toString(), v))
            : <String, dynamic>{};

    var result = OcrUploadResult.fromJson(map);
    if (result.importJobId.isEmpty) {
      throw Exception('OCR không trả về import job id.');
    }

    final draftId = await _fetchFirstDraftId(result.importJobId);
    return result.copyWith(draftId: draftId);
  }

  Future<String?> _fetchFirstDraftId(String importJobId) async {
    try {
      final response = await _api.get('imports/$importJobId');
      final data = response.data;
      if (data is! Map) return null;
      final drafts = data['drafts'] ?? data['Drafts'];
      if (drafts is! List || drafts.isEmpty) return null;
      final first = drafts.first;
      if (first is Map) {
        return (first['id'] ?? first['Id'])?.toString();
      }
    } catch (_) {
      // Confirm can still run without explicit draft id.
    }
    return null;
  }

  Future<void> updateDraft({
    required String importJobId,
    String? draftId,
    required DateTime transactionDate,
    required double amount,
    required String type,
    String? note,
    String? categoryId,
    String? jarId,
  }) async {
    final payload = {
      'transactionDate': transactionDate.toUtc().toIso8601String(),
      'amount': amount,
      'type': type,
      'editedNote': note,
      'editedCategoryId': categoryId,
      'editedJarId': jarId,
      'isValid': true,
      'validationError': null,
    };

    final path = (draftId != null && draftId.isNotEmpty)
        ? 'imports/$importJobId/drafts/$draftId'
        : 'imports/$importJobId';
    await _api.patch(path, data: payload);
  }

  Future<String> confirmImport({
    required String importJobId,
    required String financialAccountId,
    String? draftId,
    String? fromJarId,
  }) async {
    final response = await _api.post(
      'imports/$importJobId/confirm',
      data: {
        'financialAccountId': financialAccountId,
        if (fromJarId != null && fromJarId.isNotEmpty) 'fromJarId': fromJarId,
        if (draftId != null && draftId.isNotEmpty) 'draftIds': [draftId],
      },
    );
    final data = response.data;
    if (data is Map) {
      return (data['message'] ?? data['Message'] ?? 'Đã tạo giao dịch từ hóa đơn.')
          .toString();
    }
    return 'Đã tạo giao dịch từ hóa đơn.';
  }
}
