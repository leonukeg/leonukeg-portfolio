/**
 * renderer.js
 * Capa de Componentes: Funciones puras para renderizar la UI de forma atómica.
 */

/**
 * Renderiza una tarjeta de proyecto para la sección WORK
 */
export const createProjectCard = (project) => {
  const flagshipBadge = project.tag ? `<span class="project-flagship">${project.tag}</span>` : '';
  
  return `
    <a href="${project.url}" target="_blank" class="project" style="--project-accent: ${project.accent}">
      <span class="project-num">/${project.id}</span>
      <div class="project-body">
        <h3 class="project-name">
          ${project.name}
          ${flagshipBadge}
        </h3>
        <p class="project-desc">${project.desc}</p>
        <div class="project-meta">
          <span><span class="meta-label">STACK </span><span class="meta-value">${project.stack}</span></span>
          <span><span class="meta-label">STATUS </span><span class="meta-value project-status">${project.status}</span></span>
        </div>
      </div>
    </a>
  `;
};

/**
 * Renderiza un ítem para la sección LABORATORY
 */
export const createLabItem = (item) => {
  return `
    <a href="${item.url}" target="_blank" class="lab-item">
      <p class="lab-item-tag">${item.tag}</p>
      <h3 class="lab-item-name">${item.name}</h3>
      <p class="lab-item-desc">${item.desc}</p>
    </a>
  `;
};
