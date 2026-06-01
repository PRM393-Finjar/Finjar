import 'package:flutter/material.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({Key? key}) : super(key: key);

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final _apiClient = ApiClient();
  bool _isLoading = false;
  List<dynamic> _categories = [];
  final _newCategoryController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchCategories();
  }

  @override
  void dispose() {
    _newCategoryController.dispose();
    super.dispose();
  }

  Future<void> _fetchCategories() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiClient.get('categories');
      if (response.statusCode == 200) {
        final data = response.data;
        List<dynamic> combined = [];
        if (data is Map) {
          final defaultCats = data['defaultCategories'] ?? data['DefaultCategories'] ?? [];
          final customCats = data['customCategories'] ?? data['CustomCategories'] ?? [];
          combined.addAll(defaultCats);
          combined.addAll(customCats);
        } else if (data is List) {
          combined = data;
        }
        setState(() {
          _categories = combined;
        });
      }
    } catch (e) {
      setState(() {
        _categories = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _addCategory() async {
    final name = _newCategoryController.text.trim();
    if (name.isEmpty) return;

    try {
      final response = await _apiClient.post('categories', data: {
        'name': name,
        'type': 'expense',
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        _newCategoryController.clear();
        _fetchCategories();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thêm danh mục mới thành công!')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể thêm danh mục. Hãy thử lại.')),
      );
    }
  }

  void _confirmDelete(String id, String categoryName) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: BrutalColors.bg,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: BrutalColors.ink, width: 3),
            borderRadius: BorderRadius.all(Radius.circular(20)),
          ),
          title: Text(
            'Xác nhận xóa ⚠️',
            style: BrutalStyles.titleStyle(size: 18),
          ),
          content: Text(
            'Bạn có chắc chắn muốn xóa danh mục "$categoryName" không? Thao tác này không thể hoàn tác.',
            style: BrutalStyles.bodyStyle(size: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Hủy',
                style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700, color: BrutalColors.grey),
              ),
            ),
            BrutalButton(
              text: 'XÓA',
              color: BrutalColors.destructive,
              isFullWidth: false,
              onTap: () {
                Navigator.pop(context);
                _deleteCategory(id);
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteCategory(String id) async {
    try {
      await _apiClient.delete('categories/$id');
      _fetchCategories();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xóa danh mục thành công!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể xóa danh mục này. Hãy thử lại.')),
        );
      }
    }
  }

  void _showEditCategoryDialog(dynamic cat) {
    final editController = TextEditingController(text: cat['name']);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: BrutalColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Chỉnh sửa danh mục 🏷️', style: BrutalStyles.titleStyle(size: 20)),
              const SizedBox(height: 16),
              BrutalInput(
                label: 'Tên danh mục',
                hint: 'Ví dụ: Du lịch, Ăn uống...',
                controller: editController,
              ),
              const SizedBox(height: 24),
              BrutalButton(
                text: 'CẬP NHẬT',
                color: BrutalColors.green,
                onTap: () async {
                  final name = editController.text.trim();
                  if (name.isNotEmpty) {
                    try {
                      await _apiClient.patch('categories/${cat['id']}', data: {
                        'name': name,
                      });
                      _fetchCategories();
                      if (mounted) Navigator.pop(context);
                    } catch (e) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Không thể cập nhật danh mục.')),
                      );
                    }
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrutalColors.bg,
      appBar: AppBar(
        backgroundColor: BrutalColors.cardBg,
        elevation: 0,
        title: Text('Danh Mục Chi Tiêu 🏷️', style: BrutalStyles.titleStyle(size: 20)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: BrutalColors.ink),
          onPressed: () => Navigator.pop(context),
        ),
        shape: Border(bottom: BorderSide(color: BrutalColors.ink, width: 3)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Add Category Widget
            BrutalCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  BrutalInput(
                    label: 'Tạo danh mục mới',
                    hint: 'Ví dụ: Du lịch, Học tập...',
                    controller: _newCategoryController,
                  ),
                  const SizedBox(height: 12),
                  BrutalButton(
                    text: 'THÊM MỚI',
                    color: BrutalColors.purple,
                    onTap: _addCategory,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Text('Danh mục hiện tại', style: BrutalStyles.titleStyle(size: 18)),
            const SizedBox(height: 12),

            Expanded(
              child: _isLoading
                  ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
                  : _categories.isEmpty
                      ? Center(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.all(12),
                            child: BrutalCard(
                              color: BrutalColors.cardBg,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const Text('🏷️', style: TextStyle(fontSize: 48), textAlign: TextAlign.center),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Không tìm thấy danh mục chi tiêu. Vui lòng tạo danh mục mới.',
                                    textAlign: TextAlign.center,
                                    style: BrutalStyles.bodyStyle(size: 14, color: BrutalColors.grey, weight: FontWeight.w700),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: _categories.length,
                          itemBuilder: (context, index) {
                            final cat = _categories[index];
                            final isIncome = cat['type'] == 'income';

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: BrutalCard(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          isIncome ? Icons.trending_up : Icons.trending_down,
                                          color: isIncome ? Colors.green : BrutalColors.destructive,
                                        ),
                                        const SizedBox(width: 12),
                                        Text(
                                          cat['name'] ?? 'Danh mục',
                                          style: BrutalStyles.bodyStyle(size: 15, weight: FontWeight.w800),
                                        ),
                                      ],
                                    ),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: isIncome ? BrutalColors.green : BrutalColors.purple,
                                            border: BrutalStyles.border,
                                            borderRadius: BorderRadius.circular(9999),
                                          ),
                                          child: Text(
                                            isIncome ? 'Thu nhập' : 'Khoản chi',
                                            style: BrutalStyles.bodyStyle(size: 11, weight: FontWeight.w800),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        IconButton(
                                          icon: Icon(Icons.edit_outlined, color: BrutalColors.ink, size: 20),
                                          onPressed: () => _showEditCategoryDialog(cat),
                                        ),
                                        IconButton(
                                          icon: Icon(Icons.delete_outline, color: BrutalColors.destructive, size: 20),
                                          onPressed: () => _confirmDelete(cat['id'], cat['name'] ?? 'Danh mục'),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
