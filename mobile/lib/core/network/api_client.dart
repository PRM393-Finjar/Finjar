import 'package:dio/dio.dart';
import 'package:finjar_mobile/core/config/env.dart';
import 'package:finjar_mobile/core/mock/mock_api_handler.dart';
import 'package:finjar_mobile/core/storage/secure_storage.dart';

class ApiClient {
  late final Dio dio;
  final MockApiHandler? _mockHandler = Env.useMockData ? MockApiHandler() : null;

  ApiClient() {
    String baseUrl = Env.apiBaseUrl;
    if (!baseUrl.endsWith('/')) {
      baseUrl = '$baseUrl/';
    }

    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            // Handle auto-logout on 401 Unauthorized
            await SecureStorage.clearSession();
          }
          return handler.next(e);
        },
      ),
    );
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    if (_mockHandler != null) {
      return _mockHandler!.handle(method: 'GET', path: path, queryParameters: queryParameters);
    }
    return dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    if (_mockHandler != null) {
      return _mockHandler!.handle(method: 'POST', path: path, data: data, queryParameters: queryParameters);
    }
    return dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    if (_mockHandler != null) {
      return _mockHandler!.handle(method: 'PUT', path: path, data: data, queryParameters: queryParameters);
    }
    return dio.put(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> patch(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    if (_mockHandler != null) {
      return _mockHandler!.handle(method: 'PATCH', path: path, data: data, queryParameters: queryParameters);
    }
    return dio.patch(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    if (_mockHandler != null) {
      return _mockHandler!.handle(method: 'DELETE', path: path, data: data, queryParameters: queryParameters);
    }
    return dio.delete(path, data: data, queryParameters: queryParameters);
  }
}
