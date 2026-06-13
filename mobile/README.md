# Finjar Mobile (Flutter)

## Chạy trên Chrome (web)

```bash
flutter pub get
flutter run -d chrome --web-port=5173 --dart-define=API_BASE_URL=http://localhost:5284/api/v1
```

- `--web-port=5173` — trùng port Vite FE, khớp CORS backend
- Cần backend chạy tại `http://localhost:5284` + PostgreSQL

Tài khoản test: `docs/TEST_DATA.md`
