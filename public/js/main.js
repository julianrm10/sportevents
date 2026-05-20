document.addEventListener('DOMContentLoaded', () => {
  // Inicializar tooltips de Bootstrap
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el);
  });

  // Preview de imagen al seleccionar archivo
  const imgInput = document.getElementById('imagen');
  if (imgInput) {
    imgInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const preview = document.getElementById('img-preview');
      if (preview) {
        preview.src    = URL.createObjectURL(file);
        preview.hidden = false;
      }
    });
  }

  // Activar tab desde hash de URL
  const hash = window.location.hash;
  if (hash) {
    const tabEl = document.querySelector(`[href="${hash}"]`);
    if (tabEl) new bootstrap.Tab(tabEl).show();
  }

  // Guardar tab activo en hash
  document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', e => {
      history.replaceState(null, '', e.target.getAttribute('href'));
    });
  });
});
