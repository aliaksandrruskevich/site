// Дебаг форм - ищем ВСЕ возможные формы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🐛 ДЕБАГ: Поиск форм начат');
    
    // Ждем немного чтобы динамический контент загрузился
    setTimeout(() => {
        // Ищем формы разными способами
        const selectors = [
            'form',
            '[id*="form"]',
            '[class*="form"]', 
            'form[action]',
            'form[method]',
            '.header form',
            '.footer form',
            'nav form',
            'header form'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            console.log(`🔍 Селектор "${selector}": ${elements.length} элементов`);
            elements.forEach((el, i) => {
                console.log(`   ${i + 1}.`, el);
                console.log(`      HTML:`, el.outerHTML.substring(0, 200));
            });
        });
        
        // Проверим весь DOM на наличие форм
        const allForms = document.querySelectorAll('form');
        console.log(`🎯 ВСЕГО форм на странице: ${allForms.length}`);
        
        if (allForms.length === 0) {
            console.log('❌ ФОРМ НЕ НАЙДЕНО! Проверяем структуру страницы...');
            // Посмотрим на структуру header и footer
            const header = document.querySelector('header');
            const footer = document.querySelector('footer');
            console.log('Header:', header ? header.outerHTML.substring(0, 500) : 'Не найден');
            console.log('Footer:', footer ? footer.outerHTML.substring(0, 500) : 'Не найден');
        }
    }, 1000);
});
