import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_error_mapper.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/auth_state.dart';

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    // Setup API Client 401 callback to auto-logout
    ApiClient.onUnauthorized = () {
      logout();
    };
    checkSession();
  }

  // Check if session exists on startup
  Future<void> checkSession() async {
    state = state.copyWith(isLoading: true);
    final token = await SecureStorage.getToken();
    final completed = await SecureStorage.isOnboardingCompleted();
    
    if (token != null) {
      // Try to fetch profile to verify token
      try {
        final response = await apiClient.get(ApiEndpoints.userMe);
        final data = response.data;
        
        final username = data['username'] as String?;
        final email = data['email'] as String?;
        final isOnboardingCompleted = (data['isOnboardingCompleted'] as bool?) ?? completed;
        
        // Update persistent onboarding status if BE changed it
        await SecureStorage.saveOnboardingCompleted(isOnboardingCompleted);

        state = AuthState(
          token: token,
          isOnboardingCompleted: isOnboardingCompleted,
          username: username,
          email: email,
          isLoading: false,
        );
      } catch (_) {
        // Token invalid or network error, let's clear local session if token was invalid
        // If it's a network issue we might want to keep the session, but for safety:
        await SecureStorage.clearAll();
        state = const AuthState();
      }
    } else {
      state = const AuthState(isLoading: false);
    }
  }

  // Login
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await apiClient.post(
        ApiEndpoints.login,
        data: {
          'email': email.trim(),
          'password': password,
        },
      );
      
      final data = response.data;
      final token = data['accessToken'] as String;
      final onboardingCompleted = (data['isOnboardingCompleted'] as bool?) ?? false;
      final username = data['username'] as String?;
      final userEmail = data['email'] as String?;

      await SecureStorage.saveToken(token);
      await SecureStorage.saveOnboardingCompleted(onboardingCompleted);

      state = AuthState(
        token: token,
        isOnboardingCompleted: onboardingCompleted,
        username: username,
        email: userEmail,
        isLoading: false,
      );
      return true;
    } on DioException catch (e) {
      final message = ApiErrorMapper.messageFromDioException(
        e,
        fallback: 'Đăng nhập thất bại. Vui lòng kiểm tra lại.',
      );
      state = state.copyWith(isLoading: false, error: message.toString());
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Đã xảy ra lỗi kết nối.');
      return false;
    }
  }

  // Register
  Future<bool> register({
    required String username,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await apiClient.post(
        ApiEndpoints.register,
        data: {
          'username': username.trim(),
          'email': email.trim(),
          'password': password,
          'firstName': firstName.trim(),
          'lastName': lastName.trim(),
        },
      );

      final data = response.data;
      final token = data['accessToken'] as String;
      final onboardingCompleted = (data['isOnboardingCompleted'] as bool?) ?? false;
      final userEmail = data['email'] as String?;

      await SecureStorage.saveToken(token);
      await SecureStorage.saveOnboardingCompleted(onboardingCompleted);

      state = AuthState(
        token: token,
        isOnboardingCompleted: onboardingCompleted,
        username: username,
        email: userEmail,
        isLoading: false,
      );
      return true;
    } on DioException catch (e) {
      final message = ApiErrorMapper.messageFromDioException(
        e,
        fallback: 'Đăng ký thất bại. Vui lòng kiểm tra lại.',
      );
      state = state.copyWith(isLoading: false, error: message.toString());
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Đã xảy ra lỗi kết nối.');
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      // Best-effort logout call to backend
      await apiClient.post(ApiEndpoints.logout);
    } catch (_) {}
    
    await SecureStorage.clearAll();
    state = const AuthState();
  }

  // Update onboarding status when completed successfully
  Future<void> completeOnboarding() async {
    await SecureStorage.saveOnboardingCompleted(true);
    state = state.copyWith(isOnboardingCompleted: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
