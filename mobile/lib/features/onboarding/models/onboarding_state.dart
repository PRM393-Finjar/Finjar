class OnboardingState {
  final double monthlyIncome;
  final String occupation;
  final String ageRange;
  final List<String> financialGoals;
  final List<String> spendingChallenges;
  final String? budgetingMethod;
  final bool isLoading;
  final String? error;

  const OnboardingState({
    this.monthlyIncome = 15000000.0,
    this.occupation = '',
    this.ageRange = '',
    this.financialGoals = const [],
    this.spendingChallenges = const [],
    this.budgetingMethod,
    this.isLoading = false,
    this.error,
  });

  OnboardingState copyWith({
    double? monthlyIncome,
    String? occupation,
    String? ageRange,
    List<String>? financialGoals,
    List<String>? spendingChallenges,
    String? budgetingMethod,
    bool? isLoading,
    String? error,
  }) {
    return OnboardingState(
      monthlyIncome: monthlyIncome ?? this.monthlyIncome,
      occupation: occupation ?? this.occupation,
      ageRange: ageRange ?? this.ageRange,
      financialGoals: financialGoals ?? this.financialGoals,
      spendingChallenges: spendingChallenges ?? this.spendingChallenges,
      budgetingMethod: budgetingMethod ?? this.budgetingMethod,
      isLoading: isLoading ?? this.isLoading,
      error: error, // Reset error to null if not passed
    );
  }
}
