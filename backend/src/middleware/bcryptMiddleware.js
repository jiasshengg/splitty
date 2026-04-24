const bcrypt = require("bcrypt");
const responseView = require('../views/responseView');

const saltRounds = 10;

function hashPasswordField(fieldName) {
    return (req, res, next) => {
        const passwordValue = req.body?.[fieldName];

        if (!passwordValue || (typeof passwordValue === "string" && passwordValue.trim() === "")) {
            return next();
        }

        bcrypt.hash(passwordValue, saltRounds, (err, hash) => {
            if (err) {
                return responseView.sendError(res, "Error hashing password", err);
            }

            res.locals.hash = hash;
            next();
        });
    };
}

module.exports.comparePassword = (req, res, next) => {
    const user = res.locals.user;

    if (!user) {
        return responseView.Unauthorized(res, "Invalid username or password");
    }

    bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
        if (err) {
            return responseView.sendError(res, "Error comparing passwords", err);
        }

        if (isMatch) {
            next();
        } else {
            return responseView.Unauthorized(res, "Incorrect password");
        }
    });
};

module.exports.hashPassword = (req, res, next) => {
    return hashPasswordField("password")(req, res, next);
};

module.exports.hashNewPassword = (req, res, next) => {
    return hashPasswordField("newPassword")(req, res, next);
};
