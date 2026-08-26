require('dotenv').config();
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = __dirname;

async function pushToRemote() {
  const token = (process.argv[2] || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
  const remoteUrl = 'https://github.com/tnjoker0007/sih_mining.git';
  const branch = 'MOD_3';

  if (!token) {
    console.error('ERROR: No GitHub token provided.');
    console.log('Usage: node git_manager.js <YOUR_GITHUB_TOKEN>');
    process.exit(1);
  }

  try {
    console.log(`=======================================================`);
    console.log(`  MINEGUARD AI - MODULE 3: GITHUB PUSH`);
    console.log(`  Target Repo: ${remoteUrl}`);
    console.log(`  Target Branch: ${branch}`);
    console.log(`=======================================================`);

    console.log(`[1/3] Staging all module 3 project files...`);
    const files = await getFiles(dir);
    for (const file of files) {
      const rel = path.relative(dir, file).replace(/\\/g, '/');
      if (
        rel.startsWith('.git/') ||
        rel.startsWith('node_modules/') ||
        rel.startsWith('client/node_modules/') ||
        rel.startsWith('client/dist/') ||
        rel === '.env'
      ) {
        continue;
      }
      await git.add({ fs, dir, filepath: rel });
    }

    console.log(`[2/3] Verifying commit on branch MOD_3...`);
    try {
      const sha = await git.commit({
        fs,
        dir,
        author: {
          name: 'MineGuard AI Team Member 3',
          email: 'admin@mineguard.ai'
        },
        message: 'feat(module-3): complete MineGuard AI Command Center with industrial theme'
      });
      console.log(`Commit created: ${sha}`);
    } catch (e) {
      console.log('Local commit is already up to date.');
    }

    const branches = await git.listBranches({ fs, dir });
    if (!branches.includes('MOD_3')) {
      await git.branch({ fs, dir, ref: 'MOD_3' });
    }

    console.log(`[3/3] Pushing to remote ${remoteUrl} (branch: MOD_3)...`);

    const pushResult = await git.push({
      fs,
      http,
      dir,
      url: remoteUrl,
      ref: 'MOD_3',
      remoteRef: 'refs/heads/MOD_3',
      force: true,
      onAuth: () => ({
        username: token,
        password: ''
      })
    });

    console.log('\n=======================================================');
    console.log('  SUCCESS! Module 3 is successfully pushed to:');
    console.log('  https://github.com/tnjoker0007/sih_mining/tree/MOD_3');
    console.log('=======================================================\n');
  } catch (err) {
    console.error('\n[Push Failed]:', err.message);
    if (err.message && err.message.includes('401')) {
      console.error('Invalid token or insufficient repository permissions.');
    }
    process.exit(1);
  }
}

async function getFiles(currentDir) {
  let results = [];
  const list = fs.readdirSync(currentDir);
  for (const file of list) {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(await getFiles(fullPath));
      }
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

pushToRemote();
