# CopilotTools SDK - Development Roadmap

## Current Version: 3.0.1

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

---

## High Priority Features

### Category Management
- [ ] `createCategory(name, parentCategory, icon, color)` - Create new categories
- [ ] `updateCategory(name, updates)` - Rename, change parent, update icon/color
- [ ] `mergeCategories(sourceNames[], targetName)` - Consolidate categories
- [ ] `listCategoryHierarchy()` - Display parent/child relationships

### Budget Management
- [ ] `getBudgets()` - Retrieve budget settings per category
- [ ] `setBudget(categoryName, amount)` - Set monthly budget
- [ ] `getBudgetStatus()` - Current spend vs budget by category

### Recurring Enhancements
- [ ] `updateRecurring(id, updates)` - Modify frequency, name
- [ ] `deleteRecurring(id)` - Remove recurring rule
- [ ] `removeTransactionFromRecurring(txId)` - Unlink transaction
- [ ] `getRecurringTransactions(recurringId)` - List all linked transactions

### Import Enhancements
- [ ] Better CSV parsing with quoted field support
- [ ] Support for different date formats
- [ ] Bank-specific CSV format detection
- [ ] Resume capability for interrupted imports
- [ ] Progress callbacks during batch operations

---

## Medium Priority Features

### Analytics
- [ ] `getSpendingTrend(categoryName, months)` - Spending over time
- [ ] `getMerchantAnalysis()` - Top merchants by spend
- [ ] `findAnomalies()` - Unusual amounts, duplicates
- [ ] `compareMonths(month1, month2)` - Period comparison

### Account Management
- [ ] `updateAccount(name, updates)` - Rename, hide/show
- [ ] `getAccountSummary(accountName)` - Balance, transaction count
- [ ] `listHiddenAccounts()` - Show hidden accounts

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
- [ ] Error handling improvements
- [ ] Retry logic for failed API calls
- [ ] Cache invalidation handling
- [ ] Documentation generator
- [ ] Minified production build

---

## Known Issues

- Cache may not update after external changes (refresh page)
- Large batch operations may hit rate limits
- Some mutation field names differ from expected (documented in v3.0.1)

---

## Contributing

1. Test changes thoroughly with `dryRun: true`
2. Document new functions with JSDoc comments
3. Update CHANGELOG.md
4. Increment version number
5. Download backup before major changes