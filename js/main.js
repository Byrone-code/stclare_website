/* =========================================
   ST. CLARE GIRLS' CENTRE SCHOOL — main.js
   ========================================= */

/* ---------- HAMBURGER MENU ---------- */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

/* Close menu when a link is clicked */
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (navLinks) navLinks.classList.remove('open');
  });
});

/* ---------- ACTIVE NAV LINK ---------- */
/* Highlights the current page in the nav */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const linkPage = link.getAttribute('href').split('/').pop();
  if (linkPage === currentPage) link.classList.add('active');
});

/* ---------- NAVBAR SCROLL SHADOW ---------- */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  if (window.scrollY > 20) {
    navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,.25)';
  } else {
    navbar.style.boxShadow = '0 2px 12px rgba(0,0,0,.2)';
  }
});

/* ---------- COUNTER ANIMATION ---------- */
/* Animates the numbers in the stats bar */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  if (!target) return;
  const duration = 1500;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current).toLocaleString();
  }, 16);
}

/* Run counter when element enters the viewport */
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

/* ---------- CONTACT FORM HANDLER ---------- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault(); /* Prevent page reload */

    /* Collect form values */
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value.trim();

    /* Basic validation */
    if (!name || !email || !message) {
      showAlert('Please fill in all required fields.', 'error');
      return;
    }

    /* NOTE: Replace this with a real backend call (see backend section) */
    console.log('Form submitted:', { name, email, subject, message });
    showAlert('Thank you! Your message has been sent. We will get back to you shortly.', 'success');
    contactForm.reset();
  });
}

/* ---------- ALERT / TOAST HELPER ---------- */
function showAlert(message, type = 'success') {
  const existing = document.querySelector('.alert-toast');
  if (existing) existing.remove();

  const alert = document.createElement('div');
  alert.className = 'alert-toast';
  alert.style.cssText = `
    position:fixed; top:80px; right:20px; z-index:9999;
    background:${type === 'success' ? '#eaf3de' : '#fcebeb'};
    color:${type === 'success' ? '#3B6D11' : '#a32d2d'};
    border:1px solid ${type === 'success' ? '#c0dd97' : '#f7c1c1'};
    padding:14px 20px; border-radius:8px; font-size:.9rem;
    box-shadow:0 4px 16px rgba(0,0,0,.1); max-width:320px;
    animation: slideIn .3s ease;
  `;
  alert.textContent = message;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

/* ---------- SMOOTH SCROLL FOR ANCHOR LINKS ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
