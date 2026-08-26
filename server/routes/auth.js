const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  const users = db.get('users');

  let user = null;
  if (username) {
    user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  // Quick switch or fallback to demo role user
  if (!user && role) {
    user = users.find(u => u.role === role || u.role_id === role);
  }

  if (!user) {
    // If unknown username but credentials passed, check if admin demo default
    if (username === 'admin') user = users.find(u => u.username === 'admin');
    else if (username === 'operator') user = users.find(u => u.username === 'operator');
    else if (username === 'rescue') user = users.find(u => u.username === 'rescue_lead');
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials. Available accounts: admin/admin123, operator/operator123, rescue_lead/rescue123' });
  }

  // For testing convenience, we verify password or match demo presets
  if (password && user.password_hash !== password && password !== 'admin123' && password !== 'operator123' && password !== 'rescue123') {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  db.addAudit(user.full_name, 'USER_LOGIN', `Logged in with role ${user.role}`);

  res.json({
    success: true,
    token: 'jwt_mock_token_' + user.id + '_' + Date.now(),
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      role_id: user.role_id,
      email: user.email,
      badge_id: user.badge_id
    }
  });
});

// GET /api/users
router.get('/users', (req, res) => {
  const users = db.get('users').map(({ password_hash, ...rest }) => rest);
  res.json({ success: true, data: users });
});

// POST /api/users
router.post('/users', (req, res) => {
  const { username, full_name, role, email, phone, badge_id, password } = req.body;
  if (!username || !full_name || !role) {
    return res.status(400).json({ success: false, message: 'Username, Full Name, and Role are required' });
  }

  const existing = db.get('users').find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  const roleMap = {
    'Administrator': 'ROLE_ADMIN',
    'Control Room Operator': 'ROLE_OPERATOR',
    'Rescue Team': 'ROLE_RESCUE'
  };

  const newUser = {
    id: 'USR_' + (db.get('users').length + 1).toString().padStart(3, '0'),
    username,
    password_hash: password || 'password123',
    full_name,
    role,
    role_id: roleMap[role] || 'ROLE_OPERATOR',
    email: email || `${username}@mineguard.ai`,
    phone: phone || '+1-555-0100',
    badge_id: badge_id || 'BADGE-' + Math.floor(1000 + Math.random() * 9000),
    active: true,
    created_at: new Date().toISOString()
  };

  db.insert('users', newUser);
  db.addAudit('Admin', 'USER_CREATED', `Created user account ${newUser.username} (${newUser.role})`);

  const { password_hash, ...sanitized } = newUser;
  res.status(201).json({ success: true, data: sanitized });
});

// PUT /api/users/:id
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  delete updates.password_hash; // Don't overwrite unless explicitly requested

  const updated = db.update('users', id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  db.addAudit('Admin', 'USER_UPDATED', `Updated user ${id}`);
  const { password_hash, ...sanitized } = updated;
  res.json({ success: true, data: sanitized });
});

// DELETE /api/users/:id
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const removed = db.delete('users', id);
  if (!removed) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  db.addAudit('Admin', 'USER_DELETED', `Deleted user ${id}`);
  res.json({ success: true, message: 'User deleted successfully' });
});

// GET /api/roles
router.get('/roles', (req, res) => {
  res.json({ success: true, data: db.get('roles') });
});

module.exports = router;
