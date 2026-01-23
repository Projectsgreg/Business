// ====== UNIVERSAL FUNCTIONALITY ======

// Mobile Menu
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.coaching-header nav');
    const overlay = document.createElement('div');
    
    if (!menuToggle || !nav) return;
    
    // Create overlay
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);
    
    // Style overlay
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 998;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Add toggle functionality
    menuToggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);
    
    // Close menu when clicking links
    document.querySelectorAll('.coaching-header nav a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    function toggleMenu() {
        const isActive = nav.classList.toggle('active');
        menuToggle.textContent = isActive ? '✕' : '☰';
        overlay.style.display = isActive ? 'block' : 'none';
        setTimeout(() => {
            overlay.style.opacity = isActive ? '1' : '0';
        }, 10);
        document.body.style.overflow = isActive ? 'hidden' : '';
    }
    
    function closeMenu() {
        nav.classList.remove('active');
        menuToggle.textContent = '☰';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.coaching-header')?.offsetHeight || 80;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Image Loading with Fallback
function initImageLoading() {
    // Load images with error handling
    document.querySelectorAll('img[data-src]').forEach(img => {
        const src = img.getAttribute('data-src');
        const fallback = img.getAttribute('data-fallback') || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop';
        
        const image = new Image();
        image.src = src;
        
        image.onload = () => {
            img.src = src;
            img.classList.add('loaded');
        };
        
        image.onerror = () => {
            img.src = fallback;
            console.warn(`Failed to load image: ${src}, using fallback`);
        };
    });
    
    // Randomize Greg images if multiple exist
    const gregImages = document.querySelectorAll('img[data-greg-image]');
    if (gregImages.length > 0) {
        // Try to load local images first
        gregImages.forEach(img => {
            const imageNum = Math.floor(Math.random() * 20) + 1;
            const localSrc = `media/greg/greg-${imageNum}.jpg`;
            const fallbackSrc = 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&auto=format&fit=crop&q=80';
            
            // Check if local image exists
            fetch(localSrc, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        img.src = localSrc;
                    } else {
                        img.src = fallbackSrc;
                    }
                })
                .catch(() => {
                    img.src = fallbackSrc;
                });
        });
    }
}

// Contact Form Handler
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Show loading
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        // Collect form data
        const formData = new FormData(this);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            service: formData.get('service'),
            message: formData.get('message'),
            _subject: 'New Coaching Inquiry',
            _replyto: formData.get('email')
        };
        
        try {
            // Send to Formspree
            const response = await fetch('https://formspree.io/f/xbdgodgn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                alert('Thank you! We\'ll contact you within 24 hours.');
                form.reset();
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Form error:', error);
            alert('There was an error. Please email us directly at contact@gregoryswarnenterprises.com');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Social Media Links
const socialLinks = {
    youtube: 'https://youtube.com/@greg-w8l',
    instagram: 'https://instagram.com/gregoryswarn',
    tiktok: 'https://tiktok.com/@gregoryswarn',
    twitter: 'https://twitter.com/gregoryswarn',
    linkedin: 'https://linkedin.com/in/gregoryswarn'
};

function initSocialLinks() {
    // Add social links to footer
    const footerSocial = document.querySelector('.footer-social');
    if (footerSocial) {
        let html = '';
        for (const [platform, url] of Object.entries(socialLinks)) {
            if (url.includes('gregoryswarn') || platform === 'youtube') {
                html += `
                    <a href="${url}" target="_blank" class="social-icon" aria-label="${platform}">
                        ${getSocialIcon(platform)}
                    </a>
                `;
            }
        }
        footerSocial.innerHTML = html;
    }
}

function getSocialIcon(platform) {
    const icons = {
        youtube: '▶️',
        instagram: '📸',
        tiktok: '🎵',
        twitter: '🐦',
        linkedin: '💼'
    };
    return icons[platform] || '🔗';
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initSmoothScrolling();
    initImageLoading();
    initContactForm();
    initSocialLinks();
    
    // Update copyright year
    document.querySelectorAll('[data-current-year]').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
    
    // Add current year to footer
    const yearSpans = document.querySelectorAll('.current-year');
    yearSpans.forEach(span => {
        span.textContent = new Date().getFullYear();
    });
});

// Export for use in HTML
window.coachingFunctions = {
    initMobileMenu,
    initSmoothScrolling,
    initContactForm,
    socialLinks
};
