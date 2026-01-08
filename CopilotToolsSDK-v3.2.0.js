/**
 * COPILOT TOOLS SDK v3.2.0
 * Comprehensive Transaction Management SDK for Copilot.money
 * Tested with: https://app.copilot.money v26.1.8-beta.1214 (Build: 630)
 *
 * FEATURES:
 * - Transaction CRUD with duplicate detection
 * - Batch import with progress callbacks
 * - CSV import (parseCSV, importFromCSV, analyzeCSVForDuplicates)
 * - Category Management (create, update, delete, merge, hierarchy)
 * - Budget Management (get, set, status)
 * - Recurring Management (create, update, delete, link transactions)
 * - Analytics (spending trends, merchant analysis, anomalies, comparisons)
 * - Account Management (summaries, hidden accounts)
 * - Tag Management (create, update, delete)
 *
 * CSV FORMAT SUPPORTED:
 * date,name,amount,status,category,parent category,excluded,tags,type,account,account mask,note,recurring
 *
 * 2026-01-08
 */

(function() {
"use strict";

window.CopilotTools = window.CopilotTools || {};
CopilotTools.VERSION = "3.2.0";

// Constants
CopilotTools.COLORS = {RED1:"RED1",RED2:"RED2",ORANGE1:"ORANGE1",ORANGE2:"ORANGE2",YELLOW1:"YELLOW1",YELLOW2:"YELLOW2",GREEN1:"GREEN1",GREEN2:"GREEN2",TEAL1:"TEAL1",TEAL2:"TEAL2",BLUE1:"BLUE1",BLUE2:"BLUE2",PURPLE1:"PURPLE1",PURPLE2:"PURPLE2",PINK1:"PINK1",PINK2:"PINK2",GRAY1:"GRAY1",GRAY2:"GRAY2",OLIVE1:"OLIVE1",OLIVE2:"OLIVE2"};
CopilotTools.TRANSACTION_TYPES = {REGULAR:"REGULAR",INCOME:"INCOME",INTERNAL_TRANSFER:"INTERNAL_TRANSFER"};
CopilotTools.FREQUENCIES = {WEEKLY:"WEEKLY",BIWEEKLY:"BIWEEKLY",MONTHLY:"MONTHLY",ANNUALLY:"ANNUALLY"};

// Configuration
CopilotTools.config = {rateLimit:300,maxRetries:3,retryDelay:1000,logPrefix:"[CopilotTools]",verbose:true,dryRun:false};
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

CopilotTools.mutations.CREATE_TRANSACTION = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'CreateTransaction'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'accountId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'itemId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'CreateTransactionInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'createTransaction'},arguments:[{kind:'Argument',name:{kind:'Name',value:'accountId'},value:{kind:'Variable',name:{kind:'Name',value:'accountId'}}},{kind:'Argument',name:{kind:'Name',value:'itemId'},value:{kind:'Variable',name:{kind:'Name',value:'itemId'}}},{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'amount'}},{kind:'Field',name:{kind:'Name',value:'date'}},{kind:'Field',name:{kind:'Name',value:'type'}},{kind:'Field',name:{kind:'Name',value:'accountId'}},{kind:'Field',name:{kind:'Name',value:'categoryId'}},{kind:'Field',name:{kind:'Name',value:'userNotes'}}]}}]}}]};

CopilotTools.mutations.EDIT_TRANSACTION = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'EditTransaction'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'itemId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'accountId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NamedType',name:{kind:'Name',value:'EditTransactionInput'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'editTransaction'},arguments:[{kind:'Argument',name:{kind:'Name',value:'itemId'},value:{kind:'Variable',name:{kind:'Name',value:'itemId'}}},{kind:'Argument',name:{kind:'Name',value:'accountId'},value:{kind:'Variable',name:{kind:'Name',value:'accountId'}}},{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}},{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'transaction'},selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'categoryId'}}]}}]}}]}}]};

CopilotTools.mutations.DELETE_TRANSACTION = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'DeleteTransaction'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'itemId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'accountId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'deleteTransaction'},arguments:[{kind:'Argument',name:{kind:'Name',value:'itemId'},value:{kind:'Variable',name:{kind:'Name',value:'itemId'}}},{kind:'Argument',name:{kind:'Name',value:'accountId'},value:{kind:'Variable',name:{kind:'Name',value:'accountId'}}},{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}}]}]}}]};

CopilotTools.mutations.CREATE_TAG = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'CreateTag'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'CreateTagInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'createTag'},arguments:[{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'colorName'}}]}}]}}]};

CopilotTools.mutations.DELETE_TAG = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'DeleteTag'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'deleteTag'},arguments:[{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}}]}]}}]};

