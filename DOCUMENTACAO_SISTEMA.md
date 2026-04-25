# Documentacao do Sistema: Canaa Performance

## 1. Visao Geral e Arquitetura do Sistema
O sistema "Canaa Performance" atua como uma plataforma centralizadora para calculo, rastreamento e auditoria de comissionamento de vendas e retencao na Canaa Telecom.

O paradigma arquitetural escolhido baseia-se num sistema acoplado a um banco de dados relacional interno (PostgreSQL) para geracao dos dados de aplicacao (comissoes, historicos e sessoes), ao passo em que consume ativamente e somente para leitura o banco de dados do ERP proprietario (MariaDB IXC) via chamadas SQL nativas em tempo real.

O projeto se estrutura de forma modular:
* Camada de Apresentacao: SPA desenvolvida usando Vite, baseada no framework Vue.js (v3) com a abordagem da API de Composicao (Composition API). O deploy ocorre usualmente atraves de um container servidor Nginx padronizado para expor a interface grafica (porta web 8090).
* Camada de Logica de Negocios: Uma API REST utilizando Node.js e Express, escrita com forte tipagem atraves de TypeScript, implementando padroes de projeto fundamentados nos conceitos de Controllers, Services e Repositories.
* Camada de Acesso Espelhada de Banco de Dados: O ORM Prisma efetua as operacoes essenciais de DDL e DML exclusivas sobre a base PostgreSQL interna da aplicacao. Em paralalo, abstrai conexoes cruas via pacote mysql2 focadas na interrogacao de objetos do banco MariaDB.

## 2. Tabelas do Banco de Dados Principal (PostgreSQL)
A topologia no Prisma compreende registros de tabelas como `Commission`, possuindo chaves contendo id_contrato do IXC e integrando chaves estrangeiras logicas. Entidades `Adjustment`.

## 3. Topologia de Integracao Externa com ERP (MariaDB)
Para manter latencia minima e alta coesao processual sem duplicar informacoes em sistemas distintos operando assincronamente:
1. Autenticacao de usuarios processa uma hash direto do banco externo para validar acesso a aplicacao central.
2. Contratos verificados no IXC pelo MariaDB fornecem instantaneamente status atual (inativo / ativo).
3. Tabelas cliente_arquivos sao lidas em rotinas baseadas em padroes matematicos (Regex) para inferir situacao validatoria sobre os documentos assinados digitalmente. 

## 4. Regras Internas de Avaliacao Operacional
As rotinas internas rodam baseadas em checagem sob regime diario e sobre operacoes diretas via interface REST.

### 4.1. Funcao Matematica e Logica de Cadastro de Comissoes
A rota `POST /api/v1/bdr/commissions` invoca regras especificas em tempo limpo.
* A operacao Upgrade invoca que o calculo dependente obrigatoriamente sera a subtracao matematica de duas variaveis: `valor plano novo - valor base IXC` em formato decimal (float/double). Exception triggers disparando contra valores in compativeis.
* A operacao Downgrade assinala em banco o valor representativo flutuante base 0.0 constante, em obrigatoriedade na marcacao de registro para analitica futura da consultoria.
* A operacao Refidelizacao invoca repasse em unidade inteira e decimal representativa 3.0 constante.

### 4.2. Logica Assinatura Eletronica ZapSign e GovSign
A analise de assinaturas baseia-se em extracao referencial padrao usando REGEXP.
* GovSignService: A busca no servidor externo MariaDB intercepta apenas documentos localizados com expressao regular base `^[0-9]+-[Gg][Oo][Vv]`. Trata a cadeia literal partindo antes do caractere hifen (codigo exato). Manutencao de integridade realizada atraves de rotina com TTL local de quinze minutos minimizando execucoes volumosas por requisicao do frontend.
* ZapSign: Metodo similar a busca anterior focado na validacao formatada onde o conjunto se enquadre em `^[0-9]+ - `. Ambas garantem o acoplamento do documento com a entidade sem recorrer a subconsultas logicas profundas (evitando estourar tempo de resposta e pool limite).

### 4.3. Monitoramento Constante e Alertas Regulares
O sistema operacional cronologico do modulos "Alertas" engatilha internamente verificacoes especificas. Um pipeline executa pontualmente e diariamente uma avaliacao sob regime horario (8h BRT):
1. Avalia situacoes estagnadas por prazos superiores a 10 dias (situacao assinatoria desaprovada e pendencias de baixa financeira no IXC). Notifica a gerencia operacional via correio eletronico em padrao SMTP parametrizavel sob as variaveis `ALERT_EMAIL_COMERCIAL`.
2. Monitora as pontuacoes metas CS (Customer Success). Reporta pontualmente nos patamares estaticos de valor (atualmente 70, 90 e 110 itens concluidos).

## 5. Implementacao Segura do Snapshot Mensal
Uma snapshot atua para solidificar eventos cronologicos. Representa fisicamente o rastreamento final executado sobre o banco principal sem interferencia em background.
Para gerar a imutabilidade, o codigo consolida informacoes em arrays operados na entidade para marcacao na coluna parametrizada `enviado` apontando true. Toda edicao e trancada subsequentemente para leitura, registrando colchetes e tempo UNIX referencial originario.

## 6. Padroes de Deploy Oficial
Recomenda-se operar num ecossistema baseado em agrupamentos de conteineres Linux para mitigar colisoes de rede interna. O documento de especificacao `docker-compose.yml` providencia orquestracao minima isolada entre os containers Frontend (redirecionamento de host reverso interno), Backend Node REST API e Base de Dados PostgreSQL nativa em porta blindada exteriormente. Execucoes requerem comando composicao para montar redes em bridge entre modulos `docker compose up --build -d`. Necessitando das chaves cruciais de ambiente `MYSQL_HOST`, `MYSQL_USER`, e senhas sensiveis isoladas permanentemente de auditoria.
