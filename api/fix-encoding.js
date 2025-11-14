const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("/home/fattoriaby/public_html/properties.db");
const fs = require('fs');
const iconv = require('iconv-lite');

db.all("SELECT * FROM properties", (err, rows) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Total properties in database:", rows.length);
        
        // Функция для исправления кодировки
        function fixEncoding(text) {
            if (!text) return text;
            // Пробуем разные кодировки
            try {
                return iconv.decode(Buffer.from(text, 'binary'), 'win1251');
            } catch (e) {
                return text;
            }
        }
        
        // Исправляем кодировку в каждом объекте
        const fixedRows = rows.map(property => ({
            ...property,
            title: fixEncoding(property.title),
            description: fixEncoding(property.description),
            location: fixEncoding(property.location),
            type: fixEncoding(property.type)
        }));
        
        // Сохраняем в properties.json
        fs.writeFileSync('/home/fattoriaby/public_html/api/properties.json', JSON.stringify(fixedRows, null, 2));
        console.log('Saved fixed properties.json');
        
        // Создаем отдельные файлы
        fixedRows.forEach(property => {
            if (property.unid) {
                const fileName = `/home/fattoriaby/public_html/api/property-${property.unid}.json`;
                const data = {
                    unid: property.unid,
                    title: property.title,
                    price: property.price,
                    currency: property.currency || 'USD',
                    type: property.type,
                    rooms: property.rooms,
                    area: property.area,
                    location: property.location,
                    description: property.description,
                    images: property.photos ? property.photos.split('|') : []
                };
                fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
            }
        });
        console.log('Created fixed property files');
    }
    db.close();
});
