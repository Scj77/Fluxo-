
document.addEventListener('DOMContentLoaded', function() {
  const photoPreview = document.getElementById('photoPreview');
  
  if (!photoPreview) return;

  photoPreview.addEventListener('dragover', handleDragOver, false);
  photoPreview.addEventListener('dragleave', handleDragLeave, false);
  photoPreview.addEventListener('drop', handleDrop, false);

  const formSection = document.querySelector('.form-section');
  if (formSection) {
    formSection.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, false);
    
    formSection.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  }
});

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const photoPreview = document.getElementById('photoPreview');
  photoPreview.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const photoPreview = document.getElementById('photoPreview');
  photoPreview.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const photoPreview = document.getElementById('photoPreview');
  photoPreview.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  
  if (files && files.length > 0) {
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      mostrarMensagem('Por favor, arraste apenas arquivos de imagem.', 'error');
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      mostrarMensagem('O arquivo é muito grande. Máximo permitido: 5MB.', 'error');
      return;
    }
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    document.getElementById('photoInput').files = dataTransfer.files;
    
    carregarFoto({ target: { files: dataTransfer.files } });
    
    mostrarMensagem('Foto carregada com sucesso!', 'success');
  }
}