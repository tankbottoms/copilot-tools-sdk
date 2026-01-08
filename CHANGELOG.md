# Changelog

All notable changes to CopilotTools SDK will be documented in this file.

## [3.3.0] - 2026-01-08

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

### New Features

- `groupAsVacation(name, startDate, endDate, options)` - Tag and add notes to vacation/trip expenses
- `bulkAddTag(transactionIds, tagName, options)` - Add tag to multiple transactions
- `getTransactionsByDateRange(startDate, endDate, options)` - Query transactions by date

### Technical Improvements

- Converted function declarations to expressions for strict mode compatibility
- Fixed double-escaped regex patterns in GraphQL parser
- Removed duplicate code blocks
- Fixed CSV parsing newline handling

---

## [3.2.1] - 2026-01-08

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

### Enhancement

Direct accountId/itemId support for improved performance:

- `createTransaction()` now accepts `accountId` and `itemId` directly (bypasses name lookup)
- `batchCreateTransactions()` accepts `accountId` as alternative to `accountName`
- Both functions remain backwards-compatible with name-based lookups

**Usage:**

```javascript
// Option 1: Use account name (SDK resolves to ID)
createTransaction({accountName: 'Goldman Sachs...', ...})

// Option 2: Use pre-resolved IDs directly (faster)
createTransaction({accountId: 'abc123', itemId: 'xyz789', ...})
```

---

## [3.2.0] - 2026-01-08

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

### Comprehensive SDK Release

Full-featured SDK combining import/export capabilities with complete management features.

#### Transaction Management
- `createTransaction()` - Full implementation with duplicate detection, account/category resolution
- `batchCreateTransactions()` - Batch import with progress callbacks, dry-run support
- `updateTransaction()` / `deleteTransaction()` - Transaction CRUD
- `bulkUpdateCategory()` - Bulk category updates with pattern matching

#### CSV Import
- `parseCSV()` - Proper CSV parser with quoted field handling
- `importFromCSV()` - Direct import from Copilot CSV export
- `analyzeCSVForDuplicates()` - Preview what would be created/skipped

#### Category Management
- `createCategory()` / `updateCategory()` / `deleteCategory()` - Category CRUD
- `listCategoryHierarchy()` - View parent/child structure
- `mergeCategories()` - Consolidate multiple categories into one

#### Budget Management
- `getBudgets()` - All budgets organized by month
- `setBudget()` - Set budget per category
- `getBudgetStatus()` - Spending vs budget with percentages

#### Recurring Management
- `createRecurring()` / `updateRecurring()` / `deleteRecurring()` - Recurring CRUD
- `getRecurringTransactions()` - List transactions linked to recurring
- `addTransactionToRecurring()` - Link transactions to recurring rules

#### Analytics
- `getSpendingTrend()` - Spending over time by category
- `getMerchantAnalysis()` - Top merchants by total spend
- `findAnomalies()` - Detect unusual transaction amounts (statistical)
- `compareMonths()` - Month-over-month comparison by category

#### Account & Tag Management
- `getAccountSummary()` / `listHiddenAccounts()`
- `createTag()` / `updateTag()` / `deleteTag()`

#### Configuration
- `config.dryRun` - Global dry-run mode for all operations
- `config.maxRetries` / `config.retryDelay` - Network retry settings

---

## [3.1.0] - 2026-01-08

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

### Added

#### Category Management
- `createCategory(name, {parentCategory, colorName, isExcluded})` - Create new categories with hierarchy
- `updateCategory(name, {name, colorName, parentCategory})` - Update category properties
- `deleteCategory(name)` - Delete user-created categories
- `listCategoryHierarchy()` - View parent/child category structure
- `mergeCategories(sources[], target, {dryRun})` - Consolidate multiple categories

#### Budget Management
- `getBudgets()` - Retrieve all budget settings by month
- `setBudget(categoryName, amount)` - Set monthly budget for category
- `getBudgetStatus(month)` - Get spending vs budget with percentages

#### Recurring Transactions
- `updateRecurring(name, {name, frequency, categoryName})` - Modify recurring rules
- `deleteRecurring(name)` - Remove recurring rules
- `getRecurringTransactions(name)` - List transactions linked to recurring

#### Analytics
- `getSpendingTrend(categoryName, months)` - Track spending over time
- `getMerchantAnalysis(limit)` - Top merchants by total spend with averages
- `findAnomalies({stdDevMultiple})` - Detect unusual transaction amounts
- `compareMonths(month1, month2)` - Compare spending between periods

#### Account Management
- `getAccountSummary(accountName)` - Transaction counts and totals per account
- `listHiddenAccounts()` - List accounts marked as hidden

#### Technical
- `_withRetry(fn, retries)` - Automatic retry on network errors
- `config.maxRetries` - Configure retry attempts (default: 3)
- `config.retryDelay` - Configure retry delay in ms (default: 1000)
- Progress callbacks via `onProgress` option in bulk operations
- OLIVE1, OLIVE2 added to available colors
- FREQUENCIES constant: WEEKLY, BIWEEKLY, MONTHLY, ANNUALLY

### Changed
- Improved error handling across all mutation functions
- Better transaction lookup performance

---

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
