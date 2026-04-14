const bcrypt = require("bcrypt");
const responseView = require('../views/responseView');
const { response } = require("express");

const saltRounds = 10;

module.exports.comparePassword = (req, res, next) => {
    const user = res.locals.user; 
    
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
    const callback = (err, hash) => {
      if (err) {
        return responseView.sendError(res, "Error hashing password", err);
      } else {
        res.locals.hash = hash;
        next();
      }
    };
  
    bcrypt.hash(req.body.password, saltRounds, callback);
  };
