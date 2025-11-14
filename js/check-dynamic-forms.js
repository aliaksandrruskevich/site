// Проверка динамических форм
console.log('🔄 Проверка динамического контента...');

function checkForms() {
    console.log('🔍 Проверяем формы...');
    
    // Проверяем каждые 500ms в течение 5 секунд
    let attempts = 0;
    const maxAttempts = 10;
    
    const interval = setInterval(() => {
        attempts++;
        const forms = document.querySelectorAll('form');
        console.log(`Попытка ${attempts}: Найдено форм: ${forms.length}`);
        
        forms.forEach((form, index) => {
            console.log(`Форма ${index + 1}:`, form.outerHTML.substring(0, 300));
            console.log(`Родитель:`, form.parentElement ? form.parentElement.tagName : 'нет родителя');
        });
        
        if (forms.length > 0 || attempts >= maxAttempts) {
            clearInterval(interval);
            if (forms.length === 0) {
                console.log('❌ Формы так и не найдены. Проверяем структуру DOM...');
                // Выводим всю структуру header/footer
                const header = document.querySelector('header');
                const footer = document.querySelector('footer');
                console.log('HEADER:', header ? header.innerHTML.substring(0, 1000) : 'Нет header');
                console.log('FOOTER:', footer ? footer.innerHTML.substring(0, 1000) : 'Нет footer');
            }
        }
    }, 500);
}

// Запускаем проверку после загрузки и через некоторое время
document.addEventListener('DOMContentLoaded', checkForms);
setTimeout(checkForms, 2000);
setTimeout(checkForms, 5000);
