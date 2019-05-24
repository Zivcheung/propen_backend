const router = require('express').Router();
const passport = require('passport');
const controller = require('../../controller/clientSite/user');

router.post('/login', passport.authenticate('local'), controller.userLogin);
router.post('/signup', controller.userSignup);
router.get('/logout', controller.userLogout);
router.get('/userInfo', controller.getUserInfo);

module.exports = router;
