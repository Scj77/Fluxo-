const listas = {
  renovacao: {
    data: [],
    tabelaId: 'tabelaRenovacoes',
    addFn: 'adicionarRenovacao'
  },
  novo: {
    data: [],
    tabelaId: 'tabelaNovos',
    addFn: 'adicionarNovo'
  },
  entrada: {
    data: [],
    tabelaId: 'tabelaEntradas',
    addFn: 'adicionarEntrada'
  },
  saida: {
    data: [],
    tabelaId: 'tabelaSaidas',
    addFn: 'adicionarSaida'
  }
};

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

function formatarData(dataStr) {
  if (!dataStr) return '--/--/----';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function calcularTotal(itens) {
  return (itens || []).reduce((total, item) => total + (Number(item.valor) || 0), 0);
}

function formatarListaItens(itens) {
  if (!itens || itens.length === 0) return '(Nenhum item)\n\n';
  return itens.map((item, index) =>
    `${index + 1}. ${item.nome}\n${formatarMoeda(item.valor)}\n`
  ).join('\n') + '\n';
}

function adicionarItem(tipo) {
  if (!listas[tipo]) return;
  listas[tipo].data.push({ nome: '', valor: 0 });
  atualizarTabela(tipo, true);
  atualizarResumo();
}

function adicionarRenovacao() {
  adicionarItem('renovacao');
}

function adicionarNovo() {
  adicionarItem('novo');
}

function adicionarEntrada() {
  adicionarItem('entrada');
}

function adicionarSaida() {
  adicionarItem('saida');
}

function atualizarItem(tipo, i, campo, valor) {
  if (!listas[tipo] || !listas[tipo].data[i]) return;

  if (campo === 'valor') {
    listas[tipo].data[i][campo] = parseFloat(String(valor).replace(',', '.')) || 0;
  } else {
    listas[tipo].data[i][campo] = valor;
  }

  atualizarTabela(tipo);
  atualizarResumo();
}

function removerItem(tipo, i) {
  if (!listas[tipo]) return;

  if (confirm('Deseja realmente remover este item?')) {
    listas[tipo].data.splice(i, 1);
    atualizarTabela(tipo);
    atualizarResumo();
  }
}

function atualizarTabela(tipo, focarNoUltimo = false) {
  const config = listas[tipo];
  if (!config) return;

  const tabela = document.getElementById(config.tabelaId);
  if (!tabela) return;

  const tbody = tabela.querySelector('tbody');
  const tfoot = tabela.querySelector('tfoot');
  const data = config.data;

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color:var(--muted); padding:20px;">
          Nenhum item adicionado. Clique em "Adicionar" para começar.
        </td>
      </tr>
    `;
    tfoot.innerHTML = '';
  } else {
    tbody.innerHTML = data.map((item, i) => {
      const nomeEsc = escapeHTML(item.nome);
      const valorNum = Number(item.valor) || 0;
      return `
        <tr>
          <td style="width:40px">${i + 1}</td>
          <td>
            <input
              type="text"
              value="${nomeEsc}"
              onchange="atualizarItem('${tipo}', ${i}, 'nome', this.value)"
              style="background:transparent; border:none; color:var(--white); width:100%;"
              placeholder="Nome do item"
            >
          </td>
          <td style="width:170px">
            <input
              class="valor-input"
              type="number"
              step="0.01"
              value="${valorNum.toFixed(2)}"
              onchange="atualizarItem('${tipo}', ${i}, 'valor', this.value)"
              style="background:transparent; border:none; color:var(--white); width:100%;"
            >
          </td>
          <td style="width:70px">
            <button
              class="btn"
              style="background:#b91c1c; padding:6px 8px;"
              onclick="removerItem('${tipo}', ${i})"
              title="Remover item"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    const totalValor = calcularTotal(data);
    tfoot.innerHTML = `
      <tr>
        <td>Total</td>
        <td>${data.length} ${data.length === 1 ? 'item' : 'itens'}</td>
        <td style="text-align:right;">${formatarMoeda(totalValor)}</td>
        <td></td>
      </tr>
    `;
  }

  if (focarNoUltimo && data.length > 0) {
    setTimeout(() => {
      const inputToFocus = tbody.querySelector('tr:last-child input[type="text"]');
      if (inputToFocus) inputToFocus.focus();
    }, 0);
  }
}

