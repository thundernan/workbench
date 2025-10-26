const { ethers } = require('ethers');
require('dotenv').config();

async function setupWorkbenchInstance() {
  try {
    console.log('🔗 Connecting to blockchain...');
    
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const privateKey = process.env.MINTER_PRIVATE_KEY;
    const erc1155Address = process.env.ERC1155_CONTRACT_ADDRESS;
    
    if (!rpcUrl || !privateKey || !erc1155Address) {
      throw new Error('Missing environment variables');
    }
    
    const networkConfig = {
      chainId: 555776,
      name: 'zkxsolla'
    };
    
    const provider = new ethers.JsonRpcProvider(rpcUrl, networkConfig);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('📝 Wallet address:', wallet.address);
    console.log('📝 ERC1155 address:', erc1155Address);
    console.log('');
    
    // WorkbenchFactory ABI
    const factoryABI = [
      'function createInstance() external returns (address)',
      'event WorkbenchInstanceCreated(address indexed instance, address indexed deployer)'
    ];
    
    const factoryAddress = '0xb4c27e256848cE6168339f44D2B5052EB32B6eF3';
    const factory = new ethers.Contract(factoryAddress, factoryABI, wallet);
    
    console.log('🏭 Creating new WorkbenchInstance...');
    console.log('');
    
    // Create instance
    const tx = await factory.createInstance();
    console.log('⏳ Transaction sent:', tx.hash);
    console.log('   Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    console.log('');
    
    // Parse logs to find the instance address
    let instanceAddress = null;
    
    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        
        if (parsed && parsed.name === 'WorkbenchInstanceCreated') {
          instanceAddress = parsed.args.instance;
          console.log('🎉 WorkbenchInstance created:', instanceAddress);
          console.log('   Deployer:', parsed.args.deployer);
          break;
        }
      } catch (e) {
        // Not a WorkbenchInstanceCreated event, continue
      }
    }
    
    if (!instanceAddress) {
      // Try to extract from logs manually
      console.log('⚠️  Could not parse event, checking logs...');
      console.log('Receipt logs count:', receipt.logs.length);
      
      // The instance address is typically in the logs
      // Let's try to find it from the factory's logs
      const factoryLogs = receipt.logs.filter(log => 
        log.address.toLowerCase() === factoryAddress.toLowerCase()
      );
      
      if (factoryLogs.length > 0) {
        // The first topic after the event signature is the instance address
        const log = factoryLogs[0];
        if (log.topics.length >= 2) {
          // topics[0] is event signature, topics[1] is instance (indexed)
          instanceAddress = ethers.getAddress('0x' + log.topics[1].slice(26));
          console.log('📍 Found instance address from logs:', instanceAddress);
        }
      }
    }
    
    if (!instanceAddress) {
      console.log('❌ Could not determine instance address');
      return;
    }
    
    console.log('');
    console.log('⚙️  Configuring WorkbenchInstance...');
    console.log('');
    
    // WorkbenchInstance ABI
    const instanceABI = [
      'function setTokenContract(address _tokenContract) external',
      'function tokenContract() view returns (address)',
      'function tokenContractSet() view returns (bool)',
      'function grantRole(bytes32 role, address account) external',
      'function hasRole(bytes32 role, address account) view returns (bool)',
      'function CRAFTER_ROLE() view returns (bytes32)',
      'function owner() view returns (address)'
    ];
    
    const instance = new ethers.Contract(instanceAddress, instanceABI, wallet);
    
    // Check owner
    const owner = await instance.owner();
    console.log('👤 Instance Owner:', owner);
    console.log('   Is wallet owner?', owner.toLowerCase() === wallet.address.toLowerCase());
    console.log('');
    
    // Set token contract
    console.log('🎮 Setting token contract...');
    const setTokenTx = await instance.setTokenContract(erc1155Address);
    console.log('⏳ Transaction sent:', setTokenTx.hash);
    
    await setTokenTx.wait();
    console.log('✅ Token contract set successfully');
    console.log('');
    
    // Verify token contract
    const tokenContract = await instance.tokenContract();
    const tokenContractSet = await instance.tokenContractSet();
    console.log('📊 Verification:');
    console.log('   Token Contract:', tokenContract);
    console.log('   Is Set:', tokenContractSet);
    console.log('   Matches ERC1155?', tokenContract.toLowerCase() === erc1155Address.toLowerCase());
    console.log('');
    
    // Grant MINTER_ROLE to instance on ERC1155
    console.log('🔑 Granting MINTER_ROLE to WorkbenchInstance...');
    
    const erc1155ABI = [
      'function grantRole(bytes32 role, address account) external',
      'function hasRole(bytes32 role, address account) view returns (bool)',
      'function MINTER_ROLE() view returns (bytes32)'
    ];
    
    const erc1155 = new ethers.Contract(erc1155Address, erc1155ABI, wallet);
    const MINTER_ROLE = await erc1155.MINTER_ROLE();
    
    const grantMinterTx = await erc1155.grantRole(MINTER_ROLE, instanceAddress);
    console.log('⏳ Transaction sent:', grantMinterTx.hash);
    
    await grantMinterTx.wait();
    console.log('✅ MINTER_ROLE granted successfully');
    console.log('');
    
    // Verify MINTER_ROLE
    const hasMinterRole = await erc1155.hasRole(MINTER_ROLE, instanceAddress);
    console.log('📊 Verification:');
    console.log('   Instance has MINTER_ROLE?', hasMinterRole);
    console.log('');
    
    console.log('🎯 WorkbenchInstance Setup Complete!');
    console.log('');
    console.log('=====================================');
    console.log('📋 Configuration Summary:');
    console.log('=====================================');
    console.log('Instance Address:', instanceAddress);
    console.log('Token Contract:', tokenContract);
    console.log('Token Contract Set:', tokenContractSet);
    console.log('Instance has MINTER_ROLE:', hasMinterRole);
    console.log('');
    console.log('📝 Update your .env file with:');
    console.log(`WORKBENCH_INSTANCE_ADDRESS=${instanceAddress}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.transaction) {
      console.log('Transaction:', error.transaction);
    }
  }
}

setupWorkbenchInstance();
