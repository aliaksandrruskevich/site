// Combined JavaScript for main functionality

// Common utilities
function showToast(message, type = 'info') {
  // Создаем контейнер если не существует
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${getBootstrapColor(type)} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toast);

  // Проверяем доступность Bootstrap
  if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  } else {
    // Fallback - простой показ
    toast.style.display = 'block';
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

function getBootstrapColor(type) {
  const colors = {
    'success': 'success',
    'error': 'danger',
    'info': 'info',
    'warning': 'warning'
  };
  return colors[type] || 'info';
}

// Global function for other scripts
window.showToastGlobal = showToast;

// Header loader
document.addEventListener('DOMContentLoaded', function() {
  loadHeader();
  loadFooter();
});

function loadHeader() {
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (!headerPlaceholder) return;

  // Используйте относительные пути с точкой для текущей директории
  fetch('./includes/header.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      headerPlaceholder.innerHTML = html;
      initializeHeader();
    })
    .catch(error => {
      console.error('Error loading header:', error);
      // Fallback - создаем базовый header
      headerPlaceholder.innerHTML = createFallbackHeader();
    });
}

function loadFooter() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (!footerPlaceholder) return;

  fetch('./includes/footer.html')
    .then(response => response.text())
    .then(html => {
      footerPlaceholder.innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading footer:', error);
    });
}

function createFallbackHeader() {
  return `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container">
        <a class="navbar-brand" href="/">Fattoria.by</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item"><a class="nav-link" href="/">Главная</a></li>
            <li class="nav-item"><a class="nav-link" href="/properties.html">Наши объекты</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `;
}

function initializeHeader() {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      this.classList.toggle('active');
    });
  }

  // Dropdown menus
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');

    if (toggle) {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.toggle('active');
      });
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    }
  });

  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Form handling
function initializeForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = new FormData(this);
      const data = Object.fromEntries(formData);

      // Basic validation
      let isValid = true;
      const requiredFields = this.querySelectorAll('[required]');

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('is-invalid');
          isValid = false;
        } else {
          field.classList.remove('is-invalid');
        }
      });

      if (!isValid) {
        showToast('Пожалуйста, заполните все обязательные поля', 'error');
        return;
      }

      // Submit form
      submitForm(this, data);
    });
  });
}

function submitForm(form, data) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : '';

  // Disable button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
  }

  fetch('/api/submit-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      showToast('Спасибо! Мы свяжемся с вами в ближайшее время.', 'success');
      form.reset();
    } else {
      showToast('Ошибка отправки формы. Попробуйте позже.', 'error');
    }
  })
  .catch(error => {
    console.error('Ошибка:', error);
    showToast('Ошибка отправки формы. Попробуйте позже.', 'error');
  })
  .finally(() => {
    // Re-enable button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Modal handling
function initializeModals() {
  // Добавьте в начало
  if (typeof bootstrap === 'undefined') {
    console.error('Bootstrap не загружен');
    return;
  }

  const modals = document.querySelectorAll('.modal');

  modals.forEach(modal => {
    modal.addEventListener('show.bs.modal', function() {
      document.body.classList.add('modal-open');
    });

    modal.addEventListener('hidden.bs.modal', function() {
      document.body.classList.remove('modal-open');
    });
  });
}

// Slider functionality
function initializeSliders() {
  const sliders = document.querySelectorAll('.properties-slider-container');

  sliders.forEach(slider => {
    const container = slider.querySelector('.properties-container');
    const prevBtn = slider.querySelector('.slider-prev');
    const nextBtn = slider.querySelector('.slider-next');

    if (!container || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const items = container.children;
    const itemWidth = items[0] ? items[0].offsetWidth + 24 : 350; // 24px gap
    const visibleItems = Math.floor(container.parentElement.offsetWidth / itemWidth) || 1;

    function updateSlider() {
      const translateX = -currentIndex * itemWidth;
      container.style.transform = `translateX(${translateX}px)`;

      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex >= items.length - visibleItems;
    }

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateSlider();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < items.length - visibleItems) {
        currentIndex++;
        updateSlider();
      }
    });

    // Update on window resize
    window.addEventListener('resize', updateSlider);
  });
}

// Image lazy loading
function initializeLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  try {
    initializeForms();
    initializeModals();
    initializeSliders();
    initializeLazyLoading();

    // Проверяем загрузку основных компонентов
    if (typeof bootstrap === 'undefined') {
      console.warn('Bootstrap не загружен, некоторые функции могут не работать');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Export functions for global use
window.MainUtils = {
  showToast,
  debounce,
  throttle
};

// ===== ГАРАНТИРОВАННЫЙ ОБРАБОТЧИК ФОРМ =====
setTimeout(function() {
    console.log('🚨 ГАРАНТИРОВАННЫЙ обработчик форм запущен!');
    
    // Ждем еще секунду чтобы все точно загрузилось
    setTimeout(function() {
        console.log('🔍 Ищем формы гарантированно...');
        
        // Ищем ВСЕ формы на странице
        var allForms = document.querySelectorAll('form');
        console.log('📝 ГАРАНТИРОВАННО найдено форм:', allForms.length);
        
        // Обрабатываем каждую форму
        allForms.forEach(function(form, index) {
            console.log('🎯 Обрабатываем форму ' + (index + 1) + ':', form);
            
            // Вешаем обработчик
            form.onsubmit = function(e) {
                e.preventDefault();
                console.log('📧 ОТПРАВКА ГАРАНТИРОВАННАЯ!');
                
                // Собираем данные
                var data = {};
                for (var i = 0; i < this.elements.length; i++) {
                    var element = this.elements[i];
                    if (element.name) {
                        data[element.name] = element.value;
                    }
                }
                data.source = window.location.href;
                
                console.log('📤 Данные гарантированные:', data);
                
                // Отправляем
                fetch('/api/submit-form', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                })
                .then(function(r) { return r.json(); })
                .then(function(result) {
                    console.log('✅ ГАРАНТИРОВАННЫЙ успех:', result);
                    alert('Спасибо! Форма отправлена!');
                    form.reset();
                })
                .catch(function(err) {
                    console.error('❌ ГАРАНТИРОВАННАЯ ошибка:', err);
                    alert('Ошибка! Попробуйте еще раз.');
                });
                
                return false;
            };
        });
    }, 1000);
}, 1000);
