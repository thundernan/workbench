import { HardhatRuntimeEnvironment } from "hardhat/types";
import { StagePriority, deployContract } from "../../../scripts/typescript/helpers/zkSync.helper";

const stage = async (hre: HardhatRuntimeEnvironment) => {
  await deployContract(
    hre,
    "Marketplace",
    [],
    {
      noVerify: false
    }
  );
}

stage.priority = StagePriority.HIGH;
stage.tags = ["marketplace"];

export default stage;

