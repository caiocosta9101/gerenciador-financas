//define o endereço do nosso back-end

API_URL = ''; 
let graficoPizza = null;
let filtroAtual = 'mes';
let transacoesAtuais = [];
let idEdicao = null; 

console.log("Script carregado e pronto para conectar com a API!");

// lógica do login
const formLogin = document.getElementById('formLogin');

//verifiquei se o formulário existe na página atual para evitar erros de console
if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
        //passo 1: impede o comportamento padrão do navegador (recarregar a página)
        e.preventDefault(); 
        
        // passo 2 : Captura os valores digitados nos inputs pelo ID
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            // Passo 3: comunicação com o servidor (fetch API)
            //O 'await' pausa a execução até o servidor responder.
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST', // método http para enviar dados sesíveis
                headers: {
                    'Content-Type': 'application/json' // avisa o back-end que estamos enviando JSON
                },
                body: JSON.stringify({ email, senha }) // Transforma o objeto JS em texto JSON
            });
            
            // Converte a resposta bruta do servidor de volta para Objeto JavaScript
            const data = await response.json(); 
            // Passo 4: verifica o status da resposta
            if (response.ok) {
                // sucesso 
                alert('Sucesso! ' + data.mensagem);
    
                // Salvei o ID e nome no navegador para usar nas próximas páginas
                //Isso permite que a página principal.html saiba quem está logado
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuarioNome', data.nome);

                // Redirecionamento para o dashboard
                window.location.href = 'principal.html'; 
            }
                
                
            else {
                alert('Erro: ' + data.erro);
            }

        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao conectar com o servidor. Verifique se o Node está rodando.');
        }
    });
}

// Lógica do cadastro
// Envia os dados do novo usuário para persistência no banco.

const formCadastro = document.getElementById('formCadastro');

if (formCadastro) {
    formCadastro.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch(`${API_URL}/cadastro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Cadastro realizado com sucesso! Agora faça login.');
                // Redireciona o usuário para a tela de login
                window.location.href = 'index.html';
            } else {
                alert('Erro ao cadastrar: ' + data.erro);
            }

        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Erro ao conectar com o servidor.');
        }
    });
}


// LÓGICA DO DASHBOARD (PRINCIPAL.HTML)


const nomeUsuarioSpan = document.getElementById('nomeUsuario');

// Verifica se estamos na página principal
if (nomeUsuarioSpan) {
    verificarLogin();
    carregarTransacoes();

    // Exibe o nome do usuário salvo no login
    const nomeSalvo = localStorage.getItem('usuarioNome');
    if (nomeSalvo) {
        nomeUsuarioSpan.innerText = nomeSalvo;
    }
    iniciarFiltroCategorias()
}

// Função para garantir que só quem logou acesse a página
function verificarLogin() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado!');
        window.location.href = 'index.html';
    }
}

// Função de Logout
function fazerLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioNome');
    window.location.href = 'index.html';
}

// Carregar transacoes do banco
async function carregarTransacoes() {
    try {
        const response = await fetch(`${API_URL}/transacoes?filtro=${filtroAtual}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        // Se o token vencer desloga
        if (response.status === 401 || response.status === 403) {
            alert("Sessão expirada. Faça login novamente.");
            fazerLogout();
            return;
        }
        
        transacoesAtuais = await response.json();

        atualizarLista(); 

    } catch (error) {
        console.error(error);
    }
}

// Adicionar Nova Transação
const formTransacao = document.getElementById('formTransacao');
if (formTransacao) {
    formTransacao.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const descricao = document.getElementById('descricao').value;
        const valor = document.getElementById('valor').value;
        const tipo = document.getElementById('tipo').value;
        const categoria = document.getElementById('categoria').value;

        if (!categoria) {
            alert("Escolha uma categoria!");
            return;
        }

        //LÓGICA INTELIGENTE (CRIAR OU EDITAR?) 
        const isEdicao = idEdicao !== null; // Se idEdicao tem número, é edição
        const endpoint = isEdicao ? `/transacoes/${idEdicao}` : '/transacoes';
        const method = isEdicao ? 'PUT' : 'POST';

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ descricao, valor, tipo, categoria })
            });

            if (response.ok) {
                // Limpa tudo e volta ao normal
                formTransacao.reset();
                idEdicao = null; // Sai do modo edição
                
                // Reseta o botão para "Adicionar"
                const btnSalvar = document.querySelector('#formTransacao button[type="submit"]');
                if(btnSalvar) {
                    btnSalvar.innerText = "Adicionar";
                    btnSalvar.style.backgroundColor = ""; // Volta a cor original do CSS
                    btnSalvar.style.color = "";
                }

                carregarTransacoes(); // Recarrega a lista atualizada
            } else {
                alert('Erro ao salvar transação');
            }
        } catch (error) {
            console.error(error);
        }
    });
}


