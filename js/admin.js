// Panel institucional — Escuela Secundaria N°4 "Mariano Moreno"
// Edita data/content.json y la galería de fotos haciendo commits directos
// al repositorio a través de la API de Git de GitHub (Git Data API),
// usando un token personal que el usuario pega y que se guarda solo
// en el localStorage de su propio navegador.

const OWNER = "secundaria4federal";
const REPO = "secundaria4federal.github.io";
const BRANCH = "main";
const API = "https://api.github.com";
const TOKEN_KEY = "esc4_admin_token";

let token = localStorage.getItem(TOKEN_KEY) || "";
let currentContent = null; // último content.json conocido (tal como está en el repo)
let workingGallery = [];   // copia editable de content.gallery.photos
let pendingUploads = [];   // fotos nuevas listas para subir: {slug, file, thumbBlob, fullBlob, caption, previewUrl}

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  let target = obj;
  for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]];
  target[keys[keys.length - 1]] = value;
}

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function slugify(name) {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function resizeImage(file, maxWidth, quality) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(file);
  }
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function setMessage(el, text, kind) {
  el.textContent = text;
  el.className = "save-message" + (kind ? " " + kind : "");
}

// ---------------------------------------------------------------------
// GitHub API
// ---------------------------------------------------------------------

async function gh(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).message; } catch {}
    throw new Error(`GitHub API ${res.status}${detail ? ": " + detail : ""}`);
  }
  return res.status === 204 ? null : res.json();
}

async function verifyToken() {
  const user = await gh("/user");
  const repo = await gh(`/repos/${OWNER}/${REPO}`);
  if (!repo.permissions || !repo.permissions.push) {
    throw new Error("El token es válido pero no tiene permiso de escritura sobre este repositorio.");
  }
  return user;
}

/**
 * Crea UN commit atómico con múltiples archivos agregados/actualizados/eliminados.
 * files: [{ path, content?: string (texto plano, se codifica acá), contentBase64?: string, remove?: true }]
 */
async function commitFiles(files, message) {
  const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const baseCommitSha = ref.object.sha;
  const baseCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const treeEntries = [];
  for (const f of files) {
    if (f.remove) {
      treeEntries.push({ path: f.path, mode: "100644", type: "blob", sha: null });
      continue;
    }
    const contentBase64 = f.contentBase64 || utf8ToBase64(f.content);
    const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: contentBase64, encoding: "base64" }),
    });
    treeEntries.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });

  const newCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [baseCommitSha] }),
  });

  await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return newCommit.sha;
}

// ---------------------------------------------------------------------
// Conexión / UI de token
// ---------------------------------------------------------------------

function updateHeaderStatus(state, label) {
  const el = document.getElementById("headerStatus");
  el.className = "status-pill" + (state === "ok" ? " is-connected" : state === "error" ? " is-error" : "");
  el.innerHTML = `<span class="dot"></span> ${label}`;
}

async function tryConnect(showErrors = true) {
  if (!token) return false;
  try {
    const user = await verifyToken();
    updateHeaderStatus("ok", `Conectado como ${user.login}`);
    document.getElementById("disconnectBtn").hidden = false;
    document.getElementById("adminGate").hidden = true;
    document.getElementById("adminContent").hidden = false;
    setMessage(document.getElementById("connectMessage"), "", "");
    return true;
  } catch (err) {
    updateHeaderStatus("error", "Token inválido");
    document.getElementById("adminGate").hidden = false;
    document.getElementById("adminContent").hidden = true;
    if (showErrors) {
      setMessage(document.getElementById("connectMessage"), err.message, "error");
    }
    return false;
  }
}

function setupConnection() {
  const tokenInput = document.getElementById("tokenInput");
  if (token) tokenInput.value = token;

  document.getElementById("connectBtn").addEventListener("click", async () => {
    token = tokenInput.value.trim();
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    setMessage(document.getElementById("connectMessage"), "Conectando…", "pending");
    await tryConnect();
  });

  document.getElementById("disconnectBtn").addEventListener("click", () => {
    token = "";
    localStorage.removeItem(TOKEN_KEY);
    tokenInput.value = "";
    document.getElementById("disconnectBtn").hidden = true;
    document.getElementById("adminGate").hidden = false;
    document.getElementById("adminContent").hidden = true;
    updateHeaderStatus("", "Sin conectar");
  });
}

// ---------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("is-active");
    });
  });
}

// ---------------------------------------------------------------------
// Formulario de textos
// ---------------------------------------------------------------------

