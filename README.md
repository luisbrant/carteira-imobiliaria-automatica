# Carteira Imobiliária Automática

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-API-25D366)]()
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-Serverless-4285F4)]()
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Hospedagem-222222)]()
[![Vercel](https://img.shields.io/badge/Vercel-Opcional-000000)]()

MVP para automatizar atualização de disponibilidade de imóveis via WhatsApp com custo zero.

## 🎯 Problema a ser resolvido
Automatizar o processo manual de verificar a disponibilidade dos imóveis na carteira:
1. Enviar mensagens pelo WhatsApp aos proprietários.
2. Interpretar respostas.
3. Atualizar uma planilha com a resposta de forma automática.

## 🏗️ Arquitetura e Stack (100% Gratuito)
- **Frontend**: HTML + CSS + JS Vanilla. Hospedado em GitHub Pages ou Vercel.
- **Backend**: Google Apps Script (serverless).
- **Banco de Dados**: Google Sheets.
- **WhatsApp**: Meta Cloud API (1000 conversas por mês gratuitas).

## 📁 Estrutura do Repositório
```text
carteira-imobiliaria-automatica/
├── admin.html              # Painel administrativo para disparo (Senha: imob2026)
├── form.html               # Formulário dinâmico do proprietário
├── style.css               # Estilos mobile-first
├── Code.gs                 # Backend em Google Apps Script
├── modelo.csv              # Exemplo da base de dados
├── vercel.json             # Configuração opcional para a Vercel
├── README.md               # Esta documentação
└── LICENSE                 # MIT License
```

## 🚀 Passo a Passo de Configuração

### 1. Google Sheets e Apps Script
1. Crie uma nova planilha no Google Sheets.
2. Anote o ID da planilha (encontrado na URL, entre `/d/` e `/edit`).
3. Vá em **Extensões** > **Apps Script**.
4. Apague qualquer código existente e cole o conteúdo de `Code.gs`.
5. Preencha as configurações na constante `CONFIG`:
    - `SPREADSHEET_ID`: Seu ID da planilha
    - `WHATSAPP_TOKEN`: Seu access token temporário/permanente da Meta API.
    - `WHATSAPP_PHONE_ID`: Seu Phone ID na Meta API.
6. Selecione a função `setup` no menu superior e clique em **Executar** (isso vai criar as abas necessárias: Imóveis, Respostas e Logs). Será solicitado permissões de acesso.
7. Clique em **Implantar** > **Nova implantação**.
8. Tipo: **App da Web**.
9. Executar como: **Eu**.
10. Quem pode acessar: **Qualquer pessoa** (Isso é obrigatório para não exigir login Google).
11. Clique em **Implantar** e anote a **URL do App da Web (Web App URL)**.

### 2. Frontend (HTML/CSS)
1. No arquivo `admin.html`, procure pela constante `CONFIG` e atualize:
    - `SCRIPT_URL`: Substitua com a Web App URL copiada no passo anterior.
    - `FORM_URL`: Atualize se necessário, após publicar as páginas.
2. No arquivo `form.html`, atualize a mesma `CONFIG.SCRIPT_URL` com sua Web App URL.

### 3. WhatsApp Cloud API (Meta for Developers)
1. Acesse [Meta for Developers](https://developers.facebook.com/).
2. Crie um app do tipo **Negócios**.
3. Adicione o produto **WhatsApp** ao app.
4. Anote seu **Token de Acesso Temporário** (ou configure um permanente) e o **ID do número de telefone**.
5. Crie e aproveite um template de mensagem:
   - **Nome**: `atualizacao_carteira`
   - **Categoria**: `Utility`
   - **Idioma**: `pt_BR`
   - **Corpo**: 
     `Olá {{1}}! A Vitória da União 03 está atualizando a carteira. Seu imóvel {{2}} ainda está disponível? Confirme aqui: {{3}}`

### 4. Hospedagem (GitHub Pages)
1. Crie o repositório público no GitHub.
2. Suba todos os arquivos (`admin.html`, `form.html`, `style.css`, etc).
3. Vá em **Settings** > **Pages**.
4. Selecione a branch `main` e a pasta `/root`. Clique em **Save**.
5. O admin estará acessível em `https://seu-usuario.github.io/carteira-imobiliaria-automatica/admin.html` (e o formulário em `form.html`).

## 🛠️ Testando o Fluxo
1. Preencha o arquivo `modelo.csv` ou mantenha os dados de teste.
2. Acesse o seu `admin.html` hospedado.
3. Use a senha `imob2026`.
4. Faça o upload do arquivo `modelo.csv`.
5. Clique em **Disparar Mensagens WhatsApp**.
6. Aguarde as mensagens chegarem no WhatsApp de teste.
7. Acesse o link enviado no WhatsApp para abrir o `form.html`.
8. Preencha a nova disponibilidade.
9. Confira se a planilha do Google Sheets foi atualizada automaticamente nas abas *Imóveis* e *Respostas*.

## ⚠️ Limitações Importantes
- O painel admin processa envios massivos no navegador. Recomendado até **200 imóveis por vez**.
- A Meta Cloud API exige o envio com número validado/adicionado como número de teste antes da aprovação do app em produção.
- Sem CORS avançado configurado no Google Apps Script, os dados são transmitidos utilizando modo `no-cors` a partir do frontend.

---
Feito com ☕ e ❤️ para facilitar a vida do corretor!