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
  const loginBody = 'hodid=9766979364&password=pass@123';
  const loginRes = await postRequest('/hod/login', {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(loginBody)
  }, loginBody);
  
  let cookies = loginRes.headers['set-cookie'];
  if (!cookies) return console.error('Login failed:', loginRes.data);
  let sessionCookie = cookies[0].split(';')[0];
  console.log('Login Status:', loginRes.status);
  
  if (loginRes.headers.location && loginRes.headers.location.includes('change-password')) {
     const pwdBody = 'newPassword=Sagar@123&confirmPassword=Sagar@123';
     const pwdRes = await postRequest('/hod/change-password', {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Length': Buffer.byteLength(pwdBody),
         'Cookie': sessionCookie
     }, pwdBody);
     if (pwdRes.headers['set-cookie']) sessionCookie = pwdRes.headers['set-cookie'][0].split(';')[0];
  }

  const actRes = await postRequest('/hod/cycles/1/activate', { 'Cookie': sessionCookie }, '');
  console.log('Activate response:', actRes.data);
}
test();
