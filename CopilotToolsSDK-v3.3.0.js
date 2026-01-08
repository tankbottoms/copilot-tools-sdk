/**
 * CopilotTools SDK v3.3.0
 * Comprehensive toolkit for Copilot.money transaction management
 * 
 * FEATURES:
 * - CSV Import with duplicate detection
 * - Transaction CRUD operations
 * - Bulk operations for mass updates
 * - Vacation/trip grouping with tags and notes
 * - Category management and Tag management
 * - Search and filtering
 * - Export and backup
 * 
 * USAGE:
 * 1. Paste this entire script into browser console on app.copilot.money
 * 2. Call CopilotTools.help() to see all available methods
 * 3. Most methods support dryRun mode (default: true) for safe preview
 */

(function() {
  "use strict";

  // Get Apollo Client from React
  var getApolloClient = function() {
    var root = document.getElementById("root");
    if (!root || !root._reactRootContainer) return null;
    var fiberNode = root._reactRootContainer._internalRoot.current;
    while (fiberNode) {
      if (fiberNode.memoizedState && fiberNode.memoizedState.memoizedState) {
        var state = fiberNode.memoizedState.memoizedState;
        if (state.client) return state.client;
      }
      fiberNode = fiberNode.child || fiberNode.sibling || (fiberNode.return ? fiberNode.return.sibling : null);
    }
    return null;
  }

  // GraphQL Mutations
  var MUTATIONS = {
    CreateTransaction: 'mutation CreateTransaction($input: CreateTransactionInput!) { createTransaction(input: $input) { id name amount date category { id name } account { id name } } }',
    EditTransaction: 'mutation EditTransaction($id: ID!, $input: EditTransactionInput!) { editTransaction(id: $id, input: $input) { id name amount date category { id name } account { id name } note isExcluded tags { id name } } }',
    DeleteTransaction: 'mutation DeleteTransaction($id: ID!) { deleteTransaction(id: $id) }',
    CreateTag: 'mutation CreateTag($name: String!) { createTag(input: { name: $name }) { id name } }',
    DeleteTag: 'mutation DeleteTag($id: ID!) { deleteTag(id: $id) }'
  };

  // Parse GraphQL for Apollo
  var gql = function(query) {
    var cleanQuery = query.trim();
    var opMatch = cleanQuery.match(/^(query|mutation)\s+(\w+)/);
    var opName = opMatch ? opMatch[2] : "UnnamedOperation";
    return {
      kind: "Document",
      definitions: [{
        kind: "OperationDefinition",
        operation: opMatch ? opMatch[1] : "query",
        name: { kind: "Name", value: opName },
        variableDefinitions: [],
        directives: [],
        selectionSet: { kind: "SelectionSet", selections: [] }
      }],
      loc: { source: { body: cleanQuery } }
    };
  }

  window.CopilotTools = {
    VERSION: "3.3.0",

    // Logging utilities
    log: function(msg) { console.log("[CopilotTools] " + msg); },
    warn: function(msg) { console.warn("[CopilotTools] " + msg); },
    error: function(msg) { console.error("[CopilotTools] " + msg); },

    // Delay helper
    _delay: function(ms) {
      return new Promise(function(resolve) { setTimeout(resolve, ms); });
    },

    // Retry helper
    _withRetry: function(fn, maxRetries) {
      var self = this;
      maxRetries = maxRetries || 3;
      return fn().catch(function(err) {
        if (maxRetries > 1) {
          return self._delay(500).then(function() {
            return self._withRetry(fn, maxRetries - 1);
          });
        }
        throw err;
      });
    },

    // Build lookup tables for accounts, categories, tags
    buildLookups: function() {
      var client = getApolloClient();
      if (!client) return Promise.reject(new Error("Apollo client not found"));
      var cache = client.cache.extract();
      var lookups = {
        accounts: [], accountsById: {}, accountsByName: {},
        categories: [], categoriesById: {}, categoriesByName: {},
        tags: [], tagsById: {}, tagsByName: {},
        recurrings: [], recurringsById: {}
      };
      Object.keys(cache).forEach(function(key) {
        var obj = cache[key];
        if (!obj || !obj.__typename) return;
        if (obj.__typename === "Account") {
          lookups.accounts.push(obj);
          lookups.accountsById[obj.id] = obj;
          lookups.accountsByName[(obj.name || "").toLowerCase()] = obj;
        } else if (obj.__typename === "Category") {
          lookups.categories.push(obj);
          lookups.categoriesById[obj.id] = obj;
          lookups.categoriesByName[(obj.name || "").toLowerCase()] = obj;
        } else if (obj.__typename === "Tag") {
          lookups.tags.push(obj);
          lookups.tagsById[obj.id] = obj;
          lookups.tagsByName[(obj.name || "").toLowerCase()] = obj;
        } else if (obj.__typename === "Recurring") {
          lookups.recurrings.push(obj);
          lookups.recurringsById[obj.id] = obj;
        }
      });
      return Promise.resolve(lookups);
    },

    // Show all accounts
    showAccounts: function() {
      return this.buildLookups().then(function(l) {
        console.table(l.accounts.map(function(a) {
          return { id: a.id, name: a.name, type: a.type, mask: a.mask };
        }));
        return l.accounts;
      });
    },

    // Show all categories
    showCategories: function() {
      return this.buildLookups().then(function(l) {
        console.table(l.categories.map(function(c) {
          return { id: c.id, name: c.name, icon: c.icon };
        }));
        return l.categories;
      });
    },

    // Show all tags
    showTags: function() {
      return this.buildLookups().then(function(l) {
        console.table(l.tags.map(function(t) {
          return { id: t.id, name: t.name };
        }));
        return l.tags;
      });
    },

    // Show recurring transactions
    showRecurrings: function() {
      return this.buildLookups().then(function(l) {
        console.table(l.recurrings.map(function(r) {
          return { id: r.id, name: r.name, frequency: r.frequency };
        }));
        return l.recurrings;
      });
    },

    // Get all cached transactions
    getCachedTransactions: function() {
      var client = getApolloClient();
      if (!client) return [];
      var cache = client.cache.extract();
      var txns = [];
      Object.keys(cache).forEach(function(key) {
        var obj = cache[key];
        if (obj && obj.__typename === "Transaction" && obj.id) {
          txns.push(obj);
        }
      });
      return txns;
    },

    // Create unique key for duplicate detection
    createTransactionKey: function(date, name, amount) {
      var d = new Date(date);
      var dateStr = d.toISOString().split("T")[0];
      var normName = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 30);
      var normAmount = Math.abs(parseFloat(amount) || 0).toFixed(2);
      return dateStr + "|" + normName + "|" + normAmount;
    },

    // Check if transaction would be a duplicate
    wouldBeDuplicate: function(date, name, amount) {
      var key = this.createTransactionKey(date, name, amount);
      var txns = this.getCachedTransactions();
      var self = this;
      for (var i = 0; i < txns.length; i++) {
        var txKey = self.createTransactionKey(txns[i].date, txns[i].name, txns[i].amount);
        if (txKey === key) return true;
      }
      return false;
    },

    // Find duplicate transactions in cache
    findDuplicatesInCache: function() {
      var txns = this.getCachedTransactions();
      var seen = {};
      var duplicates = [];
      var self = this;
      txns.forEach(function(tx) {
        var key = self.createTransactionKey(tx.date, tx.name, tx.amount);
        if (seen[key]) {
          duplicates.push({ original: seen[key], duplicate: tx });
        } else {
          seen[key] = tx;
        }
      });
      return duplicates;
    },

    // Get date range of cached transactions
    getDateRange: function() {
      var txns = this.getCachedTransactions();
      if (txns.length === 0) return { min: null, max: null, count: 0 };
      var dates = txns.map(function(t) { return new Date(t.date); });
      var min = new Date(Math.min.apply(null, dates));
      var max = new Date(Math.max.apply(null, dates));
      return { min: min.toISOString().split("T")[0], max: max.toISOString().split("T")[0], count: txns.length };
    },

    // Search transactions by various criteria
    searchTransactions: function(query) {
      var txns = this.getCachedTransactions();
      var q = (query || "").toLowerCase();
      return txns.filter(function(tx) {
        var name = (tx.name || "").toLowerCase();
        var catName = tx.category ? (tx.category.name || "").toLowerCase() : "";
        var note = (tx.note || "").toLowerCase();
        return name.indexOf(q) >= 0 || catName.indexOf(q) >= 0 || note.indexOf(q) >= 0;
      });
    },

    // Find specific transaction
    findTransaction: function(name, date, amount) {
      var key = this.createTransactionKey(date, name, amount);
      var txns = this.getCachedTransactions();
      var self = this;
      for (var i = 0; i < txns.length; i++) {
        var txKey = self.createTransactionKey(txns[i].date, txns[i].name, txns[i].amount);
        if (txKey === key) return txns[i];
      }
      return null;
    },

    // Create a single transaction
    createTransaction: function(data, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      // Validate required fields - accept both name-based and ID-based
      var requiredFields = ["date", "name", "amount"];
      var hasAccountId = data.accountId || data.itemId;
      var hasAccountName = data.accountName;
      if (!hasAccountId && !hasAccountName) {
        requiredFields.push("accountName");
      }

      for (var i = 0; i < requiredFields.length; i++) {
        if (!data[requiredFields[i]]) {
          return Promise.resolve({ success: false, error: "Missing required field: " + requiredFields[i] });
        }
      }

      // Check for duplicates
      if (this.wouldBeDuplicate(data.date, data.name, data.amount)) {
        return Promise.resolve({ success: false, error: "Duplicate transaction detected", duplicate: true });
      }

      return this.buildLookups().then(function(lookups) {
        // Resolve account - prefer pre-resolved ID
        var accountId = data.accountId || data.itemId;
        if (!accountId && data.accountName) {
          var account = lookups.accountsByName[data.accountName.toLowerCase()];
          if (!account) {
            return { success: false, error: "Account not found: " + data.accountName };
          }
          accountId = account.id;
        }

        // Resolve category
        var categoryId = data.categoryId;
        if (!categoryId && data.categoryName) {
          var cat = lookups.categoriesByName[data.categoryName.toLowerCase()];
          if (cat) categoryId = cat.id;
        }

        var input = {
          date: data.date,
          name: data.name,
          amount: parseFloat(data.amount),
          itemId: accountId
        };
        if (categoryId) input.categoryId = categoryId;
        if (data.note) input.note = data.note;
        if (data.type) input.type = data.type;

        if (dryRun) {
          self.log("DRY RUN: Would create transaction: " + data.name + " $" + data.amount);
          return { success: true, dryRun: true, input: input };
        }

        var client = getApolloClient();
        return client.mutate({
          mutation: gql(MUTATIONS.CreateTransaction),
          variables: { input: input }
        }).then(function(result) {
          return { success: true, transaction: result.data.createTransaction };
        }).catch(function(err) {
          return { success: false, error: err.message };
        });
      });
    },

    // Batch create transactions
    batchCreateTransactions: function(transactions, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      if (!transactions || transactions.length === 0) {
        return Promise.resolve({ success: false, error: "No transactions provided" });
      }

      // Pre-check for duplicates
      var toCreate = [];
      var duplicates = [];

      transactions.forEach(function(tx) {
        if (self.wouldBeDuplicate(tx.date, tx.name, tx.amount)) {
          duplicates.push(tx);
        } else {
          toCreate.push(tx);
        }
      });

      var results = {
        total: transactions.length,
        toCreate: toCreate.length,
        duplicatesSkipped: duplicates.length,
        dryRun: dryRun
      };

      if (dryRun) {
        self.log("DRY RUN: Would create " + toCreate.length + " transactions, skip " + duplicates.length + " duplicates");
        results.duplicates = duplicates.slice(0, 10);
        return Promise.resolve(results);
      }

      // Create transactions sequentially
      var created = 0;
      var errors = [];
      var chain = Promise.resolve();

      toCreate.forEach(function(tx, idx) {
        chain = chain.then(function() {
          return self._delay(100).then(function() {
            return self.createTransaction(tx, { dryRun: false });
          }).then(function(r) {
            if (r.success) created++;
            else errors.push({ tx: tx, error: r.error });
            if ((idx + 1) % 10 === 0) {
              self.log("Progress: " + (idx + 1) + "/" + toCreate.length);
            }
          });
        });
      });

      return chain.then(function() {
        results.created = created;
        results.errors = errors;
        results.success = errors.length === 0;
        return results;
      });
    },

    // Parse CSV string to objects
    parseCSV: function(csvString) {
      var lines = csvString.trim().split("\n");
      if (lines.length < 2) return [];

      // Parse header
      var headerLine = lines[0];
      var headers = [];
      var inQuote = false;
      var current = "";
      for (var i = 0; i < headerLine.length; i++) {
        var c = headerLine[i];
        if (c === '\\"') {
          inQuote = !inQuote;
        } else if (c === ',' && !inQuote) {
          headers.push(current.toLowerCase().replace(/ /g, "_"));
          current = "";
        } else {
          current += c;
        }
      }
      headers.push(current.toLowerCase().replace(/ /g, "_"));

      // Parse rows
      var results = [];
      for (var rowIdx = 1; rowIdx < lines.length; rowIdx++) {
        var line = lines[rowIdx];
        if (!line.trim()) continue;
        var values = [];
        inQuote = false;
        current = "";
        for (var j = 0; j < line.length; j++) {
          var ch = line[j];
          if (ch === '\\"') {
            inQuote = !inQuote;
          } else if (ch === ',' && !inQuote) {
            values.push(current);
            current = "";
          } else {
            current += ch;
          }
        }
        values.push(current);

        var obj = {};
        for (var k = 0; k < headers.length; k++) {
          obj[headers[k]] = values[k] || "";
        }
        results.push(obj);
      }
      return results;
    },

    // Import transactions from CSV
    importFromCSV: function(csvString, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      var rows = this.parseCSV(csvString);
      if (rows.length === 0) {
        return Promise.resolve({ success: false, error: "No valid rows in CSV" });
      }

      // Map CSV fields to transaction fields
      var transactions = rows.map(function(row) {
        return {
          date: row.date,
          name: row.name,
          amount: parseFloat(row.amount),
          accountName: row.account,
          categoryName: row.category,
          note: row.note || "",
          type: row.type === "Income" ? "INCOME" : (row.type === "Internal Transfer" ? "INTERNAL_TRANSFER" : "REGULAR")
        };
      });

      return this.batchCreateTransactions(transactions, { dryRun: dryRun });
    },

    // Analyze CSV for potential duplicates before import
    analyzeCSVForDuplicates: function(csvString) {
      var rows = this.parseCSV(csvString);
      var self = this;
      var duplicates = [];
      var newTxns = [];

      rows.forEach(function(row) {
        if (self.wouldBeDuplicate(row.date, row.name, parseFloat(row.amount))) {
          duplicates.push(row);
        } else {
          newTxns.push(row);
        }
      });

      return {
        total: rows.length,
        duplicates: duplicates.length,
        new: newTxns.length,
        duplicateList: duplicates.slice(0, 20),
        newList: newTxns.slice(0, 20)
      };
    },

    // Update a transaction
    updateTransaction: function(id, updates, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      if (!id) {
        return Promise.resolve({ success: false, error: "Transaction ID required" });
      }

      return this.buildLookups().then(function(lookups) {
        var input = {};

        if (updates.name !== undefined) input.name = updates.name;
        if (updates.amount !== undefined) input.amount = parseFloat(updates.amount);
        if (updates.date !== undefined) input.date = updates.date;
        if (updates.note !== undefined) input.note = updates.note;
        if (updates.isExcluded !== undefined) input.isExcluded = updates.isExcluded;

        // Handle category by name
        if (updates.categoryName) {
          var cat = lookups.categoriesByName[updates.categoryName.toLowerCase()];
          if (cat) input.categoryId = cat.id;
        }
        if (updates.categoryId) input.categoryId = updates.categoryId;

        // Handle tag operations
        if (updates.addTagId) input.addTagId = updates.addTagId;
        if (updates.removeTagId) input.removeTagId = updates.removeTagId;

        if (dryRun) {
          self.log("DRY RUN: Would update transaction " + id + " with: " + JSON.stringify(input));
          return { success: true, dryRun: true, input: input };
        }

        var client = getApolloClient();
        return client.mutate({
          mutation: gql(MUTATIONS.EditTransaction),
          variables: { id: id, input: input }
        }).then(function(result) {
          return { success: true, transaction: result.data.editTransaction };
        }).catch(function(err) {
          return { success: false, error: err.message };
        });
      });
    },

    // Delete a transaction
    deleteTransaction: function(id, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      if (!id) {
        return Promise.resolve({ success: false, error: "Transaction ID required" });
      }

      if (dryRun) {
        self.log("DRY RUN: Would delete transaction " + id);
        return Promise.resolve({ success: true, dryRun: true });
      }

      var client = getApolloClient();
      return client.mutate({
        mutation: gql(MUTATIONS.DeleteTransaction),
        variables: { id: id }
      }).then(function() {
        return { success: true };
      }).catch(function(err) {
        return { success: false, error: err.message };
      });
    },

    // Bulk update category for multiple transactions
    bulkUpdateCategory: function(transactionIds, categoryName, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      if (!transactionIds || transactionIds.length === 0) {
        return Promise.resolve({ success: false, error: "No transaction IDs provided" });
      }

      return this.buildLookups().then(function(lookups) {
        var cat = lookups.categoriesByName[categoryName.toLowerCase()];
        if (!cat) {
          return { success: false, error: "Category not found: " + categoryName };
        }

        var results = {
          categoryName: categoryName,
          categoryId: cat.id,
          transactionCount: transactionIds.length,
          dryRun: dryRun
        };

        if (dryRun) {
          self.log("DRY RUN: Would update " + transactionIds.length + " transactions to category: " + categoryName);
          return results;
        }

        var updated = 0;
        var errors = [];
        var chain = Promise.resolve();

        transactionIds.forEach(function(txId, idx) {
          chain = chain.then(function() {
            return self._withRetry(function() {
              return self.updateTransaction(txId, { categoryId: cat.id }, { dryRun: false });
            }, 3).then(function(r) {
              if (r.success) updated++;
              else errors.push({ id: txId, error: r.error });
              if ((idx + 1) % 10 === 0) {
                self.log("Progress: " + (idx + 1) + "/" + transactionIds.length);
              }
            }).catch(function(e) {
              errors.push({ id: txId, error: e.message });
            });
          });
        });

        return chain.then(function() {
          results.updated = updated;
          results.errors = errors;
          results.success = errors.length === 0;
          return results;
        });
      });
    },

    // Create a new tag
    createTag: function(name, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      if (!name) {
        return Promise.resolve({ success: false, error: "Tag name required" });
      }

      if (dryRun) {
        self.log("DRY RUN: Would create tag: " + name);
        return Promise.resolve({ success: true, dryRun: true });
      }

      var client = getApolloClient();
      return client.mutate({
        mutation: gql(MUTATIONS.CreateTag),
        variables: { name: name }
      }).then(function(result) {
        return { success: true, tag: result.data.createTag };
      }).catch(function(err) {
        return { success: false, error: err.message };
      });
    },

    // Delete a tag
    deleteTag: function(id, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      if (!id) {
        return Promise.resolve({ success: false, error: "Tag ID required" });
      }

      if (dryRun) {
        self.log("DRY RUN: Would delete tag " + id);
        return Promise.resolve({ success: true, dryRun: true });
      }

      var client = getApolloClient();
      return client.mutate({
        mutation: gql(MUTATIONS.DeleteTag),
        variables: { id: id }
      }).then(function() {
        return { success: true };
      }).catch(function(err) {
        return { success: false, error: err.message };
      });
    },

    // Export all data to JSON
    exportToJSON: function() {
      var self = this;
      return this.buildLookups().then(function(lookups) {
        var txns = self.getCachedTransactions();
        return {
          exportDate: new Date().toISOString(),
          version: self.VERSION,
          accounts: lookups.accounts,
          categories: lookups.categories,
          tags: lookups.tags,
          recurrings: lookups.recurrings,
          transactions: txns
        };
      });
    },

    // Download content as file
    downloadFile: function(content, filename) {
      var blob = new Blob([content], { type: "application/octet-stream" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.log("Downloaded: " + filename);
    },

    // Download full backup
    downloadBackup: function() {
      var self = this;
      return this.exportToJSON().then(function(data) {
        var filename = "copilot-backup-" + new Date().toISOString().split("T")[0] + ".json";
        self.downloadFile(JSON.stringify(data, null, 2), filename);
        return { success: true, filename: filename };
      });
    },

    // Add a tag to multiple transactions
    bulkAddTag: function(transactionIds, tagName, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      if (!transactionIds || transactionIds.length === 0) {
        return Promise.resolve({ success: false, error: "No transaction IDs provided" });
      }

      return this.buildLookups().then(function(lookups) {
        var tag = lookups.tagsByName[tagName.toLowerCase()];
        var tagId = tag ? tag.id : null;

        var results = {
          tagName: tagName,
          tagId: tagId,
          tagExists: !!tag,
          transactionCount: transactionIds.length,
          dryRun: dryRun
        };

        if (dryRun) {
          self.log("DRY RUN: Would add tag to " + transactionIds.length + " transactions");
          return results;
        }

        // Create tag if needed
        var tagPromise = tagId ? Promise.resolve(tagId) : self.createTag(tagName, { dryRun: false }).then(function(r) {
          return r.tag ? r.tag.id : null;
        });

        return tagPromise.then(function(resolvedTagId) {
          if (!resolvedTagId) {
            return { success: false, error: "Failed to create tag" };
          }
          results.tagId = resolvedTagId;

          var updated = 0;
          var errors = [];
          var chain = Promise.resolve();

          transactionIds.forEach(function(txId, idx) {
            chain = chain.then(function() {
              return self._withRetry(function() {
                return self.updateTransaction(txId, { addTagId: resolvedTagId }, { dryRun: false });
              }, 3).then(function(r) {
                if (r.success) updated++;
                else errors.push({ id: txId, error: r.error });
                if ((idx + 1) % 10 === 0) {
                  self.log("Progress: " + (idx + 1) + "/" + transactionIds.length);
                }
              });
            });
          });

          return chain.then(function() {
            results.updated = updated;
            results.errors = errors;
            results.success = errors.length === 0;
            return results;
          });
        });
      });
    },

    // Get transactions within a date range
    getTransactionsByDateRange: function(startDate, endDate, options) {
      options = options || {};
      var txns = this.getCachedTransactions();

      var start = new Date(startDate);
      var end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      var filtered = txns.filter(function(tx) {
        var txDate = new Date(tx.date);
        return txDate >= start && txDate <= end;
      });

      // Sort by date
      filtered.sort(function(a, b) {
        return new Date(a.date) - new Date(b.date);
      });

      // Apply category filters
      if (options.excludeCategory) {
        var excludeCats = Array.isArray(options.excludeCategory) ? options.excludeCategory : [options.excludeCategory];
        filtered = filtered.filter(function(tx) {
          var catName = tx.category ? tx.category.name : "";
          return excludeCats.indexOf(catName) < 0;
        });
      }

      if (options.includeCategory) {
        var includeCats = Array.isArray(options.includeCategory) ? options.includeCategory : [options.includeCategory];
        filtered = filtered.filter(function(tx) {
          var catName = tx.category ? tx.category.name : "";
          return includeCats.indexOf(catName) >= 0;
        });
      }

      return {
        startDate: startDate,
        endDate: endDate,
        count: filtered.length,
        transactions: filtered,
        totalAmount: filtered.reduce(function(sum, tx) { return sum + (tx.amount || 0); }, 0)
      };
    },

    // Find transactions by merchant name pattern
    findByMerchant: function(merchantPattern, options) {
      options = options || {};
      var txns = this.getCachedTransactions();
      var pattern = merchantPattern.toLowerCase();
      var isRegex = options.regex === true;
      var regex = isRegex ? new RegExp(merchantPattern, "i") : null;

      var matches = txns.filter(function(tx) {
        var name = (tx.name || "").toLowerCase();
        if (isRegex) {
          return regex.test(name);
        }
        return name.indexOf(pattern) >= 0;
      });

      // Group by exact name
      var byName = {};
      matches.forEach(function(tx) {
        var name = tx.name || "Unknown";
        if (!byName[name]) {
          byName[name] = { count: 0, total: 0, transactions: [] };
        }
        byName[name].count++;
        byName[name].total += tx.amount || 0;
        byName[name].transactions.push(tx);
      });

      return {
        pattern: merchantPattern,
        matchCount: matches.length,
        totalAmount: matches.reduce(function(sum, tx) { return sum + (tx.amount || 0); }, 0),
        byMerchantName: byName,
        transactions: options.includeTransactions !== false ? matches : undefined
      };
    },

    // Apply same updates to multiple transactions
    bulkUpdate: function(transactionIds, updates, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      if (!transactionIds || transactionIds.length === 0) {
        return Promise.resolve({ success: false, error: "No transaction IDs provided" });
      }

      var results = {
        transactionCount: transactionIds.length,
        updates: updates,
        dryRun: dryRun
      };

      if (dryRun) {
        self.log("DRY RUN: Would update " + transactionIds.length + " transactions");
        results.wouldUpdate = transactionIds.length;
        return Promise.resolve(results);
      }

      var updated = 0;
      var errors = [];
      var chain = Promise.resolve();

      transactionIds.forEach(function(txId, idx) {
        chain = chain.then(function() {
          return self._withRetry(function() {
            return self.updateTransaction(txId, updates, { dryRun: false });
          }, 3).then(function(r) {
            if (r.success) updated++;
            else errors.push({ id: txId, error: r.error });
            if ((idx + 1) % 10 === 0) {
              self.log("Progress: " + (idx + 1) + "/" + transactionIds.length);
            }
          }).catch(function(e) {
            errors.push({ id: txId, error: e.message });
          });
        });
      });

      return chain.then(function() {
        results.updated = updated;
        results.errors = errors;
        results.success = errors.length === 0;
        return results;
      });
    },

    // Group transactions as a vacation/trip
    groupAsVacation: function(vacationName, startDate, endDate, options) {
      options = options || {};
      var dryRun = options.dryRun !== false;
      var self = this;

      // Get transactions in date range
      var rangeResult = this.getTransactionsByDateRange(startDate, endDate, {
        excludeCategory: options.excludeCategory
      });

      var txns = rangeResult.transactions;
      var txIds = txns.map(function(tx) { return tx.id; });

      var results = {
        vacationName: vacationName,
        startDate: startDate,
        endDate: endDate,
        transactionCount: txns.length,
        totalSpend: rangeResult.totalAmount,
        dryRun: dryRun,
        transactions: txns.slice(0, 20).map(function(tx) {
          return { date: tx.date, name: tx.name, amount: tx.amount, category: tx.category ? tx.category.name : null };
        })
      };

      if (txns.length > 20) {
        results.note = "... and " + (txns.length - 20) + " more transactions";
      }

      if (dryRun) {
        self.log("DRY RUN: Would group " + txns.length + " transactions as vacation");
        self.log("Total spend: $" + Math.abs(rangeResult.totalAmount).toFixed(2));
        return Promise.resolve(results);
      }

      // Create tag for vacation
      var tagName = vacationName.replace(/[^a-zA-Z0-9 ]/g, "").trim();

      return self.bulkAddTag(txIds, tagName, { dryRun: false }).then(function(tagResult) {
        results.tagResult = tagResult;

        // Update notes with vacation prefix
        var notePrefix = "[" + vacationName + "] ";
        var chain = Promise.resolve();
        var notesUpdated = 0;

        txns.forEach(function(tx, idx) {
          var currentNote = tx.note || "";
          if (currentNote.indexOf(notePrefix) < 0) {
            var newNote = notePrefix + currentNote;
            chain = chain.then(function() {
              return self._delay(idx * 100).then(function() {
                return self.updateTransaction(tx.id, { note: newNote }, { dryRun: false }).then(function(r) {
                  if (r.success) notesUpdated++;
                });
              });
            });
          }
        });

        return chain.then(function() {
          results.notesUpdated = notesUpdated;
          results.success = true;
          return results;
        });
      });
    },

    // Show SDK status
    status: function() {
      var self = this;
      var txns = this.getCachedTransactions();
      var range = this.getDateRange();
      return this.buildLookups().then(function(l) {
        var status = {
          version: self.VERSION,
          transactions: txns.length,
          dateRange: range,
          accounts: l.accounts.length,
          categories: l.categories.length,
          tags: l.tags.length,
          recurrings: l.recurrings.length
        };
        console.table([status]);
        return status;
      });
    },

    // Show help
    help: function() {
      console.log("%c=== CopilotTools SDK v" + this.VERSION + " ===", "font-size: 16px; font-weight: bold; color: #2563eb;");
      console.log("%cBulk Operations:", "font-weight: bold; color: #059669;");
      console.log("  bulkAddTag(txIds[], tagName, {dryRun})     - Add tag to multiple transactions");
      console.log("  bulkUpdate(txIds[], updates, {dryRun})     - Apply same updates to multiple");
      console.log("  bulkUpdateCategory(txIds[], catName)       - Change category for multiple");
      console.log("  getTransactionsByDateRange(start, end)     - Get transactions in date range");
      console.log("  findByMerchant(pattern, {regex})           - Find by merchant name");
      console.log("  groupAsVacation(name, start, end, opts)    - Tag and note vacation expenses");
      console.log(" ");
      console.log("%cCSV Import:", "font-weight: bold; color: #7c3aed;");
      console.log("  parseCSV(csvString)                        - Parse CSV to objects");
      console.log("  analyzeCSVForDuplicates(csvString)         - Check for duplicates");
      console.log("  importFromCSV(csvString, {dryRun})         - Import from CSV");
      console.log("  batchCreateTransactions(txns[], {dryRun})  - Create multiple transactions");
      console.log(" ");
      console.log("%cTransaction Management:", "font-weight: bold; color: #dc2626;");
      console.log("  searchTransactions(query)                  - Search transactions");
      console.log("  findTransaction(name, date, amount)        - Find specific transaction");
      console.log("  createTransaction(data, {dryRun})          - Create transaction");
      console.log("  updateTransaction(id, updates, {dryRun})   - Update transaction");
      console.log("  deleteTransaction(id, {dryRun})            - Delete transaction");
      console.log(" ");
      console.log("%cLookups & Info:", "font-weight: bold; color: #ca8a04;");
      console.log("  showAccounts() / showCategories() / showTags() / showRecurrings()");
      console.log("  getCachedTransactions() / getDateRange() / status()");
      console.log(" ");
      console.log("%cBackup:", "font-weight: bold; color: #0891b2;");
      console.log("  exportToJSON() / downloadBackup() / downloadFile(content, name)");
      console.log(" ");
      console.log("%cTags:", "font-weight: bold; color: #be185d;");
      console.log("  createTag(name) / deleteTag(id)");
    }
  };

  console.log("%cCopilotTools SDK v3.3.0 loaded!", "color: #059669; font-weight: bold;");
  console.log("Type CopilotTools.help() for available commands");
})();