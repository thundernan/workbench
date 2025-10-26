// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { ERC1155Burnable } from '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol';
import { ERC1155Supply } from '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { AccessControl } from '@openzeppelin/contracts/access/AccessControl.sol';

/// @title GameItemsERC1155
/// @notice A standard ERC1155 token contract for game items with minting, burning, and supply tracking
/// @dev Extends OpenZeppelin's ERC1155 with burnable, supply tracking, and access control features
contract GameItemsERC1155 is ERC1155, ERC1155Burnable, ERC1155Supply, Ownable, AccessControl {
    /// @notice Role identifier for minters who can create new tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    /// @notice Role identifier for operators who can manage tokens on behalf of users
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Mapping from token ID to token name
    mapping(uint256 => string) public tokenNames;

    /// @notice Mapping from token ID to mint price in wei (0 means free)
    mapping(uint256 => uint256) public tokenPrices;

    /// @notice Mapping to track total ETH spent by each address on minting
    mapping(address => uint256) public totalSpentByAddress;

    /// @notice ETH threshold required to receive reward NFT
    uint256 public rewardThreshold;

    /// @notice Token ID of the reward NFT
    uint256 public rewardTokenId;

    /// @notice Mapping to track if an address has already received the reward
    mapping(address => bool) public hasReceivedReward;

    /// @notice Whether the reward system is active
    bool public rewardSystemActive;

    /// @notice Event emitted when a new token type is created
    /// @param id The ID of the newly created token
    /// @param name The name of the newly created token
    /// @param price The mint price of the newly created token in wei
    event TokenCreated(uint256 indexed id, string name, uint256 price);

    /// @notice Event emitted when the URI is updated
    /// @param newUri The new URI
    event URIUpdated(string newUri);

    /// @notice Event emitted when a token price is updated
    /// @param id The token ID
    /// @param price The new price in wei
    event TokenPriceUpdated(uint256 indexed id, uint256 price);

    /// @notice Event emitted when ETH is withdrawn from the contract
    /// @param operator The address that withdrew the ETH
    /// @param amount The amount of ETH withdrawn
    event ETHWithdrawn(address indexed operator, uint256 amount);

    /// @notice Event emitted when a reward is given to a user
    /// @param recipient The address that received the reward
    /// @param tokenId The token ID of the reward NFT
    /// @param totalSpent The total amount of ETH spent by the recipient
    event RewardGiven(address indexed recipient, uint256 tokenId, uint256 totalSpent);

    /// @notice Event emitted when reward system configuration is updated
    /// @param threshold The new ETH threshold for rewards
    /// @param tokenId The reward token ID
    /// @param active Whether the reward system is active
    event RewardSystemUpdated(uint256 threshold, uint256 tokenId, bool active);

    /// @notice Initializes the contract with a base URI
    /// @param uri_ The base URI for all token types
    constructor(string memory uri_) ERC1155(uri_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    /// @notice Sets the base URI for all token types
    /// @param newuri The new base URI
    /// @dev Only callable by the contract owner
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
        emit URIUpdated(newuri);
    }

    /// @notice Creates a new token type with a name and price
    /// @param id The ID for the new token type
    /// @param name The name for the new token type
    /// @param price The mint price in wei (0 for free minting)
    /// @dev Only callable by accounts with DEFAULT_ADMIN_ROLE
    function createTokenType(uint256 id, string memory name, uint256 price) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(tokenNames[id]).length == 0, "Token type already exists");
        tokenNames[id] = name;
        tokenPrices[id] = price;
        emit TokenCreated(id, name, price);
    }

    /// @notice Mints tokens to a single address
    /// @param to The address to mint tokens to
    /// @param id The token ID to mint
    /// @param amount The amount of tokens to mint
    /// @param data Additional data with no specified format
    /// @dev Only callable by accounts with MINTER_ROLE
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, data);
    }

    /// @notice Mints multiple token types to a single address
    /// @param to The address to mint tokens to
    /// @param ids Array of token IDs to mint
    /// @param amounts Array of amounts to mint for each token ID
    /// @param data Additional data with no specified format
    /// @dev Only callable by accounts with MINTER_ROLE
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyRole(MINTER_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    /// @notice Sets the price for minting a token type
    /// @param id The token ID to set price for
    /// @param price The price in wei (0 for free minting)
    /// @dev Only callable by accounts with OPERATOR_ROLE
    function setTokenPrice(uint256 id, uint256 price) external onlyRole(OPERATOR_ROLE) {
        tokenPrices[id] = price;
        emit TokenPriceUpdated(id, price);
    }

    /// @notice Sets prices for multiple token types at once
    /// @param ids Array of token IDs
    /// @param prices Array of prices in wei
    /// @dev Only callable by accounts with OPERATOR_ROLE
    function setTokenPricesBatch(uint256[] memory ids, uint256[] memory prices) external onlyRole(OPERATOR_ROLE) {
        require(ids.length == prices.length, "Arrays length mismatch");
        for (uint256 i = 0; i < ids.length; i++) {
            tokenPrices[ids[i]] = prices[i];
            emit TokenPriceUpdated(ids[i], prices[i]);
        }
    }

    /// @notice Public mint function that requires ETH payment
    /// @param id The token ID to mint
    /// @param amount The amount of tokens to mint
    /// @dev Caller must send exact ETH amount (price * amount). Free tokens (price = 0) don't require payment.
    /// @dev Automatically tracks spending and awards reward NFT when threshold is reached
    function publicMint(uint256 id, uint256 amount) external payable {
        uint256 totalPrice = tokenPrices[id] * amount;
        require(msg.value == totalPrice, "Incorrect ETH amount sent");
        
        // Track spending if ETH was sent
        if (msg.value > 0) {
            totalSpentByAddress[msg.sender] += msg.value;
            _checkAndGiveReward(msg.sender);
        }
        
        _mint(msg.sender, id, amount, "");
    }

    /// @notice Public mint function for multiple token types that requires ETH payment
    /// @param ids Array of token IDs to mint
    /// @param amounts Array of amounts to mint for each token ID
    /// @dev Caller must send exact total ETH amount. Free tokens (price = 0) don't require payment.
    /// @dev Automatically tracks spending and awards reward NFT when threshold is reached
    function publicMintBatch(uint256[] memory ids, uint256[] memory amounts) external payable {
        require(ids.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalPrice = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            totalPrice += tokenPrices[ids[i]] * amounts[i];
        }
        
        require(msg.value == totalPrice, "Incorrect ETH amount sent");
        
        // Track spending if ETH was sent
        if (msg.value > 0) {
            totalSpentByAddress[msg.sender] += msg.value;
            _checkAndGiveReward(msg.sender);
        }
        
        _mintBatch(msg.sender, ids, amounts, "");
    }

    /// @notice Withdraws collected ETH from the contract
    /// @param to The address to send the ETH to
    /// @param amount The amount of ETH to withdraw (in wei)
    /// @dev Only callable by accounts with OPERATOR_ROLE
    function withdrawETH(address payable to, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        require(to != address(0), "Cannot withdraw to zero address");
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit ETHWithdrawn(msg.sender, amount);
    }

    /// @notice Withdraws all collected ETH from the contract
    /// @param to The address to send the ETH to
    /// @dev Only callable by accounts with OPERATOR_ROLE
    function withdrawAllETH(address payable to) external onlyRole(OPERATOR_ROLE) {
        require(to != address(0), "Cannot withdraw to zero address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool success, ) = to.call{value: balance}("");
        require(success, "ETH transfer failed");
        
        emit ETHWithdrawn(msg.sender, balance);
    }

    /// @notice Gets the contract's current ETH balance
    /// @return The balance in wei
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Configures the reward system
    /// @param threshold The ETH amount (in wei) that needs to be spent to receive a reward
    /// @param tokenId The token ID of the reward NFT
    /// @param active Whether the reward system should be active
    /// @dev Only callable by accounts with OPERATOR_ROLE
    function setRewardSystem(uint256 threshold, uint256 tokenId, bool active) external onlyRole(OPERATOR_ROLE) {
        rewardThreshold = threshold;
        rewardTokenId = tokenId;
        rewardSystemActive = active;
        emit RewardSystemUpdated(threshold, tokenId, active);
    }

    /// @notice Checks if an address is eligible for a reward
    /// @param user The address to check
    /// @return eligible Whether the address is eligible (has spent enough and hasn't received reward yet)
    function isEligibleForReward(address user) external view returns (bool eligible) {
        if (!rewardSystemActive || rewardThreshold == 0) {
            return false;
        }
        return totalSpentByAddress[user] >= rewardThreshold && !hasReceivedReward[user];
    }

    /// @notice Manually gives reward to eligible users (in case automatic reward failed)
    /// @param users Array of addresses to give rewards to
    /// @dev Only callable by accounts with OPERATOR_ROLE
    /// @dev Only gives rewards to eligible users who haven't received it yet
    function manualReward(address[] memory users) external onlyRole(OPERATOR_ROLE) {
        require(rewardSystemActive, "Reward system is not active");
        require(rewardThreshold > 0, "Reward threshold not set");
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (totalSpentByAddress[user] >= rewardThreshold && !hasReceivedReward[user]) {
                hasReceivedReward[user] = true;
                _mint(user, rewardTokenId, 1, "");
                emit RewardGiven(user, rewardTokenId, totalSpentByAddress[user]);
            }
        }
    }

    /// @notice Internal function to check and give reward if eligible
    /// @param user The address to check and potentially reward
    function _checkAndGiveReward(address user) private {
        if (!rewardSystemActive || rewardThreshold == 0) {
            return;
        }
        
        if (totalSpentByAddress[user] >= rewardThreshold && !hasReceivedReward[user]) {
            hasReceivedReward[user] = true;
            _mint(user, rewardTokenId, 1, "");
            emit RewardGiven(user, rewardTokenId, totalSpentByAddress[user]);
        }
    }

    /// @notice Burns tokens from the caller's account
    /// @param from The address to burn tokens from
    /// @param id The token ID to burn
    /// @param amount The amount of tokens to burn
    /// @dev Can be called by the token owner or approved operators
    function burnFrom(
        address from,
        uint256 id,
        uint256 amount
    ) external {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()) || hasRole(OPERATOR_ROLE, _msgSender()),
            "Caller is not owner nor approved"
        );
        _burn(from, id, amount);
    }

    /// @notice Burns multiple token types from an address
    /// @param from The address to burn tokens from
    /// @param ids Array of token IDs to burn
    /// @param amounts Array of amounts to burn for each token ID
    /// @dev Can be called by the token owner or approved operators
    function burnBatchFrom(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()) || hasRole(OPERATOR_ROLE, _msgSender()),
            "Caller is not owner nor approved"
        );
        _burnBatch(from, ids, amounts);
    }

    /// @notice Returns the name of a token type
    /// @param id The token ID to query
    /// @return The name of the token type
    function getTokenName(uint256 id) external view returns (string memory) {
        return tokenNames[id];
    }

    /// @notice Checks if a token type exists
    /// @param id The token ID to check
    /// @return True if the token type exists, false otherwise
    function tokenExists(uint256 id) external view returns (bool) {
        return totalSupply(id) > 0 || bytes(tokenNames[id]).length > 0;
    }

    // Required overrides

    /// @inheritdoc ERC1155Supply
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /// @inheritdoc AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
