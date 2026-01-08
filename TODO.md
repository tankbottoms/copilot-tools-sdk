# CopilotTools SDK - Development Roadmap

## Current Version: 3.2.0

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

---

## Completed in v3.2.0

### Transaction Creation
- [x] `createTransaction()` - Full implementation with duplicate detection
- [x] `batchCreateTransactions()` - Batch import with progress callbacks
- [x] Account matching by name (partial) or mask
- [x] Category resolution with case-insensitive fallback
- [x] Tag resolution by name or ID

### CSV Import
- [x] `parseCSV()` - Proper CSV parser with quoted field handling
- [x] `importFromCSV()` - Direct import from Copilot CSV export
- [x] `analyzeCSVForDuplicates()` - Preview before import

### Duplicate Detection
- [x] `wouldBeDuplicate()` - Check for existing transactions
- [x] `findDuplicatesInCache()` - Find duplicates in cache

### Configuration
- [x] `config.dryRun` - Global dry-run mode

---

## Completed in v3.2.0 (Comprehensive)

v3.2.0 includes ALL features - import/export plus full management capabilities.

### All Features Complete
- [x] Transaction CRUD with duplicate detection
- [x] Batch import with CSV support
- [x] Category management (CRUD, hierarchy, merge)
- [x] Budget management (get/set/status)
- [x] Recurring management (CRUD, link transactions)
- [x] Analytics (trends, merchants, anomalies, comparisons)
- [x] Account and tag management
- [x] Global dry-run mode

---

## Previous: Completed in v3.1.0

### Category Management
- [x] `createCategory(name, {parentCategory, colorName})` - Create new categories
- [x] `updateCategory(name, updates)` - Rename, change parent, update color
- [x] `mergeCategories(sourceNames[], targetName, {dryRun})` - Consolidate categories
- [x] `listCategoryHierarchy()` - Display parent/child relationships

### Budget Management
- [x] `getBudgets()` - Retrieve budget settings per category
- [x] `setBudget(categoryName, amount)` - Set monthly budget
- [x] `getBudgetStatus(month)` - Current spend vs budget by category

### Recurring Enhancements
- [x] `updateRecurring(name, updates)` - Modify frequency, name, category
- [x] `deleteRecurring(name)` - Remove recurring rule
- [x] `getRecurringTransactions(name)` - List all linked transactions

### Analytics
- [x] `getSpendingTrend(categoryName, months)` - Spending over time
- [x] `getMerchantAnalysis(limit)` - Top merchants by spend
- [x] `findAnomalies({stdDevMultiple})` - Unusual amounts detection
- [x] `compareMonths(month1, month2)` - Period comparison

### Account Management
- [x] `getAccountSummary(accountName)` - Transaction count, totals
- [x] `listHiddenAccounts()` - Show hidden accounts

### Technical Improvements
- [x] Retry logic for network errors (`_withRetry`)
- [x] Progress callbacks during batch operations (`onProgress`)
- [x] `maxRetries` and `retryDelay` config options

---

## High Priority Features

### Import Enhancements
- [ ] Better CSV parsing with quoted field support
- [ ] Support for different date formats
- [ ] Bank-specific CSV format detection
- [ ] Resume capability for interrupted imports

### Recurring Enhancements
- [ ] `removeTransactionFromRecurring(txId)` - Unlink transaction

### Auto-Categorization
- [ ] Machine learning based suggestions
- [ ] Learn from user corrections
- [ ] Export/import rule sets
- [ ] Rule conflict detection

---

## Chrome Extension Development

### Phase 1: Basic Extension
- [ ] Extension manifest and structure
- [ ] Auto-inject SDK on Copilot.money pages
- [ ] Popup UI with status and quick actions
- [ ] Settings storage (Chrome sync)

### Phase 2: Enhanced UI
- [ ] Sidebar panel for transaction operations
- [ ] Bulk operation wizard
- [ ] Visual category mapper
- [ ] Rule editor interface

### Phase 3: AI Integration
- [ ] Built-in Claude integration for suggestions
- [ ] One-click category optimization
- [ ] Automatic recurring detection
- [ ] Smart duplicate resolution

### Phase 4: Advanced Features
- [ ] Scheduled operations (auto-categorize new transactions)
- [ ] Multi-account sync
- [ ] Custom reports and exports
- [ ] Notification for anomalies

---

## Low Priority / Nice to Have

- [ ] Transaction splitting
- [ ] Receipt image attachment
- [ ] Multi-currency support
- [ ] Goal tracking integration
- [ ] Investment transaction handling
- [ ] Tax report generation
- [ ] Calendar view of transactions
- [ ] Transaction search with natural language

---

## Technical Debt

- [ ] Add TypeScript definitions
- [ ] Unit test coverage
- [x] Error handling improvements (v3.1.0)
- [x] Retry logic for failed API calls (v3.1.0)
- [ ] Cache invalidation handling
- [ ] Documentation generator
- [ ] Minified production build

---

## Known Issues

- Cache may not update after external changes (refresh page)
- Large batch operations may hit rate limits (adjust `config.rateLimit`)
- `createTransaction` not implemented (use Copilot UI for manual entry)

---

## Contributing

1. Test changes thoroughly with `dryRun: true`
2. Document new functions with JSDoc comments
3. Update CHANGELOG.md
4. Increment version number
5. Download backup before major changes