const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Handle OAuth success callback
// @route   Called after successful OAuth authentication
// @access  Public
exports.oauthSuccess = (req, res) => {
  try {
    // User is available from Passport (req.user)
    const user = req.user;

    // Generate JWT token
    const token = generateToken(user._id);

    // In production, you'd redirect to your frontend with the token
    // For now, we'll return JSON

    // Option 1: Redirect to frontend with token in URL (for web apps)
    // const frontendURL = process.env.CLIENT_URL || 'http://localhost:3000';
    // res.redirect(`${frontendURL}/auth/success?token=${token}`);

    // Option 2: Return JSON (for API testing)
    res.status(200).json({
      success: true,
      message: 'OAuth authentication successful',
      data: {
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          familyname: user.familyname,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          authProvider: user.authProvider
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'OAuth authentication error',
      error: error.message
    });
  }
};

// @desc    Handle OAuth failure callback
// @route   Called after failed OAuth authentication
// @access  Public
exports.oauthFailure = (req, res) => {
  res.status(401).json({
    success: false,
    message: 'OAuth authentication failed'
  });
};
