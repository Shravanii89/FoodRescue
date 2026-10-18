import http from 'http';

const BASE_URL = 'http://127.0.0.1:5000/api';

const makeRequest = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const login = async (email, password) => {
  const res = await makeRequest('/auth/login', 'POST', { email, password });
  return res.data?.token;
};

const runRBACTests = async () => {
  console.log('🔒 Running FoodRescue Strict Role-Based Access Control (RBAC) Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate All Three Roles
    console.log('Step 1: Authenticating tokens for Admin, Donor, and Recipient...');
    const adminToken = await login('admin@foodrescue.org', 'AdminPassword123!');
    const donorToken = await login('donor@foodrescue.org', 'DonorPassword123!');
    const recipientToken = await login('ngo@foodrescue.org', 'NgoPassword123!');

    assert(Boolean(adminToken), 'Admin login successful and JWT issued');
    assert(Boolean(donorToken), 'Donor login successful and JWT issued');
    assert(Boolean(recipientToken), 'Recipient login successful and JWT issued');

    // 2. Test Unauthenticated Access
    console.log('\nStep 2: Testing unauthenticated requests against protected endpoints...');
    const noAuthUsers = await makeRequest('/admin/users', 'GET');
    assert(noAuthUsers.status === 401, 'Unauthenticated request to /api/admin/users rejected with 401 Unauthorized');

    const noAuthCreateListing = await makeRequest('/listings', 'POST', { title: 'Test' });
    assert(noAuthCreateListing.status === 401, 'Unauthenticated request to /api/listings rejected with 401 Unauthorized');

    // 3. Test Donor Role Boundaries
    console.log('\nStep 3: Testing Donor role boundaries (Must be forbidden from Admin & Recipient actions)...');
    const donorAccessUsers = await makeRequest('/admin/users', 'GET', null, donorToken);
    assert(donorAccessUsers.status === 403, 'Donor cannot access /api/admin/users (HTTP 403 Forbidden)');

    const donorAccessAuditLogs = await makeRequest('/admin/audit-logs', 'GET', null, donorToken);
    assert(donorAccessAuditLogs.status === 403, 'Donor cannot access /api/admin/audit-logs (HTTP 403 Forbidden)');

    const donorAccessPendingNgos = await makeRequest('/admin/pending-ngos', 'GET', null, donorToken);
    assert(donorAccessPendingNgos.status === 403, 'Donor cannot access /api/admin/pending-ngos (HTTP 403 Forbidden)');

    const donorAccessGlobalRequests = await makeRequest('/requests', 'GET', null, donorToken);
    assert(donorAccessGlobalRequests.status === 403, 'Donor cannot access /api/requests global admin audit (HTTP 403 Forbidden)');

    const donorAttemptFoodClaim = await makeRequest('/requests', 'POST', {
      listingId: '6ad5140652500cdd97a561f0',
      requestedQuantity: 5
    }, donorToken);
    assert(donorAttemptFoodClaim.status === 403, 'Donor cannot claim food batches (HTTP 403 Forbidden - only Recipients allowed)');

    // 4. Test Recipient Role Boundaries
    console.log('\nStep 4: Testing Recipient role boundaries (Must be forbidden from Admin & Donor actions)...');
    const recipientAccessUsers = await makeRequest('/admin/users', 'GET', null, recipientToken);
    assert(recipientAccessUsers.status === 403, 'Recipient cannot access /api/admin/users (HTTP 403 Forbidden)');

    const recipientCreateListing = await makeRequest('/listings', 'POST', {
      title: 'Fake Recipient Donation',
      category: 'cooked_meals',
      quantity: 10,
      unit: 'meals',
      expiryTime: new Date(Date.now() + 3600000).toISOString()
    }, recipientToken);
    assert(recipientCreateListing.status === 403, 'Recipient cannot publish surplus listings (HTTP 403 Forbidden - only Donors allowed)');

    // 5. Test Admin Privileges
    console.log('\nStep 5: Testing Admin access to administrative governance endpoints...');
    const adminAccessUsers = await makeRequest('/admin/users', 'GET', null, adminToken);
    assert(adminAccessUsers.status === 200, 'Admin can access /api/admin/users (HTTP 200 OK)');
    assert(Array.isArray(adminAccessUsers.data?.data), 'Admin received registered users list');

    const adminAccessPendingNgos = await makeRequest('/admin/pending-ngos', 'GET', null, adminToken);
    assert(adminAccessPendingNgos.status === 200, 'Admin can access /api/admin/pending-ngos (HTTP 200 OK)');

    const adminAccessAuditLogs = await makeRequest('/admin/audit-logs', 'GET', null, adminToken);
    assert(adminAccessAuditLogs.status === 200, 'Admin can access /api/admin/audit-logs (HTTP 200 OK)');

    const adminAccessGlobalPickups = await makeRequest('/pickups', 'GET', null, adminToken);
    assert(adminAccessGlobalPickups.status === 200, 'Admin can access /api/pickups global audit (HTTP 200 OK)');

    console.log('\n======================================================');
    console.log(`🏁 RBAC Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ RBAC Test Error:', err);
    process.exit(1);
  }
};

runRBACTests();
