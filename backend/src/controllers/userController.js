const userModel = require('../models/userModel');
const sessionMiddleware = require('../middleware/sessionMiddleware');
const responseView = require('../views/responseView');
const validator = require('validator');
const bcrypt = require('bcrypt');

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

    for (const field of requiredFields) {
      const value = userData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        const formattedFieldName =
          field.charAt(0).toUpperCase() + field.slice(1);
        return responseView.BadRequest(res, `${formattedFieldName} cannot be empty`);
      }
    }

    if (!validator.isEmail(userData.email)) {
      return responseView.BadRequest(res, "Please enter a valid email");
    }

    if (!validator.isStrongPassword(userData.password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
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

    const requiredFields = [
      "email",
      "username",
    ];

    for (const field of requiredFields) {
      const value = userData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        const formattedFieldName =
          field.charAt(0).toUpperCase() + field.slice(1);
        return responseView.BadRequest(res, `${formattedFieldName} cannot be empty`);
      }
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

    for (const field of requiredFields) {
      const value = userData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        const formattedFieldName =
          field.charAt(0).toUpperCase() + field.slice(1);
        return responseView.BadRequest(res, `${formattedFieldName} cannot be empty`);
      }
    }

    const user = await userModel.loginUser(req.body.username);

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
