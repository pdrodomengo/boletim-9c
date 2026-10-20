// Configuração fixa do aluno
const CONFIG_ALUNO = {
    turma: "9C",
    numeroChamada: 29,
    apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável para manter o PIN somente em memória durante a sessão
let pinSessao = "";

// Estado local dos dados do boletim
let disciplinasAtuais = [];

// Modo de edição desativado por padrão
let modoEdicao = false;

// Dados fictícios padronizados das 15 disciplinas do 9º Ano (Dados Antigos do Projeto)
const dadosBoletimLocal = [
    { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
    { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
    { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
    { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
    { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
    { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
    { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
    { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
    { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
    { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
    { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
    { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
    { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
    { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
    { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Função para normalizar notas antigas do projeto (escala 0-100 para 0-10, vírgula, etc.)
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    let notaString = String(valor).replace(',', '.');
    let notaNum = parseFloat(notaString);

    if (isNaN(notaNum)) {
        return null;
    }

    if (notaNum > 10 && notaNum <= 100) {
        notaNum = notaNum / 10;
    }

    if (notaNum >= 0 && notaNum <= 10) {
        return notaNum;
    }

    return null;
}

// Formatação para exibição
function formatarNotaExibicao(nota) {
    if (nota === null || nota === undefined) {
        return "—";
    }
    const notaNum = typeof nota === "number" ? nota : normalizarNota(nota);
    if (notaNum === null) return "—";
    return notaNum.toFixed(1).replace('.', ',');
}

// Acesso por PIN
async function fazerLogin() {
    const inputPin = document.getElementById("campo-pin-input");
    const msgStatus = document.getElementById("mensagem-status");
    const pinDigitado = inputPin.value.trim();

    if (!pinDigitado) {
        msgStatus.innerText = "Digite o PIN.";
        msgStatus.style.color = "#dc3545";
        return;
    }

    msgStatus.innerText = "Conectando...";
    msgStatus.style.color = "#0d6efd";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinDigitado
            })
        });

        if (resposta.status === 401) {
            msgStatus.innerText = "Turma, chamada ou PIN inválidos.";
            msgStatus.style.color = "#dc3545";
            return;
        }

        if (resposta.status === 429) {
            msgStatus.innerText = "Muitas tentativas. Aguarde um minuto e tente novamente.";
            msgStatus.style.color = "#dc3545";
            return;
        }

        if (!resposta.ok) {
            msgStatus.innerText = "Não foi possível conectar ao servidor. Tente novamente.";
            msgStatus.style.color = "#dc3545";
            return;
        }

        const resData = await resposta.json();

        // Salva o PIN na memória e limpa a tela
        pinSessao = pinDigitado;
        inputPin.value = "";

        // Oculta área de acesso e exibe o boletim
        document.getElementById("secao-acesso").style.display = "none";
        document.getElementById("conteudo-boletim").style.display = "block";

        // Regra para dados recebidos da API vs dados locais
        if (resData && resData.dados && Array.isArray(resData.dados.disciplinas) && resData.dados.disciplinas.length > 0) {
            disciplinasAtuais = resData.dados.disciplinas;
        } else {
            disciplinasAtuais = JSON.parse(JSON.stringify(dadosBoletimLocal));
        }

        renderizarBoletim();

    } catch (erro) {
        msgStatus.innerText = "Não foi possível conectar ao servidor. Tente novamente.";
        msgStatus.style.color = "#dc3545";
    }
}

// Renderização da tabela e dos cards
function renderizarBoletim() {
    const corpoTabela = document.getElementById("corpo-tabela");
    corpoTabela.innerHTML = "";

    let somaMediasGerais = 0;
    let qtdDisciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let qtdBomDesempenho = 0;
    let qtdAtencao = 0;

    disciplinasAtuais.forEach((item, index) => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const notasDisponiveis = [n1, n2, n3].filter(n => n !== null);

        let media = null;
        let situacaoTexto = "Nota ainda não disponível";
        let classeSituacao = "situacao-indisponivel";

        if (notasDisponiveis.length > 0) {
            const somaNotas = notasDisponiveis.reduce((acc, curr) => acc + curr, 0);
            media = somaNotas / notasDisponiveis.length;

            if (media >= 6.0) {
                situacaoTexto = "Bom desempenho";
                classeSituacao = "situacao-bom";
                qtdBomDesempenho++;
            } else {
                situacaoTexto = "Atenção";
                classeSituacao = "situacao-atencao";
                qtdAtencao++;
            }

            somaMediasGerais += media;
            qtdDisciplinasComMedia++;
        }

        const arrayFaltas = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
        const totalFaltasDisciplina = arrayFaltas.reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
        totalFaltasGeral += totalFaltasDisciplina;

        const tr = document.createElement("tr");

        if (modoEdicao) {
            // Célula do nome preservando DOM Seguro
            const tdNome = document.createElement("td");
            const strongNome = document.createElement("strong");
            strongNome.textContent = item.disciplina;
            tdNome.appendChild(strongNome);

            // Células dos Trimestres
            const tdT1 = document.createElement("td");
            tdT1.innerHTML = `<input type="text" class="input-edicao" id="edit-t1-${index}" value="${item.tri1 !== null && item.tri1 !== undefined ? item.tri1 : ''}">`;

            const tdT2 = document.createElement("td");
            tdT2.innerHTML = `<input type="text" class="input-edicao" id="edit-t2-${index}" value="${item.tri2 !== null && item.tri2 !== undefined ? item.tri2 : ''}">`;

            const tdT3 = document.createElement("td");
            tdT3.innerHTML = `<input type="text" class="input-edicao" id="edit-t3-${index}" value="${item.tri3 !== null && item.tri3 !== undefined ? item.tri3 : ''}">`;

            const tdMedia = document.createElement("td");
            const strongMedia = document.createElement("strong");
            strongMedia.textContent = formatarNotaExibicao(media);
            tdMedia.appendChild(strongMedia);

            // Células de Faltas
            const tdFaltas = document.createElement("td");
            const f1 = arrayFaltas[0] !== undefined ? arrayFaltas[0] : 0;
            const f2 = arrayFaltas[1] !== undefined ? arrayFaltas[1] : 0;
            const f3 = arrayFaltas[2] !== undefined ? arrayFaltas[2] : 0;
            tdFaltas.innerHTML = `
                <input type="text" class="input-edicao" id="edit-f1-${index}" value="${f1}" title="Faltas 1º Tri">
                <input type="text" class="input-edicao" id="edit-f2-${index}" value="${f2}" title="Faltas 2º Tri">
                <input type="text" class="input-edicao" id="edit-f3-${index}" value="${f3}" title="Faltas 3º Tri">
            `;

            const tdSit = document.createElement("td");
            tdSit.className = classeSituacao;
            tdSit.textContent = situacaoTexto;

            tr.appendChild(tdNome);
            tr.appendChild(tdT1);
            tr.appendChild(tdT2);
            tr.appendChild(tdT3);
            tr.appendChild(tdMedia);
            tr.appendChild(tdFaltas);
            tr.appendChild(tdSit);

        } else {
            // Visualização Normal com DOM Seguro para nomes da API
            const tdNome = document.createElement("td");
            const strongNome = document.createElement("strong");
            strongNome.textContent = item.disciplina;
            tdNome.appendChild(strongNome);

            const tdT1 = document.createElement("td");
            tdT1.textContent = formatarNotaExibicao(n1);

            const tdT2 = document.createElement("td");
            tdT2.textContent = formatarNotaExibicao(n2);

            const tdT3 = document.createElement("td");
            tdT3.textContent = formatarNotaExibicao(n3);

            const tdMedia = document.createElement("td");
            const strongMedia = document.createElement("strong");
            strongMedia.textContent = formatarNotaExibicao(media);
            tdMedia.appendChild(strongMedia);

            const tdFaltas = document.createElement("td");
            tdFaltas.textContent = totalFaltasDisciplina;

            const tdSit = document.createElement("td");
            tdSit.className = classeSituacao;
            tdSit.textContent = situacaoTexto;

            tr.appendChild(tdNome);
            tr.appendChild(tdT1);
            tr.appendChild(tdT2);
            tr.appendChild(tdT3);
            tr.appendChild(tdMedia);
            tr.appendChild(tdFaltas);
            tr.appendChild(tdSit);
        }

        corpoTabela.appendChild(tr);
    });

    const mediaGeralGlobal = qtdDisciplinasComMedia > 0 ? (somaMediasGerais / qtdDisciplinasComMedia).toFixed(1).replace('.', ',') : "—";

    document.getElementById("card-media-geral").innerText = mediaGeralGlobal;
    document.getElementById("card-total-faltas").innerText = totalFaltasGeral;
    document.getElementById("card-bom-desempenho").innerText = qtdBomDesempenho;
    document.getElementById("card-atencao").innerText = qtdAtencao;
}

// Alterna modo de edição
function alternarModoEdicao() {
    modoEdicao = !modoEdicao;
    const btnSalvar = document.getElementById("btn-salvar-dados");
    const btnEdicao = document.getElementById("btn-alternar-edicao");
    const statusSalvar = document.getElementById("status-salvamento");

    statusSalvar.innerText = "";

    if (modoEdicao) {
        btnEdicao.innerText = "Cancelar edição";
        btnSalvar.style.display = "inline-block";
    } else {
        btnEdicao.innerText = "Alterar dados";
        btnSalvar.style.display = "none";
    }

    renderizarBoletim();
}

// Validações estritas do digitador
function validarNotaInput(valorStr) {
    const v = valorStr.trim();
    if (v === "") return { valido: true, valor: null };

    const norm = v.replace(',', '.');
    const num = Number(norm);

    if (isNaN(num)) return { valido: false };
    if (num < 0 || num > 10) return { valido: false };

    return { valido: true, valor: num };
}

function validarFaltaInput(valorStr) {
    const v = valorStr.trim();
    if (v === "") return { valido: false };

    const num = Number(v);

    if (isNaN(num)) return { valido: false };
    if (!Number.isInteger(num)) return { valido: false };
    if (num < 0) return { valido: false };

    return { valido: true, valor: num };
}

// Salvar na API
async function salvarAlteracoes() {
    const statusSalvar = document.getElementById("status-salvamento");
    statusSalvar.innerText = "";

    let temErro = false;
    const novasDisciplinas = [];

    disciplinasAtuais.forEach((item, index) => {
        const inputT1 = document.getElementById(`edit-t1-${index}`);
        const inputT2 = document.getElementById(`edit-t2-${index}`);
        const inputT3 = document.getElementById(`edit-t3-${index}`);

        const inputF1 = document.getElementById(`edit-f1-${index}`);
        const inputF2 = document.getElementById(`edit-f2-${index}`);
        const inputF3 = document.getElementById(`edit-f3-${index}`);

        [inputT1, inputT2, inputT3, inputF1, inputF2, inputF3].forEach(inp => {
            if (inp) inp.classList.remove("invalido");
        });

        const resT1 = validarNotaInput(inputT1.value);
        const resT2 = validarNotaInput(inputT2.value);
        const resT3 = validarNotaInput(inputT3.value);

        const resF1 = validarFaltaInput(inputF1.value);
        const resF2 = validarFaltaInput(inputF2.value);
        const resF3 = validarFaltaInput(inputF3.value);

        if (!resT1.valido) { inputT1.classList.add("invalido"); temErro = true; }
        if (!resT2.valido) { inputT2.classList.add("invalido"); temErro = true; }
        if (!resT3.valido) { inputT3.classList.add("invalido"); temErro = true; }

        if (!resF1.valido) { inputF1.classList.add("invalido"); temErro = true; }
        if (!resF2.valido) { inputF2.classList.add("invalido"); temErro = true; }
        if (!resF3.valido) { inputF3.classList.add("invalido"); temErro = true; }

        if (!temErro) {
            novasDisciplinas.push({
                disciplina: item.disciplina,
                tri1: resT1.valor,
                tri2: resT2.valor,
                tri3: resT3.valor,
                faltas: [resF1.valor, resF2.valor, resF3.valor]
            });
        }
    });

    if (temErro) {
        statusSalvar.innerText = "Verifique os campos destacados antes de salvar.";
        statusSalvar.style.color = "#dc3545";
        return;
    }

    statusSalvar.innerText = "Salvando...";
    statusSalvar.style.color = "#0d6efd";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinSessao,
                dados: {
                    disciplinas: novasDisciplinas
                }
            })
        });

        if (!resposta.ok) {
            statusSalvar.innerText = "Erro ao salvar alterações no servidor.";
            statusSalvar.style.color = "#dc3545";
            return;
        }

        disciplinasAtuais = novasDisciplinas;
        modoEdicao = false;
        document.getElementById("btn-alternar-edicao").innerText = "Alterar dados";
        document.getElementById("btn-salvar-dados").style.display = "none";

        statusSalvar.innerText = "Dados salvos com sucesso.";
        statusSalvar.style.color = "#198754";

        renderizarBoletim();

    } catch (erro) {
        statusSalvar.innerText = "Erro de conexão ao salvar alterações.";
        statusSalvar.style.color = "#dc3545";
    }
}