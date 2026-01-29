import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Criar workbook
    const wb = XLSX.utils.book_new();

    // ============================================
    // ABA 1: CONTROLE DE VENDAS
    // ============================================
    const dadosVendas = [
      // Cabeçalho
      ['Data', 'Cliente', 'Tipo Imóvel', 'Localização', 'Valor Venda (R$)', '% Comissão', 'Comissão (R$)', 'Status', 'Observações'],

      // Dados de exemplo - Janeiro 2026 (realistas)
      ['05/01/2026', 'João Silva', 'Apartamento 70m²', 'Vila Mariana - SP', 680000, 0.06, '=E2*F2', 'Fechado', 'Cliente indicação'],
      ['08/01/2026', 'Maria Santos', 'Casa 120m²', 'Moema - SP', 1150000, 0.06, '=E3*F3', 'Fechado', 'Venda rápida'],
      ['12/01/2026', 'Pedro Costa', 'Apartamento 50m²', 'Tatuapé - SP', 380000, 0.05, '=E4*F4', 'Negociação', 'Aguardando financiamento'],
      ['15/01/2026', 'Ana Lima', 'Apartamento 85m² (Lançamento)', 'Pinheiros - SP', 920000, 0.04, '=E5*F5', 'Proposta', 'Construtora parceira'],
      ['18/01/2026', 'Carlos Oliveira', 'Casa 200m²', 'Brooklin - SP', 1580000, 0.06, '=E6*F6', 'Fechado', 'Alto padrão'],
      ['20/01/2026', 'Juliana Ferreira', 'Apartamento 65m²', 'Santana - SP', 480000, 0.06, '=E7*F7', 'Perdido', 'Cliente desistiu'],
      ['22/01/2026', 'Roberto Alves', 'Cobertura 150m²', 'Jardins - SP', 2300000, 0.05, '=E8*F8', 'Negociação', 'Aguardando vistoria'],
      ['25/01/2026', 'Fernanda Souza', 'Apartamento 55m²', 'Mooca - SP', 420000, 0.06, '=E9*F9', 'Fechado', 'Primeira compra'],
      ['27/01/2026', 'Lucas Martins', 'Casa 180m² (Lançamento)', 'Vila Madalena - SP', 1680000, 0.04, '=E10*F10', 'Proposta', 'Lançamento exclusivo'],
      ['29/01/2026', 'Patrícia Rocha', 'Apartamento 45m² (Studio)', 'República - SP', 285000, 0.06, '=E11*F11', 'Qualificação', 'Investidor'],
      ['30/01/2026', 'Ricardo Nunes', 'Casa 250m²', 'Morumbi - SP', 3200000, 0.05, '=E12*F12', 'Negociação', 'Imóvel de luxo'],

      // Linha em branco
      [],

      // Totais
      ['', '', '', 'TOTAL VENDAS FECHADAS:', '=SUMIF(H2:H12,"Fechado",E2:E12)', '', '=SUMIF(H2:H12,"Fechado",G2:G12)', '', ''],
      ['', '', '', 'TOTAL EM NEGOCIAÇÃO:', '=SUMIF(H2:H12,"Negociação",E2:E12)', '', '=SUMIF(H2:H12,"Negociação",G2:G12)', '', ''],
      ['', '', '', 'TOTAL GERAL (Pipeline):', '=SUM(E2:E12)', '', '=SUM(G2:G12)', '', ''],
    ];

    const wsControle = XLSX.utils.aoa_to_sheet(dadosVendas);

    // Formatação da aba Controle
    wsControle['!cols'] = [
      { wch: 12 },  // Data
      { wch: 20 },  // Cliente
      { wch: 25 },  // Tipo Imóvel
      { wch: 22 },  // Localização
      { wch: 18 },  // Valor Venda
      { wch: 13 },  // % Comissão
      { wch: 16 },  // Comissão R$
      { wch: 14 },  // Status
      { wch: 25 },  // Observações
    ];

    // ============================================
    // ABA 2: DASHBOARD
    // ============================================
    const dadosDashboard = [
      ['📊 DASHBOARD - JANEIRO 2026'],
      [],
      ['RESUMO DO MÊS'],
      ['Total de Leads:', 11, '', '(todos os clientes cadastrados)'],
      ['Vendas Fechadas:', '=COUNTIF(\'Controle de Vendas\'!H2:H12,"Fechado")', '', '(status = Fechado)'],
      ['Em Negociação:', '=COUNTIF(\'Controle de Vendas\'!H2:H12,"Negociação")', '', '(oportunidades ativas)'],
      ['Perdidos:', '=COUNTIF(\'Controle de Vendas\'!H2:H12,"Perdido")', '', '(não convertidos)'],
      [],
      ['RECEITA'],
      ['Comissões Recebidas:', '=\'Controle de Vendas\'!G14', '', '(vendas fechadas)'],
      ['Comissões em Negociação:', '=\'Controle de Vendas\'!G15', '', '(potencial a receber)'],
      ['Total Potencial:', '=B10+B11', '', '(se fechar tudo)'],
      [],
      ['PERFORMANCE'],
      ['Taxa de Conversão:', '=B5/B4', '', '(% de fechamento)'],
      ['Ticket Médio:', '=B10/B5', '', '(comissão média por venda)'],
      ['Ticket Médio Imóveis:', '=SUMIF(\'Controle de Vendas\'!H2:H12,"Fechado",\'Controle de Vendas\'!E2:E12)/COUNTIF(\'Controle de Vendas\'!H2:H12,"Fechado")', '', '(valor médio imóveis vendidos)'],
      [],
      ['META DO MÊS'],
      ['Meta de Vendas:', 5, '', '(quantas vendas você quer fechar)'],
      ['Meta Atingida:', '=B5/B20', '', '(% da meta alcançada)'],
      ['Faltam:', '=B20-B5', '', '(vendas para bater meta)'],
      [],
      ['🎯 OPORTUNIDADE PERDIDA'],
      ['Leads Perdidos:', '=COUNTIF(\'Controle de Vendas\'!H2:H12,"Perdido")'],
      ['Valor Potencial Perdido:', '=SUMIF(\'Controle de Vendas\'!H2:H12,"Perdido",\'Controle de Vendas\'!G2:G12)'],
      ['💡 Se tivesse fechado esses leads:', '=B10+B26', '', '(sua receita seria)'],
      [],
      ['⚠️ ALERTA: Você está PERDENDO dinheiro por desorganização!'],
      ['Um CRM organiza seus leads e te lembra de fazer follow-up.'],
      ['→ Teste o Sirius CRM gratuitamente: sirius.roilabs.com.br'],
    ];

    const wsDashboard = XLSX.utils.aoa_to_sheet(dadosDashboard);

    wsDashboard['!cols'] = [
      { wch: 30 },  // Label
      { wch: 18 },  // Valor
      { wch: 3 },   // Espaço
      { wch: 35 },  // Descrição
    ];

    // ============================================
    // ABA 3: CALCULADORA DE COMISSÕES PERDIDAS
    // ============================================
    const dadosCalculadora = [
      ['💰 CALCULADORA: QUANTO VOCÊ ESTÁ PERDENDO POR MÊS?'],
      [],
      ['Responda as perguntas abaixo:', '', '', 'SEUS NÚMEROS ↓'],
      [],
      ['1. Quantos LEADS você recebe por mês?', '', '', 30, 'leads/mês'],
      ['2. Quantos desses você FECHA (converte)?', '', '', 5, 'vendas/mês'],
      ['3. Qual seu TICKET MÉDIO de comissão?', '', '', 25000, 'R$ por venda'],
      [],
      ['📊 RESULTADOS:'],
      [],
      ['Sua taxa de conversão atual:', '=D6/D5', '', '=ROUND(B11*100,1)&"%"'],
      ['Comissões que você RECEBE por mês:', '=D6*D7', '', '=TEXT(B12,"R$ #,##0")'],
      [],
      ['🎯 SE VOCÊ MELHORASSE A ORGANIZAÇÃO:'],
      [],
      ['Taxa de conversão com CRM:', 0.35, '', '35% (benchmark do mercado)'],
      ['Vendas que você PODERIA fechar:', '=D5*B17', '', '=ROUND(B18,0)&" vendas/mês"'],
      ['Comissões que você PODERIA receber:', '=B18*D7', '', '=TEXT(B19,"R$ #,##0")'],
      [],
      ['💸 QUANTO VOCÊ ESTÁ PERDENDO:'],
      [],
      ['Comissões PERDIDAS por mês:', '=B19-B12', '', '=TEXT(B23,"R$ #,##0")'],
      ['Comissões PERDIDAS por ano:', '=B23*12', '', '=TEXT(B24,"R$ #,##0")'],
      [],
      ['🚨 ISSO É DINHEIRO QUE ESTÁ SAINDO DO SEU BOLSO!'],
      [],
      ['A causa? Desorganização:'],
      ['   ✗ Leads espalhados (WhatsApp, papel, memória)'],
      ['   ✗ Esquecimento de follow-ups'],
      ['   ✗ Sem priorização (você liga para quem?)'],
      ['   ✗ Perda de contexto (quem é esse cliente?)'],
      [],
      ['A solução? Sirius CRM:'],
      ['   ✓ Todos os leads em um só lugar'],
      ['   ✓ Lembretes automáticos de follow-up'],
      ['   ✓ IA te diz quais leads priorizar'],
      ['   ✓ Histórico completo de cada cliente'],
      [],
      ['💎 INVESTIMENTO:', '', '', 'R$ 97/mês (ou GRÁTIS para começar)'],
      ['💰 RETORNO:', '', '', '=TEXT(B23,"R$ #,##0")&" extras/mês"'],
      ['📈 ROI:', '', '', '=ROUND((B23/97)*100,0)&"%"'],
      [],
      ['👉 Teste grátis (sem cartão): sirius.roilabs.com.br'],
    ];

    const wsCalculadora = XLSX.utils.aoa_to_sheet(dadosCalculadora);

    wsCalculadora['!cols'] = [
      { wch: 45 },  // Pergunta/Label
      { wch: 15 },  // Cálculo
      { wch: 3 },   // Espaço
      { wch: 20 },  // Input/Resultado
      { wch: 15 },  // Unidade
    ];

    // ============================================
    // ABA 4: INSTRUÇÕES
    // ============================================
    const dadosInstrucoes = [
      ['📖 COMO USAR ESTA PLANILHA'],
      [],
      ['BEM-VINDO, CORRETOR(A)!'],
      [],
      ['Esta planilha foi criada para te ajudar a:'],
      ['✓ Organizar todas as suas vendas em um só lugar'],
      ['✓ Calcular comissões automaticamente'],
      ['✓ Acompanhar seu desempenho mensal'],
      ['✓ Descobrir quanto dinheiro você está perdendo por desorganização'],
      [],
      ['🗂️ ESTRUTURA DA PLANILHA:'],
      [],
      ['1️⃣ CONTROLE DE VENDAS'],
      ['   → Registre cada cliente e venda aqui'],
      ['   → As comissões são calculadas automaticamente'],
      ['   → Atualize o Status conforme o cliente avança'],
      [],
      ['2️⃣ DASHBOARD'],
      ['   → Visão geral do mês (vendas, comissões, metas)'],
      ['   → Atualiza automaticamente conforme você registra vendas'],
      ['   → Use para entender sua performance'],
      [],
      ['3️⃣ CALCULADORA'],
      ['   → Descubra quanto você está perdendo por desorganização'],
      ['   → Preencha seus números reais'],
      ['   → Veja o impacto financeiro real'],
      [],
      ['📝 COMO USAR - PASSO A PASSO:'],
      [],
      ['PASSO 1: Vá na aba "Controle de Vendas"'],
      ['PASSO 2: Adicione uma nova linha para cada cliente/lead'],
      ['PASSO 3: Preencha: Data, Nome, Tipo de Imóvel, Localização, Valor'],
      ['PASSO 4: Defina a % de Comissão (geralmente 5% ou 6%)'],
      ['PASSO 5: A comissão em R$ calcula sozinha!'],
      ['PASSO 6: Atualize o Status (Qualificação → Proposta → Negociação → Fechado)'],
      ['PASSO 7: Vá no Dashboard e veja seus números!'],
      [],
      ['🎯 STATUS RECOMENDADOS:'],
      [],
      ['• Qualificação: Cliente demonstrou interesse, coletando informações'],
      ['• Proposta: Já apresentou o imóvel, aguardando decisão'],
      ['• Negociação: Cliente interessado, negociando condições'],
      ['• Fechado: Venda concretizada! 🎉'],
      ['• Perdido: Cliente desistiu ou comprou com concorrente'],
      [],
      ['⚠️ LIMITAÇÕES DESTA PLANILHA:'],
      [],
      ['❌ Você precisa LEMBRAR de atualizar manualmente'],
      ['❌ Se esquecer um cliente, ele fica de fora'],
      ['❌ Não te avisa quando fazer follow-up'],
      ['❌ Não mostra histórico de conversas'],
      ['❌ Não integra com WhatsApp'],
      ['❌ Não tem IA para qualificar leads'],
      [],
      ['💡 SOLUÇÃO: SIRIUS CRM'],
      [],
      ['O que um CRM faz que uma planilha não faz:'],
      [],
      ['✅ ORGANIZAÇÃO VISUAL'],
      ['   → Pipeline Kanban (arrasta e solta)'],
      ['   → Vê todos os clientes de uma vez'],
      [],
      ['✅ AUTOMAÇÃO'],
      ['   → Lembretes automáticos de follow-up'],
      ['   → Emails automáticos para clientes'],
      ['   → Integração WhatsApp (1 clique para conversar)'],
      [],
      ['✅ INTELIGÊNCIA ARTIFICIAL'],
      ['   → IA analisa quais leads têm mais chance de fechar'],
      ['   → Sugere próximos passos'],
      ['   → Qualifica leads automaticamente (BANT)'],
      [],
      ['✅ MOBILE'],
      ['   → App no celular (funciona offline)'],
      ['   → Registra visita na hora'],
      ['   → Sincroniza com Google Calendar'],
      [],
      ['✅ ANALYTICS'],
      ['   → Gráficos automáticos'],
      ['   → Previsão de receita'],
      ['   → Identifica gargalos'],
      [],
      ['💰 QUANTO CUSTA?'],
      [],
      ['PLANO FREE (para sempre):'],
      ['✓ Até 100 deals/mês'],
      ['✓ Pipeline Kanban'],
      ['✓ WhatsApp integrado'],
      ['✓ Sem limite de tempo'],
      [],
      ['PLANO PRO (R$ 97/mês):'],
      ['✓ Deals ilimitados'],
      ['✓ IA que qualifica leads'],
      ['✓ Automações de email'],
      ['✓ Multi-pipeline'],
      ['✓ Analytics avançado'],
      [],
      ['🚀 COMECE AGORA (GRÁTIS):'],
      [],
      ['1. Acesse: sirius.roilabs.com.br'],
      ['2. Cadastre-se (email + senha)'],
      ['3. Comece a usar em 5 minutos'],
      ['4. Importe seus leads desta planilha (CSV)'],
      ['5. Teste GRÁTIS por tempo ILIMITADO'],
      ['6. Upgrade só se quiser (sem compromisso)'],
      [],
      ['📞 SUPORTE:'],
      [],
      ['Dúvidas? Fale com a gente:'],
      ['Email: suporte@sirius.roilabs.com.br'],
      ['Site: sirius.roilabs.com.br'],
      [],
      ['⭐ Esta planilha foi criada por: ROI Labs'],
      ['💙 Ajudamos corretores a venderem mais com tecnologia.'],
      [],
      ['Boa sorte nas vendas! 🏡💰'],
    ];

    const wsInstrucoes = XLSX.utils.aoa_to_sheet(dadosInstrucoes);

    wsInstrucoes['!cols'] = [
      { wch: 75 },  // Conteúdo
    ];

    // ============================================
    // ADICIONAR ABAS AO WORKBOOK
    // ============================================
    XLSX.utils.book_append_sheet(wb, wsControle, "Controle de Vendas");
    XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard");
    XLSX.utils.book_append_sheet(wb, wsCalculadora, "Calculadora ROI");
    XLSX.utils.book_append_sheet(wb, wsInstrucoes, "📖 Instruções");

    // ============================================
    // GERAR ARQUIVO XLSX
    // ============================================
    const buf = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true
    });

    // ============================================
    // RETORNAR RESPOSTA COM ARQUIVO
    // ============================================
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Planilha-Controle-Comissao-Corretor-2026-Sirius-CRM.xlsx"',
        'Cache-Control': 'public, max-age=86400', // Cache 24 horas
      }
    });

  } catch (error) {
    console.error('Erro ao gerar planilha:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar planilha' },
      { status: 500 }
    );
  }
}
