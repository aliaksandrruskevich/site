const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("/home/fattoriaby/public_html/properties.db");
const fs = require('fs');

function detectAndFixEncoding(text) {
    if (!text) return text;
    
    // Проверяем есть ли кракозябры
    const hasCyrillicGarbage = /РЅ|Р°|РІ|Рµ|Рё|Рє|Р»|Рѕ|Рї|СЂ|СЃ|С‚|Сѓ/.test(text);
    
    if (!hasCyrillicGarbage) {
        return text; // Текст уже в правильной кодировке
    }
    
    // Расширенный список замен для кракозябр
    const replacements = {
        'РЅ': 'н', 'Р°': 'а', 'РІ': 'в', 'Рµ': 'е', 'Рё': 'и', 'Рє': 'к', 'Р»': 'л', 'Рѕ': 'о',
        'Рї': 'п', 'СЂ': 'р', 'СЃ': 'с', 'С‚': 'т', 'Сѓ': 'у', 'СЏ': 'я', 'Р±': 'б', 'Рі': 'г',
        'Рґ': 'д', 'Р¶': 'ж', 'Р·': 'з', 'Р№': 'й', 'Рј': 'м', 'РЅ': 'н', 'Рї': 'п', 'СЂ': 'р',
        'СЃ': 'с', 'С‚': 'т', 'С„': 'ф', 'С…': 'х', 'С†': 'ц', 'С‡': 'ч', 'С€': 'ш', 'С‰': 'щ',
        'СЉ': 'ъ', 'С‹': 'ы', 'СЊ': 'ь', 'РЎ': 'С', 'Рњ': 'М', 'Р': '', 
        'Р,': ',', 'Р.': '.', 'Р(': '(', 'Р)': ')', 'Р-': '-', 'Р_': '_',
        'РїСЂ': 'пр', 'РѕР±': 'об', 'РєРІ': 'кв', 'СѓР»': 'ул', 'РґРѕРј': 'дом',
        'РєРѕРјРЅ': 'комн', 'РєРІР°СЂС‚': 'кварт', 'РЅРµРґРІ': 'недви', 'РёРјРѕСЃ': 'имос',
        'С‚СЊ': 'ть', 'РѕСЃС‚': 'ост', 'СЏС‚': 'ят', 'СЊСЋ': 'ью', 'Р°СЏ': 'ая'
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
        console.log(`Processing ${rows.length} properties...\n`);
        
        let fixedCount = 0;
        const fixedRows = rows.map(property => {
            const originalTitle = property.title;
            const fixedTitle = detectAndFixEncoding(property.title);
            const fixedType = detectAndFixEncoding(property.type);
            const fixedLocation = detectAndFixEncoding(property.location);
            const fixedDescription = detectAndFixEncoding(property.description);
            
            if (originalTitle !== fixedTitle) {
                console.log(`Fixed: "${originalTitle}" -> "${fixedTitle}"`);
                fixedCount++;
            }
            
            return {
                unid: property.unid,
                title: fixedTitle,
                price: property.price,
                currency: property.currency || 'USD',
                type: fixedType,
                rooms: property.rooms,
                area: property.area,
                location: fixedLocation,
                description: fixedDescription,
                photos: property.photos
            };
        });
        
        console.log(`\nFixed ${fixedCount} properties with encoding issues`);
        
        // Сохраняем исправленные данные
        fs.writeFileSync('/home/fattoriaby/public_html/api/properties.json', JSON.stringify(fixedRows, null, 2));
        console.log('Saved fixed properties.json');
        
        // Создаем property-*.json файлы
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
