function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password.length >= 8; // mínimo 8 caracteres
}

module.exports = { validateEmail, validatePassword };
