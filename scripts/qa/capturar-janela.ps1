# Captures one window of a process into a PNG, found by process id and a piece of its title (empty title = the widest
# window). Used to photograph what the program itself shows, including the pages drawn inside its windows.
param([Parameter(Mandatory)][int]$ProcessId, [string]$Title = '', [Parameter(Mandatory)][string]$Out)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class CapJanela {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public struct RECT { public int L, T, R, B; }
  public static List<IntPtr> All(uint pid) { var o = new List<IntPtr>(); EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h)) o.Add(h); return true; }, IntPtr.Zero); return o; }
  public static string Text(IntPtr h) { var s = new StringBuilder(300); GetWindowText(h, s, 300); return s.ToString(); }
}
'@
[void][CapJanela]::SetProcessDPIAware()
$best = [IntPtr]::Zero; $bestW = 0; $seen = @()
foreach ($h in [CapJanela]::All([uint32]$ProcessId)) {
  $r = New-Object CapJanela+RECT; [void][CapJanela]::GetWindowRect($h, [ref]$r); $t = [CapJanela]::Text($h); $w = $r.R - $r.L
  $seen += "'$t' $($w)x$($r.B - $r.T)"
  if ($Title) { if ($t -like "*$Title*") { $best = $h; break } } elseif ($w -gt $bestW) { $bestW = $w; $best = $h }
}
if ($best -eq [IntPtr]::Zero) { "janela nao encontrada; visiveis: $($seen -join '; ')"; exit 1 }
$r = New-Object CapJanela+RECT; [void][CapJanela]::GetWindowRect($best, [ref]$r)
$bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T); $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
[void][CapJanela]::PrintWindow($best, $dc, 2); $g.ReleaseHdc($dc); $g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); "capturado $($bmp.Width)x$($bmp.Height) '$([CapJanela]::Text($best))' -> $Out"; $bmp.Dispose()
