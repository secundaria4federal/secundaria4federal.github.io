// Escuela Secundaria N°4 "Mariano Moreno" — sitio institucional
// Carga data/content.json y renderiza el contenido dinámico del sitio.

const ICONS = {
  radio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="14" r="4"/><path d="M12 10V4M8 4h8M4.5 14.5 2 12M19.5 14.5 22 12"/></svg>',
  sprout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21V10"/><path d="M12 10c0-4 3-6 7-6 0 4-2 7-7 7Z"/><path d="M12 13c0-3-2.5-5-6.5-5 0 3.5 2 6 6.5 6Z"/></svg>',
  utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3v7a2 2 0 0 0 2 2v9M6 3v7M9 3v7M15 3c-1.7 0-3 2-3 5s1.3 5 3 5v8"/></svg>',
  'book-open': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 6.5C10.5 5 8 4.3 5 4.5v14c3 0 5.5.7 7 2 1.5-1.3 4-2 7-2v-14c-3-.2-5.5.5-7 2Z"/><path d="M12 6.5v14"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  'utensils-crossed': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4l16 16M6.5 3.5l3 3-6 6-3-3 6-6ZM17.5 3.5c-2 2-3 4.5-2 6.5l6-6a5 5 0 0 0-4-.5Z"/></svg>',
  bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M3 12h18M7 17v2M17 17v2"/><circle cx="7.5" cy="17" r="0" /></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C10.5 21 3 13.5 3 6a2 2 0 0 1 1-2Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6 8 7 8-7"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 12a8 8 0 1 1-3.2-6.4"/><path d="M20 4l-4 2.5"/><path d="M8.5 9.5c0 3.5 2.5 6 6 6l1-2-3-1-1 1a5 5 0 0 1-3-3l1-1-1-3-2 1Z"/></svg>',
};

const MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function applyBindings(content) {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const value = getPath(content, el.getAttribute("data-bind"));
    if (value != null) el.textContent = value;
  });

  document.querySelectorAll("[data-bind-attr]").forEach((el) => {
    el.getAttribute("data-bind-attr").split(",").forEach((rule) => {
      const [path, attr] = rule.split(":").map((s) => s.trim());
      const value = getPath(content, path);
      if (value != null) el.setAttribute(attr, value);
    });
  });

  document.querySelectorAll("[data-bind-html]").forEach((el) => {
    const value = getPath(content, el.getAttribute("data-bind-html"));
    if (Array.isArray(value)) {
      el.innerHTML = value.map((p) => `<p>${p}</p>`).join("");
    }
  });
}

function renderNav(content) {
  const nav = document.querySelector("[data-bind-nav]");
  nav.innerHTML = content.nav
    .map((item) => `<a href="${item.href}">${item.label}</a>`)
    .join("") + `<a href="#inscripciones" class="nav-cta">Inscripciones</a>`;
}

function renderWorkshops(content) {
  const grid = document.getElementById("workshopsGrid");
  grid.innerHTML = content.workshops.items
    .map(
      (item) => `
      <div class="workshop-card">
        <div class="icon-circle">${ICONS[item.icon] || ""}</div>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </div>`
    )
    .join("");
}

function renderFeatures(content) {
  const grid = document.getElementById("featuresGrid");
  grid.innerHTML = content.schoolLife.features
    .map(
      (item) => `
      <div class="feature-item">
        <div class="icon-circle">${ICONS[item.icon] || ""}</div>
        <div>
          <h3>${item.title}</h3>
          <p>${item.text}</p>
        </div>
      </div>`
    )
    .join("");
}

function renderNews(content) {
  const grid = document.getElementById("newsGrid");
  grid.innerHTML = content.news.items
    .map(
      (item) => `
      <div class="news-card">
        <span class="news-date">${item.date}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </div>`
    )
    .join("");
  document.getElementById("newsBadge").hidden = !content.news.example;
  document.getElementById("projectBadge").hidden = !content.institutionalProject.example;
}

