# Closes the program the way an operator does: asks the main window to close and answers the question it shows
# ("Deseja salvar as alteracoes no Preset atual?"). By default answers "Salvar e fechar"; with -Descartar answers
# "Descartar alteracoes e Fechar". Used by the test routines; killing the process instead would skip the saving
# of settings that happens on a normal exit.
param([int]$TimeoutSec = 45, [switch]$Descartar)
$root = Split-Path -Parent $PSScriptRoot
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$p = Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" } | Select-Object -First 1
if (-not $p) { 'nao estava aberto'; exit 0 }
[void]$p.CloseMainWindow()
$want = if ($Descartar) { '^(Descartar|Discard)' } else { '^(Salvar e fechar|Save and close|Yes|Sim|OK)$' }
$A = [System.Windows.Automation.AutomationElement]
$byPid = New-Object System.Windows.Automation.PropertyCondition($A::ProcessIdProperty, $p.Id)
$isButton = New-Object System.Windows.Automation.PropertyCondition($A::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
$isWindow = New-Object System.Windows.Automation.PropertyCondition($A::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)
$asked = ''
$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline -and -not $p.HasExited) {
  Start-Sleep -Milliseconds 600
  try {
    foreach ($w in $A::RootElement.FindAll('Children', $byPid)) {
      # The question is a small dialog: either a top-level window of its own or a child window of the main one.
      foreach ($d in @($w) + @($w.FindAll('Children', $isWindow))) {
        if ($d.Current.BoundingRectangle.Width -gt 900) { continue }
        $buttons = @($d.FindAll('Descendants', $isButton) | ForEach-Object { $_ })
        foreach ($b in $buttons) {
          if (($b.Current.Name -replace '&', '') -match $want) {
            $asked = "pergunta '$($d.Current.Name)', botoes [$((($buttons | ForEach-Object { $_.Current.Name -replace '&', '' } | Where-Object { $_ }) -join ' | '))], respondeu '$($b.Current.Name -replace '&', '')'"
            $b.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke(); break
          }
        }
      }
    }
  } catch { }
  $p.Refresh()
}
if ($p.HasExited) { "fechado$(if ($asked) { " ($asked)" })"; exit 0 }
'continua aberto'; exit 1
