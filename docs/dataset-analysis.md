# FINTRACE — Dataset Analysis

## Files Available

| File | Location | Size | Rows |
|------|----------|------|------|
| HI-Small_Trans.csv | `data/raw/IBM_AML_HI_SMALL/` | ~454 MB | 5,078,345 |
| HI-Small_accounts.csv | `data/raw/IBM_AML_HI_SMALL/` | ~32 MB | 518,581 |
| HI-Small_Patterns.txt | `data/raw/IBM_AML_HI_SMALL/` | ~316 KB | 4,319 lines |

---

## 1. HI-Small_Trans.csv (PRIMARY DATASET)

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `Timestamp` | string | Format: `YYYY/MM/DD HH:MM` |
| `From Bank` | int64 | Numeric bank ID of the sender |
| `Account` | string | Hex-like account ID of the sender (e.g., `8000EBD30`) |
| `To Bank` | int64 | Numeric bank ID of the receiver |
| `Account.1` | string | Hex-like account ID of the receiver |
| `Amount Received` | float64 | Amount received by destination |
| `Receiving Currency` | string | Currency of received amount |
| `Amount Paid` | float64 | Amount paid by source |
| `Payment Currency` | string | Currency of paid amount |
| `Payment Format` | string | Payment method/channel |
| `Is Laundering` | int64 | Label: 0 = legitimate, 1 = laundering |

### Key Statistics

- **Total rows**: 5,078,345
- **Missing values**: NONE (all columns complete)
- **Duplicate rows**: NONE detected in 50k sample
- **Self-transfers** (same source and dest account): ~73.8% of transactions (reinvestments)

### Amount Distribution

| Stat | Amount Received | Amount Paid |
|------|-----------------|-------------|
| Min | 0.01 | 0.01 |
| 25th | 20.42 | 20.42 |
| Median | 2,315.27 | 2,328.20 |
| 75th | 26,195.30 | 26,239.39 |
| Max | 1,561,370,000 | 1,561,370,000 |
| Mean | 846,989 | 847,465 |

Very high standard deviation (~16.8M) indicates extreme right skew. Large outlier transactions exist.

### Categorical Distributions

**Receiving Currency** (9 unique):
- US Dollar: 99.85%
- Euro, Bitcoin, Yuan, Rupee, AUD, MXN, GBP, JPY: remaining ~0.15%

**Payment Currency** (9 unique):
- US Dollar: 99.71%
- Euro, Yuan, Bitcoin, Rupee, Yen, AUD, MXN, GBP: remaining ~0.29%

**Payment Format** (7 unique):

| Format | Count (50k sample) | Percentage |
|--------|-------------------|------------|
| Reinvestment | 36,784 | 73.6% |
| Cheque | 4,664 | 9.3% |
| Credit Card | 4,448 | 8.9% |
| ACH | 2,138 | 4.3% |
| Cash | 1,371 | 2.7% |
| Wire | 575 | 1.2% |
| Bitcoin | 20 | 0.04% |

**Is Laundering**:
- 0 (legitimate): ~99.995%
- 1 (laundering): ~0.005%

Extremely imbalanced label. Only ~5 in 100k rows are laundering. This confirms we should use anomaly detection (Isolation Forest) rather than supervised classification.

### Timestamp Range
- Starts: `2022/09/01 00:00`
- Format: `YYYY/MM/DD HH:MM` (no seconds)

### Account IDs
- Hex-like format: `8000EBD30`, `8000F4580`, etc.
- Unique source accounts (50k sample): 37,383
- Unique dest accounts (50k sample): 36,983

### Bank IDs
- Integer IDs: 10, 3208, 3209, 12, etc.
- ~2,200+ unique banks in source, ~2,100+ in destination

---

## 2. HI-Small_accounts.csv (ENRICHMENT DATASET)

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `Bank Name` | string | Human-readable bank name (e.g., "Portugal Bank #4507") |
| `Bank ID` | int64 | Numeric bank ID - maps to `From Bank` / `To Bank` in transactions |
| `Account Number` | string | Hex-like account ID - maps to `Account` / `Account.1` in transactions |
| `Entity ID` | string | Hex-like entity/customer ID |
| `Entity Name` | string | Entity name (e.g., "Corporation #33520", "Sole Proprietorship #50438") |

### Key Statistics
- **Total rows**: 518,581
- **Unique Entity IDs**: 56,466
- **Unique Bank IDs**: 16,716

### Mapping to Transactions

| Join Field | Transaction Column | Account Column | Overlap (100k sample) |
|------------|-------------------|----------------|----------------------|
| Account ID | `Account` / `Account.1` | `Account Number` | 15,607 matches |
| Bank ID | `From Bank` / `To Bank` | `Bank ID` | 3,158 matches |

The accounts file provides entity enrichment: given an account ID from a transaction, we can look up the owning entity (customer/organization) and the bank name.

---

## 3. HI-Small_Patterns.txt (GROUND TRUTH)

Contains labeled laundering patterns - the actual sequences of transactions that constitute each laundering attempt.

### Laundering Pattern Types (8 total)

| Pattern | Description |
|---------|-------------|
| FAN-OUT | Money fanned out to many accounts |
| FAN-IN | Money collected from many accounts into one |
| CYCLE | Money moved in a circular loop |
| SCATTER-GATHER | Money scattered then gathered |
| GATHER-SCATTER | Money gathered then scattered |
| STACK | Layered transactions |
| BIPARTITE | Two-party structure |
| RANDOM | Random pattern |

- **Total laundering attempts**: 370
- Each attempt is delimited by `BEGIN LAUNDERING ATTEMPT` / `END LAUNDERING ATTEMPT`

---

## 4. Architecture Implications

1. **Primary data**: `HI-Small_Trans.csv` - all detection runs on this
2. **Enrichment**: `HI-Small_accounts.csv` - joins on `Account Number` to get entity names and bank names
3. **Sampling**: With 5M+ rows, the prototype should work on sampled subsets (50k-100k rows) for interactive speed
4. **Self-transfers**: ~73% are reinvestments - must handle/filter appropriately
5. **Amount skew**: Log-transform for ML features
6. **Currency mismatch**: Cross-currency transactions are rare - useful signal
7. **Employee/access log data**: Does NOT exist in IBM dataset - must be synthetically generated
