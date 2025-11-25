// Leaderboard API - Funciona com ou sem Redis
// Se Redis não estiver configurado, retorna dados vazios mas não quebra

import { Redis } from '@upstash/redis';

const LEADERBOARD_KEY = 'leaderboard:global';
const MAX_ENTRIES = 100; // Máximo de entradas no ranking

// Placeholder entries quando não tem dados
const EMPTY_LEADERBOARD = [
    { name: '- - -', score: 0, date: null, rank: 1 },
    { name: '- - -', score: 0, date: null, rank: 2 },
    { name: '- - -', score: 0, date: null, rank: 3 },
];

// Tenta criar conexão Redis
function createRedisClient() {
    try {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            return new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
        }
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            return new Redis({
                url: process.env.KV_REST_API_URL,
                token: process.env.KV_REST_API_TOKEN,
            });
        }
    } catch (e) {
        console.error('Redis init error:', e.message);
    }
    return null;
}

export default async function handler(request, response) {
    // CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // DEBUG endpoint - para verificar se variáveis estão configuradas
    if (request.query.debug === 'true') {
        return response.status(200).json({
            hasRedisLib: true,
            hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
            hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
            hasKvUrl: !!process.env.KV_REST_API_URL,
            upstashUrlPreview: process.env.UPSTASH_REDIS_REST_URL ? 
                process.env.UPSTASH_REDIS_REST_URL.substring(0, 30) + '...' : null,
        });
    }

    // Tenta criar cliente Redis - se falhar, continua sem
    let redis = null;
    try {
        redis = createRedisClient();
    } catch (e) {
        console.log('Redis not available:', e.message);
    }

    try {
        // ============ GET - Buscar ranking ============
        if (request.method === 'GET') {
            // Se não tem Redis, retorna leaderboard vazio IMEDIATAMENTE
            if (!redis) {
                return response.status(200).json({ 
                    success: true, 
                    leaderboard: EMPTY_LEADERBOARD,
                    offline: true
                });
            }

            let scores;
            try {
                scores = await redis.zrange(LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });
            } catch (e) {
                console.error('Redis zrange error:', e.message);
                return response.status(200).json({ 
                    success: true, 
                    leaderboard: EMPTY_LEADERBOARD,
                    offline: true
                });
            }

            // Se não tem scores, retorna placeholder
            if (!scores || scores.length === 0) {
                return response.status(200).json({ 
                    success: true, 
                    leaderboard: EMPTY_LEADERBOARD,
                    empty: true
                });
            }

            // Debug: ver formato dos scores
            console.log('Scores raw:', JSON.stringify(scores));

            const leaderboard = [];
            
            // Upstash retorna array de objetos {score, member} ou array alternado [member, score]
            if (Array.isArray(scores) && scores[0] && typeof scores[0] === 'object' && 'score' in scores[0]) {
                // Formato: [{score: 297, member: "{...}"}, ...]
                for (let i = 0; i < scores.length; i++) {
                    const item = scores[i];
                    try {
                        const memberData = typeof item.member === 'string' ? JSON.parse(item.member) : item.member;
                        leaderboard.push({
                            name: memberData.name || 'Unknown',
                            score: Number(item.score),
                            date: memberData.date || null,
                            rank: i + 1
                        });
                    } catch {
                        leaderboard.push({
                            name: String(item.member),
                            score: Number(item.score),
                            date: null,
                            rank: i + 1
                        });
                    }
                }
            } else {
                // Formato alternado: [member, score, member, score, ...]
                for (let i = 0; i < scores.length; i += 2) {
                    try {
                        const data = typeof scores[i] === 'string' ? JSON.parse(scores[i]) : scores[i];
                        leaderboard.push({
                            name: data.name || 'Unknown',
                            score: Number(scores[i + 1]),
                            date: data.date || null,
                            rank: Math.floor(i / 2) + 1
                        });
                    } catch {
                        leaderboard.push({
                            name: String(scores[i]),
                            score: Number(scores[i + 1]),
                            date: null,
                            rank: Math.floor(i / 2) + 1
                        });
                    }
                }
            }

            // Preenche até 3 se tiver menos
            while (leaderboard.length < 3) {
                leaderboard.push({
                    name: '???',
                    score: 0,
                    date: null,
                    rank: leaderboard.length + 1
                });
            }

            return response.status(200).json({ success: true, leaderboard });
        }

        // ============ POST - Salvar score ============
        if (request.method === 'POST') {
            const { name, score } = request.body || {};

            // Validações
            if (!name || name.length < 2) {
                return response.status(400).json({ 
                    success: false, 
                    error: 'Nome deve ter pelo menos 2 caracteres' 
                });
            }

            if (typeof score !== 'number' || isNaN(score)) {
                return response.status(400).json({ 
                    success: false, 
                    error: 'Score inválido' 
                });
            }

            // Se não tem Redis, retorna sucesso fake mas avisa
            if (!redis) {
                return response.status(200).json({ 
                    success: true, 
                    rank: null,
                    offline: true,
                    message: 'Score salvo apenas localmente (Redis não configurado)'
                });
            }

            const cleanName = String(name).substring(0, 15).trim();
            const entry = JSON.stringify({
                name: cleanName,
                date: new Date().toISOString(),
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            // Salvar no Redis
            await redis.zadd(LEADERBOARD_KEY, { score: Math.floor(score), member: entry });

            // Limpar excesso
            const total = await redis.zcard(LEADERBOARD_KEY);
            if (total > MAX_ENTRIES) {
                await redis.zremrangebyrank(LEADERBOARD_KEY, 0, total - MAX_ENTRIES - 1);
            }

            // Buscar rank
            const rank = await redis.zrevrank(LEADERBOARD_KEY, entry);

            return response.status(200).json({ 
                success: true, 
                rank: rank !== null ? rank + 1 : null,
                message: `Score salvo! ${rank !== null ? `Posição #${rank + 1}` : ''}`
            });
        }

        return response.status(405).json({ success: false, error: 'Método não permitido' });

    } catch (error) {
        console.error('Leaderboard API error:', error);
        
        // Em caso de erro, retorna sucesso com modo offline
        if (request.method === 'GET') {
            return response.status(200).json({ 
                success: true, 
                leaderboard: EMPTY_LEADERBOARD,
                offline: true,
                error: error.message
            });
        }
        
        return response.status(200).json({ 
            success: true, 
            offline: true,
            message: 'Score salvo localmente',
            error: error.message
        });
    }
}