function renderEnrollmentDate(content) {
  const date = new Date(`${content.enrollment.date}T00:00:00`);
  const box = document.getElementById("enrollmentDate");
  box.querySelector(".day").textContent = String(date.getDate()).padStart(2, "0");
  box.querySelector(".month-year").textContent = `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

let galleryPhotos = [];
let lightboxIndex = 0;

function renderGallery(content) {
  galleryPhotos = content.gallery.photos;
  const grid = document.getElementById("galleryGrid");
  const featured = new Set([0, 3, 7]); // algunas fotos destacadas más grandes
  grid.innerHTML = galleryPhotos
    .map((photo, i) => {
      const cls = featured.has(i) ? (i === 0 ? "wide" : "tall") : "";
      return `<div class="gallery-item ${cls}" data-index="${i}">
        <img src="${photo.thumb}" alt="${photo.caption || "Foto de la vida escolar"}" loading="lazy" />
      </div>`;
    })
    .join("");

  grid.querySelectorAll(".gallery-item").forEach((el) => {
    el.addEventListener("click", () => openLightbox(Number(el.dataset.index)));
  });
}

function openLightbox(index) {
  lightboxIndex = index;
  updateLightbox();
  document.getElementById("lightbox").classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("is-open");
  document.body.style.overflow = "";
}

function updateLightbox() {
  const photo = galleryPhotos[lightboxIndex];
  document.getElementById("lightboxImg").src = photo.file;
  document.getElementById("lightboxImg").alt = photo.caption || "Foto de la vida escolar";
  document.getElementById("lightboxCounter").textContent = `${lightboxIndex + 1} / ${galleryPhotos.length}`;
}

function setupLightbox() {
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });
  document.getElementById("lightboxPrev").addEventListener("click", () => {
    lightboxIndex = (lightboxIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
    updateLightbox();
  });
  document.getElementById("lightboxNext").addEventListener("click", () => {
    lightboxIndex = (lightboxIndex + 1) % galleryPhotos.length;
    updateLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("lightbox").classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") document.getElementById("lightboxPrev").click();
    if (e.key === "ArrowRight") document.getElementById("lightboxNext").click();
  });
}

function renderLocation(content) {
  const { lat, lng, mapsLink } = content.location;
  document.getElementById("mapEmbed").src = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  document.getElementById("mapsLink").href = mapsLink;
}

function renderContact(content) {
  const { phone, phoneLink, email, instagram, hours } = content.contact;
  const grid = document.getElementById("contactGrid");
  grid.innerHTML = `
    <a class="contact-card" href="https://wa.me/${phoneLink}" target="_blank" rel="noopener">
      <div class="icon-circle">${ICONS.whatsapp}</div>
      <strong>WhatsApp</strong>
      <span>${phone}</span>
    </a>
    <a class="contact-card" href="mailto:${email}">
      <div class="icon-circle">${ICONS.mail}</div>
      <strong>Email</strong>
      <span>${email}</span>
    </a>
    <a class="contact-card" href="${instagram}" target="_blank" rel="noopener">
      <div class="icon-circle">${ICONS.instagram}</div>
      <strong>Instagram</strong>
      <span>@esc.sec.marianomoreno</span>
    </a>
    <div class="contact-card" style="cursor:default;">
      <div class="icon-circle">${ICONS.clock}</div>
      <strong>Horario</strong>
      <span>${hours}</span>
    </div>
  `;
}

function setupHeader() {
  const header = document.getElementById("siteHeader");
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");

  window.addEventListener("scroll", () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  });

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => observer.observe(el));
}

async function init() {
  try {
    const res = await fetch("data/content.json", { cache: "no-store" });
    const content = await res.json();

    applyBindings(content);
    renderNav(content);
    renderWorkshops(content);
    renderFeatures(content);
    renderNews(content);
    renderEnrollmentDate(content);
    renderGallery(content);
    renderLocation(content);
    renderContact(content);
  } catch (err) {
    console.error("No se pudo cargar data/content.json", err);
  } finally {
    setupHeader();
    setupLightbox();
    setupReveal();
  }
}

document.addEventListener("DOMContentLoaded", init);
