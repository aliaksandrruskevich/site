const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("/home/fattoriaby/public_html/properties.db");
const fs = require('fs');

function fixEncoding(text) {
    if (!text) return text;
    
    // Правильные замены для Windows-1251 -> UTF-8
    const replacements = {
        // Заглавные буквы
        'РЂ': 'А', 'РЎ': 'С', 'Рў': 'Т', 'РЈ': 'У', 'Р¤': 'Ф', 'РҐ': 'Х', 'Р¦': 'Ц', 'Р§': 'Ч',
        'РЁ': 'Ш', 'Р©': 'Щ', 'РЄ': 'Ъ', 'РЅ': 'Н', 'РЇ': 'Я',
        'РЌ': 'Э', 'Р°': 'а', 'Р±': 'б', 'РІ': 'в', 'Рі': 'г', 'Рґ': 'д', 'Рµ': 'е', 'Р¶': 'ж',
        'Р·': 'з', 'Рё': 'и', 'Р№': 'й', 'Рє': 'к', 'Р»': 'л', 'Рј': 'м', 'РЅ': 'н', 'Рѕ': 'о',
        'Рї': 'п', 'СЂ': 'р', 'СЃ': 'с', 'С‚': 'т', 'Сѓ': 'у', 'С„': 'ф', 'С…': 'х', 'С†': 'ц',
        'С‡': 'ч', 'С€': 'ш', 'С‰': 'щ', 'СЉ': 'ъ', 'С‹': 'ы', 'СЊ': 'ь', 'СЌ': 'э', 'СЏ': 'я',
        'Р ': ' ', 'Р,': ',', 'Р.': '.', 'Р(': '(', 'Р)': ')', 'Р-': '-', 'Р_': '_', 'Р№': 'й',
        // Особые случаи
        'Рњ': 'М', 'Рќ': 'Н', 'Рџ': 'П', 'Р ': ' ', 'Р': ''
    };
    
    let result = text;
    for (const [from, to] of Object.entries(replacements)) {
        result = result.split(from).join(to);
    }
    
    return result;
}

db.all("SELECT * FROM properties", (err, rows) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log(`Final fix for ${rows.length} properties...\n`);
        
        const fixedRows = rows.map(property => ({
            unid: property.unid,
            title: fixEncoding(property.title),
            price: property.price,
            currency: property.currency || 'USD',
            type: fixEncoding(property.type),
            rooms: property.rooms,
            area: property.area,
            location: fixEncoding(property.location),
            description: fixEncoding(property.description),
            photos: property.photos
        }));
        
        // Покажем несколько примеров
        console.log("Sample results:");
        fixedRows.slice(0, 5).forEach(prop => {
            console.log(`"${prop.title}" -> "${prop.location}"`);
        });
        
        // Сохраняем
        fs.writeFileSync('/home/fattoriaby/public_html/api/properties.json', JSON.stringify(fixedRows, null, 2));
        console.log('\nSaved final properties.json');
        
        // Обновляем property-*.json файлы
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
        console.log('Updated property files');
    }
    db.close();
});
