const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn } = require('../middleware.js');
const messageController = require('../controllers/messages.js');

router.get('/listings/:id/message', isLoggedIn, wrapAsync(messageController.startOrShowConversation));
router.post('/listings/:id/message', isLoggedIn, wrapAsync(messageController.sendMessageFromListing));

router.get('/messages', isLoggedIn, wrapAsync(messageController.myInbox));
router.get('/messages/:id', isLoggedIn, wrapAsync(messageController.showConversation));
router.post('/messages/:id', isLoggedIn, wrapAsync(messageController.replyToConversation));

module.exports = router;