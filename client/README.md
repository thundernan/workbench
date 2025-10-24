# Workbench MVP

A blockchain-powered crafting and trading platform built with Vue 3, TypeScript, and modern web technologies.

## 🚀 Features

### Core Functionality
- **3×3 Crafting Grid**: Traditional Minecraft-style crafting with live result computation
- **Smart Inventory**: Item management with quantity tracking and rarity indicators
- **Recipe Book**: Browse recipes, preview patterns, and autofill crafting grids
- **Decentralized Trading**: Buy and sell items with other players using blockchain
- **WalletConnect Integration**: Seamless wallet connection for blockchain interactions

### Technical Features
- **Responsive Design**: Mobile-first approach with desktop and mobile layouts
- **Real-time Updates**: Live crafting computation and inventory management
- **Mock Blockchain**: Complete blockchain simulation for development
- **Type Safety**: Full TypeScript implementation with strict typing
- **Modern UI**: Dark theme with emerald accents and smooth animations

## 🛠️ Tech Stack

- **Frontend**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router
- **Build Tool**: Vite
- **Icons**: Heroicons
- **Wallet**: WalletConnect (mocked)

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Usage

### Getting Started
1. Navigate to the Workbench page
2. Connect your wallet (simulated)
3. Start crafting items using the 3×3 grid
4. Manage your inventory and trade with others

### Crafting System
- Drag items from inventory to the crafting grid
- Live recipe matching shows craftable items
- Click "Craft Item" to create items and consume ingredients
- Recipe book provides patterns and autofill functionality

### Trading System
- Browse market offers from other players
- Create your own offers to sell items
- Buy items with mock ETH transactions
- Manage your active offers

### Mobile Experience
- Bottom navigation for mobile devices
- Touch-optimized interface
- Responsive grid layouts

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CraftingGrid.vue    # 3×3 crafting interface
│   ├── InventoryPanel.vue  # Item management
│   ├── ItemIcon.vue        # Item display component
│   ├── RecipeBook.vue      # Recipe browser
│   ├── Toast.vue          # Notification system
│   └── WalletConnectButton.vue
├── stores/              # Pinia state management
│   ├── inventory.ts        # Inventory state
│   ├── recipes.ts          # Recipe data
│   ├── toast.ts           # Notification state
│   └── wallet.ts          # Wallet connection
├── types/               # TypeScript definitions
│   └── index.ts
├── views/               # Page components
│   ├── Home.vue           # Landing page
│   ├── Workbench.vue      # Main crafting interface
│   └── Trading.vue        # Trading marketplace
└── router/              # Vue Router configuration
    └── index.ts
```

## 🎨 Design System

### Color Palette
- **Background**: Slate 900/800/700
- **Accent**: Emerald 600/500/400
- **Text**: White/Slate 300/400
- **Borders**: Slate 600/500

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Hover states and loading indicators
- **Icons**: Emoji-based with rarity color coding
- **Grids**: Responsive layouts with gap spacing

## 🔧 Development

### Adding New Items
```typescript
// In stores/inventory.ts
const newItem: Item = {
  id: 'new_item',
  name: 'New Item',
  description: 'Item description',
  icon: '🆕',
  rarity: 'common',
  category: 'material'
};
```

### Adding New Recipes
```typescript
// In stores/recipes.ts
const newRecipe: Recipe = {
  id: 'new_recipe',
  name: 'New Recipe',
  description: 'Recipe description',
  result: newItem,
  ingredients: [...],
  grid: [[...], [...], [...]]
};
```

### Mock Blockchain Functions
- `connectWallet()`: Simulates wallet connection
- `sendCraftTx(recipeId)`: Mocks crafting transaction
- `sendTransaction(to, data)`: Mocks general transaction

## 🚀 Deployment

The application is built as a static site and can be deployed to any static hosting service:

```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting service
```

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

- [ ] Real blockchain integration
- [ ] Smart contract deployment
- [ ] Advanced crafting recipes
- [ ] Player-to-player trading
- [ ] NFT item support
- [ ] Multi-chain support
- [ ] Mobile app development

---

Built with ❤️ using Vue 3, TypeScript, and modern web technologies.