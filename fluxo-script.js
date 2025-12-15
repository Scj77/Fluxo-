// Variáveis globais
let chartInstance = null;
let estadoNome = '';
let dataSaldoInicial = '';
let dataSaldoFinal = '';

// Funções de formatação
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

// Carregar dados do localStorage
function carregarDadosDoIndex() {
  try {
    // Tentar carregar dados do localStorage (formato novo ou antigo)
    let data = null;
    
    // Primeiro, tenta carregar do formato novo (conciliacao_espartano2)
    const dataFromStorage = localStorage.getItem('conciliacao_espartano2');
    if (dataFromStorage) {
      data = JSON.parse(dataFromStorage);
    }

    if (!data) {
      // Se não encontrou, retorna sem dados
      mostrarMensagemVazia();
      return;
    }

    const estadoNomeStored = data.estadoNome || 'Estado/Local não informado';
    const saldoInicial = data.saldoInicial || 0;
    const saldoFinal = data.saldoFinal || 0;
    const dataSaldoInicialStored = data.dataSaldoInicial || '';
    const dataSaldoFinalStored = data.dataSaldoFinal || '';

    // Carregar listas
    const renovacoes = data.renovacoes || [];
    const novos = data.novos || [];
    const entradas = data.entradas || [];
    const saidas = data.saidas || [];

    // Armazenar globalmente
    estadoNome = estadoNomeStored;
    dataSaldoInicial = dataSaldoInicialStored;
    dataSaldoFinal = dataSaldoFinalStored;

    // Calcular totais
    const totRenovacoes = calcularTotal(renovacoes);
    const totNovos = calcularTotal(novos);
    const totEntradas = calcularTotal(entradas);
    const totSaidas = calcularTotal(saidas);

    // Atualizar interface
    atualizarFluxo(saldoInicial, saldoFinal, totRenovacoes, totNovos, totEntradas, totSaidas);
    atualizarResumo(saldoInicial, saldoFinal, totRenovacoes, totNovos, totEntradas, totSaidas);
    atualizarGrafico(saldoInicial, saldoFinal, totRenovacoes, totNovos, totEntradas, totSaidas);

  } catch (e) {
    console.error("Erro ao carregar dados:", e);
    mostrarMensagemVazia();
  }
}

