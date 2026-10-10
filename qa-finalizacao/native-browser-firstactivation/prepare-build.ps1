$ErrorActionPreference='Stop'
$nativeRoot=(Resolve-Path -LiteralPath 'freemix-app').Path
$projectSource=Join-Path $nativeRoot 'build_2026/plugins/obs-browser/obs-browser.vcxproj'
$ownBuild=Join-Path $nativeRoot 'build_qa_browser_firstactivation'
if(Test-Path -LiteralPath $ownBuild){throw 'Preserve previous build'}
[void](New-Item -ItemType Directory -Path $ownBuild)
$projectTarget=Join-Path $ownBuild 'obs-browser.vcxproj'
[xml]$projectXml=Get-Content -Raw -LiteralPath $projectSource
$ns=New-Object System.Xml.XmlNamespaceManager($projectXml.NameTable)
$ns.AddNamespace('m','http://schemas.microsoft.com/developer/msbuild/2003')
$removed=@{}
foreach($name in @('PreBuildEvent','PostBuildEvent','CustomBuild','ProjectReference')){
 $nodes=@($projectXml.SelectNodes("//m:$name",$ns));$removed[$name]=$nodes.Count
 foreach($node in $nodes){[void]$node.ParentNode.RemoveChild($node)}
}
foreach($node in $projectXml.SelectNodes('//m:OutDir',$ns)){$node.InnerText=Join-Path $ownBuild 'out\'}
foreach($node in $projectXml.SelectNodes('//m:IntDir',$ns)){$node.InnerText='obj\$(Configuration)\'}
foreach($node in $projectXml.SelectNodes('//m:AdditionalDependencies',$ns)){
 $normalized=@();foreach($part in $node.InnerText.Split(';')){
  if($part.StartsWith('..\')){$normalized+=[IO.Path]::GetFullPath((Join-Path (Split-Path $projectSource -Parent) $part))}else{$normalized+=$part}
 };$node.InnerText=$normalized -join ';'
}
$projectXml.Save($projectTarget)
$receipt=[ordered]@{status='PREPARED_ISOLATED_PLUGIN_PROJECT';projectSource=$projectSource;projectTarget=$projectTarget;ownBuild=$ownBuild;removed=$removed;sourceHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $projectSource).Hash.ToLower();targetHash=(Get-FileHash -Algorithm SHA256 -LiteralPath $projectTarget).Hash.ToLower();configuration='RelWithDebInfo';parallel=2;commonProjectModified=$false;commonBuildRun=$false;operatorTouched=$false}
$receiptPath=Join-Path (Resolve-Path -LiteralPath 'qa-finalizacao/native-browser-firstactivation').Path 'build-recipe.json'
if(Test-Path -LiteralPath $receiptPath){throw 'Preserve recipe'}
[IO.File]::WriteAllText($receiptPath,($receipt|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))
$receipt|ConvertTo-Json -Depth 5
