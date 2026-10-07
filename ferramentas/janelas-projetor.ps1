# Test helper: count (or close) the engine's projector windows, i.e. its visible top-level windows other than the main one.
param([switch]$Contar, [switch]$Fechar)
Add-Type @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class ProjWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  public static List<IntPtr> Others(uint pid, IntPtr main) {
    var o = new List<IntPtr>();
    EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); var t = new StringBuilder(256); GetWindowText(h, t, 256); if (p == pid && IsWindowVisible(h) && t.ToString().ToLower().StartsWith("proje")) o.Add(h); return true; }, IntPtr.Zero);
    return o;
  }
}
'@
$root = Split-Path -Parent $PSScriptRoot
$p = Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" } | Select-Object -First 1
if (-not $p) { 0; exit }
$w = [ProjWin]::Others([uint32]$p.Id, $p.MainWindowHandle)
if ($Fechar) { foreach ($h in $w) { [ProjWin]::PostMessage($h, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null } }
$w.Count
