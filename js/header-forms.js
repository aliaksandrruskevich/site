// Обработчик форм для header/footer
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Обработчик форм header/footer загружен');
    
    // Обрабатываем ВСЕ формы на странице
    const forms = document.querySelectorAll('form');
    console.log('🎯 Найдено форм:', forms.length);
    
    forms.forEach((form, index) => {
        console.log(`📝 Форма ${index + 1}:`, form);
        
        // Отключаем стандартную отправку
        form.setAttribute('novalidate', 'true');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log(`📧 Отправка формы ${index + 1}`);
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Добавляем информацию о странице
            data.source = window.location.pathname;
            data.timestamp = new Date().toISOString();
            
            console.log('📤 Данные формы:', data);
            
            // Показываем загрузку
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Отправка...';
                submitBtn.disabled = true;
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 3000);
            }
            
            // Отправляем на сервер
            fetch('/api/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network error');
                }
                return response.json();
            })
            .then(result => {
                console.log('✅ Форма отправлена:', result);
                alert('Спасибо! Мы свяжемся с вами в ближайшее время.');
                form.reset();
            })
            .catch(error => {
                console.error('❌ Ошибка отправки:', error);
                alert('Ошибка отправки. Пожалуйста, попробуйте еще раз или позвоните нам.');
            });
        });
    });
});