function carregarDadosTransferidos() {
  const dadosTransferidos = localStorage.getItem('espartano2_transferencia');
  if (dadosTransferidos) {
    try {
      const dados = JSON.parse(dadosTransferidos);

      if (dados.renovacoes && dados.renovacoes.length > 0) {
        listas.renovacao.data = dados.renovacoes;
        atualizarTabela('renovacao');
      }

      if (dados.novos && dados.novos.length > 0) {
        listas.novo.data = dados.novos;
        atualizarTabela('novo');
      }

      localStorage.removeItem('espartano2_transferencia');

      return true;
    } catch (e) {
      console.error("Erro ao carregar dados transferidos:", e);
    }
  }
  return false;
}

function atualizarResumo() {
  const inicial = parseFloat(String(document.getElementById('saldoInicial').value).replace(',', '.')) || 0;
  const final = parseFloat(String(document.getElementById('saldoFinal').value).replace(',', '.')) || 0;
  const dataFinal = document.getElementById('dataSaldoFinal').value || '';

  const totRenov = calcularTotal(listas.renovacao.data);
  const totNovos = calcularTotal(listas.novo.data);
  const totEntradas = calcularTotal(listas.entrada.data);
  const totSaidas = calcularTotal(listas.saida.data);

  const saldoCalculado = inicial - totRenov - totNovos + totEntradas - totSaidas;
  const diferenca = inicial - final;

  document.getElementById('resumo').style.display = 'block';
  document.getElementById('resumoEmpty').style.display = 'none';
  document.getElementById('graficoCard').style.display = 'block';

  document.getElementById('resSaldoInicial').textContent = formatarMoeda(inicial);
  document.getElementById('resRenovacoes').textContent = formatarMoeda(totRenov);
  document.getElementById('resNovos').textContent = formatarMoeda(totNovos);
  document.getElementById('resEntradas').textContent = formatarMoeda(totEntradas);
  document.getElementById('resSaidas').textContent = formatarMoeda(totSaidas);
  document.getElementById('resSaldoFinal').textContent = formatarMoeda(final);
  document.getElementById('dataFinalResumo').textContent = formatarData(dataFinal);

  const elDiferenca = document.getElementById('resDiferenca');
  elDiferenca.textContent = formatarMoeda(diferenca);
  elDiferenca.style.color = Math.abs(diferenca) < 0.01 ? 'var(--success)' : 'var(--danger)';

  document.getElementById('status').textContent = `Atualizado em ${new Date().toLocaleString('pt-BR')}`;

  atualizarGrafico(inicial, totRenov, totNovos, totEntradas, totSaidas, final);

}
// (Funções de colagem de totais removidas conforme solicitação)

function atualizarGrafico(inicial, renovacoes, novos, entradas, saidas, final) {
  document.getElementById('grafSaldoInicial').textContent = formatarMoeda(inicial);
  document.getElementById('grafRenovacoes').textContent = formatarMoeda(renovacoes);
  document.getElementById('grafNovos').textContent = formatarMoeda(novos);
  document.getElementById('grafEntradas').textContent = formatarMoeda(entradas);
  document.getElementById('grafSaidas').textContent = formatarMoeda(saidas);
  document.getElementById('grafSaldoFinal').textContent = formatarMoeda(final);

  const valores = [inicial, renovacoes, novos, entradas, saidas, final].filter(v => Math.abs(v) > 0);
  const maxValor = Math.max(...valores, 1);

  const calcularPorcentagem = (valor) => {
    const valorAbsoluto = Math.abs(valor);
    if (valorAbsoluto <= 0) return 0;
    return Math.max((valorAbsoluto / maxValor) * 100, 2);
  };

  setTimeout(() => {
    document.getElementById('barraSaldoInicial').style.width = calcularPorcentagem(inicial) + '%';
    document.getElementById('barraRenovacoes').style.width = calcularPorcentagem(renovacoes) + '%';
    document.getElementById('barraNovos').style.width = calcularPorcentagem(novos) + '%';
    document.getElementById('barraEntradas').style.width = calcularPorcentagem(entradas) + '%';
    document.getElementById('barraSaidas').style.width = calcularPorcentagem(saidas) + '%';
    document.getElementById('barraSaldoFinal').style.width = calcularPorcentagem(final) + '%';
  }, 100);
}

