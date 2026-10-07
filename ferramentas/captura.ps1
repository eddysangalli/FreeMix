# Capture only the engine's main window (found by process, not by title) into a PNG.
param([string]$Out)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class CapWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  public static List<IntPtr> All(uint pid) { var o = new List<IntPtr>(); EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h)) o.Add(h); return true; }, IntPtr.Zero); return o; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public struct RECT { public int L, T, R, B; }
}
'@
[CapWin]::SetProcessDPIAware() | Out-Null
$root = Split-Path -Parent $PSScriptRoot
$p = Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" -and $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
if (-not $p) { 'janela do motor nao encontrada'; exit 1 }
# The main window is the widest visible one; a projector opened later can take over MainWindowHandle.
$best = $p.MainWindowHandle; $bestW = 0
foreach ($h in [CapWin]::All([uint32]$p.Id)) { $q = New-Object CapWin+RECT; [CapWin]::GetWindowRect($h, [ref]$q) | Out-Null; if (($q.R - $q.L) -gt $bestW) { $bestW = $q.R - $q.L; $best = $h } }
$r = New-Object CapWin+RECT; [CapWin]::GetWindowRect($best, [ref]$r) | Out-Null
$bmp = New-Object System.Drawing.Bitmap ($r.R - $r.L), ($r.B - $r.T); $g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
[CapWin]::PrintWindow($best, $dc, 2) | Out-Null; $g.ReleaseHdc($dc); $g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); "capturado $($bmp.Width)x$($bmp.Height) '$($p.MainWindowTitle)' -> $Out"; $bmp.Dispose()
