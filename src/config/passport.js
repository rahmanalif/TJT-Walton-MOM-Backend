const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Parent = require('../models/Parent.model');

// Serialize parent for the session
passport.serializeUser((parent, done) => {
  done(null, parent.id);
});

// Deserialize parent from the session
passport.deserializeUser(async (id, done) => {
  try {
    const parent = await Parent.findById(id);
    done(null, parent);
  } catch (error) {
    done(error, null);
  }
});

// ========================
// GOOGLE OAUTH STRATEGY
// ========================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if parent already exists with this Google ID
        let parent = await Parent.findOne({ googleId: profile.id });

        if (parent) {
          // Parent exists, return parent
          return done(null, parent);
        }

        // Check if parent exists with this email
        parent = await Parent.findOne({ email: profile.emails[0].value });

        if (parent) {
          // Link Google account to existing parent
          parent.googleId = profile.id;
          parent.avatar = profile.photos[0]?.value;
          await parent.save();
          return done(null, parent);
        }

        // Create new parent
        const newParent = await Parent.create({
          googleId: profile.id,
          firstname: profile.name.givenName,
          lastname: profile.name.familyName,
          familyname: profile.name.familyName || 'N/A', // Default if not provided
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value,
          password: Math.random().toString(36).slice(-8), // Random password (won't be used)
          authProvider: 'google'
        });

        done(null, newParent);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

module.exports = passport;
