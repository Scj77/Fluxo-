function extrairDadosFicha(textoFicha) {
    const dados = {};
    
    const campos = {
        "nome": /\*Nome completo:\*\s*(.*)/i,
        "cpf": /\*CPF:\*\s*(.*)/i,
        "telefone": /\*Telefone:\*\s*(.*)/i,
        "referencia": /\*Nome e Telefone de referência:\*\s*(.*)/i,
        "placa": /\*Placa do carro:\*\s*(.*)/i,
        "modeloCor": /\*Modelo e cor:\*\s*(.*)/i,
        "valorAprovado": /\*Valor aprovado:\*\s*(.*)/i,
        "chavePix": /\*Chave Pix:\*\s*(.*)/i,
    };
    
    let textoLimpo = textoFicha.replace(/Para finalizar, vou precisar que preencha essas informações:\s*\n\*FICHA FINANCEIRA\*\s*\n/i, '').trim();
    textoLimpo = textoLimpo.replace(/\". entao precisa filtrar os dados/i, '').trim();
    
    for (const chave in campos) {
        const match = textoLimpo.match(campos[chave]);
        if (match && match[1]) {
            let valor = match[1].trim();
            if (valor.startsWith('"') && valor.endsWith('"')) {
                valor = valor.substring(1, valor.length - 1);
            }
            dados[chave] = valor;
        } else {
            dados[chave] = "";
        }
    }

    return dados;
}

function processarLote() {
    const texto = document.getElementById('textareaLote').value.trim();
    
    if (!texto) {
        mostrarMensagem('Por favor, cole os dados.', 'error', 'lote');
        return;
    }

    const fichasRaw = texto.split(/(\*FICHA FINANCEIRA\*\s*\n)/i).filter(f => f.trim().length > 0 && !f.includes('*FICHA FINANCEIRA*'));
    
    let processadas = 0;
    let erros = [];

    fichasRaw.forEach((fichaRaw, index) => {
        const dados = extrairDadosFicha('*FICHA FINANCEIRA*\n' + fichaRaw);
        
        if (!dados.nome || !dados.cpf || !dados.telefone || !dados.valorAprovado) {
            erros.push(`Ficha ${index + 1}: Campos obrigatórios (Nome, CPF, Telefone, Valor) ausentes.`);
            return;
        }

        if (!validarCPF(dados.cpf)) {
            erros.push(`Ficha ${index + 1}: CPF inválido.`);
            return;
        }
        
        let valorString = dados.valorAprovado ? dados.valorAprovado.replace(/\./g, '').replace(/,/g, '.') : '0';
        const valorNumerico = parseFloat(valorString);
        
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            erros.push(`Ficha ${index + 1}: Valor aprovado inválido.`);
            return;
        }

        const novaFicha = {
            id: Date.now() + index,
            nome: dados.nome,
            cpf: dados.cpf,
            telefone: dados.telefone,
            referencia: dados.referencia,
            placa: dados.placa,
            modeloCor: dados.modeloCor,
            valorAprovado: valorNumerico,
            chavePix: dados.chavePix,
            foto: null,
            dataCriacao: new Date().toLocaleString('pt-BR')
        };

        fichas.push(novaFicha);
        processadas++;
    });

    if (processadas > 0) {
        salvarDados();
        mostrarMensagem(`${processadas} ficha(s) adicionada(s) com sucesso!`, 'success', 'lote');
        document.getElementById('textareaLote').value = '';
    }

    if (erros.length > 0) {
        mostrarMensagem(`Erros encontrados:\n${erros.join('\n')}`, 'error', 'lote');
    }
}

let fichas = [];
let fotoAtual = null;
let fichaEmEdicao = null;

function carregarDados() {
  const dados = localStorage.getItem('fichasFinanceiras');
  if (dados) {
    fichas = JSON.parse(dados);
  }
  atualizarListagem();
}

function salvarDados() {
  localStorage.setItem('fichasFinanceiras', JSON.stringify(fichas));
  mostrarMensagem('Dados salvos localmente!', 'success');
  atualizarListagem();
}

function salvarLocal() {
  salvarDados();
}

function abrirAba(event, abaId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(abaId).classList.add('active');

  event.target.closest('.tab-button').classList.add('active');

  if (abaId === 'listagem') {
    atualizarListagem();
  }
}

function carregarFoto(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      fotoAtual = e.target.result;
      const preview = document.getElementById('photoPreview');
      preview.innerHTML = `<img src="${fotoAtual}" alt="Foto do cliente">`;
      preview.classList.remove('empty');
    };
    reader.readAsDataURL(file);
  }
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

