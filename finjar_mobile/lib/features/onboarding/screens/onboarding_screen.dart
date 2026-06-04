import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/brutal_theme.dart';
import '../../../shared/widgets/brutal_button.dart';
import '../../../shared/widgets/brutal_card.dart';
import '../providers/onboarding_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _currentStep = 1;
  final int _totalSteps = 4;

  // Step 1 controllers/state
  final _incomeController = TextEditingController(text: "15000000");
  String _selectedOccupation = '';
  String _selectedAgeRange = '';

  // Step 2 state
  final List<String> _selectedGoals = [];
  final List<String> _selectedChallenges = [];

  // Step 3 state
  String? _selectedMethod;

  final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: '₫', decimalDigits: 0);

  final List<Map<String, String>> _occupationOptions = [
    {'value': 'student', 'label': 'Học sinh/Sinh viên'},
    {'value': 'office', 'label': 'Nhân viên văn phòng'},
    {'value': 'freelancer', 'label': 'Freelancer'},
    {'value': 'business', 'label': 'Kinh doanh'},
    {'value': 'other', 'label': 'Khác'},
  ];

  final List<Map<String, String>> _ageRangeOptions = [
    {'value': 'under22', 'label': 'Dưới 22'},
    {'value': '22_30', 'label': '22-30'},
    {'value': '30_40', 'label': '30-40'},
    {'value': 'over40', 'label': 'Trên 40'},
  ];

  final List<Map<String, String>> _goalOptions = [
    {'value': 'control_daily', 'label': 'Kiểm soát chi tiêu hàng ngày'},
    {'value': 'save_big', 'label': 'Tiết kiệm mua tài sản lớn'},
    {'value': 'emergency', 'label': 'Xây dựng quỹ khẩn cấp'},
    {'value': 'debt_tuition', 'label': 'Trả nợ / học phí'},
    {'value': 'invest', 'label': 'Đầu tư tương lai'},
  ];

  final List<Map<String, String>> _challengeOptions = [
    {'value': 'impulse', 'label': 'Chi tiêu bốc đồng'},
    {'value': 'forget_log', 'label': 'Quên ghi chép'},
    {'value': 'unstable_income', 'label': 'Thu nhập không ổn định'},
    {'value': 'over_budget', 'label': 'Chi tiêu vượt kế hoạch'},
  ];

  final List<Map<String, String>> _methodOptions = [
    {
      'id': 'SixJars',
      'title': 'Phương pháp 6 Hũ (6 Jars)',
      'desc': 'Chia 6 hũ cố định (17% mỗi hũ) để tối ưu hóa quản lý thu chi.'
    },
    {
      'id': 'Rule503020',
      'title': 'Quy tắc 50/30/20',
      'desc': '50% cho nhu cầu thiết yếu, 30% cho mong muốn, 20% cho tích lũy.'
    },
    {
      'id': 'Custom',
      'title': 'Tự cấu hình (Custom)',
      'desc': 'Bạn tự quyết định tên hũ và tỷ lệ phân bổ ở bước sau.'
    },
  ];

  @override
  void dispose() {
    _incomeController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep == 1) {
      final double? income = double.tryParse(_incomeController.text);
      if (income == null || income <= 0) {
        _showErrorSnackBar('Thu nhập phải lớn hơn 0');
        return;
      }
      if (_selectedOccupation.isEmpty) {
        _showErrorSnackBar('Vui lòng chọn nghề nghiệp');
        return;
      }
      if (_selectedAgeRange.isEmpty) {
        _showErrorSnackBar('Vui lòng chọn độ tuổi');
        return;
      }
      
      ref.read(onboardingProvider.notifier).updateBasicInfo(
            monthlyIncome: income,
            occupation: _selectedOccupation,
            ageRange: _selectedAgeRange,
          );
    } else if (_currentStep == 2) {
      if (_selectedGoals.isEmpty) {
        _showErrorSnackBar('Chọn ít nhất một mục tiêu tài chính');
        return;
      }
      if (_selectedChallenges.isEmpty) {
        _showErrorSnackBar('Chọn ít nhất một thách thức chi tiêu');
        return;
      }

      ref.read(onboardingProvider.notifier).updateGoalsAndChallenges(
            goals: _selectedGoals,
            challenges: _selectedChallenges,
          );
    } else if (_currentStep == 3) {
      if (_selectedMethod == null) {
        _showErrorSnackBar('Vui lòng chọn phương pháp lập ngân sách');
        return;
      }

      ref.read(onboardingProvider.notifier).updateBudgetingMethod(_selectedMethod!);
    }

    setState(() {
      _currentStep++;
    });
  }

  void _prevStep() {
    setState(() {
      _currentStep--;
    });
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: BrutalTheme.red,
      ),
    );
  }

  void _submitOnboarding() async {
    final success = await ref.read(onboardingProvider.notifier).submit();
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Khởi tạo tài chính thành công!'),
          backgroundColor: BrutalTheme.green,
        ),
      );
    }
  }

  List<Map<String, dynamic>> _getPreviewJars(double income, String method) {
    if (method == 'SixJars') {
      final names = [
        "Food & Dining",
        "Shopping",
        "Transportation",
        "Savings",
        "Essentials",
        "Entertainment"
      ];
      return names.map((name) => {
        'name': name,
        'percentage': 17,
        'amount': (income * 17) / 100,
      }).toList();
    } else if (method == 'Rule503020') {
      return [
        {'name': 'Needs', 'percentage': 50, 'amount': income * 0.5},
        {'name': 'Wants', 'percentage': 30, 'amount': income * 0.3},
        {'name': 'Savings/Investments', 'percentage': 20, 'amount': income * 0.2},
      ];
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    final onboardingState = ref.watch(onboardingProvider);
    final double income = double.tryParse(_incomeController.text) ?? 15000000.0;

    return Scaffold(
      backgroundColor: BrutalTheme.onboardingBg,
      body: SafeArea(
        child: Column(
          children: [
            // App Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Finjar Setup',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontSize: 22,
                        ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: BrutalTheme.ink,
                      borderRadius: BorderRadius.circular(9999),
                    ),
                    child: Text(
                      'Bước $_currentStep / $_totalSteps',
                      style: const TextStyle(
                        color: BrutalTheme.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Step Progress Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: List.generate(_totalSteps, (index) {
                  final active = index + 1 <= _currentStep;
                  return Expanded(
                    child: Container(
                      height: 6,
                      margin: EdgeInsets.only(
                        right: index == _totalSteps - 1 ? 0 : 8,
                      ),
                      decoration: BoxDecoration(
                        color: active ? BrutalTheme.green : BrutalTheme.white,
                        borderRadius: BorderRadius.circular(9999),
                        border: Border.all(color: BrutalTheme.ink, width: 1.5),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 20),

            // Scrollable Content area
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    if (onboardingState.error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: BrutalTheme.red, width: 1.5),
                        ),
                        child: Text(
                          onboardingState.error!,
                          style: const TextStyle(
                            color: BrutalTheme.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    BrutalCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_currentStep == 1) _buildStep1(),
                          if (_currentStep == 2) _buildStep2(),
                          if (_currentStep == 3) _buildStep3(),
                          if (_currentStep == 4) _buildStep4(income),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),

            // Navigation Footer
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: const BoxDecoration(
                color: BrutalTheme.white,
                border: Border(
                  top: BorderSide(color: BrutalTheme.ink, width: 2),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back Button
                  if (_currentStep > 1)
                    SizedBox(
                      width: 120,
                      child: BrutalButton(
                        text: 'Quay lại',
                        backgroundColor: BrutalTheme.white,
                        isFullWidth: false,
                        onPressed: _prevStep,
                      ),
                    )
                  else
                    const SizedBox(width: 120),

                  // Next / Submit Button
                  SizedBox(
                    width: 140,
                    child: _currentStep < _totalSteps
                        ? BrutalButton(
                            text: 'Tiếp tục',
                            isFullWidth: false,
                            onPressed: _nextStep,
                          )
                        : BrutalButton(
                            text: 'Xác nhận',
                            isLoading: onboardingState.isLoading,
                            isFullWidth: false,
                            onPressed: _submitOnboarding,
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Thông tin cơ bản',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 20),
        ),
        const SizedBox(height: 4),
        const Text(
          'Nhập thu nhập và tình hình công việc hiện tại của bạn.',
          style: TextStyle(color: BrutalTheme.grey, fontSize: 13),
        ),
        const Divider(height: 24, thickness: 1.5, color: BrutalTheme.ink),

        // Income input
        Text(
          'Thu nhập hàng tháng (VND)',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: _incomeController,
          keyboardType: TextInputType.number,
          style: const TextStyle(fontWeight: FontWeight.bold, color: BrutalTheme.ink),
          decoration: const InputDecoration(
            hintText: 'Nhập số tiền...',
          ),
          onChanged: (val) {
            setState(() {}); // refresh VND live preview
          },
        ),
        const SizedBox(height: 4),
        Text(
          currencyFormatter.format(double.tryParse(_incomeController.text) ?? 0),
          style: const TextStyle(color: BrutalTheme.grey, fontWeight: FontWeight.bold, fontSize: 12),
        ),
        const SizedBox(height: 16),

        // Occupation select
        Text(
          'Nghề nghiệp / Tình hình',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        _buildDropdown(
          value: _selectedOccupation,
          items: _occupationOptions,
          hint: '-- Chọn nghề nghiệp --',
          onChanged: (val) => setState(() => _selectedOccupation = val ?? ''),
        ),
        const SizedBox(height: 16),

        // Age range select
        Text(
          'Độ tuổi',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        _buildDropdown(
          value: _selectedAgeRange,
          items: _ageRangeOptions,
          hint: '-- Chọn độ tuổi --',
          onChanged: (val) => setState(() => _selectedAgeRange = val ?? ''),
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Mục tiêu & Thách thức',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 20),
        ),
        const SizedBox(height: 4),
        const Text(
          'Hãy chọn các mục tiêu và khó khăn tài chính bạn đang gặp phải.',
          style: TextStyle(color: BrutalTheme.grey, fontSize: 13),
        ),
        const Divider(height: 24, thickness: 1.5, color: BrutalTheme.ink),

        // Financial goals
        Text(
          'Mục tiêu tài chính (Chọn nhiều)',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ..._goalOptions.map((opt) {
          final isChecked = _selectedGoals.contains(opt['value']);
          return _buildCheckboxRow(
            label: opt['label']!,
            checked: isChecked,
            onTap: () {
              setState(() {
                if (isChecked) {
                  _selectedGoals.remove(opt['value']);
                } else {
                  _selectedGoals.add(opt['value']!);
                }
              });
            },
          );
        }),
        const SizedBox(height: 20),

        // Spending challenges
        Text(
          'Thói quen / Thách thức chi tiêu (Chọn nhiều)',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ..._challengeOptions.map((opt) {
          final isChecked = _selectedChallenges.contains(opt['value']);
          return _buildCheckboxRow(
            label: opt['label']!,
            checked: isChecked,
            onTap: () {
              setState(() {
                if (isChecked) {
                  _selectedChallenges.remove(opt['value']);
                } else {
                  _selectedChallenges.add(opt['value']!);
                }
              });
            },
          );
        }),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Phương pháp lập ngân sách',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 20),
        ),
        const SizedBox(height: 4),
        const Text(
          'Chọn một phương pháp để phân bổ thu nhập tự động.',
          style: TextStyle(color: BrutalTheme.grey, fontSize: 13),
        ),
        const Divider(height: 24, thickness: 1.5, color: BrutalTheme.ink),

        ..._methodOptions.map((opt) {
          final isSelected = _selectedMethod == opt['id'];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: Material(
              color: isSelected ? BrutalTheme.purple.withOpacity(0.3) : BrutalTheme.white,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: () => setState(() => _selectedMethod = opt['id']),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: BrutalTheme.ink,
                      width: isSelected ? 2.5 : 1.5,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                            color: BrutalTheme.ink,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            opt['title']!,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: BrutalTheme.ink,
                              fontSize: 15,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        opt['desc']!,
                        style: const TextStyle(
                          color: BrutalTheme.grey,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildStep4(double income) {
    final jars = _getPreviewJars(income, _selectedMethod ?? '');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Xem lại & Xác nhận',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 20),
        ),
        const SizedBox(height: 4),
        const Text(
          'Bảng phân bổ hũ dự kiến theo thu nhập hàng tháng.',
          style: TextStyle(color: BrutalTheme.grey, fontSize: 13),
        ),
        const Divider(height: 24, thickness: 1.5, color: BrutalTheme.ink),

        if (_selectedMethod == 'Custom') ...[
          const Text(
            'Bạn đã chọn phương pháp Tùy chỉnh (Custom).',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 8),
          const Text(
            'Bạn có thể tự do tạo và tùy chỉnh tỷ lệ phần trăm của các hũ chi tiêu trong ứng dụng sau bước khảo sát này.',
            style: TextStyle(color: BrutalTheme.grey, fontSize: 13),
          ),
        ] else ...[
          Text(
            'Gợi ý hũ (${_selectedMethod == 'SixJars' ? '6 Hũ' : 'Quy tắc 50/30/20'}):',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 12),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: jars.length,
            itemBuilder: (context, index) {
              final jar = jars[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: BrutalTheme.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: BrutalTheme.ink, width: 1.5),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '• ${jar['name']} (${jar['percentage']}%)',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      currencyFormatter.format(jar['amount']),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
        const SizedBox(height: 16),
        RichText(
          text: TextSpan(
            style: const TextStyle(color: BrutalTheme.grey, fontSize: 13),
            children: [
              const TextSpan(text: 'Dựa trên thu nhập: '),
              TextSpan(
                text: currencyFormatter.format(income),
                style: const TextStyle(fontWeight: FontWeight.bold, color: BrutalTheme.ink),
              ),
              const TextSpan(text: ' / tháng.'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String value,
    required List<Map<String, String>> items,
    required String hint,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: BrutalTheme.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BrutalTheme.ink, width: 2),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value.isEmpty ? null : value,
          hint: Text(hint, style: const TextStyle(color: BrutalTheme.grey, fontSize: 14)),
          isExpanded: true,
          icon: const Icon(Icons.arrow_drop_down, color: BrutalTheme.ink),
          dropdownColor: BrutalTheme.white,
          onChanged: onChanged,
          items: items.map((opt) {
            return DropdownMenuItem<String>(
              value: opt['value'],
              child: Text(
                opt['label']!,
                style: const TextStyle(color: BrutalTheme.ink, fontWeight: FontWeight.w600, fontSize: 14),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildCheckboxRow({
    required String label,
    required bool checked,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: checked ? BrutalTheme.green : BrutalTheme.white,
                border: Border.all(color: BrutalTheme.ink, width: 2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: checked
                  ? const Icon(Icons.check, size: 14, color: BrutalTheme.ink)
                  : null,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
