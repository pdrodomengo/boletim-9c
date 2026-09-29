// Dados fictícios padronizados das 15 disciplinas do 9º Ano
const dadosBoletim = [
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

// Função que padroniza as notas para a escala de 0 a 10
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    // Se a nota vier como texto com vírgula (ex: "8,5"), converte para ponto
    let notaString = String(valor).replace(',', '.');
    let notaNum = parseFloat(notaString);

    // Se não for um número válido, descarta
    if (isNaN(notaNum)) {
        return null;
    }

    // Ajusta notas no formato 0 a 100 para 0 a 10 (ex: 85 vira 8.5)
    if (notaNum > 10 && notaNum <= 100) {
        notaNum = notaNum / 10;
    }

    // Garante que a nota esteja dentro do intervalo de 0 a 10
    if (notaNum >= 0 && notaNum <= 10) {
        return notaNum;
    }

    return null;
}

// Função para formatar a nota para exibição na tabela
function formatarNotaExibicao(nota) {
    if (nota === null) {
        return "—";
    }
    return nota.toFixed(1).replace('.', ',');
}

// Função principal que calcula os dados e constrói o boletim na tela
function renderizarBoletim() {
    const corpoTabela = document.getElementById("corpo-tabela");
    corpoTabela.innerHTML = ""; // Limpa a tabela antes de preencher

    let somaMediasGerais = 0;
    let qtdDisciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let qtdBomDesempenho = 0;
    let qtdAtencao = 0;

    // NOTA SOBRE A FREQUÊNCIA:
    // O valor de 92% exibido no card de resumo é APENAS DEMONSTRATIVO nesta versão do projeto,
    // conforme o requisito, e não é calculado dinamicamente pelas faltas nesta etapa.

    dadosBoletim.forEach(item => {
        // Normalização das notas dos 3 trimestres
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        // Separa apenas as notas válidas disponíveis para a média
        const notasDisponiveis = [n1, n2, n3].filter(n => n !== null);

        let media = null;
        let situacaoTexto = "Nota ainda não disponível";
        let classeSituacao = "situacao-indisponivel";

        // Se houver notas disponíveis, calcula a média
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

        // Soma total das faltas da disciplina
        const totalFaltasDisciplina = item.faltas.reduce((acc, curr) => acc + curr, 0);
        totalFaltasGeral += totalFaltasDisciplina;

        // Criação dinâmica da linha da tabela (HTML no JavaScript via DOM)
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.disciplina}</strong></td>
            <td>${formatarNotaExibicao(n1)}</td>
            <td>${formatarNotaExibicao(n2)}</td>
            <td>${formatarNotaExibicao(n3)}</td>
            <td><strong>${formatarNotaExibicao(media)}</strong></td>
            <td>${totalFaltasDisciplina}</td>
            <td class="${classeSituacao}">${situacaoTexto}</td>
        `;

        corpoTabela.appendChild(tr);
    });

    // Atualiza os Cards de Resumo no topo do site
    const mediaGeralGlobal = qtdDisciplinasComMedia > 0 ? (somaMediasGerais / qtdDisciplinasComMedia).toFixed(1).replace('.', ',') : "—";
    
    document.getElementById("card-media-geral").innerText = mediaGeralGlobal;
    document.getElementById("card-total-faltas").innerText = totalFaltasGeral;
    document.getElementById("card-bom-desempenho").innerText = qtdBomDesempenho;
    document.getElementById("card-atencao").innerText = qtdAtencao;
}

// Executa a função quando a página termina de carregar
document.addEventListener("DOMContentLoaded", renderizarBoletim);