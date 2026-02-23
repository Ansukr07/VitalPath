const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { handleChat } = require('../services/llmService');

/**
 * @route   POST /api/chat
 * @desc    Send a message to the VitalPath AI Assistant
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    console.log(`[Chat Route] Incoming message from user ${req.user.id}: "${message.substring(0, 50)}..."`);
    console.log(`[Chat Route] History length: ${history?.length || 0}`);

    try {
        const response = await handleChat(history, message);
        res.json({
            success: true,
            data: {
                reply: response,
                role: 'model'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
