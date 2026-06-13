import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/network/api_endpoints.dart';
import 'package:finjar_mobile/core/storage/secure_storage.dart';
import 'package:finjar_mobile/features/onboarding/models/onboarding_state.dart';

class OnboardingNotifier extends StateNotifier<OnboardingState> {
  final ApiClient _apiClient = ApiClient();

  OnboardingNotifier() : super(const OnboardingState());

  void updateBasicInfo({
    required double monthlyIncome,
    required String occupation,
    required String ageRange,
  }) {
    state = state.copyWith(
      monthlyIncome: monthlyIncome,
      occupation: occupation,
      ageRange: ageRange,
    );
  }

  void updateGoalsAndChallenges({
    required List<String> goals,
    required List<String> challenges,
  }) {
    state = state.copyWith(
      financialGoals: goals,
      spendingChallenges: challenges,
    );
  }

  void updateBudgetingMethod(String method) {
    state = state.copyWith(budgetingMethod: method);
  }

  Future<bool> submit() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final payload = {
        'monthlyIncome': state.monthlyIncome.round(),
        'occupationType': state.occupation.trim().isNotEmpty ? state.occupation : null,
        'financialGoalTypes': state.financialGoals,
        'budgetMethodPreference': state.budgetingMethod,
        'ageRange': state.ageRange.trim().isNotEmpty ? state.ageRange : null,
        'spendingChallenges': state.spendingChallenges,
      };

      await _apiClient.post(ApiEndpoints.onboarding, data: payload);
      await SecureStorage.saveOnboardingCompleted(true);

      state = state.copyWith(isLoading: false);
      return true;
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ??
          e.response?.data?['error'] ??
          'Không thể gửi dữ liệu khảo sát. Vui lòng thử lại.';
      state = state.copyWith(isLoading: false, error: message.toString());
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Đã xảy ra lỗi kết nối.');
      return false;
    }
  }
}

final onboardingProvider =
    StateNotifierProvider<OnboardingNotifier, OnboardingState>((ref) {
  return OnboardingNotifier();
});
