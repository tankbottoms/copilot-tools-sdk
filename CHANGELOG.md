# Changelog

All notable changes to CopilotTools SDK will be documented in this file.

## [3.2.0] - 2026-01-08

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

### Added

#### Transaction Creation
- `createTransaction()` - Fully implemented with account/category resolution and duplicate detection
- `batchCreateTransactions()` - Batch import with progress callbacks, dry-run support, stopOnDuplicate option
- Account matching by name (partial) or mask
- Category resolution with case-insensitive fallback
- Tag resolution by name or ID

#### CSV Import
- `parseCSV()` - Proper CSV parser with quoted field handling
- `importFromCSV()` - Direct import from Copilot CSV export format
- `analyzeCSVForDuplicates()` - Preview import: shows what would be created, duplicates, missing accounts/categories

#### Duplicate Detection
- `wouldBeDuplicate()` - Check if transaction already exists (by date+name+amount+account)
- `findDuplicatesInCache()` - Find existing duplicate transactions in cache

#### Configuration
- `config.dryRun` - Global dry-run mode for all operations

### Changed
- Streamlined SDK focused on import/export workflows
- Removed advanced management features (category/budget/recurring/analytics CRUD) - use Copilot UI for these

### Removed (moved to v3.1.0 archive)
- Category Management (createCategory, updateCategory, mergeCategories, listCategoryHierarchy)
- Budget Management (getBudgets, setBudget, getBudgetStatus)
- Recurring Management (createRecurring, updateRecurring, deleteRecurring, getRecurringTransactions)
- Analytics (getSpendingTrend, getMerchantAnalysis, findAnomalies, compareMonths)
- Account Management (getAccountSummary, listHiddenAccounts)

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
