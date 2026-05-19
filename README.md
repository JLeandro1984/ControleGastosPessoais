# FinTrack — Controle de Contas

FinTrack é um aplicativo web moderno para controle de contas pessoais, focado em simplicidade, visualização e experiência mobile. O projeto é totalmente client-side, sem necessidade de backend, e pode ser instalado como PWA (Progressive Web App) em qualquer dispositivo.

## Funcionalidades

- Cadastro, edição e exclusão de contas mensais
- Marcação de contas como pagas ou pendentes
- Filtros por status e vencimento
- Controle de renda mensal e saldo estimado
- Gráficos interativos (pizza por categoria e barras por mês)
- Exportação e importação de backup (JSON)
- Dados salvos localmente no navegador (localStorage)
- Interface responsiva e otimizada para celular
- Instalação como aplicativo (PWA) com ícone próprio

## Como usar

1. **Abra o arquivo `index.html`** em seu navegador (Chrome, Edge, Firefox, etc.).
2. **Adicione suas contas** usando o botão "+ Nova Conta".
3. **Visualize os gráficos** para análise rápida dos seus gastos.
4. **Exporte um backup** para salvar seus dados ou importar em outro dispositivo.
5. **Instale como app**: no navegador, clique em "Instalar app" ou "Adicionar à tela inicial" para usar como aplicativo nativo.

## Estrutura do Projeto

- `index.html` — Interface principal
- `style.css` — Estilos visuais
- `app.js` — Lógica do aplicativo
- `chart.min.js` — Biblioteca de gráficos (Chart.js)
- `manifest.webmanifest` — Manifesto PWA
- `service-worker.js` — Service Worker para funcionamento offline
- `icon-192.png` e `icon-512.png` — Ícones do app

## Tecnologias Utilizadas

- HTML5, CSS3, JavaScript puro
- Chart.js para gráficos
- Progressive Web App (PWA)

## Observações

- Todos os dados ficam salvos localmente no navegador do usuário.
- Não há integração com servidores externos.
- O app pode ser usado offline após o primeiro acesso.

---
Desenvolvido para facilitar o controle financeiro pessoal de forma simples, visual e acessível em qualquer dispositivo.