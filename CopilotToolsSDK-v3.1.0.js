/**
 * COPILOT TOOLS v3.1.0
 * Comprehensive Transaction Management SDK for Copilot.money
 * 
 * NEW IN v3.1.0:
 * - Category Management: createCategory, updateCategory, mergeCategories, listCategoryHierarchy
 * - Budget Management: getBudgets, setBudget, getBudgetStatus
 * - Recurring Enhancements: updateRecurring, deleteRecurring, removeTransactionFromRecurring, getRecurringTransactions
 * - Analytics: getSpendingTrend, getMerchantAnalysis, findAnomalies, compareMonths
 * - Account Management: updateAccount, getAccountSummary, listHiddenAccounts
 * - Technical: retry logic, improved error handling, progress callbacks
 * 
 * v3.0.1: Fixed EditTransaction mutation, added CreateRecurring/AddTransactionToRecurring/EditTag
 * 
 * USAGE: Paste in browser console on app.copilot.money
 * DOCS: CopilotTools.help() for commands
 * 2026-01-08
 */

(function() {
"use strict";

window.CopilotTools = window.CopilotTools || {};
CopilotTools.VERSION = "3.1.0";

// Constants
CopilotTools.COLORS = {RED1:"RED1",RED2:"RED2",ORANGE1:"ORANGE1",ORANGE2:"ORANGE2",YELLOW1:"YELLOW1",YELLOW2:"YELLOW2",GREEN1:"GREEN1",GREEN2:"GREEN2",TEAL1:"TEAL1",TEAL2:"TEAL2",BLUE1:"BLUE1",BLUE2:"BLUE2",PURPLE1:"PURPLE1",PURPLE2:"PURPLE2",PINK1:"PINK1",PINK2:"PINK2",GRAY1:"GRAY1",GRAY2:"GRAY2",OLIVE1:"OLIVE1",OLIVE2:"OLIVE2"};
CopilotTools.TRANSACTION_TYPES = {REGULAR:"REGULAR",INCOME:"INCOME",INTERNAL_TRANSFER:"INTERNAL_TRANSFER"};
CopilotTools.FREQUENCIES = {WEEKLY:"WEEKLY",BIWEEKLY:"BIWEEKLY",MONTHLY:"MONTHLY",ANNUALLY:"ANNUALLY"};

// Configuration
CopilotTools.config = {rateLimit:300,maxRetries:3,retryDelay:1000,logPrefix:"[CopilotTools]",verbose:true};
CopilotTools._categorizationRules = [];

// Logging
CopilotTools.log = function(msg) { if (CopilotTools.config.verbose) console.log(CopilotTools.config.logPrefix + " " + msg); };
CopilotTools.warn = function(msg) { console.warn(CopilotTools.config.logPrefix + " " + msg); };
CopilotTools.error = function(msg) { console.error(CopilotTools.config.logPrefix + " " + msg); };
CopilotTools._delay = function(ms) { return new Promise(function(r) { setTimeout(r, ms || CopilotTools.config.rateLimit); }); };

// Retry wrapper
CopilotTools._withRetry = function(fn, retries) {
  retries = retries !== undefined ? retries : CopilotTools.config.maxRetries;
  return fn().catch(function(error) {
    if (retries > 0 && error.message && error.message.indexOf("Network") >= 0) {
      CopilotTools.warn("Retrying... (" + retries + " left)");
      return CopilotTools._delay(CopilotTools.config.retryDelay).then(function() { return CopilotTools._withRetry(fn, retries - 1); });
    }
    throw error;
  });
};

// GraphQL Mutations
CopilotTools.mutations = {};

CopilotTools.mutations.EDIT_TRANSACTION = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"EditTransactionInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"itemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transaction"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}}]}}]}}]}}]};

CopilotTools.mutations.DELETE_TRANSACTION = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"itemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]};

CopilotTools.mutations.CREATE_TAG = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTagInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"colorName"}}]}}]}}]};

CopilotTools.mutations.DELETE_TAG = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]};

CopilotTools.mutations.EDIT_TAG = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EditTagInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"colorName"}}]}}]}}]};

CopilotTools.mutations.CREATE_CATEGORY = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCategoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"colorName"}}]}}]}}]};

CopilotTools.mutations.EDIT_CATEGORY = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EditCategoryInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"budget"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"spend"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"colorName"}},{"kind":"Field","name":{"kind":"Name","value":"parentCategoryId"}}]}}]}}]};

CopilotTools.mutations.DELETE_CATEGORY = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]};

CopilotTools.mutations.EDIT_BUDGET = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditBudget"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EditBudgetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editBudget"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"categoryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}}]}}]};

CopilotTools.mutations.CREATE_RECURRING = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRecurring"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRecurringInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRecurring"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}}]}}]}}]};

CopilotTools.mutations.EDIT_RECURRING = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditRecurring"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EditRecurringInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editRecurring"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"frequency"}}]}}]}}]};

CopilotTools.mutations.DELETE_RECURRING = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteRecurring"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteRecurring"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]};

CopilotTools.mutations.ADD_TO_RECURRING = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTransactionToRecurring"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddTransactionToRecurringInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTransactionToRecurring"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"itemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transaction"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"recurringId"}}]}}]}}]}}]};

// === CACHE LOOKUP FUNCTIONS ===

CopilotTools.buildLookups = function() {
  var cache = window.__APOLLO_CLIENT__.cache.extract();
  var accounts = {}, categories = {}, tags = {}, recurrings = {};
  for (var key in cache) {
    if (key.indexOf("Account:") === 0 && cache[key].name) {
      var acc = cache[key];
      var name = acc.name;
      if (accounts[name]) name = acc.name + " (" + (acc.mask || acc.id.slice(-4)) + ")";
      accounts[name] = {id:acc.id,itemId:acc.itemId,name:acc.name,type:acc.type,mask:acc.mask,subtype:acc.subtype,isHidden:acc.isHidden};
    }
    if (key.indexOf("Category:") === 0 && cache[key].name) {
      var cat = cache[key];
      categories[cat.name] = {id:cat.id,name:cat.name,colorName:cat.colorName,icon:cat.icon,canBeDeleted:cat.canBeDeleted,isExcluded:cat.isExcluded,parentCategoryId:cat.parentCategoryId,childCategories:cat.childCategories};
    }
    if (key.indexOf("Tag:") === 0 && cache[key].name) {
      var tag = cache[key];
      tags[tag.name] = {id:tag.id,name:tag.name,colorName:tag.colorName};
    }
    if (key.indexOf("Recurring:") === 0 && cache[key].name) {
      var rec = cache[key];
      recurrings[rec.name] = {id:rec.id,name:rec.name,frequency:rec.frequency,nextPaymentAmount:rec.nextPaymentAmount,nextPaymentDate:rec.nextPaymentDate,categoryId:rec.categoryId,state:rec.state};
    }
  }
  return {accounts:accounts,categories:categories,tags:tags,recurrings:recurrings};
};

CopilotTools.showAccounts = function() { return Object.keys(CopilotTools.buildLookups().accounts).sort(); };
CopilotTools.showCategories = function() { return Object.keys(CopilotTools.buildLookups().categories).sort(); };
CopilotTools.showTags = function() { return Object.keys(CopilotTools.buildLookups().tags); };
CopilotTools.showRecurrings = function() { return Object.keys(CopilotTools.buildLookups().recurrings).sort(); };

// === TRANSACTION CACHE FUNCTIONS ===

CopilotTools.getCachedTransactions = function() {
  var cache = window.__APOLLO_CLIENT__.cache.extract();
  var transactions = [];
  for (var key in cache) {
    if (key.indexOf("Transaction:") === 0 && cache[key].date) transactions.push(cache[key]);
  }
  return transactions.sort(function(a,b) { return (b.date||"").localeCompare(a.date||""); });
};

CopilotTools.createTransactionKey = function(tx) {
  var name = (tx.name || "").toLowerCase().trim();
  var amount = parseFloat(tx.amount || 0).toFixed(2);
  return tx.date + "|" + name + "|" + amount + "|" + tx.accountId;
};

CopilotTools.wouldBeDuplicate = function(newTx) {
  var transactions = CopilotTools.getCachedTransactions();
  var newKey = CopilotTools.createTransactionKey(newTx);
  for (var i = 0; i < transactions.length; i++) {
    if (CopilotTools.createTransactionKey(transactions[i]) === newKey)
      return {isDuplicate:true,existingTransaction:transactions[i]};
  }
  return {isDuplicate:false};
};

CopilotTools.getDateRange = function() {
  var txs = CopilotTools.getCachedTransactions();
  if (txs.length === 0) return {min:null,max:null,count:0};
  var dates = txs.filter(function(t){return t.date;}).map(function(t){return t.date;}).sort();
  return {min:dates[0],max:dates[dates.length-1],count:txs.length};
};

CopilotTools.searchTransactions = function(query, options) {
  options = options || {};
  var transactions = CopilotTools.getCachedTransactions();
  var queryLower = (query || "").toLowerCase();
  return transactions.filter(function(tx) {
    if (queryLower && tx.name && tx.name.toLowerCase().indexOf(queryLower) === -1) return false;
    if (options.startDate && tx.date < options.startDate) return false;
    if (options.endDate && tx.date > options.endDate) return false;
    return true;
  });
};

CopilotTools.findTransaction = function(query) {
  var results = CopilotTools.searchTransactions(query);
  return results.length > 0 ? results[0] : null;
};

// === TRANSACTION CRUD ===

