import { Redis } from '@upstash/redis';

// Inicializa conexão com Redis
// Suporta tanto UPSTASH_REDIS_REST_URL/TOKEN quanto REDIS_URL
let redis;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} else if (process.env.REDIS_URL) {
    // Parse REDIS_URL format: redis://default:TOKEN@HOST:PORT
    const redisUrl = process.env.REDIS_URL;
    // Extrair host para formar a REST URL
    const match = redisUrl.match(/redis:\/\/[^:]+:([^@]+)@([^:]+):(\d+)/);
    if (match) {
        const [, token, host] = match;
        redis = new Redis({
            url: `https://${host}`,
            token: token,
        });
    }
}

// Fallback se nenhuma variável estiver configurada
if (!redis) {
    console.error('Redis não configurado! Verifique as variáveis de ambiente.');
}

const LEADERBOARD_KEY = 'leaderboard:global';
const MAX_ENTRIES = 100;

export default async function handler(request, response) {
    // CORS headers para permitir acesso de qualquer origem
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        if (request.method === 'GET') {
            // Buscar top 10 scores (ordem decrescente)
            const scores = await redis.zrange(LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });

            const leaderboard = [];
            for (let i = 0; i < scores.length; i += 2) {
                try {
                    const data = JSON.parse(scores[i]);
                    leaderboard.push({
                        name: data.name,
                        score: scores[i + 1],
                        date: data.date,
                        rank: Math.floor(i / 2) + 1
                    });
                } catch {
                    // Fallback para entradas antigas (string simples)
                    leaderboard.push({
                        name: scores[i],
                        score: scores[i + 1],
                        date: null,
                        rank: Math.floor(i / 2) + 1
                    });
                }
            }

            return response.status(200).json({ success: true, leaderboard });
        }

        if (request.method === 'POST') {
            const { name, score } = request.body;

            if (!name || typeof score !== 'number') {
                return response.status(400).json({ success: false, error: 'Nome e score são obrigatórios' });
            }

            // Limitar e limpar nome
            const cleanName = String(name).substring(0, 15).trim();
            
            if (cleanName.length < 2) {
                return response.status(400).json({ success: false, error: 'Nome deve ter pelo menos 2 caracteres' });
            }

            // Criar entrada única com timestamp
            const entry = JSON.stringify({
                name: cleanName,
                date: new Date().toISOString(),
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            // Adicionar ao sorted set
            await redis.zadd(LEADERBOARD_KEY, { score: score, member: entry });

            // Manter apenas os top 100
            const total = await redis.zcard(LEADERBOARD_KEY);
            if (total > MAX_ENTRIES) {
                await redis.zremrangebyrank(LEADERBOARD_KEY, 0, total - MAX_ENTRIES - 1);
            }

            // Buscar rank do jogador
            const rank = await redis.zrevrank(LEADERBOARD_KEY, entry);

            return response.status(200).json({ 
                success: true, 
                rank: (rank !== null ? rank + 1 : null),
                message: rank !== null ? `Score salvo! Você está em #${rank + 1}` : 'Score salvo!'
            });
        }

        return response.status(405).json({ success: false, error: 'Método não permitido' });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return response.status(500).json({ success: false, error: 'Erro interno do servidor', details: error.message });
    }
}
