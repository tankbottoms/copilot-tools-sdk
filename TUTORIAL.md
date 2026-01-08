# CopilotTools SDK Tutorial

A comprehensive guide to managing your Copilot.money data with the SDK and AI assistance.

## Table of Contents

1. Exporting Your Transaction History
2. Chunking CSV for AI Processing
3. AI-Powered Category Optimization
4. Importing Optimized Transactions
5. Recurring Transaction Analysis
6. Budget Optimization Workflow

---

## 1. Exporting Your Transaction History

### Method 1: Copilot Native Export

1. Go to Copilot.money > Settings > Export
2. Select date range and download CSV

### Method 2: CopilotTools SDK

```javascript
// Export all cached data
CopilotTools.downloadBackup()
```

---

## 2. Chunking CSV for AI Processing

### Understanding Context Limits

- Claude Chrome Extension: ~30,000 tokens per session
- 1 transaction row: ~50-100 tokens
- Safe chunk size: 200-300 transactions

### Mac/Linux: Split CSV into Chunks

```bash
# Save header
head -1 transactions.csv > header.csv

# Split into 250-line chunks
tail -n +2 transactions.csv | split -l 250 - chunk_

# Add header to each chunk
for f in chunk_*; do
  cat header.csv $f > ${f}.csv
  rm $f
done
```

### Prioritized Processing Order

1. High-frequency merchants (Costco, Amazon, subscriptions)
2. Uncategorized transactions
3. Large transactions (sort by amount)
4. Recent transactions (last 3 months)
5. Historical data

---

## 3. AI-Powered Category Optimization

### Prompt Template for Claude

Copy this prompt and paste your CSV chunk:

```
I have a CSV of financial transactions that need categorization optimization.
Please analyze and suggest:

1. CATEGORY ASSIGNMENTS: For each uncategorized or miscategorized transaction,
   suggest the best category from this list:
   [Groceries, Restaurants, Shopping, Subscriptions, Transportation, 
    Healthcare, Home, Utilities, Entertainment, Travel, Income, Transfer]

2. RECURRING PATTERNS: Identify transactions that appear monthly/weekly
   and should be set up as recurring

3. TAG SUGGESTIONS: Suggest tags like:
   - Tax Deductible (business expenses, medical, charitable)
   - Reimbursable (work expenses)
   - Subscription (recurring services)

4. ANOMALIES: Flag unusual transactions (duplicates, wrong amounts)

Output as JSON array:
[{
  "name": "transaction name",
  "suggestedCategory": "Category",
  "suggestedTags": ["tag1"],
  "isRecurring": true,
  "frequency": "MONTHLY",
  "notes": "any observations"
}]

Here is my transaction data:
[PASTE CSV HERE]
```

### Processing Claude Output

```javascript
// Parse Claude suggestions
var suggestions = JSON.parse(claudeOutput);

// Preview bulk category updates
for (var i = 0; i < suggestions.length; i++) {
  var s = suggestions[i];
  CopilotTools.bulkUpdateCategory(s.name, s.suggestedCategory, {dryRun: true});
}

// Apply after review
CopilotTools.bulkUpdateCategory('Netflix', 'Subscriptions');
CopilotTools.bulkAddTag('Netflix', 'Subscription');
```

---

## 4. Importing Optimized Transactions

### Generate SDK Commands from AI Output

Ask Claude to generate executable SDK commands:

```
Based on your analysis, generate CopilotTools SDK commands to:
1. Update categories for miscategorized transactions
2. Add appropriate tags
3. Create recurring rules

Format as executable JavaScript:
```

### Example Generated Commands

```javascript
// Category updates
CopilotTools.bulkUpdateCategory('COSTCO', 'Groceries');
CopilotTools.bulkUpdateCategory('UBER EATS', 'Restaurants');
CopilotTools.bulkUpdateCategory('NETFLIX', 'Subscriptions');

// Tag additions
CopilotTools.bulkAddTag('COSTCO', 'Groceries');
CopilotTools.bulkAddTag('medical', 'Tax Deductible');

// Create recurring
var netflixTx = CopilotTools.findTransaction('Netflix');
CopilotTools.createRecurring(netflixTx.id, 'MONTHLY');
```

