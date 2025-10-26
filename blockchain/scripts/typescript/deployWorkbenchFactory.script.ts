import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Wallet } from 'zksync-ethers';
import * as hre from 'hardhat';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/dist/types';

/**
 * Deploy WorkbenchFactory contract
 * 
 * This script deploys the WorkbenchFactory contract which allows users to create
 * their own WorkbenchInstance contracts for crafting systems.
 * 
 * Usage:
 * npx hardhat deploy-zksync --script deployWorkbenchFactory.script.ts
 */
async function main() {
  console.log('🚀 Starting WorkbenchFactory deployment...\n');

  // Get private key from environment
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('⛔️ WALLET_PRIVATE_KEY not found in environment variables');
  }

  // Initialize wallet and deployer
  const wallet = new Wallet(privateKey);
  const deployer = new Deployer(hre, wallet);

  console.log('📋 Deployment Details:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer.zkWallet.address}`);
  console.log(`Balance: ${await deployer.zkWallet.getBalance()} wei\n`);

  // Load contract artifact
  const artifact: ZkSyncArtifact = await deployer.loadArtifact('WorkbenchFactory');

  // Deploy WorkbenchFactory
  console.log('📦 Deploying WorkbenchFactory...');
  const factoryContract = await deployer.deploy(artifact, []);
  const factoryAddress = await factoryContract.getAddress();

  console.log('✅ WorkbenchFactory deployed!\n');
  console.log('📋 Deployment Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Contract: WorkbenchFactory`);
  console.log(`Address: ${factoryAddress}`);
  console.log(`Deployer: ${deployer.zkWallet.address}`);
  console.log(`Owner: ${deployer.zkWallet.address}\n`);

  // Verify the contract is functional
  console.log('🔍 Verifying deployment...');
  try {
    const instanceCount = await factoryContract.getInstanceCount();
    console.log(`✅ Contract is functional (instance count: ${instanceCount})\n`);
  } catch (error) {
    console.log('⚠️  Could not verify contract functionality:', error);
  }

  console.log('📝 Next Steps:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Save the factory address for your frontend/backend');
  console.log('2. Users can now call factory.createInstance() to create their own workbenches');
  console.log('3. After creating an instance:');
  console.log('   a. Call instance.setTokenContract(yourERC1155Address)');
  console.log('   b. Grant MINTER_ROLE to the instance on your ERC1155 contract');
  console.log('   c. Create recipes using instance.createRecipe()');
  console.log('4. See docs/WORKBENCH_FACTORY_GUIDE.md for detailed usage\n');

  // Return deployment info
  return {
    factoryAddress,
    deployer: deployer.zkWallet.address,
    network: hre.network.name,
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log('🎉 Deployment completed successfully!\n');
    console.log('Deployment Result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });

