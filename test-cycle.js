const http = require('http');

function postRequest(path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data: data
      }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function test() {
  const loginBody = 'adminid=7020559953&password=pass@123';
  const loginRes = await postRequest('/admin/login', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(loginBody)
  }, loginBody);
  
  let cookies = loginRes.headers['set-cookie'];
  if (!cookies) {
    console.error('Login failed:', loginRes);
    return;
  }
  let sessionCookie = cookies[0].split(';')[0];
  console.log('Session:', sessionCookie);

  // If redirect to change-password, we must fulfill it!
  const pwdBody = 'newPassword=newpass123&confirmPassword=newpass123';
  const pwdRes = await postRequest('/admin/change-password', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(pwdBody),
    'Cookie': sessionCookie
  }, pwdBody);
  
  if (pwdRes.headers['set-cookie']) {
    sessionCookie = pwdRes.headers['set-cookie'][0].split(';')[0];
  }

  const activateRes = await postRequest('/admin/cycles/1/activate', {
    'Cookie': sessionCookie
  }, '');
  
  console.log('Activate response:', activateRes);
}
test();
