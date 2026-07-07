import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finjar_mobile/features/transactions/transactions_screen.dart';
import 'package:finjar_mobile/core/network/api_client.dart';
import 'package:finjar_mobile/core/mock/mock_api_handler.dart';
import 'package:dio/dio.dart';

void main() {
  late MockApiHandler mockHandler;
  late ApiClient apiClient;

  setUp(() {
    mockHandler = MockApiHandler();
    apiClient = ApiClient(customMockHandler: mockHandler);
  });

  Widget createWidgetUnderTest() {
    return MaterialApp(
      home: TransactionsScreen(apiClient: apiClient),
    );
  }

  testWidgets('Renders TransactionsScreen and lists mock transactions', (WidgetTester tester) async {
    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pumpAndSettle();

    expect(find.text('Sổ Giao Dịch 📖'), findsOneWidget);
    expect(find.text('Cà phê sáng'), findsOneWidget); 
    expect(find.text('Lương tháng'), findsOneWidget);
  });

  testWidgets('Adds a new expense transaction successfully', (WidgetTester tester) async {
    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    expect(find.text('Thêm giao dịch mới 📝'), findsOneWidget);

    await tester.enterText(find.byType(TextField).first, 'Mua vé xem phim');
    await tester.enterText(find.byType(TextField).last, '100000');

    await tester.tap(find.text('TẠO GIAO DỊCH'));
    await tester.pumpAndSettle();

    expect(find.text('Mua vé xem phim'), findsOneWidget);
  });

  testWidgets('Shows error when INSUFFICIENT_FUNDS', (WidgetTester tester) async {
    mockHandler.interceptor = (method, path, data) {
      if (method == 'POST' && path == 'transactions') {
        throw DioException(
          requestOptions: RequestOptions(path: path),
          response: Response(
            requestOptions: RequestOptions(path: path),
            statusCode: 400,
            data: {'details': {'code': 'INSUFFICIENT_FUNDS'}}
          ),
        );
      }
      return null;
    };

    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'Test Error');
    await tester.enterText(find.byType(TextField).last, '9999999');

    await tester.tap(find.text('TẠO GIAO DỊCH'));
    await tester.pumpAndSettle();

    expect(find.text('Số dư không đủ.'), findsOneWidget);
  });

  testWidgets('Shows error when INVALID_DATE', (WidgetTester tester) async {
    mockHandler.interceptor = (method, path, data) {
      if (method == 'POST' && path == 'transactions') {
        throw DioException(
          requestOptions: RequestOptions(path: path),
          response: Response(
            requestOptions: RequestOptions(path: path),
            statusCode: 400,
            data: {'details': {'code': 'INVALID_DATE'}}
          ),
        );
      }
      return null;
    };

    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'Test Error');
    await tester.enterText(find.byType(TextField).last, '100');

    await tester.tap(find.text('TẠO GIAO DỊCH'));
    await tester.pumpAndSettle();

    expect(find.text('Ngày không hợp lệ.'), findsOneWidget);
  });

  testWidgets('Shows error when transfer from/to same jar', (WidgetTester tester) async {
    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pumpAndSettle();

    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Chuyển'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('TẠO GIAO DỊCH'));
    await tester.pumpAndSettle();

    expect(find.text('Hũ nguồn và hũ đích phải khác nhau!'), findsOneWidget);
  });

  testWidgets('Deletes transaction on swipe', (WidgetTester tester) async {
    await tester.pumpWidget(createWidgetUnderTest());
    await tester.pumpAndSettle();

    expect(find.text('Cà phê sáng'), findsOneWidget);

    await tester.drag(find.text('Cà phê sáng'), const Offset(-500, 0));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(milliseconds: 100)); // Wait for API mock timer

    expect(find.text('Cà phê sáng'), findsNothing);
  });
}
