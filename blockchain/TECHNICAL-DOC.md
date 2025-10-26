# Technical Implementation Guide
## Gaming Ecosystem

**Solidity Version**: 0.8.28 $ 0.8.24
**Networks**: XSolla Sepolia & Status Network Sepolia

---

## Table of Contents

1. [System Architecture & Design](#1-system-architecture--design)
   - [High-Level Overview](#high-level-overview)
   - [Smart Contract Architecture](#smart-contract-architecture)
   - [Token Economy Design](#token-economy-design)
   - [Data Flow](#data-flow)
   - [Security Model](#security-model)

---

## 1. System Architecture & Design

### High-Level Overview

The system is a blockchain-based gaming ecosystem built on **zkSync Era** (Layer 2 Ethereum) consisting of four interconnected smart contracts using a **Factory Pattern** for scalable crafting systems:

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Application                   │
│              (React/Vue/Angular + Web3)                  │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────────┐    ┌──────────────────────┐
│   Backend Services    │    │   Blockchain Layer    │
│  - Analytics          │◄───┤   - Event Indexing    │
│  - User Management    │    │   - Transaction Pool  │
│  - Caching            │    │   - State Management  │
└──────────┬────────────┘    └──────────┬────────────┘
           │                            │
           └────────────────┬───────────┘
                           ▼
           ┌────────────────────────────────────────┐
           │       Smart Contract Layer             │
           │                                        │
           │  ┌─────────────────────────────────┐  │
           │  │    GameItemsERC1155             │  │
           │  │    (Token Contract)             │  │
           │  │    - Mint with ETH payment      │  │
           │  │    - Reward system              │  │
           │  │    - Burnable tokens            │  │
           │  │    - Role-based access          │  │
           │  └──────────┬──────────────────────┘  │
           │             │  Mints via MINTER_ROLE  │
           │  ┌──────────▼──────────────────────┐  │
           │  │    WorkbenchFactory             │  │
           │  │    - Creates instances          │  │
           │  │    - Tracks deployments         │  │
           │  └──────────┬──────────────────────┘  │
           │             │  Creates               │
           │  ┌──────────▼──────────────────────┐  │
           │  │    WorkbenchInstance(s)         │  │
           │  │    - Recipe management          │  │
           │  │    - Burns ingredients          │  │
           │  │    - Mints outputs              │  │
           │  │    - Pattern matching           │  │
           │  └─────────────────────────────────┘  │
           │                                        │
           │  ┌─────────────────────────────────┐  │
           │  │    Marketplace                  │  │
           │  │    - ETH sales                  │  │
           │  │    - Item swaps                 │  │
           │  │    - Escrow system              │  │
           │  │    - Platform fees              │  │
           │  └─────────────────────────────────┘  │
           └────────────────────────────────────────┘
```

**Key Components**:

1. **GameItemsERC1155**: Multi-token contract for game items (ERC1155 standard)
2. **WorkbenchFactory**: Factory contract that creates WorkbenchInstance contracts
3. **WorkbenchInstance**: Individual crafting system instances (one per user/game)
4. **Marketplace**: Decentralized trading platform with escrow

---

### Smart Contract Architecture

#### 1. GameItemsERC1155 Contract

**Purpose**: Manage all game items as fungible/non-fungible tokens using the ERC1155 multi-token standard

**Architecture Pattern**: ERC1155 Multi-Token Standard + Role-Based Access Control + Burnable + Supply Tracking

```
GameItemsERC1155
├── ERC1155 (OpenZeppelin v4.x)
├── ERC1155Burnable (OpenZeppelin)
├── ERC1155Supply (OpenZeppelin)
├── Ownable
├── AccessControl
└── Custom Extensions
    ├── Pay-to-Mint Module (publicMint/publicMintBatch)
    ├── Loyalty Reward System
    ├── ETH Management Module
    └── Enhanced Burn Functions
```

**State Variables**:
```solidity
// Token metadata and pricing
mapping(uint256 => string) public tokenNames;            // Token ID → Name
mapping(uint256 => uint256) public tokenPrices;          // Token ID → Price in Wei (0 = free)

// Reward system tracking
mapping(address => uint256) public totalSpentByAddress;  // User → Total ETH Spent
mapping(address => bool) public hasReceivedReward;       // User → Reward Received?
uint256 public rewardThreshold;                          // ETH threshold for reward
uint256 public rewardTokenId;                            // Reward NFT token ID
bool public rewardSystemActive;                          // System on/off switch

// Supply tracking inherited from ERC1155Supply
// mapping(uint256 => uint256) totalSupply(tokenId)
```

**Access Roles**:
- `DEFAULT_ADMIN_ROLE`: System administration, create token types, grant roles
- `MINTER_ROLE`: Direct minting without payment (for airdrops, rewards, crafting)
- `OPERATOR_ROLE`: Set prices, manage rewards, withdraw ETH, burn tokens

**Key Functions**:

| Function | Access | Purpose | Gas Cost |
|----------|--------|---------|----------|
| `publicMint()` | Anyone | Mint tokens with ETH payment + reward tracking | ~80k-120k |
| `publicMintBatch()` | Anyone | Mint multiple token types at once | ~150k-250k |
| `mint()` | MINTER_ROLE | Direct mint without payment | ~70k-100k |
| `mintBatch()` | MINTER_ROLE | Direct mint multiple types without payment | ~120k-200k |
| `createTokenType()` | ADMIN | Create new token type with name and price | ~90k |
| `setTokenPrice()` | OPERATOR | Set/update single token price | ~45k |
| `setTokenPricesBatch()` | OPERATOR | Update multiple token prices | ~30k per token |
| `setRewardSystem()` | OPERATOR | Configure reward threshold, token ID, and active status | ~55k |
| `withdrawETH()` | OPERATOR | Withdraw specific amount of collected funds | ~35k |
| `withdrawAllETH()` | OPERATOR | Withdraw all collected funds | ~35k |
| `burnFrom()` | Owner/Approved | Burn tokens from an address | ~45k-65k |
| `burnBatchFrom()` | Owner/Approved | Burn multiple token types from an address | ~80k-120k |
| `isEligibleForReward()` | Anyone (view) | Check if user is eligible for reward | 0 (read) |
| `getContractBalance()` | Anyone (view) | Get contract ETH balance | 0 (read) |

---

#### 2. WorkbenchFactory Contract

**Purpose**: Factory contract to create and track WorkbenchInstance contracts

**Architecture Pattern**: Factory Pattern with Instance Tracking

```
WorkbenchFactory
├── Ownable
└── Instance Management
    ├── Instance Creation
    ├── Deployment Tracking
    └── Query Functions
```

**State Variables**:
```solidity
address[] public allInstances;                           // All created instances
mapping(address => address[]) public instancesByDeployer; // Deployer → Instances
mapping(address => address) public instanceDeployer;      // Instance → Deployer
mapping(address => bool) public isInstance;               // Instance validity check
```

**Key Functions**:

| Function | Access | Purpose | Gas Cost |
|----------|--------|---------|----------|
| `createInstance()` | Anyone | Create new WorkbenchInstance | ~2M-3M |
| `getAllInstances()` | Anyone (view) | Get all created instances | 0 (read) |
| `getInstancesByDeployer()` | Anyone (view) | Get instances by deployer address | 0 (read) |
| `getInstanceCount()` | Anyone (view) | Get total instance count | 0 (read) |
| `isValidInstance()` | Anyone (view) | Check if address is valid instance | 0 (read) |
| `getInstancesPaginated()` | Anyone (view) | Get instances with pagination | 0 (read) |

---

#### 3. WorkbenchInstance Contract

**Purpose**: Individual crafting system instance that works with a single ERC1155 contract

**Architecture Pattern**: Recipe-Based State Machine + Deflationary Token Model

```
WorkbenchInstance
├── Ownable
├── AccessControl
├── ReentrancyGuard
└── Custom Modules
    ├── Token Contract Binding
    ├── Recipe Management
    ├── Grid Pattern Matching
    ├── Crafting Engine (Burns + Mints)
    └── Balance Verification
```

**Core Concepts**:

1. **Single Token Contract**: Each instance works with ONE ERC1155 contract
2. **Recipe System**: Defines how items combine to create new items
3. **Grid-Based Crafting**: 3x3 grid (positions 0-8) for position-sensitive recipes
4. **Deflationary Model**: Ingredients are ALWAYS burned (sent to 0x...dEaD)
5. **Minting Outputs**: Instance must have MINTER_ROLE on the ERC1155 contract

**State Variables**:
```solidity
address public tokenContract;                // The ERC1155 contract this instance operates on
bool public tokenContractSet;                // Whether token contract has been set
uint256 public recipeIdCounter;              // Counter for recipe IDs

struct Ingredient {
    uint256 tokenId;        // Required token ID
    uint256 amount;         // Quantity needed
    uint8 position;         // Grid position (0-8)
}

struct Recipe {
    uint256 outputTokenId;     // Output token ID
    uint256 outputAmount;      // Amount of output tokens
    bool requiresExactPattern; // Position-sensitive matching?
    bool active;               // Recipe enabled?
    string name;               // Recipe name
}

mapping(uint256 => Recipe) public recipes;
mapping(uint256 => mapping(uint256 => Ingredient)) private recipeIngredients;
mapping(uint256 => uint256) public recipeIngredientCounts;
```

**Access Roles**:
- `DEFAULT_ADMIN_ROLE`: Set token contract, manage roles
- `CRAFTER_ROLE`: Create recipes, toggle recipe status

**Key Functions**:

| Function | Access | Purpose | Gas Cost |
|----------|--------|---------|----------|
| `setTokenContract()` | Owner (once) | Bind instance to ERC1155 contract | ~50k |
| `createRecipe()` | CRAFTER | Add new recipe | ~100k-200k |
| `craftWithGrid()` | Anyone | Craft with exact pattern matching | ~150k-300k |
| `craftWithoutGrid()` | Anyone | Craft without pattern (flexible) | ~120k-250k |
| `toggleRecipe()` | CRAFTER | Enable/disable recipe | ~30k |
| `canCraft()` | Anyone (view) | Check if user can craft recipe | 0 (read) |
| `getRecipe()` | Anyone (view) | Get recipe details | 0 (read) |
| `getRecipeIngredients()` | Anyone (view) | Get all ingredients for recipe | 0 (read) |
| `getActiveRecipeIds()` | Anyone (view) | Get all active recipe IDs | 0 (read) |
| `validateGrid()` | Anyone (view) | Validate grid against recipe | 0 (read) |

**Crafting Flow**:

```
User calls craftWithoutGrid(recipeId)
    ↓
1. Validate: token contract set
2. Validate: recipe exists and is active
3. Validate: recipe doesn't require exact pattern
    ↓
4. For each ingredient:
    ├─ Check user has sufficient balance
    ├─ Check user approved instance
    └─ Burn ingredient (transfer to 0x...dEaD)
    ↓
5. Mint output to user
   (Requires instance has MINTER_ROLE on ERC1155)
    ↓
6. Emit ItemCrafted event
```

**Setup Flow for New Instance**:

```
1. Call WorkbenchFactory.createInstance()
   → Returns new instance address
   
2. Call instance.setTokenContract(yourERC1155Address)
   → Binds instance to your token contract
   
3. Grant MINTER_ROLE to instance on ERC1155:
   erc1155.grantRole(MINTER_ROLE, instanceAddress)
   
4. Create recipes using instance.createRecipe()
   
5. Users can now craft!
```

---

#### 4. Marketplace Contract

**Purpose**: Peer-to-peer trading platform for game items with escrow system

**Architecture Pattern**: Escrow-Based Exchange + Fee System + Pausable

```
Marketplace
├── IERC1155Receiver (Can receive ERC1155 tokens)
├── Ownable
├── Pausable
├── ReentrancyGuard
└── Custom Modules
    ├── Listing Management
    ├── ETH Sales Handler
    ├── Item Swap Handler (ERC1155 ↔ ERC1155)
    ├── Fee Collection & Withdrawal
    └── Emergency Pause System
```


**Key Functions**:

| Function | Access | Purpose | Gas Cost |
|----------|--------|---------|----------|
| `listItemForETH()` | Anyone | List item for ETH sale (escrowed) | ~120k-180k |
| `listItemForSwap()` | Anyone | List item for ERC1155 swap (escrowed) | ~130k-190k |
| `buyItemWithETH()` | Anyone | Purchase listed item with ETH | ~150k-220k |
| `swapItem()` | Anyone | Execute item-for-item swap | ~180k-260k |
| `cancelListing()` | Seller | Cancel own listing + retrieve item | ~80k-120k |
| `setPlatformFee()` | Owner | Update platform fee (max 10%) | ~30k |
| `withdrawFees()` | Owner | Withdraw accumulated fees | ~35k |
| `pause()` | Owner | Pause marketplace (emergency) | ~30k |
| `unpause()` | Owner | Unpause marketplace | ~30k |
| `getListing()` | Anyone (view) | Get listing details | 0 (read) |

**Trading Flow (ETH Sale)**:

```
Seller lists item:
    ↓
1. Check seller has sufficient balance
2. Check marketplace is approved
3. Transfer item to Marketplace (escrow)
4. Create listing with price
5. Emit ItemListedForETH event
    ↓
Buyer purchases:
    ↓
6. Buyer sends ETH (>= price)
7. Calculate platform fee (e.g., 2.5%)
8. Mark listing as inactive
9. Accumulate platform fee
10. Transfer escrowed item to buyer
11. Transfer ETH to seller (price - fee)
12. Refund excess ETH to buyer (if any)
13. Emit ItemPurchased event
```

**Trading Flow (Item Swap)**:

```
Seller lists item:
    ↓
1. Transfer item to Marketplace (escrow)
2. Create listing specifying desired swap token
3. Emit ItemListedForSwap event
    ↓
Buyer swaps:
    ↓
4. Check buyer has required swap tokens
5. Check marketplace is approved for swap tokens
6. Mark listing as inactive
7. Transfer escrowed item to buyer
8. Transfer swap tokens from buyer to seller
9. Emit ItemSwapped event
```

---

### Token Economy Design

#### Deflationary Crafting Model

**Design Philosophy**: Controlled deflationary economics through crafting

```
Deflationary Crafting Flow:
User → [Burn Ingredients (0x...dEaD)] → Craft → [Mint Output] → User
                    │                              ▲
                    └──── (Permanently Removed) ───┘

Benefits:
- Predictable deflation rate based on crafting activity
- Increases scarcity of base materials over time
- Creates natural value appreciation for raw materials
- Encourages strategic resource management
```

**Economic Benefits**:
- **For Base Materials**: Value increases as they're consumed in crafting
- **For Crafted Items**: Inherent scarcity from burned ingredients
- **For Game Economy**: Natural anti-inflation mechanism
- **For Players**: Rewards early miners/crafters

#### Revenue Model

**Platform Revenue Streams**:

1. **Minting Revenue** (GameItemsERC1155):
   - Users pay ETH to mint tokens via `publicMint()` or `publicMintBatch()`
   - 100% goes to contract (withdrawable by OPERATOR_ROLE)
   - Configurable per-token pricing
   - Example: Token priced at 0.05 ETH, 1000 mints = 50 ETH revenue
   - Formula: `totalRevenue = Σ(tokenPrice[i] × mintCount[i])`

2. **Marketplace Trading Fees**:
   - Platform takes percentage of each ETH sale (default 2.5%)
   - Formula: `fee = (salePrice × platformFeeBps) / 10000`
   - Configurable up to 10% maximum
   - Only applies to ETH sales (not item swaps)
   - Example: 1 ETH sale @ 2.5% = 0.025 ETH platform fee
   - Accumulated fees withdrawable by owner

3. **Loyalty Reward System** (User retention):
   - Threshold-based rewards encourage repeat purchases
   - Tracks cumulative ETH spent per address
   - Automatically awards reward NFT when threshold reached
   - Configurable reward threshold, token ID, and active status
   - Example: Spend 0.1 ETH → receive exclusive NFT
   - Increases user lifetime value and engagement

**Revenue Summary**:

| Source | Beneficiary | Collection Method | Withdrawable By |
|--------|------------|-------------------|-----------------|
| Token Minting | ERC1155 Contract | `publicMint()` payment | OPERATOR_ROLE |
| Marketplace Fees | Marketplace Contract | % of ETH sales | Owner |
| Reward NFTs | Users | Automatic on threshold | (N/A - User reward) |

---

### Data Flow

#### 1. Minting Flow

```
Frontend                  Backend                 Blockchain
   │                        │                         │
   │ 1. Request price       │                         │
   ├────────────────────────┼────────────────────────►│
   │                        │                         │ tokenPrices[id]
   │◄───────────────────────┼─────────────────────────┤
   │                        │                         │
   │ 2. User clicks "Mint"  │                         │
   │                        │                         │
   │ 3. Call publicMint()   │                         │
   ├────────────────────────┼────────────────────────►│
   │                        │                         │ Execute mint
   │                        │                         │ Track spending
   │                        │                         │ Check reward
   │                        │                         │
   │ 4. Tx hash returned    │                         │
   │◄───────────────────────┼─────────────────────────┤
   │                        │                         │
   │ 5. Wait for confirmation                         │
   ├─────────────────────────────────────────────────►│
   │                        │                         │
   │ 6. Listen for event    │                         │
   │◄───────────────────────┼─────────────────────────┤
   │                        │                         │ TransferSingle event
   │                        │                         │ RewardGiven event (if applicable)
   │                        │                         │
   │ 7. Update UI           │                         │
   │                        │ 8. Index event          │
   │                        │◄────────────────────────┤
   │                        │ 9. Update database      │
   │                        │                         │
```

#### 2. Workbench Instance Creation Flow

```
Frontend                  Backend                 Blockchain
   │                        │                         │
   │ 1. Request factory address                       │
   ├────────────────────────►                         │
   │◄───────────────────────┤ From config/env         │
   │                        │                         │
   │ 2. User clicks "Create Workbench"                │
   │                        │                         │
   │ 3. Call factory.createInstance()                 │
   ├────────────────────────┼────────────────────────►│
   │                        │                         │ Deploy new instance
   │                        │                         │ Grant roles to deployer
   │ 4. Get instance address                          │
   │◄───────────────────────┼─────────────────────────┤ WorkbenchInstanceCreated event
   │                        │                         │
   │ 5. Call instance.setTokenContract(erc1155Address)│
   ├────────────────────────┼────────────────────────►│
   │◄───────────────────────┼─────────────────────────┤ TokenContractSet event
   │                        │                         │
   │ 6. Grant MINTER_ROLE to instance on ERC1155      │
   │    erc1155.grantRole(MINTER_ROLE, instanceAddr)  │
   ├────────────────────────┼────────────────────────►│
   │◄───────────────────────┼─────────────────────────┤ RoleGranted event
   │                        │                         │
   │ 7. Instance ready!     │ 8. Index events         │
   │                        │◄────────────────────────┤
```

#### 3. Crafting Flow

```
Frontend                  Backend                 Blockchain (WorkbenchInstance)
   │                        │                         │
   │ 1. Get active recipes  │                         │
   ├────────────────────────►                         │
   │                        │ Fetch from cache/DB     │
   │◄───────────────────────┤ (or blockchain)         │
   │                        │                         │
   │ 2. Call instance.canCraft(recipeId, userAddress) │
   ├────────────────────────┼────────────────────────►│
   │◄───────────────────────┼─────────────────────────┤ View call (checks balance & approval)
   │                        │                         │
   │ 3. If not approved:    │                         │
   │    erc1155.setApprovalForAll(instanceAddr, true) │
   ├────────────────────────┼────────────────────────►│
   │◄───────────────────────┼─────────────────────────┤ ApprovalForAll event
   │                        │                         │
   │ 4. Call instance.craftWithoutGrid(recipeId)      │
   ├────────────────────────┼────────────────────────►│
   │                        │                         │ 1. Burn ingredients → 0x...dEaD
   │                        │                         │ 2. Mint output → user
   │◄───────────────────────┼─────────────────────────┤ ItemCrafted event
   │                        │                         │
   │ 5. Update UI inventory │ 6. Update analytics     │
   │                        │◄────────────────────────┤
```

#### 4. Marketplace Trading Flow

```
Seller                    Marketplace               Buyer
   │                          │                        │
   │ 1. Approve Marketplace   │                        │
   │    (setApprovalForAll)   │                        │
   ├─────────────────────────►│                        │
   │                          │                        │
   │ 2. List item (ETH/Swap)  │                        │
   ├─────────────────────────►│                        │
   │                          │ Transfer to escrow     │
   │                          │ Create listing         │
   │                          │ Emit event             │
   │                          │                        │
   │                          │ 3. Browse listings     │
   │                          │◄───────────────────────┤
   │                          │                        │
   │                          │ 4. Buy/Swap item       │
   │                          │◄───────────────────────┤
   │                          │ Calculate fee (ETH)    │
   │                          │ Mark inactive          │
   │ 5. Receive ETH (- fee)   │ Transfer item to buyer │
   │    or swap token         │                        │
   │◄─────────────────────────┤───────────────────────►│
   │                          │                        │
```

---

### Security Model

#### Access Control Matrix

| Contract | Role/Owner | Functions | Default Holder | Notes |
|----------|------------|-----------|----------------|-------|
| **GameItemsERC1155** | DEFAULT_ADMIN_ROLE | createTokenType, grantRole, revokeRole | Deployer | System admin |
| | MINTER_ROLE | mint, mintBatch | Deployer + Workbench Instances | For crafting outputs |
| | OPERATOR_ROLE | setPrice, setReward, withdrawETH, burnFrom | Deployer | Operational control |
| | Owner | setURI, transferOwnership | Deployer | Contract owner |
| **WorkbenchFactory** | Owner | (none critical) | Deployer | Minimal privileges |
| **WorkbenchInstance** | Owner | setTokenContract (once) | Instance Deployer | Per-instance owner |
| | DEFAULT_ADMIN_ROLE | grantRole, revokeRole | Instance Deployer | Instance admin |
| | CRAFTER_ROLE | createRecipe, toggleRecipe | Instance Deployer | Recipe management |
| **Marketplace** | Owner | setFee, withdrawFees, pause, unpause | Deployer | Platform control |

#### Security Mechanisms

1. **Reentrancy Protection**:
   - All state-changing functions use `nonReentrant` modifier (ReentrancyGuard)
   - State updates before external calls (Checks-Effects-Interactions pattern)
   - Critical for crafting, minting, and marketplace transactions

2. **Access Control**:
   - OpenZeppelin's AccessControl v4.x for granular permissions
   - Role-based function restrictions
   - Multi-role system (ADMIN, MINTER, OPERATOR, CRAFTER)
   - Role verification on every privileged function call

3. **Pausable Contracts**:
   - Emergency stop for Marketplace (Pausable from OpenZeppelin)
   - Owner can pause/unpause during security incidents
   - Prevents new listings and purchases when paused
   - Existing listings can still be cancelled by sellers

4. **Input Validation**:
   - All user inputs validated before execution
   - Array length checks (recipes, ingredients, batch operations)
   - Zero address checks for recipients and contracts
   - Amount > 0 checks for all transfers
   - Overflow protection (Solidity 0.8.28 built-in)
   - Recipe position validation (0-8 for 3x3 grid)

5. **ETH Handling**:
   - Use `.call{value:}` for transfers (not `.transfer()` or `.send()`)
   - Exact payment requirements in publicMint (no overpayment accepted)
   - Excess payment refund in marketplace buyItemWithETH
   - Pull pattern for fee withdrawal
   - Balance checks before withdrawal

6. **Token Safety**:
   - ERC1155 standard compliance with supply tracking
   - Burnable tokens with OPERATOR_ROLE control
   - Balance verification before burn/transfer operations
   - Approval checks before crafting (isApprovedForAll)
   - Safe transfer functions (safeTransferFrom)

7. **Burn Address Security**:
   - Permanent burn address: `0x000000000000000000000000000000000000dEaD`
   - Tokens sent here are permanently locked (unrecoverable)
   - No private key exists for this address

8. **Instance Isolation**:
   - Each WorkbenchInstance bound to single ERC1155 contract
   - Token contract can only be set once (immutable after first set)
   - Instance deployer has full control over their instance
   - No cross-instance interference

---

## Summary

### Key Implementation Points

1. **Backend**:
   - Event indexer for blockchain events
   - RESTful API for frontend queries

2. **Frontend**:
   - Web3 provider with MetaMask integration
   - Responsive UI components

---
