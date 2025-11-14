const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("/home/fattoriaby/public_html/properties.db");
const fs = require('fs');

// Функция для исправления кодировки Windows-1251 -> UTF-8
function fixWin1251ToUtf8(text) {
    if (!text) return text;
    
    const win1251 = require('./win1251'); // Попробуем использовать существующий модуль
    
    try {
        // Если есть модуль win1251, используем его
        if (win1251 && win1251.decode) {
            return win1251.decode(text);
        }
    } catch (e) {
        // Если модуля нет, используем простую замену
    }
    
    // Простая замена часто встречающихся символов
    const replacements = {
        'РЅ': 'н', 'Р°': 'а', 'РІ': 'в', 'Рµ': 'е', 'Рё': 'и', 'Рє': 'к', 'Р»': 'л', 'Рѕ': 'о',
        'Рї': 'п', 'СЂ': 'р', 'СЃ': 'с', 'С‚': 'т', 'Сѓ': 'у', 'СЏ': 'я', 'Р±': 'б', 'Рі': 'г',
        'Рґ': 'д', 'Р¶': 'ж', 'Р·': 'з', 'Р№': 'й', 'Рј': 'м', 'РЅ': 'н', 'Рї': 'п', 'СЂ': 'р',
        'СЃ': 'с', 'С‚': 'т', 'С„': 'ф', 'С…': 'х', 'С†': 'ц', 'С‡': 'ч', 'С€': 'ш', 'С‰': 'щ',
        'СЉ': 'ъ', 'С‹': 'ы', 'СЊ': 'ь', 'Рў': 'Т', 'Р ':' ', 'Р,': ',', 'Р.': '.', 'Р(': '(',
        'Р)': ')', 'Р-': '-', 'РїСЂ': 'пр', 'РѕР±': 'об', 'РєРІ': 'кв', 'СѓР»': 'ул'
    };
    
    let result = text;
    for (const [from, to] of Object.entries(replacements)) {
        result = result.split(from).join(to);
    }
    
    return result;
}

db.all("SELECT * FROM properties LIMIT 10", (err, rows) => { // Сначала только 10 для теста
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Sample properties (first 10):");
        
        const fixedRows = rows.map(property => ({
            unid: property.unid,
            title: fixWin1251ToUtf8(property.title),
            price: property.price,
            currency: property.currency || 'USD',
            type: fixWin1251ToUtf8(property.type),
            rooms: property.rooms,
            area: property.area,
            location: fixWin1251ToUtf8(property.location),
            description: fixWin1251ToUtf8(property.description),
            photos: property.photos
        }));
        
        // Покажем примеры до/после
        fixedRows.slice(0, 3).forEach((prop, i) => {
            console.log(`\n--- Property ${i+1} ---`);
            console.log('Title:', prop.title);
            console.log('Type:', prop.type);
            console.log('Location:', prop.location);
        });
        
        // Сохраняем исправленные данные
        fs.writeFileSync('/home/fattoriaby/public_html/api/properties-fixed.json', JSON.stringify(fixedRows, null, 2));
        console.log('\nSaved fixed sample to properties-fixed.json');
    }
    db.close();
});