function populateForm(content) {
  document.querySelectorAll("[data-path]").forEach((el) => {
    const value = getPath(content, el.dataset.path);
    if (value == null) return;
    if (el.dataset.type === "lines") {
      el.value = Array.isArray(value) ? value.join("\n") : "";
    } else if (el.dataset.type === "bool") {
      el.checked = Boolean(value);
    } else {
      el.value = value;
    }
  });
}

function applyFormToContent(content) {
  const updated = JSON.parse(JSON.stringify(content));
  document.querySelectorAll("[data-path]").forEach((el) => {
    let value;
    if (el.dataset.type === "lines") {
      value = el.value.split("\n").map((l) => l.trim()).filter(Boolean);
    } else if (el.dataset.type === "bool") {
      value = el.checked;
    } else {
      value = el.value;
    }
    setPath(updated, el.dataset.path, value);
  });
  return updated;
}

function setupContentForm() {
  document.getElementById("contentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("saveContentBtn");
    const msg = document.getElementById("contentSaveMessage");
    btn.disabled = true;
    setMessage(msg, "Guardando…", "pending");
    try {
      const updated = applyFormToContent(currentContent);
      await commitFiles(
        [{ path: "data/content.json", content: JSON.stringify(updated, null, 2) + "\n" }],
        "Actualizar textos del sitio desde el panel institucional"
      );
      currentContent = updated;
      setMessage(msg, "Cambios guardados. El sitio se actualiza en uno o dos minutos.", "ok");
    } catch (err) {
      setMessage(msg, "No se pudo guardar: " + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  });
}

// ---------------------------------------------------------------------
// Galería
// ---------------------------------------------------------------------

function renderPhotoGrid() {
  const grid = document.getElementById("photoGrid");
  grid.innerHTML = workingGallery
    .map(
      (photo, i) => `
      <div class="photo-card" data-id="${photo.id}">
        <img src="${photo.thumb}" alt="" loading="lazy" />
        <div class="photo-card-body">
          <input type="text" placeholder="Epígrafe (opcional)" value="${(photo.caption || "").replace(/"/g, "&quot;")}" data-caption />
          <div class="photo-card-actions">
            <button type="button" class="icon-btn" data-action="up" ${i === 0 ? "disabled" : ""} title="Mover antes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
            <button type="button" class="icon-btn" data-action="down" ${i === workingGallery.length - 1 ? "disabled" : ""} title="Mover después">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </button>
            <button type="button" class="icon-btn danger" data-action="delete" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"/></svg>
            </button>
          </div>
        </div>
      </div>`
    )
    .join("");

  grid.querySelectorAll(".photo-card").forEach((card) => {
    const id = card.dataset.id;
    card.querySelector("[data-caption]").addEventListener("input", (e) => {
      const photo = workingGallery.find((p) => p.id === id);
      if (photo) photo.caption = e.target.value;
    });
    card.querySelector('[data-action="up"]').addEventListener("click", () => {
      const i = workingGallery.findIndex((p) => p.id === id);
      if (i > 0) {
        [workingGallery[i - 1], workingGallery[i]] = [workingGallery[i], workingGallery[i - 1]];
        renderPhotoGrid();
      }
    });
    card.querySelector('[data-action="down"]').addEventListener("click", () => {
      const i = workingGallery.findIndex((p) => p.id === id);
      if (i < workingGallery.length - 1) {
        [workingGallery[i + 1], workingGallery[i]] = [workingGallery[i], workingGallery[i + 1]];
        renderPhotoGrid();
      }
    });
    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (!confirm("¿Eliminar esta foto de la galería?")) return;
      workingGallery = workingGallery.filter((p) => p.id !== id);
      renderPhotoGrid();
    });
  });
}

