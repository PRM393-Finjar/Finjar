class AuthState {
  final String? token;
  final bool isOnboardingCompleted;
  final String? username;
  final String? email;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.token,
    this.isOnboardingCompleted = false,
    this.username,
    this.email,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    String? token,
    bool? isOnboardingCompleted,
    String? username,
    String? email,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      token: token ?? this.token,
      isOnboardingCompleted: isOnboardingCompleted ?? this.isOnboardingCompleted,
      username: username ?? this.username,
      email: email ?? this.email,
      isLoading: isLoading ?? this.isLoading,
      error: error, // If error is not passed, it resets to null (which is correct for clearing errors)
    );
  }
}