---

## 5. Recurring Transaction Analysis

### Find Potential Recurring Transactions

```javascript
// Get all transactions grouped by name
var txs = CopilotTools.getCachedTransactions();
var byName = {};
txs.forEach(function(tx) {
  var key = tx.name.toLowerCase().trim();
  if (!byName[key]) byName[key] = [];
  byName[key].push(tx);
});

// Find names with 3+ occurrences (potential recurring)
var recurring = [];
for (var name in byName) {
  if (byName[name].length >= 3) {
    recurring.push({name: name, count: byName[name].length});
  }
}
recurring.sort(function(a,b) { return b.count - a.count; });
console.table(recurring.slice(0, 20));
```

### Set Up Recurring from Analysis

```javascript
// For each identified recurring pattern
var tx = CopilotTools.findTransaction('Netflix');
CopilotTools.createRecurring(tx.id, 'MONTHLY');

// Link additional transactions to the recurring
var allNetflix = CopilotTools.searchTransactions('Netflix');
var recurringName = 'Netflix'; // Use the recurring name from showRecurrings()
allNetflix.forEach(function(tx) {
  CopilotTools.addTransactionToRecurring(tx.id, recurringName);
});
```

---

## 6. Budget Optimization Workflow

### Step 1: Analyze Current Spending

```javascript
// Get category breakdown
var breakdown = CopilotTools.getCategoryBreakdown();
console.table(breakdown);

// Export for AI analysis
console.log(JSON.stringify(breakdown, null, 2));
```

### Step 2: AI Budget Analysis Prompt

```
Here is my spending breakdown by category:
[PASTE breakdown JSON]

Please analyze and suggest:
1. Categories that seem too high vs benchmarks
2. Categories that might be miscategorized (inflating totals)
3. Recommended monthly budgets for each category
4. Sub-category structure improvements
```

### Step 3: Implement Budget Recommendations

Based on AI recommendations:

1. **Clean up miscategorized transactions**
   ```javascript
   CopilotTools.bulkUpdateCategory('Walmart Grocery', 'Groceries');
   ```

2. **Review and fix high-value outliers**
   ```javascript
   var highValue = CopilotTools.findByCategory('Shopping');
   highValue.filter(function(tx) { return tx.amount > 500; });
   ```

3. **Set budgets in Copilot UI** (SDK does not manage budgets directly)

---

## Best Practices

### Always Use Dry Run First

```javascript
// Preview before executing
CopilotTools.bulkUpdateCategory('pattern', 'Category', {dryRun: true});

// Review output, then execute
CopilotTools.bulkUpdateCategory('pattern', 'Category', {dryRun: false});
```

### Backup Before Major Changes

```javascript
CopilotTools.downloadBackup(); // Always backup first!
```

### Use Test Prefix for Experiments

```javascript
// Create test transactions
CopilotTools.createTransaction({
  name: 'TEST_Experiment',
  // ... other fields
});

// Easy cleanup
CopilotTools.deleteTestTransactions();
```

### Process in Batches

For large operations, process in smaller batches to avoid rate limiting:

```javascript
// Increase delay if needed
CopilotTools.config.rateLimit = 500; // 500ms between calls
```

---

## Quick Reference: Common Workflows

| Task | Command |
|------|---------|
| Backup data | `CopilotTools.downloadBackup()` |
| Find uncategorized | `CopilotTools.findUncategorized()` |
| Bulk categorize | `CopilotTools.bulkUpdateCategory(pattern, category)` |
| Add tag to many | `CopilotTools.bulkAddTag(pattern, tagName)` |
| Create recurring | `CopilotTools.createRecurring(txId, 'MONTHLY')` |
| Category report | `CopilotTools.getCategoryBreakdown()` |
| Clean test data | `CopilotTools.deleteTestTransactions()` |