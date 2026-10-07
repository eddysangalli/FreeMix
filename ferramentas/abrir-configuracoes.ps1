# Opens the engine's full Settings window by invoking the action of its native menu, which the theme keeps hidden.
# Started by ajudante.ps1 when the panel asks for it. The call only returns when that window is closed (it is modal),
# so the timeout at the end is expected and ignored.
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
Add-Type @'
using System; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class CfgMain {
  public delegate bool EP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EP cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public struct RECT { public int L, T, R, B; }
  // The main window is the widest visible one of the process.
  public static IntPtr Widest(uint pid) { IntPtr best = IntPtr.Zero; int w = 0; EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); RECT r; if (p == pid && IsWindowVisible(h) && GetWindowRect(h, out r) && r.R - r.L > w) { w = r.R - r.L; best = h; } return true; }, IntPtr.Zero); return best; }
}
'@
$root = Split-Path -Parent $PSScriptRoot
$p = Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" } | Select-Object -First 1
if (-not $p) { exit 1 }
$A = [System.Windows.Automation.AutomationElement]; $T = [System.Windows.Automation.TreeScope]
$isItem = New-Object System.Windows.Automation.PropertyCondition($A::ControlTypeProperty, [System.Windows.Automation.ControlType]::MenuItem)
$main = $A::FromHandle([CfgMain]::Widest([uint32]$p.Id))
$file = $main.FindAll($T::Descendants, $isItem) | Select-Object -First 1      # first menu of the bar: the one that holds Settings
if (-not $file) { exit 1 }
$file.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern).Expand()
Start-Sleep -Milliseconds 500
$item = $main.FindAll($T::Descendants, $isItem) | Where-Object { $_.Current.Name -match '^(Settings|Configura)' } | Select-Object -First 1
if (-not $item) { $file.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern).Collapse(); exit 1 }
try { $item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke() } catch { }
