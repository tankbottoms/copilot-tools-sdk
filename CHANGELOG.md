# Changelog

All notable changes to CopilotTools SDK will be documented in this file.

## [3.0.1] - 2026-01-08

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

### Features

- Full transaction CRUD operations (create, read, update, delete)
- Batch transaction creation with duplicate detection
- Tag management (create, update, delete)
- Category management and breakdown analysis
- Recurring transaction support
- Auto-categorization with customizable rules
- Amazon order matching
- CSV import/export
- JSON backup/restore
- Test transaction utilities

### API Reference

- `createTransaction(options)` - Create transactions with full validation
- `batchCreateTransactions(array, options)` - Bulk import with dry-run support
- `updateTransaction(id, updates)` - Modify existing transactions
- `deleteTransaction(id)` - Remove transactions
- `searchTransactions(query, options)` - Search with filters
- `findByCategory(name)` / `findUncategorized()` - Category queries
- `getCategoryBreakdown()` - Spending analysis
- `createTag()` / `updateTag()` / `deleteTag()` - Tag management
- `suggestCategory()` / `addAutoCategorizeRule()` - Auto-categorization
- `matchAmazonOrders()` - Amazon transaction matching
- `importFromCSV()` / `exportToJSON()` / `downloadBackup()` - Import/Export
- `findTestTransactions()` / `deleteTestTransactions()` - Test utilities

### Architecture

- Uses Apollo Client cache for efficient data access
- GraphQL mutations in AST format for transaction operations
- Rate-limited API calls (configurable via `config.rateLimit`)
- Duplicate detection using date/name/amount/account composite key

---

## Version History

Previous development versions (v3.0.1-rewrite, v3.0.2-duplicate) archived in `.versions/` folder. These contained incomplete API rewrites using fetch-based GraphQL string queries instead of Apollo AST mutations.
