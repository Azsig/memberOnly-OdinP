const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { ensureAdmin } = require('../middleware/adminMiddleware');
const router = express.Router();

// Halaman registrasi
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// Proses registrasi
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)`,
      [firstName, lastName, email, hashedPassword]
    );
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Halaman login
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// Proses login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];
    console.log('User:', user);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send('Invalid email or password');
    }

    // Simpan user ke sesi
    req.session.user = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      is_member: user.is_member,
      is_admin: user.is_admin,
    };


    // Simpan sesi pengguna (implementasi sesi belum ditambahkan)
    res.redirect('/');
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Rute logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/auth/login'); // Arahkan ke halaman login setelah logout
  });
});

// Halaman "Join the Club"
router.get('/join', ensureAuthenticated, (req, res) => {
  res.render('auth/join');
});

// Proses "Join the Club"
router.post('/join', ensureAuthenticated, async (req, res) => {
  const { passcode } = req.body;
  const secretPasscode = process.env.SECRET_PASSCODE || 'club123';

  if (passcode !== secretPasscode) {
    return res.status(400).send('Invalid passcode');
  }

  try {
    await pool.query(
      `UPDATE users SET is_member = true WHERE id = $1`,
      [req.session.user.id]
    );
    req.session.user.is_member = true;
    res.redirect('/');
  } catch (err) {
    console.error('Error updating membership status:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Halaman untuk memberikan izin admin
router.get('/make-admin', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, first_name, last_name FROM users WHERE is_admin = false`);
    res.render('auth/makeAdmin', { users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Proses pemberian izin admin
router.post('/make-admin/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    await pool.query(`UPDATE users SET is_admin = true WHERE id = $1`, [userId]);
    res.redirect('/auth/make-admin');
  } catch (err) {
    console.error('Error updating admin status:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;