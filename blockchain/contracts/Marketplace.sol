// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC1155 } from '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import { IERC1155Receiver } from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import { ReentrancyGuard } from '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import { Pausable } from '@openzeppelin/contracts/security/Pausable.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

/// @title Marketplace
/// @notice A marketplace contract where users can list items for sale (ETH) or for swap (item-for-item)
/// @dev Supports ERC1155 tokens with both ETH-based sales and item swaps
contract Marketplace is IERC1155Receiver, ReentrancyGuard, Pausable, Ownable {
    /// @notice Enum to define the type of listing
    enum ListingType {
        ETH_SALE,      // Item listed for ETH
        ITEM_SWAP      // Item listed for swap with another item
    }

    /// @notice Structure to hold listing information
    struct Listing {
        address seller;           // Address of the seller
        address tokenContract;    // Address of the ERC1155 contract
        uint256 tokenId;          // Token ID being sold
        uint256 amount;           // Amount of tokens listed
        ListingType listingType;  // Type of listing (ETH sale or item swap)
        uint256 priceInWei;       // Price in ETH (only for ETH_SALE)
        address swapTokenContract; // Token contract for swap (only for ITEM_SWAP)
        uint256 swapTokenId;      // Token ID required for swap (only for ITEM_SWAP)
        uint256 swapAmount;       // Amount of tokens required for swap (only for ITEM_SWAP)
        bool active;              // Whether the listing is active
    }

    /// @notice Counter for listing IDs
    uint256 public listingIdCounter;

    /// @notice Mapping from listing ID to Listing
    mapping(uint256 => Listing) public listings;

    /// @notice Platform fee percentage (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeeBps = 250; // 2.5% default fee

    /// @notice Maximum platform fee (10%)
    uint256 public constant MAX_PLATFORM_FEE = 1000;

    /// @notice Accumulated platform fees
    uint256 public accumulatedFees;

    /// @notice Event emitted when an item is listed for ETH sale
    event ItemListedForETH(
        uint256 indexed listingId,
        address indexed seller,
        address tokenContract,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    );

    /// @notice Event emitted when an item is listed for swap
    event ItemListedForSwap(
        uint256 indexed listingId,
        address indexed seller,
        address tokenContract,
        uint256 tokenId,
        uint256 amount,
        address swapTokenContract,
        uint256 swapTokenId,
        uint256 swapAmount
    );

    /// @notice Event emitted when an item is purchased with ETH
    event ItemPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 price
    );

    /// @notice Event emitted when items are swapped
    event ItemSwapped(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    /// @notice Event emitted when a listing is cancelled
    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    /// @notice Event emitted when platform fee is updated
    event PlatformFeeUpdated(uint256 newFeeBps);

    /// @notice Event emitted when platform fees are withdrawn
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    /// @notice Lists an item for sale at a specified ETH price
    /// @param tokenContract Address of the ERC1155 contract
    /// @param tokenId Token ID to list
    /// @param amount Amount of tokens to list
    /// @param priceInWei Price in wei for the listing
    /// @return listingId The ID of the created listing
    function listItemForETH(
        address tokenContract,
        uint256 tokenId,
        uint256 amount,
        uint256 priceInWei
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(priceInWei > 0, "Price must be greater than 0");

        IERC1155 token = IERC1155(tokenContract);
        require(
            token.balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient token balance"
        );
        require(
            token.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        uint256 listingId = listingIdCounter++;

        listings[listingId] = Listing({
            seller: msg.sender,
            tokenContract: tokenContract,
            tokenId: tokenId,
            amount: amount,
            listingType: ListingType.ETH_SALE,
            priceInWei: priceInWei,
            swapTokenContract: address(0),
            swapTokenId: 0,
            swapAmount: 0,
            active: true
        });

        // Transfer tokens to marketplace for escrow
        token.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        emit ItemListedForETH(listingId, msg.sender, tokenContract, tokenId, amount, priceInWei);

        return listingId;
    }

    /// @notice Lists an item for swap with another item
    /// @param tokenContract Address of the ERC1155 contract for the item to list
    /// @param tokenId Token ID to list
    /// @param amount Amount of tokens to list
    /// @param swapTokenContract Address of the ERC1155 contract for the desired swap item
    /// @param swapTokenId Token ID required for the swap
    /// @param swapAmount Amount of tokens required for the swap
    /// @return listingId The ID of the created listing
    function listItemForSwap(
        address tokenContract,
        uint256 tokenId,
        uint256 amount,
        address swapTokenContract,
        uint256 swapTokenId,
        uint256 swapAmount
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(swapAmount > 0, "Swap amount must be greater than 0");
        require(swapTokenContract != address(0), "Invalid swap token contract");

        IERC1155 token = IERC1155(tokenContract);
        require(
            token.balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient token balance"
        );
        require(
            token.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        uint256 listingId = listingIdCounter++;

        listings[listingId] = Listing({
            seller: msg.sender,
            tokenContract: tokenContract,
            tokenId: tokenId,
            amount: amount,
            listingType: ListingType.ITEM_SWAP,
            priceInWei: 0,
            swapTokenContract: swapTokenContract,
            swapTokenId: swapTokenId,
            swapAmount: swapAmount,
            active: true
        });

        // Transfer tokens to marketplace for escrow
        token.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        emit ItemListedForSwap(
            listingId,
            msg.sender,
            tokenContract,
            tokenId,
            amount,
            swapTokenContract,
            swapTokenId,
            swapAmount
        );

        return listingId;
    }

    /// @notice Purchases an item listed for ETH
    /// @param listingId The ID of the listing to purchase
    function buyItemWithETH(uint256 listingId) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing is not active");
        require(listing.listingType == ListingType.ETH_SALE, "Listing is not for ETH sale");
        require(msg.value >= listing.priceInWei, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own listing");

        // Calculate platform fee
        uint256 fee = (listing.priceInWei * platformFeeBps) / 10000;
        uint256 sellerProceeds = listing.priceInWei - fee;

        // Mark listing as inactive
        listing.active = false;

        // Accumulate platform fee
        accumulatedFees += fee;

        // Transfer tokens to buyer
        IERC1155(listing.tokenContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            listing.amount,
            ""
        );

        // Transfer payment to seller
        (bool success, ) = listing.seller.call{value: sellerProceeds}("");
        require(success, "Transfer to seller failed");

        // Refund excess payment
        if (msg.value > listing.priceInWei) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - listing.priceInWei}("");
            require(refundSuccess, "Refund failed");
        }

        emit ItemPurchased(listingId, msg.sender, listing.seller, listing.amount, listing.priceInWei);
    }

    /// @notice Swaps items with a listing
    /// @param listingId The ID of the listing to swap with
    function swapItem(uint256 listingId) external whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing is not active");
        require(listing.listingType == ListingType.ITEM_SWAP, "Listing is not for item swap");
        require(msg.sender != listing.seller, "Cannot swap with your own listing");

        IERC1155 swapToken = IERC1155(listing.swapTokenContract);
        require(
            swapToken.balanceOf(msg.sender, listing.swapTokenId) >= listing.swapAmount,
            "Insufficient swap token balance"
        );
        require(
            swapToken.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved for swap tokens"
        );

        // Mark listing as inactive
        listing.active = false;

        // Transfer listed item to buyer
        IERC1155(listing.tokenContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            listing.amount,
            ""
        );

        // Transfer swap item from buyer to seller
        swapToken.safeTransferFrom(
            msg.sender,
            listing.seller,
            listing.swapTokenId,
            listing.swapAmount,
            ""
        );

        emit ItemSwapped(listingId, msg.sender, listing.seller, listing.amount);
    }

    /// @notice Cancels a listing and returns the tokens to the seller
    /// @param listingId The ID of the listing to cancel
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing is not active");
        require(msg.sender == listing.seller, "Only seller can cancel");

        // Mark listing as inactive
        listing.active = false;

        // Return tokens to seller
        IERC1155(listing.tokenContract).safeTransferFrom(
            address(this),
            listing.seller,
            listing.tokenId,
            listing.amount,
            ""
        );

        emit ListingCancelled(listingId, listing.seller);
    }

    /// @notice Updates the platform fee
    /// @param newFeeBps New fee in basis points
    /// @dev Only callable by owner
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_PLATFORM_FEE, "Fee too high");
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }

    /// @notice Withdraws accumulated platform fees
    /// @param recipient Address to receive the fees
    /// @dev Only callable by owner
    function withdrawFees(address payable recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees = 0;
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit FeesWithdrawn(recipient, amount);
    }

    /// @notice Pauses the marketplace
    /// @dev Only callable by owner
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the marketplace
    /// @dev Only callable by owner
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Gets listing details
    /// @param listingId The ID of the listing
    /// @return The listing details
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /// @inheritdoc IERC1155Receiver
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /// @inheritdoc IERC1155Receiver
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    /// @notice Checks if the contract supports a specific interface
    /// @param interfaceId The interface identifier to check
    /// @return bool True if the contract supports the interface
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }
}
