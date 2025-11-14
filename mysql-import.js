const mysql = require('mysql2/promise');
const fs = require('fs');

// Конфигурация подключения к MySQL базе данных на хостинге
const dbConfig = {
    host: 'vh146.hoster.by', // Замените на ваш хост
    port: 3306, // Порт MySQL
    user: 'fattoriaby_fattoriaby', // Замените на вашего пользователя
    password: '07092017fattoria', // Замените на ваш пароль
    database: 'fattoriaby_parsing', // Замените на вашу базу данных
    charset: 'utf8mb4',
    connectTimeout: 60000 // Увеличенный таймаут
};

async function importData() {
    let connection;

    try {
        console.log('Подключение к MySQL базе данных...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Подключено к MySQL базе данных.');

        // Чтение SQL файла
        const sqlContent = fs.readFileSync('properties_mysql_dump.sql', 'utf8');
        console.log('📄 SQL файл прочитан.');

        // Разделение на отдельные запросы
        const queries = sqlContent.split(';').filter(query => query.trim().length > 0);

        console.log(`🔄 Выполнение ${queries.length} запросов...`);

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i].trim();
            if (query) {
                try {
                    await connection.execute(query);
                    if (i % 100 === 0) {
                        console.log(`✅ Выполнено ${i + 1}/${queries.length} запросов`);
                    }
                } catch (error) {
                    console.error(`❌ Ошибка в запросе ${i + 1}:`, error.message);
                    console.error('Запрос:', query.substring(0, 200) + '...');
                    // Продолжаем выполнение остальных запросов
                }
            }
        }

        console.log('✅ Импорт данных завершен!');

    } catch (error) {
        console.error('❌ Ошибка импорта:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Подключение закрыто.');
        }
    }
}

// Запуск импорта
importData();
