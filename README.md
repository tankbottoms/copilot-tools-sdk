# CopilotTools SDK v3.2.0

A JavaScript SDK for programmatic import and management of Copilot.money transactions.

**Tested with:** [app.copilot.money](https://app.copilot.money) v26.1.8-beta.1214 (Build: 630)

## Features

### Core Features

- **Transaction Creation**: Create transactions with full validation and duplicate detection
- **Batch Import**: Import multiple transactions with progress callbacks
- **CSV Import**: Parse and import Copilot CSV export format
- **Duplicate Detection**: Automatic duplicate checking before creation
- **Dry Run Mode**: Preview all operations before execution
- **Tag Management**: Create and delete tags

### New in v3.2.0

- **createTransaction()**: Fully implemented with account/category resolution and duplicate detection
- **batchCreateTransactions()**: Batch import with progress callbacks, dry-run support
- **parseCSV()**: Proper CSV parser with quoted field handling
- **importFromCSV()**: Direct import from Copilot CSV export format
- **analyzeCSVForDuplicates()**: Preview what would be created/skipped before import
- **findDuplicatesInCache()**: Find existing duplicates in transaction cache
- **config.dryRun**: Global dry-run mode for all operations

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

// Delete tag
CopilotTools.deleteTag('Old Tag')
```

**Available Colors:** RED1, RED2, ORANGE1, ORANGE2, YELLOW1, YELLOW2, GREEN1, GREEN2, TEAL1, TEAL2, BLUE1, BLUE2, PURPLE1, PURPLE2, PINK1, PINK2, GRAY1, GRAY2, OLIVE1, OLIVE2

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