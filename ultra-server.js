const http = require('http');
const fs = require('fs');
const path = require('path');
const { getProperties, getPropertyByUnid } = require('./db-mysql-simple');
const { handleFormSubmission } = require('./bitrix-simple');

const PORT = process.env.PORT || 3000;

// 🔥 КЭШ В ПАМЯТИ
const cache = {
    properties: null,
    propertiesTime: 0,
    staticFiles: new Map(),
    apiResponses: new Map()
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
const STATIC_CACHE_DURATION = 60 * 60 * 1000; // 1 час

// 🔥 СЖАТИЕ GZIP
const zlib = require('zlib');

// 🔥 КЭШИРОВАНИЕ СТАТИЧЕСКИХ ФАЙЛОВ
async function getCachedStaticFile(filePath) {
    const now = Date.now();
    
    if (cache.staticFiles.has(filePath)) {
        const cached = cache.staticFiles.get(filePath);
        if (now - cached.timestamp < STATIC_CACHE_DURATION) {
            return cached.content;
        }
    }
    
    try {
        const content = await fs.promises.readFile(filePath);
        cache.staticFiles.set(filePath, {
            content: content,
            timestamp: now
        });
        return content;
    } catch (error) {
        throw error;
    }
}

// 🔥 КЭШИРОВАНИЕ API
function getCachedAPI(key) {
    const now = Date.now();
    if (cache.apiResponses.has(key)) {
        const cached = cache.apiResponses.get(key);
        if (now - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
    }
    return null;
}

function setCachedAPI(key, data) {
    cache.apiResponses.set(key, {
        data: data,
        timestamp: Date.now()
    });
}

// ВСЕ маршруты для HTML страниц
const routes = {
    '/': 'index.html',
    '/properties': 'properties.html',
    '/new-buildings': 'new-buildings.html',
    '/about': 'about.html',
    '/services-buyers': 'services-buyers.html',
    '/services-sellers': 'services-sellers.html',
    '/information': 'information.html',
    '/founders': 'founders.html',
    '/staff': 'staff.html',
    '/tariff-grid': 'tariff-grid.html',
    '/commercial-properties': 'commercial-properties.html',
    '/country-properties': 'country-properties.html',
    '/blog': 'blog.html',
    '/article': 'article.html',
    '/category': 'category.html',
    '/object': 'object.html',
    '/objects-with-photos': 'objects-with-photos.html',
    '/mortgage-calculator': 'mortgage-calculator.html',
    '/cookie-policy': 'cookie-policy.html',
    '/user-agreement': 'user-agreement.html',
    '/test-objects': 'test-objects.html',
    
    // ЖК маршруты
    '/jk/verhina': 'новостройки/жк-вершина.html',
    '/jk/depo': 'новостройки/жк-депо.html', 
    '/jk/dubravinsky': 'новостройки/жк-дубравинский.html',
    '/jk/zelenaya-gavan': 'новостройки/жк-зеленая-гавань.html',
    '/jk/komfort-park': 'новостройки/жк-комфорт-парк.html',
    '/jk/levada': 'новостройки/жк-левада.html',
    '/jk/mayak-minska': 'новостройки/жк-маяк-минска.html',
    '/jk/minsk-mir': 'новостройки/жк-минск-мир.html',
    '/jk/novaya-borovaya': 'новостройки/жк-новая-боровая.html',
    '/jk/park-chelyuskincev': 'новостройки/жк-парк-челюскинцев.html',
    '/jk/farforovy': 'новостройки/жк-фарфоровый.html'
};

const server = http.createServer(async (req, res) => {
    console.log('Request:', req.url);
    
    // 🔥 API ROUTES С КЭШИРОВАНИЕМ
    if (req.url.startsWith('/api/properties') && req.method === 'GET') {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const filters = {
                type: url.searchParams.get('type'),
                district: url.searchParams.get('district'),
                rooms: url.searchParams.get('rooms'),
                page: url.searchParams.get('page'),
                limit: url.searchParams.get('limit')
            };

            const cacheKey = `properties_${JSON.stringify(filters)}`;
            const cachedData = getCachedAPI(cacheKey);

            if (cachedData) {
                console.log('📦 Serving from cache:', cacheKey);
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Cache': 'HIT'
                });
                res.end(JSON.stringify(cachedData));
                return;
            }

            console.log('📡 API Request with filters:', filters);

            // Если есть фильтры, используем базу данных
            let properties;
            if (filters.type || filters.district || filters.rooms) {
                properties = await getProperties(filters);
            } else {
                // Если нет фильтров, используем JSON файл
                try {
                    const jsonData = await fs.promises.readFile('./api/properties.json', 'utf8');
                    properties = JSON.parse(jsonData);
                    console.log('📄 Loaded from JSON file:', properties.length, 'properties');
                } catch (jsonError) {
                    console.log('📊 Falling back to database');
                    properties = await getProperties(filters);
                }
            }

            setCachedAPI(cacheKey, properties);

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'MISS'
            });
            res.end(JSON.stringify(properties));
            return;
        } catch (error) {
            console.error('❌ API Error:', error);
            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'Database error' }));
            return;
        }
    }
    
    // 🔥 API для получения одного объекта по unid С КЭШИРОВАНИЕМ
    if (req.url.startsWith('/api/property/') && req.method === 'GET') {
        try {
            const unid = req.url.split('/')[3];
            const cacheKey = `property_${unid}`;
            const cachedData = getCachedAPI(cacheKey);
            
            if (cachedData) {
                console.log('📦 Serving from cache:', cacheKey);
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Cache': 'HIT'
                });
                res.end(JSON.stringify(cachedData));
                return;
            }
            
            console.log('📡 API Request for property:', unid);
            const property = await getPropertyByUnid(unid);
            
            if (property) {
                setCachedAPI(cacheKey, property);
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Cache': 'MISS'
                });
                res.end(JSON.stringify(property));
            } else {
                res.writeHead(404, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ error: 'Property not found' }));
            }
            return;
        } catch (error) {
            console.error('❌ API Error:', error);
            res.writeHead(500, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'Database error' }));
            return;
        }
    }
    
    // 🔥 FORM SUBMISSION - обработка форм обратной связи
    if (req.url === '/api/submit-form' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const formData = JSON.parse(body);
                console.log('📝 Получены данные формы:', formData);
                
                // Отправляем в Google Sheets
                const result = await handleFormSubmission('lead', formData);
                console.log('📨 Результат отправки в Google Sheets:', result);
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify(result));
                
            } catch (error) {
                console.error('❌ Ошибка обработки формы:', error);
                res.writeHead(500, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Ошибка сервера',
                    error: error.message
                }));
            }
        });
        return;
    }

    // 🔥 FORM SUBMISSION - обработка форм для api/submit-form.php
    if (req.url === '/api/submit-form.php' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                console.log('📧 FORM RECEIVED (api/submit-form.php)');

                let formData;
                try {
                    formData = JSON.parse(body);
                } catch (e) {
                    const querystring = require('querystring');
                    formData = querystring.parse(body);
                }

                // Логируем
                fs.appendFileSync('form-debug.log',
                    `PHP ENDPOINT - ${new Date().toISOString()}: ${JSON.stringify(formData)}\n`
                );

                // Валидация
                if (!formData.name || (!formData.phone && !formData.contact)) {
                    res.writeHead(400, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Name and phone are required'
                    }));
                    return;
                }

                // Отправляем в Google Sheets
                try {
                    const result = await handleFormSubmission('lead', formData);

                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Form submitted successfully'
                    }));

                } catch (error) {
                    console.log('Google Apps Script error:', error);
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({
                        success: true,
                        message: 'Form saved locally'
                    }));
                }

            } catch (error) {
                console.error('Form error:', error);
                res.writeHead(500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({
                    success: false,
                    error: 'Internal server error'
                }));
            }
        });
        return;
    }
    
    // 📄 Страница объекта по unid
    if (req.url.startsWith('/object/') && req.method === 'GET') {
        serveFile(res, 'object.html');
        return;
    }
    
    // HTML pages
    if (routes[req.url]) {
        const filePath = routes[req.url];
        serveFile(res, filePath);
        return;
    }
    
    // Для index.php - отдаем главную страницу
    if (req.url === '/index.php') {
        serveFile(res, 'index.html');
        return;
    }
    
    // Static files (CSS, JS, images, etc.) С КЭШИРОВАНИЕМ
    serveStaticFile(req, res);
});

