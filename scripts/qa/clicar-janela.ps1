# Clicks inside the page shown by one window of a process (found by process id and a piece of its title), at a point
# given in page pixels, by posting the mouse messages to the browser surface of that window. The real mouse pointer
# is not moved. Prints whether the window still exists a moment later (to check that a "close" button closes it).
param([Parameter(Mandatory)][int]$ProcessId, [Parameter(Mandatory)][string]$Title, [Parameter(Mandatory)][int]$X, [Parameter(Mandatory)][int]$Y, [int]$WaitMs = 1500, [int]$Surface = -1, [switch]$List)
Add-Type @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class CliqueJanela {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr parent, EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  public static string Text(IntPtr h) { var s = new StringBuilder(300); GetWindowText(h, s, 300); return s.ToString(); }
  public static string Class(IntPtr h) { var s = new StringBuilder(300); GetClassName(h, s, 300); return s.ToString(); }
  public static IntPtr Find(uint pid, string title) { IntPtr found = IntPtr.Zero; EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h) && Text(h).Contains(title)) { found = h; return false; } return true; }, IntPtr.Zero); return found; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public struct RECT { public int L, T, R, B; }
  public static List<IntPtr> Surfaces(IntPtr top) { var o = new List<IntPtr>(); EnumChildWindows(top, (h, l) => { if (Class(h) == "Chrome_RenderWidgetHostHWND" && IsWindowVisible(h)) o.Add(h); return true; }, IntPtr.Zero); return o; }
  public static IntPtr Surface(IntPtr top) { IntPtr found = IntPtr.Zero; EnumChildWindows(top, (h, l) => { if (Class(h) == "Chrome_RenderWidgetHostHWND") { found = h; return false; } return true; }, IntPtr.Zero); return found; }
}
'@
$top = [CliqueJanela]::Find([uint32]$ProcessId, $Title)
if ($top -eq [IntPtr]::Zero) { "janela '$Title' nao encontrada"; exit 1 }
$all = @([CliqueJanela]::Surfaces($top) | ForEach-Object { $r = New-Object CliqueJanela+RECT; [void][CliqueJanela]::GetWindowRect($_, [ref]$r); [pscustomobject]@{ H = $_; W = $r.R - $r.L; Hh = $r.B - $r.T; L = $r.L; T = $r.T } } | Sort-Object { -($_.W * $_.Hh) })
if ($List) { $i = 0; $all | ForEach-Object { "superficie $i : $($_.W)x$($_.Hh) em ($($_.L),$($_.T))"; $i++ }; exit 0 }
$surface = if ($Surface -ge 0 -and $Surface -lt $all.Count) { $all[$Surface].H } else { [CliqueJanela]::Surface($top) }
if ($surface -eq [IntPtr]::Zero) { "superficie do navegador nao encontrada em '$([CliqueJanela]::Text($top))'"; exit 1 }
$l = [IntPtr](($Y -shl 16) -bor ($X -band 0xFFFF))
[void][CliqueJanela]::PostMessage($surface, 0x0200, [IntPtr]0, $l)   # WM_MOUSEMOVE
Start-Sleep -Milliseconds 80
[void][CliqueJanela]::PostMessage($surface, 0x0201, [IntPtr]1, $l)   # WM_LBUTTONDOWN
Start-Sleep -Milliseconds 60
[void][CliqueJanela]::PostMessage($surface, 0x0202, [IntPtr]0, $l)   # WM_LBUTTONUP
Start-Sleep -Milliseconds $WaitMs
$still = [CliqueJanela]::IsWindow($top) -and [CliqueJanela]::IsWindowVisible($top)
"clique em ($X,$Y) na janela '$([CliqueJanela]::Text($top))'; janela ainda aberta: $still"
