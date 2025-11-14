const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./properties.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

db.serialize(() => {
    db.all("SELECT * FROM properties", [], (err, rows) => {
        if (err) {
            console.error('Error querying database:', err.message);
            return;
        }

        // Convert to MySQL compatible INSERT statements
        let sql = '';

        // Create table statement (MySQL compatible)
        sql += `CREATE TABLE IF NOT EXISTS properties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            unid VARCHAR(255) UNIQUE NOT NULL,
            title TEXT NOT NULL,
            address TEXT,
            district TEXT,
            area TEXT,
            details TEXT,
            priceBYN TEXT,
            priceUSD TEXT,
            type TEXT,
            code TEXT,
            agency_name TEXT,
            rooms TEXT,
            area_total TEXT,
            area_living TEXT,
            area_kitchen TEXT,
            price DECIMAL(15,2),
            town_name TEXT,
            street_name TEXT,
            house_number TEXT,
            building_year TEXT,
            storey TEXT,
            storeys TEXT,
            description TEXT,
            photos TEXT,
            state_region_name TEXT,
            town_district_name TEXT,
            contact_phone_1 TEXT,
            contact_name TEXT,
            contact_email TEXT,
            terms TEXT,
            house_type TEXT,
            category VARCHAR(100) DEFAULT 'Наши квартиры',
            additional_params TEXT,
            last_updated TEXT,
            archive TINYINT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        `;

        // Create indexes
        sql += `CREATE INDEX IF NOT EXISTS idx_unid ON properties(unid);
        CREATE INDEX IF NOT EXISTS idx_type ON properties(type(50));
        CREATE INDEX IF NOT EXISTS idx_price ON properties(price);
        CREATE INDEX IF NOT EXISTS idx_category ON properties(category);

        `;

        // Insert statements
        rows.forEach(row => {
            const values = [
                row.id,
                row.unid,
                row.title,
                row.address,
                row.district,
                row.area,
                row.details,
                row.priceBYN,
                row.priceUSD,
                row.type,
                row.code,
                row.agency_name,
                row.rooms,
                row.area_total,
                row.area_living,
                row.area_kitchen,
                row.price,
                row.town_name,
                row.street_name,
                row.house_number,
                row.building_year,
                row.storey,
                row.storeys,
                row.description,
                row.photos,
                row.state_region_name,
                row.town_district_name,
                row.contact_phone_1,
                row.contact_name,
                row.contact_email,
                row.terms,
                row.house_type,
                row.category,
                row.additional_params,
                row.last_updated,
                row.archive,
                row.created_at,
                row.updated_at
            ];

            // Escape single quotes and handle null values
            const escapedValues = values.map(val => {
                if (val === null || val === undefined) return 'NULL';
                return "'" + String(val).replace(/'/g, "''") + "'";
            });

            sql += `INSERT INTO properties VALUES (${escapedValues.join(', ')});\n`;
        });

        // Write to file
        fs.writeFileSync('properties_mysql_dump.sql', sql, 'utf8');
        console.log('✅ MySQL dump created: properties_mysql_dump.sql');

        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    });
});
