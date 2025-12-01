/**
 * Authentication API - Simple Login System
 * Credentials: username: "choco" / password: "senha pro"
 */

// Simple in-memory session storage (for demo - in production use Redis/Database)
const sessions = new Map();

// Valid credentials
const VALID_CREDENTIALS = {
    username: 'choco',
    password: 'senha pro'
};

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    const { method, body } = req;

    // LOGIN
    if (method === 'POST' && body.action === 'login') {
        const { username, password } = body;

        if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
            // Generate session token
            const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            sessions.set(sessionToken, {
                username,
                loginTime: Date.now(),
                isGuest: false
            });

            return res.status(200).json({
                success: true,
                token: sessionToken,
                username,
                message: 'Login successful!'
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    }

    // GUEST LOGIN
    if (method === 'POST' && body.action === 'guest') {
        const guestToken = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        sessions.set(guestToken, {
            username: `Guest_${Math.floor(Math.random() * 9999)}`,
            loginTime: Date.now(),
            isGuest: true
        });

        return res.status(200).json({
            success: true,
            token: guestToken,
            username: sessions.get(guestToken).username,
            isGuest: true,
            message: 'Playing as guest - data will not be saved'
        });
    }

    // VERIFY SESSION
    if (method === 'POST' && body.action === 'verify') {
        const { token } = body;

        if (sessions.has(token)) {
            const session = sessions.get(token);
            return res.status(200).json({
                success: true,
                valid: true,
                username: session.username,
                isGuest: session.isGuest
            });
        } else {
            return res.status(200).json({
                success: true,
                valid: false,
                message: 'Session expired or invalid'
            });
        }
    }

    // LOGOUT
    if (method === 'POST' && body.action === 'logout') {
        const { token } = body;

        if (sessions.has(token)) {
            sessions.delete(token);
            return res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        }
    }

    return res.status(400).json({
        success: false,
        message: 'Invalid request'
    });
}

// Set CORS headers for all responses
export const config = {
    api: {
        bodyParser: true
    }
};
