const express = require('express');
const https = require('https');
const cron = require('node-cron');
const { generateTodaysMockEvents } = require('../data/calendarMockData');
const router = express.Router();

let ioInstance = null;

/**
 * POST /api/social/verify-twitter
 * Verifies if the specified Twitter/X handle contains the generated verification code in their profile bio or recent tweets.
 */
router.post('/verify-twitter', async (req, res) => {
  const { username, verificationCode } = req.body;

  if (!username || !verificationCode) {
    return res.status(400).json({ error: 'Missing username or verificationCode.' });
  }

  const cleanUsername = username.trim().replace(/^@/, '');
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  // Detect if server is running with placeholder/missing developer credentials
  const isDemoMode = !bearerToken || 
                     bearerToken.trim() === '' || 
                     bearerToken === 'your_bearer_token_here';

  console.log(`[Social Link] Verification request: @${cleanUsername} with code ${verificationCode} (Mode: ${isDemoMode ? 'Demo' : 'Live'})`);

  if (isDemoMode) {
    // Simulate network latency of 1 second for realistic UI feel
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.json({
      success: true,
      message: 'Simulated connection successful. Running in Developer Demo Mode (no live credentials set on server).',
      username: `@${cleanUsername}`,
      demoMode: true
    });
  }

  try {
    // Step 1: Look up user by username using Twitter API v2
    const lookupUrl = `https://api.twitter.com/2/users/by/username/${cleanUsername}?user.fields=description`;
    const lookupResponse = await fetch(lookupUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    if (!lookupResponse.ok) {
      const errorText = await lookupResponse.text();
      console.error(`[Social Link] Twitter API lookup error:`, errorText);
      return res.status(400).json({ 
        error: 'Twitter API returned an error. Check server credentials or try again later.' 
      });
    }

    const lookupData = await lookupResponse.json();
    if (!lookupData || !lookupData.data) {
      return res.status(404).json({ error: `Twitter/X account @${cleanUsername} was not found.` });
    }

    const { id: userId, description, name } = lookupData.data;

    // Step 2: Check if verification code is in their Bio Description
    if (description && description.includes(verificationCode)) {
      console.log(`[Social Link] Successfully verified @${cleanUsername} via profile bio.`);
      return res.json({
        success: true,
        message: 'Account verified successfully via profile bio!',
        username: `@${cleanUsername}`,
        displayName: name
      });
    }

    // Step 3: Check their recent tweets (up to 5) as a fallback method
    const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=5`;
    const tweetsResponse = await fetch(tweetsUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    if (tweetsResponse.ok) {
      const tweetsData = await tweetsResponse.json();
      if (tweetsData && Array.isArray(tweetsData.data)) {
        const matchingTweet = tweetsData.data.find(tweet => tweet.text.includes(verificationCode));
        if (matchingTweet) {
          console.log(`[Social Link] Successfully verified @${cleanUsername} via recent tweet.`);
          return res.json({
            success: true,
            message: 'Account verified successfully via recent tweet!',
            username: `@${cleanUsername}`,
            displayName: name
          });
        }
      }
    }

    // Code was not found in bio or recent tweets
    return res.status(400).json({
      error: `Verification code "${verificationCode}" was not found in @${cleanUsername}'s bio description or recent 5 tweets. Please add it and try again.`
    });

  } catch (error) {
    console.error(`[Social Link] Social verification system crash:`, error);
    return res.status(500).json({ 
      error: 'Backend failed to connect to Twitter/X servers. Please ensure network is online.' 
    });
  }
});

// Attach Socket initialization hook to the router
router.initSocial = function(io) {
  ioInstance = io;
};

module.exports = router;
