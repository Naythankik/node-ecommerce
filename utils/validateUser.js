const Joi = require("joi");

const newUser = (user) => {
  const newUser = Joi.object({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().required(),
    telephone: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });

  return newUser.validate(user);
};

module.exports = {
  newUser,
};
