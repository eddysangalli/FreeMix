# Instalador: caminhos longos corrigidos nas fontes

Root integrou somenteSetup.cs eUninstall.cs após revisão completa e20pins. Tratamento moderno dePath e prefixo estendido apenas noI/O; comparação de caminhos/containment/hash/reparse permanece rigorosa. Pré-seleção opcional do botãoProcurar tolera vazio/inválido/setter recusado; validação ao instalar continua estrita.

Regressões compiladas de.NET reais em árvores sintéticas próprias:266/276/400,remoção3/3comhash,preservação de alterados/projeto/config/mídia,ZIPtraversal e junção369 recusados,extração400/SafeDelete e pré-seleçãoPASS. Isso ainda exige novoSetup e teste instalado de instalação/desinstalação longo; nenhum pacote foi promovido.093000 mantémFAILoriginal,600 permanece selecionado. Não há prova deWindowslimpo/COM/Qt/certificado/Frameworkantigo nem alteração global deLongPathsEnabled.
