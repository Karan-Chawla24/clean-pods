// Test script to debug the create-order API
const testCreateOrder = async () => {
  const testPayload = {
    amount: 59.98, // 29.99 * 2
    currency: 'INR',
    receipt: 'test-receipt-123',
    cart: [
      {
        id: 'essential',
        name: 'Essential Clean Pod',
        price: 29.99,
        quantity: 2
      }
    ]
  };

  console.log('Testing /api/create-order with payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test
testCreateOrder();