#!/usr/bin/env node

/**
 * Check Blockchain Tokens
 * 
 * Scans the blockchain to see which token IDs exist
 */

require('dotenv').config();
const { ethers } = require('ethers');

// Configuration
const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
const ERC1155_CONTRACT_ADDRESS = process.env.ERC1155_CONTRACT_ADDRESS;

// Contract ABI
const ERC1155_ABI = [
  'function tokenNames(uint256 id) view returns (string)',
  'function tokenPrices(uint256 id) view returns (uint256)',
  'function totalSupply(uint256 id) view returns (uint256)'
];

async function checkBlockchainTokens() {
  console.log('🔍 Checking Blockchain Tokens\n');
  console.log('=' .repeat(60));
  
  if (!BLOCKCHAIN_RPC_URL || !ERC1155_CONTRACT_ADDRESS) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }
  
  try {
    console.log('⛓️  Connecting to blockchain...');
    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
    const network = await provider.getNetwork();
    console.log(`✅ Connected: ${network.name} (chainId: ${network.chainId})\n`);
    
    const contract = new ethers.Contract(
      ERC1155_CONTRACT_ADDRESS,
      ERC1155_ABI,
      provider
    );
    
    console.log('📊 Scanning token IDs 0-20...\n');
    
    const existingTokens = [];
    
    for (let tokenId = 0; tokenId <= 20; tokenId++) {
      try {
        const name = await contract.tokenNames(tokenId);
        
        if (name && name.length > 0) {
          const price = await contract.tokenPrices(tokenId);
          const supply = await contract.totalSupply(tokenId);
          
          existingTokens.push({ tokenId, name, price, supply });
          
          console.log(`✅ Token ID ${tokenId}: "${name}"`);
          console.log(`   Price: ${ethers.formatEther(price)} ETH`);
          console.log(`   Supply: ${supply.toString()}`);
          console.log('');
        } else {
          console.log(`⚪ Token ID ${tokenId}: Not created`);
        }
      } catch (error) {
        console.log(`⚪ Token ID ${tokenId}: Not created (error)`);
      }
    }
    
    console.log('=' .repeat(60));
    console.log(`\n📊 Found ${existingTokens.length} existing tokens on blockchain`);
    
    if (existingTokens.length > 0) {
      console.log('\n🎯 Existing Token IDs:', existingTokens.map(t => t.tokenId).join(', '));
      console.log('\n💡 Next available token ID:', Math.max(...existingTokens.map(t => t.tokenId)) + 1);
    } else {
      console.log('\n💡 Next available token ID: 0 or 1');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkBlockchainTokens()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

