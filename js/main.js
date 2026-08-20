/* ============ 粒子网络背景 ============ */
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, parts = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    const count = Math.min(70, Math.floor(window.innerWidth / 20));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.6 + 0.4
    }));
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(125, 200, 255, 0.55)';
      ctx.fill();
    }
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i], b = parts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = 'rgba(80, 170, 255, ' + (0.16 * (1 - d / 130)) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(step);
  }

  window.addEventListener('resize', () => { resize(); init(); });
  resize(); init(); step();
})();

/* ============ 导航栏 ============ */
(function () {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...links.querySelectorAll('a')];
  const onScrollActive = () => {
    const pos = window.scrollY + 120;
    let current = sections[0] && sections[0].id;
    sections.forEach((s) => { if (pos >= s.offsetTop) current = s.id; });
    navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
  };
  window.addEventListener('scroll', onScrollActive, { passive: true });
  onScrollActive();
})();

/* ============ 滚动显现动画 ============ */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
})();

/* ============ 打字机效果 ============ */
(function () {
  const phrases = [
    '职业规划导师 · 生涯咨询师',
    '帮你选对专业，走对方向',
    '就业、升学、城市，一次聊透',
  ];
  const el = document.getElementById('typed');
  if (!el) return;

  let phraseIdx = 0, charIdx = 0, deleting = false;
  const typeSpeed = 70, deleteSpeed = 38, pause = 1800;

  function tick() {
    const current = phrases[phraseIdx];
    if (!deleting) {
      charIdx++;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(tick, pause);
        return;
      }
      setTimeout(tick, typeSpeed);
    } else {
      charIdx--;
      el.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, deleteSpeed);
    }
  }
  setTimeout(tick, 500);
})();

/* ============ FAQ 手风琴 ============ */
(function () {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const q = item.querySelector('.faq-q');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
})();

/* ============ 留言墙（localStorage 保存） ============ */
(function () {
  const STORAGE_KEY = 'fanWall_messages_v1';
  const grid = document.getElementById('fanGrid');
  const form = document.getElementById('fanForm');
  const nameInput = document.getElementById('fanName');
  const msgInput = document.getElementById('fanMsg');
  if (!grid || !form) return;

  const avatarColors = [
    ['#22d3ee', '#3b82f6'],
    ['#3b82f6', '#8b5cf6'],
    ['#8b5cf6', '#d946ef'],
    ['#0ea5e9', '#34d399'],
    ['#f59e0b', '#22d3ee'],
  ];

  const seedMessages = [
    { name: '大三的小鹿', text: '老师，我学的市场营销，这个专业到底还好不好就业呀？', date: '2026.08.18' },
    { name: '阿凯', text: '听了您的直播，决定从传统行业转行做数据分析，正在准备了！', date: '2026.08.15' },
    { name: 'Momo', text: '求更新计算机专业的就业分析，孩子真的好迷茫……', date: '2026.08.12' },
    { name: '北岛', text: '杭州还是成都？看了老师的对比视频，终于有思路了。', date: '2026.08.09' },
    { name: '工科生小王', text: '机械专业大三，考公还是考研纠结很久了，希望老师下期讲讲。', date: '2026.08.05' },
    { name: '职场小白', text: '30 岁转行真的来得及吗？老师给的建议很中肯，谢谢！', date: '2026.08.01' },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return seedMessages;
  }

  function save(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  function render(list) {
    if (!list.length) {
      grid.innerHTML = '<p class="fan-empty">还没有留言，来抢占沙发吧 🛋️</p>';
      return;
    }
    grid.innerHTML = list
      .map((m, i) => {
        const [a1, a2] = avatarColors[i % avatarColors.length];
        const initial = (m.name || '?').trim().charAt(0).toUpperCase();
        return `
          <div class="fan-card">
            <div class="fan-card-head">
              <span class="fan-avatar" style="--a1:${a1};--a2:${a2};">${escapeHtml(initial)}</span>
              <div>
                <div class="fan-name">${escapeHtml(m.name)}</div>
                <div class="fan-date">${escapeHtml(m.date)}</div>
              </div>
            </div>
            <p class="fan-text">${escapeHtml(m.text)}</p>
          </div>`;
      })
      .join('');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function today() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}.${mm}.${dd}`;
  }

  let messages = load();
  render(messages);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const text = msgInput.value.trim();
    if (!name || !text) return;
    messages.unshift({ name, text, date: today() });
    save(messages);
    render(messages);
    form.reset();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();

/* ============ 页脚年份 ============ */
(function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();
