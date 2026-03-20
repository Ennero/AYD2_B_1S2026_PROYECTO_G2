import fs from 'fs';

async function testEndpoints() {
  console.log('Testing Back-End Endpoints');
  
  const login = async (email, password) => {
    const res = await fetch('http://localhost:3005/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Login failed for ${email}: ${res.status} ${errorText}`);
    }
    const responseData = await res.json();
    return responseData.data.data ? responseData.data.data.token : responseData.data.token;
  };

  try {
    // 1. Agente Operativo
    console.log('\n--- 1. Testing Agente Operativo ---');
    const opToken = await login('operativo.1@logitrans.gt', 'seed$operativo.1@logitrans.gt');
    console.log('Logged in as Agente Operativo. Token prefix:', opToken ? opToken.substring(0, 15) : undefined);

    const createClientRes = await fetch('http://localhost:3005/api/operations/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${opToken}` },
      body: JSON.stringify({
        legalName: `Cliente Test S.A. ${Date.now()}`,
        nit: `99999999999${Math.floor(Math.random() * 90 + 10)}`,
        taxAddress: 'Ciudad',
        primaryContactName: 'Test Contact',
        primaryContactEmail: 'test@test.com'
      })
    });
    const clientData = await createClientRes.json();
    console.log('Create Client Response:', clientData);

    const getClientsRes = await fetch('http://localhost:3005/api/operations/clients?search=Test', {
      headers: { 'Authorization': `Bearer ${opToken}` }
    });
    const clientsData = await getClientsRes.json();
    console.log('Get Clients Response:', clientsData);


    // 2. Certificador FEL
    console.log('\n--- 2. Testing Certificador FEL ---');
    const adminToken = await login('admin@logitrans.gt', 'seed$admin@logitrans.gt');
    console.log('Logged in as Admin (acting as Certificador)');

    const getSummaryRes = await fetch('http://localhost:3005/api/certifier/dashboard/summary', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const summaryData = await getSummaryRes.json();
    console.log('Get Summary Response:', summaryData.message, summaryData.data);

    const getInvoicesRes = await fetch('http://localhost:3005/api/certifier/invoices', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const invoicesData = await getInvoicesRes.json();
    console.log('Get Invoices Response:', invoicesData.message, 'Found pending:', invoicesData.data?.length);

    console.log('\nAll tests completed successfully!');
  } catch(e) {
    console.error('Test failed:', e);
  }
}

testEndpoints();
