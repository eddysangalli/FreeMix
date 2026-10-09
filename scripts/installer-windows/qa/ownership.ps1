param([Parameter(Mandatory=$true)][string]$Root,[Parameter(Mandatory=$true)][string]$Stub)
$ErrorActionPreference='Stop'
$target=[IO.Path]::GetFullPath($Root)
$qaPrefix=[IO.Path]::GetFullPath($env:TEMP).TrimEnd('\')+'\FreeMix-QA-Distribution-'
if(-not $target.StartsWith($qaPrefix,[StringComparison]::OrdinalIgnoreCase)){throw 'Ownership QA target outside approved TEMP prefix'}
$assembly=[Reflection.Assembly]::LoadFile([IO.Path]::GetFullPath($Stub))
$method=$assembly.GetType('FreeMixSetup.Installer').GetMethod('WriteUninstaller',[Reflection.BindingFlags]'NonPublic,Static')
$arguments=[object[]]::new(2);$arguments[0]=[string]$target;$arguments[1]=[Collections.Generic.List[string]]::new()
$null=$method.Invoke($null,$arguments)
Write-Output 'Uninstaller ownership receipt created in isolated TEMP installation.'
