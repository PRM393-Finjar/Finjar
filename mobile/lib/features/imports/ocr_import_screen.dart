import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/theme/app_settings.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/theme/currency_input.dart';
import 'package:finjar_mobile/features/imports/import_service.dart';
import 'package:finjar_mobile/features/imports/models.dart';

class OcrImportScreen extends StatefulWidget {
  const OcrImportScreen({super.key});

  @override
  State<OcrImportScreen> createState() => _OcrImportScreenState();
}

class _OcrImportScreenState extends State<OcrImportScreen> {
  final _api = ApiClient();
  final _importService = ImportService();
  final _picker = ImagePicker();
  final _noteController = TextEditingController();
  final _amountController = TextEditingController();
  final _money = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

  List<dynamic> _accounts = [];
  List<dynamic> _categories = [];
  List<dynamic> _jars = [];

  File? _imageFile;
  String? _accountId;
  String? _categoryId;
  String? _jarId;
  String _type = 'Expense';
  DateTime _date = DateTime.now();

  OcrUploadResult? _result;
  bool _loadingMeta = true;
  bool _uploading = false;
  bool _updating = false;
  bool _confirming = false;
  bool _reviewLocked = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _loadMeta();
  }

  @override
  void dispose() {
    _noteController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _loadMeta() async {
    setState(() {
      _loadingMeta = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _api.get('financial-accounts'),
        _api.get('categories'),
        _api.get('jars'),
      ]);
      final accounts = _parseList(results[0].data, keys: const ['data', 'Data']);
      final categories =
          _parseList(results[1].data, keys: const ['data', 'Data']);
      final jars = _parseList(results[2].data, keys: const ['data', 'Data']);

      String? defaultAccountId;
      for (final acc in accounts) {
        if (acc is Map && (acc['isDefault'] == true || acc['IsDefault'] == true)) {
          defaultAccountId = (acc['id'] ?? acc['Id'])?.toString();
          break;
        }
      }
      defaultAccountId ??= accounts.isNotEmpty && accounts.first is Map
          ? ((accounts.first as Map)['id'] ?? (accounts.first as Map)['Id'])
              ?.toString()
          : null;

      if (!mounted) return;
      setState(() {
        _accounts = accounts;
        _categories = categories;
        _jars = jars;
        _accountId = defaultAccountId;
        _loadingMeta = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingMeta = false;
        _error = 'Không tải được danh sách tài khoản/danh mục.';
      });
    }
  }

  List<dynamic> _parseList(dynamic data, {required List<String> keys}) {
    if (data is List) return data;
    if (data is Map) {
      for (final key in keys) {
        final value = data[key];
        if (value is List) return value;
      }
    }
    return [];
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 2000,
      );
      if (picked == null) return;
      setState(() {
        _imageFile = File(picked.path);
        _result = null;
        _success = null;
        _error = null;
        _reviewLocked = false;
        _amountController.clear();
        _noteController.clear();
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không mở được máy ảnh/thư viện: $e')),
      );
    }
  }

  Future<void> _runOcr() async {
    if (_imageFile == null) {
      setState(() => _error = 'Chọn ảnh hóa đơn trước.');
      return;
    }
    if (_accountId == null || _accountId!.isEmpty) {
      setState(() => _error = 'Chọn tài khoản nhận giao dịch.');
      return;
    }

    setState(() {
      _uploading = true;
      _error = null;
      _success = null;
      _reviewLocked = false;
    });

    try {
      final result = await _importService.uploadReceipt(
        file: _imageFile!,
        financialAccountId: _accountId!,
      );

      if (result.hasDetectedAmount) {
        _amountController.text = result.amount!.toInt().toString();
      } else {
        _amountController.clear();
      }
      _noteController.text = result.note ?? result.merchantName ?? '';
      _categoryId = result.suggestedCategoryId;
      if (result.transactionDate != null) {
        _date = result.transactionDate!;
      }

      if (!mounted) return;
      setState(() {
        _result = result;
        _uploading = false;
        if (result.ocrSuccess == false ||
            (result.status ?? '').toLowerCase() == 'failed') {
          _error = result.ocrError ??
              'OCR chưa nhận diện đủ. Kiểm tra OCR service (:8000) hoặc thử ảnh rõ hơn.';
        }
      });
    } on DioException catch (e) {
      final data = e.response?.data;
      final message = data is Map
          ? (data['message'] ?? data['error'] ?? 'OCR thất bại.').toString()
          : 'OCR thất bại. Kiểm tra kết nối API / OCR service.';
      if (!mounted) return;
      setState(() {
        _uploading = false;
        _error = message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _uploading = false;
        _error = e.toString();
      });
    }
  }

  Future<bool> _saveDraft() async {
    final result = _result;
    if (result == null) return false;
    final amount = _amountController.rawValue;
    if (amount <= 0) {
      setState(() => _error = 'Số tiền phải lớn hơn 0.');
      return false;
    }
    if (_accountId == null || _accountId!.isEmpty) {
      setState(() => _error = 'Chọn tài khoản nhận giao dịch.');
      return false;
    }

    await _importService.updateDraft(
      importJobId: result.importJobId,
      draftId: result.draftId,
      transactionDate: _date,
      amount: amount,
      type: _type,
      note: _noteController.text.trim().isEmpty
          ? null
          : _noteController.text.trim(),
      categoryId: _categoryId,
      jarId: _jarId,
    );
    return true;
  }

  Future<void> _updateDraftOnly() async {
    setState(() {
      _updating = true;
      _error = null;
      _success = null;
    });
    try {
      final ok = await _saveDraft();
      if (!mounted) return;
      setState(() {
        _updating = false;
        if (ok) _success = 'Đã cập nhật bản nháp.';
      });
    } on DioException catch (e) {
      final data = e.response?.data;
      final message = data is Map
          ? (data['message'] ?? data['error'] ?? 'Cập nhật nháp thất bại.')
              .toString()
          : 'Cập nhật nháp thất bại.';
      if (!mounted) return;
      setState(() {
        _updating = false;
        _error = message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _updating = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _confirm() async {
    final result = _result;
    if (result == null) return;

    setState(() {
      _confirming = true;
      _error = null;
      _success = null;
    });

    try {
      final ok = await _saveDraft();
      if (!ok) {
        setState(() => _confirming = false);
        return;
      }

      final message = await _importService.confirmImport(
        importJobId: result.importJobId,
        financialAccountId: _accountId!,
        draftId: result.draftId,
        fromJarId: _jarId,
      );

      AppSettings().triggerDashboardRefresh();
      AppSettings().triggerTransactionsRefresh();

      if (!mounted) return;
      setState(() {
        _confirming = false;
        _reviewLocked = true;
        _success = message;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } on DioException catch (e) {
      final data = e.response?.data;
      final message = data is Map
          ? (data['message'] ?? data['error'] ?? 'Xác nhận thất bại.').toString()
          : 'Xác nhận thất bại.';
      if (!mounted) return;
      setState(() {
        _confirming = false;
        _error = message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _confirming = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _pickDate() async {
    if (_reviewLocked) return;
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked == null) return;
    setState(() {
      _date = DateTime(
        picked.year,
        picked.month,
        picked.day,
        _date.hour,
        _date.minute,
      );
    });
  }

  String _accountLabel(dynamic acc) {
    if (acc is! Map) return 'Tài khoản';
    final name = (acc['name'] ?? acc['Name'] ?? 'Tài khoản').toString();
    final isDefault = acc['isDefault'] == true || acc['IsDefault'] == true;
    return isDefault ? '$name · Mặc định' : name;
  }

  String _selectedAccountName() {
    for (final acc in _accounts) {
      if (acc is Map && (acc['id'] ?? acc['Id'])?.toString() == _accountId) {
        return _accountLabel(acc);
      }
    }
    return 'Chưa chọn tài khoản';
  }

  String _categoryLabel(dynamic item) {
    if (item is! Map) return 'Danh mục';
    return (item['name'] ?? item['Name'] ?? 'Danh mục').toString();
  }

  String _jarLabel(dynamic item) {
    if (item is! Map) return 'Hũ';
    return (item['name'] ?? item['Name'] ?? 'Hũ').toString();
  }

  String _formatMoney(double? value) {
    if (value == null) return 'Chưa nhận diện';
    return _money.format(value);
  }

  String _formatDate(DateTime? value) {
    if (value == null) return 'Chưa nhận diện';
    return DateFormat('dd/MM/yyyy HH:mm').format(value);
  }

  String _statusLabel(String? status) {
    switch ((status ?? '').toLowerCase()) {
      case 'awaitingreview':
      case 'success':
        return 'OCR xong — chờ rà soát';
      case 'completed':
        return 'Đã tạo giao dịch';
      case 'failed':
        return 'Lỗi OCR';
      case 'pending':
        return 'Đang chờ';
      default:
        return status?.isNotEmpty == true ? status! : 'Đã tải lên';
    }
  }

  Color _statusColor(String? status) {
    switch ((status ?? '').toLowerCase()) {
      case 'awaitingreview':
      case 'success':
      case 'completed':
        return BrutalColors.green;
      case 'failed':
        return BrutalColors.destructive.withOpacity(0.2);
      default:
        return BrutalColors.cardBg;
    }
  }

  String _formatFileSize(int? bytes) {
    if (bytes == null || bytes <= 0) return '';
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Widget _infoTile(String label, String value, {String? hint}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BrutalStyles.cardDecorationFlat(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: BrutalStyles.bodyStyle(size: 11, color: BrutalColors.grey)),
          const SizedBox(height: 4),
          Text(value, style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w800)),
          if (hint != null && hint.trim().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(hint,
                style: BrutalStyles.bodyStyle(size: 11, color: BrutalColors.grey)),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateText = DateFormat('dd/MM/yyyy').format(_date);
    final result = _result;
    final busy = _uploading || _updating || _confirming;

    return Scaffold(
      backgroundColor: BrutalColors.bg,
      appBar: AppBar(
        backgroundColor: BrutalColors.cardBg,
        elevation: 0,
        title: Text('Scan AI hóa đơn', style: BrutalStyles.titleStyle(size: 20)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: BrutalColors.ink),
          onPressed: () {
            if (GoRouter.of(context).canPop()) {
              GoRouter.of(context).pop();
            } else {
              GoRouter.of(context).go('/transactions');
            }
          },
        ),
        shape: Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
      ),
      body: _loadingMeta
          ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Tải hóa đơn để tạo bản nháp, rà soát số tiền/ngày/danh mục rồi mới xác nhận như bản web.',
                  style: BrutalStyles.bodyStyle(size: 13, color: BrutalColors.grey),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: BrutalButton(
                        text: 'CHỤP ẢNH',
                        color: BrutalColors.info,
                        onTap: busy ? null : () => _pickImage(ImageSource.camera),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: BrutalButton(
                        text: 'THƯ VIỆN',
                        color: BrutalColors.purple,
                        onTap: busy ? null : () => _pickImage(ImageSource.gallery),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_imageFile != null)
                  Container(
                    height: 220,
                    decoration: BrutalStyles.cardDecoration(),
                    clipBehavior: Clip.antiAlias,
                    child: Image.file(
                      _imageFile!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                    ),
                  )
                else
                  Container(
                    height: 160,
                    alignment: Alignment.center,
                    decoration:
                        BrutalStyles.cardDecoration(color: BrutalColors.lightGrey),
                    child: Text(
                      'Chưa chọn ảnh hóa đơn',
                      style: BrutalStyles.bodyStyle(color: BrutalColors.grey),
                    ),
                  ),
                const SizedBox(height: 16),
                Text('Tài khoản nhận',
                    style: BrutalStyles.bodyStyle(weight: FontWeight.w800)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BrutalStyles.cardDecorationFlat(),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _accountId,
                      hint: const Text('Chọn tài khoản'),
                      items: _accounts.whereType<Map>().map((acc) {
                        final id = (acc['id'] ?? acc['Id'])?.toString() ?? '';
                        return DropdownMenuItem(
                          value: id,
                          child: Text(_accountLabel(acc)),
                        );
                      }).toList(),
                      onChanged: busy || _reviewLocked
                          ? null
                          : (value) => setState(() => _accountId = value),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                BrutalButton(
                  text: _uploading ? 'ĐANG OCR...' : 'QUÉT AI (OCR)',
                  color: BrutalColors.green,
                  onTap: busy || _imageFile == null || _reviewLocked
                      ? null
                      : _runOcr,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BrutalStyles.cardDecorationFlat(
                      color: BrutalColors.alertBg,
                    ),
                    child: Text(
                      _error!,
                      style: BrutalStyles.bodyStyle(
                        color: BrutalColors.destructive,
                        size: 13,
                      ),
                    ),
                  ),
                ],
                if (_success != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _success!,
                    style: BrutalStyles.bodyStyle(color: BrutalColors.successText),
                  ),
                ],
                if (result != null) ...[
                  const SizedBox(height: 20),
                  Text('Kết quả OCR', style: BrutalStyles.titleStyle(size: 16)),
                  const SizedBox(height: 8),
                  Text(
                    'Dữ liệu chỉ là bản nháp — kiểm tra lại trước khi tạo giao dịch thật.',
                    style: BrutalStyles.bodyStyle(size: 12, color: BrutalColors.grey),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BrutalStyles.cardDecorationFlat(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          result.originalFileName ??
                              result.fileName ??
                              'Hóa đơn',
                          style: BrutalStyles.bodyStyle(weight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _selectedAccountName(),
                          style: BrutalStyles.bodyStyle(
                            size: 12,
                            color: BrutalColors.grey,
                          ),
                        ),
                        if (_formatFileSize(result.sizeInBytes).isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            _formatFileSize(result.sizeInBytes),
                            style: BrutalStyles.bodyStyle(
                              size: 12,
                              color: BrutalColors.grey,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _statusColor(result.status),
                        border: BrutalStyles.border,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        _statusLabel(result.status),
                        style: BrutalStyles.bodyStyle(
                          size: 12,
                          weight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 1.55,
                    children: [
                      _infoTile(
                        'Đơn vị bán',
                        (result.merchantName?.trim().isNotEmpty ?? false)
                            ? result.merchantName!
                            : 'Chưa nhận diện',
                      ),
                      _infoTile('Tổng tiền', _formatMoney(result.amount ?? result.total)),
                      _infoTile('Ngày giao dịch', _formatDate(result.transactionDate)),
                      _infoTile(
                        'Danh mục gợi ý',
                        (result.suggestedCategoryName?.trim().isNotEmpty ?? false)
                            ? result.suggestedCategoryName!
                            : 'Chưa nhận diện',
                        hint: result.matchedBy,
                      ),
                    ],
                  ),
                  if (result.subtotal != null || result.discount != null) ...[
                    const SizedBox(height: 10),
                    _infoTile(
                      'Tóm tắt hóa đơn',
                      [
                        if (result.subtotal != null)
                          'Tạm tính: ${_formatMoney(result.subtotal)}',
                        if (result.discount != null)
                          'Giảm: ${_formatMoney(result.discount)}',
                        if (result.total != null)
                          'Tổng: ${_formatMoney(result.total)}',
                      ].join(' · '),
                    ),
                  ],
                  if (result.warnings.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BrutalStyles.cardDecorationFlat(
                        color: BrutalColors.warning.withOpacity(0.25),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Cần kiểm tra lại',
                            style: BrutalStyles.bodyStyle(weight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          ...result.warnings.map(
                            (w) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text('• $w',
                                  style: BrutalStyles.bodyStyle(size: 12)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (result.items.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BrutalStyles.cardDecorationFlat(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dòng hóa đơn',
                            style: BrutalStyles.bodyStyle(weight: FontWeight.w800),
                          ),
                          const SizedBox(height: 8),
                          ...result.items.take(12).map(
                                (item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item.name,
                                          style: BrutalStyles.bodyStyle(size: 13),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _formatMoney(item.amount),
                                        style: BrutalStyles.bodyStyle(
                                          size: 13,
                                          weight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                        ],
                      ),
                    ),
                  ],
                  if ((result.rawText ?? '').trim().isNotEmpty) ...[
                    const SizedBox(height: 12),
                    ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      title: Text(
                        'Xem text OCR thô',
                        style: BrutalStyles.bodyStyle(weight: FontWeight.w800),
                      ),
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BrutalStyles.cardDecorationFlat(
                            color: BrutalColors.lightGrey,
                          ),
                          child: Text(
                            result.rawText!,
                            style: BrutalStyles.bodyStyle(size: 12),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),
                  Text('Rà soát trước khi xác nhận',
                      style: BrutalStyles.titleStyle(size: 16)),
                  const SizedBox(height: 8),
                  Text(
                    'Form này cập nhật bản nháp trước, backend mới tạo giao dịch khi xác nhận.',
                    style: BrutalStyles.bodyStyle(size: 12, color: BrutalColors.grey),
                  ),
                  const SizedBox(height: 12),
                  BrutalCurrencyInput(
                    label: 'Số tiền',
                    hint: 'Nhập nếu AI chưa nhận diện',
                    controller: _amountController,
                  ),
                  const SizedBox(height: 12),
                  Text('Loại giao dịch',
                      style: BrutalStyles.bodyStyle(weight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: BrutalButton(
                          text: 'CHI TIÊU',
                          color: _type == 'Expense'
                              ? BrutalColors.destructive
                              : BrutalColors.cardBg,
                          onTap: _reviewLocked
                              ? null
                              : () => setState(() => _type = 'Expense'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: BrutalButton(
                          text: 'THU NHẬP',
                          color: _type == 'Income'
                              ? BrutalColors.green
                              : BrutalColors.cardBg,
                          onTap: _reviewLocked
                              ? null
                              : () => setState(() => _type = 'Income'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: _pickDate,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BrutalStyles.cardDecorationFlat(),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Ngày giao dịch: $dateText',
                            style: BrutalStyles.bodyStyle(weight: FontWeight.w700),
                          ),
                          Icon(Icons.calendar_today,
                              color: BrutalColors.ink, size: 18),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  BrutalInput(
                    label: 'Ghi chú / Cửa hàng',
                    hint: 'Ví dụ: hóa đơn trà sữa, siêu thị...',
                    controller: _noteController,
                  ),
                  const SizedBox(height: 12),
                  Text('Danh mục',
                      style: BrutalStyles.bodyStyle(weight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BrutalStyles.cardDecorationFlat(),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String?>(
                        isExpanded: true,
                        value: _categoryId,
                        hint: const Text('Chọn danh mục (tuỳ chọn)'),
                        items: [
                          const DropdownMenuItem<String?>(
                            value: null,
                            child: Text('Không chọn'),
                          ),
                          ..._categories.whereType<Map>().map((item) {
                            final id = (item['id'] ?? item['Id'])?.toString();
                            return DropdownMenuItem<String?>(
                              value: id,
                              child: Text(_categoryLabel(item)),
                            );
                          }),
                        ],
                        onChanged: _reviewLocked
                            ? null
                            : (value) => setState(() => _categoryId = value),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text('Hũ nguồn (tuỳ chọn)',
                      style: BrutalStyles.bodyStyle(weight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BrutalStyles.cardDecorationFlat(),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String?>(
                        isExpanded: true,
                        value: _jarId,
                        hint: const Text('Không chọn hũ'),
                        items: [
                          const DropdownMenuItem<String?>(
                            value: null,
                            child: Text('Không chọn'),
                          ),
                          ..._jars.whereType<Map>().map((item) {
                            final id = (item['id'] ?? item['Id'])?.toString();
                            return DropdownMenuItem<String?>(
                              value: id,
                              child: Text(_jarLabel(item)),
                            );
                          }),
                        ],
                        onChanged: _reviewLocked
                            ? null
                            : (value) => setState(() => _jarId = value),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BrutalStyles.cardDecoration(
                      color: BrutalColors.purple,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tóm tắt tạo giao dịch',
                          style: BrutalStyles.bodyStyle(weight: FontWeight.w800),
                        ),
                        const SizedBox(height: 8),
                        Text('Tài khoản: ${_selectedAccountName()}',
                            style: BrutalStyles.bodyStyle(size: 13)),
                        Text(
                          'Số tiền: ${_amountController.rawValue > 0 ? _formatMoney(_amountController.rawValue) : 'Chưa nhập'}',
                          style: BrutalStyles.bodyStyle(size: 13),
                        ),
                        Text(
                          'Loại: ${_type == 'Expense' ? 'Chi tiêu' : 'Thu nhập'}',
                          style: BrutalStyles.bodyStyle(size: 13),
                        ),
                        Text('Ngày: $dateText',
                            style: BrutalStyles.bodyStyle(size: 13)),
                        if (result.draftId != null)
                          Text(
                            'Draft: #${result.draftId!.substring(0, result.draftId!.length.clamp(0, 8))}',
                            style: BrutalStyles.bodyStyle(size: 12),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  BrutalButton(
                    text: _updating ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT NHÁP',
                    color: BrutalColors.cardBg,
                    onTap: busy || _reviewLocked ? null : _updateDraftOnly,
                  ),
                  const SizedBox(height: 10),
                  BrutalButton(
                    text: _confirming
                        ? 'ĐANG XÁC NHẬN...'
                        : 'XÁC NHẬN TẠO GIAO DỊCH',
                    color: BrutalColors.green,
                    onTap: busy || _reviewLocked ? null : _confirm,
                  ),
                  const SizedBox(height: 28),
                ],
              ],
            ),
    );
  }
}