function mostrarMensagemVazia() {
  // Mostrar mensagem de que nenhum dado foi encontrado
  const container = document.querySelector('main');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: var(--card-bg); border-radius: 8px; margin: 20px;">
        <i class="fa-solid fa-inbox" style="font-size: 3rem; color: var(--muted); margin-bottom: 20px; display: block;"></i>
        <h2>Nenhum dado disponível</h2>
        <p style="color: var(--muted); margin: 15px 0;">Nenhum dado de conciliação foi encontrado no armazenamento local.</p>
        <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 20px;">Por favor, acesse a página de <strong>Conciliação</strong> e preencha os dados antes de visualizar a análise de fluxo.</p>
        <button onclick="window.location.href='index.html'" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
          <i class="fa-solid fa-arrow-left"></i> Voltar para Conciliação
        </button>
      </div>
    `;
  }
}

function calcularTotal(itens) {
  return (itens || []).reduce((total, item) => total + (Number(item.valor) || 0), 0);
}

function atualizarFluxo(saldoInicial, saldoFinal, renovacoes, novos, entradas, saidas) {
  // Cálculos
  const diferenca = saldoInicial - saldoFinal;
  const fluxo = diferenca - renovacoes - novos + entradas - saidas;

  // Atualizar card de cálculo
  document.getElementById('calcSaldoInicial').textContent = formatarMoeda(saldoInicial);
  document.getElementById('calcSaldoFinal').textContent = formatarMoeda(saldoFinal);
  document.getElementById('calcDiferenca').textContent = formatarMoeda(diferenca);
  document.getElementById('calcRenovacoes').textContent = formatarMoeda(renovacoes);
  document.getElementById('calcNovos').textContent = formatarMoeda(novos);
  document.getElementById('calcEntradas').textContent = formatarMoeda(entradas);
  document.getElementById('calcSaidas').textContent = formatarMoeda(saidas);

  // Atualizar valor do fluxo
  const fluxoValorEl = document.getElementById('fluxoValor');
  fluxoValorEl.textContent = formatarMoeda(fluxo);
  fluxoValorEl.className = 'fluxo-value';

  // Atualizar status
  const statusEl = document.getElementById('fluxoStatus');
  const interpretacaoEl = document.getElementById('fluxoInterpretacao');
  
  statusEl.className = 'fluxo-status';

  if (Math.abs(fluxo) < 0.01) {
    fluxoValorEl.classList.add('equilibrado');
    statusEl.classList.add('equilibrado');
    statusEl.textContent = 'EQUILIBRADO';
    interpretacaoEl.textContent = 'Fluxo equilibrado - Nenhuma diferença detectada';
  } else if (fluxo > 0) {
    fluxoValorEl.classList.add('positivo');
    statusEl.classList.add('superavit');
    statusEl.textContent = 'SUPERÁVIT';
    interpretacaoEl.textContent = `Superávit de ${formatarMoeda(fluxo)} - Entrada maior que saída`;
  } else {
    fluxoValorEl.classList.add('negativo');
    statusEl.classList.add('deficit');
    statusEl.textContent = 'DÉFICIT';
    interpretacaoEl.textContent = `Déficit de ${formatarMoeda(Math.abs(fluxo))} - Saída maior que entrada`;
  }
}

function atualizarResumo(saldoInicial, saldoFinal, renovacoes, novos, entradas, saidas) {
  const diferenca = saldoInicial - saldoFinal;
  const fluxo = diferenca - renovacoes - novos + entradas - saidas;

  document.getElementById('resSaldoInicial').textContent = formatarMoeda(saldoInicial);
  document.getElementById('resRenovacoes').textContent = formatarMoeda(renovacoes);
  document.getElementById('resNovos').textContent = formatarMoeda(novos);
  document.getElementById('resEntradas').textContent = formatarMoeda(entradas);
  document.getElementById('resSaidas').textContent = formatarMoeda(saidas);
  document.getElementById('resSaldoFinal').textContent = formatarMoeda(saldoFinal);
  document.getElementById('resFluxoTotal').textContent = formatarMoeda(fluxo);

  // Atualizar status
  const statusEl = document.getElementById('resStatus');
  if (Math.abs(fluxo) < 0.01) {
    statusEl.textContent = 'EQUILIBRADO';
    statusEl.style.color = 'var(--info)';
  } else if (fluxo > 0) {
    statusEl.textContent = 'SUPERÁVIT';
    statusEl.style.color = 'var(--success)';
  } else {
    statusEl.textContent = 'DÉFICIT';
    statusEl.style.color = 'var(--danger)';
  }
}

function atualizarGrafico(saldoInicial, saldoFinal, renovacoes, novos, entradas, saidas) {
  const ctx = document.getElementById('fluxoChart').getContext('2d');
  
  // Destruir gráfico anterior se existir
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Preparar dados para o gráfico
  const dados = [
    { label: 'Saldo Inicial', valor: saldoInicial, cor: '#2196F3' },
    { label: 'Renovações', valor: renovacoes, cor: '#FF9800' },
    { label: 'Novos Clientes', valor: novos, cor: '#F44336' },
    { label: 'Entradas Diversas', valor: entradas, cor: '#4CAF50' },
    { label: 'Saídas Diversas', valor: saidas, cor: '#9C27B0' },
    { label: 'Saldo Final', valor: saldoFinal, cor: '#00BCD4' }
  ];

  // Filtrar dados com valores diferentes de zero
  const dadosFiltrados = dados.filter(d => Math.abs(d.valor) > 0.01);

  if (dadosFiltrados.length === 0) {
    // Se não houver dados, mostrar mensagem
    ctx.fillStyle = 'var(--muted)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhum dado para exibir', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: dadosFiltrados.map(d => d.label),
      datasets: [{
        data: dadosFiltrados.map(d => Math.abs(d.valor)),
        backgroundColor: dadosFiltrados.map(d => d.cor),
        borderColor: 'var(--card-bg)',
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            color: 'var(--text)'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const valor = context.parsed;
              return formatarMoeda(valor);
            }
          }
        }
      }
    }
  });
}

function exportarPDF() {
  const elemento = document.querySelector('main');
  const opt = {
    margin: 10,
    filename: `fluxo_${estadoNome}_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  };

  html2pdf().set(opt).from(elemento).save();
}