function validarFormulario() {
  const nome = document.getElementById('nome').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const referencia = document.getElementById('referencia').value.trim();
  const placa = document.getElementById('placa').value.trim();
  const modeloCor = document.getElementById('modeloCor').value.trim();
  const valorAprovado = document.getElementById('valorAprovado').value.trim();
  const chavePix = document.getElementById('chavePix').value.trim();

  if (!nome) {
    mostrarMensagem('Por favor, preencha o nome completo.', 'error');
    return false;
  }

  if (!cpf || !validarCPF(cpf)) {
    mostrarMensagem('Por favor, preencha um CPF válido.', 'error');
    return false;
  }

  if (!telefone) {
    mostrarMensagem('Por favor, preencha o telefone.', 'error');
    return false;
  }

  if (!referencia) {
    mostrarMensagem('Por favor, preencha a referência.', 'error');
    return false;
  }

  if (!placa) {
    mostrarMensagem('Por favor, preencha a placa do carro.', 'error');
    return false;
  }

  if (!modeloCor) {
    mostrarMensagem('Por favor, preencha o modelo e cor.', 'error');
    return false;
  }

  if (!valorAprovado || parseFloat(valorAprovado) <= 0) {
    mostrarMensagem('Por favor, preencha um valor aprovado válido.', 'error');
    return false;
  }

  if (!chavePix) {
    mostrarMensagem('Por favor, preencha a chave Pix.', 'error');
    return false;
  }

  return true;
}

function adicionarFicha() {
  if (!validarFormulario()) return;

  const novaFicha = {
    id: Date.now(),
    nome: document.getElementById('nome').value.trim(),
    cpf: document.getElementById('cpf').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    referencia: document.getElementById('referencia').value.trim(),
    placa: document.getElementById('placa').value.trim(),
    modeloCor: document.getElementById('modeloCor').value.trim(),
    valorAprovado: parseFloat(document.getElementById('valorAprovado').value),
    chavePix: document.getElementById('chavePix').value.trim(),
    foto: fotoAtual,
    dataCriacao: new Date().toLocaleString('pt-BR')
  };

  if (fichaEmEdicao) {
    const index = fichas.findIndex(f => f.id === fichaEmEdicao);
    if (index !== -1) {
      fichas[index] = { ...fichas[index], ...novaFicha };
      mostrarMensagem('Ficha atualizada com sucesso!', 'success');
    }
    fichaEmEdicao = null;
  } else {
    fichas.push(novaFicha);
    mostrarMensagem('Ficha adicionada com sucesso!', 'success');
  }
  
  salvarDados();
  limparFormulario();
}

// Função para salvar JPEG individual
function salvarFichaIndividualJPEG() {
  if (!validarFormulario()) return;

  const ficha = {
    nome: document.getElementById('nome').value.trim(),
    cpf: document.getElementById('cpf').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    referencia: document.getElementById('referencia').value.trim(),
    placa: document.getElementById('placa').value.trim(),
    modeloCor: document.getElementById('modeloCor').value.trim(),
    valorAprovado: parseFloat(document.getElementById('valorAprovado').value),
    chavePix: document.getElementById('chavePix').value.trim(),
    foto: fotoAtual
  };

  gerarJPEG(ficha);
}

// Função para salvar PDF individual
function salvarFichaIndividualPDF() {
  if (!validarFormulario()) return;

  const ficha = {
    nome: document.getElementById('nome').value.trim(),
    cpf: document.getElementById('cpf').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    referencia: document.getElementById('referencia').value.trim(),
    placa: document.getElementById('placa').value.trim(),
    modeloCor: document.getElementById('modeloCor').value.trim(),
    valorAprovado: parseFloat(document.getElementById('valorAprovado').value),
    chavePix: document.getElementById('chavePix').value.trim(),
    foto: fotoAtual
  };

  gerarPDF(ficha);
}

