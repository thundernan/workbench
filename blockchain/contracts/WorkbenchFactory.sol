// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { WorkbenchInstance } from './WorkbenchInstance.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

/// @title WorkbenchFactory
/// @notice Factory contract to create WorkbenchInstance contracts
/// @dev Allows any user to create their own crafting workbench instance
/// @dev Each instance can be configured to work with a specific ERC1155 token contract
contract WorkbenchFactory is Ownable {
    /// @notice Array of all created workbench instances
    address[] public allInstances;

    /// @notice Mapping from deployer address to their created instances
    mapping(address => address[]) public instancesByDeployer;

    /// @notice Mapping from instance address to deployer address
    mapping(address => address) public instanceDeployer;

    /// @notice Mapping to check if an address is a valid instance
    mapping(address => bool) public isInstance;

    /// @notice Event emitted when a new workbench instance is created
    event WorkbenchInstanceCreated(
        address indexed instance,
        address indexed deployer,
        uint256 instanceIndex
    );

    /// @notice Constructor sets the deployer as the factory owner
    /// @dev Factory owner doesn't have special privileges; anyone can create instances
    /// @dev In OpenZeppelin v4.x, Ownable automatically sets msg.sender as owner
    constructor() {
        // Ownable automatically sets msg.sender as owner in v4.x
        // No additional initialization needed for now
    }

    /// @notice Creates a new WorkbenchInstance
    /// @return instance The address of the newly created WorkbenchInstance
    /// @dev The caller becomes the owner and admin of the new instance
    /// @dev After creation, caller should:
    /// @dev 1. Call setTokenContract() on the instance with their ERC1155 address
    /// @dev 2. Grant MINTER_ROLE to the instance on their ERC1155 contract
    function createInstance() external returns (address instance) {
        // Create new instance with msg.sender as the deployer
        WorkbenchInstance newInstance = new WorkbenchInstance(msg.sender);
        
        address instanceAddress = address(newInstance);
        
        // Track the instance
        allInstances.push(instanceAddress);
        instancesByDeployer[msg.sender].push(instanceAddress);
        instanceDeployer[instanceAddress] = msg.sender;
        isInstance[instanceAddress] = true;
        
        emit WorkbenchInstanceCreated(instanceAddress, msg.sender, allInstances.length - 1);
        
        return instanceAddress;
    }

    /// @notice Gets the total number of instances created
    /// @return count The total number of instances
    function getInstanceCount() external view returns (uint256 count) {
        return allInstances.length;
    }

    /// @notice Gets all instances created by a specific deployer
    /// @param deployer The address of the deployer
    /// @return instances Array of instance addresses
    function getInstancesByDeployer(address deployer) external view returns (address[] memory instances) {
        return instancesByDeployer[deployer];
    }

    /// @notice Gets the number of instances created by a specific deployer
    /// @param deployer The address of the deployer
    /// @return count The number of instances
    function getInstanceCountByDeployer(address deployer) external view returns (uint256 count) {
        return instancesByDeployer[deployer].length;
    }

    /// @notice Gets the deployer of a specific instance
    /// @param instance The address of the instance
    /// @return deployer The address of the deployer
    function getInstanceDeployer(address instance) external view returns (address deployer) {
        require(isInstance[instance], "Not a valid instance");
        return instanceDeployer[instance];
    }

    /// @notice Gets all created instances
    /// @return instances Array of all instance addresses
    function getAllInstances() external view returns (address[] memory instances) {
        return allInstances;
    }

    /// @notice Gets a paginated list of instances
    /// @param offset The starting index
    /// @param limit The maximum number of instances to return
    /// @return instances Array of instance addresses
    /// @return total The total number of instances
    function getInstancesPaginated(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory instances, uint256 total) 
    {
        total = allInstances.length;
        
        if (offset >= total) {
            return (new address[](0), total);
        }
        
        uint256 remaining = total - offset;
        uint256 returnSize = remaining < limit ? remaining : limit;
        
        instances = new address[](returnSize);
        for (uint256 i = 0; i < returnSize; i++) {
            instances[i] = allInstances[offset + i];
        }
        
        return (instances, total);
    }

    /// @notice Checks if an address is a valid instance created by this factory
    /// @param instance The address to check
    /// @return valid Whether the address is a valid instance
    function isValidInstance(address instance) external view returns (bool valid) {
        return isInstance[instance];
    }
}

