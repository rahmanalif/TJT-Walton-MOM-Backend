const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (parentId) => {
  return jwt.sign(
    { id: parentId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Handle OAuth success callback
// @route   Called after successful OAuth authentication
// @access  Public
exports.oauthSuccess = (req, res) => {
  try {
    // Parent is available from Passport (req.parent)
    const parent = req.parent;

    // Generate JWT token
    const token = generateToken(parent._id);

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
        parent: {
          id: parent._id,
          firstname: parent.firstname,
          lastname: parent.lastname,
          familyname: parent.familyname,
          email: parent.email,
          avatar: parent.avatar,
          role: parent.role,
          authProvider: parent.authProvider
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
