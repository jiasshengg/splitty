const userModel = require('../models/userModel');
const responseView = require('../views/responseView');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const passwordRules = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};
const resetPasswordWindowMs = 1000 * 60 * 15;

function getUniqueConstraintMessage(error) {
  const targets = Array.isArray(error?.meta?.target)
    ? error.meta.target
    : [error?.meta?.target].filter(Boolean);

  if (targets.includes('username')) {
    return 'Username already exists';
  }

  if (targets.includes('email')) {
    return 'Email already exists';
  }

  return 'A user with those details already exists';
}

function hasBlankString(value) {
  return !value || (typeof value === 'string' && value.trim() === '');
}

function validateRequiredFields(res, data, requiredFields) {
  for (const field of requiredFields) {
    const value = data[field];

    if (hasBlankString(value)) {
      const formattedFieldName =
        field.charAt(0).toUpperCase() + field.slice(1);
      responseView.BadRequest(res, `${formattedFieldName} cannot be empty`);
      return false;
    }
  }

  return true;
}

function isStrongPassword(password) {
  return validator.isStrongPassword(password, passwordRules);
}

function isCurrentSessionUser(req, id) {
  return req.session?.user?.id === Number(id);
}

function getPasswordResetUrl(token) {
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendBaseUrl}/reset-password?token=${token}`;
}

module.exports.getAllUsers = async (req, res) => {
  try {
      const users = await userModel.getAllUsers();
      return responseView.sendSuccess(res, users, 'Fetched all users');
  } catch (error) {
      return responseView.sendError(res, 'Failed to fetch users', error);
  }
};

module.exports.getUserById = async (req, res) => {
  try {
      const { id } = req.params;
      const user = await userModel.getUserById(Number(id));

      if (!user) return responseView.NotFound(res, 'User not found');
      return responseView.sendSuccess(res, user, 'Fetched user');
  } catch (error) {
      return responseView.sendError(res, 'Failed to fetch user', error);
  }
};

module.exports.createUser = async (req, res) => {
  try {
    const userData = req.body;

    const requiredFields = [
      "email",
      "username",
      "password",
    ];

    if (!validateRequiredFields(res, userData, requiredFields)) {
      return;
    }

    userData.email = userData.email.trim();
    userData.username = userData.username.trim();

    if (!validator.isEmail(userData.email)) {
      return responseView.BadRequest(res, "Please enter a valid email");
    }

    if (!isStrongPassword(userData.password)) {
      return responseView.BadRequest(res, "Password requirements not met.");
    }

    // bcryptMiddleware.hashPassword already ran
    userData.password = res.locals.hash;

    userData.role = 1;

    const createdUser = await userModel.createUser(userData);
    return responseView.confirmCreated(res, createdUser, "User created successfully");
  } catch (error) {
    if (error.code === 'P2002') {
      return responseView.Conflict(res, getUniqueConstraintMessage(error));
    }

    console.error("Create user error:", error);
    return responseView.sendError(res, "Failed to create user", error);
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    if (!isCurrentSessionUser(req, id)) {
      return responseView.Forbidden(res, 'You can only update your own account');
    }

    const requiredFields = [
      "email",
      "username",
    ];

    if (!validateRequiredFields(res, userData, requiredFields)) {
      return;
    }

    userData.email = userData.email.trim();
    userData.username = userData.username.trim();

    if (!validator.isEmail(userData.email)) {
      return responseView.BadRequest(res, "Please enter a valid email");
    }

    const updatedUser = await userModel.updateUser(Number(id), userData);
    return responseView.sendSuccess(res, updatedUser, 'User updated successfully');
  } catch (error) {
      if (error.code === 'P2002') {
          return responseView.Conflict(res, getUniqueConstraintMessage(error));
      }

      if (error.code === 'P2025') { // Prisma record not found
          return responseView.NotFound(res, 'User not found');
      }
      return responseView.sendError(res, 'Failed to update user', error);
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
      const { id } = req.params;
      await userModel.deleteUser(Number(id));
      return responseView.noContent(res, null, 'User deleted successfully');
  } catch (error) {
      if (error.code === 'P2025') {
          return responseView.NotFound(res, 'User not found');
      }
      return responseView.sendError(res, 'Failed to delete user', error);
  }
};

module.exports.loginUser = async (req, res, next) => {
  try {

    const userData = req.body;

    const requiredFields = [
      "username",
      "password"
    ];

    if (!validateRequiredFields(res, userData, requiredFields)) {
      return;
    }

    userData.username = userData.username.trim();

    const user = await userModel.loginUser(userData.username);

    res.locals.user = user;
    next(); 

  } catch (error) {
    return responseView.sendError(res, "Failed to login", error); 
  }
}

module.exports.isLoggedIn = (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return responseView.sendSuccess(
        res,
        null,
        'Not authenticated'
      );
    }

    const { id, username, role } = req.session.user;

    return responseView.sendSuccess(
      res,
      {
        id,
        username,
        role,
      },
      'Authenticated'
    );
  } catch (error) {
    console.error('isLoggedIn error:', error);
    return responseView.sendError(res, 'Failed to verify session', error);
  }
};

module.exports.logoutUser = (req, res) => {
  if (!req.session) {
    return responseView.sendSuccess(res, null, "Already logged out");
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return responseView.sendError(res, "Failed to logout", err);
    }

    res.clearCookie("sessionId");

    return responseView.sendSuccess(res, null, "Logged out successfully");
  });
};

module.exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    if (!isCurrentSessionUser(req, id)) {
      return responseView.Forbidden(res, 'You can only update your own password');
    }

    const requiredFields = [
      'currentPassword',
      'newPassword',
    ];

    if (!validateRequiredFields(res, userData, requiredFields)) {
      return;
    }

    if (userData.currentPassword === userData.newPassword) {
      return responseView.BadRequest(res, 'Your new password must be different from your current password');
    }

    if (!isStrongPassword(userData.newPassword)) {
      return responseView.BadRequest(res, 'Password requirements not met.');
    }

    const user = await userModel.getUserPasswordById(Number(id));

    if (!user) {
      return responseView.NotFound(res, 'User not found');
    }

    const isMatch = await bcrypt.compare(userData.currentPassword, user.password);

    if (!isMatch) {
      return responseView.Unauthorized(res, 'Current password is incorrect');
    }

    await userModel.updateUserPassword(Number(id), res.locals.hash);

    return responseView.sendSuccess(res, null, 'Password updated successfully');
  } catch (error) {
    return responseView.sendError(res, 'Failed to update password', error);
  }
};

module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const trimmedEmail = typeof email === 'string' ? email.trim() : email;

    if (hasBlankString(trimmedEmail)) {
      return responseView.BadRequest(res, 'Email cannot be empty');
    }

    if (!validator.isEmail(trimmedEmail)) {
      return responseView.BadRequest(res, 'Please enter a valid email');
    }

    const user = await userModel.getUserByEmail(trimmedEmail);
    const successMessage =
      'If an account exists for that email, a password reset link has been generated.';

    if (!user) {
      return responseView.sendSuccess(res, null, successMessage);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetPasswordExpiresAt = new Date(Date.now() + resetPasswordWindowMs);

    await userModel.storePasswordResetToken(
      user.id,
      hashedResetToken,
      resetPasswordExpiresAt,
    );

    const responseData =
      process.env.NODE_ENV === 'production'
        ? null
        : {
            resetUrl: getPasswordResetUrl(resetToken),
          };

    return responseView.sendSuccess(res, responseData, successMessage);
  } catch (error) {
    return responseView.sendError(res, 'Failed to start password reset', error);
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const requiredFields = [
      'token',
      'password',
    ];

    if (!validateRequiredFields(res, req.body, requiredFields)) {
      return;
    }

    if (!isStrongPassword(password)) {
      return responseView.BadRequest(res, 'Password requirements not met.');
    }

    const hashedResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    const user = await userModel.getUserByPasswordResetToken(hashedResetToken);

    if (!user) {
      return responseView.BadRequest(
        res,
        'This password reset link is invalid or has expired',
      );
    }

    await userModel.updateUserPassword(user.id, res.locals.hash);

    return responseView.sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    return responseView.sendError(res, 'Failed to reset password', error);
  }
};