CopilotTools.mutations.EDIT_TAG = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'EditTag'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'EditTagInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'editTag'},arguments:[{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}},{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'colorName'}}]}}]}}]};

CopilotTools.mutations.DELETE_CATEGORY = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'DeleteCategory'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'deleteCategory'},arguments:[{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}}]}]}}]};

CopilotTools.mutations.CREATE_CATEGORY = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'CreateCategory'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'CreateCategoryInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'createCategory'},arguments:[{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'colorName'}}]}}]}}]};

CopilotTools.mutations.EDIT_CATEGORY = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'EditCategory'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'EditCategoryInput'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'budget'}},type:{kind:'NamedType',name:{kind:'Name',value:'Boolean'}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'spend'}},type:{kind:'NamedType',name:{kind:'Name',value:'Boolean'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'editCategory'},arguments:[{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}},{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'colorName'}},{kind:'Field',name:{kind:'Name',value:'parentCategoryId'}}]}}]}}]};

CopilotTools.mutations.EDIT_BUDGET = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'EditBudget'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'categoryId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'EditBudgetInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'editBudget'},arguments:[{kind:'Argument',name:{kind:'Name',value:'categoryId'},value:{kind:'Variable',name:{kind:'Name',value:'categoryId'}}},{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'amount'}}]}}]}}]};

CopilotTools.mutations.CREATE_RECURRING = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'CreateRecurring'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'CreateRecurringInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'createRecurring'},arguments:[{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'frequency'}}]}}]}}]};

CopilotTools.mutations.EDIT_RECURRING = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'EditRecurring'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'EditRecurringInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'editRecurring'},arguments:[{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}},{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'frequency'}}]}}]}}]};

CopilotTools.mutations.DELETE_RECURRING = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'DeleteRecurring'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'deleteRecurring'},arguments:[{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}}]}]}}]};

CopilotTools.mutations.ADD_TO_RECURRING = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'AddTransactionToRecurring'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'itemId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'accountId'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'AddTransactionToRecurringInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'addTransactionToRecurring'},arguments:[{kind:'Argument',name:{kind:'Name',value:'itemId'},value:{kind:'Variable',name:{kind:'Name',value:'itemId'}}},{kind:'Argument',name:{kind:'Name',value:'accountId'},value:{kind:'Variable',name:{kind:'Name',value:'accountId'}}},{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}},{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'transaction'},selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'recurringId'}}]}}]}}]}}]};

CopilotTools.mutations.EDIT_TAG = {kind:'Document',definitions:[{kind:'OperationDefinition',operation:'mutation',name:{kind:'Name',value:'EditTag'},variableDefinitions:[{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'id'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'ID'}}}},{kind:'VariableDefinition',variable:{kind:'Variable',name:{kind:'Name',value:'input'}},type:{kind:'NonNullType',type:{kind:'NamedType',name:{kind:'Name',value:'EditTagInput'}}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'editTag'},arguments:[{kind:'Argument',name:{kind:'Name',value:'id'},value:{kind:'Variable',name:{kind:'Name',value:'id'}}},{kind:'Argument',name:{kind:'Name',value:'input'},value:{kind:'Variable',name:{kind:'Name',value:'input'}}}],selectionSet:{kind:'SelectionSet',selections:[{kind:'Field',name:{kind:'Name',value:'id'}},{kind:'Field',name:{kind:'Name',value:'name'}},{kind:'Field',name:{kind:'Name',value:'colorName'}}]}}]}}]};

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
      categories[cat.name] = {id:cat.id,name:cat.name,colorName:cat.colorName,canBeDeleted:cat.canBeDeleted,isExcluded:cat.isExcluded,parentCategoryId:cat.parentCategoryId};
    }
    if (key.indexOf("Tag:") === 0 && cache[key].name) {
      var tag = cache[key];
      tags[tag.name] = {id:tag.id,name:tag.name,colorName:tag.colorName};
    }
    if (key.indexOf("Recurring:") === 0 && cache[key].name) {
      var rec = cache[key];
      recurrings[rec.name] = {id:rec.id,name:rec.name,frequency:rec.frequency,categoryId:rec.categoryId};
    }
  }
  return {accounts:accounts,categories:categories,tags:tags,recurrings:recurrings};
};

CopilotTools.showAccounts = function() { return Object.keys(CopilotTools.buildLookups().accounts).sort(); };
CopilotTools.showCategories = function() { return Object.keys(CopilotTools.buildLookups().categories).sort(); };
CopilotTools.showTags = function() { return Object.keys(CopilotTools.buildLookups().tags); };
CopilotTools.showRecurrings = function() { return Object.keys(CopilotTools.buildLookups().recurrings).sort(); };

