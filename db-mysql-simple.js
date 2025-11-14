const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost', // ИСПРАВЛЕНО!
    user: 'fattoriaby_fattoriaby',
    password: '07092017fattoria',
    database: 'fattoriaby_parsing',
    charset: 'utf8mb4'
};

async function getConnection() {
    return await mysql.createConnection(dbConfig);
}

async function getProperties(filters = {}) {
    try {
        const connection = await getConnection();
        
        let query = 'SELECT * FROM properties WHERE 1=1';
        const params = [];
        
        if (filters.type) {
            query += ' AND type LIKE ?';
            params.push(`%${filters.type}%`);
        }
        if (filters.district) {
            query += ' AND district LIKE ?';
            params.push(`%${filters.district}%`);
        }
        if (filters.rooms) {
            query += ' AND rooms = ?';
            params.push(filters.rooms);
        }
        
        console.log('📊 Executing query:', query, 'with params:', params);
        const [rows] = await connection.execute(query, params);
        await connection.end();
        
        console.log(`📊 Found ${rows.length} properties`);
        return rows;
    } catch (error) {
        console.error('❌ Database error:', error.message);
        return [];
    }
}

async function getPropertyByUnid(unid) {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM properties WHERE unid = ?',
            [unid]
        );
        await connection.end();
        
        return rows[0] || null;
    } catch (error) {
        console.error('❌ Database error:', error.message);
        return null;
    }
}

module.exports = {
    getConnection,
    getProperties,
    getPropertyByUnid
};
