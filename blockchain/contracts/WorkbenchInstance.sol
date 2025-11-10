// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC1155 } from '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import { ReentrancyGuard } from '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import { AccessControl } from '@openzeppelin/contracts/access/AccessControl.sol';

/// @title WorkbenchInstance
/// @notice A crafting contract instance that works with a single ERC1155 token contract
/// @dev Each instance is created by WorkbenchFactory and tied to one ERC1155 contract
/// @dev The instance deployer sets which ERC1155 contract this workbench operates on
/// @dev Requires MINTER_ROLE on the ERC1155 contract to mint crafted items
contract WorkbenchInstance is Ownable, ReentrancyGuard, AccessControl {
    /// @notice Role identifier for crafters who can create recipes
    bytes32 public constant CRAFTER_ROLE = keccak256("CRAFTER_ROLE");

    /// @notice The ERC1155 token contract this workbench operates on
    /// @dev Set once at deployment by the instance deployer
    address public tokenContract;

    /// @notice Whether the token contract has been set
    bool public tokenContractSet;

    /// @notice Burn address for destroying ingredients
    address private constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /// @notice Structure to define an ingredient in a crafting recipe
    struct Ingredient {
        uint256 tokenId;        // Token ID required
        uint256 amount;         // Amount required
        uint8 position;         // Position in the crafting grid (0-8 for 3x3)
    }

    /// @notice Structure to define a crafting recipe
    struct Recipe {
        uint256 outputTokenId;     // Output token ID
        uint256 outputAmount;      // Amount of output tokens
        bool requiresExactPattern; // Whether the pattern must match exactly
        bool active;               // Whether the recipe is active
        string name;               // Recipe name
    }

    /// @notice Counter for recipe IDs
    uint256 public recipeIdCounter;

    /// @notice Mapping from recipe ID to Recipe
    mapping(uint256 => Recipe) public recipes;

    /// @notice Mapping to store ingredient details for each recipe
    /// @dev recipeId => ingredient index => Ingredient
    mapping(uint256 => mapping(uint256 => Ingredient)) private recipeIngredients;

    /// @notice Mapping to store ingredient counts for each recipe
    mapping(uint256 => uint256) public recipeIngredientCounts;

    /// @notice Event emitted when token contract is set
    event TokenContractSet(address indexed tokenContract, address indexed setter);

    /// @notice Event emitted when a recipe is created
    event RecipeCreated(
        uint256 indexed recipeId,
        string name,
        uint256 outputTokenId,
        uint256 outputAmount
    );

    /// @notice Event emitted when an item is crafted
    event ItemCrafted(
        uint256 indexed recipeId,
        address indexed crafter,
        uint256 outputTokenId,
        uint256 amount
    );

    /// @notice Event emitted when a recipe is toggled
    event RecipeToggled(uint256 indexed recipeId, bool active);

    /// @notice Constructor grants roles to the instance deployer
    /// @param deployer The address that deployed this instance (becomes owner and admin)
    constructor(address deployer) {
        _transferOwnership(deployer);
        _grantRole(DEFAULT_ADMIN_ROLE, deployer);
        _grantRole(CRAFTER_ROLE, deployer);
    }

    /// @notice Sets the ERC1155 token contract for this workbench instance
    /// @param _tokenContract Address of the ERC1155 contract
    /// @dev Can only be set once by the owner
    /// @dev Owner should grant MINTER_ROLE to this contract on the ERC1155 before or after calling this
    function setTokenContract(address _tokenContract) external onlyOwner {
        require(!tokenContractSet, "Token contract already set");
        require(_tokenContract != address(0), "Invalid token contract");
        
        tokenContract = _tokenContract;
        tokenContractSet = true;
        
        emit TokenContractSet(_tokenContract, msg.sender);
    }

    /// @notice Creates a new crafting recipe
    /// @param ingredients Array of ingredients required for crafting
    /// @param outputTokenId Token ID of the output
    /// @param outputAmount Amount of output tokens
    /// @param requiresExactPattern Whether the pattern must match exactly (position-sensitive)
    /// @param name Name of the recipe
    /// @return recipeId The ID of the created recipe
    function createRecipe(
        Ingredient[] memory ingredients,
        uint256 outputTokenId,
        uint256 outputAmount,
        bool requiresExactPattern,
        string memory name
    ) external onlyRole(CRAFTER_ROLE) returns (uint256) {
        require(tokenContractSet, "Token contract not set");
        require(ingredients.length > 0, "Recipe must have at least one ingredient");
        require(ingredients.length <= 9, "Recipe can have at most 9 ingredients");
        require(outputAmount > 0, "Output amount must be greater than 0");

        uint256 recipeId = recipeIdCounter++;

        // Store recipe metadata
        Recipe storage recipe = recipes[recipeId];
        recipe.outputTokenId = outputTokenId;
        recipe.outputAmount = outputAmount;
        recipe.requiresExactPattern = requiresExactPattern;
        recipe.active = true;
        recipe.name = name;

        // Store ingredients
        for (uint256 i = 0; i < ingredients.length; i++) {
            require(ingredients[i].amount > 0, "Ingredient amount must be greater than 0");
            require(ingredients[i].position < 9, "Invalid position");
            
            recipeIngredients[recipeId][i] = ingredients[i];
        }
        recipeIngredientCounts[recipeId] = ingredients.length;

        emit RecipeCreated(recipeId, name, outputTokenId, outputAmount);

        return recipeId;
    }

    /// @notice Crafts an item with exact grid pattern matching
    /// @param recipeId The ID of the recipe to use
    /// @param tokenIds Array of token IDs in 3x3 grid positions (0-8)
    /// @param amounts Array of token amounts in 3x3 grid positions (0-8)
    /// @dev Used when position matters (requiresExactPattern = true)
    function craftWithGrid(
        uint256 recipeId,
        uint256[9] memory tokenIds,
        uint256[9] memory amounts
    ) external nonReentrant {
        require(tokenContractSet, "Token contract not set");
        Recipe storage recipe = recipes[recipeId];
        require(recipe.active, "Recipe is not active");
        require(recipeId < recipeIdCounter, "Recipe does not exist");
        require(recipe.requiresExactPattern, "Recipe does not require exact pattern");

        uint256 ingredientCount = recipeIngredientCounts[recipeId];
        IERC1155 token = IERC1155(tokenContract);

        // Verify and burn ingredients based on the grid
        for (uint256 i = 0; i < ingredientCount; i++) {
            Ingredient memory ingredient = recipeIngredients[recipeId][i];
            uint8 pos = ingredient.position;
            
            // Verify the ingredient is in the correct position in the grid
            require(
                tokenIds[pos] == ingredient.tokenId,
                "Token ID mismatch at position"
            );
            require(
                amounts[pos] >= ingredient.amount,
                "Insufficient amount at position"
            );

            // Check balance and approval
            require(
                token.balanceOf(msg.sender, ingredient.tokenId) >= ingredient.amount,
                "Insufficient ingredient balance"
            );
            require(
                token.isApprovedForAll(msg.sender, address(this)),
                "Workbench not approved for ingredients"
            );

            // Burn ingredient by transferring to dead address
            token.safeTransferFrom(
                msg.sender,
                BURN_ADDRESS,
                ingredient.tokenId,
                ingredient.amount,
                ""
            );
        }

        // Mint output tokens
        _mintOutput(recipe.outputTokenId, recipe.outputAmount, msg.sender);

        emit ItemCrafted(
            recipeId,
            msg.sender,
            recipe.outputTokenId,
            recipe.outputAmount
        );
    }

    /// @notice Crafts an item without grid pattern matching (position-independent)
    /// @param recipeId The ID of the recipe to use
    /// @dev Used when only ingredient types and amounts matter (requiresExactPattern = false)
    function craftWithoutGrid(uint256 recipeId) external nonReentrant {
        require(tokenContractSet, "Token contract not set");
        Recipe storage recipe = recipes[recipeId];
        require(recipe.active, "Recipe is not active");
        require(recipeId < recipeIdCounter, "Recipe does not exist");
        require(!recipe.requiresExactPattern, "Recipe requires exact pattern - use craftWithGrid");

        uint256 ingredientCount = recipeIngredientCounts[recipeId];
        IERC1155 token = IERC1155(tokenContract);

        // Verify and burn ingredients (position doesn't matter)
        for (uint256 i = 0; i < ingredientCount; i++) {
            Ingredient memory ingredient = recipeIngredients[recipeId][i];

            // Check balance and approval
            require(
                token.balanceOf(msg.sender, ingredient.tokenId) >= ingredient.amount,
                "Insufficient ingredient balance"
            );
            require(
                token.isApprovedForAll(msg.sender, address(this)),
                "Workbench not approved for ingredients"
            );

            // Burn ingredient by transferring to dead address
            token.safeTransferFrom(
                msg.sender,
                BURN_ADDRESS,
                ingredient.tokenId,
                ingredient.amount,
                ""
            );
        }

        // Mint output tokens
        _mintOutput(recipe.outputTokenId, recipe.outputAmount, msg.sender);

        emit ItemCrafted(
            recipeId,
            msg.sender,
            recipe.outputTokenId,
            recipe.outputAmount
        );
    }

    /// @notice Toggles a recipe's active status
    /// @param recipeId The ID of the recipe to toggle
    /// @dev Only callable by accounts with CRAFTER_ROLE
    function toggleRecipe(uint256 recipeId) external onlyRole(CRAFTER_ROLE) {
        require(recipeId < recipeIdCounter, "Recipe does not exist");
        recipes[recipeId].active = !recipes[recipeId].active;
        emit RecipeToggled(recipeId, recipes[recipeId].active);
    }

    /// @notice Gets recipe details
    /// @param recipeId The ID of the recipe
    /// @return outputTokenId Token ID of the output
    /// @return outputAmount Amount of output tokens
    /// @return requiresExactPattern Whether exact pattern matching is required
    /// @return active Whether the recipe is active
    /// @return name Name of the recipe
    /// @return ingredientCount Number of ingredients
    function getRecipe(uint256 recipeId) 
        external 
        view 
        returns (
            uint256 outputTokenId,
            uint256 outputAmount,
            bool requiresExactPattern,
            bool active,
            string memory name,
            uint256 ingredientCount
        ) 
    {
        Recipe storage recipe = recipes[recipeId];
        return (
            recipe.outputTokenId,
            recipe.outputAmount,
            recipe.requiresExactPattern,
            recipe.active,
            recipe.name,
            recipeIngredientCounts[recipeId]
        );
    }

    /// @notice Gets ingredient details for a recipe
    /// @param recipeId The ID of the recipe
    /// @param ingredientIndex The index of the ingredient
    /// @return The ingredient details
    function getRecipeIngredient(uint256 recipeId, uint256 ingredientIndex)
        external
        view
        returns (Ingredient memory)
    {
        require(ingredientIndex < recipeIngredientCounts[recipeId], "Invalid ingredient index");
        return recipeIngredients[recipeId][ingredientIndex];
    }

    /// @notice Gets all ingredients for a recipe
    /// @param recipeId The ID of the recipe
    /// @return ingredients Array of all ingredients
    function getRecipeIngredients(uint256 recipeId)
        external
        view
        returns (Ingredient[] memory ingredients)
    {
        uint256 count = recipeIngredientCounts[recipeId];
        ingredients = new Ingredient[](count);
        
        for (uint256 i = 0; i < count; i++) {
            ingredients[i] = recipeIngredients[recipeId][i];
        }
        
        return ingredients;
    }

    /// @notice Checks if user has all required ingredients for a recipe
    /// @param recipeId The ID of the recipe
    /// @param user The address of the user to check
    /// @return hasIngredients Whether the user has all required ingredients
    function canCraft(uint256 recipeId, address user) external view returns (bool hasIngredients) {
        if (!tokenContractSet) {
            return false;
        }
        
        require(recipeId < recipeIdCounter, "Recipe does not exist");
        
        if (!recipes[recipeId].active) {
            return false;
        }

        uint256 ingredientCount = recipeIngredientCounts[recipeId];
        IERC1155 token = IERC1155(tokenContract);
        
        for (uint256 i = 0; i < ingredientCount; i++) {
            Ingredient memory ingredient = recipeIngredients[recipeId][i];
            
            // Check balance and approval
            if (token.balanceOf(user, ingredient.tokenId) < ingredient.amount) {
                return false;
            }
            if (!token.isApprovedForAll(user, address(this))) {
                return false;
            }
        }
        
        return true;
    }

    /// @notice Validates if a grid matches a specific recipe pattern
    /// @param recipeId The ID of the recipe to validate against
    /// @param tokenIds Array of token IDs in grid positions
    /// @param amounts Array of token amounts in grid positions
    /// @return isValid Whether the grid matches the recipe pattern
    /// @dev Useful for frontend/backend to validate before submitting transaction
    function validateGrid(
        uint256 recipeId,
        uint256[9] memory tokenIds,
        uint256[9] memory amounts
    ) external view returns (bool isValid) {
        if (!tokenContractSet) {
            return false;
        }
        
        require(recipeId < recipeIdCounter, "Recipe does not exist");
        
        Recipe storage recipe = recipes[recipeId];
        if (!recipe.active || !recipe.requiresExactPattern) {
            return false;
        }

        uint256 ingredientCount = recipeIngredientCounts[recipeId];
        
        // Check all ingredients are in correct positions
        for (uint256 i = 0; i < ingredientCount; i++) {
            Ingredient memory ingredient = recipeIngredients[recipeId][i];
            uint8 pos = ingredient.position;
            
            if (tokenIds[pos] != ingredient.tokenId ||
                amounts[pos] < ingredient.amount) {
                return false;
            }
        }
        
        return true;
    }

    /// @notice Gets the total number of recipes
    /// @return count The total number of recipes created
    function getRecipeCount() external view returns (uint256 count) {
        return recipeIdCounter;
    }

    /// @notice Gets all active recipe IDs
    /// @return activeRecipeIds Array of active recipe IDs
    /// @dev Useful for frontend to fetch all available recipes
    function getActiveRecipeIds() external view returns (uint256[] memory activeRecipeIds) {
        // Count active recipes
        uint256 activeCount = 0;
        for (uint256 i = 0; i < recipeIdCounter; i++) {
            if (recipes[i].active) {
                activeCount++;
            }
        }
        
        // Fill array with active recipe IDs
        activeRecipeIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < recipeIdCounter; i++) {
            if (recipes[i].active) {
                activeRecipeIds[index] = i;
                index++;
            }
        }
        
        return activeRecipeIds;
    }

    /// @notice Internal function to mint output tokens
    /// @param tokenId Token ID to mint
    /// @param amount Amount to mint
    /// @param to Recipient address
    /// @dev Calls the mint function on the token contract
    /// @dev Requires this contract to have MINTER_ROLE on the ERC1155 contract
    function _mintOutput(
        uint256 tokenId,
        uint256 amount,
        address to
    ) private {
        require(tokenContractSet, "Token contract not set");
        
        // Call the mint function on the ERC1155 contract
        // This assumes the token contract has a mint function and this contract has MINTER_ROLE
        bytes memory data = abi.encodeWithSignature(
            "mint(address,uint256,uint256,bytes)",
            to,
            tokenId,
            amount,
            ""
        );
        
        (bool success, ) = tokenContract.call(data);
        require(success, "Mint call failed - ensure Workbench has MINTER_ROLE on the token contract");
    }

    /// @inheritdoc AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