function renderPendingGrid() {
  const grid = document.getElementById("pendingGrid");
  const actions = document.getElementById("pendingActions");
  actions.hidden = pendingUploads.length === 0;
  grid.innerHTML = pendingUploads
    .map(
      (p, i) => `
      <div class="photo-card" data-i="${i}">
        <span class="badge-new" style="margin:10px 0 0 10px;">Nueva</span>
        <img src="${p.previewUrl}" alt="" />
        <div class="photo-card-body">
          <input type="text" placeholder="Epígrafe (opcional)" value="${p.caption}" data-caption />
          <div class="photo-card-actions">
            <button type="button" class="icon-btn danger" data-action="remove" title="Quitar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
        </div>
      </div>`
    )
    .join("");

  grid.querySelectorAll(".photo-card").forEach((card) => {
    const i = Number(card.dataset.i);
    card.querySelector("[data-caption]").addEventListener("input", (e) => {
      pendingUploads[i].caption = e.target.value;
    });
    card.querySelector('[data-action="remove"]').addEventListener("click", () => {
      pendingUploads.splice(i, 1);
      renderPendingGrid();
    });
  });
}

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
  for (const file of files) {
    const [fullBlob, thumbBlob] = await Promise.all([
      resizeImage(file, 1600, 0.8),
      resizeImage(file, 480, 0.72),
    ]);
    const slug = `${slugify(file.name) || "foto"}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    pendingUploads.push({
      slug,
      fullBlob,
      thumbBlob,
      caption: "",
      previewUrl: URL.createObjectURL(thumbBlob),
    });
  }
  renderPendingGrid();
}

function setupGallery() {
  const drop = document.getElementById("uploadDrop");
  const input = document.getElementById("fileInput");

  input.addEventListener("change", (e) => handleFiles(e.target.files));

  ["dragover", "dragenter"].forEach((evt) =>
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.add("is-dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.remove("is-dragover");
    })
  );
  drop.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));

  document.getElementById("clearPendingBtn").addEventListener("click", () => {
    pendingUploads = [];
    renderPendingGrid();
  });

  document.getElementById("uploadBtn").addEventListener("click", async () => {
    const btn = document.getElementById("uploadBtn");
    const msg = document.getElementById("uploadMessage");
    btn.disabled = true;
    setMessage(msg, "Subiendo fotos…", "pending");
    try {
      const files = [];
      const newPhotos = [];
      for (const p of pendingUploads) {
        const fullB64 = await blobToBase64(p.fullBlob);
        const thumbB64 = await blobToBase64(p.thumbBlob);
        const fullPath = `assets/img/gallery/${p.slug}.jpg`;
        const thumbPath = `assets/img/gallery/thumbs/${p.slug}.jpg`;
        files.push({ path: fullPath, contentBase64: fullB64 });
        files.push({ path: thumbPath, contentBase64: thumbB64 });
        newPhotos.push({ id: p.slug, file: fullPath, thumb: thumbPath, caption: p.caption });
      }
      const updatedContent = JSON.parse(JSON.stringify(currentContent));
      updatedContent.gallery.photos = [...workingGallery, ...newPhotos];
      files.push({ path: "data/content.json", content: JSON.stringify(updatedContent, null, 2) + "\n" });

      await commitFiles(files, `Agregar ${pendingUploads.length} foto(s) a la galería`);

      currentContent = updatedContent;
      workingGallery = updatedContent.gallery.photos;
      pendingUploads = [];
      renderPendingGrid();
      renderPhotoGrid();
      setMessage(msg, "¡Fotos subidas! El sitio se actualiza en uno o dos minutos.", "ok");
    } catch (err) {
      setMessage(msg, "No se pudo subir: " + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("saveGalleryBtn").addEventListener("click", async () => {
    const btn = document.getElementById("saveGalleryBtn");
    const msg = document.getElementById("gallerySaveMessage");
    btn.disabled = true;
    setMessage(msg, "Guardando…", "pending");
    try {
      const originalIds = new Set(currentContent.gallery.photos.map((p) => p.id));
      const remainingIds = new Set(workingGallery.map((p) => p.id));
      const removed = currentContent.gallery.photos.filter((p) => !remainingIds.has(p.id));

      const updatedContent = JSON.parse(JSON.stringify(currentContent));
      updatedContent.gallery.photos = workingGallery;

      const files = [{ path: "data/content.json", content: JSON.stringify(updatedContent, null, 2) + "\n" }];
      removed.forEach((p) => {
        files.push({ path: p.file, remove: true });
        files.push({ path: p.thumb, remove: true });
      });

      await commitFiles(files, "Actualizar galería de fotos desde el panel institucional");
      currentContent = updatedContent;
      setMessage(msg, "Cambios guardados. El sitio se actualiza en uno o dos minutos.", "ok");
    } catch (err) {
      setMessage(msg, "No se pudo guardar: " + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  });
}

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------

async function init() {
  setupConnection();
  setupTabs();
  setupContentForm();
  setupGallery();

  const res = await fetch("data/content.json", { cache: "no-store" });
  currentContent = await res.json();
  workingGallery = JSON.parse(JSON.stringify(currentContent.gallery.photos));
  populateForm(currentContent);
  renderPhotoGrid();

  if (token) await tryConnect(false);
}

document.addEventListener("DOMContentLoaded", init);