// Função de geração de PDF melhorada
function gerarPDF(ficha) {
  const html = gerarHTMLFicha(ficha);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const opt = {
    margin: 10,
    filename: `ficha-financeira-${ficha.nome.replace(/\s/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };
  
  html2pdf().set(opt).from(tempDiv).save();
  mostrarMensagem('PDF gerado com sucesso!', 'success');
}

// Função de geração de JPEG
function gerarJPEG(ficha) {
  const html = gerarHTMLFicha(ficha);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);
  
  html2canvas(tempDiv, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.download = `ficha-financeira-${ficha.nome.replace(/\s/g, '_')}.jpeg`;
    link.click();
    document.body.removeChild(tempDiv);
    mostrarMensagem('JPEG gerado com sucesso!', 'success');
  }).catch(error => {
    console.error('Erro ao gerar JPEG:', error);
    mostrarMensagem('Erro ao gerar JPEG. Tente novamente.', 'error');
    document.body.removeChild(tempDiv);
  });
}

function gerarHTMLFicha(ficha) {
  return `
    <div class="ficha-preview">
      <div class="ficha-header">
        <h1>FICHA FINANCEIRA</h1>
        <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      <div class="ficha-content">
        <div class="ficha-photo">
          ${ficha.foto ? `<img src="${ficha.foto}" alt="Foto do cliente">` : '<div class="ficha-photo empty"><i class="fa-solid fa-image"></i></div>'}
        </div>
        <div class="ficha-fields">
          <div class="ficha-field">
            <label>Nome Completo</label>
            <value>${ficha.nome}</value>
          </div>
          <div class="ficha-field">
            <label>CPF</label>
            <value>${ficha.cpf}</value>
          </div>
          <div class="ficha-field">
            <label>Telefone</label>
            <value>${ficha.telefone}</value>
          </div>
          <div class="ficha-field">
            <label>Referência</label>
            <value>${ficha.referencia}</value>
          </div>
          <div class="ficha-field">
            <label>Placa do Carro</label>
            <value>${ficha.placa}</value>
          </div>
          <div class="ficha-field">
            <label>Modelo e Cor</label>
            <value>${ficha.modeloCor}</value>
          </div>
          <div class="ficha-field">
            <label>Valor Aprovado</label>
            <value>R$ ${ficha.valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</value>
          </div>
          <div class="ficha-field">
            <label>Chave Pix</label>
            <value>${ficha.chavePix}</value>
          </div>
        </div>
      </div>
    </div>
  `;
}

function salvarFichaJPEG() {
  const fichaPreviewContent = document.getElementById('fichaPreviewContent');
  if (!fichaPreviewContent || !fichaPreviewContent.innerHTML) {
    mostrarMensagem('Nenhuma ficha para exportar.', 'error');
    return;
  }
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = fichaPreviewContent.innerHTML;
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);
  
  html2canvas(tempDiv, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.download = 'ficha-financeira.jpeg';
    link.click();
    document.body.removeChild(tempDiv);
    mostrarMensagem('JPEG gerado com sucesso!', 'success');
  }).catch(error => {
    console.error('Erro ao gerar JPEG:', error);
    mostrarMensagem('Erro ao gerar JPEG. Tente novamente.', 'error');
    document.body.removeChild(tempDiv);
  });
}

function salvarNoDrive() {
  mostrarMensagem('Para salvar no Google Drive, você precisa estar autenticado. Redirecionando...', 'success');
  alert('Integração com Google Drive:\n\n1. Acesse https://drive.google.com\n2. Clique em "Novo" > "Upload de arquivo"\n3. Selecione o PDF gerado\n\nOu implemente a autenticação OAuth2 do Google Drive para automatizar este processo.');
}

function limparLote() {
  document.getElementById('textareaLote').value = '';
}

function atualizarListagem() {
  const tbody = document.getElementById('tabelaBody');
  const statsRow = document.getElementById('statsRow');

  if (fichas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Nenhuma ficha cadastrada. Comece adicionando uma nova ficha.</td></tr>';
    statsRow.style.display = 'none';
    return;
  }

  let html = '';
  let valorTotal = 0;

  fichas.forEach(ficha => {
    valorTotal += ficha.valorAprovado;
    html += `
      <tr>
        <td>${ficha.nome}</td>
        <td>${ficha.cpf}</td>
        <td>${ficha.telefone}</td>
        <td>${ficha.placa}</td>
        <td>R$ ${ficha.valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>
          <button class="btn-edit" onclick="editarFicha(${ficha.id})"><i class="fa-solid fa-edit"></i> Editar</button>
          <button class="btn-delete" onclick="deletarFicha(${ficha.id})"><i class="fa-solid fa-trash"></i> Deletar</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  // Atualizar stats
  document.getElementById('totalFichas').textContent = fichas.length;
  document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  statsRow.style.display = 'grid';
}

function editarFicha(id) {
  const ficha = fichas.find(f => f.id === id);
  if (!ficha) return;

  document.getElementById('nome').value = ficha.nome;
  document.getElementById('cpf').value = ficha.cpf;
  document.getElementById('telefone').value = ficha.telefone;
  document.getElementById('referencia').value = ficha.referencia;
  document.getElementById('placa').value = ficha.placa;
  document.getElementById('modeloCor').value = ficha.modeloCor;
  document.getElementById('valorAprovado').value = ficha.valorAprovado;
  document.getElementById('chavePix').value = ficha.chavePix;

  if (ficha.foto) {
    fotoAtual = ficha.foto;
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = `<img src="${ficha.foto}" alt="Foto do cliente">`;
    preview.classList.remove('empty');
  } else {
    limparFotoPreview();
  }

  fichaEmEdicao = id;

  document.getElementById('nova').classList.add('active');
  document.querySelectorAll('.tab-content').forEach(tab => {
    if (tab.id !== 'nova') tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach((btn, index) => {
    btn.classList.toggle('active', index === 0);
  });
}

function deletarFicha(id) {
  if (confirm('Tem certeza que deseja deletar esta ficha?')) {
    fichas = fichas.filter(f => f.id !== id);
    salvarDados();
    atualizarListagem();
    mostrarMensagem('Ficha deletada com sucesso!', 'success');
  }
}

function limparFotoPreview() {
  fotoAtual = null;
  const preview = document.getElementById('photoPreview');
  preview.innerHTML = '<i class="fa-solid fa-image"></i>';
  preview.classList.add('empty');
}

function limparFormulario() {
  document.getElementById('nome').value = '';
  document.getElementById('cpf').value = '';
  document.getElementById('telefone').value = '';
  document.getElementById('referencia').value = '';
  document.getElementById('placa').value = '';
  document.getElementById('modeloCor').value = '';
  document.getElementById('valorAprovado').value = '';
  document.getElementById('chavePix').value = '';
  
  limparFotoPreview();
  fichaEmEdicao = null;
}

function limparTodas() {
  if (confirm('Tem certeza que deseja deletar TODAS as fichas? Esta ação não pode ser desfeita.')) {
    fichas = [];
    salvarDados();
    atualizarListagem();
    mostrarMensagem('Todas as fichas foram deletadas!', 'success');
  }
}

function exportarTodosPDF() {
  if (fichas.length === 0) {
    mostrarMensagem('Nenhuma ficha para exportar.', 'error');
    return;
  }

  let html = '<html><head><meta charset="UTF-8"><title>Fichas Financeiras</title><style>@page { size: A4; margin: 10mm; } .ficha-preview { page-break-after: always; }</style></head><body>';
  
  fichas.forEach((ficha, index) => {
    html += gerarHTMLFicha(ficha);
  });

  html += '</body></html>';

  const opt = {
    margin: 10,
    filename: 'fichas-financeiras.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(opt).from(html).save();
  mostrarMensagem('PDF gerado com sucesso!', 'success');
}

function exportarCSV() {
  if (fichas.length === 0) {
    mostrarMensagem('Nenhuma ficha para exportar.', 'error');
    return;
  }

  let csv = 'Nome,CPF,Telefone,Referência,Placa,Modelo e Cor,Valor Aprovado,Chave Pix,Data de Criação\n';

  fichas.forEach(ficha => {
    csv += `"${ficha.nome}","${ficha.cpf}","${ficha.telefone}","${ficha.referencia}","${ficha.placa}","${ficha.modeloCor}",${ficha.valorAprovado},"${ficha.chavePix}","${ficha.dataCriacao}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'fichas-financeiras.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  mostrarMensagem('CSV exportado com sucesso!', 'success');
}

function fecharModal() {
  document.getElementById('modalFicha').classList.remove('show');
}

function mostrarMensagem(texto, tipo, aba = null) {
  const elementId = tipo === 'success' ? 
    (aba ? `success${aba.charAt(0).toUpperCase() + aba.slice(1)}` : 'successMessage') :
    (aba ? `error${aba.charAt(0).toUpperCase() + aba.slice(1)}` : 'errorMessage');

  const elemento = document.getElementById(elementId);
  if (!elemento) {
    console.error(`${tipo.toUpperCase()}: Elemento de mensagem não encontrado para ID ${elementId}`);
    return;
  }

  document.querySelectorAll('.success-message, .error-message').forEach(el => el.classList.remove('show'));

  elemento.textContent = texto;
  elemento.classList.add('show');

  setTimeout(() => {
    elemento.classList.remove('show');
  }, 4000);
}

carregarDados();