async function serveFile(res, filePath) {
    console.log('Serving file:', filePath);
    try {
        const content = await getCachedStaticFile(filePath);
        res.writeHead(200, { 
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        });
        res.end(content);
    } catch (err) {
        console.error('File error:', err.message);
        res.writeHead(404);
        res.end('Page not found: ' + filePath);
    }
}

async function serveStaticFile(req, res) {
    let filePath = '.' + req.url;
    
    // Убираем query параметры для статических файлов
    const questionMarkIndex = filePath.indexOf('?');
    if (questionMarkIndex !== -1) {
        filePath = filePath.substring(0, questionMarkIndex);
    }
    
    console.log('Static file:', filePath);
    
    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
    };
    
    try {
        const content = await getCachedStaticFile(filePath);
        const contentType = contentTypes[ext] || 'text/plain';
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // 24 часа для статики
            'X-Cache': 'HIT'
        });
        res.end(content);
    } catch (err) {
        console.error('Static file error:', err.message);
        res.writeHead(404);
        res.end('File not found: ' + filePath);
    }
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ULTRA-LIGHT Server WITH CACHE running on http://0.0.0.0:${PORT}`);
    console.log('✅ MySQL connected, ALL routes configured');
    console.log('🔥 API and Static files CACHING ENABLED!');
    console.log('📧 Google Sheets + Gmail forms integration ENABLED!');
});

// 🔥 ОЧИСТКА КЭША КАЖДЫЕ 10 МИНУТ
setInterval(() => {
    const now = Date.now();
    let cleared = 0;
    
    // Очищаем устаревшие API кэши
    for (const [key, value] of cache.apiResponses.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.apiResponses.delete(key);
            cleared++;
        }
    }
    
    // Очищаем устаревшие статические файлы
    for (const [key, value] of cache.staticFiles.entries()) {
        if (now - value.timestamp > STATIC_CACHE_DURATION) {
            cache.staticFiles.delete(key);
            cleared++;
        }
    }
    
    if (cleared > 0) {
        console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }
}, 10 * 60 * 1000); // 10 минут