// === TRANSACTION CACHE & DUPLICATE DETECTION ===

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

CopilotTools.findDuplicatesInCache = function() {
  var transactions = CopilotTools.getCachedTransactions();
  var seen = {};
  var duplicates = [];
  for (var i = 0; i < transactions.length; i++) {
    var key = CopilotTools.createTransactionKey(transactions[i]);
    if (seen[key]) duplicates.push({original:seen[key],duplicate:transactions[i]});
    else seen[key] = transactions[i];
  }
  return duplicates;
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
    if (options.categoryId && tx.categoryId !== options.categoryId) return false;
    if (options.accountId && tx.accountId !== options.accountId) return false;
    return true;
  });
};

CopilotTools.findTransaction = function(query) {
  var results = CopilotTools.searchTransactions(query);
  return results.length > 0 ? results[0] : null;
};

// === CREATE TRANSACTION ===

CopilotTools.createTransaction = function(options) {
  var accountName = options.accountName || options.account;
  var date = options.date;
  var name = options.name;
  var amount = options.amount;
  var categoryName = options.categoryName || options.category || "";
  var type = (options.type || "REGULAR").toUpperCase();
  var notes = options.notes || options.note || null;
  var tagIds = options.tagIds || options.tags || [];
  var skipDuplicateCheck = options.skipDuplicateCheck || false;

  // Normalize type
  if (type === "INTERNAL TRANSFER") type = "INTERNAL_TRANSFER";
  if (type !== "REGULAR" && type !== "INCOME" && type !== "INTERNAL_TRANSFER") type = "REGULAR";

  // Dry run check
  if (CopilotTools.config.dryRun) {
    CopilotTools.log("[DRY RUN] Would create: " + name + " $" + amount + " on " + date);
    return Promise.resolve({success:true,dryRun:true,data:{name:name,amount:amount,date:date}});
  }

  var lookups = CopilotTools.buildLookups();

  // Find account - try exact match first, then partial
  var account = lookups.accounts[accountName];
  if (!account) {
    for (var accName in lookups.accounts) {
      if (accName.indexOf(accountName) >= 0 || accountName.indexOf(accName.split(" (")[0]) >= 0) {
        account = lookups.accounts[accName];
        break;
      }
    }
  }
  // Try matching by mask
  if (!account && options.accountMask) {
    for (var an in lookups.accounts) {
      if (lookups.accounts[an].mask === options.accountMask) {
        account = lookups.accounts[an];
        break;
      }
    }
  }
  if (!account) return Promise.resolve({success:false,error:"Account not found: " + accountName});

  // Resolve category
  var categoryId = "";
  if (categoryName && categoryName !== "") {
    var category = lookups.categories[categoryName];
    if (!category) {
      // Try case-insensitive match
      for (var cn in lookups.categories) {
        if (cn.toLowerCase() === categoryName.toLowerCase()) {
          category = lookups.categories[cn];
          break;
        }
      }
    }
    if (category) categoryId = category.id;
    else if (type === "REGULAR") {
      CopilotTools.warn("Category not found: " + categoryName + ", using Other");
      var otherCat = lookups.categories["Other"];
      if (otherCat) categoryId = otherCat.id;
    }
  } else if (type === "REGULAR") {
    var otherCat = lookups.categories["Other"];
    if (otherCat) categoryId = otherCat.id;
  }

  // Resolve tags
  var resolvedTagIds = [];
  if (tagIds && tagIds.length > 0) {
    var tagList = typeof tagIds === "string" ? tagIds.split(",").map(function(t){return t.trim();}) : tagIds;
    tagList.forEach(function(tagInput) {
      if (tagInput) {
        var foundTag = lookups.tags[tagInput];
        resolvedTagIds.push(foundTag ? foundTag.id : tagInput);
      }
    });
  }

  // Duplicate check
  if (!skipDuplicateCheck) {
    var dupCheck = CopilotTools.wouldBeDuplicate({date:date,name:name,amount:parseFloat(amount),accountId:account.id});
    if (dupCheck.isDuplicate) {
      CopilotTools.warn("Duplicate detected: " + name + " on " + date);
      return Promise.resolve({success:false,error:"DUPLICATE_DETECTED",existingTransaction:dupCheck.existingTransaction});
    }
  }

  // Execute mutation
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.CREATE_TRANSACTION,
      variables: {
        accountId: account.id,
        itemId: account.itemId,
        input: {
          categoryId: categoryId,
          amount: Math.abs(parseFloat(amount)),
          name: name,
          type: type,
          date: date,
          userNotes: notes,
          tagIds: resolvedTagIds
        }
      }
    });
  }).then(function(result) {
    CopilotTools.log("Created: " + name + " $" + amount + " on " + date);
    return {success:true,id:result.data.createTransaction.id,data:result.data.createTransaction};
  }).catch(function(error) {
    CopilotTools.error("Create failed: " + error.message);
    return {success:false,error:error.message};
  });
};

