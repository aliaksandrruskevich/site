const https = require('https');
const { URLSearchParams } = require('url');

/**
 * Отправка формы в Google Sheets + Gmail
 */
async function handleFormSubmission(type, formData) {
    const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxWu2KdWiLNapj5ywD2lSqkQLFF17so5jEyjLYXrrcnY-SUjjVPHsZuwohhRyfXjSd5/exec';

    return new Promise((resolve) => {
        console.log('📤 Отправляем данные в Google Sheets:', formData);

        // Подготавливаем данные для Google Apps Script
        const formDataObj = {
            name: formData.name || '',
            phone: formData.phone || formData.contact || '',
            email: formData.email || '',
            message: formData.message || formData.request || '',
            source: formData.source || 'Обратная связь',
            timestamp: new Date().toISOString()
        };

        // Добавляем информацию об объекте недвижимости если есть
        if (formData.propertyUnid) {
            formDataObj.propertyUnid = formData.propertyUnid;
        }
        if (formData.propertyTitle) {
            formDataObj.propertyTitle = formData.propertyTitle;
        }
        if (formData.project) {
            formDataObj.project = formData.project;
        }

        const params = new URLSearchParams();
        Object.keys(formDataObj).forEach(key => {
            params.append(key, formDataObj[key]);
        });

        const postData = params.toString();

        const url = new URL(googleScriptUrl);

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📨 Ответ от Google Apps Script:', {
                    statusCode: res.statusCode,
                    data: data
                });

                try {
                    const response = JSON.parse(data);

                    if (response.success) {
                        console.log('✅ Данные успешно сохранены в Google Sheets и отправлены на почту');
                        resolve({
                            success: true,
                            message: 'Заявка успешно отправлена!'
                        });
                    } else {
                        console.log('❌ Ошибка Google Apps Script:', response.error);
                        resolve({
                            success: false,
                            error: response.error || 'Неизвестная ошибка',
                            message: 'Ошибка при отправке формы'
                        });
                    }
                } catch (parseError) {
                    console.log('❌ Ошибка парсинга ответа Google Apps Script:', parseError);
                    // Если ответ не JSON, считаем что все ок (Google Apps Script может возвращать текст)
                    if (res.statusCode === 200) {
                        console.log('✅ Форма отправлена (ответ не JSON, но статус 200)');
                        resolve({
                            success: true,
                            message: 'Заявка успешно отправлена!'
                        });
                    } else {
                        resolve({
                            success: false,
                            error: parseError.message,
                            message: 'Ошибка при обработке ответа'
                        });
                    }
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Ошибка подключения к Google Apps Script:', error);
            resolve({
                success: false,
                error: error.message,
                message: 'Ошибка подключения к сервису'
            });
        });

        req.write(postData);
        req.end();
    });
}

module.exports = { handleFormSubmission };
