(function () {
  'use strict';

  // ----- Scroll reveal -----
  const revealEls = document.querySelectorAll('.service-card, .project-card, .section__title, .section__subtitle, .contact__text, .contact__links');
  revealEls.forEach(function (el) {
    el.classList.add('reveal');
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
  );

  revealEls.forEach(function (el) {
    observer.observe(el);
  });

  // ----- Tilt effect on cards -----
  const tiltEls = document.querySelectorAll('[data-tilt]');
  tiltEls.forEach(function (card) {
    if (window.matchMedia('(hover: none)').matches) return;
    card.addEventListener('mousemove', function (e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 25;
      const rotateY = (centerX - x) / 25;
      card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px) translateZ(8px)';
      card.style.transition = 'none';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
      card.style.transition = '';
    });
  });

  // ----- Burger menu -----
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      nav.classList.toggle('open');
      document.body.classList.toggle('menu-open');
    });
  }

  // ----- Smooth scroll for anchor links -----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id === '#') return;
      e.preventDefault();
      var target = document.querySelector(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (nav && nav.classList.contains('open')) {
          burger.classList.remove('open');
          nav.classList.remove('open');
          document.body.classList.remove('menu-open');
        }
      }
    });
  });
})();
