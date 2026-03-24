const express = require('express');
const router = express.Router();
const passport = require('../auth');

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL);
  }
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', {
  scope: ['user:email'],
}));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=github_failed` }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL);
  }
);

// Get current user
router.get('/me', (req, res) => {
  if (req.user) {
    res.json({
      id: req.user.id,
      displayName: req.user.display_name,
      email: req.user.email,
      avatarUrl: req.user.avatar_url,
      provider: req.user.provider,
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
});

module.exports = router;
