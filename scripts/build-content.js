// One-off script: builds data/content.json from scripts/gallery-manifest.json
// plus the hardcoded initial copy (real institutional text + lorem-ipsum placeholders).
// Run with: node scripts/build-content.js
// NOTE: after this, data/content.json is the source of truth and is edited by
// hand or via the admin panel — re-running this script would overwrite manual edits,
// so it's meant to be run once during initial setup (or after regenerating photos).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'gallery-manifest.json'), 'utf8'));

const cover = manifest.find(p => p.cover);
const gallery = manifest.filter(p => !p.cover).map(({ id, file, thumb, width, height, caption }) => ({
  id, file, thumb, width, height, caption
}));

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const LOREM_SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.";

const content = {
  site: {
    name: 'Escuela Secundaria N°4 "Mariano Moreno"',
    shortName: "Escuela N°4",
    location: "Colonia Federal, Federal, Entre Ríos",
    closingPhrase: "Somos parte de una historia que se sigue escribiendo cada día",
  },

  nav: [
    { label: "Inicio", href: "#inicio" },
    { label: "Quiénes somos", href: "#quienes-somos" },
    { label: "Oferta educativa", href: "#oferta-educativa" },
    { label: "Vida escolar", href: "#vida-escolar" },
    { label: "Inscripciones", href: "#inscripciones" },
    { label: "Galería", href: "#galeria" },
    { label: "Ubicación", href: "#ubicacion" },
    { label: "Contacto", href: "#contacto" },
  ],

  hero: {
    eyebrow: "Escuela pública rural · Colonia Federal, Entre Ríos",
    title: 'Escuela Secundaria N°4\n"Mariano Moreno"',
    subtitle:
      "Más de 25 años formando trayectorias en Colonia Federal, a diez kilómetros de la ciudad de Federal. Bachiller con orientación en Economía y Administración.",
    ctaPrimaryText: "Inscripciones Ciclo 2027",
    ctaPrimaryLink: "#inscripciones",
    ctaSecondaryText: "Conocé la escuela",
    ctaSecondaryLink: "#quienes-somos",
    image: cover.file,
    example: false,
  },

  about: {
    title: "Quiénes somos",
    example: false,
    paragraphs: [
      "La Escuela Secundaria N°4 “Mariano Moreno” es una institución educativa rural ubicada en Colonia Federal, a aproximadamente diez kilómetros de la ciudad de Federal.",
      "Contamos con más de veinticinco años de trayectoria, brindando una educación integral que fortalece el aprendizaje, la convivencia y el compromiso comunitario.",
      "Buscamos acompañar a cada estudiante en su propio recorrido, en un espacio donde cada trayectoria cuenta y el futuro se construye en comunidad.",
    ],
  },

  offer: {
    title: "Oferta educativa",
    example: false,
    orientation: "Bachiller con orientación en Economía y Administración",
    text: "Nuestra propuesta formativa se complementa con trayectos pedagógicos adaptados a los intereses de nuestros estudiantes, pensados para acompañar su paso por la escuela secundaria y su proyección hacia el futuro.",
  },

  workshops: {
    title: "Propuesta formativa",
    subtitle: "Talleres y espacios que complementan la formación de nuestros estudiantes.",
    example: false,
    items: [
      {
        icon: "radio",
        title: "Taller de radio",
        text: "Un espacio de expresión y comunicación donde los estudiantes producen contenido propio.",
      },
      {
        icon: "sprout",
        title: "Huerta orgánica",
        text: "Trabajo en la tierra y producción de alimentos de manera sustentable, a cielo abierto.",
      },
      {
        icon: "utensils",
        title: "Producción de alimentos",
        text: "Producción y manipulación de alimentos como espacio de aprendizaje práctico.",
      },
      {
        icon: "book-open",
        title: "Apoyo escolar",
        text: "Acompañamiento pedagógico para sostener las trayectorias educativas de los estudiantes.",
      },
    ],
  },

  schoolLife: {
    title: "Vida escolar",
    example: false,
    intro:
      "Abordamos temáticas sociales clave para el desarrollo adolescente y participamos activamente en torneos deportivos, viajes educativos y encuentros intercolegiales.",
    features: [
      {
        icon: "clock",
        title: "Jornada extendida",
        text: "Actividades de nueve a diecisiete horas para garantizar el acompañamiento de los estudiantes.",
      },
      {
        icon: "utensils-crossed",
        title: "Servicio de comedor",
        text: "Comedor escolar para acompañar la jornada extendida de nuestros alumnos.",
      },
      {
        icon: "bus",
        title: "Transporte escolar",
        text: "Transporte escolar rural para garantizar la permanencia de los estudiantes.",
      },
    ],
  },

  institutionalProject: {
    title: "Proyecto institucional",
    example: true,
    paragraphs: [LOREM, LOREM_SHORT],
  },

  news: {
    title: "Novedades",
    example: true,
    items: [
      { date: "Lorem ipsum", title: "Título de novedad de ejemplo", text: LOREM_SHORT },
      { date: "Lorem ipsum", title: "Título de novedad de ejemplo", text: LOREM_SHORT },
      { date: "Lorem ipsum", title: "Título de novedad de ejemplo", text: LOREM_SHORT },
    ],
  },

  enrollment: {
    title: "Inscripciones Ciclo Lectivo 2027",
    example: false,
    date: "2026-10-01",
    text: "Te invitamos a formar parte de la comunidad educativa de la Escuela N°4, un espacio donde cada trayectoria cuenta y el futuro se construye en comunidad.",
    ctaText: "Consultar por WhatsApp",
  },

  gallery: {
    title: "Galería",
    subtitle: "Momentos de la vida escolar en la Escuela N°4.",
    photos: gallery,
  },

  location: {
    title: "Cómo llegar",
    example: false,
    address: "RP5, Colonia Federal, Entre Ríos",
    lat: -30.919504,
    lng: -58.835424,
    mapsLink: "https://maps.app.goo.gl/3ZQXvw7TjB7jXYT3A",
  },

  contact: {
    title: "Contacto",
    example: false,
    phone: "+54 3454 40-8277",
    phoneLink: "5493454408277",
    email: "secundaria4.fl@entrerios.edu.ar",
    instagram: "https://www.instagram.com/esc.sec.marianomoreno",
    hours: "Lunes a viernes de 9 a 17 hs",
  },

  footer: {
    text: 'Escuela Secundaria N°4 "Mariano Moreno" — Colonia Federal, Entre Ríos',
  },
};

fs.writeFileSync(
  path.join(ROOT, "data", "content.json"),
  JSON.stringify(content, null, 2) + "\n"
);
console.log(`data/content.json generado con ${gallery.length} fotos de galería.`);
