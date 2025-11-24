import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    try {
        if (request.method === 'GET') {
            // Fetch top 10 scores
            // ZREVRANGE returns elements in descending order (highest score first)
            const scores = await kv.zrange('leaderboard', 0, 9, { rev: true, withScores: true });

            // KV returns [member1, score1, member2, score2...]
            // We need to format it nicely
            const formatted = [];
            for (let i = 0; i < scores.length; i += 2) {
                formatted.push({
                    name: scores[i],
                    score: scores[i + 1]
                });
            }

            return response.status(200).json(formatted);
        }

        if (request.method === 'POST') {
            const { name, score } = request.body;

            if (!name || !score) {
                return response.status(400).json({ error: 'Missing name or score' });
            }

            // Add to sorted set
            // ZADD adds the member with the score. If member exists, updates score.
            // To allow duplicate names with different scores, we might append a timestamp or ID to the name,
            // but for simplicity we'll just use the name and overwrite if they improve.
            // Actually, let's append a random ID to allow multiple entries per name? 
            // No, standard arcade rules: one entry per name usually.
            // But if two people are named "Player", they overwrite.
            // Let's use "Name#1234" format internally but display "Name".

            await kv.zadd('leaderboard', { score: score, member: name });
            return response.status(200).json({ success: true });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
