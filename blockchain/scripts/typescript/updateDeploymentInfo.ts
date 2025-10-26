/**
 * Helper script to update DEPLOYED_CONTRACTS.txt with actual deployment info
 * Usage: Call this after successful deployment with addresses
 */

import * as fs from "fs";
import * as path from "path";

export function updateDeploymentInfo(
  network: string,
  workbenchAddress: string,
  marketplaceAddress: string,
  deployerAddress: string
) {
  const content = `=================================================================
            GAMING CONTRACTS DEPLOYMENT INFO
=================================================================

Network: ${network}
Deployment Date: ${new Date().toISOString()}
Deployer: ${deployerAddress}

-----------------------------------------------------------------
CONTRACTS & ADDRESSES
-----------------------------------------------------------------

Workbench:       ${workbenchAddress}
Marketplace:     ${marketplaceAddress}

-----------------------------------------------------------------
CONSTRUCTOR ARGUMENTS (ENCODED)
-----------------------------------------------------------------

Workbench:       0x
Marketplace:     0x

-----------------------------------------------------------------
VERIFICATION COMMANDS
-----------------------------------------------------------------

Workbench:
  npx hardhat verify --network ${network} ${workbenchAddress}

Marketplace:
  npx hardhat verify --network ${network} ${marketplaceAddress}

-----------------------------------------------------------------
BLOCK EXPLORER LINKS
-----------------------------------------------------------------

Workbench:       https://xsollazk.com/address/${workbenchAddress}
Marketplace:     https://xsollazk.com/address/${marketplaceAddress}

-----------------------------------------------------------------
NOTES
-----------------------------------------------------------------

Both contracts have NO constructor parameters.
The encoded constructor arguments are empty ("0x").

For manual verification on block explorer:
  - Compiler: Solidity 0.8.28
  - Optimization: Yes (200 runs)
  - Constructor Args: 0x
  - License: MIT

Flattened contracts for verification:
  - contracts/flattened/Workbench.flattened.sol
  - contracts/flattened/Marketplace.flattened.sol

=================================================================
`;

  const filePath = path.join(__dirname, "../../DEPLOYED_CONTRACTS.txt");
  fs.writeFileSync(filePath, content);
  console.log(`\n✅ Deployment info saved to: ${filePath}`);
}

// Can also be called directly
if (require.main === module) {
  const [network, workbench, marketplace, deployer] = process.argv.slice(2);
  
  if (!network || !workbench || !marketplace || !deployer) {
    console.error("Usage: ts-node updateDeploymentInfo.ts <network> <workbench_address> <marketplace_address> <deployer_address>");
    process.exit(1);
  }
  
  updateDeploymentInfo(network, workbench, marketplace, deployer);
}

