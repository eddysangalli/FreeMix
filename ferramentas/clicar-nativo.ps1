# Presses a native control of the program window (one drawn by FreeMix.exe itself, not by the panel) through the
# accessibility interface, the way a screen reader would, and prints its state: "on", "off" or "none" (not a toggle).
# -IdContains: piece of the control's automation id (the object names from the window down, e.g. freemixOverlayButtons)
# -Name: the control's text (e.g. 8). -StateOnly: do not press, only report.
# Controls that open a menu block this kind of press: for those use window messages (see test-safearea.ps1).
param([string]$IdContains = '', [string]$Name = '', [switch]$StateOnly)
$root = Split-Path -Parent $PSScriptRoot
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$A = [System.Windows.Automation.AutomationElement]; $T = [System.Windows.Automation.TreeScope]
$p = Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" } | Select-Object -First 1
if (-not $p) { 'programa fechado'; exit 1 }
# The main window is the widest top-level window of the process: a tooltip or a projector can be the "main" one
# for the system at a given moment.
$main = $null; $widest = 0
foreach ($w in $A::RootElement.FindAll($T::Children, (New-Object System.Windows.Automation.PropertyCondition($A::ProcessIdProperty, $p.Id)))) { $width = $w.Current.BoundingRectangle.Width; if ($width -gt $widest) { $widest = $width; $main = $w } }
if (-not $main) { 'janela do programa nao encontrada'; exit 1 }
$found = $null
foreach ($e in $main.FindAll($T::Descendants, [System.Windows.Automation.Condition]::TrueCondition)) {
  $c = $e.Current
  if ($IdContains -and $c.AutomationId -notlike "*$IdContains*") { continue }
  if ($Name -and $c.Name -ne $Name) { continue }
  $found = $e; break
}
if (-not $found) { 'nao achei o controle'; exit 1 }
if (-not $found.Current.IsEnabled) { 'desabilitado'; exit 2 }
if (-not $StateOnly) {
  $invoke = $null
  if (-not $found.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$invoke)) { 'o controle nao aceita ser pressionado'; exit 1 }
  $invoke.Invoke(); Start-Sleep -Milliseconds 900
}
$toggle = $null
if ($found.TryGetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern, [ref]$toggle)) { if ($toggle.Current.ToggleState -eq 'On') { 'on' } else { 'off' } } else { 'none' }
