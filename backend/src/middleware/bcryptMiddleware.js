const bcrypt = require("bcrypt");

const saltRounds = 10;

module.exports.comparePassword = (req, res, next) => {
    const user = res.locals.user; 
    
    bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
        if (err) {
            console.error("Error bcrypt:", err);
            return res.status(500).json(err);
        }

        if (isMatch) {
            next();
        } else {
            return res.status(401).json({ message: "Wrong password" });
        }
    });
};

module.exports.hashPassword = (req, res, next) => {
    const callback = (err, hash) => {
      if (err) {
        console.error("Error bcrypt:", err);
        res.status(500).json(err);
      } else {
        res.locals.hash = hash;
        next();
      }
    };
  
    bcrypt.hash(req.body.password, saltRounds, callback);
  };