// === BATCH CREATE TRANSACTIONS ===

CopilotTools.batchCreateTransactions = function(transactions, options) {
  options = options || {};
  var delayMs = options.delayMs || CopilotTools.config.rateLimit;
  var stopOnDuplicate = options.stopOnDuplicate === true;
  var dryRun = options.dryRun || CopilotTools.config.dryRun;
  var onProgress = options.onProgress || function() {};

  var results = {total:transactions.length,created:[],duplicates:[],errors:[],skipped:[]};
  CopilotTools.log("Starting batch: " + transactions.length + " transactions" + (dryRun ? " (DRY RUN)" : ""));

  var processNext = function(index) {
    if (index >= transactions.length) {
      CopilotTools.log("Batch complete: " + results.created.length + " created, " + results.duplicates.length + " duplicates, " + results.errors.length + " errors");
      return Promise.resolve(results);
    }

    var tx = transactions[index];
    var progress = "[" + (index+1) + "/" + transactions.length + "]";

    // Validate required fields
    if (!tx.accountName && !tx.account && !tx.accountMask) {
      results.errors.push({tx:tx,error:"Missing account"});
      CopilotTools.warn(progress + " SKIP (no account): " + tx.name);
      onProgress({current:index+1,total:transactions.length,status:"error",tx:tx});
      return processNext(index+1);
    }
    if (!tx.date || !tx.name || tx.amount === undefined) {
      results.errors.push({tx:tx,error:"Missing required fields"});
      CopilotTools.warn(progress + " SKIP (missing fields): " + tx.name);
      onProgress({current:index+1,total:transactions.length,status:"error",tx:tx});
      return processNext(index+1);
    }

    // Skip zero amounts
    if (parseFloat(tx.amount) === 0) {
      results.skipped.push({tx:tx,reason:"zero amount"});
      CopilotTools.log(progress + " SKIP (zero): " + tx.name);
      onProgress({current:index+1,total:transactions.length,status:"skipped",tx:tx});
      return processNext(index+1);
    }

    // Dry run mode
    if (dryRun) {
      var lookups = CopilotTools.buildLookups();
      var acc = null;
      var accKey = tx.accountName || tx.account;
      for (var k in lookups.accounts) {
        if (k.indexOf(accKey) >= 0 || accKey.indexOf(k.split(" (")[0]) >= 0 || lookups.accounts[k].mask === tx.accountMask) {
          acc = lookups.accounts[k];
          break;
        }
      }
      var dupCheck = CopilotTools.wouldBeDuplicate({date:tx.date,name:tx.name,amount:parseFloat(tx.amount),accountId:acc?acc.id:null});
      if (dupCheck.isDuplicate) {
        results.duplicates.push({tx:tx,existingId:dupCheck.existingTransaction.id});
        CopilotTools.log(progress + " DUPLICATE: " + tx.name + " on " + tx.date);
        onProgress({current:index+1,total:transactions.length,status:"duplicate",tx:tx});
      } else {
        results.created.push(tx);
        CopilotTools.log(progress + " WOULD CREATE: " + tx.name + " $" + tx.amount);
        onProgress({current:index+1,total:transactions.length,status:"would_create",tx:tx});
      }
      return processNext(index+1);
    }

    // Actual creation
    return CopilotTools.createTransaction({
      accountName: tx.accountName || tx.account,
      accountMask: tx.accountMask || tx["account mask"],
      date: tx.date,
      name: tx.name,
      amount: tx.amount,
      categoryName: tx.categoryName || tx.category,
      type: tx.type,
      notes: tx.notes || tx.note,
      tagIds: tx.tagIds || tx.tags
    }).then(function(result) {
      if (result.success) {
        results.created.push({tx:tx,id:result.id});
        CopilotTools.log(progress + " CREATED: " + tx.name + " $" + tx.amount);
        onProgress({current:index+1,total:transactions.length,status:"created",tx:tx,id:result.id});
      } else if (result.error === "DUPLICATE_DETECTED") {
        results.duplicates.push({tx:tx,existing:result.existingTransaction});
        CopilotTools.warn(progress + " DUPLICATE: " + tx.name);
        onProgress({current:index+1,total:transactions.length,status:"duplicate",tx:tx});
        if (stopOnDuplicate) {
          CopilotTools.error("Stopping on duplicate. Set stopOnDuplicate:false to continue.");
          return results;
        }
      } else {
        results.errors.push({tx:tx,error:result.error});
        CopilotTools.error(progress + " ERROR: " + result.error);
        onProgress({current:index+1,total:transactions.length,status:"error",tx:tx,error:result.error});
      }
      return CopilotTools._delay(delayMs).then(function() { return processNext(index+1); });
    });
  };

  return processNext(0);
};

