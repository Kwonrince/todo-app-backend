const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { pool } = require('./db');

async function findOrCreateUser(provider, providerId, displayName, email, avatarUrl) {
  const existing = await pool.query(
    'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
    [provider, providerId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  const result = await pool.query(
    'INSERT INTO users (provider, provider_id, display_name, email, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [provider, providerId, displayName, email, avatarUrl]
  );
  return result.rows[0];
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateUser(
      'google',
      profile.id,
      profile.displayName,
      profile.emails?.[0]?.value || '',
      profile.photos?.[0]?.value || ''
    );
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateUser(
      'github',
      profile.id,
      profile.displayName || profile.username,
      profile.emails?.[0]?.value || '',
      profile.photos?.[0]?.value || ''
    );
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

module.exports = passport;
