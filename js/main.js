if (window.emailjs && EMAILJS_PUBLIC_KEY.startsWith('YOUR_') === false) emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
const slides = [
    ['assets/hero-reference/hero-1.jpg', 'Professional cleaning in action'],
    ['assets/hero-reference/hero-2.jpg', 'Professional floor care'],
    ['assets/hero-reference/hero-3.jpg', 'Scrubber-dryer equipment'],
    ['assets/hero-reference/hero-4.jpg', 'Carpet deep cleaning'],
    ['assets/hero-reference/hero-5.jpg', 'Professional scrubbing machine'],
    ['assets/hero-reference/hero-6.jpg', 'Cleaning equipment & solutions']
];
let currentSlide = 0;
function renderSlides() { slidesEl.innerHTML = slides.map((s, i) => `<div class="slide ${i === 0 ? 'active' : ''}"><img src="${s[0]}" alt="${s[1]}"><span class="slide-label">${s[1]}</span></div>`).join(''); dots.innerHTML = slides.map((_, i) => `<button class="dot ${i === 0 ? 'active' : ''}" onclick="goSlide(${i})"></button>`).join('') }
function goSlide(i) { currentSlide = (i + slides.length) % slides.length; document.querySelectorAll('.slide').forEach((e, n) => e.classList.toggle('active', n === currentSlide)); document.querySelectorAll('.dot').forEach((e, n) => e.classList.toggle('active', n === currentSlide)) }
function moveSlide(n) { goSlide(currentSlide + n) }
setInterval(() => moveSlide(1), 5000);
const services = [
    ['Housekeeping Consultancy', 'Operational guidance for standards, workflows, manpower and cleaning systems.'],
    ['Professional Cleaning Solutions', 'Cleaning methods matched to surfaces, environments and site requirements.'],
    ['Mechanised Deep Cleaning', 'Deep cleaning for carpets, floors, upholstery and difficult areas.'],
    ['Product & Equipment Supply', 'Professional chemicals, machines, tools, accessories and hygiene products.'],
    ['Housekeeping Staff Training', 'Practical training in cleaning methods, equipment, chemicals and safe work.'],
    ['Equipment Training', 'Hands-on guidance for professional cleaning machines and equipment.'],
    ['Chemical Training', 'Correct product selection, dilution, application and safe handling.'],
    ['SOP Development', 'Standard Operating Procedures for consistent housekeeping operations.'],
    ['Quality Control & Inspection', 'Inspection systems and quality checks to maintain cleaning standards.'],
    ['Hygiene Improvement', 'Programs for hygiene, sanitation and maintenance improvement.'],
    ['Manpower & Work Planning', 'Task allocation, scheduling and operational planning support.'],
    ['After-Sales & Practical Guidance', 'Product-use guidance and practical support around cleaning operations.']
];
const products = [
    ['S2 All Klean Floor Cleaner', 'chemical', 'Professional floor cleaning solution.', ['floor', 'flore', 'chemicle', 'chemical', 'cleaner', 'all klean'], 'assets/products/photos/s2-all-klean-floor-cleaner.jpg'],
    ['S3 Window Shine Glass Cleaner', 'chemical', 'Glass and window cleaning solution.', ['glass', 'window', 'shine'], 'assets/products/photos/s3-window-shine-glass-cleaner.jpg'],
    ['S1 Germ Free Bathroom Cleaner', 'chemical', 'Bathroom cleaning solution.', ['bathroom', 'toilet', 'germ'], 'assets/catalogue-products/cat1-chem-1-3.jpg'],
    ['K6 Natural Steel Polish', 'chemical', 'Steel and stainless-steel care.', ['steel', 'polish', 'metal'], 'assets/products/photos/k6-natural-steel-polish.jpg'],
    ['S6 Super Lime Away', 'chemical', 'Lime and scale cleaning solution.', ['lime', 'scale', 'descaler'], 'assets/products/photos/s6-super-lime-away.jpg'],
    ['S12 Hand Wash', 'chemical', 'Hand hygiene product.', ['hand', 'wash', 'hygiene'], 'assets/products/photos/s12-hand-wash.jpg'],
    ['K1 Sparklean Dish Wash', 'chemical', 'Dish and kitchen cleaning.', ['dish', 'kitchen', 'wash'], 'assets/products/photos/k1-sparklean-dish-wash.jpg'],
    ['K2 Kofvan Kitchen Floor', 'chemical', 'Kitchen floor cleaning.', ['kitchen', 'floor', 'kofvan'], 'assets/products/photos/k2-kofvan-kitchen-floor.jpg'],
    ['S11 Labello Hand Wash', 'chemical', 'Hand wash solution.', ['hand', 'wash', 'labello'], 'assets/products/photos/s11-labello-hand-wash.jpg'],
    ['S17 Carpet Brite', 'chemical', 'Carpet cleaning solution.', ['carpet', 'brite', 'shampoo'], 'assets/products/photos/s17-carpet-brite.jpg'],
    ['S14 Floor Stripper Heavy Duty', 'chemical', 'Heavy-duty floor stripping.', ['floor', 'stripper', 'heavy', 'duty'], 'assets/products/photos/s14-floor-stripper-heavy-duty.jpg'],
    ['S4 Sun Glow Furniture Polish', 'chemical', 'Furniture care and polishing.', ['furniture', 'polish', 'wood'], 'assets/products/photos/s4-sun-glow-furniture-polish.jpg'],
    ['S20 Wash Auto Car Shampoo', 'chemical', 'Vehicle cleaning shampoo.', ['car', 'auto', 'shampoo'], 'assets/products/photos/s20-wash-auto-car-shampoo.jpg'],
    ['K16 Citrus Scrub', 'chemical', 'Cleaning and scrubbing solution.', ['citrus', 'scrub'], 'assets/products/photos/k16-citrus-scrub.jpg'],
    ['HDC Heavy Duty Cleaner', 'chemical', 'Heavy-duty cleaning.', ['heavy', 'duty', 'cleaner', 'hdc'], 'assets/products/photos/hdc-heavy-duty-cleaner.jpg'],
    ['D-Scale Floor Clean', 'chemical', 'Scale and floor cleaning.', ['scale', 'floor', 'd scale'], 'assets/products/photos/d-scale-floor-clean.jpg'],
    ['Bowl Clean Toilet Cleaner', 'chemical', 'Toilet and bowl cleaning.', ['toilet', 'bowl', 'bathroom'], 'assets/products/photos/bowl-clean-toilet-cleaner.jpg'],
    ['Fresh-Air Air Freshener', 'chemical', 'Air freshening solution.', ['air', 'freshener', 'fragrance'], 'assets/products/photos/fresh-air-air-freshener.jpg'],
    ['Carpet Cleaner', 'chemical', 'Professional carpet cleaning.', ['carpet', 'cleaner'], 'assets/catalogue-products/cat1-chem-2-4.jpg'],
    ['Microfiber Floor Mop', 'tool', 'Professional microfiber floor mop.', ['mop', 'floor', 'microfiber'], 'assets/products/photos/microfiber-floor-mop.jpg'],
    ['Dry Vacuum Cleaner', 'machine', 'Professional dry vacuum equipment.', ['dry', 'vacuum'], 'assets/products/photos/dry-vacuum-cleaner.jpg'],
    ['VAC 301 Wet & Dry Vacuum Cleaner', 'machine', 'Wet and dry professional vacuum cleaner.', ['wet', 'dry', 'vacuum', 'vac 301'], 'assets/catalogue-products/cat2-machine-2-1.jpg'],
    ['Single Disc Machine', 'machine', 'Floor scrubbing and polishing machine.', ['single', 'disc', 'scrubber', 'polisher'], 'assets/products/photos/single-disc-machine.jpg'],
    ['SUPER-4 Multi Speed Scrubber', 'machine', 'Multi-speed professional floor scrubber.', ['super 4', 'scrubber', 'multi speed'], 'assets/products/super4-scrubber.jpg'],
    ['High Pressure Machine', 'machine', 'High-pressure cleaning equipment.', ['high', 'pressure', 'machine', 'jet'], 'assets/products/photos/high-pressure-machine.jpg'],
    ['20 LTR Vacuum Cleaner', 'machine', 'Professional vacuum equipment.', ['20 ltr', '20l', 'vacuum'], 'assets/products/photos/20-ltr-vacuum-cleaner.jpg'],
    ['Polishing Machine', 'machine', 'Professional floor polishing.', ['polishing', 'machine'], 'assets/products/photos/polishing-machine.jpg'],
    ['50 LTR Vacuum Cleaner', 'machine', 'Large-capacity vacuum.', ['50 ltr', '50l', 'vacuum'], 'assets/catalogue-products/cat2-machine-2-3.jpg'],
    ['Carpet Extractor', 'machine', 'Professional carpet extraction machine.', ['carpet', 'extractor'], 'assets/products/photos/carpet-extractor.jpg'],
    ['Auto Klean With Refill', 'machine', 'Cleaning equipment with refill system.', ['auto klean', 'refill'], 'assets/products/photos/auto-klean-with-refill.jpg'],
    ['Air Pressure With Refill', 'machine', 'Professional air-pressure equipment.', ['air pressure', 'refill'], 'assets/products/photos/air-pressure-with-refill.jpg'],
];
const industries = ['Pharmaceutical Industries', 'Hotels & Hospitality', 'Food Industries', 'Temples & Religious Institutions', 'Spas & Wellness Centres', 'Commercial Establishments', 'Corporate Facilities', 'Other Institutional Facilities'];
const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' '); const lev = (a, b) => { a = norm(a); b = norm(b); const d = Array.from({ length: b.length + 1 }, (_, i) => [i]); for (let i = 0; i <= a.length; i++)d[i] = [i, ...Array(b.length).fill(0)]; for (let i = 1; i <= a.length; i++)for (let j = 1; j <= b.length; j++)d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length] };
function matches(p, q) { if (!q) return true; const text = norm([p[0], p[1], p[2], ...(p[3] || [])].join(' ')); const nq = norm(q); if (text.includes(nq)) return true; return nq.split(' ').some(token => token.length >= 3 && text.split(' ').some(w => w.startsWith(token) || lev(w, token) <= 1)) }
function renderServices() { serviceGrid.innerHTML = services.map(s => `<article class="service"><div class="service-body"><span class="service-kicker">VIDHI SALES SERVICE</span><h3>${s[0]}</h3><p>${s[1]}</p></div></article>`).join('') }
function renderProducts() { const q = document.getElementById('search').value, c = document.getElementById('category').value; const a = products.filter(p => (!c || p[1] === c) && matches(p, q)); productGrid.innerHTML = a.length ? a.map(p => `<article class="product"><div class="product-media"><img src="${p[4]}" alt="${p[0]}" loading="lazy"></div><div class="product-body"><span class="tag">${p[1]}</span><h3>${p[0]}</h3><p>${p[2]}</p><button type="button" class="btn btn-blue buy-now" data-item="${esc(p[0])}">Buy Now →</button></div></article>`).join('') : `<div class="empty">No exact result. Try <b>floor</b>, <b>chemical</b>, <b>cleaner</b>, <b>vacuum</b> or <b>machine</b>.</div>` }
function fillQuote() { quoteItem.innerHTML = '<option value="">Select product or service</option><optgroup label="Products">' + products.map(p => `<option>${p[0]}</option>`).join('') + '</optgroup><optgroup label="Services">' + services.map(s => `<option>${s[0]}</option>`).join('') + '</optgroup>' }
function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function selectQuote(v) { quoteItem.value = v; document.getElementById('quote').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => document.querySelector('[name="message"]').focus(), 500) }
function renderIndustries() { industryGrid.innerHTML = industries.map(x => `<div class="industry">${x}</div>`).join('') }
function toggleMenu() { document.getElementById('navlinks').classList.toggle('open') }
function fallbackMail(form, subject) { const fd = new FormData(form); const lines = []; fd.forEach((v, k) => lines.push(`${k}: ${v}`)); location.href = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}` }
async function sendEmail(templateId, params, form, status) { if (window.emailjs && !EMAILJS_PUBLIC_KEY.startsWith('YOUR_')) { await emailjs.send(EMAILJS_SERVICE_ID, templateId, params); status.className = 'status success'; status.textContent = 'Sent successfully. VIDHI SALES will receive your email enquiry.'; form.reset(); return true } fallbackMail(form, params.subject || 'VIDHI SALES Enquiry'); status.className = 'status success'; status.textContent = 'Your email app has been opened with the enquiry ready to send.'; return true }
document.getElementById('quoteForm').addEventListener('submit', async e => { e.preventDefault(); const f = e.target, s = document.getElementById('quoteStatus'), fd = new FormData(f); s.textContent = 'Sending...'; try { await sendEmail(EMAILJS_QUOTE_TEMPLATE_ID, { subject: 'VIDHI SALES Quotation Request', to_email: OWNER_EMAIL, customer_name: fd.get('customer_name'), customer_phone: fd.get('customer_phone'), customer_email: fd.get('customer_email'), company: fd.get('company'), item: fd.get('item'), quantity: fd.get('quantity'), message: fd.get('message') }, f, s) } catch (err) { s.className = 'status error'; s.textContent = 'Email service is not configured yet. Please use the email button or contact VIDHI SALES directly.' } });
document.getElementById('contactForm').addEventListener('submit', async e => { e.preventDefault(); const f = e.target, s = document.getElementById('contactStatus'), fd = new FormData(f); s.textContent = 'Sending...'; try { await sendEmail(EMAILJS_CONTACT_TEMPLATE_ID, { subject: 'VIDHI SALES Website Contact', to_email: OWNER_EMAIL, name: fd.get('name'), email: fd.get('email'), message: fd.get('message') }, f, s) } catch (err) { s.className = 'status error'; s.textContent = 'Email service is not configured yet.' } });

/* ===== Premium scroll + interaction effects ===== */
const motionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            motionObserver.unobserve(entry.target);
        }
    });
}, { threshold: .12, rootMargin: '0px 0px -45px 0px' });

function prepareMotion() {
    document.querySelectorAll('section .section-head, .about-copy, .about-photo, .consultant, .shop, .contact-card, .contact .form, .form').forEach((el, i) => {
        if (!el.classList.contains('reveal')) el.classList.add('reveal');
        motionObserver.observe(el);
    });

    document.querySelectorAll('.service, .product, .industry, .review, .trust div').forEach((el, i) => {
        if (!el.classList.contains('stagger-item')) el.classList.add('stagger-item');
        el.style.transitionDelay = `${Math.min((i % 6) * 70, 350)}ms`;
        motionObserver.observe(el);
    });
}
prepareMotion();

const siteHeader = document.querySelector('header');
window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

/* Re-apply reveal animation when catalogue/service cards are regenerated. */
const originalRenderServices = renderServices;
renderServices = function () {
    originalRenderServices();
    document.querySelectorAll('.service').forEach((el, i) => {
        el.classList.add('stagger-item');
        el.style.transitionDelay = `${Math.min((i % 6) * 70, 350)}ms`;
        motionObserver.observe(el);
    });
};

const originalRenderProducts = renderProducts;
renderProducts = function () {
    originalRenderProducts();
    document.querySelectorAll('.product').forEach((el, i) => {
        el.classList.add('stagger-item');
        el.style.transitionDelay = `${Math.min((i % 8) * 55, 385)}ms`;
        motionObserver.observe(el);
    });
};

/* Small parallax effect for the hero image on pointer movement. */
const hero = document.querySelector('.hero');
const heroCarousel = document.querySelector('.carousel');
if (hero && heroCarousel && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        heroCarousel.style.transform = `translate(${x * 5}px,${y * 5}px)`;
    });
    hero.addEventListener('pointerleave', () => { heroCarousel.style.transform = 'translate(0,0)' });
}

document.getElementById('year').textContent = new Date().getFullYear(); const slidesEl = document.getElementById('slides'), dots = document.getElementById('dots'); renderSlides(); renderServices(); renderProducts(); fillQuote(); renderIndustries();

// Every "Buy Now" button jumps to the quotation form with that product pre-selected
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.buy-now');
    if (btn) selectQuote(btn.dataset.item);
});
