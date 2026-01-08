# CopilotTools SDK v3.1.0

A comprehensive JavaScript SDK for programmatic management of Copilot.money transactions, categories, tags, budgets, and recurring transactions.

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

## Features

### Core Features

- **Transaction Management**: Update, delete, and search transactions with filters
- **Bulk Operations**: Update categories with progress callbacks and dry-run mode
- **Tag Management**: Create, update, and delete tags
- **Auto-Categorization**: Rule-based categorization with customizable patterns
- **Import/Export**: CSV export and JSON backup/restore
- **Duplicate Detection**: Prevent duplicate transaction creation

### New in v3.1.0

- **Category Management**: Create, update, delete, merge categories with hierarchy support
- **Budget Management**: Get/set budgets, track spending vs budget by category
- **Recurring Transactions**: Full CRUD - create, update, delete recurring rules
- **Analytics**: Spending trends, merchant analysis, anomaly detection, month comparisons
- **Account Management**: Account summaries, list hidden accounts
- **Technical**: Retry logic for network errors, progress callbacks

## Installation

### Method 1: Browser Console (Recommended)

1. Open [Copilot.money](https://app.copilot.money/transactions) in your browser
2. Open the browser console:
   - **Mac**: `Cmd + Option + J`
   - **Windows/Linux**: `Ctrl + Shift + J`
3. Copy the entire contents of `CopilotToolsSDK-v3.1.0.js`
4. Paste into the console and press Enter
5. Verify installation: `CopilotTools.status()`

### Method 2: Bookmarklet

Create a bookmark with the SDK code wrapped in an IIFE for quick loading.

## Quick Start

```javascript
// Check status
CopilotTools.status()

// List available data
CopilotTools.showAccounts()
CopilotTools.showCategories()
CopilotTools.showTags()

// Search transactions
CopilotTools.searchTransactions('Costco')

// Get help
CopilotTools.help()
```

## API Reference

### Transaction Management

#### createTransaction(options)
Create a new transaction.

```javascript
CopilotTools.createTransaction({
  accountName: 'Checking Account',    // Required: partial match supported
  date: '2026-01-08',                 // Required: YYYY-MM-DD format
  name: 'Coffee Shop',                // Required: transaction name
  amount: 5.50,                       // Required: positive number
  categoryName: 'Food & Drink',       // Required for REGULAR type
  type: 'REGULAR',                    // Optional: REGULAR|INCOME|INTERNAL_TRANSFER
  notes: 'Morning coffee',            // Optional
  tagIds: ['tagName1', 'tagName2'],   // Optional: tag names or IDs
  skipDuplicateCheck: false           // Optional: skip duplicate detection
})
```

#### updateTransaction(txId, updates)
Update an existing transaction.

```javascript
CopilotTools.updateTransaction('transactionId', {
  categoryName: 'Groceries',          // Change category
  tagIds: ['Tax Deductible'],         // Set tags (replaces existing)
  notes: 'Updated note',              // Add/update notes
  name: 'New Name',                   // Rename transaction
  isReviewed: true                    // Mark as reviewed
})
```

#### deleteTransaction(txId)
Delete a transaction by ID.

#### searchTransactions(query, options)
Search transactions by name with optional filters.

```javascript
CopilotTools.searchTransactions('Amazon', {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  accountName: 'Checking',
  categoryName: 'Shopping'
})
```

#### findTransactionsByPattern(pattern, options)
Fuzzy search using word matching.

```javascript
// Matches 'Zelle Payment To Doctor Smith'
CopilotTools.findTransactionsByPattern('Zelle Doctor')
```

### Bulk Operations

#### bulkUpdateCategory(pattern, newCategoryName, options)
Update category for all transactions matching a pattern.

```javascript
// Preview changes first
CopilotTools.bulkUpdateCategory('Zelle Payment Doctor', 'Healthcare', {dryRun: true})

// Execute
CopilotTools.bulkUpdateCategory('Zelle Payment Doctor', 'Healthcare')
```

#### bulkAddTag(pattern, tagName, options)
Add a tag to all transactions matching a pattern.

```javascript
CopilotTools.bulkAddTag('Amazon', 'Online Shopping', {dryRun: true})
```

### Tag Management

```javascript
// Create tag
CopilotTools.createTag({name: 'Tax Deductible', colorName: 'GREEN1'})

// Update tag
CopilotTools.updateTag('Tax Deductible', {name: 'Tax 2026', colorName: 'BLUE1'})

// Delete tag
CopilotTools.deleteTag('Old Tag')
```

**Available Colors:** RED1, RED2, ORANGE1, ORANGE2, YELLOW1, YELLOW2, GREEN1, GREEN2, TEAL1, TEAL2, BLUE1, BLUE2, PURPLE1, PURPLE2, PINK1, PINK2, GRAY1, GRAY2, OLIVE1, OLIVE2

### Recurring Transactions (v3.1.0)

```javascript
// Create recurring from a transaction
CopilotTools.createRecurring('transactionId', 'MONTHLY')
// Frequencies: WEEKLY, BIWEEKLY, MONTHLY, ANNUALLY

// Update recurring rule
CopilotTools.updateRecurring('Netflix', {name: 'Netflix Premium', frequency: 'MONTHLY'})

// Delete recurring rule
CopilotTools.deleteRecurring('Old Subscription')

// Get all transactions linked to a recurring
CopilotTools.getRecurringTransactions('Netflix')

// Add transaction to existing recurring
CopilotTools.addTransactionToRecurring('transactionId', 'recurringName')
```

### Category Management (v3.1.0)

```javascript
// Create new category
CopilotTools.createCategory('Coffee Shops', {parentCategory: 'Food & Drink', colorName: 'ORANGE1'})

// Update category
CopilotTools.updateCategory('Coffee Shops', {name: 'Cafes', colorName: 'TEAL1'})

// Delete category
CopilotTools.deleteCategory('Old Category')

// View category hierarchy
CopilotTools.listCategoryHierarchy()

// Merge multiple categories into one
CopilotTools.mergeCategories(['Coffee', 'Tea', 'Cafes'], 'Beverages', {dryRun: true})

// Find uncategorized transactions
CopilotTools.findUncategorized()
```

### Budget Management (v3.1.0)

```javascript
// Get all budgets by month
CopilotTools.getBudgets()

// Set budget for a category
CopilotTools.setBudget('Groceries', 500)

// Get budget status with spending for current month
CopilotTools.getBudgetStatus()  // or getBudgetStatus('2026-01')
// Returns: [{category, budget, spent, remaining, percentUsed}]
```

### Analytics (v3.1.0)

```javascript
// Get spending trend over time
CopilotTools.getSpendingTrend('Groceries', 6)  // Last 6 months
CopilotTools.getSpendingTrend()  // All categories, 6 months

// Analyze top merchants by spend
CopilotTools.getMerchantAnalysis(20)  // Top 20 merchants

// Find unusual transactions (anomaly detection)
CopilotTools.findAnomalies({stdDevMultiple: 2})

// Compare spending between two months
CopilotTools.compareMonths('2025-12', '2026-01')
```

### Account Management (v3.1.0)

```javascript
// Get summary for an account
CopilotTools.getAccountSummary('Checking')
// Returns: {account, type, subtype, transactionCount, totalIncome, totalExpenses}

// List hidden accounts
CopilotTools.listHiddenAccounts()
```

### Auto-Categorization

```javascript
// Get category suggestion for a transaction name
CopilotTools.suggestCategory('Netflix Subscription')
// Returns: {category: 'Subscriptions', confidence: 1.0, matchedRule: {...}}

// Review uncategorized with suggestions
CopilotTools.reviewUncategorized()

// Add custom rule
CopilotTools.addAutoCategorizeRule('starbucks', 'Food & Drink', {priority: 10})

// Apply rules to uncategorized (preview first)
CopilotTools.applyRulesToUncategorized({dryRun: true})
CopilotTools.applyRulesToUncategorized({dryRun: false, minConfidence: 0.5})

// List all rules
CopilotTools.listRules()
```

### Import/Export

```javascript
// Export all data to JSON
var backup = CopilotTools.exportToJSON()

// Download backup file
CopilotTools.downloadBackup()  // Downloads copilot-backup-YYYY-MM-DD.json

// Import from CSV (preview first)
CopilotTools.importFromCSV(csvString, {
  dryRun: true,
  categoryMapping: {'Old Category': 'New Category'},
  accountMapping: {'Old Account': 'New Account'}
})
```

### Duplicate Detection

```javascript
// Check if transaction would be duplicate
CopilotTools.wouldBeDuplicate({
  date: '2026-01-08',
  name: 'Costco',
  amount: 100,
  accountId: 'account-id'
})

// Analyze array before import
var analysis = CopilotTools.analyzeForDuplicates(transactionArray)
CopilotTools.printDuplicateAnalysis(analysis)
```

### Amazon Transaction Matching

```javascript
// Find Amazon transactions
CopilotTools.findAmazonTransactions()

// Match Amazon orders to transactions
var orders = [{date: '2026-01-05', amount: 25.99, orderId: '123-456', itemDescription: 'Book'}]
CopilotTools.matchAmazonOrders(orders)
```

### Batch Create

```javascript
var transactions = [
  {accountName: 'Checking', date: '2026-01-01', name: 'Store A', amount: 50, categoryName: 'Shopping'},
  {accountName: 'Checking', date: '2026-01-02', name: 'Store B', amount: 30, categoryName: 'Shopping'}
];

// Preview first
CopilotTools.batchCreateTransactions(transactions, {dryRun: true})

// Execute with options
CopilotTools.batchCreateTransactions(transactions, {
  dryRun: false,
  stopOnDuplicate: false,  // Continue even if duplicates found
  delayMs: 300             // Rate limiting between API calls
})
```

### Testing Utilities

```javascript
// Find test transactions (containing 'TEST' in name)
CopilotTools.findTestTransactions()

// Delete all test transactions
CopilotTools.deleteTestTransactions()
```

## Constants

```javascript
CopilotTools.COLORS          // Available tag/category colors (includes OLIVE1, OLIVE2)
CopilotTools.TRANSACTION_TYPES  // REGULAR, INCOME, INTERNAL_TRANSFER
CopilotTools.FREQUENCIES     // WEEKLY, BIWEEKLY, MONTHLY, ANNUALLY
```

## Configuration

```javascript
// Adjust rate limiting (default 300ms between API calls)
CopilotTools.config.rateLimit = 500

// Disable verbose logging
CopilotTools.config.verbose = false

// Retry settings for network errors (v3.1.0)
CopilotTools.config.maxRetries = 3    // Number of retries on network error
CopilotTools.config.retryDelay = 1000 // Delay between retries (ms)
```

## Troubleshooting

### SDK Not Loading
- Ensure you're on `app.copilot.money`
- Wait for page to fully load before pasting SDK
- Check for JavaScript errors in console

### 'Account/Category not found' Errors
- Use `showAccounts()` or `showCategories()` to see exact names
- Names are case-sensitive
- Partial matching is supported for accounts

### Rate Limiting
- If operations fail, increase `config.rateLimit`
- Default 300ms delay between API calls

### Cache Not Updated
- Refresh the page to update Apollo cache
- Or navigate to different views to trigger data loading

## Security Notes

- SDK runs in your browser using your authenticated session
- No data is sent to third parties
- Always review operations in `dryRun` mode first
- Test transactions should include 'TEST' in name for easy cleanup

## License

MIT License - Use at your own risk. Not affiliated with Copilot.money.

## Support

For issues or feature requests, please document them with:
1. SDK version (`CopilotTools.VERSION`)
2. Browser and version
3. Error messages from console
4. Steps to reproduce