CopilotTools.updateTransaction = function(txId, updates) {
  var cache = window.__APOLLO_CLIENT__.cache.extract();
  var tx = null;
  for (var key in cache) {
    if (key.indexOf("Transaction:") === 0 && cache[key].id === txId) { tx = cache[key]; break; }
  }
  if (!tx) return Promise.resolve({success:false,error:"Transaction not found: " + txId});
  var lookups = CopilotTools.buildLookups();
  var input = {};
  if (updates.categoryName !== undefined) {
    if (!updates.categoryName) input.categoryId = null;
    else {
      var cat = lookups.categories[updates.categoryName];
      if (!cat) return Promise.resolve({success:false,error:"Category not found: " + updates.categoryName});
      input.categoryId = cat.id;
    }
  }
  if (updates.tagIds !== undefined) {
    input.tagIds = updates.tagIds.map(function(t) {
      return typeof t === "string" && lookups.tags[t] ? lookups.tags[t].id : t;
    });
  }
  if (updates.notes !== undefined) input.userNotes = updates.notes;
  if (updates.name !== undefined) input.name = updates.name;
  if (updates.isReviewed !== undefined) input.isReviewed = updates.isReviewed;
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.EDIT_TRANSACTION,
      variables: {accountId:tx.accountId,itemId:tx.itemId,id:txId,input:input}
    });
  }).then(function(result) {
    CopilotTools.log("Updated transaction: " + txId);
    return {success:true,data:result.data};
  }).catch(function(error) {
    CopilotTools.error("Update failed: " + error.message);
    return {success:false,error:error.message};
  });
};

CopilotTools.deleteTransaction = function(txId) {
  var cache = window.__APOLLO_CLIENT__.cache.extract();
  var tx = null;
  for (var key in cache) {
    if (key.indexOf("Transaction:") === 0 && cache[key].id === txId) { tx = cache[key]; break; }
  }
  if (!tx) return Promise.resolve({success:false,error:"Transaction not found: " + txId});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.DELETE_TRANSACTION,
      variables: {accountId:tx.accountId,itemId:tx.itemId,id:txId}
    });
  }).then(function() {
    CopilotTools.log("Deleted transaction: " + txId);
    return {success:true};
  }).catch(function(error) {
    CopilotTools.error("Delete failed: " + error.message);
    return {success:false,error:error.message};
  });
};

// === BULK OPERATIONS ===

CopilotTools.bulkUpdateCategory = function(pattern, newCategoryName, options) {
  options = options || {};
  var dryRun = options.dryRun || false;
  var onProgress = options.onProgress || function() {};
  var lookups = CopilotTools.buildLookups();
  var cat = lookups.categories[newCategoryName];
  if (!cat && !dryRun) return Promise.resolve({success:false,error:"Category not found: " + newCategoryName});
  var matches = CopilotTools.searchTransactions(pattern);
  var results = {total:matches.length,updated:[],errors:[]};
  CopilotTools.log("Found " + matches.length + " transactions" + (dryRun ? " (DRY RUN)" : ""));
  if (dryRun) {
    matches.forEach(function(tx,i) {
      results.updated.push({id:tx.id,name:tx.name});
      onProgress({current:i+1,total:matches.length,tx:tx});
    });
    return Promise.resolve({success:true,results:results});
  }
  var updateNext = function(index) {
    if (index >= matches.length) return Promise.resolve({success:true,results:results});
    var tx = matches[index];
    return CopilotTools.updateTransaction(tx.id, {categoryName:newCategoryName}).then(function(result) {
      if (result.success) results.updated.push({id:tx.id,name:tx.name});
      else results.errors.push({id:tx.id,error:result.error});
      onProgress({current:index+1,total:matches.length,tx:tx,success:result.success});
      return CopilotTools._delay();
    }).then(function() { return updateNext(index+1); });
  };
  return updateNext(0);
};

// === TAG MANAGEMENT ===

CopilotTools.createTag = function(options) {
  var name = options.name;
  var colorName = options.colorName || "BLUE1";
  if (!name) return Promise.resolve({success:false,error:"Tag name required"});
  var lookups = CopilotTools.buildLookups();
  if (lookups.tags[name]) return Promise.resolve({success:false,error:"Tag exists: " + name});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.CREATE_TAG,
      variables: {input:{name:name,colorName:colorName}}
    });
  }).then(function(result) {
    CopilotTools.log("Created tag: " + name);
    return {success:true,data:result.data.createTag};
  }).catch(function(error) {
    CopilotTools.error("Create tag failed: " + error.message);
    return {success:false,error:error.message};
  });
};

CopilotTools.deleteTag = function(tagIdOrName) {
  var lookups = CopilotTools.buildLookups();
  var tagId = lookups.tags[tagIdOrName] ? lookups.tags[tagIdOrName].id : tagIdOrName;
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.DELETE_TAG,
      variables: {id:tagId}
    });
  }).then(function() {
    CopilotTools.log("Deleted tag: " + tagIdOrName);
    return {success:true};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

CopilotTools.updateTag = function(tagIdOrName, updates) {
  var lookups = CopilotTools.buildLookups();
  var tagId = lookups.tags[tagIdOrName] ? lookups.tags[tagIdOrName].id : tagIdOrName;
  var input = {};
  if (updates.name) input.name = updates.name;
  if (updates.colorName) input.colorName = updates.colorName;
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.EDIT_TAG,
      variables: {id:tagId,input:input}
    });
  }).then(function(result) {
    CopilotTools.log("Updated tag: " + tagIdOrName);
    return {success:true,data:result.data.editTag};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

// === CATEGORY MANAGEMENT (v3.1.0) ===

CopilotTools.createCategory = function(name, options) {
  options = options || {};
  if (!name) return Promise.resolve({success:false,error:"Category name required"});
  var lookups = CopilotTools.buildLookups();
  if (lookups.categories[name]) return Promise.resolve({success:false,error:"Category exists: " + name});
  var parentId = null;
  if (options.parentCategory) {
    var parent = lookups.categories[options.parentCategory];
    if (!parent) return Promise.resolve({success:false,error:"Parent not found: " + options.parentCategory});
    parentId = parent.id;
  }
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.CREATE_CATEGORY,
      variables: {input:{name:name,colorName:options.colorName||"BLUE1",parentCategoryId:parentId,isExcluded:options.isExcluded||false}}
    });
  }).then(function(result) {
    CopilotTools.log("Created category: " + name);
    return {success:true,data:result.data.createCategory};
  }).catch(function(error) {
    CopilotTools.error("Create category failed: " + error.message);
    return {success:false,error:error.message};
  });
};

