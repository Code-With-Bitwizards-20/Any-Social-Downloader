import http from 'http';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/youtube/download?url=https://www.youtube.com/watch?v=jNQXAC9IVRw&itag=18', // Use a known safe video
  method: 'GET',
};

console.log('Starting download request...');
const start = Date.now();

const req = http.request(options, (res) => {
  const firstByteTime = Date.now() - start;
  console.log(`Response received in ${firstByteTime}ms`);
  console.log(`Headers:`, res.headers);

  if (firstByteTime > 2000) {
    console.error('FAIL: Response took too long to start.');
  } else {
    console.log('PASS: Response started quickly.');
  }

  res.on('data', (chunk) => {
    // Just consume data
  });

  res.on('end', () => {
    console.log('Download completed.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
