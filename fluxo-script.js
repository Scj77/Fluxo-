// Variáveis globais
let chartInstance = null;
let estadoNome = '';
let dataSaldoInicial = '';
let dataSaldoFinal = '';
let chartScale = 1;
const CHART_SCALE_MIN = 0.6;
const CHART_SCALE_MAX = 3;
const CHART_SCALE_STEP = 0.1;

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

// Converte hex (#RRGGBB) para rgba(r,g,b,a)
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,229,255,${alpha})`;
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const int = parseInt(h, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
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

    // Se não encontrou no localStorage, tentar buscar no parâmetro 'data' da URL (permite compartilhar link)
    if (!data) {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get('data');
      if (dataParam) {
        try {
          data = JSON.parse(decodeURIComponent(dataParam));
        } catch (e) {
          console.warn('Falha ao parsear param data:', e);
        }
      }
    }

    if (!data) {
      // Se não encontrou, mostra instrução de como carregar dados
      mostrarMensagemVazia();
      const statusEl = document.getElementById('status');
      if (statusEl) statusEl.textContent = 'Nenhum dado encontrado. Vá até a página de Conciliação e clique em "Salvar" ou gere um link.';
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

// --------------------------------------------------
// Funções: Colar Totais diretamente na página de Fluxo
// --------------------------------------------------
function togglePasteAreaFluxo() {
  const area = document.getElementById('pasteArea-fluxo');
  if (!area) return;
  const opening = (area.style.display === 'none' || !area.style.display);
  area.style.display = opening ? 'block' : 'none';
  if (opening) {
    area.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const ta = document.getElementById('pasteText-fluxo');
    if (ta) ta.focus();
  }
}

function aplicarTotaisColadosFluxo() {
  const ta = document.getElementById('pasteText-fluxo');
  const feedback = document.getElementById('pasteFluxoFeedback');
  if (!ta) return;
  const text = ta.value || '';
  const parsed = parseTotaisFromTextFluxo(text);
  if (!parsed) {
    if (feedback) feedback.textContent = 'Nenhum total reconhecido. Verifique o formato e tente novamente.';
    return;
  }

  // aplicar nos cartões e no gráfico (sem alterar localStorage)
  const si = parsed.saldoInicial || 0;
  const sf = parsed.saldoFinal || 0;
  const renov = parsed.renovacoes || 0;
  const novos = parsed.novos || 0;
  const entr = parsed.entradas || 0;
  const said = parsed.saidas || 0;

  atualizarFluxo(si, sf, renov, novos, entr, said);
  atualizarResumo(si, sf, renov, novos, entr, said);
  atualizarGrafico(si, sf, renov, novos, entr, said);

  if (feedback) feedback.textContent = 'Totais aplicados com sucesso.';
  // manter área aberta por um instante para o usuário ver feedback
  setTimeout(() => {
    const area = document.getElementById('pasteArea-fluxo');
    if (area) area.style.display = 'none';
    // e rolar para o resumo para garantir visibilidade
    const resumo = document.querySelector('.resumo-total');
    if (resumo) {
      resumo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // destaque rápido
      resumo.classList.add('highlight');
      setTimeout(() => resumo.classList.remove('highlight'), 1500);
    }

    // Atualizar status no header
    const pageStatus = document.getElementById('pageStatus');
    if (pageStatus) pageStatus.textContent = 'Dados aplicados via colagem.';
    // Certificar que o painel de resumo e gráfico estão visíveis
    const graf = document.querySelector('.grafico-container');
    if (graf) graf.style.display = 'block';
    const resEl = document.querySelector('.resumo-total');
    if (resEl) resEl.style.display = 'block';
      // Garantir que os cards de cálculo e resultado fiquem visíveis
      scrollToElementWithOffset('.fluxo-container', 80);
  }, 900);
}

// Rola um elemento para a vista com deslocamento (compensa cabeçalho)
function scrollToElementWithOffset(sel, offset = 80) {
  const el = document.querySelector(sel);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const top = window.scrollY + rect.top - offset;
  window.scrollTo({ top: top > 0 ? top : 0, behavior: 'smooth' });
}

function parseTotaisFromTextFluxo(text) {
  if (!text || !text.trim()) return null;
  const linhas = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {};

  const parseNumber = (str) => {
    if (!str) return null;
    const cleaned = String(str).replace(/R\$|\s/g, '').match(/-?[\d\.\,]+/);
    if (!cleaned) return null;
    let s = cleaned[0].replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  };

  linhas.forEach(l => {
    const low = l.toLowerCase();
    if (low.includes('saldo inicial')) {
      result.saldoInicial = parseNumber(l);
    } else if (low.includes('saldo final')) {
      result.saldoFinal = parseNumber(l);
    } else if (low.includes('renov')) {
      result.renovacoes = parseNumber(l);
    } else if (low.includes('novos')) {
      result.novos = parseNumber(l);
    } else if (low.includes('entrad')) {
      result.entradas = parseNumber(l);
    } else if (low.includes('saíd') || low.includes('saidas') || low.includes('saídas')) {
      result.saidas = parseNumber(l);
    }
  });

  return Object.keys(result).length ? result : null;
}

function calcularTotal(itens) {
  return (itens || []).reduce((total, item) => total + (Number(item.valor) || 0), 0);
}

function atualizarFluxo(saldoInicial, saldoFinal, renovacoes, novos, entradas, saidas) {
  // Cálculos
  // A diferença deve ser Saldo Final - Saldo Inicial (positivo indica aumento)
  const diferenca = saldoFinal - saldoInicial;
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
    statusEl.textContent = `EQUILIBRADO - ${formatarMoeda(fluxo)}`;
    interpretacaoEl.textContent = 'Fluxo equilibrado - Nenhuma diferença detectada';
  } else if (fluxo > 0) {
    fluxoValorEl.classList.add('positivo');
    statusEl.classList.add('superavit');
    statusEl.textContent = `SUPERÁVIT - ${formatarMoeda(fluxo)}`;
    interpretacaoEl.textContent = `Superávit de ${formatarMoeda(fluxo)} - Entrada maior que saída`;
  } else {
    fluxoValorEl.classList.add('negativo');
    statusEl.classList.add('deficit');
    statusEl.textContent = `DÉFICIT - ${formatarMoeda(Math.abs(fluxo))}`;
    interpretacaoEl.textContent = `Déficit de ${formatarMoeda(Math.abs(fluxo))} - Saída maior que entrada`;
  }
}

function atualizarResumo(saldoInicial, saldoFinal, renovacoes, novos, entradas, saidas) {
  const diferenca = saldoFinal - saldoInicial;
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
    statusEl.textContent = `EQUILIBRADO - ${formatarMoeda(fluxo)}`;
    statusEl.style.color = 'var(--info)';
  } else if (fluxo > 0) {
    statusEl.textContent = `SUPERÁVIT - ${formatarMoeda(fluxo)}`;
    statusEl.style.color = 'var(--success)';
  } else {
    statusEl.textContent = `DÉFICIT - ${formatarMoeda(Math.abs(fluxo))}`;
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

  // Registrar plugin datalabels (já carregado via CDN) antes de criar o gráfico
  if (Chart && Chart.register && window.ChartDataLabels) {
    try { Chart.register(window.ChartDataLabels); } catch (e) { console.warn('Erro ao registrar ChartDataLabels', e); }
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
        datalabels: {
          // Desativado: remover valores sobrepostos no gráfico conforme solicitado
          display: false
        },
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
              const dataArr = context.dataset.data;
              const total = dataArr.reduce((s, v) => s + v, 0) || 1;
              const percent = ((valor / total) * 100).toFixed(2);
              return `${formatarMoeda(valor)} (${percent}%)`;
            }
          }
        }
      }
      ,
      onClick: function(evt, activeEls) {
        if (!activeEls || activeEls.length === 0) return;
        const idx = activeEls[0].index;
        const label = this.data.labels[idx];
        const val = this.data.datasets[0].data[idx];
        const total = this.data.datasets[0].data.reduce((s, v) => s + v, 0) || 1;
        const percent = ((val / total) * 100).toFixed(2);
        showSliceDetails(label, val, percent);
      }
    }
  });

  // Aplicar escala inicial e configurar handlers de zoom/recuperação
  applyChartScale();
  setupChartZoom();

  // Atualizar LED border com cores e valores do gráfico
  const graf = document.querySelector('.grafico-container');
  if (graf) createLedBorder(graf, 120, 15000, dadosFiltrados.map(d => d.label), dadosFiltrados.map(d => Math.abs(d.valor)), dadosFiltrados.map(d => d.cor));

  // Registrar plugin datalabels (já carregado via CDN)
  if (Chart && Chart.register && window.ChartDataLabels) {
    Chart.register(window.ChartDataLabels);
  }
}

function showSliceDetails(label, value, percent) {
  const details = document.getElementById('sliceDetails');
  const lbl = document.getElementById('sliceLabel');
  const content = document.getElementById('sliceContent');
  if (!details || !lbl || !content) return;
  lbl.textContent = label;
  content.innerHTML = `<div><strong>Valor:</strong> ${formatarMoeda(value)}</div><div style="margin-top:6px;"><strong>Percentual:</strong> ${percent}%</div>`;
  details.style.display = 'block';
  details.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ZOOM: controle de escala visual do canvas (funciona bem para doughnut)
function applyChartScale() {
  const canvas = document.getElementById('fluxoChart');
  if (!canvas) return;
  canvas.style.transform = `scale(${chartScale})`;
  canvas.style.transformOrigin = 'center center';
}

function resetChartZoom() {
  chartScale = 1;
  applyChartScale();
}

function setupChartZoom() {
  const canvas = document.getElementById('fluxoChart');
  if (!canvas) return;
  // habilitar transição suave
  canvas.style.transition = 'transform 0.12s ease';

  canvas.addEventListener('wheel', function (e) {
    // permitir prevenir scroll da página enquanto estiver sobre o gráfico
    e.preventDefault();
    if (e.deltaY < 0) {
      chartScale = Math.min(CHART_SCALE_MAX, +(chartScale + CHART_SCALE_STEP).toFixed(2));
    } else {
      chartScale = Math.max(CHART_SCALE_MIN, +(chartScale - CHART_SCALE_STEP).toFixed(2));
    }
    applyChartScale();
  }, { passive: false });

  // duplo clique reseta
  canvas.addEventListener('dblclick', function () {
    resetChartZoom();
  });

  // botão de reset
  const btn = document.getElementById('resetZoomBtn');
  if (btn) btn.addEventListener('click', resetChartZoom);
}

// LED border: cria pequenos LEDs ao redor da borda do container e anima um "chase" que percorre toda a borda em 15s
function createLedBorder(container, count = 48, cycleMs = 15000, labels = [], values = [], colors = []) {
  if (!container) return;
  // limpar anterior
  const existing = container.querySelector('.led-border');
  if (existing) {
    if (existing._stop) existing._stop();
    existing.remove();
  }

  const ring = document.createElement('div');
  ring.className = 'led-border';
  container.appendChild(ring);

  const dots = [];
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div'); d.className = 'led-dot'; ring.appendChild(d); dots.push(d);
  }

  function positionDots() {
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const perim = 2 * (w + h);
    const spacing = perim / count;
    // prepare cumulative fractions for value-based coloring
    let cum = [];
    const vals = (values && values.length) ? values.slice() : [];
    const totalVals = vals.reduce((s, v) => s + (Number(v) || 0), 0);
    if (totalVals > 0) {
      let s = 0;
      for (let i = 0; i < vals.length; i++) { s += vals[i]; cum.push(s / totalVals); }
    }
    dots.forEach((dot, i) => {
      const t = (i / count) * perim;
      let x = 0, y = 0;
      let side = '';
      if (t < w) { x = t; y = -8; side = 'top'; }
      else if (t < w + h) { x = w + 8; y = t - w; side = 'right'; }
      else if (t < w + h + w) { x = w - (t - w - h); y = h + 8; side = 'bottom'; }
      else { x = -8; y = h - (t - w - h - w); side = 'left'; }

      // ajusta o tamanho do segmento para cobrir o espaçamento, evitando gaps
      // aumentar um pouco para garantir sobreposição nas junções (remove gaps)
      const segSize = Math.max(6, Math.round(spacing * 1.1 + 2));
      if (side === 'top' || side === 'bottom') {
        dot.style.width = segSize + 'px';
        dot.style.height = '6px';
      } else {
        dot.style.width = '6px';
        dot.style.height = segSize + 'px';
      }

      dot.style.left = `${Math.round(x)}px`;
      dot.style.top = `${Math.round(y)}px`;
      // color mapping based on cumulative values (maps length fraction to slices)
      if (cum.length > 0 && colors && colors.length) {
        const frac = t / perim;
        let idxColor = cum.findIndex(c => frac <= c);
        if (idxColor === -1) idxColor = colors.length - 1;
        const c = colors[idxColor] || '#00e5ff';
        dot.dataset.baseColor = c;
        dot.style.background = hexToRgba(c, 0.08);
      } else if (colors && colors.length) {
        const c = colors[i % colors.length];
        dot.dataset.baseColor = c;
        dot.style.background = hexToRgba(c, 0.08);
      }
      // orientation classes for styling (horizontal for top/bottom, vertical for sides)
      if (side === 'top' || side === 'bottom') { dot.classList.add('horizontal'); dot.classList.remove('vertical'); }
      else { dot.classList.add('vertical'); dot.classList.remove('horizontal'); }
    });
  }

  positionDots();
  window.addEventListener('resize', positionDots);

  let idx = 0;
  const stepMs = Math.max(8, Math.floor(cycleMs / count));
  let timer = null;

  // Snake animation: activate a short trail of segments to form a snake-like effect
  const snakeLength = Math.max(4, Math.floor(count * 0.12));
  function start() {
    if (timer) return;
    // set baseline
    dots.forEach(d => { d.classList.remove('active'); d.style.opacity = '0.18'; d.style.boxShadow = ''; });
    timer = setInterval(() => {
      // reset baseline opacity
      dots.forEach(d => { d.classList.remove('active'); d.style.opacity = '0.18'; d.style.boxShadow = ''; });
      for (let j = 0; j < snakeLength; j++) {
        const pos = (idx - j + dots.length) % dots.length;
        const intensity = 1 - (j / snakeLength);
        const dot = dots[pos];
        dot.classList.add('active');
        // progressive opacity and glow using segment's base color
        const base = dot.dataset.baseColor || '#00e5ff';
        const op = (0.25 + 0.75 * intensity).toFixed(3);
        dot.style.opacity = op;
        dot.style.boxShadow = `0 0 ${8 * intensity}px ${hexToRgba(base, 0.9)}`;
        // gradient for active segment
        dot.style.background = `linear-gradient(90deg, ${hexToRgba(base,1)}, ${hexToRgba(base,0.35)})`;
      }
      idx = (idx + 1) % dots.length;
    }, stepMs);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    dots.forEach(d => { d.classList.remove('active'); d.style.opacity = '0.18'; d.style.boxShadow = ''; });
  }

  // Pausar em hover e retomar ao sair
  container.addEventListener('mouseenter', stop);
  container.addEventListener('mouseleave', start);

  // Botão de toggle global
  const toggleBtn = document.getElementById('ledToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (timer) { stop(); toggleBtn.textContent = 'Ativar LEDs'; }
      else { start(); toggleBtn.textContent = 'Pausar LEDs'; }
    });
  }

  ring._stop = () => { stop(); window.removeEventListener('resize', positionDots); };

  // iniciar
  start();
}

function hideSliceDetails() {
  const details = document.getElementById('sliceDetails');
  if (details) details.style.display = 'none';
}

/* Drilldown modal and helper functions removed per revert request */

function exportarPDF() {
  const elemento = document.querySelector('main');
  // Exportar centralizado em folha de ofício (mm: 216 x 330)
  const PAGE_W_MM = 216;
  const PAGE_H_MM = 330;

  // Medir elemento em pixels e converter para mm (assume 96dpi)
  const rect = elemento.getBoundingClientRect();
  const pxToMm = (px) => (px * 25.4) / 96;
  const contentWmm = pxToMm(rect.width);
  const contentHmm = pxToMm(rect.height);

  // Calcular margens para centralizar (mínimo 5mm)
  const leftMargin = Math.max(5, (PAGE_W_MM - contentWmm) / 2);
  const topMargin = Math.max(5, (PAGE_H_MM - contentHmm) / 2);

  const opt = {
    margin: [topMargin, leftMargin, topMargin, leftMargin],
    filename: `fluxo_${estadoNome}_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: [PAGE_W_MM, PAGE_H_MM] }
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

  const diferenca = saldoFinal - saldoInicial;
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
    ['Diferença (Saldo Final - Saldo Inicial)', diferenca],
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
/* Test helper removed per revert request */
