const mysql = require('mysql2/promise');

// Конфигурация подключения к MySQL базе данных на хостинге
const dbConfig = {
    host: 'vh146.hoster.by',
    port: 3306,
    user: 'fattoriaby_fattoriaby',
    password: '07092017fattoria',
    database: 'fattoriaby_parsing',
    charset: 'utf8mb4',
    connectTimeout: 60000
};

// Создание подключения к базе данных
let connection = null;

async function getConnection() {
    if (!connection) {
        try {
            connection = await mysql.createConnection(dbConfig);
            console.log('✅ Подключено к MySQL базе данных на хостинге.');
        } catch (error) {
            console.error('❌ Ошибка подключения к MySQL:', error.message);
            throw error;
        }
    }
    return connection;
}

// Функции для работы с данными
const databaseFunctions = {
    // Вставка или обновление свойства
    insertProperty: async function(property) {
        try {
            const conn = await getConnection();
            const query = `
                INSERT INTO properties (
                    unid, title, address, district, area, details, priceBYN, priceUSD,
                    type, code, agency_name, rooms, area_total, area_living, area_kitchen,
                    price, town_name, street_name, house_number, building_year, storey,
                    storeys, description, photos, state_region_name, town_district_name,
                    contact_phone_1, contact_name, contact_email, terms, house_type,
                    category, additional_params, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) AS new
                ON DUPLICATE KEY UPDATE
                    title = new.title,
                    address = new.address,
                    district = new.district,
                    area = new.area,
                    details = new.details,
                    priceBYN = new.priceBYN,
                    priceUSD = new.priceUSD,
                    type = new.type,
                    code = new.code,
                    agency_name = new.agency_name,
                    rooms = new.rooms,
                    area_total = new.area_total,
                    area_living = new.area_living,
                    area_kitchen = new.area_kitchen,
                    price = new.price,
                    town_name = new.town_name,
                    street_name = new.street_name,
                    house_number = new.house_number,
                    building_year = new.building_year,
                    storey = new.storey,
                    storeys = new.storeys,
                    description = new.description,
                    photos = new.photos,
                    state_region_name = new.state_region_name,
                    town_district_name = new.town_district_name,
                    contact_phone_1 = new.contact_phone_1,
                    contact_name = new.contact_name,
                    contact_email = new.contact_email,
                    terms = new.terms,
                    house_type = new.house_type,
                    category = new.category,
                    additional_params = new.additional_params,
                    last_updated = new.last_updated,
                    updated_at = CURRENT_TIMESTAMP
            `;

            const params = [
                property.unid,
                property.title,
                property.address,
                property.district,
                property.area,
                property.details,
                property.priceBYN,
                property.priceUSD,
                property.type,
                property.code,
                property.agency_name,
                property.rooms,
                property.area_total,
                property.area_living,
                property.area_kitchen,
                property.price,
                property.town_name,
                property.street_name,
                property.house_number,
                property.building_year,
                property.storey,
                property.storeys,
                property.description,
                Array.isArray(property.photos) ? property.photos.join('|') : property.photos,
                property.state_region_name,
                property.town_district_name,
                property.contact_phone_1,
                property.contact_name,
                property.contact_email || "",
                property.terms,
                property.house_type,
                property.category || "Наши квартиры",
                property.additional_params || "{}",
                property.last_updated || new Date().toISOString()
            ];

            const [result] = await conn.execute(query, params);
            console.log(`✅ Property ${property.unid} saved to MySQL (affected rows: ${result.affectedRows})`);
            return result.insertId || result.affectedRows;

        } catch (error) {
            console.error('❌ Database insert error:', error);
            throw error;
        }
    },

    // Получение свойств с фильтрами и пагинацией
    getProperties: async function(filters = {}, limit = 12, offset = 0) {
        try {
            const conn = await getConnection();

            let whereConditions = [];
            let params = [];

            // Фильтр по категории
            if (filters.category) {
                whereConditions.push("category = ?");
                params.push(filters.category);
            }

            if (filters.type) {
                whereConditions.push("type LIKE ?");
                params.push("%" + filters.type + "%");
            }

            if (filters.price_max) {
                whereConditions.push("CAST(price AS DECIMAL) <= ?");
                params.push(filters.price_max);
            }

            if (filters.area_min) {
                whereConditions.push("CAST(area_total AS DECIMAL) >= ?");
                params.push(filters.area_min);
            }

            if (filters.area_max) {
                whereConditions.push("CAST(area_total AS DECIMAL) <= ?");
                params.push(filters.area_max);
            }

            if (filters.rooms) {
                whereConditions.push("rooms = ?");
                params.push(filters.rooms);
            }

            const whereClause = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";
            params.push(limit, offset);

            const query = `
                SELECT * FROM properties
                ${whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `;

            const countQuery = `
                SELECT COUNT(*) as total FROM properties
                ${whereClause}
            `;

            const countParams = params.slice(0, -2);

            const [countResult] = await conn.execute(countQuery, countParams);
            const totalCount = countResult[0].total;

            const [rows] = await conn.execute(query, params);

            // Парсим photos из строки в массив
            const properties = rows.map(row => ({
                ...row,
                photos: row.photos ? row.photos.split('|').filter(photo => photo) : []
            }));

            return {
                properties: properties,
                totalCount: totalCount,
                hasMore: (offset + limit) < totalCount
            };

        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    },

    // Получение свойства по unid
    getPropertyByUnid: async function(unid) {
        try {
            const conn = await getConnection();
            const [rows] = await conn.execute('SELECT * FROM properties WHERE unid = ?', [unid]);

            if (rows.length > 0) {
                const row = rows[0];
                row.photos = row.photos ? row.photos.split('|').filter(photo => photo) : [];
                return row;
            }
            return null;

        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    },

    // Получение статистики по категориям
    getCategoryStats: async function() {
        try {
            const conn = await getConnection();
            const [rows] = await conn.execute(`
                SELECT category, COUNT(*) as count
                FROM properties
                GROUP BY category
            `);

            const stats = {};
            rows.forEach(row => {
                stats[row.category] = row.count;
            });
            return stats;

        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    },

    // Получение общего количества объектов
    getPropertiesCount: async function() {
        try {
            const conn = await getConnection();
            const [rows] = await conn.execute('SELECT COUNT(*) as count FROM properties');
            return rows[0].count;

        } catch (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }
    }
};

module.exports = { getConnection, ...databaseFunctions };
