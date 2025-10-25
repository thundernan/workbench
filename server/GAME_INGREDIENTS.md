# Workbench Game Ingredients Database

## Overview
This document contains all 30 ingredients created for the Workbench blockchain crafting game. Each ingredient is represented by a MongoDB document with the following structure:

```typescript
interface Ingredient {
  _id: string;           // MongoDB ObjectId
  tokenContract: string;  // ERC1155 contract address
  tokenId: number;        // Token ID within the contract
  amount: number;         // Required amount for crafting
  position: number;       // Position in 3x3 crafting grid (0-8)
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

## Ingredient Categories

### 1. Basic Materials (Ores) - Contract: 0x1111111111111111111111111111111111111111
| Name | Token ID | Amount | Position | Description |
|------|----------|--------|----------|-------------|
| Iron Ore | 1 | 10 | 0 | Common metal ore for basic crafting |
| Copper Ore | 2 | 8 | 1 | Conductive metal for electrical components |
| Silver Ore | 3 | 6 | 2 | Precious metal for magical items |
| Gold Ore | 4 | 4 | 3 | Rare metal for high-value crafting |
| Diamond Ore | 5 | 2 | 4 | Extremely rare ore for legendary items |

### 2. Wood Materials - Contract: 0x2222222222222222222222222222222222222222
| Name | Token ID | Amount | Position | Description |
|------|----------|--------|----------|-------------|
| Oak Wood | 1 | 15 | 0 | Sturdy wood for basic construction |
| Pine Wood | 2 | 12 | 1 | Light wood for furniture and tools |
| Cedar Wood | 3 | 10 | 2 | Aromatic wood with natural resistance |
| Mahogany Wood | 4 | 8 | 3 | Premium wood for luxury items |
| Ebony Wood | 5 | 5 | 4 | Dark, dense wood for magical crafting |

### 3. Gem Materials - Contract: 0x3333333333333333333333333333333333333333
| Name | Token ID | Amount | Position | Description |
|------|----------|--------|----------|-------------|
| Ruby | 1 | 3 | 0 | Red gemstone for fire-based enchantments |
| Sapphire | 2 | 3 | 1 | Blue gemstone for water-based enchantments |
| Emerald | 3 | 3 | 2 | Green gemstone for nature-based enchantments |
| Amethyst | 4 | 2 | 3 | Purple gemstone for mystical enchantments |
| Diamond | 5 | 1 | 4 | Clear gemstone for pure magical energy |

### 4. Magic Materials - Contract: 0x4444444444444444444444444444444444444444
| Name | Token ID | Amount | Position | Description |
|------|----------|--------|----------|-------------|
| Magic Dust | 1 | 5 | 0 | Basic magical component for simple spells |
| Crystal Shard | 2 | 4 | 1 | Concentrated magical energy fragment |
| Mana Essence | 3 | 3 | 2 | Pure magical energy in liquid form |
| Soul Fragment | 4 | 2 | 3 | Rare spiritual energy for powerful magic |
| Divine Spark | 5 | 1 | 4 | Celestial energy for god-tier crafting |

### 5. Crafted Components - Contract: 0x5555555555555555555555555555555555555555
| Name | Token ID | Amount | Position | Description |
|------|----------|--------|----------|-------------|
| Iron Ingot | 1 | 6 | 0 | Refined iron ready for advanced crafting |
| Steel Ingot | 2 | 5 | 1 | Alloyed metal stronger than iron |
| Mithril Ingot | 3 | 4 | 2 | Mythical metal lighter than steel |
| Adamantine Ingot | 4 | 3 | 3 | Legendary metal harder than diamond |
| Orichalcum Ingot | 5 | 2 | 4 | Ancient metal with magical properties |

### 6. Special Items - Contract: 0x6666666666666666666666666666666666666666
| Name | Token ID | Amount | Position | Description |
|------|----------|--------|----------|-------------|
| Phoenix Feather | 1 | 1 | 0 | Mythical feather with resurrection properties |
| Dragon Scale | 2 | 1 | 1 | Indestructible scale from ancient dragons |
| Unicorn Horn | 3 | 1 | 2 | Pure magical horn with healing properties |
| Griffin Claw | 4 | 1 | 3 | Sharp claw from legendary griffin |
| Ancient Relic | 5 | 1 | 4 | Mysterious artifact from lost civilizations |

## Crafting Grid Positions

The 3x3 crafting grid uses the following position mapping:
```
[0] [1] [2]
[3] [4] [5]
[6] [7] [8]
```

## Rarity Levels

Based on the amount required and token contracts:

### Common (Amount: 10-15)
- Oak Wood (15)
- Iron Ore (10)
- Cedar Wood (10)

### Uncommon (Amount: 6-9)
- Pine Wood (12)
- Copper Ore (8)
- Silver Ore (6)
- Iron Ingot (6)

### Rare (Amount: 3-5)
- Gold Ore (4)
- Steel Ingot (5)
- Magic Dust (5)
- Ebony Wood (5)
- Ruby, Sapphire, Emerald (3 each)

### Epic (Amount: 2)
- Diamond Ore (2)
- Amethyst (2)
- Soul Fragment (2)
- Orichalcum Ingot (2)

### Legendary (Amount: 1)
- Diamond (1)
- Divine Spark (1)
- All Special Items (1 each)

## Usage Examples

### Basic Sword Recipe
- Iron Ingot (Position 0)
- Oak Wood (Position 1)
- Magic Dust (Position 2)

### Legendary Staff Recipe
- Orichalcum Ingot (Position 0)
- Dragon Scale (Position 1)
- Divine Spark (Position 2)
- Ancient Relic (Position 3)

### Healing Potion Recipe
- Mana Essence (Position 0)
- Unicorn Horn (Position 1)
- Emerald (Position 2)

## Database Statistics

- **Total Ingredients**: 30
- **Token Contracts**: 6
- **Unique Token IDs**: 30 (5 per contract)
- **Position Distribution**: 0-4 (5 positions used per contract)
- **Amount Range**: 1-15
- **Average Amount**: 4.5

## API Endpoints for Game Integration

- **Get All Ingredients**: `GET /api/ingredients`
- **Get by Contract**: `GET /api/ingredients/token-contract/{address}`
- **Get by Position**: `GET /api/ingredients/position/{position}`
- **Create Recipe**: `POST /api/ingredients` (for custom recipes)
- **Bulk Operations**: `POST /api/ingredients/bulk-create`

## Notes for Game Development

1. **Token Contracts**: Each category uses a different contract address for easy filtering
2. **Position System**: Ingredients are distributed across positions 0-4 for balanced crafting
3. **Amount Scaling**: Rarer items require fewer amounts but are harder to obtain
4. **Crafting Logic**: Use position-based recipes for 3x3 grid crafting system
5. **Rarity System**: Implement drop rates based on amount requirements
