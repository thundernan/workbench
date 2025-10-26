const { ethers } = require('ethers');
require('dotenv').config();

async function checkWorkbenchConfig() {
  try {
    console.log('🔗 Connecting to blockchain...');
    
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const privateKey = process.env.MINTER_PRIVATE_KEY;
    const workbenchAddress = process.env.WORKBENCH_INSTANCE_ADDRESS;
    const erc1155Address = process.env.ERC1155_CONTRACT_ADDRESS;
    
    if (!rpcUrl || !privateKey || !workbenchAddress) {
      throw new Error('Missing environment variables');
    }
    
    const networkConfig = {
      chainId: 555776,
      name: 'zkxsolla'
    };
    
    const provider = new ethers.JsonRpcProvider(rpcUrl, networkConfig);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('📝 Wallet address:', wallet.address);
    console.log('📝 Workbench address:', workbenchAddress);
    console.log('📝 ERC1155 address:', erc1155Address);
    console.log('');
    
    // WorkbenchInstance ABI (minimal for checking)
    const workbenchABI = [
      'function tokenContract() view returns (address)',
      'function tokenContractSet() view returns (bool)',
      'function recipeIdCounter() view returns (uint256)',
      'function owner() view returns (address)',
      'function hasRole(bytes32 role, address account) view returns (bool)',
      'function CRAFTER_ROLE() view returns (bytes32)',
      'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
      'function setTokenContract(address _tokenContract) external',
      'function grantRole(bytes32 role, address account) external'
    ];
    
    const workbench = new ethers.Contract(workbenchAddress, workbenchABI, wallet);
    
    console.log('🔍 Checking Workbench Configuration...');
    console.log('');
    
    // Check owner
    try {
      const owner = await workbench.owner();
      console.log('👤 Contract Owner:', owner);
      console.log('   Is wallet owner?', owner.toLowerCase() === wallet.address.toLowerCase());
    } catch (error) {
      console.log('⚠️  Could not get owner (might not be Ownable)');
    }
    
    // Check token contract
    try {
      const tokenContract = await workbench.tokenContract();
      const tokenContractSet = await workbench.tokenContractSet();
      
      console.log('');
      console.log('🎮 Token Contract Configuration:');
      console.log('   Token Contract:', tokenContract);
      console.log('   Is Set:', tokenContractSet);
      console.log('   Matches ERC1155?', tokenContract.toLowerCase() === erc1155Address.toLowerCase());
      
      if (!tokenContractSet) {
        console.log('');
        console.log('⚠️  Token contract NOT SET! Need to call setTokenContract()');
      }
    } catch (error) {
      console.log('❌ Error checking token contract:', error.message);
    }
    
    // Check CRAFTER_ROLE
    try {
      const CRAFTER_ROLE = await workbench.CRAFTER_ROLE();
      const hasCrafterRole = await workbench.hasRole(CRAFTER_ROLE, wallet.address);
      
      console.log('');
      console.log('🔑 CRAFTER_ROLE Configuration:');
      console.log('   CRAFTER_ROLE:', CRAFTER_ROLE);
      console.log('   Wallet has CRAFTER_ROLE?', hasCrafterRole);
      
      if (!hasCrafterRole) {
        console.log('');
        console.log('⚠️  Wallet does NOT have CRAFTER_ROLE! Need to grant it.');
      }
    } catch (error) {
      console.log('❌ Error checking CRAFTER_ROLE:', error.message);
    }
    
    // Check DEFAULT_ADMIN_ROLE
    try {
      const DEFAULT_ADMIN_ROLE = await workbench.DEFAULT_ADMIN_ROLE();
      const hasAdminRole = await workbench.hasRole(DEFAULT_ADMIN_ROLE, wallet.address);
      
      console.log('');
      console.log('🔐 DEFAULT_ADMIN_ROLE Configuration:');
      console.log('   DEFAULT_ADMIN_ROLE:', DEFAULT_ADMIN_ROLE);
      console.log('   Wallet has DEFAULT_ADMIN_ROLE?', hasAdminRole);
    } catch (error) {
      console.log('❌ Error checking DEFAULT_ADMIN_ROLE:', error.message);
    }
    
    // Check recipe counter
    try {
      const recipeCount = await workbench.recipeIdCounter();
      console.log('');
      console.log('📊 Recipes Created:', recipeCount.toString());
    } catch (error) {
      console.log('⚠️  Could not get recipe count');
    }
    
    console.log('');
    console.log('=====================================');
    console.log('');
    
    // Offer to fix configuration
    const tokenContractSet = await workbench.tokenContractSet();
    const CRAFTER_ROLE = await workbench.CRAFTER_ROLE();
    const hasCrafterRole = await workbench.hasRole(CRAFTER_ROLE, wallet.address);
    
    if (!tokenContractSet || !hasCrafterRole) {
      console.log('🔧 Configuration needs fixing!');
      console.log('');
      
      if (!tokenContractSet) {
        console.log('📝 To set token contract, run:');
        console.log(`   await workbench.setTokenContract("${erc1155Address}")`);
        console.log('');
      }
      
      if (!hasCrafterRole) {
        console.log('📝 To grant CRAFTER_ROLE, the admin needs to run:');
        console.log(`   await workbench.grantRole("${CRAFTER_ROLE}", "${wallet.address}")`);
        console.log('');
      }
    } else {
      console.log('✅ Workbench is properly configured!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWorkbenchConfig();
