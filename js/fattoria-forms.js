// Обработчик форм для Fattoria.by
console.log('🎯 Обработчик форм Fattoria загружен!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Поиск форм...');
    
    function handleFormSubmit(e) {
        e.preventDefault();
        console.log('📧 ОТПРАВКА ФОРМЫ!');
        
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        data.source = window.location.pathname;
        
        console.log('📤 Данные:', data);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;
            
            fetch('/api/submit-form', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                console.log('✅ Успех:', result);
                alert('Спасибо! Мы свяжемся с вами.');
                form.reset();
                const modal = form.closest('.modal');
                if (modal) {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) bsModal.hide();
                }
            })
            .catch(error => {
                console.error('❌ Ошибка:', error);
                alert('Ошибка отправки. Попробуйте еще раз.');
            })
            .finally(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        }
    }
    
    // Обрабатываем все формы
    const forms = document.querySelectorAll('form');
    console.log('📝 Найдено форм:', forms.length);
    
    forms.forEach((form, index) => {
        console.log(`   Форма ${index + 1}:`, form.id || 'без ID');
        form.setAttribute('novalidate', 'true');
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // Если форм нет, проверяем через 2 секунды (для динамических)
    if (forms.length === 0) {
        setTimeout(() => {
            const formsLater = document.querySelectorAll('form');
            console.log('🕒 Формы через 2 секунды:', formsLater.length);
            formsLater.forEach(form => {
                form.setAttribute('novalidate', 'true');
                form.addEventListener('submit', handleFormSubmit);
            });
        }, 2000);
    }
});
