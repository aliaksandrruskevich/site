const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("/home/fattoriaby/public_html/properties.db");
const fs = require('fs');

function fixEncoding(text) {
    if (!text) return text;
    
    const replacements = {
        'РЅ': 'н', 'Р°': 'а', 'РІ': 'в', 'Рµ': 'е', 'Рё': 'и', 'Рє': 'к', 'Р»': 'л', 'Рѕ': 'о',
        'Рї': 'п', 'СЂ': 'р', 'СЃ': 'с', 'С‚': 'т', 'Сѓ': 'у', 'СЏ': 'я', 'Р±': 'б', 'Рі': 'г',
        'Рґ': 'д', 'Р¶': 'ж', 'Р·': 'з', 'Р№': 'й', 'Рј': 'м', 'РЅ': 'н', 'Рї': 'п', 'СЂ': 'р',
        'СЃ': 'с', 'С‚': 'т', 'С„': 'ф', 'С…': 'х', 'С†': 'ц', 'С‡': 'ч', 'С€': 'ш', 'С‰': 'щ',
        'СЉ': 'ъ', 'С‹': 'ы', 'СЊ': 'ь', 'Рў': 'Т', 'Р ': ' ', 'Р,': ',', 'Р.': '.', 'Р(': '(',
        'Р)': ')', 'Р-': '-', 'РїСЂ': 'пр', 'РѕР±': 'об', 'РєРІ': 'кв', 'СѓР»': 'ул', 'РґРѕРј': 'дом',
        'РєРѕРјРЅ': 'комн', 'РєРІР°СЂС‚': 'кварт', 'РЅРµРґРІ': 'недви', 'РёРјРѕСЃ': 'имос', 'С‚СЊ': 'ть'
    };
    
    let result = text;
    for (const [from, to] of Object.entries(replacements)) {
        result = result.split(from).join(to);
    }
    
    return result;
}

db.all("SELECT * FROM properties LIMIT 5", (err, rows) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Testing encoding fix on 5 properties:\n");
        
        rows.forEach((property, i) => {
            console.log(`--- Property ${i+1} ---`);
            console.log('Original title:', property.title);
            console.log('Fixed title:', fixEncoding(property.title));
            console.log('Original type:', property.type);
            console.log('Fixed type:', fixEncoding(property.type));
            console.log('---\n');
        });
        
        db.all("SELECT * FROM properties", (err, allRows) => {
            if (err) {
                console.error("Error:", err);
            } else {
                console.log(`Applying fix to all ${allRows.length} properties...`);
                
                const fixedRows = allRows.map(property => ({
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
                
                fs.writeFileSync('/home/fattoriaby/public_html/api/properties.json', JSON.stringify(fixedRows, null, 2));
                console.log('Saved fixed properties.json');
                
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
    }
});
