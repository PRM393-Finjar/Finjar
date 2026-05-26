# Frontend Source Structure (Recommended)

The goal is to clearly separate \app`, `features`, and `shared` to make the codebase easier to scale and maintain.`

## Proposed tree

```txt
src/
  app/
    providers/          # React providers (router, query, theme, store)
    router/             # AppRouter, route guards
    styles/             # global styles, tailwind entry
    App.jsx
    main.jsx

  features/
    auth/
      pages/
      components/
      hooks/
      services/
      store/
      types/
    dashboard/
      pages/
      components/
      services/
      hooks/
    transactions/
      pages/
      components/
      services/
      hooks/
    jars/
      pages/
      components/
      services/
      hooks/
    budget/
      pages/
      components/
      services/
    goals/
      pages/
      components/
      services/
    reports/
      pages/
      components/
      services/
    admin/
      pages/
      components/
      services/

  shared/
    components/         # UI dùng chung, layout, alert, modal...
    constants/          # constants dùng chung toàn app
    hooks/              # hooks dùng chung
    services/           # api client, interceptors
    store/              # global stores
    utils/              # formatters, validators...
    assets/

  legacy/               # tạm thời cho code cũ trong giai đoạn migration
```

## Naming conventions

- Component: `PascalCase.jsx`
- Hook: `useSomething.js`
- Service: `somethingService.js`
- Store: `somethingStore.js`
- Constant: `UPPER_SNAKE_CASE` key trong file `camelCase.js`

## Feature workflow conventions

1. When implementing a new feature, always create a new branch from the main branch.
2. After finishing the feature, push that branch to remote.
3. Open a pull request so the team can review before merge.
