// ====== BUSINESS PORTAL CORE FUNCTIONALITY ======

// Configuration loader
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        return await response.json();
    } catch (error) {
        console.error('Failed to load config:', error);
        return {
            site: { name: 'Business Portal', tagline: 'Business Strategy & Revenue Mastery' }
        };
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', async function() {
    const config = await loadConfig();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize forms
    initForms();
    
    // Initialize service selection
    initServiceSelection();
    
    // Update dynamic content
    updateDynamicContent(config);
    
    // Initialize booking system if on booking page
    if (document.getElementById('booking-widget')) {
        initBookingSystem();
    }
});

// Mobile menu functionality
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (menuToggle && nav) {
        // Create mobile menu structure
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.innerHTML = `
            <button class="close-menu">✕</button>
            <div class="mobile-nav"></div>
        `;
        
        // Clone desktop navigation
        const navClone = nav.cloneNode(true);
        mobileMenu.querySelector('.mobile-nav').appendChild(navClone);
        
        // Add to page
        document.body.appendChild(mobileMenu);
        
        // Toggle menu
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        mobileMenu.querySelector('.close-menu').addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close menu on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Add mobile menu styles
        const style = document.createElement('style');
        style.textContent = `
            .menu-toggle {
                display: none;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--color-primary);
            }
            
            .mobile-menu {
                position: fixed;
                top: 0;
                right: -100%;
                width: 80%;
                max-width: 400px;
                height: 100vh;
                background: white;
                box-shadow: -10px 0 30px rgba(0,0,0,0.1);
                transition: right 0.3s ease;
                z-index: 2000;
                padding: 2rem;
            }
            
            .mobile-menu.active {
                right: 0;
            }
            
            .close-menu {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--color-primary);
            }
            
            .mobile-nav {
                margin-top: 3rem;
            }
            
            .mobile-nav a {
                display: block;
                padding: 1rem 0;
                border-bottom: 1px solid #eee;
                color: var(--color-primary);
                text-decoration: none;
                font-size: 1.1rem;
            }
            
            .mobile-nav a:hover {
                color: var(--color-secondary);
            }
            
            @media (max-width: 768px) {
                .menu-toggle {
                    display: block;
                }
                
                .main-nav {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Form handling
function initForms() {
    const forms = document.querySelectorAll('form[data-form-type]');
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formType = this.dataset.formType;
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(this);
                
                // Add form type
                formData.append('form_type', formType);
                formData.append('source', 'business_portal');
                formData.append('timestamp', new Date().toISOString());
                
                // Get endpoint from config or use default
                const config = await loadConfig();
                let endpoint;
                
                switch(formType) {
                    case 'consultation':
                        endpoint = config.integrations?.forms?.consultation || 
                                  'https://formspree.io/f/YOUR_BUSINESS_CONSULTATION_FORM';
                        break;
                    case 'contact':
                        endpoint = config.integrations?.forms?.contact || 
                                  'https://formspree.io/f/YOUR_BUSINESS_CONTACT_FORM';
                        break;
                    default:
                        endpoint = 'https://formspree.io/f/YOUR_BUSINESS_CONTACT_FORM';
                }
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Show success message
                    showNotification('Success! We\'ll contact you within 24 hours.', 'success');
                    form.reset();
                } else {
                    throw new Error('Form submission failed');
                }
                
            } catch (error) {
                console.error('Form error:', error);
                showNotification('Submission failed. Please try again or email directly.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    });
}

// Service selection for booking
function initServiceSelection() {
    const serviceCards = document.querySelectorAll('.service-card-select');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            serviceCards.forEach(c => c.classList.remove('selected'));
            
            // Add to clicked card
            this.classList.add('selected');
            
            const service = this.dataset.service;
            selectService(service);
        });
    });
}

function selectService(serviceKey) {
    const config = window.siteConfig || {};
    const service = config.services?.consultation?.[serviceKey];
    
    if (!service) return;
    
    // Update service info display
    const serviceInfo = document.getElementById('selected-service-info');
    if (serviceInfo) {
        serviceInfo.innerHTML = `
            <h4>${service.name}</h4>
            <p>Duration: ${service.duration} minutes</p>
            <p class="price">${service.price === 0 ? 'FREE' : '$${service.price}'}</p>
            <p>${service.description || ''}</p>
        `;
    }
    
    // Load Calendly widget if available
    loadCalendlyWidget(serviceKey);
}

function loadCalendlyWidget(serviceKey) {
    const calendlyContainer = document.getElementById('calendly-embed');
    if (!calendlyContainer || typeof Calendly === 'undefined') return;
    
    const config = window.siteConfig || {};
    const calendlyUser = config.integrations?.booking?.calendly || 'gregoryswarn-business';
    
    Calendly.initInlineWidget({
        url: `https://calendly.com/${calendlyUser}/${serviceKey}`,
        parentElement: calendlyContainer,
        prefill: {
            name: '',
            email: '',
            customAnswers: {
                a1: `Business Portal - ${serviceKey}`
            }
        }
    });
}

// Initialize booking system
function initBookingSystem() {
    // Load Calendly script
    const calendlyScript = document.createElement('script');
    calendlyScript.src = 'https://assets.calendly.com/assets/external/widget.js';
    calendlyScript.async = true;
    document.head.appendChild(calendlyScript);
    
    // Load services from config
    loadConfig().then(config => {
        window.siteConfig = config;
        
        // Render service selector
        const selector = document.querySelector('.service-selector');
        if (selector && config.services?.consultation) {
            selector.innerHTML = Object.entries(config.services.consultation)
                .map(([key, service]) => `
                    <div class="service-card-select" data-service="${key}">
                        <h4>${service.name}</h4>
                        <p>${service.duration} minutes</p>
                        <p class="price">${service.price === 0 ? 'FREE' : '$${service.price}'}</p>
                        <button class="btn btn-secondary btn-sm">Select</button>
                    </div>
                `).join('');
            
            // Re-initialize selection
            initServiceSelection();
        }
    });
}

// Update dynamic content from config
function updateDynamicContent(config) {
    // Update page title
    if (config.site?.name) {
        document.title = config.site.name + ' | ' + (config.site.tagline || '');
    }
    
    // Update hero content
    const heroTitle = document.querySelector('.hero-content h1');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (heroTitle && config.site?.tagline) {
        heroTitle.textContent = config.site.tagline;
    }
    
    if (heroSubtitle && config.site?.description) {
        heroSubtitle.textContent = config.site.description;
    }
    
    // Update contact info
    const contactLinks = document.querySelectorAll('[data-contact-email]');
    contactLinks.forEach(link => {
        if (config.site?.contactEmail) {
            if (link.tagName === 'A') {
                link.href = `mailto:${config.site.contactEmail}`;
            }
            link.textContent = config.site.contactEmail;
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">✕</button>
        </div>
    `;
    
    // Add styles
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            
            .notification-content {
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 1rem;
                border-left: 4px solid var(--color-secondary);
            }
            
            .notification-success .notification-content {
                border-left-color: var(--color-success);
            }
            
            .notification-error .notification-content {
                border-left-color: #ff4757;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.2rem;
                color: #666;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const headerHeight = document.querySelector('.business-header')?.offsetHeight || 80;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}
