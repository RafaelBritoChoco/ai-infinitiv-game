// Leaderboard API - Funciona com ou sem Redis
// Se Redis não estiver configurado, retorna dados vazios mas não quebra

import { Redis } from '@upstash/redis';

const LEADERBOARD_KEY = 'leaderboard:season_1';
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
                // ZRANGE agora retorna apenas [member, score, member, score...]
                // member é apenas o NOME do jogador agora
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

            const leaderboard = [];
            const names = [];
            
            let processedScores = [];
            if (Array.isArray(scores)) {
                // Check if it's an array of objects (new Upstash SDK) or flat array (old SDK)
                if (scores.length > 0 && typeof scores[0] === 'object' && 'score' in scores[0]) {
                    // Format: [{member: 'Rafa', score: 100}, ...]
                    processedScores = scores;
                } else {
                    // Format: ['Rafa', 100, 'Bob', 90]
                    for (let i = 0; i < scores.length; i += 2) {
                        processedScores.push({ member: scores[i], score: scores[i+1] });
                    }
                }
            }

            // Coletar nomes
            processedScores.forEach(item => {
                const name = String(item.member);
                names.push(name);
            });

            // Buscar metadados (datas)
            let metadata = [];
            if (names.length > 0) {
                try {
                    // HMGET retorna array de valores na mesma ordem das chaves
                    metadata = await redis.hmget('leaderboard:metadata', ...names);
                } catch (e) {
                    console.error('Metadata fetch error:', e);
                }
            }

            // Montar leaderboard final
            processedScores.forEach((item, index) => {
                const name = String(item.member);
                let date = null;
                
                // Tentar extrair data dos metadados
                if (metadata && metadata[index]) {
                    try {
                        const meta = typeof metadata[index] === 'string' ? JSON.parse(metadata[index]) : metadata[index];
                        date = meta.date;
                    } catch {}
                }

                leaderboard.push({
                    name: name,
                    score: Number(item.score),
                    date: date,
                    rank: index + 1
                });
            });

            // Preenche até 3 se tiver menos
            while (leaderboard.length < 3) {
                leaderboard.push({
                    name: '- - -',
                    score: 0,
                    date: null,
                    rank: leaderboard.length + 1
                });
            }

            return response.status(200).json({ success: true, leaderboard });
        }

        // ============ POST - Salvar score ============
        if (request.method === 'POST') {
            // RESET endpoint - zerar leaderboard
            if (request.body?.action === 'RESET_LEADERBOARD_2025') {
                if (!redis) {
                    return response.status(200).json({ success: false, error: 'Redis não disponível' });
                }
                await redis.del(LEADERBOARD_KEY);
                await redis.del('leaderboard:metadata'); // Limpar metadados também
                return response.status(200).json({ success: true, message: 'Leaderboard zerado!' });
            }

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
            
            // 1. Verificar score atual do jogador
            const currentScore = await redis.zscore(LEADERBOARD_KEY, cleanName);
            
            // Só atualiza se o novo score for maior
            if (currentScore === null || score > Number(currentScore)) {
                // Salvar Score (Nome é a chave única)
                await redis.zadd(LEADERBOARD_KEY, { score: Math.floor(score), member: cleanName });
                
                // Salvar Metadados (Data)
                const meta = JSON.stringify({
                    date: new Date().toISOString(),
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                });
                await redis.hset('leaderboard:metadata', { [cleanName]: meta });
            }

            // Limpar excesso (manter top 100)
            const total = await redis.zcard(LEADERBOARD_KEY);
            if (total > MAX_ENTRIES) {
                // Remover os piores
                const removed = await redis.zremrangebyrank(LEADERBOARD_KEY, 0, total - MAX_ENTRIES - 1);
                // Nota: Não limpamos o hash de metadados automaticamente para economizar ops, 
                // mas idealmente limparíamos nomes removidos.
            }

            // Buscar rank ATUALIZADO
            const rank = await redis.zrevrank(LEADERBOARD_KEY, cleanName);
            const finalRank = rank !== null ? rank + 1 : null;

            // Se entrou no top 3, retorna flag para celebração
            const isTop3 = finalRank !== null && finalRank <= 3;

            return response.status(200).json({ 
                success: true, 
                rank: finalRank,
                isTop3: isTop3,
                message: `Score salvo! ${finalRank !== null ? `Posição #${finalRank}` : ''}`
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
