const API_URL = "https://www.raydelto.org/agenda.php";

const form = document.querySelector("#contact-form");
const submitButton = document.querySelector("#submit-button");
const formStatus = document.querySelector("#form-status");
const refreshButton = document.querySelector("#refresh-button");
const searchInput = document.querySelector("#search");
const listStatus = document.querySelector("#list-status");
const contactCount = document.querySelector("#contact-count");
const contactList = document.querySelector("#contact-list");

let contacts = [];

function setStatus(element, message, state = "") {
  element.textContent = message;
  element.dataset.state = state;
}

function getText(value) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function createContactItem(contact) {
  const item = document.createElement("li");
  item.className = "contact-item";

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = ((contact.nombre[0] ?? "") + (contact.apellido[0] ?? "")).toUpperCase() || "?";

  const info = document.createElement("div");
  info.className = "contact-info";

  const name = document.createElement("div");
  name.className = "contact-name";
  name.textContent = `${contact.nombre} ${contact.apellido}`.trim() || "Sin nombre";

  const phone = document.createElement("div");
  phone.className = "phone-text";
  phone.textContent = contact.telefono || "Sin teléfono";

  info.append(name, phone);
  item.append(avatar, info);
  return item;
}

function renderContacts() {
  const query = searchInput.value.trim().toLocaleLowerCase("es");
  const visible = query
    ? contacts.filter((contact) =>
        `${contact.nombre} ${contact.apellido} ${contact.telefono}`
          .toLocaleLowerCase("es")
          .includes(query))
    : contacts;

  const fragment = document.createDocumentFragment();
  visible.forEach((contact) => fragment.append(createContactItem(contact)));
  contactList.replaceChildren(fragment);
  contactCount.textContent = String(contacts.length);

  if (contacts.length === 0) {
    setStatus(listStatus, "Todavía no hay contactos guardados.");
  } else if (visible.length === 0) {
    setStatus(listStatus, "No hay contactos que coincidan con la búsqueda.");
  } else if (query) {
    setStatus(listStatus, `Mostrando ${visible.length} de ${contacts.length} contactos.`);
  } else {
    setStatus(listStatus, `Mostrando ${contacts.length} contactos.`);
  }
}

async function loadContacts() {
  refreshButton.disabled = true;
  setStatus(listStatus, "Cargando contactos...");

  try {
    const response = await fetch(API_URL, { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error(`GET ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Formato de respuesta inesperado");

    contacts = data.filter((item) => item && typeof item === "object").map((item) => ({
      nombre: getText(item.nombre),
      apellido: getText(item.apellido),
      telefono: getText(item.telefono)
    }));
    renderContacts();
    return true;
  } catch (error) {
    console.error("No se pudo consultar la agenda:", error);
    setStatus(listStatus, "No se pudieron cargar los contactos. Intenta actualizar la lista.", "error");
    return false;
  } finally {
    refreshButton.disabled = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const contact = {
    nombre: form.elements.nombre.value.trim(),
    apellido: form.elements.apellido.value.trim(),
    telefono: form.elements.telefono.value.trim()
  };

  if (!contact.nombre || !contact.apellido || !contact.telefono) {
    setStatus(formStatus, "Completa el nombre, apellido y teléfono.", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus(formStatus, "Guardando contacto...");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact)
    });
    if (!response.ok) throw new Error(`POST ${response.status}`);

    form.reset();
    setStatus(formStatus, "Contacto guardado. La lista se está actualizando.", "success");
    const updated = await loadContacts();
    setStatus(formStatus, updated
      ? "Contacto guardado correctamente."
      : "Contacto guardado, pero la lista no se pudo actualizar.", "success");
  } catch (error) {
    console.error("No se pudo guardar el contacto:", error);
    setStatus(formStatus, "No se pudo guardar el contacto. Inténtalo de nuevo.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

searchInput.addEventListener("input", renderContacts);
refreshButton.addEventListener("click", loadContacts);
loadContacts();
