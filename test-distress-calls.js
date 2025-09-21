// Test script for distress calls functionality
const API_BASE_URL = 'https://your-api-gateway-url.amazonaws.com/prod';

// Test creating a distress call
async function testCreateDistressCall() {
    const testCall = {
        latitude: 5.9804,
        longitude: 116.0735,
        message: "Test distress call - need help with flooding"
    };

    try {
        const response = await fetch(`${API_BASE_URL}/distress-calls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCall)
        });

        const result = await response.json();
        console.log('Create distress call result:', result);
        return result.callId;
    } catch (error) {
        console.error('Error creating distress call:', error);
    }
}

// Test retrieving distress calls
async function testGetDistressCalls() {
    try {
        const response = await fetch(`${API_BASE_URL}/distress-calls`);
        const result = await response.json();
        console.log('Get distress calls result:', result);
        return result;
    } catch (error) {
        console.error('Error getting distress calls:', error);
    }
}

// Run tests
async function runTests() {
    console.log('Testing distress calls...');
    
    // Test creating a call
    const callId = await testCreateDistressCall();
    
    // Wait a moment then retrieve calls
    setTimeout(async () => {
        await testGetDistressCalls();
    }, 1000);
}

// Update API_BASE_URL above with your actual API Gateway URL, then run:
// node test-distress-calls.js
runTests();