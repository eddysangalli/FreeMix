# Dialog nativo do Windows para importar pacotes .gtzip no FreeMix Studio
# Acionado pelo painel da Mesa (Add Input › Title › Importar .gtzip)
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Filter = "Pacotes de títulos (*.gtzip)|*.gtzip|Todos os arquivos (*.*)|*.*"
$dialog.Title = "Selecionar pacote de títulos (.gtzip)"
$dialog.Multiselect = $true

# Node that comes with this folder's tools when it is there; otherwise the one installed on the machine.
$node = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'node24\node.exe'
if (-not (Test-Path -LiteralPath $node)) { $node = 'node' }

$res = $dialog.ShowDialog()
if ($res -eq [System.Windows.Forms.DialogResult]::OK) {
    foreach ($file in $dialog.FileNames) {
        & $node "$PSScriptRoot\importar-gt-packs.mjs" "$file"
    }
}