function gerarConciliacao() {
  const estado = document.getElementById('estadoNome').value.trim();
  const dataSaldoInicial = document.getElementById('dataSaldoInicial').value;
  const dataSaldoFinal = document.getElementById('dataSaldoFinal').value;

  if (!estado) {
    alert("Por favor, informe o nome do Estado/Local.");
    document.getElementById('estadoNome').focus();
    return;
  }
  if (!dataSaldoInicial || !dataSaldoFinal) {
    alert("Por favor, preencha as datas de Saldo Inicial e Saldo Final.");
    return;
  }

  const inicial = parseFloat(String(document.getElementById('saldoInicial').value).replace(',', '.')) || 0;
  const final = parseFloat(String(document.getElementById('saldoFinal').value).replace(',', '.')) || 0;

  const totRenov = calcularTotal(listas.renovacao.data);
  const totNovos = calcularTotal(listas.novo.data);
  const totEntradas = calcularTotal(listas.entrada.data);
  const totSaidas = calcularTotal(listas.saida.data);

  // Totais calculados a partir das listas

  const saldoCalculado = inicial - totRenov - totNovos + totEntradas - totSaidas;
  let conciliacaoText = '';
  const separador = '='.repeat(60);

  conciliacaoText += `CONCILIAÇÃO ESPARTANO ${estado.toUpperCase()} DATA ${formatarData(dataSaldoInicial)}\n\n`;


  conciliacaoText += '*RENOVAÇÕES*:\n\n' + formatarListaItens(listas.renovacao.data) + '\n';
  conciliacaoText += '*NOVOS CLIENTES*:\n\n' + formatarListaItens(listas.novo.data) + '\n';
  conciliacaoText += '*SAÍDAS DIVERSAS*:\n\n' + formatarListaItens(listas.saida.data) + '\n';
  conciliacaoText += '*ENTRADAS DIVERSAS*:\n\n' + formatarListaItens(listas.entrada.data) + '\n';

  conciliacaoText += `${separador}\n\n`;
  conciliacaoText += `*SALDO INICIAL:* ${formatarMoeda(inicial)}\n`;
  conciliacaoText += `*TOTAL RENOVAÇÕES:* ${formatarMoeda(totRenov)}\n`;
  conciliacaoText += `*TOTAL NOVOS CLIENTES:* ${formatarMoeda(totNovos)}\n`;
  conciliacaoText += `*TOTAL ENTRADAS DIVERSAS:* ${formatarMoeda(totEntradas)}\n`;
  conciliacaoText += `*TOTAL SAÍDAS DIVERSAS:* ${formatarMoeda(totSaidas)}\n`;
  conciliacaoText += `*SALDO FINAL:* ${formatarMoeda(final)}\n`;
  

  const outputDiv = document.getElementById('conciliacaoOutput');
  outputDiv.textContent = conciliacaoText.trim();
  outputDiv.style.display = 'block';
  outputDiv.scrollIntoView({ behavior: 'smooth' });

  const copyContainer = document.getElementById('conciliacaoCopyContainer');
  if (copyContainer) {
    copyContainer.style.display = 'block';
  }
  outputDiv.scrollIntoView({ behavior: 'smooth' });

  document.getElementById('status').textContent = `Conciliação gerada em ${new Date().toLocaleTimeString('pt-BR')}`;
}

function copiarConciliacao(event) {
    event.preventDefault();
    const outputDiv = document.getElementById('conciliacaoOutput');
    const textToCopy = outputDiv.textContent.trim();

    if (!textToCopy) {
        alert('Não há texto de conciliação para copiar.');
        return;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Texto da Conciliação copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar texto com navigator.clipboard: ', err);
            fallbackCopyTextToClipboard(textToCopy);
        });
    } else {
        fallbackCopyTextToClipboard(textToCopy);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        console.log('Fallback: Copying text command was ' + (successful ? 'successful' : 'unsuccessful'));
        alert('Texto da Conciliação copiado para a área de transferência!');
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        alert('Erro ao copiar o texto. Por favor, selecione e copie manualmente.');
    }

    document.body.removeChild(textArea);
}

