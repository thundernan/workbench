import { HardhatRuntimeEnvironment } from "hardhat/types";
import { StagePriority, deployContract } from "../scripts/typescript/helpers/zkSync.helper";

/**
 * Deploy WorkbenchFactory contract
 * 
 * This script deploys the WorkbenchFactory contract which allows users to create
 * their own WorkbenchInstance contracts for crafting systems.
 * 
 * Usage: npx hardhat deploy-zksync --script deployWorkbenchFactory.script.ts
 */
const stage = async (hre: HardhatRuntimeEnvironment) => {
  console.log('🚀 Deploying WorkbenchFactory...\n');
  
  await deployContract(
    hre,
    "WorkbenchFactory",
    [],
    {
      noVerify: false
    }
  );
  
  console.log('\n📝 Next Steps:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Save the factory address for your frontend/backend');
  console.log('2. Users can now call factory.createInstance() to create their own workbenches');
  console.log('3. After creating an instance:');
  console.log('   a. Call instance.setTokenContract(yourERC1155Address)');
  console.log('   b. Grant MINTER_ROLE to the instance on your ERC1155 contract');
  console.log('   c. Create recipes using instance.createRecipe()');
  console.log('4. See docs/WORKBENCH_FACTORY_GUIDE.md for detailed usage\n');
}

stage.priority = StagePriority.HIGH;
stage.tags = ["workbench-factory"];

export default stage;