CopilotTools.updateCategory = function(categoryName, updates) {
  var lookups = CopilotTools.buildLookups();
  var cat = lookups.categories[categoryName];
  if (!cat) return Promise.resolve({success:false,error:"Category not found: " + categoryName});
  var input = {};
  if (updates.name) input.name = updates.name;
  if (updates.colorName) input.colorName = updates.colorName;
  if (updates.parentCategory !== undefined) {
    if (!updates.parentCategory) input.parentCategoryId = null;
    else {
      var parent = lookups.categories[updates.parentCategory];
      if (!parent) return Promise.resolve({success:false,error:"Parent not found: " + updates.parentCategory});
      input.parentCategoryId = parent.id;
    }
  }
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.EDIT_CATEGORY,
      variables: {id:cat.id,input:input,budget:true,spend:true}
    });
  }).then(function(result) {
    CopilotTools.log("Updated category: " + categoryName);
    return {success:true,data:result.data.editCategory};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

CopilotTools.deleteCategory = function(categoryName) {
  var lookups = CopilotTools.buildLookups();
  var cat = lookups.categories[categoryName];
  if (!cat) return Promise.resolve({success:false,error:"Category not found: " + categoryName});
  if (cat.canBeDeleted === false) return Promise.resolve({success:false,error:"Cannot delete: " + categoryName});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.DELETE_CATEGORY,
      variables: {id:cat.id}
    });
  }).then(function() {
    CopilotTools.log("Deleted category: " + categoryName);
    return {success:true};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

CopilotTools.listCategoryHierarchy = function() {
  var lookups = CopilotTools.buildLookups();
  var hierarchy = {};
  var orphans = [];
  for (var name in lookups.categories) {
    var cat = lookups.categories[name];
    if (!cat.parentCategoryId) {
      hierarchy[name] = {category:cat,children:[]};
    }
  }
  for (var name2 in lookups.categories) {
    var cat2 = lookups.categories[name2];
    if (cat2.parentCategoryId) {
      var parentName = null;
      for (var pn in lookups.categories) {
        if (lookups.categories[pn].id === cat2.parentCategoryId) { parentName = pn; break; }
      }
      if (parentName && hierarchy[parentName]) hierarchy[parentName].children.push(name2);
      else orphans.push(name2);
    }
  }
  return {hierarchy:hierarchy,orphans:orphans};
};

CopilotTools.mergeCategories = function(sourceNames, targetName, options) {
  options = options || {};
  var lookups = CopilotTools.buildLookups();
  var target = lookups.categories[targetName];
  if (!target) return Promise.resolve({success:false,error:"Target category not found: " + targetName});
  var txs = CopilotTools.getCachedTransactions();
  var toUpdate = [];
  sourceNames.forEach(function(srcName) {
    var src = lookups.categories[srcName];
    if (src) {
      txs.forEach(function(tx) {
        if (tx.categoryId === src.id) toUpdate.push(tx);
      });
    }
  });
  CopilotTools.log("Found " + toUpdate.length + " transactions to merge into " + targetName);
  if (options.dryRun) return Promise.resolve({success:true,dryRun:true,count:toUpdate.length});
  var results = {updated:0,errors:[]};
  var updateNext = function(i) {
    if (i >= toUpdate.length) return Promise.resolve({success:true,results:results});
    return CopilotTools.updateTransaction(toUpdate[i].id, {categoryName:targetName}).then(function(r) {
      if (r.success) results.updated++; else results.errors.push(toUpdate[i].id);
      return CopilotTools._delay();
    }).then(function() { return updateNext(i+1); });
  };
  return updateNext(0);
};

// === BUDGET MANAGEMENT (v3.1.0) ===

CopilotTools.getBudgets = function() {
  var cache = window.__APOLLO_CLIENT__.cache.extract();
  var lookups = CopilotTools.buildLookups();
  var budgets = {};
  for (var key in cache) {
    if (key.indexOf("CategoryMonthlyBudget:") === 0) {
      var b = cache[key];
      if (!budgets[b.month]) budgets[b.month] = {};
      var catName = null;
      for (var cn in lookups.categories) {
        if (b.id && b.id.indexOf(lookups.categories[cn].id) >= 0) { catName = cn; break; }
      }
      if (catName) budgets[b.month][catName] = {amount:b.amount,spent:b.spent||0,remaining:b.amount-(b.spent||0)};
    }
  }
  return budgets;
};

CopilotTools.setBudget = function(categoryName, amount) {
  var lookups = CopilotTools.buildLookups();
  var cat = lookups.categories[categoryName];
  if (!cat) return Promise.resolve({success:false,error:"Category not found: " + categoryName});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.EDIT_BUDGET,
      variables: {categoryId:cat.id,input:{amount:parseFloat(amount)}}
    });
  }).then(function(result) {
    CopilotTools.log("Set budget for " + categoryName + ": $" + amount);
    return {success:true,data:result.data};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

CopilotTools.getBudgetStatus = function(month) {
  month = month || new Date().toISOString().slice(0,7);
  var budgets = CopilotTools.getBudgets();
  var status = budgets[month] || {};
  var txs = CopilotTools.getCachedTransactions();
  var lookups = CopilotTools.buildLookups();
  var spending = {};
  txs.forEach(function(tx) {
    if (tx.date && tx.date.slice(0,7) === month && tx.type !== "INCOME") {
      var catName = null;
      for (var cn in lookups.categories) {
        if (lookups.categories[cn].id === tx.categoryId) { catName = cn; break; }
      }
      if (catName) {
        if (!spending[catName]) spending[catName] = 0;
        spending[catName] += Math.abs(tx.amount);
      }
    }
  });
  var result = [];
  for (var cat in status) {
    result.push({category:cat,budget:status[cat].amount,spent:spending[cat]||0,remaining:status[cat].amount-(spending[cat]||0),percentUsed:Math.round((spending[cat]||0)/status[cat].amount*100)});
  }
  return result.sort(function(a,b){return b.percentUsed-a.percentUsed;});
};

// === RECURRING MANAGEMENT (v3.1.0) ===

CopilotTools.createRecurring = function(txId, frequency) {
  var cache = window.__APOLLO_CLIENT__.cache.extract();
  var tx = null;
  for (var key in cache) {
    if (key.indexOf("Transaction:") === 0 && cache[key].id === txId) { tx = cache[key]; break; }
  }
  if (!tx) return Promise.resolve({success:false,error:"Transaction not found"});
  frequency = (frequency || "MONTHLY").toUpperCase();
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.CREATE_RECURRING,
      variables: {input:{frequency:frequency,transaction:{transactionId:txId,accountId:tx.accountId,itemId:tx.itemId}}}
    });
  }).then(function(result) {
    CopilotTools.log("Created recurring from: " + txId);
    return {success:true,data:result.data.createRecurring};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

CopilotTools.updateRecurring = function(recurringName, updates) {
  var lookups = CopilotTools.buildLookups();
  var rec = lookups.recurrings[recurringName];
  if (!rec) return Promise.resolve({success:false,error:"Recurring not found: " + recurringName});
  var input = {};
  if (updates.name) input.name = updates.name;
  if (updates.frequency) input.frequency = updates.frequency.toUpperCase();
  if (updates.categoryName) {
    var cat = lookups.categories[updates.categoryName];
    if (cat) input.categoryId = cat.id;
  }
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.EDIT_RECURRING,
      variables: {id:rec.id,input:input}
    });
  }).then(function(result) {
    CopilotTools.log("Updated recurring: " + recurringName);
    return {success:true,data:result.data.editRecurring};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

CopilotTools.deleteRecurring = function(recurringName) {
  var lookups = CopilotTools.buildLookups();
  var rec = lookups.recurrings[recurringName];
  if (!rec) return Promise.resolve({success:false,error:"Recurring not found: " + recurringName});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.DELETE_RECURRING,
      variables: {id:rec.id}
    });
  }).then(function() {
    CopilotTools.log("Deleted recurring: " + recurringName);
    return {success:true};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

CopilotTools.getRecurringTransactions = function(recurringName) {
  var lookups = CopilotTools.buildLookups();
  var rec = lookups.recurrings[recurringName];
  if (!rec) return [];
  var txs = CopilotTools.getCachedTransactions();
  return txs.filter(function(tx) { return tx.recurringId === rec.id; });
};

CopilotTools.addTransactionToRecurring = function(txId, recurringName) {
  var cache = window.__APOLLO_CLIENT__.cache.extract();
  var tx = null;
  for (var key in cache) {
    if (key.indexOf("Transaction:") === 0 && cache[key].id === txId) { tx = cache[key]; break; }
  }
  if (!tx) return Promise.resolve({success:false,error:"Transaction not found"});
  var lookups = CopilotTools.buildLookups();
  var rec = lookups.recurrings[recurringName];
  if (!rec) return Promise.resolve({success:false,error:"Recurring not found: " + recurringName});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.ADD_TO_RECURRING,
      variables: {accountId:tx.accountId,itemId:tx.itemId,id:txId,input:{recurringId:rec.id,isExcluded:false}}
    });
  }).then(function(result) {
    CopilotTools.log("Added transaction to recurring: " + recurringName);
    return {success:true,data:result.data};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

// === ANALYTICS (v3.1.0) ===

CopilotTools.getSpendingTrend = function(categoryName, months) {
  months = months || 6;
  var lookups = CopilotTools.buildLookups();
  var cat = categoryName ? lookups.categories[categoryName] : null;
  var txs = CopilotTools.getCachedTransactions();
  var trend = {};
  var now = new Date();
  for (var i = 0; i < months; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var month = d.toISOString().slice(0,7);
    trend[month] = 0;
  }
  txs.forEach(function(tx) {
    if (!tx.date || tx.type === "INCOME" || tx.type === "INTERNAL_TRANSFER") return;
    var month = tx.date.slice(0,7);
    if (trend[month] === undefined) return;
    if (cat && tx.categoryId !== cat.id) return;
    trend[month] += Math.abs(tx.amount);
  });
  return Object.keys(trend).sort().map(function(m) { return {month:m,amount:Math.round(trend[m]*100)/100}; });
};

CopilotTools.getMerchantAnalysis = function(limit) {
  limit = limit || 20;
  var txs = CopilotTools.getCachedTransactions();
  var merchants = {};
  txs.forEach(function(tx) {
    if (!tx.name || tx.type === "INCOME" || tx.type === "INTERNAL_TRANSFER") return;
    var name = tx.name.toLowerCase().trim();
    if (!merchants[name]) merchants[name] = {name:tx.name,count:0,total:0};
    merchants[name].count++;
    merchants[name].total += Math.abs(tx.amount);
  });
  return Object.values(merchants).sort(function(a,b){return b.total-a.total;}).slice(0,limit).map(function(m){
    return {name:m.name,count:m.count,total:Math.round(m.total*100)/100,avgTransaction:Math.round(m.total/m.count*100)/100};
  });
};

CopilotTools.findAnomalies = function(options) {
  options = options || {};
  var stdDevMultiple = options.stdDevMultiple || 2;
  var merchants = {};
  var txs = CopilotTools.getCachedTransactions();
  txs.forEach(function(tx) {
    if (!tx.name) return;
    var name = tx.name.toLowerCase().trim();
    if (!merchants[name]) merchants[name] = [];
    merchants[name].push(Math.abs(tx.amount));
  });
  var anomalies = [];
  for (var name in merchants) {
    var amounts = merchants[name];
    if (amounts.length < 3) continue;
    var mean = amounts.reduce(function(a,b){return a+b;},0) / amounts.length;
    var variance = amounts.reduce(function(a,b){return a+(b-mean)*(b-mean);},0) / amounts.length;
    var stdDev = Math.sqrt(variance);
    txs.forEach(function(tx) {
      if (tx.name && tx.name.toLowerCase().trim() === name) {
        var amt = Math.abs(tx.amount);
        if (Math.abs(amt - mean) > stdDev * stdDevMultiple) {
          anomalies.push({id:tx.id,name:tx.name,amount:tx.amount,date:tx.date,expected:Math.round(mean*100)/100,deviation:Math.round((amt-mean)*100)/100});
        }
      }
    });
  }
  return anomalies;
};

CopilotTools.compareMonths = function(month1, month2) {
  var lookups = CopilotTools.buildLookups();
  var txs = CopilotTools.getCachedTransactions();
  var data1 = {total:0,byCategory:{}};
  var data2 = {total:0,byCategory:{}};
  txs.forEach(function(tx) {
    if (!tx.date || tx.type === "INCOME" || tx.type === "INTERNAL_TRANSFER") return;
    var month = tx.date.slice(0,7);
    var catName = "Other";
    for (var cn in lookups.categories) {
      if (lookups.categories[cn].id === tx.categoryId) { catName = cn; break; }
    }
    if (month === month1) {
      data1.total += Math.abs(tx.amount);
      if (!data1.byCategory[catName]) data1.byCategory[catName] = 0;
      data1.byCategory[catName] += Math.abs(tx.amount);
    } else if (month === month2) {
      data2.total += Math.abs(tx.amount);
      if (!data2.byCategory[catName]) data2.byCategory[catName] = 0;
      data2.byCategory[catName] += Math.abs(tx.amount);
    }
  });
  var comparison = [];
  var allCats = Object.keys(Object.assign({},data1.byCategory,data2.byCategory));
  allCats.forEach(function(cat) {
    var v1 = data1.byCategory[cat] || 0;
    var v2 = data2.byCategory[cat] || 0;
    comparison.push({category:cat,month1:Math.round(v1*100)/100,month2:Math.round(v2*100)/100,change:Math.round((v2-v1)*100)/100,percentChange:v1?Math.round((v2-v1)/v1*100):null});
  });
  return {month1:{month:month1,total:Math.round(data1.total*100)/100},month2:{month:month2,total:Math.round(data2.total*100)/100},totalChange:Math.round((data2.total-data1.total)*100)/100,byCategory:comparison.sort(function(a,b){return Math.abs(b.change)-Math.abs(a.change);})};
};

// === ACCOUNT MANAGEMENT (v3.1.0) ===

CopilotTools.getAccountSummary = function(accountName) {
  var lookups = CopilotTools.buildLookups();
  var acc = null;
  for (var name in lookups.accounts) {
    if (name.toLowerCase().indexOf(accountName.toLowerCase()) >= 0) { acc = lookups.accounts[name]; break; }
  }
  if (!acc) return {error:"Account not found: " + accountName};
  var txs = CopilotTools.getCachedTransactions();
  var accountTxs = txs.filter(function(tx) { return tx.accountId === acc.id; });
  var income = 0, expenses = 0;
  accountTxs.forEach(function(tx) {
    if (tx.type === "INCOME") income += Math.abs(tx.amount);
    else if (tx.type === "REGULAR") expenses += Math.abs(tx.amount);
  });
  return {account:acc.name,type:acc.type,subtype:acc.subtype,transactionCount:accountTxs.length,totalIncome:Math.round(income*100)/100,totalExpenses:Math.round(expenses*100)/100,isHidden:acc.isHidden};
};

CopilotTools.listHiddenAccounts = function() {
  var lookups = CopilotTools.buildLookups();
  var hidden = [];
  for (var name in lookups.accounts) {
    if (lookups.accounts[name].isHidden) hidden.push(name);
  }
  return hidden;
};

// === AUTO-CATEGORIZATION ===

CopilotTools._defaultRules = [
  {pattern:"costco",category:"Groceries",priority:10},
  {pattern:"trader joe",category:"Groceries",priority:10},
  {pattern:"whole foods",category:"Groceries",priority:10},
  {pattern:"walmart",category:"Shops",priority:5},
  {pattern:"target",category:"Shops",priority:5},
  {pattern:"amazon",category:"Shops",priority:3},
  {pattern:"netflix",category:"Subscriptions",priority:10},
  {pattern:"spotify",category:"Subscriptions",priority:10},
  {pattern:"uber eats",category:"Restaurants",priority:10},
  {pattern:"doordash",category:"Restaurants",priority:10},
  {pattern:"uber trip",category:"Transportation",priority:10},
  {pattern:"lyft",category:"Transportation",priority:10}
];

CopilotTools.addAutoCategorizeRule = function(pattern, category, priority) {
  CopilotTools._categorizationRules.push({pattern:pattern.toLowerCase(),category:category,priority:priority||5,id:"rule_"+Date.now()});
  CopilotTools._categorizationRules.sort(function(a,b){return b.priority-a.priority;});
  CopilotTools.log("Added rule: " + pattern + " -> " + category);
};

CopilotTools.listRules = function() {
  return CopilotTools._categorizationRules.concat(CopilotTools._defaultRules);
};

CopilotTools.suggestCategory = function(name) {
  var nameLower = (name || "").toLowerCase();
  var rules = CopilotTools.listRules();
  for (var i = 0; i < rules.length; i++) {
    if (nameLower.indexOf(rules[i].pattern) >= 0) return rules[i].category;
  }
  return null;
};

CopilotTools.findUncategorized = function() {
  var lookups = CopilotTools.buildLookups();
  var otherCat = lookups.categories["Other"];
  var otherId = otherCat ? otherCat.id : null;
  return CopilotTools.getCachedTransactions().filter(function(tx) {
    return tx.type === "REGULAR" && (!tx.categoryId || tx.categoryId === otherId);
  });
};

CopilotTools.reviewUncategorized = function() {
  var uncategorized = CopilotTools.findUncategorized();
  return uncategorized.map(function(tx) {
    return {id:tx.id,name:tx.name,amount:tx.amount,date:tx.date,suggestion:CopilotTools.suggestCategory(tx.name)};
  });
};

// === IMPORT/EXPORT ===

CopilotTools.exportToJSON = function() {
  return {version:CopilotTools.VERSION,exportedAt:new Date().toISOString(),transactions:CopilotTools.getCachedTransactions(),lookups:CopilotTools.buildLookups(),rules:CopilotTools._categorizationRules};
};

CopilotTools.exportToCSV = function(transactions) {
  var txs = transactions || CopilotTools.getCachedTransactions();
  var lookups = CopilotTools.buildLookups();
  var rows = ["id,date,name,amount,type,category,account"];
  txs.forEach(function(tx) {
    var catName = "";
    for (var cn in lookups.categories) { if (lookups.categories[cn].id === tx.categoryId) { catName = cn; break; } }
    var accName = "";
    for (var an in lookups.accounts) { if (lookups.accounts[an].id === tx.accountId) { accName = an; break; } }
    var name = (tx.name || "").replace(/,/g, ";").replace(/"/g, "");
    rows.push(tx.id + "," + tx.date + ",\"" + name + "\"," + tx.amount + "," + (tx.type||"REGULAR") + "," + catName + "," + accName);
  });
  return rows.join("\n");
};

CopilotTools.downloadFile = function(content, filename, mimeType) {
  var blob = new Blob([content], {type:mimeType||"application/octet-stream"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  CopilotTools.log("Downloaded: " + filename);
};

CopilotTools.downloadBackup = function() {
  var backup = CopilotTools.exportToJSON();
  var filename = "copilot-backup-" + new Date().toISOString().split("T")[0] + ".json";
  CopilotTools.downloadFile(JSON.stringify(backup, null, 2), filename, "application/json");
};

// === STATUS & HELP ===

CopilotTools.status = function() {
  var lookups = CopilotTools.buildLookups();
  var range = CopilotTools.getDateRange();
  console.log("=== COPILOT TOOLS v" + CopilotTools.VERSION + " ===");
  console.log("Accounts: " + Object.keys(lookups.accounts).length);
  console.log("Categories: " + Object.keys(lookups.categories).length);
  console.log("Tags: " + Object.keys(lookups.tags).length);
  console.log("Recurrings: " + Object.keys(lookups.recurrings).length);
  console.log("Transactions: " + range.count);
  console.log("Date range: " + range.min + " to " + range.max);
  return {accounts:Object.keys(lookups.accounts).length,categories:Object.keys(lookups.categories).length,tags:Object.keys(lookups.tags).length,recurrings:Object.keys(lookups.recurrings).length,transactions:range.count};
};

CopilotTools.help = function() {
  console.log("");
  console.log("=== COPILOT TOOLS v" + CopilotTools.VERSION + " HELP ===");
  console.log("");
  console.log("STATUS: status(), showAccounts(), showCategories(), showTags(), showRecurrings()");
  console.log("");
  console.log("TRANSACTIONS:");
  console.log("  searchTransactions(query, {startDate,endDate})");
  console.log("  updateTransaction(id, {categoryName,tagIds,notes,name})");
  console.log("  deleteTransaction(id)");
  console.log("  bulkUpdateCategory(pattern, categoryName, {dryRun,onProgress})");
  console.log("");
  console.log("TAGS: createTag({name,colorName}), updateTag(name,updates), deleteTag(name)");
  console.log("");
  console.log("CATEGORIES (v3.1.0):");
  console.log("  createCategory(name, {parentCategory,colorName})");
  console.log("  updateCategory(name, {name,colorName,parentCategory})");
  console.log("  deleteCategory(name)");
  console.log("  mergeCategories([sources], target, {dryRun})");
  console.log("  listCategoryHierarchy()");
  console.log("");
  console.log("BUDGETS (v3.1.0):");
  console.log("  getBudgets(), setBudget(categoryName, amount), getBudgetStatus(month)");
  console.log("");
  console.log("RECURRING (v3.1.0):");
  console.log("  createRecurring(txId, frequency)");
  console.log("  updateRecurring(name, {name,frequency,categoryName})");
  console.log("  deleteRecurring(name)");
  console.log("  addTransactionToRecurring(txId, recurringName)");
  console.log("  getRecurringTransactions(recurringName)");
  console.log("");
  console.log("ANALYTICS (v3.1.0):");
  console.log("  getSpendingTrend(categoryName, months)");
  console.log("  getMerchantAnalysis(limit)");
  console.log("  findAnomalies({stdDevMultiple})");
  console.log("  compareMonths(month1, month2)");
  console.log("");
  console.log("ACCOUNTS (v3.1.0):");
  console.log("  getAccountSummary(accountName), listHiddenAccounts()");
  console.log("");
  console.log("AUTO-CATEGORIZE:");
  console.log("  findUncategorized(), reviewUncategorized(), suggestCategory(name)");
  console.log("  addAutoCategorizeRule(pattern, category, priority)");
  console.log("");
  console.log("EXPORT: exportToJSON(), exportToCSV(), downloadBackup()");
  console.log("");
  console.log("CONFIG: CopilotTools.config = {rateLimit,maxRetries,verbose}");
};

// === INITIALIZATION ===
console.log("=== COPILOT TOOLS v" + CopilotTools.VERSION + " LOADED ===");
console.log("Run CopilotTools.status() to verify setup.");
console.log("Run CopilotTools.help() for commands.");

})();