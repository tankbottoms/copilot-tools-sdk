# CopilotTools SDK v3.2.0

A comprehensive JavaScript SDK for programmatic management of all Copilot.money features: transactions, categories, budgets, recurring rules, tags, and analytics.

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

## Features

### Transaction Management
- Create, update, delete transactions with full validation
- Batch import with progress callbacks and dry-run mode
- CSV import from Copilot export format
- Duplicate detection and analysis

### Category Management
- Create, update, delete categories
- Parent/child hierarchy support
- Merge multiple categories into one
- View category hierarchy

### Budget Management
- Get all budgets by month
- Set budgets per category
- Track spending vs budget status

### Recurring Management
- Create recurring rules from transactions
- Update frequency, name, category
- Delete recurring rules
- Link/unlink transactions

### Analytics
- Spending trends over time
- Top merchant analysis
- Anomaly detection (unusual amounts)
- Month-over-month comparisons

### Additional Features
- Tag management (create, update, delete)
- Account summaries and hidden accounts
- JSON export and backup
- Global dry-run mode

## Installation

### Method 1: Browser Console (Recommended)

1. Open [Copilot.money](https://app.copilot.money/transactions) in your browser
2. Open the browser console:
   - **Mac**: `Cmd + Option + J`
   - **Windows/Linux**: `Ctrl + Shift + J`
3. Copy the entire contents of `CopilotToolsSDK-v3.2.0.js`
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

### Bulk Operations

#### bulkUpdateCategory(pattern, newCategoryName, options)
Update category for all transactions matching a pattern.

```javascript
// Preview changes first
CopilotTools.bulkUpdateCategory('Zelle Payment', 'Healthcare', {dryRun: true})

// Execute
CopilotTools.bulkUpdateCategory('Zelle Payment', 'Healthcare')
```

### Batch Create (v3.2.0)

```javascript
var transactions = [
  {accountName: 'Checking', date: '2026-01-01', name: 'Store A', amount: 50, categoryName: 'Shopping'},
  {accountName: 'Checking', date: '2026-01-02', name: 'Store B', amount: 30, categoryName: 'Shopping'}
];

// Preview first (recommended)
CopilotTools.batchCreateTransactions(transactions, {dryRun: true})

// Execute with options
CopilotTools.batchCreateTransactions(transactions, {
  dryRun: false,
  stopOnDuplicate: false,  // Continue even if duplicates found
  delayMs: 300,            // Rate limiting between API calls
  onProgress: function(p) { console.log(p.current + '/' + p.total); }
})
```

### CSV Import (v3.2.0)

Supports Copilot's CSV export format:
`date,name,amount,status,category,parent category,excluded,tags,type,account,account mask,note,recurring`

```javascript
// Parse CSV string to array
var rows = CopilotTools.parseCSV(csvString)

// Analyze before import (see what would be created/skipped)
var analysis = CopilotTools.analyzeCSVForDuplicates(csvString)
// Returns: {total, wouldCreate[], duplicates[], missingAccounts[], missingCategories[], zeroAmount[]}

// Import from CSV
CopilotTools.importFromCSV(csvString, {dryRun: true})  // Preview
CopilotTools.importFromCSV(csvString, {dryRun: false}) // Execute
```

### Duplicate Detection (v3.2.0)

```javascript
// Check if a transaction would be duplicate
CopilotTools.wouldBeDuplicate({
  date: '2026-01-08',
  name: 'Costco',
  amount: 100,
  accountId: 'account-id'
})
// Returns: {isDuplicate: true/false, existingTransaction: {...}}

// Find duplicates already in cache
CopilotTools.findDuplicatesInCache()
// Returns array of {original, duplicate} pairs
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

### Category Management

```javascript
// Create category with optional parent
CopilotTools.createCategory('Coffee Shops', {parentCategory: 'Food & Drink', colorName: 'ORANGE1'})

// Update category
CopilotTools.updateCategory('Coffee Shops', {name: 'Cafes', colorName: 'TEAL1'})

// Delete category
CopilotTools.deleteCategory('Old Category')

// View category hierarchy
CopilotTools.listCategoryHierarchy()

// Merge multiple categories into one
CopilotTools.mergeCategories(['Coffee', 'Tea', 'Cafes'], 'Beverages', {dryRun: true})
```

### Budget Management

```javascript
// Get all budgets by month
CopilotTools.getBudgets()

// Set budget for a category
CopilotTools.setBudget('Groceries', 500)

// Get budget status with spending for current month
CopilotTools.getBudgetStatus()  // or getBudgetStatus('2026-01')
// Returns: [{category, budget, spent, remaining, percentUsed}]
```

### Recurring Management

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

### Analytics

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

### Account Management

```javascript
// Get summary for an account
CopilotTools.getAccountSummary('Checking')
// Returns: {account, type, subtype, transactionCount, totalIncome, totalExpenses}

// List hidden accounts
CopilotTools.listHiddenAccounts()
```

### Export

```javascript
// Export all data to JSON
var backup = CopilotTools.exportToJSON()

// Download backup file
CopilotTools.downloadBackup()  // Downloads copilot-backup-YYYY-MM-DD.json
```

## Constants

```javascript
CopilotTools.COLORS          // Available tag/category colors (includes OLIVE1, OLIVE2)
CopilotTools.TRANSACTION_TYPES  // REGULAR, INCOME, INTERNAL_TRANSFER
CopilotTools.FREQUENCIES     // WEEKLY, BIWEEKLY, MONTHLY, ANNUALLY
```

## Configuration

```javascript
// Enable dry-run mode globally (v3.2.0)
CopilotTools.config.dryRun = true     // Preview all operations without making changes

// Adjust rate limiting (default 300ms between API calls)
CopilotTools.config.rateLimit = 500

// Disable verbose logging
CopilotTools.config.verbose = false

// Retry settings for network errors
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