const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("/home/fattoriaby/public_html/properties.db");
const fs = require('fs');

db.all("SELECT * FROM properties", (err, rows) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log(`Restoring ${rows.length} original properties...`);
        
        // Сохраняем оригинальные данные
        fs.writeFileSync('/home/fattoriaby/public_html/api/properties.json', JSON.stringify(rows, null, 2));
        console.log('Saved original properties.json');
        
        // Создаем property-*.json файлы
        rows.forEach(property => {
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
        console.log('Created property files');
    }
    db.close();
});
