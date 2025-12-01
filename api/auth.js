/**
 * Authentication API - Admin & User System
 * Admin: choco / senha pro
 */

// In-memory storage
const users = new Map();
const sessions = new Map();

// Initialize ADMIN user with special flags
users.set('choco', {
    password: 'senha pro',
    created: Date.now(),
    isAdmin: true,
    preferences: {
        infiniteMoney: false,
        unlockAll: true
    }
});

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).json({});
    if (req.method !== 'POST') return res.status(405).json({ success: false });

    const { action, username, password, preferences } = req.body;

    // --- REGISTER ---
    if (action === 'register') {
        if (users.has(username)) return res.status(409).json({ success: false, message: 'User exists' });
        users.set(username, { password, created: Date.now(), isAdmin: false });

        const token = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(token, { username, loginTime: Date.now(), isGuest: false, isAdmin: false });

        return res.status(200).json({ success: true, token, username, isAdmin: false });
    }

    // --- LOGIN ---
    if (action === 'login') {
        const user = users.get(username);
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(token, {
            username,
            loginTime: Date.now(),
            isGuest: false,
            isAdmin: user.isAdmin,
            preferences: user.preferences
        });

        return res.status(200).json({
            success: true,
            token,
            username,
            isAdmin: user.isAdmin,
            preferences: user.preferences
        });
    }

    // --- UPDATE PREFERENCES (Admin Only) ---
    if (action === 'update_preferences') {
        const { token, preferences } = req.body;
        const session = sessions.get(token);

        if (!session || !session.isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const user = users.get(session.username);
        if (user) {
            user.preferences = { ...user.preferences, ...preferences };
            return res.status(200).json({ success: true, preferences: user.preferences });
        }
    }

    // --- GUEST ---
    if (action === 'guest') {
        const token = `guest_${Date.now()}`;
        sessions.set(token, { username: 'Guest', isGuest: true });
        return res.status(200).json({ success: true, token, username: 'Guest', isGuest: true });
    }

    return res.status(400).json({ success: false });
}
