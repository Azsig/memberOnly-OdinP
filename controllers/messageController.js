const express = require('express');
const pool = require('../config/db');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const { ensureAdmin } = require('../middleware/adminMiddleware');
const router = express.Router();

// Halaman buat pesan baru
router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('messages/create', { userId: req.session.user.id });
});

// Proses pembuatan pesan baru
router.post('/new', ensureAuthenticated, async (req, res) => {
  const { title, text } = req.body;
  const userId = req.session.user.id;

  try {
    await pool.query(
      `INSERT INTO messages (title, text, user_id) VALUES ($1, $2, $3)`,
      [title, text, userId]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Proses penghapusan pesan
router.post('/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const messageId = req.params.id;

  try {
    await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId]);
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;