// ============================================
// Main JavaScript - Образовательная платформа
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // Burger Menu Toggle
    // ==========================================
    const burgerBtn = document.getElementById('burgerBtn');
    const navMenu = document.getElementById('navMenu');

    if (burgerBtn) {
        burgerBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu on link click
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                burgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ==========================================
    // Header Scroll Effect
    // ==========================================
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        // Add shadow on scroll
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Parallax effect on background
        const parallaxBg = document.querySelector('.parallax-bg');
        if (parallaxBg) {
            const yOffset = currentScroll * 0.3;
            parallaxBg.style.transform = `translateY(${yOffset * 0.5}px)`;
        }

        lastScroll = currentScroll;
    });

    // ==========================================
    // Auth Tabs
    // ==========================================
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');

    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.dataset.tab;

            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(target + 'Form').classList.add('active');
        });
    });

    // ==========================================
    // Cabinet Tabs
    // ==========================================
    const cabinetTabs = document.querySelectorAll('.cabinet-tab');
    const cabinetPanels = document.querySelectorAll('.cabinet-panel');

    cabinetTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.dataset.tab;

            cabinetTabs.forEach(t => t.classList.remove('active'));
            cabinetPanels.forEach(p => p.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(target).classList.add('active');

            // Scroll to top of panel
            const panel = document.getElementById(target);
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ==========================================
    // Teacher Tabs
    // ==========================================
    const teacherTabs = document.querySelectorAll('.teacher-tab');
    const teacherPanels = document.querySelectorAll('.teacher-panel');

    teacherTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.dataset.tab;

            teacherTabs.forEach(t => t.classList.remove('active'));
            teacherPanels.forEach(p => p.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(target).classList.add('active');

            // Scroll to top of panel
            const panel = document.getElementById(target);
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ==========================================
    // Show/Hide Create Article Form
    // ==========================================
    const showCreateBtn = document.getElementById('showCreateArticle');
    const createForm = document.getElementById('createArticleForm');

    if (showCreateBtn && createForm) {
        showCreateBtn.addEventListener('click', function() {
            const isHidden = createForm.style.display === 'none' || createForm.style.display === '';
            createForm.style.display = isHidden ? 'block' : 'none';
            this.innerHTML = isHidden ?
                '<i class="fas fa-times"></i> Закрыть' :
                '<i class="fas fa-plus"></i> Новая статья';
        });
    }

    // ==========================================
    // Show/Hide Create Homework Form
    // ==========================================
    const showHomeworkBtn = document.getElementById('showCreateHomework');
    const homeworkForm = document.getElementById('createHomeworkForm');

    if (showHomeworkBtn && homeworkForm) {
        showHomeworkBtn.addEventListener('click', function() {
            const isHidden = homeworkForm.style.display === 'none' || homeworkForm.style.display === '';
            homeworkForm.style.display = isHidden ? 'block' : 'none';
            this.innerHTML = isHidden ?
                '<i class="fas fa-times"></i> Закрыть' :
                '<i class="fas fa-plus"></i> Новое задание';
        });
    }

    // ==========================================
    // Show/Hide Add Video Form
    // ==========================================
    const showVideoBtn = document.getElementById('showAddVideo');
    const videoForm = document.getElementById('addVideoForm');

    if (showVideoBtn && videoForm) {
        showVideoBtn.addEventListener('click', function() {
            const isHidden = videoForm.style.display === 'none' || videoForm.style.display === '';
            videoForm.style.display = isHidden ? 'block' : 'none';
            this.innerHTML = isHidden ?
                '<i class="fas fa-times"></i> Закрыть' :
                '<i class="fas fa-plus"></i> Добавить видео';
        });
    }

    // ==========================================
    // Quick Access Cards - Materials & Cabinet
    // ==========================================
    const quickCabinet = document.getElementById('quickCabinet');
    if (quickCabinet) {
        quickCabinet.addEventListener('click', function(e) {
            if (e.target.closest('.quick-dropdown')) return;
            window.location.href = '/cabinet';
        });
    }

    // Materials dropdown - works on click for mobile (hover for desktop)
    const quickMaterials = document.getElementById('quickMaterials');
    if (quickMaterials) {
        const dropdown = quickMaterials.querySelector('.quick-dropdown');
        quickMaterials.addEventListener('click', function(e) {
            // Don't toggle if clicking a dropdown link
            if (e.target.closest('.dropdown-link')) return;
            if (window.innerWidth <= 768) {
                const isVisible = dropdown.style.opacity === '1';
                dropdown.style.opacity = isVisible ? '0' : '1';
                dropdown.style.visibility = isVisible ? 'hidden' : 'visible';
                dropdown.style.transform = isVisible ?
                    'translateX(-50%) translateY(-10px)' :
                    'translateX(-50%) translateY(10px)';
                e.preventDefault();
            } else {
                // On desktop, let the hover work - but navigate to materials page on click
                if (!e.target.closest('.quick-dropdown')) {
                    window.location.href = '/materials/math';
                }
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!quickMaterials.contains(e.target)) {
                dropdown.style.opacity = '0';
                dropdown.style.visibility = 'hidden';
                dropdown.style.transform = 'translateX(-50%) translateY(-10px)';
            }
        });
    }

    // ==========================================
    // Smooth Scroll for Anchor Links
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ==========================================
    // Scroll Animations (Intersection Observer)
    // ==========================================
    const animateElements = document.querySelectorAll(
        '.offer-card, .teacher-card, .about-content, .contact-item, .quick-card, .stat-item'
    );

    if (animateElements.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });

        // Delay each element
        animateElements.forEach((el, index) => {
            el.style.transitionDelay = `${index * 0.1}s`;
        });
    }

    // ==========================================
    // Chat Auto-scroll to Bottom
    // ==========================================
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const teacherChatMessages = document.getElementById('teacherChatMessages');
    if (teacherChatMessages) {
        teacherChatMessages.scrollTop = teacherChatMessages.scrollHeight;
    }

    // ==========================================
    // Form Validation
    // ==========================================
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredInputs = this.querySelectorAll('[required]');
            let valid = true;

            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = '#dc2626';
                    valid = false;

                    // Reset on input
                    input.addEventListener('input', function() {
                        this.style.borderColor = '';
                    }, { once: true });
                }
            });

            if (!valid) {
                e.preventDefault();
            }
        });
    });

    // ==========================================
    // Phone Input Mask (Simple)
    // ==========================================
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.startsWith('7') || value.startsWith('8')) {
                    if (value.startsWith('8')) value = '7' + value.slice(1);
                    let formatted = '+7 ';
                    if (value.length > 1) formatted += '(' + value.slice(1, 4);
                    if (value.length >= 5) formatted += ') ' + value.slice(4, 7);
                    if (value.length >= 8) formatted += '-' + value.slice(7, 9);
                    if (value.length >= 10) formatted += '-' + value.slice(9, 11);
                    this.value = formatted;
                }
            }
        });
    });

    // ==========================================
    // Parallax on Hero Section
    // ==========================================
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            if (scrolled < window.innerHeight) {
                const heroContent = heroSection.querySelector('.hero-content');
                if (heroContent) {
                    const yPos = scrolled * 0.4;
                    heroContent.style.transform = `translateY(${yPos}px)`;
                    heroContent.style.opacity = 1 - (scrolled / (window.innerHeight * 0.8));
                }
            }
        });
    }

    // ==========================================
    // Photo Upload - Show filename on select
    // ==========================================
    const photoInput = document.getElementById('photoInput');
    const photoFileName = document.getElementById('photoFileName');
    const photoSubmitBtn = document.getElementById('photoSubmitBtn');
    const photoLabelText = document.getElementById('photoLabelText');

    if (photoInput && photoFileName && photoSubmitBtn) {
        photoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                photoFileName.textContent = '📷 ' + this.files[0].name;
                photoSubmitBtn.style.display = 'inline-flex';
                if (photoLabelText) {
                    photoLabelText.textContent = 'Изменить фото';
                }
            }
        });
    }

    console.log('✅ Платформа загружена успешно');
});