// === CSV IMPORT ===

CopilotTools.parseCSV = function(csvString) {
  var lines = csvString.trim().split(String.fromCharCode(10));
  if (lines.length < 2) return [];
  var quote = String.fromCharCode(34);

  // Parse header
  var headerLine = lines[0];
  var headers = [];
  var inQuote = false;
  var current = "";
  for (var i = 0; i < headerLine.length; i++) {
    var c = headerLine[i];
    if (c === quote) inQuote = !inQuote;
    else if (c === "," && !inQuote) { headers.push(current.trim()); current = ""; }
    else current += c;
  }
  headers.push(current.trim());

  // Parse rows
  var rows = [];
  for (var r = 1; r < lines.length; r++) {
    var line = lines[r].trim();
    if (!line) continue;
    var values = [];
    inQuote = false;
    current = "";
    for (var j = 0; j < line.length; j++) {
      var ch = line[j];
      if (ch === quote) inQuote = !inQuote;
      else if (ch === "," && !inQuote) { values.push(current.trim()); current = ""; }
      else current += ch;
    }
    values.push(current.trim());
    var row = {};
    for (var h = 0; h < headers.length; h++) row[headers[h]] = values[h] || "";
    rows.push(row);
  }
  return rows;
};

CopilotTools.importFromCSV = function(csvString, options) {
  options = options || {};
  var rows = CopilotTools.parseCSV(csvString);
  CopilotTools.log("Parsed " + rows.length + " rows from CSV");

  // Transform CSV rows to transaction format
  // Expected columns: date,name,amount,status,category,parent category,excluded,tags,type,account,account mask,note,recurring
  var transactions = rows.map(function(row) {
    return {
      date: row.date || row.Date,
      name: row.name || row.Name || row.description,
      amount: parseFloat((row.amount || row.Amount || "0").replace(/[^0-9.-]/g, "")),
      categoryName: row.category || row.Category,
      type: (row.type || row.Type || "regular").toUpperCase(),
      accountName: row.account || row.Account,
      accountMask: row["account mask"] || row.accountMask,
      notes: row.note || row.Note || row.notes,
      tags: row.tags || row.Tags
    };
  }).filter(function(tx) {
    return tx.date && tx.name && tx.amount !== 0;
  });

  CopilotTools.log("Valid transactions: " + transactions.length);
  return CopilotTools.batchCreateTransactions(transactions, options);
};

CopilotTools.analyzeCSVForDuplicates = function(csvString) {
  var rows = CopilotTools.parseCSV(csvString);
  var lookups = CopilotTools.buildLookups();
  var analysis = {total:rows.length,wouldCreate:[],duplicates:[],missingAccounts:[],missingCategories:[],zeroAmount:[]};

  rows.forEach(function(row) {
    var amount = parseFloat((row.amount || "0").replace(/[^0-9.-]/g, ""));
    if (amount === 0) { analysis.zeroAmount.push(row); return; }

    var accName = row.account || row.Account;
    var accMask = row["account mask"] || row.accountMask;
    var acc = null;
    for (var k in lookups.accounts) {
      if (k.indexOf(accName) >= 0 || accName.indexOf(k.split(" (")[0]) >= 0 || lookups.accounts[k].mask === accMask) {
        acc = lookups.accounts[k];
        break;
      }
    }
    if (!acc) { analysis.missingAccounts.push({row:row,account:accName}); return; }

    var catName = row.category || row.Category;
    if (catName && !lookups.categories[catName]) {
      var found = false;
      for (var cn in lookups.categories) {
        if (cn.toLowerCase() === catName.toLowerCase()) { found = true; break; }
      }
      if (!found) analysis.missingCategories.push({row:row,category:catName});
    }

    var dupCheck = CopilotTools.wouldBeDuplicate({date:row.date,name:row.name,amount:amount,accountId:acc.id});
    if (dupCheck.isDuplicate) analysis.duplicates.push({row:row,existingId:dupCheck.existingTransaction.id});
    else analysis.wouldCreate.push(row);
  });

  CopilotTools.log("Analysis: " + analysis.wouldCreate.length + " to create, " + analysis.duplicates.length + " duplicates, " + analysis.missingAccounts.length + " missing accounts");
  return analysis;
};

