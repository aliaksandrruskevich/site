const db = require('./db');

async function exportProperties() {
  try {
    const properties = await db.getAllProperties();
    console.log('Found properties:', properties.length);
    
    const fs = require('fs');
    fs.writeFileSync('/home/fattoriaby/public_html/api/properties-full.json', JSON.stringify(properties, null, 2));
    console.log('Exported to properties-full.json');
    
    // Создаем property-*.json файлы
    properties.forEach(property => {
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
    console.log('Created individual property files');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

exportProperties();
