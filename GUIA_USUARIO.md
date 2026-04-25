# Manual do Usuario: Canaa Performance

## 1. Introducao ao Sistema
O Canaa Performance e uma plataforma desenvolvida para gerenciar, registrar e analisar as comissoes da equipe de vendas corporativas e de retencao. O sistema se conecta diretamente ao banco de dados interno (ERP IXC) para validar as informacoes em tempo real, garantindo seguranca e assertividade nos valores lancados.

Este documento detalha o funcionamento tecnico e operacional da plataforma, sendo direcionado tanto para os usuarios finais (consultores e lideranca) quanto para os analistas de processos que garantem o fluxo correto das operacoes.

## 2. Acesso ao Diferencial
1. Abra um navegador web de sua preferencia.
2. Acesse a URL corporativa destinada ao sistema (http://hub.canaatelecom.com.br/bdr/).
3. Utilize o mesmo e-mail e a mesma senha cadastrados na plataforma IXC. Todas as atualizacoes de credenciais realizadas no IXC sao replicadas automaticamente.
4. O sistema identificara o perfil do usuario, liberando o acesso apenas aos modulos pertinentes a funcao (Vendas, Retencao ou Gestao).

## 3. Perfis e Permissoes
A ferramenta opera baseada em perfis de usuario classificados diretamente pelo grupo do colaborador no IXC.

* Perfil Consultor BDR: Visualizacao de comissoes proprias e acesso ao modulo de lancamento.
* Perfil Retencao (CS): Visualizacao do desempenho pessoal nas metas de retencao.
* Perfil Gestao e Lideranca: Acesso integral. Permite avaliacao de indicadores de toda a equipe, ajustes manuais financeiros e fechamento de folha de pagamento.

## 4. Modulo do Consultor BDR
Este modulo permite o registro das negociacoes finalizadas.

### 4.1. Passo a Passo para Lancamento de Comissoes
1. Navegue ate a secao "Lancar" no menu lateral.
2. No campo correspondente, insira o identificador unico do contrato numerico (gerado pelo IXC). O sistema realizara uma consulta e carregara automaticamente os dados do cliente e o valor atual.
3. Escolha o seu nome na lista suspensa de vendedores.
4. Selecione a modalidade da negociacao. Existem tres tipos com calculos distintos:
   * Upgrade: Ocorre quando ha aumento de plano. E obrigatorio inserir o novo valor do contrato (que deve ser estritamente maior que o atual). A comissao gerada sera exatamente a diferenca entre o novo valor e o valor antigo.
   * Downgrade: Ocorre quando ha reducao de plano. O operador deve inserir o novo valor. Para fins de comissionamento, o sistema computa R$ 0,00 neste cenario.
   * Refidelizacao: Ocorre na renovacao de periodo. O sistema fixa a comissao em R$ 3,00.
5. Verifique os valores apresentados e clique no botao de registro.

### 4.2. Acompanhamento e Status das Comissoes
Os consultores devem acompanhar constantemente o status de validacao de cada comissao registrada.
* A aba "Dashboard (Vendas)" exibe os valores ja validados para o mes.
* O sistema conta com uma area de valores bloqueados. O bloqueio temporario de uma comissao e ativado se a fatura nao for paga ou caso o documento nao receba assinatura oficial.

## 5. Modulo do Operador de Retencao (CS)
O segmento de retencao foca especificamente no alcance de metas.

### 5.1. Acompanhamento de Metas
1. Acesse o menu "Retencao".
2. Verifique o indicador total de aprovacoes no ciclo mensal.
3. O painel destacara os patamares a serem atingidos para a liberacao de bonus corporativo:
   * Nivel Bronze (70 aprovacoes no mes): Bonus de R$ 400,00.
   * Nivel Prata (90 aprovacoes no mes): Bonus de R$ 550,00.
   * Nivel Ouro (110 aprovacoes no mes): Bonus de R$ 750,00.
4. O gestor direto recebe uma alerta formal do sistema assim que as metas sao ultrapassadas por um colaborador.

## 6. Modulo de Lideranca e Gestao
Os profissionais de gerencia possuem acesso para acompanhamento e encerramento financeiro do mes.

### 6.1. Visoes Executivas e Painel de Resultados
* O sistema fornece um ranking organizado por volume comercial geral e desempenho singular dos colaboradores.
* Uma visao agregada com os valores prontos para pagamento, identificando eventuais irregularidades para tratativa da gestao antes do fechamento definitivo.

### 6.2. Insercao de Ajustes Manuais
A ferramenta permite intervir sobre o montante de um colaborador justificadamente.
1. Localize a aba "Comissoes".
2. Acesse a funcionalidade de "Ajustes Manuais".
3. Identifique o colaborador, a justificativa da acao e o valor final (podendo ser adicao ou reducao monetaria).
4. Essa acao ficara registrada permanentemente para fins de auditoria interna corporativa.

### 6.3. Fechamento Mensal e Processamento de Folha
O ciclo de pagamento se encerra pela ferramenta de "Snapshot". Este evento imuta os dados do mes apurado, isolando modificacoes futuras.
1. Selecione o mes recem-concluido no menu de monitoramento.
2. Acione o botao "Gerar Snapshot". Esse procedimento verificara minuciosamente a situacao real dos contratos no ERP na data exata da criacao do registro.
3. Revise as listagens dos valores indicados.
4. Acione a funcao de envio para departamento responsavel. A partir da efetivacao desta etapa, as comissoes processadas ficarao congeladas e o painel operara exclusivamente com capacidade de leitura e consulta.

## 7. Padroes Operacionais Obrigatorios
A atencao na submissao de arquivos assinados e essencial para viabilizar pagamentos sem intervencoes manuais. O sistema verifica as bases em formato literal para homologar as assinaturas.

### 7.1. Nomenclatura Estrita de Documentos
A equipe precisa se adequar a duas modelagens de envio de arquivo ao banco de dados do cliente na retaguarda.
* ZapSign: A versao original do arquivo deve ser inserida adotando a convencao ID DO CONTRATO seguido do nome do assinante. Exemplo pratico: "123456 - Maria Silveira".
* GovSign: As assinaturas provenientes do certificado digital do governo e salvas na area de anexos do cliente devem necessariamente carregar o formato obrigatorio ID DO CONTRATO seguido da terminologia literal GOV. Exemplo pratico: "123456 - GOV".

Falhas de tipificacao nestas convencoes resultam no bloqueio sistemicos das concessoes atreladas ao contato.

## 8. Tratativa de Erros Comuns
1. Impossibilidade de localizar um contrato: O sistema rastreia apenas os que encontram-se marcados no estado ativo de provedor. Em emissoes recentes, espere ate que a classificacao do cliente altere plenamente para ativo.
2. Downgrades apresentando retorno zero: Por normativa empresarial, as concessoes de reducao financeira de plano nao rendem margens de ganho comissionadas ao consultor, embora os registros no controle permaneçam sob carater obrigatorio.
3. Exclusao de registros apos fechamento: Nos moldes de negocios pre-aprovados pela gestao de vendas, irregularidades prolongadas, a exemplo da ausencia cronica da assinatura e do pagamento do pacote submetido, nao tem viabilidade para participacao financeira apos o periodo maximo de fechamento. Trate os relatorios com antecedencia pertinente junto as dependencias de suporte do cliente.
