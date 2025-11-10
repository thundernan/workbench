import hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Wallet } from "zksync-ethers";
import { METADATA } from "../../config/contracts";

/**
 * Deploy GameItemsERC1155 contract
 * Usage: npx hardhat run scripts/typescript/deployERC1155.script.ts
 */
async function main() {
  console.log("🚀 Deploying GameItemsERC1155 Contract...\n");

  // Get the private key from environment
  const privateKey = process.env.TESTNET_KEY || 
                     process.env.LOCAL_TESTNET_PRIVATE_KEY || 
                     process.env.MAINNET_PRIVATE_KEY || "";
  if (!privateKey) {
    throw new Error("Please set TESTNET_KEY, LOCAL_TESTNET_PRIVATE_KEY, or MAINNET_PRIVATE_KEY in your .env file");
  }
  
  console.log(`Using wallet address: ${new Wallet(privateKey).address}`);

  const wallet = new Wallet(privateKey);
  const deployer = new Deployer(hre, wallet);

  // Deploy GameItemsERC1155
  console.log("📦 Deploying GameItemsERC1155 contract...");
  const baseURI = METADATA.baseURI; // Load from centralized config
  const erc1155Artifact = await deployer.loadArtifact("contracts/ERC1155.sol:GameItemsERC1155");
  const erc1155 = await deployer.deploy(erc1155Artifact, [baseURI]);
  const erc1155Address = await erc1155.getAddress();
  console.log(`✅ GameItemsERC1155 deployed to: ${erc1155Address}`);

  console.log("\n✨ Deployment complete!");
  
  return {
    address: erc1155Address,
    deployer: wallet.address,
    constructorArgs: [baseURI]
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });


