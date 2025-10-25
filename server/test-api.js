#!/usr/bin/env node

/**
 * Simple test script for the Workbench Server API
 * Run this after starting the server to test all endpoints
 */

const BASE_URL = 'http://localhost:3001';

interface Ingredient {
  tokenContract: string;
  tokenId: number;
  amount: number;
  position: number;
}

async function makeRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Request failed:', error);
    return { status: 500, data: { error: 'Network error' } };
  }
}

async function testAPI() {
  console.log('🧪 Testing Workbench Server API\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  const health = await makeRequest(`${BASE_URL}/health`);
  console.log(`   Status: ${health.status}`);
  console.log(`   Response:`, health.data);
  console.log('');

  // Test 2: Get All Ingredients (should be empty initially)
  console.log('2. Testing Get All Ingredients...');
  const getAll = await makeRequest(`${BASE_URL}/api/ingredients`);
  console.log(`   Status: ${getAll.status}`);
  console.log(`   Response:`, getAll.data);
  console.log('');

  // Test 3: Create Ingredient
  console.log('3. Testing Create Ingredient...');
  const newIngredient: Ingredient = {
    tokenContract: '0x1234567890123456789012345678901234567890',
    tokenId: 1,
    amount: 5,
    position: 0
  };

  const create = await makeRequest(`${BASE_URL}/api/ingredients`, {
    method: 'POST',
    body: JSON.stringify(newIngredient)
  });
  console.log(`   Status: ${create.status}`);
  console.log(`   Response:`, create.data);
  
  const ingredientId = create.data?.data?._id;
  console.log('');

  // Test 4: Get Ingredient by ID
  if (ingredientId) {
    console.log('4. Testing Get Ingredient by ID...');
    const getById = await makeRequest(`${BASE_URL}/api/ingredients/${ingredientId}`);
    console.log(`   Status: ${getById.status}`);
    console.log(`   Response:`, getById.data);
    console.log('');

    // Test 5: Update Ingredient
    console.log('5. Testing Update Ingredient...');
    const update = await makeRequest(`${BASE_URL}/api/ingredients/${ingredientId}`, {
      method: 'PUT',
      body: JSON.stringify({ amount: 10 })
    });
    console.log(`   Status: ${update.status}`);
    console.log(`   Response:`, update.data);
    console.log('');

    // Test 6: Get Ingredients by Token Contract
    console.log('6. Testing Get Ingredients by Token Contract...');
    const getByContract = await makeRequest(`${BASE_URL}/api/ingredients/token-contract/${newIngredient.tokenContract}`);
    console.log(`   Status: ${getByContract.status}`);
    console.log(`   Response:`, getByContract.data);
    console.log('');

    // Test 7: Get Ingredients by Position
    console.log('7. Testing Get Ingredients by Position...');
    const getByPosition = await makeRequest(`${BASE_URL}/api/ingredients/position/${newIngredient.position}`);
    console.log(`   Status: ${getByPosition.status}`);
    console.log(`   Response:`, getByPosition.data);
    console.log('');

    // Test 8: Delete Ingredient
    console.log('8. Testing Delete Ingredient...');
    const deleteIngredient = await makeRequest(`${BASE_URL}/api/ingredients/${ingredientId}`, {
      method: 'DELETE'
    });
    console.log(`   Status: ${deleteIngredient.status}`);
    console.log(`   Response:`, deleteIngredient.data);
    console.log('');
  }

  // Test 9: Bulk Create Ingredients
  console.log('9. Testing Bulk Create Ingredients...');
  const bulkIngredients: Ingredient[] = [
    {
      tokenContract: '0x1234567890123456789012345678901234567890',
      tokenId: 1,
      amount: 3,
      position: 0
    },
    {
      tokenContract: '0x1234567890123456789012345678901234567890',
      tokenId: 2,
      amount: 2,
      position: 1
    }
  ];

  const bulkCreate = await makeRequest(`${BASE_URL}/api/ingredients/bulk-create`, {
    method: 'POST',
    body: JSON.stringify({ ingredients: bulkIngredients })
  });
  console.log(`   Status: ${bulkCreate.status}`);
  console.log(`   Response:`, bulkCreate.data);
  console.log('');

  // Test 10: Get All Ingredients (should have 2 now)
  console.log('10. Testing Get All Ingredients (with pagination)...');
  const getAllWithPagination = await makeRequest(`${BASE_URL}/api/ingredients?page=1&limit=5`);
  console.log(`   Status: ${getAllWithPagination.status}`);
  console.log(`   Response:`, getAllWithPagination.data);
  console.log('');

  // Test 11: Cleanup (Delete All)
  console.log('11. Testing Cleanup (Delete All Ingredients)...');
  const cleanup = await makeRequest(`${BASE_URL}/api/ingredients/cleanup`, {
    method: 'DELETE'
  });
  console.log(`   Status: ${cleanup.status}`);
  console.log(`   Response:`, cleanup.data);
  console.log('');

  console.log('✅ All tests completed!');
}

// Run the tests
testAPI().catch(console.error);
