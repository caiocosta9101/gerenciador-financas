//define o endereço do nosso back-end

const API_URL = ''; 

console.log("Script carregado e pronto para conectar com a API!");

// lógica do login
const formLogin = document.getElementById('formLogin');

//verificamos se o formulário existe na página atual para evitar erros de console
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
    
                // Salvamos o ID e nome no navegador para usar nas próximas páginas
                //Isso permite que a página principal.html saiba quem está logado
                localStorage.setItem('usuarioId', data.usuarioId);
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
}

// Função para garantir que só quem logou acesse a página
function verificarLogin() {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
        alert('Você precisa estar logado!');
        window.location.href = 'index.html';
    }
}

// Função de Logout
function fazerLogout() {
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioNome');
    window.location.href = 'index.html';
}

// Carregar transacoes do banco
async function carregarTransacoes() {
    const usuarioId = localStorage.getItem('usuarioId');
    const lista = document.getElementById('listaTransacoes');
    
    // Elementos dos Cards
    const elEntradas = document.getElementById('totalEntradas');
    const elSaidas = document.getElementById('totalSaidas');
    const elSaldo = document.getElementById('saldoTotal');

    try {
        // Note que passamos o ID no Header agora
        const response = await fetch(`${API_URL}/transacoes`, {
            method: 'GET',
            headers: {
                'usuario-id': usuarioId 
            }
        });
        const transacoes = await response.json();

        // Limpa a lista atual
        lista.innerHTML = '';

        let totalEntradas = 0;
        let totalSaidas = 0;

        transacoes.forEach(item => {
            // Calcula totais
            const valorNum = parseFloat(item.valor);
            if (item.tipo === 'entrada') {
                totalEntradas += valorNum;
            } else {
                totalSaidas += valorNum;
            }

            // Cria o HTML da lista
            const li = document.createElement('li');
            li.classList.add('item-transacao');
            
            const classeCor = item.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida';
            const sinal = item.tipo === 'entrada' ? '+' : '-';

            li.innerHTML = `
                <span>${item.descricao}</span>
                <span class="${classeCor}">${sinal} R$ ${valorNum.toFixed(2)}</span>
            `;
            lista.appendChild(li);
        });

        // Atualiza os Cards
        const saldo = totalEntradas - totalSaidas;
        elEntradas.innerText = `R$ ${totalEntradas.toFixed(2)}`;
        elSaidas.innerText = `R$ ${totalSaidas.toFixed(2)}`;
        elSaldo.innerText = `R$ ${saldo.toFixed(2)}`;

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
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
        const usuarioId = localStorage.getItem('usuarioId');

        try {
            const response = await fetch(`${API_URL}/transacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descricao, valor, tipo, usuarioId })
            });

            if (response.ok) {
                // Limpa o form e recarrega a lista
                formTransacao.reset();
                carregarTransacoes();
            } else {
                alert('Erro ao salvar transação');
            }
        } catch (error) {
            console.error(error);
        }
    });
}



// INTEGRAÇÃO COM CHATBOT

async function enviarMensagemBot() {
    const input = document.getElementById('chat-input');
    const mensagensDiv = document.getElementById('chat-mensagens');
    const textoUsuario = input.value;

    // Se o campo estiver vazio, não faz nada
    if (!textoUsuario.trim()) return;

    // 1. Adiciona a mensagem do usuário na tela (lado direito ou identificado como Você)
    mensagensDiv.innerHTML += `
        <div style="margin-bottom: 10px; text-align: right;">
            <span style="background: #dcf8c6; padding: 5px 10px; border-radius: 5px;">
                <strong>Você:</strong> ${textoUsuario}
            </span>
        </div>`;
    
    // Limpa o campo e rola a tela para baixo
    input.value = '';
    mensagensDiv.scrollTop = mensagensDiv.scrollHeight;

    // Mostra um "Digitando..." provisório
    const idDigitando = 'digitando-' + Date.now();
    mensagensDiv.innerHTML += `<div id="${idDigitando}" style="color: #888; font-size: 12px; margin-bottom: 10px;">O bot está digitando...</div>`;

    try {
        // ============================================================
        // [IMPORTANTE 1] COLE A URL DO SEU AMIGO ABAIXO
        // ============================================================
        const URL_DO_BOT = 'https://api.era.dev.br/api/contact'; 

        const response = await fetch(URL_DO_BOT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // ============================================================
            // [IMPORTANTE 2] VERIFIQUE O NOME DO CAMPO NO JSON
            // Seu amigo espera receber { "message": "oi" } ou { "text": "oi" }?
            // Pergunte a ele qual é a "chave" correta. Abaixo usei "mensagem".
            // ============================================================
            body: JSON.stringify({ mensagem: textoUsuario }) 
        });

        const dados = await response.json();

        // Remove o aviso de "digitando..."
        document.getElementById(idDigitando).remove();

        // ============================================================
        // [IMPORTANTE 3] COMO A RESPOSTA VOLTA?
        // Se a resposta dele for { "reply": "Olá" }, use dados.reply
        // Se for { "answer": "Olá" }, use dados.answer
        // ============================================================
        const respostaBot = dados.resposta || JSON.stringify(dados); 

        // Adiciona a resposta do Bot na tela
        mensagensDiv.innerHTML += `
            <div style="margin-bottom: 10px; text-align: left;">
                <span style="background: #fff; padding: 5px 10px; border-radius: 5px; border: 1px solid #ddd;">
                    <strong>Bot:</strong> ${respostaBot}
                </span>
            </div>`;

    } catch (error) {
        console.error('Erro:', error);
        if(document.getElementById(idDigitando)) document.getElementById(idDigitando).remove();
        mensagensDiv.innerHTML += `<div style="color: red; margin-bottom: 10px;">Erro ao conectar com o bot.</div>`;
    }

    // Rola a tela para baixo novamente
    mensagensDiv.scrollTop = mensagensDiv.scrollHeight;
}

// Permite enviar com a tecla ENTER
document.getElementById('chat-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        enviarMensagemBot();
    }
});