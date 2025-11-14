// Обработчик форм в модальных окнах
console.log('🎯 Обработчик модальных форм загружен');

// Функция обработки отправки формы
function handleFormSubmit(e) {
    e.preventDefault();
    console.log('📧 Отправка формы');
    
    const form = e.target;
    const formData = new FormData(form);
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
            
            // Закрываем модальное окно после успешной отправки
            const modal = form.closest('.modal');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        })
        .catch(error => {
            console.error('❌ Ошибка отправки:', error);
            alert('Ошибка отправки. Пожалуйста, попробуйте еще раз или позвоните нам.');
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Обрабатываем все формы на странице
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Поиск форм на странице...');
    
    // Обрабатываем существующие формы
    const forms = document.querySelectorAll('form');
    console.log('📝 Найдено форм:', forms.length);
    
    forms.forEach((form, index) => {
        console.log(`   Форма ${index + 1}:`, form.id || 'без ID');
        form.setAttribute('novalidate', 'true');
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // Также обрабатываем динамические формы в модальных окнах
    const modalIds = ['testDriveModal', 'trustModal'];
    
    modalIds.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('shown.bs.modal', function() {
                console.log(`📱 Модальное окно ${modalId} открыто`);
                const form = modal.querySelector('form');
                if (form && !form.hasAttribute('data-handled')) {
                    console.log('   Обрабатываем форму в модальном окне');
                    form.setAttribute('data-handled', 'true');
                    form.setAttribute('novalidate', 'true');
                    form.addEventListener('submit', handleFormSubmit);
                }
            });
        }
    });
});
