// Simple test to verify API key access
require('dotenv').config();
const fetch = require('node-fetch');

async function testApi() {
  const apiKey = process.env.CODA_API_KEY;
  console.log(`Using API key: ${apiKey ? apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4) : 'Not found'}`);
  
  try {
    // First, try to list all documents
    console.log("Testing API access - listing documents");
    const response = await fetch('https://coda.io/apis/v1/docs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${data}`);
    
    if (!response.ok) {
      console.error("API access failed");
    } else {
      console.log("API access successful");
    }
  } catch (error) {
    console.error(`Error accessing API: ${error.message}`);
  }
}

testApi();