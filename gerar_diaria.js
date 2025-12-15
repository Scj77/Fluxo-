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
    const valorDiaria = valorDiariaInput.value.trim() || '---';

    let tabelaHTML = `
        <div class="diaria-header">
            <p>*Valor Diária* *R$${valorDiaria}*</p>
        </div>
        <ol class="diaria-list">
    `;

    let dataAtual = new Date(dataInicial);
    
    for (let i = 0; i < 20; i++) {
        tabelaHTML += `<li>${formatarDataDiaria(dataAtual)}</li>`;
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

    const valorDiaria = document.getElementById('valorDiaria').value.trim() || '---';
    let textoCopia = `*Valor Diária* *R$${valorDiaria}*\n\n`;
    
    const lista = resultadoDiv.querySelector('.diaria-list');
    if (lista) {
        Array.from(lista.children).forEach((li, index) => {
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
