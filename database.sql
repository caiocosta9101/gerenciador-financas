CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('entrada', 'saida'))
);

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255),
    valor NUMERIC(10, 2) NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT REFERENCES usuarios(id),
    categoria_id INT REFERENCES categorias(id)
);