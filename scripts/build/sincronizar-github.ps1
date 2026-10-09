# Copies the current state of the product into the working tree of the private GitHub repository (folder FreeMix):
# the panel, the tools, the theme, the launchers, the component list, the language overrides, the handoff document
# and the program's own code, as a patch series over OBS Studio 32.2.2 (folder fork).
# Never copied: the control-server password (painel\local.js), settings, binaries, recordings, logs.
# Stops with an error if that password, or anything that looks like a token, shows up in what was copied.
# Does not commit and does not push: look at "git -C FreeMix status", then commit and push by hand.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..')); $src = Join-Path $root 'obs-vmix'; $dst = Join-Path $root 'FreeMix'; $app = Join-Path $root 'freemix-app'
$base = 'ba2f32b'   # OBS Studio 32.2.2, the commit the fork starts from
$quiet = @('/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:1', '/W:1')

# Titles imported by the operator (painel\gc\gt_titles) stay on the machine: they may be somebody else's work.
robocopy (Join-Path $src 'painel') (Join-Path $dst 'painel') /E /XF local.js /XD gt_titles @quiet | Out-Null
robocopy (Join-Path $src 'ferramentas') (Join-Path $dst 'ferramentas') *.mjs *.ps1 *.py *.js *.cs /XF scratch_* inspect_* @quiet | Out-Null
# The gallery's catalogue is rebuilt from the templates that are in the repository.
$node = Join-Path $root 'node24\node.exe'; if (-not (Test-Path -LiteralPath $node)) { $node = 'node' }
& $node (Join-Path $dst 'ferramentas\gerar-catalogo-gc.mjs') | Out-Null
Copy-Item -LiteralPath (Join-Path $src 'config\obs-studio\themes\Yami_MesaDeCorte.ovt') -Destination (Join-Path $dst 'theme\Yami_MesaDeCorte.ovt') -Force
New-Item -ItemType Directory -Path (Join-Path $dst 'templates/portatil') -Force | Out-Null
foreach ($f in 'Iniciar Mesa.cmd', 'FreeMix Studio.cmd') { Copy-Item -LiteralPath (Join-Path $src $f) -Destination (Join-Path $dst 'templates/portatil') -Force }
Copy-Item -LiteralPath (Join-Path $src 'componentes.json') -Destination (Join-Path $dst 'componentes.json') -Force
# Technical continuation is synchronized below in docs, not duplicated in the repository root.
foreach ($f in 'pt-BR.ini', 'en-US.ini') { Copy-Item -LiteralPath (Join-Path $src "data\obs-studio\locale\$f") -Destination (Join-Path $dst "config\locale\$f") -Force }

robocopy (Join-Path $root 'docs') (Join-Path $dst 'docs') /E @quiet | Out-Null
robocopy (Join-Path $root 'scripts') (Join-Path $dst 'scripts') /E /XF *.exe *.log PayloadInfo.cs @quiet | Out-Null
# The program's code: one patch per commit of the fork since the base.
$fork = Join-Path $dst 'fork'
New-Item -ItemType Directory -Force $fork | Out-Null
foreach ($old in Get-ChildItem -LiteralPath $fork -Filter *.patch) { Remove-Item -LiteralPath $old.FullName }
git -C $app format-patch --binary --quiet -o $fork "$base..HEAD"
$head = (git -C $app log -1 --format='%h %s')
$n = @(Get-ChildItem -LiteralPath $fork -Filter *.patch).Count

# Nothing secret may leave the machine.
$pw = [regex]::Match((Get-Content -LiteralPath (Join-Path $src 'painel\local.js') -Raw), '"password"\s*:\s*"([^"]+)"').Groups[1].Value
$bad = @()
foreach ($file in Get-ChildItem -LiteralPath $dst -Recurse -File | Where-Object { $_.FullName -notlike "$dst\.git\*" -and $_.Length -lt 5MB }) {
  $text = [System.IO.File]::ReadAllText($file.FullName)
  if ($pw -and $text.Contains($pw)) { $bad += "senha do servidor de controle em $($file.FullName.Substring($dst.Length + 1))" }
  if ($text -match 'gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{30,}|live_[0-9]{6,}_[A-Za-z0-9]{20,}') { $bad += "algo com cara de chave em $($file.FullName.Substring($dst.Length + 1))" }
}
if (Test-Path -LiteralPath (Join-Path $dst 'painel\local.js')) { $bad += 'painel\local.js foi parar no repositorio' }
if ($bad.Count) { 'PARADO, nao publique:'; $bad; exit 1 }
"Copiado para FreeMix. Codigo do programa: $n patches sobre o OBS 32.2.2, ate '$head'. Nenhuma senha ou chave encontrada."
