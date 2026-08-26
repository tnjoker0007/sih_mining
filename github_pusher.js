const fs = require('fs');
const path = require('path');

const token = process.argv[2] || process.env.GITHUB_TOKEN;
const owner = 'tnjoker0007';
const repo = 'sih_mining';
const branch = 'MOD_3';

if (!token) {
  console.error('Error: Token required.');
  process.exit(1);
}

const headers = {
  'Authorization': `token ${token}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'MineGuard-Module3-Deployer'
};

async function api(endpoint, options = {}) {
  const url = `https://api.github.com/repos/${owner}/${repo}${endpoint}`;
  const res = await fetch(url, {
    headers: { ...headers, ...(options.headers || {}) },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub API Error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (
        item !== 'node_modules' &&
        item !== '.git' &&
        item !== 'dist' &&
        item !== '.gemini' &&
        item !== 'build'
      ) {
        results = results.concat(getAllFiles(fullPath));
      }
    } else {
      const rel = path.relative(__dirname, fullPath).replace(/\\/g, '/');
      if (
        !rel.startsWith('node_modules/') &&
        !rel.startsWith('client/node_modules/') &&
        !rel.startsWith('client/dist/') &&
        !rel.startsWith('.git/') &&
        rel !== '.env' &&
        rel !== 'MinGit.zip' &&
        !rel.endsWith('.docx') &&
        rel !== 'extracted_doc.txt' &&
        rel !== 'theme_doc.txt'
      ) {
        results.push({ fullPath, rel });
      }
    }
  }
  return results;
}

async function run() {
  console.log(`[GitHub Pusher] Deploying Module 3 to https://github.com/${owner}/${repo} (Branch: ${branch})...`);

  // 1. Get branch reference
  console.log(`[1/5] Fetching remote branch refs/heads/${branch}...`);
  let parentCommitSha = null;
  try {
    const refData = await api(`/git/ref/heads/${branch}`);
    parentCommitSha = refData.object.sha;
    console.log(`Current branch commit: ${parentCommitSha}`);
  } catch (e) {
    console.log(`Branch ${branch} does not exist yet. Creating from main...`);
    const mainRef = await api(`/git/ref/heads/main`);
    parentCommitSha = mainRef.object.sha;
  }

  // 2. Upload Blobs
  const files = getAllFiles(__dirname);
  console.log(`[2/5] Uploading ${files.length} project files as GitHub blobs...`);

  const treeItems = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = fs.readFileSync(file.fullPath);
    const isBinary = file.rel.endsWith('.ico') || file.rel.endsWith('.png') || file.rel.endsWith('.jpg') || file.rel.endsWith('.woff') || file.rel.endsWith('.woff2');

    const blobData = await api('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({
        content: isBinary ? content.toString('base64') : content.toString('utf-8'),
        encoding: isBinary ? 'base64' : 'utf-8'
      })
    });

    treeItems.push({
      path: file.rel,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha
    });

    process.stdout.write(`\rUploaded ${i + 1}/${files.length} files: ${file.rel.slice(0, 40)}`);
  }
  console.log('\nAll blobs created successfully.');

  // 3. Create Tree
  console.log(`[3/5] Creating GitHub Git Tree...`);
  const treeData = await api('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      tree: treeItems
    })
  });
  console.log(`Tree SHA: ${treeData.sha}`);

  // 4. Create Commit
  console.log(`[4/5] Creating Commit...`);
  const commitData = await api('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: 'feat(module-3): complete MineGuard AI Command Center with industrial theme, real-time telemetry, 2D map, central alerts & rescue coordination',
      tree: treeData.sha,
      parents: parentCommitSha ? [parentCommitSha] : []
    })
  });
  console.log(`Commit SHA: ${commitData.sha}`);

  // 5. Update Ref
  console.log(`[5/5] Updating refs/heads/${branch}...`);
  try {
    await api(`/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: commitData.sha,
        force: true
      })
    });
  } catch (e) {
    await api('/git/refs', {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: commitData.sha
      })
    });
  }

  console.log('\n=======================================================');
  console.log('  SUCCESS! Module 3 is successfully deployed and live:');
  console.log(`  https://github.com/${owner}/${repo}/tree/${branch}`);
  console.log('=======================================================\n');
}

run().catch(err => {
  console.error('\nDeployment failed:', err.message);
  process.exit(1);
});