// === UPDATE TRANSACTION ===

CopilotTools.updateTransaction = function(txId, updates) {
  var cache = window.__APOLLO_CLIENT__.cache.extract();
  var tx = null;
  for (var key in cache) {
    if (key.indexOf("Transaction:") === 0 && cache[key].id === txId) { tx = cache[key]; break; }
  }
  if (!tx) return Promise.resolve({success:false,error:"Transaction not found: " + txId});

  if (CopilotTools.config.dryRun) {
    CopilotTools.log("[DRY RUN] Would update: " + txId);
    return Promise.resolve({success:true,dryRun:true});
  }

  var lookups = CopilotTools.buildLookups();
  var input = {};

  if (updates.categoryName !== undefined) {
    if (!updates.categoryName) input.categoryId = null;
    else {
      var cat = lookups.categories[updates.categoryName];
      if (!cat) {
        for (var cn in lookups.categories) {
          if (cn.toLowerCase() === updates.categoryName.toLowerCase()) { cat = lookups.categories[cn]; break; }
        }
      }
      if (!cat) return Promise.resolve({success:false,error:"Category not found: " + updates.categoryName});
      input.categoryId = cat.id;
    }
  }
  if (updates.tagIds !== undefined) {
    var tagList = typeof updates.tagIds === "string" ? updates.tagIds.split(",").map(function(t){return t.trim();}) : updates.tagIds;
    input.tagIds = tagList.map(function(t) { return lookups.tags[t] ? lookups.tags[t].id : t; });
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
    CopilotTools.log("Updated: " + txId);
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
  if (!tx) return Promise.resolve({success:false,error:"Transaction not found"});
  if (CopilotTools.config.dryRun) {
    CopilotTools.log("[DRY RUN] Would delete: " + txId);
    return Promise.resolve({success:true,dryRun:true});
  }
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({
      mutation: CopilotTools.mutations.DELETE_TRANSACTION,
      variables: {accountId:tx.accountId,itemId:tx.itemId,id:txId}
    });
  }).then(function() {
    CopilotTools.log("Deleted: " + txId);
    return {success:true};
  }).catch(function(error) {
    return {success:false,error:error.message};
  });
};

CopilotTools.bulkUpdateCategory = function(pattern, newCategoryName, options) {
  options = options || {};
  var matches = CopilotTools.searchTransactions(pattern);
  var lookups = CopilotTools.buildLookups();
  var cat = lookups.categories[newCategoryName];
  if (!cat && !options.dryRun) return Promise.resolve({success:false,error:"Category not found"});
  CopilotTools.log("Found " + matches.length + " matching transactions");
  if (options.dryRun) {
    return Promise.resolve({success:true,dryRun:true,count:matches.length,transactions:matches.slice(0,20)});
  }
  var results = {updated:0,errors:[]};
  var updateNext = function(i) {
    if (i >= matches.length) return Promise.resolve({success:true,results:results});
    return CopilotTools.updateTransaction(matches[i].id, {categoryName:newCategoryName}).then(function(r) {
      if (r.success) results.updated++; else results.errors.push(matches[i].id);
      if (options.onProgress) options.onProgress({current:i+1,total:matches.length});
      return CopilotTools._delay();
    }).then(function() { return updateNext(i+1); });
  };
  return updateNext(0);
};

// === TAG MANAGEMENT ===
CopilotTools.createTag = function(options) {
  var name = options.name;
  var colorName = options.colorName || "BLUE1";
  if (!name) return Promise.resolve({success:false,error:"Name required"});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({mutation:CopilotTools.mutations.CREATE_TAG,variables:{input:{name:name,colorName:colorName}}});
  }).then(function(r) { return {success:true,data:r.data.createTag}; }).catch(function(e) { return {success:false,error:e.message}; });
};
CopilotTools.deleteTag = function(tagName) {
  var lookups = CopilotTools.buildLookups();
  var tag = lookups.tags[tagName];
  if (!tag) return Promise.resolve({success:false,error:"Tag not found"});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({mutation:CopilotTools.mutations.DELETE_TAG,variables:{id:tag.id}});
  }).then(function() { return {success:true}; }).catch(function(e) { return {success:false,error:e.message}; });
};

