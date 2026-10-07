# Opens the Safe Area menu of the Preview title bar with a real click message, photographs the menu and picks the
# option at the given position with the keyboard (1 = None, 2 = SMPTE/EBU, ... 7 = GRID 4, 12 = Vertical 9:16).
# The control is native (FreeMix.exe), so this goes through window messages, not through the panel.
# UI Automation finds the icon but cannot open its menu (the call blocks), hence the messages.
# Check the drawing by eye with captura.ps1; the choice is saved in user.ini ([BasicWindow] FreeMixSafeArea) on exit.
param([int]$Position = 7, [string]$MenuShot = '')
$root = Split-Path -Parent $PSScriptRoot
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Drawing
Add-Type @'
using System; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class SafeAreaWin {
  public delegate bool EP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EP cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool ScreenToClient(IntPtr h, ref POINT p);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  public struct RECT { public int L, T, R, B; } public struct POINT { public int X, Y; }
  public static List<IntPtr> Small(uint pid, IntPtr main) { var list = new List<IntPtr>(); EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); RECT r; if (p == pid && h != main && IsWindowVisible(h) && GetWindowRect(h, out r) && r.R - r.L > 80 && r.R - r.L < 500 && r.B - r.T > 120) list.Add(h); return true; }, IntPtr.Zero); return list; }
}
'@
$A = [System.Windows.Automation.AutomationElement]; $T = [System.Windows.Automation.TreeScope]
$p = Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" -and $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if (-not $p) { 'programa fechado'; exit 1 }
$btn = $A::FromHandle($p.MainWindowHandle).FindFirst($T::Descendants, (New-Object System.Windows.Automation.PropertyCondition($A::NameProperty, [string][char]0x25A3)))
if (-not $btn) { 'FALHA nao achei o icone de Safe Area no titulo do Preview'; exit 1 }
$r = $btn.Current.BoundingRectangle
$pt = New-Object SafeAreaWin+POINT; $pt.X = [int]($r.X + $r.Width / 2); $pt.Y = [int]($r.Y + $r.Height / 2)
[void][SafeAreaWin]::ScreenToClient($p.MainWindowHandle, [ref]$pt)
$lp = [IntPtr](($pt.Y -shl 16) -bor ($pt.X -band 0xFFFF))
[void][SafeAreaWin]::PostMessage($p.MainWindowHandle, 0x0200, [IntPtr]::Zero, $lp)   # mouse move
[void][SafeAreaWin]::PostMessage($p.MainWindowHandle, 0x0201, [IntPtr]1, $lp)        # left button down
[void][SafeAreaWin]::PostMessage($p.MainWindowHandle, 0x0202, [IntPtr]::Zero, $lp)   # left button up
$menu = $null; $n = 0
while (-not $menu -and $n -lt 10) { Start-Sleep -Milliseconds 300; $n++; $menu = [SafeAreaWin]::Small([uint32]$p.Id, $p.MainWindowHandle) | Select-Object -First 1 }
if (-not $menu) { 'FALHA o clique no icone nao abriu o menu'; exit 1 }
$mr = New-Object SafeAreaWin+RECT; [void][SafeAreaWin]::GetWindowRect($menu, [ref]$mr)
"OK    o clique no icone abriu o menu ($($mr.R - $mr.L)x$($mr.B - $mr.T) px)"
if ($MenuShot) {
  $bmp = New-Object System.Drawing.Bitmap ($mr.R - $mr.L), ($mr.B - $mr.T); $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
  [void][SafeAreaWin]::PrintWindow($menu, $dc, 2); $g.ReleaseHdc($dc); $g.Dispose(); $bmp.Save($MenuShot, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}
[void][SafeAreaWin]::PostMessage($menu, 0x0100, [IntPtr]0x24, [IntPtr]::Zero); [void][SafeAreaWin]::PostMessage($menu, 0x0101, [IntPtr]0x24, [IntPtr]::Zero); Start-Sleep -Milliseconds 80   # Home: first option (None)
for ($i = 1; $i -lt $Position; $i++) { [void][SafeAreaWin]::PostMessage($menu, 0x0100, [IntPtr]0x28, [IntPtr]::Zero); [void][SafeAreaWin]::PostMessage($menu, 0x0101, [IntPtr]0x28, [IntPtr]::Zero); Start-Sleep -Milliseconds 60 }
[void][SafeAreaWin]::PostMessage($menu, 0x0100, [IntPtr]0x0D, [IntPtr]::Zero); [void][SafeAreaWin]::PostMessage($menu, 0x0101, [IntPtr]0x0D, [IntPtr]::Zero)
Start-Sleep -Milliseconds 500
if ([SafeAreaWin]::Small([uint32]$p.Id, $p.MainWindowHandle).Count) { 'FALHA o menu continuou aberto depois do Enter'; exit 1 }
"OK    opcao na posicao $Position escolhida pelo teclado"
