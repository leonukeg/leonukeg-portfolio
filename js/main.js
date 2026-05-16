/**
 * main.js
 * LEONUKEG Portfolio — Core Logic
 * Handles ScrollTrigger animations, Intersection Observer for HUD/Lightning sync,
 * and keyboard navigation.
 */

'use strict';

import { PROJECTS, LAB_EXPERIMENTS } from './data.js';
import { createProjectCard, createLabItem } from './renderer.js';

window.addEventListener('DOMContentLoaded', () => {

  // ── COMPONENT INJECTION ──────────────────────────────────────────────────
  // Inyecta los proyectos y experimentos desde la capa de datos.
  const workContainer = document.getElementById('projects-container');
  const labContainer  = document.getElementById('lab-grid');

  if (workContainer) {
    workContainer.innerHTML = PROJECTS.map(p => createProjectCard(p)).join('');
  }

  if (labContainer) {
    labContainer.innerHTML = LAB_EXPERIMENTS.map(e => createLabItem(e)).join('');
  }

  // ── GSAP CONFIGURATION ──────────────────────────────────────────────────
  gsap.registerPlugin(ScrollTrigger);
  
  // Asegura que ScrollTrigger reconozca los nuevos elementos inyectados
  ScrollTrigger.refresh();

  // ── HERO ENTRANCE SEQUENCE ──────────────────────────────────────────────
  // Animates the entry section elements in a timed sequence.
  const introTL = gsap.timeline({ delay: 0.4 });

  introTL
    .to('.entry-label', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
    .to('.hero-name',   { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.35')
    .to('.hero-sub',    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.45')
    .to('.hero-tagline',{ opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.35')
    .to('.scroll-hint', {
      opacity: 1, duration: 0.6, ease: 'power2.out',
      onComplete: () => {
        const hint = document.querySelector('.scroll-hint');
        if (hint) hint.classList.add('visible');
      }
    }, '+=0.5');

  // ── NAVIGATION & HUD SYNC ───────────────────────────────────────────────
  const sectionIds = ['entry', 'system', 'work', 'lab', 'signals'];
  let currentIdx   = 0;

  // Sync keyboard navigation index with scroll position
  const syncIdx = (id) => {
    const found = sectionIds.indexOf(id);
    if (found !== -1) currentIdx = found;
  };

  // Keyboard navigation (Arrow keys)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && currentIdx < sectionIds.length - 1) {
      e.preventDefault();
      currentIdx++;
      document.getElementById(sectionIds[currentIdx])?.scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' && currentIdx > 0) {
      e.preventDefault();
      currentIdx--;
      document.getElementById(sectionIds[currentIdx])?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Intersection Observer for Section Tracking
  const sections = document.querySelectorAll('main section');
  const idxItems = document.querySelectorAll('.idx');
  const statusEl = document.getElementById('hud-tr');

  // Mappings for UI/Engine states
  const MODE_MAP = {
    'entry':   'CALM',   'system':  'ACTIVE', 'work':    'INTENSE',
    'lab':     'STORM',  'signals': 'CALM'
  };

  const STATUS_MAP = {
    'entry':   'NEURAL NET ACTIVE',     'system':  'SYSTEM LAYER SYNC',
    'work':    'DATA OVERLOAD DETECTED','lab':     'STORM MODE ENABLED',
    'signals': 'RECEIVING SIGNALS'
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
        const id = entry.target.id;
        const activeIdx = Array.from(sections).indexOf(entry.target);

        // Update HUD indices
        idxItems.forEach((el, i) => el.classList.toggle('active', i === activeIdx));

        // Update Lightning Engine Mode
        if (window.lightningSetMode) window.lightningSetMode(MODE_MAP[id] || 'CALM');

        // Update HUD Status Text
        if (statusEl && STATUS_MAP[id] && statusEl.textContent !== STATUS_MAP[id]) {
          gsap.to(statusEl, { opacity: 0, duration: 0.15, onComplete: () => {
            statusEl.textContent = STATUS_MAP[id];
            gsap.to(statusEl, { opacity: 0.35, duration: 0.2 });
          }});
        }

        syncIdx(id);
      }
    });
  }, { threshold: [0.1, 0.4, 0.8] });

  sections.forEach(s => sectionObserver.observe(s));

  // ── SCROLL-TRIGGER ANIMATIONS ───────────────────────────────────────────
  
  // Section 02: System Layer
  const systemElements = ['.system-h1', '.system-body', '.stack-label', '.stack-line', '.system-quote'];
  systemElements.forEach((sel, i) => {
    if (!document.querySelector(sel)) return;
    gsap.fromTo(sel, 
      { opacity: 0, y: 40, scale: 0.98 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: sel, start: 'top 90%' },
        delay: i * 0.1,
      }
    );
  });

  // Section 03: Work Layer
  gsap.fromTo('.work-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, scrollTrigger: { trigger: '#work', start: 'top 80%' } });
  gsap.fromTo('.work-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: '#work', start: 'top 80%' }, delay: 0.1 });

  document.querySelectorAll('.project').forEach((el, i) => {
    gsap.fromTo(el, 
      { opacity: 0, y: 60, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 92%' },
        delay: i * 0.12,
      }
    );
  });

  // Section 04: Lab Layer
  gsap.fromTo('.lab-label',    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, scrollTrigger: { trigger: '#lab', start: 'top 80%' } });
  gsap.fromTo('.lab-title',    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: '#lab', start: 'top 80%' }, delay: 0.1 });
  gsap.fromTo('.lab-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, scrollTrigger: { trigger: '#lab', start: 'top 80%' }, delay: 0.2 });
  
  document.querySelectorAll('.lab-item').forEach((el, i) => {
    gsap.fromTo(el, 
      { opacity: 0, y: 50, scale: 0.96 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 95%' },
        delay: i * 0.08,
      }
    );
  });

  // Section 05: Signals Layer
  gsap.fromTo('.signals-label', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, scrollTrigger: { trigger: '#signals', start: 'top 80%' } });
  gsap.fromTo('.signals-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, scrollTrigger: { trigger: '#signals', start: 'top 80%' }, delay: 0.15 });
  gsap.fromTo('.signals-sub',   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: '#signals', start: 'top 80%' }, delay: 0.3 });
  gsap.fromTo('.signals-links', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: '.signals-links', start: 'top 88%' } });
  gsap.fromTo('.signals-footer',{ opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.0, scrollTrigger: { trigger: '.signals-footer', start: 'top 95%' } });

});