// Função que o botão chama quando é clicado apagando transação
async function deleteTransaction(id) {
    const confirmacao = confirm("Tem certeza que deseja excluir essa transação?");
    
    if (confirmacao) {
        try {
            const response = await fetch(`${API_URL}/transacoes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // AQUI É A NOVIDADE: Verifica se o servidor respondeu OK (status 200-299)
            if (response.ok) {
                alert("Transação excluída com sucesso!");
                location.reload(); // Só recarrega se deu certo
            } else {
                // Se der erro, mostramos o que aconteceu
                const data = await response.json();
                alert(`Erro ao excluir: ${data.erro || 'Erro desconhecido'}`);
                console.error('Erro no servidor:', data);
            }
            
        } catch (erro) {
            console.error('Erro de conexão:', erro);
            alert("Erro ao conectar com o servidor.");
        }
    }
}
// FUNÇÕES filtro por categoria

function iniciarFiltroCategorias() {
    const selectTipo = document.getElementById('tipo');
    const selectCategoria = document.getElementById('categoria');
    if (selectTipo && selectCategoria) {
        const todasOpcoes = Array.from(selectCategoria.options);
        selectTipo.addEventListener('change', function() {
            const tipo = this.value;
            selectCategoria.value = ""; 
            todasOpcoes.forEach(op => {
                if(op.value === "") return;
                op.style.display = op.classList.contains(`cat-${tipo}`) ? 'block' : 'none';
            });
        });
        selectTipo.dispatchEvent(new Event('change'));
    }
}

function atualizarGrafico(entradas, saidas) {
    const ctx = document.getElementById('meuGrafico');
    if (!ctx) return;
    
    // Destrói gráfico anterior se existir
    if (graficoPizza) graficoPizza.destroy();
    
    // Se estiver tudo zerado, não desenha
    if (entradas === 0 && saidas === 0) return;

    graficoPizza = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                data: [entradas, saidas],
                backgroundColor: ['#4ade80', '#f87171'], 
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff', 
                        font: { size: 14 }
                    }
                }
            }
        }
    });
}

// Função para clicar nos botões de filtro
function mudarFiltro(periodo) {
    filtroAtual = periodo; // Atualiza a variável global

    // 1. Tira a classe 'active' de todos os botões (apaga o neon)
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
    
    // 2. Coloca a classe 'active' só no botão clicado (acende o neon)
    const btnClicado = document.getElementById(`btn-${periodo}`);
    if (btnClicado) btnClicado.classList.add('active');

    // 3. Recarrega os dados do servidor com o novo filtro
    carregarTransacoes();
}

function atualizarLista() {
    const lista = document.getElementById('listaTransacoes');
    const elEntradas = document.getElementById('totalEntradas');
    const elSaidas = document.getElementById('totalSaidas');
    const elSaldo = document.getElementById('saldoTotal');
    

    lista.innerHTML = '';
    
    let totalEntradas = 0;
    let totalSaidas = 0;

    transacoesAtuais.forEach(item => {
        const valorNum = parseFloat(item.valor);
        
        // Soma os totais
        if (item.tipo === 'entrada') totalEntradas += valorNum;
        else totalSaidas += valorNum;

        // Cria o elemento da lista
        const li = document.createElement('li');
        li.classList.add('item-transacao');
        li.classList.add(item.tipo);

        // Formata a data
        const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        
        const htmlBruto = `
            <div class="transacao-conteudo">
                <div class="transacao-info">
                    <span class="transacao-titulo">${item.descricao}</span>
                    <small class="transacao-detalhes">
                        ${dataFormatada} • ${item.categoria_nome || 'Geral'}
                    </small>
                </div>
                
                <div class="transacao-acoes">
                    <span class="${item.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida'}">
                        ${item.tipo === 'entrada' ? '+' : '-'} R$ ${valorNum.toFixed(2)}
                    </span>
                    
                    <button onclick="prepararEdicao(${item.id})" class="btn-icone" title="Editar">
                        ✏️
                    </button>
                    
                    <button class="delete-btn" onclick="deleteTransaction(${item.id})" title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>
        `;
        
        // O DOMPurify limpa a sujeira/vírus
        const htmlLimpo = DOMPurify.sanitize(htmlBruto);

        // Joga na tela
        li.innerHTML = htmlLimpo;
        lista.appendChild(li);
        
    });

    // Atualiza os textos do saldo lá em cima
    elEntradas.innerText = `R$ ${totalEntradas.toFixed(2)}`;
    elSaidas.innerText = `R$ ${totalSaidas.toFixed(2)}`;
    elSaldo.innerText = `R$ ${(totalEntradas - totalSaidas).toFixed(2)}`;

    atualizarGrafico(totalEntradas, totalSaidas);
}

// Função que preenche o formulário quando clica no lápis
function prepararEdicao(id) {
    // Acha a transação na memória (sem precisar ir no banco de novo)
    const transacao = transacoesAtuais.find(t => t.id === id);

    if (transacao) {
        // 1. Preenche os campos lá em cima
        document.getElementById('descricao').value = transacao.descricao;
        document.getElementById('valor').value = transacao.valor;
        document.getElementById('tipo').value = transacao.tipo;
        
        // Tenta selecionar a categoria (se o select tiver as opções carregadas)
        const selectCategoria = document.getElementById('categoria');
        if(selectCategoria) {
            selectCategoria.value = transacao.categoria_id || ""; 
        }

        // 2. Avisa o sistema que estamos editando este ID 
        idEdicao = id;

        // 3. Muda o texto do botão para o usuário saber que está editando
        const btnSalvar = document.querySelector('#formTransacao button[type="submit"]');
        if(btnSalvar) {
            btnSalvar.innerText = "Salvar Alteração 💾";
            btnSalvar.style.backgroundColor = "#fbbf24"; 
            btnSalvar.style.color = "#000"; 
        }
        
        // Leva a tela EXATAMENTE para o formulário e centraliza ele
        const form = document.getElementById('formTransacao');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}