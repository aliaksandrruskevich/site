console.log("✅ forms-handler.js loaded");
// Универсальный обработчик форм для всего сайта
document.addEventListener('DOMContentLoaded', function() {

    console.log("✅ Forms handler initialized");
    console.log("Found forms:", forms.length);
    // Обработчик для всех форм с классом .contact-form или id contactForm
    const forms = document.querySelectorAll('form[class*="contact"], form[id*="contact"], form[class*="form"], form[class*="lead"]');
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : 'Отправить';
            
            // Показываем загрузку
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            }
            
            try {
                // Собираем данные формы
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                // Добавляем информацию о странице
                data.source = window.location.pathname;
                data.pageTitle = document.title;
                
                // Добавляем информацию об объекте недвижимости если есть
                const propertyUnid = getPropertyUnidFromPage();
                if (propertyUnid) {
                    data.propertyUnid = propertyUnid;
                    data.propertyTitle = document.querySelector('h1') ? document.querySelector('h1').textContent : document.title;
                }
                
                console.log('📝 Отправляем данные формы:', data);
                
                // Отправляем на сервер
                const response = await fetch('/api/submit-form.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showFormMessage(form, 'success', result.message || 'Форма успешно отправлена!');
                    form.reset(); // Очищаем форму
                } else {
                    showFormMessage(form, 'error', result.message || 'Ошибка при отправке формы');
                }
                
            } catch (error) {
                console.error('❌ Ошибка отправки формы:', error);
                showFormMessage(form, 'error', 'Ошибка сети. Попробуйте еще раз.');
            } finally {
                // Восстанавливаем кнопку
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    });
});

// Функция для получения UNID объекта со страницы
function getPropertyUnidFromPage() {
    // Пытаемся получить из URL (для страниц объектов)
    const pathMatch = window.location.pathname.match(/\/object\/(.+)$/);
    if (pathMatch) {
        return pathMatch[1];
    }
    
    // Пытаемся получить из URL (для страниц ЖК)
    const jkMatch = window.location.pathname.match(/\/jk\/(.+)$/);
    if (jkMatch) {
        return 'jk-' + jkMatch[1];
    }
    
    // Пытаемся получить из данных на странице
    const propertyElement = document.querySelector('[data-property-unid], [data-unid]');
    if (propertyElement) {
        return propertyElement.dataset.propertyUnid || propertyElement.dataset.unid;
    }
    
    return null;
}

// Функция показа сообщения
function showFormMessage(form, type, message) {
    // Удаляем старые сообщения
    const oldMessage = form.querySelector('.form-message');
    if (oldMessage) {
        oldMessage.remove();
    }
    
    // Создаем новое сообщение
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message alert alert-${type === 'success' ? 'success' : 'danger'} mt-3`;
    messageDiv.innerHTML = message;
    
    // Вставляем после формы или в конец формы
    form.parentNode.insertBefore(messageDiv, form.nextSibling);
    
    // Авто-удаление через 5 секунд
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Функция для ручной отправки формы (если нужно вызвать из другого скрипта)
window.submitContactForm = function(formElement, additionalData = {}) {
    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData);
    
    // Добавляем дополнительные данные
    Object.assign(data, additionalData);
    
    // Вызываем обработчик
    const event = new Event('submit', { cancelable: true });
    formElement.dispatchEvent(event);
};

// Debug function to log form data
console.log('🔧 DEBUG: forms-handler.js loaded');

// Override form submission for debugging
document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.matches('form')) {
        console.log('🔄 Form intercepted:', form.id);
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        console.log('📋 Form data:', data);
    }
});
