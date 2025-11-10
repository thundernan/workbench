import hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet } from "zksync-ethers";
import * as fs from "fs";
import * as path from "path";
import { updateDeploymentInfo } from "./updateDeploymentInfo";

/**
 * Deploy Workbench and Marketplace contracts
 * Usage: npx hardhat run scripts/typescript/deployGaming.script.ts
 */
async function main() {
  console.log("🚀 Deploying Gaming Contracts (Workbench & Marketplace)...\n");

  // Get the private key from environment (try multiple keys)
  const privateKey = process.env.TESTNET_KEY || 
                     process.env.LOCAL_TESTNET_PRIVATE_KEY || 
                     process.env.MAINNET_PRIVATE_KEY || "";
  if (!privateKey) {
    throw new Error("Please set TESTNET_KEY, LOCAL_TESTNET_PRIVATE_KEY, or MAINNET_PRIVATE_KEY in your .env file");
  }
  
  console.log(`Using wallet address: ${new Wallet(privateKey).address}`);

  const wallet = new Wallet(privateKey);
  const deployer = new Deployer(hre, wallet);

  // Deploy Workbench (use fully qualified name to avoid conflict with flattened version)
  console.log("📦 Deploying Workbench contract...");
  const workbenchArtifact = await deployer.loadArtifact("contracts/Workbench.sol:Workbench");
  const workbench = await deployer.deploy(workbenchArtifact, []);
  const workbenchAddress = await workbench.getAddress();
  console.log(`✅ Workbench deployed to: ${workbenchAddress}`);

  // Deploy Marketplace (use fully qualified name to avoid conflict with flattened version)
  console.log("\n📦 Deploying Marketplace contract...");
  const marketplaceArtifact = await deployer.loadArtifact("contracts/Marketplace.sol:Marketplace");
  const marketplace = await deployer.deploy(marketplaceArtifact, []);
  const marketplaceAddress = await marketplace.getAddress();
  console.log(`✅ Marketplace deployed to: ${marketplaceAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      Workbench: {
        address: workbenchAddress,
        constructorArgs: [],
        constructorArgsEncoded: "0x"
      },
      Marketplace: {
        address: marketplaceAddress,
        constructorArgs: [],
        constructorArgsEncoded: "0x"
      }
    }
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `gaming-${hre.network.name}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Update the main deployment info file
  updateDeploymentInfo(
    hre.network.name,
    workbenchAddress,
    marketplaceAddress,
    wallet.address
  );

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🎮 GAMING CONTRACTS DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`\n📝 Contract Addresses:`);
  console.log(`   Workbench:   ${workbenchAddress}`);
  console.log(`   Marketplace: ${marketplaceAddress}`);
  console.log(`\n🔍 Verification Commands:`);
  console.log(`   Workbench:`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${workbenchAddress}`);
  console.log(`\n   Marketplace:`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${marketplaceAddress}`);
  console.log("\n" + "=".repeat(60));
  console.log("\n📚 Next Steps:");
  console.log("1. Verify contracts on block explorer (see commands above)");
  console.log("2. Configure Workbench roles (grantRole for CRAFTER and DISTRIBUTOR)");
  console.log("3. Register own tokens in Workbench (setOwnToken)");
  console.log("4. Set Marketplace platform fee if needed (default is 2.5%)");
  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