CopilotTools.updateTag = function(tagName, updates) {
  var lookups = CopilotTools.buildLookups();
  var tag = lookups.tags[tagName];
  if (!tag) return Promise.resolve({success:false,error:"Tag not found: " + tagName});
  var input = {};
  if (updates.name) input.name = updates.name;
  if (updates.colorName) input.colorName = updates.colorName;
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({mutation:CopilotTools.mutations.EDIT_TAG,variables:{id:tag.id,input:input}});
  }).then(function(result) {
    CopilotTools.log("Updated tag: " + tagName);
    return {success:true,data:result.data.editTag};
  }).catch(function(e) { return {success:false,error:e.message}; });
};

// === CATEGORY MANAGEMENT ===

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
  }).catch(function(error) { return {success:false,error:error.message}; });
};

CopilotTools.deleteCategory = function(categoryName) {
  var lookups = CopilotTools.buildLookups();
  var cat = lookups.categories[categoryName];
  if (!cat) return Promise.resolve({success:false,error:"Category not found: " + categoryName});
  if (cat.canBeDeleted === false) return Promise.resolve({success:false,error:"Cannot delete: " + categoryName});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({mutation:CopilotTools.mutations.DELETE_CATEGORY,variables:{id:cat.id}});
  }).then(function() {
    CopilotTools.log("Deleted category: " + categoryName);
    return {success:true};
  }).catch(function(error) { return {success:false,error:error.message}; });
};

CopilotTools.listCategoryHierarchy = function() {
  var lookups = CopilotTools.buildLookups();
  var hierarchy = {};
  for (var name in lookups.categories) {
    var cat = lookups.categories[name];
    if (!cat.parentCategoryId) hierarchy[name] = {category:cat,children:[]};
  }
  for (var name2 in lookups.categories) {
    var cat2 = lookups.categories[name2];
    if (cat2.parentCategoryId) {
      var parentName = null;
      for (var pn in lookups.categories) {
        if (lookups.categories[pn].id === cat2.parentCategoryId) { parentName = pn; break; }
      }
      if (parentName && hierarchy[parentName]) hierarchy[parentName].children.push(name2);
    }
  }
  return hierarchy;
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
    if (src) txs.forEach(function(tx) { if (tx.categoryId === src.id) toUpdate.push(tx); });
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

// === BUDGET MANAGEMENT ===

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
    return window.__APOLLO_CLIENT__.mutate({mutation:CopilotTools.mutations.EDIT_BUDGET,variables:{categoryId:cat.id,input:{amount:parseFloat(amount)}}});
  }).then(function(result) {
    CopilotTools.log("Set budget for " + categoryName + ": $" + amount);
    return {success:true,data:result.data};
  }).catch(function(error) { return {success:false,error:error.message}; });
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

// === RECURRING MANAGEMENT ===

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
  }).catch(function(error) { return {success:false,error:error.message}; });
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
    return window.__APOLLO_CLIENT__.mutate({mutation:CopilotTools.mutations.EDIT_RECURRING,variables:{id:rec.id,input:input}});
  }).then(function(result) {
    CopilotTools.log("Updated recurring: " + recurringName);
    return {success:true,data:result.data.editRecurring};
  }).catch(function(error) { return {success:false,error:error.message}; });
};

CopilotTools.deleteRecurring = function(recurringName) {
  var lookups = CopilotTools.buildLookups();
  var rec = lookups.recurrings[recurringName];
  if (!rec) return Promise.resolve({success:false,error:"Recurring not found: " + recurringName});
  return CopilotTools._withRetry(function() {
    return window.__APOLLO_CLIENT__.mutate({mutation:CopilotTools.mutations.DELETE_RECURRING,variables:{id:rec.id}});
  }).then(function() {
    CopilotTools.log("Deleted recurring: " + recurringName);
    return {success:true};
  }).catch(function(error) { return {success:false,error:error.message}; });
};

CopilotTools.getRecurringTransactions = function(recurringName) {
  var lookups = CopilotTools.buildLookups();
  var rec = lookups.recurrings[recurringName];
  if (!rec) return [];
  return CopilotTools.getCachedTransactions().filter(function(tx) { return tx.recurringId === rec.id; });
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
  }).catch(function(error) { return {success:false,error:error.message}; });
};

// === ANALYTICS ===

CopilotTools.getSpendingTrend = function(categoryName, months) {
  months = months || 6;
  var lookups = CopilotTools.buildLookups();
  var cat = categoryName ? lookups.categories[categoryName] : null;
  var txs = CopilotTools.getCachedTransactions();
  var trend = {};
  var now = new Date();
  for (var i = 0; i < months; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trend[d.toISOString().slice(0,7)] = 0;
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

// === ACCOUNT MANAGEMENT ===

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
  return {account:acc.name,type:acc.type,subtype:acc.subtype,transactionCount:accountTxs.length,totalIncome:Math.round(income*100)/100,totalExpenses:Math.round(expenses*100)/100};
};

CopilotTools.listHiddenAccounts = function() {
  var lookups = CopilotTools.buildLookups();
  var hidden = [];
  for (var name in lookups.accounts) {
    if (lookups.accounts[name].isHidden) hidden.push(name);
  }
  return hidden;
};

// === EXPORT ===
CopilotTools.exportToJSON = function() {
  return {version:CopilotTools.VERSION,exportedAt:new Date().toISOString(),transactions:CopilotTools.getCachedTransactions(),lookups:CopilotTools.buildLookups()};
};
CopilotTools.downloadFile = function(content, filename, mimeType) {
  var blob = new Blob([content], {type:mimeType||"application/octet-stream"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  CopilotTools.log("Downloaded: " + filename);
};
CopilotTools.downloadBackup = function() {
  var backup = CopilotTools.exportToJSON();
  CopilotTools.downloadFile(JSON.stringify(backup,null,2), "copilot-backup-" + new Date().toISOString().split("T")[0] + ".json", "application/json");
};

// === STATUS & HELP ===
CopilotTools.status = function() {
  var lookups = CopilotTools.buildLookups();
  var range = CopilotTools.getDateRange();
  var dups = CopilotTools.findDuplicatesInCache();
  console.log("=== COPILOT TOOLS v" + CopilotTools.VERSION + " ===");
  console.log("Accounts: " + Object.keys(lookups.accounts).length);
  console.log("Categories: " + Object.keys(lookups.categories).length);
  console.log("Tags: " + Object.keys(lookups.tags).length);
  console.log("Transactions: " + range.count + " (" + range.min + " to " + range.max + ")");
  console.log("Duplicates in cache: " + dups.length);
  console.log("Dry run mode: " + CopilotTools.config.dryRun);
  return {accounts:Object.keys(lookups.accounts).length,categories:Object.keys(lookups.categories).length,transactions:range.count,duplicates:dups.length};
};

CopilotTools.help = function() {
  console.log("=== COPILOT TOOLS v" + CopilotTools.VERSION + " ===");
  console.log("");
  console.log("IMPORT:");
  console.log("  createTransaction({accountName,date,name,amount,categoryName,type,notes})");
  console.log("  batchCreateTransactions(arr, {dryRun,stopOnDuplicate,onProgress})");
  console.log("  parseCSV(csvString) / importFromCSV(csv, {dryRun})");
  console.log("  analyzeCSVForDuplicates(csv) - Preview before import");
  console.log("");
  console.log("TRANSACTIONS:");
  console.log("  updateTransaction(id, {categoryName,tagIds,notes,name})");
  console.log("  deleteTransaction(id) / bulkUpdateCategory(pattern, category)");
  console.log("  searchTransactions(query, {startDate,endDate})");
  console.log("");
  console.log("CATEGORIES:");
  console.log("  createCategory(name, {parentCategory,colorName})");
  console.log("  updateCategory(name, {name,colorName,parentCategory})");
  console.log("  deleteCategory(name) / mergeCategories(sources[], target)");
  console.log("  listCategoryHierarchy()");
  console.log("");
  console.log("BUDGETS:");
  console.log("  getBudgets() / setBudget(category, amount)");
  console.log("  getBudgetStatus(month) - Spending vs budget");
  console.log("");
  console.log("RECURRING:");
  console.log("  createRecurring(txId, frequency) / updateRecurring(name, updates)");
  console.log("  deleteRecurring(name) / getRecurringTransactions(name)");
  console.log("  addTransactionToRecurring(txId, recurringName)");
  console.log("");
  console.log("ANALYTICS:");
  console.log("  getSpendingTrend(category, months) / getMerchantAnalysis(limit)");
  console.log("  findAnomalies({stdDevMultiple}) / compareMonths(m1, m2)");
  console.log("");
  console.log("TAGS: createTag({name,colorName}) / updateTag(name, updates) / deleteTag(name)");
  console.log("ACCOUNTS: getAccountSummary(name) / listHiddenAccounts()");
  console.log("LOOKUPS: showAccounts(), showCategories(), showTags(), showRecurrings()");
  console.log("EXPORT: exportToJSON(), downloadBackup()");
  console.log("");
  console.log("CONFIG: config.dryRun, config.rateLimit, config.maxRetries");
};

// === INIT ===
console.log("=== COPILOT TOOLS v" + CopilotTools.VERSION + " LOADED ===");
console.log("Run CopilotTools.help() for commands");
console.log("Set CopilotTools.config.dryRun = true to preview changes");

})();