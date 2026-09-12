## Integrantes

- Bárbara
- Gabrielle
- Letícia
- Gustavo
- Celso

# Onde vale mais a pena abastecer em São Paulo?

Dashboard estático e interativo que explora a variação dos preços da gasolina comum em São Paulo capital. O projeto transforma dados públicos da ANP em uma ferramenta de apoio à decisão para motoristas de aplicativo, para quem pequenas diferenças no preço por litro podem representar impacto relevante no custo de trabalho.

## Pergunta norteadora

**Onde é mais barato abastecer em São Paulo - e quanto essa escolha pode representar em um tanque?**

## Objetivo

O painel permite comparar preços médios entre bairros, acompanhar a tendência semanal da gasolina e contextualizar a diferença de preço em um tanque de 45 litros. A intenção não é indicar um único posto ideal, mas tornar a variação de preços dentro da cidade mais visível e compreensível.

## Dados e recorte

- **Fonte:** Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP)
- **Base:** Série Histórica de Preços de Combustíveis
- **Produto:** gasolina comum
- **Local:** município de São Paulo
- **Período:** 1º semestre de 2026
- **Volume analisado:** 5.405 coletas, realizadas em 471 postos

A base original da ANP foi reduzida para conter apenas os campos necessários ao projeto: data e semana de coleta, CNPJ e nome da revenda, bairro, bandeira e preço de venda.


## Decisões de visualização

O painel começa pelos filtros e indicadores para que a pessoa consiga chegar rapidamente à resposta principal. O **azul** foi usado como cor dominante por remeter a confiança e dados públicos; o **laranja** destaca economia e variações que merecem atenção. A leitura visual é organizada em três níveis: indicadores, ranking de bairros e tendência semanal.

O ranking exibe também a quantidade de postos e coletas em cada bairro. Como a pesquisa da ANP é amostral, esse contexto é importante para evitar que um resultado baseado em poucas observações pareça uma recomendação definitiva.

## Limitações

- Os dados da ANP são amostrais e não representam necessariamente todos os postos da cidade.
- O campo de bairro vem informado na própria base e pode conter abreviações ou variações de escrita.
- O preço exibido é o registrado na data da coleta; ele pode mudar depois desse momento.
- O dashboard não avalia qualidade do combustível, somente preço de venda.

## Estrutura do projeto

```text
dashboard-gasolina-sp/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── gasolina_sp_capital_2026_1s.json
└── README.md
```

## Como executar localmente

Abra a pasta do projeto no VS Code e use a extensão **Live Server** no arquivo `index.html`.

Como alternativa, abra o terminal na pasta do projeto e execute:

```bash
py -m http.server 8000
```

Em seguida, acesse [http://localhost:8000](http://localhost:8000) no navegador.

## Publicação

O projeto será publicado no **GitHub Pages** a partir de um repositório público. [O link da versão publicada será incluído aqui após a publicação.](https://barbararprado1-debug.github.io/atividade-03-PADS/)



## Referência

ANP. [Série Histórica de Preços de Combustíveis](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/serie-historica-de-precos-de-combustiveis).
