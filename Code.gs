/**
 * CONFIGURAÇÕES PRINCIPAIS
 * Substitua estes valores antes de publicar!
 */
const CONFIG = {
  SPREADSHEET_ID: 'SUBSTITUIR_PELO_ID_DA_PLANILHA',
  SHEET_NAME_IMOVEIS: 'Imóveis',
  SHEET_NAME_RESPOSTAS: 'Respostas',
  SHEET_NAME_LOGS: 'Logs',
  WHATSAPP_TOKEN: 'SUBSTITUIR_PELO_SEU_TOKEN_DO_WHATSAPP',
  WHATSAPP_PHONE_ID: 'SUBSTITUIR_PELO_SEU_PHONE_ID',
  WHATSAPP_TEMPLATE: 'atualizacao_carteira'
};

/**
 * SETUP INICIAL
 * Rode esta função uma vez para criar as abas necessárias na planilha
 */
function setup() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  // Aba Imóveis
  let sheetImoveis = ss.getSheetByName(CONFIG.SHEET_NAME_IMOVEIS);
  if (!sheetImoveis) {
    sheetImoveis = ss.insertSheet(CONFIG.SHEET_NAME_IMOVEIS);
    sheetImoveis.appendRow(['id_imovel', 'endereco_resumo', 'nome_proprietario', 'telefone_whatsapp', 'status_atual', 'preco_atual', 'data_ultima_atualizacao']);
    sheetImoveis.getRange("A1:G1").setFontWeight("bold");
  }

  // Aba Respostas
  let sheetRespostas = ss.getSheetByName(CONFIG.SHEET_NAME_RESPOSTAS);
  if (!sheetRespostas) {
    sheetRespostas = ss.insertSheet(CONFIG.SHEET_NAME_RESPOSTAS);
    sheetRespostas.appendRow(['id_imovel', 'nome_proprietario', 'telefone', 'status_anterior', 'novo_status', 'novo_preco', 'data_resposta', 'link_form']);
    sheetRespostas.getRange("A1:H1").setFontWeight("bold");
  }

  // Aba Logs
  let sheetLogs = ss.getSheetByName(CONFIG.SHEET_NAME_LOGS);
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet(CONFIG.SHEET_NAME_LOGS);
    sheetLogs.appendRow(['timestamp', 'telefone', 'nome', 'status', 'detalhe']);
    sheetLogs.getRange("A1:E1").setFontWeight("bold");
  }
}

/**
 * Função utilitária para registrar Logs
 */
function logAction(telefone, nome, status, detalhe) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_LOGS);
    sheet.appendRow([new Date(), telefone || '', nome || '', status || '', detalhe || '']);
  } catch(e) {
    console.error("Erro ao escrever no log: " + e.message);
  }
}

/**
 * Trata requisições GET
 * Usado pelo form.html para buscar os dados do imóvel
 */
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const action = e.parameter.action;
    const id = e.parameter.id;

    if (action === 'getImovel' && id) {
      const imovel = buscarImovel(id);

      if (imovel) {
        output.setContent(JSON.stringify({
          success: true,
          nome_proprietario: imovel.nome_proprietario,
          endereco_resumo: imovel.endereco_resumo,
          preco_atual: imovel.preco_atual
        }));
      } else {
        output.setContent(JSON.stringify({ success: false, error: 'Imóvel não encontrado' }));
      }
    } else {
      output.setContent(JSON.stringify({ success: false, error: 'Ação ou ID inválidos' }));
    }
  } catch (error) {
    output.setContent(JSON.stringify({ success: false, error: error.message }));
  }

  return output;
}

/**
 * Trata requisições POST
 * Usado pelo admin.html (disparar WA) e form.html (salvar resposta)
 */
function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    let payload;

    // Tratamento para requisições fetch normais e fetch 'no-cors' (texto)
    if (e.postData.type === 'application/json' || e.postData.type === 'text/plain') {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const action = payload.action;

    if (action === 'sendMessage') {
      const result = enviarMensagemWhatsApp(payload);
      output.setContent(JSON.stringify(result));
      return output;
    }
    else if (action === 'saveResponse') {
      const result = salvarResposta(payload);
      output.setContent(JSON.stringify(result));
      return output;
    }
    else {
      throw new Error('Ação inválida no payload POST');
    }

  } catch (error) {
    logAction('', '', 'ERRO_POST', error.message);
    output.setContent(JSON.stringify({ success: false, error: error.message }));
    return output;
  }
}

/**
 * Busca imóvel na planilha pelo ID
 */
