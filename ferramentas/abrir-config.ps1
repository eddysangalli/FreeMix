# Test helper: open File > Settings in the portable OBS through UI Automation, capture that window to a PNG and close it again.
param([string]$Out, [int]$Page = -1)
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Drawing
Add-Type @'
using System; using System.Text; using System.Runtime.InteropServices;
public static class CfgWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public struct RECT { public int L, T, R, B; }
  public static IntPtr Find(uint pid, string prefix, bool not) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); var t = new StringBuilder(256); GetWindowText(h, t, 256); string s = t.ToString();
      if (p == pid && IsWindowVisible(h) && s.Length > 0 && (s.StartsWith(prefix) != not)) { found = h; return false; } return true; }, IntPtr.Zero);
    return found;
  }
}
'@
[CfgWin]::SetProcessDPIAware() | Out-Null
$proc = Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*obs-vmix*' } | Select-Object -First 1
if (-not $proc) { 'OBS portatil nao esta aberto'; exit 1 }
$A = [System.Windows.Automation.AutomationElement]; $T = [System.Windows.Automation.TreeScope]; $C = [System.Windows.Automation.ControlType]
$main = $A::FromHandle($proc.MainWindowHandle)
$isItem = New-Object System.Windows.Automation.PropertyCondition($A::ControlTypeProperty, $C::MenuItem)
$file = $main.FindAll($T::Descendants, $isItem) | Where-Object { $_.Current.Name -like 'Arquivo*' } | Select-Object -First 1
if (-not $file) { 'menu Arquivo nao encontrado'; exit 1 }
try { $file.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern).Expand() } catch { $file.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke() }
Start-Sleep -Milliseconds 700
$byPid = New-Object System.Windows.Automation.PropertyCondition($A::ProcessIdProperty, $proc.Id)
$item = $null
foreach ($w in $A::RootElement.FindAll($T::Children, $byPid)) { $item = $w.FindAll($T::Descendants, $isItem) | Where-Object { $_.Current.Name -match '^(Settings|Configura)' } | Select-Object -First 1; if ($item) { break } }
if (-not $item) { 'item Settings nao encontrado no menu'; exit 1 }
$item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Seconds 2
$h = [CfgWin]::Find([uint32]$proc.Id, 'OBS', $true)
if ($h -eq [IntPtr]::Zero) { 'janela de configuracoes nao apareceu'; exit 1 }
if ($Page -ge 0) {
  $dlg = $A::FromHandle($h); $isList = New-Object System.Windows.Automation.PropertyCondition($A::ControlTypeProperty, $C::ListItem)
  $rows = $dlg.FindAll($T::Descendants, $isList); if ($rows.Count -gt $Page) { $rows[$Page].GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern).Select(); Start-Sleep -Milliseconds 900 }
}
$r = New-Object CfgWin+RECT; [CfgWin]::GetWindowRect($h, [ref]$r) | Out-Null
$bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T); $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
[CfgWin]::PrintWindow($h, $dc, 2) | Out-Null; $g.ReleaseHdc($dc); $g.Dispose(); $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
"capturado $($bmp.Width)x$($bmp.Height) -> $Out"; $bmp.Dispose()
[CfgWin]::PostMessage($h, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
