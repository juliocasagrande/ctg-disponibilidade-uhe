/** Cole em Extensões > Apps Script da planilha. Não publicar como aplicativo web. */
function onOpen(){SpreadsheetApp.getUi().createMenu('Disponibilidade UHE').addItem('Exportar configuração JSON','exportarConfiguracao').addToUi();}
function exportarConfiguracao(){
 const ss=SpreadsheetApp.getActive(),sheets={};
 ['Usinas','UGs','Referencia','Parametros'].forEach(function(name){const s=ss.getSheetByName(name);if(!s)throw new Error('Aba ausente: '+name);sheets[name]=s.getDataRange().getValues();});
 const data=Utilities.base64Encode(Utilities.newBlob(JSON.stringify({version:1,sheets:sheets})).getBytes());
 const html='<p>Baixe a configuração e importe no site em Configuração → Importar dados da planilha.</p><button onclick="download()">Baixar JSON</button><script>function download(){const bytes=Uint8Array.from(atob("'+data+'"),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="configuracao-ctg.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}</script>';
 SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(440).setHeight(180),'Exportar configuração');
}
