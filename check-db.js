const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'fattoriaby_fattoriaby',
    password: '07092017fattoria',
    database: 'fattoriaby_parsing'
};

async function checkDatabase() {
    try {
        console.log('🔍 Checking database...');
        const connection = await mysql.createConnection(dbConfig);
        
        // Проверим таблицы
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📋 Tables:', tables.map(t => t.Tables_in_fattoriaby_parsing));
        
        // Проверим записи в properties
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM properties');
        console.log(`📊 Records in properties: ${rows[0].count}`);
        
        // Покажем несколько записей если есть
        if (rows[0].count > 0) {
            const [sample] = await connection.execute('SELECT unid, title FROM properties LIMIT 3');
            console.log('📝 Sample records:', sample);
        }
        
        await connection.end();
        console.log('✅ Database check completed');
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkDatabase();