function exportarJPG() {
  const canvas = document.getElementById('fluxoChart');
  
  // Usar html2canvas para capturar a tela
  html2canvas(document.querySelector('main'), {
    scale: 2,
    backgroundColor: '#ffffff'
  }).then(canvas => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.download = `fluxo_${estadoNome}_${new Date().toISOString().split('T')[0]}.jpg`;
    link.click();
  });
}

function exportarExcel() {
  // Preparar dados para Excel
  const saldoInicial = parseFloat(localStorage.getItem('saldoInicial') || '0');
  const saldoFinal = parseFloat(localStorage.getItem('saldoFinal') || '0');
  const renovacoes = JSON.parse(localStorage.getItem('listas_renovacao') || '[]');
  const novos = JSON.parse(localStorage.getItem('listas_novo') || '[]');
  const entradas = JSON.parse(localStorage.getItem('listas_entrada') || '[]');
  const saidas = JSON.parse(localStorage.getItem('listas_saida') || '[]');

  const totRenovacoes = calcularTotal(renovacoes);
  const totNovos = calcularTotal(novos);
  const totEntradas = calcularTotal(entradas);
  const totSaidas = calcularTotal(saidas);

  const diferenca = saldoInicial - saldoFinal;
  const fluxo = diferenca - totRenovacoes - totNovos + totEntradas - totSaidas;

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Aba 1: Resumo
  const resumoData = [
    ['ANÁLISE DE FLUXO FINANCEIRO'],
    ['Estado/Local:', estadoNome],
    ['Data Inicial:', formatarData(dataSaldoInicial)],
    ['Data Final:', formatarData(dataSaldoFinal)],
    [],
    ['RESUMO FINANCEIRO'],
    ['Saldo Inicial', saldoInicial],
    ['Renovações', totRenovacoes],
    ['Novos Clientes', totNovos],
    ['Entradas Diversas', totEntradas],
    ['Saídas Diversas', totSaidas],
    ['Saldo Final', saldoFinal],
    [],
    ['CÁLCULO DO FLUXO'],
    ['Diferença (SI - SF)', diferenca],
    ['Fluxo Total', fluxo],
    ['Status', fluxo > 0 ? 'SUPERÁVIT' : (fluxo < 0 ? 'DÉFICIT' : 'EQUILIBRADO')]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');

  // Aba 2: Renovações
  if (renovacoes.length > 0) {
    const renovacaoData = [['Nome', 'Valor']];
    renovacoes.forEach(r => renovacaoData.push([r.nome, r.valor]));
    renovacaoData.push(['TOTAL', totRenovacoes]);
    const ws2 = XLSX.utils.aoa_to_sheet(renovacaoData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Renovações');
  }

  // Aba 3: Novos Clientes
  if (novos.length > 0) {
    const novosData = [['Nome', 'Valor']];
    novos.forEach(n => novosData.push([n.nome, n.valor]));
    novosData.push(['TOTAL', totNovos]);
    const ws3 = XLSX.utils.aoa_to_sheet(novosData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Novos Clientes');
  }

  // Aba 4: Entradas Diversas
  if (entradas.length > 0) {
    const entradasData = [['Descrição', 'Valor']];
    entradas.forEach(e => entradasData.push([e.nome, e.valor]));
    entradasData.push(['TOTAL', totEntradas]);
    const ws4 = XLSX.utils.aoa_to_sheet(entradasData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Entradas Diversas');
  }

  // Aba 5: Saídas Diversas
  if (saidas.length > 0) {
    const saidasData = [['Descrição', 'Valor']];
    saidas.forEach(s => saidasData.push([s.nome, s.valor]));
    saidasData.push(['TOTAL', totSaidas]);
    const ws5 = XLSX.utils.aoa_to_sheet(saidasData);
    XLSX.utils.book_append_sheet(wb, ws5, 'Saídas Diversas');
  }

  // Salvar arquivo
  XLSX.writeFile(wb, `fluxo_${estadoNome}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function mostrarMensagemErro(mensagem) {
  alert(mensagem);
}

// Inicializar ao carregar a página
window.addEventListener('DOMContentLoaded', function() {
  carregarDadosDoIndex();
});
