import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:finjar_mobile/core/theme/brutal_theme.dart';
import 'package:finjar_mobile/core/network/api_client.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _currentIndex = 0;
  final _apiClient = ApiClient();

  final _monthlyIncomeController = TextEditingController(text: '10000000');
  final _savingTargetController = TextEditingController(text: '3000000');
  String _selectedCurrency = 'VND';
  bool _isLoading = false;

  @override
  void dispose() {
    _pageController.dispose();
    _monthlyIncomeController.dispose();
    _savingTargetController.dispose();
    super.dispose();
  }

  Future<void> _submitOnboarding() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final monthlyIncome = double.tryParse(_monthlyIncomeController.text) ?? 10000000;
      final savingTarget = double.tryParse(_savingTargetController.text) ?? 3000000;

      await _apiClient.post('onboarding', data: {
        'monthlyIncome': monthlyIncome,
        'savingTarget': savingTarget,
        'currency': _selectedCurrency,
      });

      if (mounted) {
        context.go('/dashboard');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể lưu cài đặt. Hãy thử lại.')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BrutalColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header progress indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(3, (index) {
                  return Expanded(
                    child: Container(
                      height: 8,
                      margin: EdgeInsets.only(right: index == 2 ? 0 : 8),
                      decoration: BoxDecoration(
                        color: _currentIndex >= index ? BrutalColors.ink : Colors.white,
                        border: BrutalStyles.border,
                        borderRadius: BorderRadius.circular(9999),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),

              // Steps views
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (index) {
                    setState(() {
                      _currentIndex = index;
                    });
                  },
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    // Step 1: Welcome
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Chào mừng đến với Finjar! 👋',
                          style: BrutalStyles.titleStyle(size: 28),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        BrutalCard(
                          color: BrutalColors.purple,
                          child: Text(
                            'Hãy cùng thiết lập thói quen chi tiêu thông minh với hệ thống Hũ tài chính cá nhân. Chỉ mất chưa đầy 1 phút!',
                            style: BrutalStyles.bodyStyle(size: 14),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                    // Step 2: Currency & Income
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Thu nhập hàng tháng của bạn 💵',
                          style: BrutalStyles.titleStyle(size: 22),
                        ),
                        const SizedBox(height: 16),
                        BrutalInput(
                          label: 'Số tiền thu nhập ước lượng',
                          hint: '10000000',
                          controller: _monthlyIncomeController,
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Đơn vị tiền tệ',
                          style: BrutalStyles.bodyStyle(size: 14, weight: FontWeight.w700),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: BrutalStyles.border,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BrutalStyles.shadowSm],
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedCurrency,
                              isExpanded: true,
                              style: BrutalStyles.bodyStyle(size: 14),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedCurrency = val;
                                  });
                                }
                              },
                              items: const [
                                DropdownMenuItem(value: 'VND', child: Text('VND (đ)')),
                                DropdownMenuItem(value: 'USD', child: Text('USD (\$)')),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    // Step 3: Target savings
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Mục tiêu tiết kiệm 🎯',
                          style: BrutalStyles.titleStyle(size: 22),
                        ),
                        const SizedBox(height: 16),
                        BrutalCard(
                          color: BrutalColors.green,
                          child: Text(
                            'Chúng tôi khuyên bạn nên trích lập ít nhất 20% tổng thu nhập hàng tháng để đưa vào quỹ tích lũy / đầu tư dài hạn.',
                            style: BrutalStyles.bodyStyle(size: 14),
                          ),
                        ),
                        const SizedBox(height: 24),
                        BrutalInput(
                          label: 'Số tiền muốn tiết kiệm mỗi tháng',
                          hint: '3000000',
                          controller: _savingTargetController,
                          keyboardType: TextInputType.number,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Navigation Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentIndex > 0)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: BrutalButton(
                          text: 'QUAY LẠI',
                          color: Colors.white,
                          isFullWidth: true,
                          onTap: () {
                            _pageController.previousPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          },
                        ),
                      ),
                    ),
                  Expanded(
                    child: _isLoading
                        ? Center(child: CircularProgressIndicator(color: BrutalColors.ink))
                        : BrutalButton(
                            text: _currentIndex == 2 ? 'BẮT ĐẦU' : 'TIẾP TỤC',
                            color: BrutalColors.green,
                            isFullWidth: true,
                            onTap: () {
                              if (_currentIndex < 2) {
                                _pageController.nextPage(
                                  duration: const Duration(milliseconds: 300),
                                  curve: Curves.easeInOut,
                                );
                              } else {
                                _submitOnboarding();
                              }
                            },
                          ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
