# Glossário do produto

Termos e verbos da interface. Antes de nomear um botão, um rótulo ou um estado, procure aqui; termo novo entra aqui.

| Termo | Usar | Nunca | Onde aparece |
|---|---|---|---|
| Negócio | "negócio", "negócios" em todo texto novo | deal, oportunidade (o botão "Novo Deal" e o "deals" do seletor são legado, a trocar numa passada só) | quadro, fila de hoje, lista do celular |
| Pede ação | "pede ação" / "pedem ação" | urgente, atrasado, crítico | fila de hoje, cabeçalho da etapa |
| Parado | "parado há N d" — mais de 30 dias na mesma etapa | esquecido, frio, podre | cartão, fila |
| Retorno | "retorno venceu há N d" — o prazo de retorno do negócio passou | follow-up, tarefa atrasada | cartão, fila |
| Na etapa | "N d na etapa" / "entrou hoje na etapa" | idade, tempo de vida | cartão |
| Sem valor | "sem valor" — valor não preenchido (vazio ou 0) | R$ 0,00, "-", N/A | cartão, cabeçalho da etapa, resumo |
| Valor em n de m | cobertura do valor numa etapa | — | cabeçalho da etapa |
| Sem contato | negócio sem contato ligado | — | cartão, fila |
| Exemplo | negócio criado pelo cadastro junto com a conta | demo, teste, fictício | selo no cartão e na fila |
| Conversar | abre a conversa do contato | WhatsApp (como verbo), chamar | fila, cartão |
| Abrir negócio | abre o diálogo do negócio | ver, detalhes | fila |
| Aceite | "Li e aceito os Termos de Uso e a Política de Privacidade" (caixa desmarcada) | concordo, de acordo, T&C, "ao continuar você concorda" | cadastro e convite, passo 1 |
| Integrador | "integrador" — Z-API, uazapi ou Evolution API, a conta de WhatsApp que o cliente já contrata (spec 012) | gateway, instância (na tela), API não oficial (fora do aviso de risco) | diálogo de conexão, gerenciador, preços, ajuda |
| Conectar número | "Conectar número" / "Conectar WhatsApp" — cria a conexão por integrador | criar instância, nova conexão, adicionar | gerenciador de conexões, diálogo |
| Reconectar | abre o QR Code de uma conexão caída que ainda tem credencial | religar, sincronizar | gerenciador, aviso no topo do inbox |
| Desconectar número | apaga as credenciais; as conversas ficam | remover, excluir conexão | gerenciador, confirmação |
| Precisa reconectar | estado `FAILED` de uma conexão | falhou, erro, quebrada | gerenciador, aviso no inbox |
| Não enviada | "não enviada · <motivo>" — mensagem que o integrador recusou ou que uma trava barrou | erro ao enviar, falha | bolha da conversa |
