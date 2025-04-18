const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const pool = require('./config/db');


require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Konfigurasi koneksi database


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(
    session({
      secret: process.env.SESSION_SECRET || 'secret_key', // Ganti dengan secret yang aman
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // Gunakan `true` jika menggunakan HTTPS
    })
  );

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
  });

// Buat tabel jika belum ada
// Routes
const authRoutes = require('./controllers/authController');
const messageRoutes = require('./controllers/messageController');

app.use('/auth', authRoutes);
app.use('/messages', messageRoutes);

// Halaman utama
app.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT messages.title, messages.text, messages.timestamp, users.first_name, users.last_name
      FROM messages
      JOIN users ON messages.user_id = users.id
    `);
    res.render('index', { messages: result.rows });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

