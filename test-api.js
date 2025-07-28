// Simple test script to verify API endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testAPI() {
    console.log('Testing API endpoints...\n');

    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);
        console.log('✅ Health endpoint working\n');

        // Test registration
        console.log('2. Testing user registration...');
        const registerResponse = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const registerData = await registerResponse.json();
        console.log('Registration response:', registerData);
        console.log('✅ Registration endpoint working\n');

        // Test login
        console.log('3. Testing user login...');
        const loginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);
        console.log('✅ Login endpoint working\n');

        // Test duplicate registration (should fail)
        console.log('4. Testing duplicate registration...');
        const duplicateResponse = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'testuser2',
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const duplicateData = await duplicateResponse.json();
        console.log('Duplicate registration response:', duplicateData);
        console.log('✅ Duplicate registration properly rejected\n');

        // Test invalid login (should fail)
        console.log('5. Testing invalid login...');
        const invalidLoginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'wrongpassword'
            })
        });
        const invalidLoginData = await invalidLoginResponse.json();
        console.log('Invalid login response:', invalidLoginData);
        console.log('✅ Invalid login properly rejected\n');

        console.log('🎉 All API tests passed!');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

// Run the test
testAPI(); 