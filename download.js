const fs = require('fs');
const https = require('https');

const urls = [
  'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YWI3N2Y5MjgzZGQwMmE5YjQ0MGNkMmIwNTJmEgsSBxDuyJ2TnA0YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTc5ODQxMjU5MzA5NzY2MzUxOA&filename=&opi=89354086',
  'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YWI3ZWVjOWJjYWMwMWE2MzE4ZGM5MDc5NWY3EgsSBxDuyJ2TnA0YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTc5ODQxMjU5MzA5NzY2MzUxOA&filename=&opi=89354086',
  'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YWI3ZWVhYjkxMDgwNzNhZmIxODY4MjE1OGM1EgsSBxDuyJ2TnA0YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTc5ODQxMjU5MzA5NzY2MzUxOA&filename=&opi=89354086',
  'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YWI3ZWYxZTU4OWUwMWI0ZTFhNWZlMmQyZjVhEgsSBxDuyJ2TnA0YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTc5ODQxMjU5MzA5NzY2MzUxOA&filename=&opi=89354086',
  'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YWI3ZWY2NWE0MDIwN2M0ZTJkYzU2MWY5NzJlEgsSBxDuyJ2TnA0YAZIBJAoKcHJvamVjdF9pZBIWQhQxMTc5ODQxMjU5MzA5NzY2MzUxOA&filename=&opi=89354086'
];

async function fetchUrl(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, dest).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(dest, data, 'utf8');
        console.log(`Saved ${dest} (${data.length} bytes)`);
        resolve(data);
      });
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync('references')) fs.mkdirSync('references');
  for (let i = 0; i < urls.length; i++) {
    await fetchUrl(urls[i], `references/screen${i + 1}.html`);
  }
}

main().catch(console.error);