function togglePasteArea(tipo) {
  const area = document.getElementById(`pasteArea-${tipo}`);
  if (!area) return;

  const isHidden = area.style.display === 'none' || area.style.display === '';
  area.style.display = isHidden ? 'block' : 'none';

  if (isHidden) {
    const ta = document.getElementById(`pasteText-${tipo}`);
    if (ta) ta.focus();
  }
}

function handlePaste(event, tipo) {
  event.preventDefault();

  const pastedText = (event.clipboardData || window.clipboardData).getData('text');
  if (!pastedText || !pastedText.trim()) {
    alert("Nenhum dado foi colado.");
    return;
  }

  const linhas = pastedText.trim().split(/\r?\n/);
  let itensAdicionados = 0;

  linhas.forEach(linha => {
    if (!linha.trim()) return;

    const colunas = linha.split('\t');
    const nome = colunas[0] ? colunas[0].trim() : 'Item sem nome';

    let valor = 0;
    if (colunas[1]) {
      const valorStr = colunas[1].trim()
        .replace(/R\$|\s/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.');
      valor = parseFloat(valorStr) || 0;
    }

    listas[tipo].data.push({ nome, valor });
    itensAdicionados++;
  });

  const ta = document.getElementById(`pasteText-${tipo}`);
  if (ta) ta.value = '';
  togglePasteArea(tipo);

  atualizarTabela(tipo);
  atualizarResumo();

  alert(`${itensAdicionados} ${itensAdicionados === 1 ? 'item foi adicionado' : 'itens foram adicionados'} com sucesso!`);
}

function exportarExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Biblioteca XLSX não carregada. Por favor, recarregue a página.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const nomeEstadoRaw = document.getElementById('estadoNome').value.trim();
  const nomeEstado = (nomeEstadoRaw.replace(/\s+/g, '_') || 'Conciliacao');

  const inicial = parseFloat(String(document.getElementById('saldoInicial').value).replace(',', '.')) || 0;
  const final = parseFloat(String(document.getElementById('saldoFinal').value).replace(',', '.')) || 0;
  const dataIni = document.getElementById('dataSaldoInicial').value;
  const dataFim = document.getElementById('dataSaldoFinal').value;

  const totRenov = calcularTotal(listas.renovacao.data);
  const totNovos = calcularTotal(listas.novo.data);
  const totEntradas = calcularTotal(listas.entrada.data);
  const totSaidas = calcularTotal(listas.saida.data);

  // ALTERADO: Cálculo correto com renovações e novos clientes subtraindo
  const saldoCalculado = inicial - totRenov - totNovos + totEntradas - totSaidas;
  const diferenca = final - saldoCalculado;

  const resumoData = [
    ['RESUMO DA CONCILIAÇÃO', ''],
    ['Estado/Local:*', nomeEstadoRaw],
    ['Período:', (dataIni ? formatarData(dataIni) : 'N/D') + ' até ' + (dataFim ? formatarData(dataFim) : 'N/D')],
    ['', ''],
    ['SALDO INICIAL', inicial],
    ['(-) RENOVAÇÕES', totRenov],
    ['(-) NOVOS CLIENTES', totNovos],
    ['(+) ENTRADAS DIVERSAS', totEntradas],
    ['(-) SAÍDAS DIVERSAS', totSaidas],
    ['SALDO CALCULADO', saldoCalculado],
    ['SALDO FINAL EM CONTA', final],
    ['', ''],
    ['DIFERENÇA', diferenca],
    ['STATUS', Math.abs(diferenca) < 0.01 ? 'CONCILIADO' : 'NÃO CONCILIADO']
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), 'Resumo');

  const add = (data, name) => {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
  };

  add(
    [['#', 'Nome', 'Valor'], ...listas.renovacao.data.map((r, i) => [i + 1, r.nome, r.valor]), ['TOTAL', '', totRenov]],
    'Renovações'
  );
  add(
    [['#', 'Nome', 'Valor'], ...listas.novo.data.map((r, i) => [i + 1, r.nome, r.valor]), ['TOTAL', '', totNovos]],
    'Novos'
  );
  add(
    [['#', 'Descrição', 'Valor'], ...listas.entrada.data.map((r, i) => [i + 1, r.nome, r.valor]), ['TOTAL', '', totEntradas]],
    'Entradas'
  );
  add(
    [['#', 'Descrição', 'Valor'], ...listas.saida.data.map((r, i) => [i + 1, r.nome, r.valor]), ['TOTAL', '', totSaidas]],
    'Saídas'
  );

  const fileName = `${nomeEstado}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);

  document.getElementById('status').textContent = `Excel exportado: ${fileName}`;
}

function obterDadosAtuais() {
  return {
    estadoNome: document.getElementById('estadoNome').value,
    dataSaldoInicial: document.getElementById('dataSaldoInicial').value,
    saldoInicial: parseFloat(String(document.getElementById('saldoInicial').value).replace(',', '.')) || 0,
    dataSaldoFinal: document.getElementById('dataSaldoFinal').value,
    saldoFinal: parseFloat(String(document.getElementById('saldoFinal').value).replace(',', '.')) || 0,
    renovacoes: listas.renovacao.data,
    novos: listas.novo.data,
    entradas: listas.entrada.data,
    saidas: listas.saida.data
  };
}

function gerarLink(event) {
  const data = obterDadosAtuais();
  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('data', encodeURIComponent(JSON.stringify(data)));

  document.getElementById('linkGerado').textContent = url.toString();
  document.getElementById('linkContainer').style.display = 'block';

  if (event && event.target) {
    const textoOriginal = event.target.innerHTML;
    event.target.innerHTML = '<i class="fa-solid fa-check"></i> Link Gerado!';
    setTimeout(() => {
      event.target.innerHTML = textoOriginal;
    }, 2000);
  }

  document.getElementById('status').textContent = 'Link gerado com sucesso!';
}

function copiarLink(event) {
  const link = document.getElementById('linkGerado').textContent;
  const botao = event.target;

  navigator.clipboard.writeText(link).then(() => {
    const textoOriginal = botao.innerHTML;
    botao.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
    setTimeout(() => {
      botao.innerHTML = textoOriginal;
    }, 2000);
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    alert('Falha ao copiar o link. Por favor, copie manualmente.');
  });
}

function salvarLocal(event) {
  const data = obterDadosAtuais();
  localStorage.setItem('conciliacao_espartano2', JSON.stringify(data));

  const botao = event.target;
  const textoOriginal = botao.innerHTML;
  botao.innerHTML = '<i class="fa-solid fa-check"></i> Salvo!';
  setTimeout(() => {
    botao.innerHTML = textoOriginal;
  }, 2000);

  document.getElementById('status').textContent = 'Dados salvos localmente!';
}

function carregarDados(data) {
  if (!data) return;

  try {
    document.getElementById('estadoNome').value = data.estadoNome || '';
    document.getElementById('dataSaldoInicial').value = data.dataSaldoInicial || '';
    document.getElementById('saldoInicial').value = (data.saldoInicial || 0).toFixed(2);
    document.getElementById('dataSaldoFinal').value = data.dataSaldoFinal || '';
    document.getElementById('saldoFinal').value = (data.saldoFinal || 0).toFixed(2);

    listas.renovacao.data = data.renovacoes || [];
    listas.novo.data = data.novos || [];
    listas.entrada.data = data.entradas || [];
    listas.saida.data = data.saidas || [];

    for (const tipo in listas) {
      atualizarTabela(tipo);
    }
    atualizarResumo();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    alert("Não foi possível carregar os dados. O formato pode estar inválido.");
  }
}

function zerarTudo() {
  if (!confirm(" ATENÇÃO: Isso irá ZERAR TODOS OS CAMPOS e dados inseridos.\n\nDeseja realmente continuar?")) {
    return;
  }

  document.getElementById('estadoNome').value = '';
  document.getElementById('dataSaldoInicial').value = '';
  document.getElementById('saldoInicial').value = '0.00';
  document.getElementById('dataSaldoFinal').value = '';
  document.getElementById('saldoFinal').value = '0.00';

  for (const tipo in listas) {
    listas[tipo].data = [];
    atualizarTabela(tipo);
  }

  atualizarResumo();
  document.getElementById('conciliacaoOutput').style.display = 'none';
  document.getElementById('linkContainer').style.display = 'none';
  document.getElementById('status').textContent = 'Sistema zerado e pronto para uso';

  localStorage.removeItem('conciliacao_espartano2');
}

window.onload = () => {
  document.getElementById('dataAtual').textContent = new Date().toLocaleDateString('pt-BR');
  document.getElementById('horaAtual').textContent = new Date().toLocaleTimeString('pt-BR');

  setInterval(() => {
    document.getElementById('horaAtual').textContent = new Date().toLocaleTimeString('pt-BR');
  }, 1000);

  const dadosTransferidos = carregarDadosTransferidos();

  if (dadosTransferidos) {
    document.getElementById('status').textContent = 'Dados carregados da página de entrada detalhada.';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const dataFromUrl = urlParams.get('data');

  if (dataFromUrl) {
    try {
      carregarDados(JSON.parse(decodeURIComponent(dataFromUrl)));
      document.getElementById('status').textContent = 'Dados carregados do link compartilhado';
    } catch (e) {
      console.warn('Não foi possível ler os dados da URL:', e);
    }
  } else if (!dadosTransferidos) {
    const dataFromStorage = localStorage.getItem('conciliacao_espartano2');
    if (dataFromStorage) {
      try {
        carregarDados(JSON.parse(dataFromStorage));
        document.getElementById('status').textContent = 'Dados carregados do armazenamento local';
      } catch (e) {
        console.warn('Erro ao carregar dados do localStorage:', e);
      }
    } else {
      for (const tipo in listas) {
        atualizarTabela(tipo);
      }
      atualizarResumo();
      document.getElementById('status').textContent = 'Sistema pronto para uso';
    }
  }

  console.log('✓ Sistema ESPARTANO 2 inicializado com sucesso!');
};

function imprimirConciliacao() {
  atualizarResumo();

  const resumoEmpty = document.getElementById('resumoEmpty');
  if (resumoEmpty) {
    resumoEmpty.style.display = 'none';
  }

  const sidePanel = document.querySelector('.side');
  if (sidePanel) {
    sidePanel.style.display = 'none';
  }

  const printButton = document.querySelector('button[onclick="imprimirConciliacao()"]');
  if (printButton) {
    printButton.style.display = 'none';
  }

  window.print();

  setTimeout(() => {
    if (sidePanel) {
      sidePanel.style.display = 'flex'; 
    }
    if (printButton) {
      printButton.style.display = 'inline-flex'; 
    }

    if (resumoEmpty && document.getElementById('resumo').style.display === 'none') {
      resumoEmpty.style.display = 'block';
    }
  }, 100); 
}

function salvarNoBanco() {
  const estado = document.getElementById("estadoNome").value.trim().toUpperCase();
  const data = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");

  if (!estado) {
    alert("Por favor, preencha o nome do Estado/Local para salvar o PDF.");
    document.getElementById("estadoNome").focus();
    return;
  }

  gerarConciliacao();

  const tituloOriginal = document.title;
  document.title = `CONCILIACAO ${estado} ${data}`;

  window.print();

  setTimeout(() => {
    document.title = tituloOriginal;
  }, 500);
}

function alternarTema() {
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");
  const isLightTheme = body.classList.toggle("light-theme");

  if (isLightTheme) {
    localStorage.setItem("espartano2_theme", "light");
    themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
    themeToggle.title = "Alternar para Tema Escuro";
  } else {
    localStorage.setItem("espartano2_theme", "dark");
    themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
    themeToggle.title = "Alternar para Tema Claro";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("espartano2_theme");
  if (savedTheme === "light") {
    alternarTema();
  }
});