function buscarImovel(id) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_IMOVEIS);

  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idIndex = headers.indexOf('id_imovel');
  const nomeIndex = headers.indexOf('nome_proprietario');
  const endIndex = headers.indexOf('endereco_resumo');
  const precoIndex = headers.indexOf('preco_atual');
  const telefoneIndex = headers.indexOf('telefone_whatsapp');
  const statusIndex = headers.indexOf('status_atual');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] && data[i][idIndex].toString() === id.toString()) {
      return {
        linha: i + 1,
        id_imovel: data[i][idIndex],
        nome_proprietario: data[i][nomeIndex],
        endereco_resumo: data[i][endIndex],
        preco_atual: data[i][precoIndex],
        telefone_whatsapp: data[i][telefoneIndex],
        status_atual: data[i][statusIndex]
      };
    }
  }
  return null;
}

/**
 * Envia a mensagem via Meta Cloud API
 */
function enviarMensagemWhatsApp(payload) {
  const url = `https://graph.facebook.com/v18.0/${CONFIG.WHATSAPP_PHONE_ID}/messages`;

  const requestBody = {
    messaging_product: "whatsapp",
    to: payload.telefone.replace('+', ''), // Remove + for Meta API
    type: "template",
    template: {
      name: CONFIG.WHATSAPP_TEMPLATE,
      language: {
        code: "pt_BR"
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: payload.nome.split(' ')[0] }, // Apenas primeiro nome
            { type: "text", text: payload.endereco },
            { type: "text", text: payload.form_url }
          ]
        }
      ]
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": `Bearer ${CONFIG.WHATSAPP_TOKEN}`
    },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200) {
      logAction(payload.telefone, payload.nome, 'ENVIO_OK', `ID do Imóvel: ${payload.id_imovel}`);
      return { success: true };
    } else {
      logAction(payload.telefone, payload.nome, 'ENVIO_ERRO', result.error ? result.error.message : 'Erro desconhecido');
      return { success: false, error: result.error ? result.error.message : 'Erro na API' };
    }
  } catch (error) {
    logAction(payload.telefone, payload.nome, 'CATCH_ERRO', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Salva a resposta do proprietário na aba 'Respostas' e atualiza 'Imóveis'
 */
function salvarResposta(payload) {
  const imovel = buscarImovel(payload.id_imovel);

  if (!imovel) {
    throw new Error('Imóvel não encontrado para salvar resposta');
  }

  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheetRespostas = ss.getSheetByName(CONFIG.SHEET_NAME_RESPOSTAS);
  const sheetImoveis = ss.getSheetByName(CONFIG.SHEET_NAME_IMOVEIS);

  const novoStatusTexto = traduzirStatus(payload.status);
  const dataHoje = new Date();

  // 1. Gravar no Histórico (Aba Respostas)
  sheetRespostas.appendRow([
    payload.id_imovel,
    imovel.nome_proprietario,
    imovel.telefone_whatsapp,
    imovel.status_atual,
    novoStatusTexto,
    payload.novo_preco || imovel.preco_atual,
    dataHoje,
    '' // Link form deixado vazio
  ]);

  // 2. Atualizar Status Atual (Aba Imóveis)
  const data = sheetImoveis.getDataRange().getValues();
  const headers = data[0];
  const statusIndex = headers.indexOf('status_atual') + 1;
  const precoIndex = headers.indexOf('preco_atual') + 1;
  const dataAtualizacaoIndex = headers.indexOf('data_ultima_atualizacao') + 1;

  // Atualiza linha do imóvel encontrado
  sheetImoveis.getRange(imovel.linha, statusIndex).setValue(novoStatusTexto);

  if (payload.status === 'alterou_preco' && payload.novo_preco) {
    sheetImoveis.getRange(imovel.linha, precoIndex).setValue(payload.novo_preco);
  }

  if (dataAtualizacaoIndex > 0) {
    sheetImoveis.getRange(imovel.linha, dataAtualizacaoIndex).setValue(dataHoje);
  }

  logAction(imovel.telefone_whatsapp, imovel.nome_proprietario, 'RESPOSTA_SALVA', `Novo status: ${novoStatusTexto}`);

  return { success: true };
}

/**
 * Utilitário para traduzir o value do form para texto amigável
 */
function traduzirStatus(statusCodigo) {
  const mapa = {
    'disponivel': 'Disponível',
    'alterou_preco': 'Disponível (Preço Alterado)',
    'vendido': 'Vendido',
    'alugado': 'Alugado',
    'falar_corretor': 'Solicitou Contato'
  };
  return mapa[statusCodigo] || statusCodigo;
}
