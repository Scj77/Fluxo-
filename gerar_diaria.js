function formatarDataDiaria(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
}

function gerarTabelaDiaria() {
    const dataInicialInput = document.getElementById('dataInicial_diaria');
    const valorDiariaInput = document.getElementById('valorDiaria');
    const resultadoDiv = document.getElementById('resultadoDiaria');

    if (!dataInicialInput.value) {
        alert('⚠️ Por favor, selecione a Data de Início.');
        return;
    }

    const dataInicial = new Date(dataInicialInput.value + 'T00:00:00');
    const rawValor = valorDiariaInput.value || '';
    const valorDiaria = rawValor.trim() || '---';
    // Status: se o campo estiver vazio => NEUTRO, senão POSITIVO (>) ou NEGATIVO (<=)
    let statusGlobal, statusClass;
    if (rawValor.trim() === '') {
        statusGlobal = 'NEUTRO';
        statusClass = 'neutro';
    } else {
        const valorDiariaNum = parseFloat(String(rawValor).replace(',', '.')) || 0;
        if (valorDiariaNum > 0) {
            statusGlobal = 'POSITIVO';
            statusClass = 'positivo';
        } else {
            statusGlobal = 'NEGATIVO';
            statusClass = 'negativo';
        }
    }

    let tabelaHTML = `
        <div class="diaria-header">
            <p>*Valor Diária* *R$${valorDiaria}* <span class="diaria-status ${statusClass}">${statusGlobal}</span></p>
        </div>
        <ol class="diaria-list">
    `;

    let dataAtual = new Date(dataInicial);
    
    for (let i = 0; i < 20; i++) {
        const diaStr = formatarDataDiaria(dataAtual);
        tabelaHTML += `<li><span class="diaria-date">${diaStr}</span> <span class="diaria-status ${statusClass}">${statusGlobal}</span></li>`;
        dataAtual.setDate(dataAtual.getDate() + 1);
    }

    tabelaHTML += `</ol>`;
    resultadoDiv.innerHTML = tabelaHTML;
}

function copiarTabelaDiaria() {
    const resultadoDiv = document.getElementById('resultadoDiaria');
    if (!resultadoDiv.textContent.trim()) {
        alert('⚠️ Gere a tabela de diárias primeiro.');
        return;
    }

    const rawValorCopy = document.getElementById('valorDiaria').value || '';
    const valorDiaria = rawValorCopy.trim() || '---';
    let statusGlobalCopy;
    if (rawValorCopy.trim() === '') {
        statusGlobalCopy = 'NEUTRO';
    } else {
        const valorDiariaNum = parseFloat(String(rawValorCopy).replace(',', '.')) || 0;
        statusGlobalCopy = valorDiariaNum > 0 ? 'POSITIVO' : 'NEGATIVO';
    }
    let textoCopia = `*Valor Diária* *R$${valorDiaria}* - ${statusGlobalCopy}\n\n`;
    
    const lista = resultadoDiv.querySelector('.diaria-list');
    if (lista) {
        Array.from(lista.children).forEach((li, index) => {
            // Incluir o texto do item (data e status)
            textoCopia += `${index + 1}. ${li.textContent}\n`;
        });
    }

    navigator.clipboard.writeText(textoCopia).then(() => {
        const btn = document.getElementById('btnCopiarDiaria');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
        setTimeout(() => {
            btn.innerHTML = textoOriginal;
        }, 2000);
    }).catch(err => {
        alert('❌ Erro ao copiar: ' + err);
    });
}
