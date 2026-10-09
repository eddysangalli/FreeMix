using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace FreeMixSetup {
    internal sealed class Options {
        public bool Silent, Verify, NoShortcuts;
        public string Destination, Log;
        public int ApiPort, WsPort;
        public static Options Parse(string[] args) {
            Options o = new Options(); HashSet<string> seen = new HashSet<string>();
            foreach (string arg in args) {
                int separator = arg.IndexOf('=');
                string key = separator < 0 ? arg : arg.Substring(0, separator);
                string value = separator < 0 ? null : arg.Substring(separator + 1);
                if (!seen.Add(key)) throw new Exception("Argumento duplicado: " + key);
                if (key == "--silent" && value == null) o.Silent = true;
                else if (key == "--verify" && value == null) o.Verify = true;
                else if (key == "--no-shortcuts" && value == null) o.NoShortcuts = true;
                else if (key == "--dest" && !String.IsNullOrWhiteSpace(value)) o.Destination = value;
                else if (key == "--log" && !String.IsNullOrWhiteSpace(value)) o.Log = value;
                else if (key == "--api-port") o.ApiPort = ParsePort(value);
                else if (key == "--ws-port") o.WsPort = ParsePort(value);
                else throw new Exception("Argumento desconhecido ou vazio: " + key);
            }
            if (o.ApiPort != 0 && o.ApiPort == o.WsPort) throw new Exception("As portas devem ser diferentes.");
            return o;
        }
        static int ParsePort(string value) { int p; if (!Int32.TryParse(value, out p) || p < 1 || p > 65535) throw new Exception("Porta inválida."); return p; }
    }

    internal static class Program {
        [STAThread]
        static int Main(string[] args) {
            try {
                Options options = Options.Parse(args);
                if (options.Silent || options.Verify) {
                    if (!options.Verify && String.IsNullOrWhiteSpace(options.Destination)) throw new Exception("O modo silencioso exige --dest=PASTA_NOVA.");
                    return Installer.Run(options, delegate(string message, int percent) { });
                }
                Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new SetupForm(options)); return 0;
            } catch (Exception e) {
                string log = Path.Combine(Path.GetTempPath(), "FreeMix-setup-error-" + Guid.NewGuid().ToString("N") + ".log");
                File.WriteAllText(log, e.Message, Encoding.UTF8);
                if (Array.IndexOf(args, "--silent") < 0 && Array.IndexOf(args, "--verify") < 0) MessageBox.Show(e.Message + "\n\nRegistro: " + log, "FreeMix Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 1;
            }
        }
    }

    internal sealed class SetupForm : Form {
        readonly Options options; readonly TextBox folder; readonly Label status; readonly ProgressBar progress; readonly Button install, browse;
        bool running;
        public SetupForm(Options o) {
            options = o; Text = "Instalar FreeMix Studio"; ClientSize = new Size(630, 315); FormBorderStyle = FormBorderStyle.FixedDialog; MaximizeBox = false; StartPosition = FormStartPosition.CenterScreen;
            Font = new Font("Segoe UI", 10); BackColor = Color.FromArgb(246, 248, 252);
            Label title = new Label { Text = "FreeMix Studio", Font = new Font("Segoe UI", 22, FontStyle.Bold), Location = new Point(25, 20), AutoSize = true };
            Label description = new Label { Text = "Instalação completa e offline para este usuário.\nEscolha uma pasta nova ou completamente vazia.", Location = new Point(28, 72), Size = new Size(570, 48) };
            folder = new TextBox { Text = o.Destination ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "FreeMix Studio"), Location = new Point(28, 132), Size = new Size(462, 28) };
            browse = new Button { Text = "Procurar…", Location = new Point(499, 130), Size = new Size(103, 31) };
            browse.Click += delegate { using (FolderBrowserDialog picker = new FolderBrowserDialog()) { picker.Description = "Selecione uma pasta nova ou vazia para o FreeMix Studio"; picker.ShowNewFolderButton = true; if (Directory.Exists(folder.Text)) picker.SelectedPath = folder.Text; if (picker.ShowDialog(this) == DialogResult.OK) folder.Text = picker.SelectedPath; } };
            status = new Label { Text = "Cria atalhos na Área de Trabalho e no Menu Iniciar. Não abre o programa.", Location = new Point(28, 175), Size = new Size(574, 46) };
            progress = new ProgressBar { Location = new Point(28, 227), Size = new Size(574, 13), Minimum = 0, Maximum = 100 };
            install = new Button { Text = "Instalar", Location = new Point(475, 259), Size = new Size(127, 34) }; install.Click += async delegate {
                if (!running && install.Text == "Fechar") { Close(); return; }
                options.Destination = folder.Text;
                try { Installer.ValidateDestination(options.Destination); } catch (Exception e) { MessageBox.Show(this, e.Message, "Escolha outra pasta", MessageBoxButtons.OK, MessageBoxIcon.Warning); return; }
                running = true; install.Enabled = false; browse.Enabled = false; folder.Enabled = false;
                int result = await Task.Run(delegate { return Installer.Run(options, UpdateProgress); });
                running = false; install.Enabled = true; install.Text = "Fechar";
                if (result == 0) status.Text = "Instalação concluída. Use o atalho FreeMix Studio para começar.";
                else MessageBox.Show(this, "A instalação falhou. " + Installer.LastError + "\n\nRegistro: " + Installer.LastLog, "FreeMix Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            };
            FormClosing += delegate(object sender, FormClosingEventArgs e) { if (running) e.Cancel = true; };
            Controls.AddRange(new Control[] { title, description, folder, browse, status, progress, install });
        }
        void UpdateProgress(string text, int percent) { if (IsHandleCreated) BeginInvoke((Action)delegate { status.Text = text; progress.Value = Math.Max(0, Math.Min(100, percent)); }); }
    }

    internal static class Installer {
        const long MaxExpanded = 30000000000L;
        public static string LastError, LastLog;
        public static int Run(Options options, Action<string, int> report) {
            string scratch = null; bool installed = false;
            try {
                LastLog = options.Log == null ? Path.Combine(Path.GetTempPath(), "FreeMix-setup-" + Guid.NewGuid().ToString("N") + ".log") : Path.GetFullPath(options.Log);
                NoLinks(LastLog); if (File.Exists(LastLog) || Directory.Exists(LastLog)) throw new Exception("O arquivo de registro já existe.");
                using (StreamWriter log = new StreamWriter(new FileStream(LastLog, FileMode.CreateNew, FileAccess.Write, FileShare.Read), Encoding.UTF8)) {
                    log.AutoFlush = true; log.WriteLine("FreeMix Studio setup " + PayloadInfo.Version + "; " + DateTime.UtcNow.ToString("o"));
                    try {
                        if (!options.Verify) ValidateDestination(options.Destination);
                        report("Verificando a integridade do instalador…", 2);
                        string exe = Assembly.GetExecutingAssembly().Location;
                        using (FileStream file = new FileStream(exe, FileMode.Open, FileAccess.Read, FileShare.Read)) {
                            long start, length; ReadFooter(file, out start, out length); VerifyPayload(file, start, length, report);
                            log.WriteLine("Payload SHA-256 verified: " + PayloadInfo.Sha256);
                            using (RangeStream range = new RangeStream(file, start, length)) using (ZipArchive zip = new ZipArchive(range, ZipArchiveMode.Read, true)) {
                                long expanded = ValidateZip(zip); log.WriteLine("ZIP validated; entries=" + zip.Entries.Count + "; expandedBytes=" + expanded);
                                if (options.Verify) { report("Integridade verificada.", 100); log.WriteLine("VERIFY PASS; installed=false; appStarted=false; firewallApplied=false"); return 0; }
                                string destination = Path.GetFullPath(options.Destination);
                                CheckSpace(Path.GetTempPath(), expanded + 256L * 1024 * 1024);
                                CheckSpace(destination, expanded + 256L * 1024 * 1024);
                                if (String.Equals(Path.GetPathRoot(Path.GetTempPath()), Path.GetPathRoot(destination), StringComparison.OrdinalIgnoreCase)) CheckSpace(destination, expanded * 2 + 256L * 1024 * 1024);
                                scratch = Path.Combine(Path.GetTempPath(), "FreeMix-setup-" + Guid.NewGuid().ToString("N")); NoLinks(scratch);
                                if (Directory.Exists(scratch) || File.Exists(scratch)) throw new Exception("Pasta temporária já existe.");
                                Directory.CreateDirectory(scratch); Extract(zip, scratch, expanded, report);
                            }
                        }
                        ValidateDestination(options.Destination);
                        int api = FreePort(options.ApiPort, 18188, 18198), ws = FreePort(options.WsPort, 4466, 4499);
                        if (api == ws) throw new Exception("As portas devem ser diferentes.");
                        report("Verificando a entrega assinada e instalando os arquivos…", 62);
                        string node = Path.Combine(scratch, "runtime", "node.exe"), cli = Path.Combine(scratch, "ferramentas", "instalar-portatil.mjs");
                        NoLinks(node); NoLinks(cli); if (!File.Exists(node) || !File.Exists(cli)) throw new Exception("O pacote não contém o instalador offline.");
                        ProcessStartInfo psi = new ProcessStartInfo(node, Quote(cli) + " --source " + Quote(scratch) + " --dest " + Quote(Path.GetFullPath(options.Destination)) + " --api-port " + api + " --ws-port " + ws);
                        psi.WorkingDirectory = scratch; psi.UseShellExecute = false; psi.CreateNoWindow = true; psi.RedirectStandardOutput = true; psi.RedirectStandardError = true;
                        using (Process process = new Process()) {
                            process.StartInfo = psi;
                            object logLock = new object();
                            DataReceivedEventHandler capture = delegate(object sender, DataReceivedEventArgs e) { if (e.Data != null) lock (logLock) log.WriteLine(Sanitize(e.Data)); };
                            process.OutputDataReceived += capture; process.ErrorDataReceived += capture;
                            if (!process.Start()) throw new Exception("Não foi possível iniciar o instalador offline.");
                            process.BeginOutputReadLine(); process.BeginErrorReadLine(); process.WaitForExit();
                            if (process.ExitCode != 0) throw new Exception("O instalador offline recusou ou não concluiu a instalação (código " + process.ExitCode + "). Consulte o registro.");
                        }
                        installed = true;
                        report("Criando os atalhos…", 95);
                        List<string> shortcuts = options.NoShortcuts ? new List<string>() : CreateShortcuts(Path.GetFullPath(options.Destination));
                        WriteReceipt(Path.GetFullPath(options.Destination), api, ws, shortcuts);
                        log.WriteLine("INSTALL PASS; appStarted=false; firewallApplied=false; apiPort=" + api + "; wsPort=" + ws + "; shortcuts=" + shortcuts.Count + "; uninstallRegistered=false");
                        report("Instalação concluída.", 100); return 0;
                    } catch (Exception e) { LastError = installed ? "Os arquivos foram instalados, mas a finalização falhou. " + e.Message + " A instalação foi mantida no destino escolhido; use FreeMix Studio.cmd nessa pasta." : e.Message; log.WriteLine("FAIL: installed=" + installed.ToString().ToLowerInvariant() + "; " + Sanitize(LastError)); report("Falha: " + LastError, 0); return 1; }
                    finally { if (scratch != null) { try { SafeDelete(scratch); } catch (Exception e) { log.WriteLine("Temporary cleanup pending: " + Sanitize(e.Message)); } } }
                }
            } catch (Exception e) { LastError = e.Message; report("Falha: " + e.Message, 0); return 1; }
        }
        static string Sanitize(string text) { return Regex.Replace(text, "(?i)(password|secret|token|authorization|credential)(\\s*[=:]\\s*)([^,}\\s]+)", "$1$2[REDACTED]"); }
        static string Quote(string value) { return "\"" + Regex.Replace(Regex.Replace(value, "(\\\\*)\"", "$1$1\\\""), "(\\\\+)$", "$1$1") + "\""; }
        public static void ValidateDestination(string path) {
            if (String.IsNullOrWhiteSpace(path)) throw new Exception("Escolha uma pasta de destino.");
            path = Path.GetFullPath(path); if (path.StartsWith("\\\\") || String.Equals(path.TrimEnd('\\'), Path.GetPathRoot(path).TrimEnd('\\'), StringComparison.OrdinalIgnoreCase)) throw new Exception("Escolha uma pasta local nova; a raiz da unidade não é aceita.");
            NoLinks(path); if (File.Exists(path) || (Directory.Exists(path) && Directory.GetFileSystemEntries(path).Length != 0)) throw new Exception("O destino deve ser uma pasta nova ou completamente vazia. A instalação existente será preservada.");
        }
        static void NoLinks(string path) {
            for (string p = Path.GetFullPath(path); !String.IsNullOrEmpty(p); p = Path.GetDirectoryName(p)) {
                try { if ((File.GetAttributes(p) & FileAttributes.ReparsePoint) != 0) throw new Exception("Links e junções não são aceitos: " + p); }
                catch (FileNotFoundException) { } catch (DirectoryNotFoundException) { }
                if (String.Equals(p, Path.GetPathRoot(p), StringComparison.OrdinalIgnoreCase)) break;
            }
        }
        static void CheckSpace(string path, long needed) { DriveInfo drive = new DriveInfo(Path.GetPathRoot(Path.GetFullPath(path))); if (drive.AvailableFreeSpace < needed) throw new Exception("Espaço insuficiente na unidade " + drive.Name + ". Necessário: " + Math.Ceiling(needed / 1073741824.0).ToString(CultureInfo.InvariantCulture) + " GB livres."); }
        static void ReadFooter(FileStream file, out long start, out long length) {
            if (file.Length < 84) throw new Exception("Instalador incompleto."); file.Position = file.Length - 84;
            byte[] footer = new byte[84]; ReadExactly(file, footer, footer.Length);
            length = BitConverter.ToInt64(footer, 0); string hash = Encoding.ASCII.GetString(footer, 8, 64), magic = Encoding.ASCII.GetString(footer, 72, 12);
            if (magic != "FMXSETUPV001" || length != PayloadInfo.Length || length < 22 || length > 5000000000L || length >= file.Length - 84 || hash != PayloadInfo.Sha256) throw new Exception("Payload ausente ou alterado.");
            start = file.Length - 84 - length;
        }
        static void ReadExactly(Stream stream, byte[] buffer, int count) { int offset = 0; while (offset < count) { int read = stream.Read(buffer, offset, count - offset); if (read <= 0) throw new Exception("Arquivo truncado."); offset += read; } }
        static void VerifyPayload(FileStream file, long start, long length, Action<string, int> report) {
            using (SHA256 sha = SHA256.Create()) {
                file.Position = start; byte[] buffer = new byte[1024 * 1024]; long remaining = length; int last = -1;
                while (remaining > 0) { int read = file.Read(buffer, 0, (int)Math.Min(buffer.Length, remaining)); if (read <= 0) throw new Exception("Payload truncado."); sha.TransformBlock(buffer, 0, read, buffer, 0); remaining -= read; int p = 2 + (int)((length - remaining) * 23 / length); if (p != last) { report("Verificando a integridade do instalador…", p); last = p; } }
                sha.TransformFinalBlock(new byte[0], 0, 0); string actual = BitConverter.ToString(sha.Hash).Replace("-", "").ToLowerInvariant(); if (actual != PayloadInfo.Sha256) throw new Exception("A integridade do instalador não confere. Baixe novamente o arquivo.");
            }
        }
        static string EntryPath(ZipArchiveEntry entry) {
            string name = entry.FullName;
            if (String.IsNullOrEmpty(name) || name.Length > 512 || name.IndexOf('\\') >= 0 || !name.StartsWith(PayloadInfo.Root + "/", StringComparison.Ordinal)) throw new Exception("Caminho ZIP fora da raiz esperada.");
            name = name.Substring(PayloadInfo.Root.Length + 1); if (name.EndsWith("/", StringComparison.Ordinal)) name = name.Substring(0, name.Length - 1);
            if (name.Length == 0) return "";
            foreach (string part in name.Split('/')) if (part.Length == 0 || part == "." || part == ".." || Regex.IsMatch(part, "[<>:\"|?*\\x00-\\x1f]") || part.EndsWith(".") || part.EndsWith(" ") || Regex.IsMatch(part, "^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\\.|$)", RegexOptions.IgnoreCase)) throw new Exception("Caminho ZIP inválido.");
            int type = (entry.ExternalAttributes >> 16) & 0xF000; if (type != 0 && type != 0x8000 && type != 0x4000) throw new Exception("Entrada especial ou link recusado no ZIP.");
            if ((entry.ExternalAttributes & 0x400) != 0) throw new Exception("Junção recusada no ZIP."); return name;
        }
        static long ValidateZip(ZipArchive zip) {
            if (zip.Entries.Count == 0 || zip.Entries.Count > 60000) throw new Exception("Quantidade de arquivos ZIP inválida.");
            long total = 0; HashSet<string> names = new HashSet<string>(StringComparer.OrdinalIgnoreCase), files = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (ZipArchiveEntry entry in zip.Entries) { string name = EntryPath(entry); if (name == "") continue; if (!names.Add(name) || entry.Length < 0 || entry.Length > 2000000000L) throw new Exception("Entrada ZIP duplicada ou excessiva."); total += entry.Length; if (total > MaxExpanded) throw new Exception("O ZIP excede 30 GB."); if (!entry.FullName.EndsWith("/")) files.Add(name); else if (entry.Length != 0) throw new Exception("Diretório ZIP inválido."); }
            foreach (string name in names) { string[] parts = name.Split('/'); string parent = ""; for (int i = 0; i < parts.Length - 1; i++) { parent = i == 0 ? parts[i] : parent + "/" + parts[i]; if (files.Contains(parent)) throw new Exception("Arquivo ZIP usado como pasta."); } }
            if (!files.Contains("manifest.json") || !files.Contains("manifest.sig") || !files.Contains("runtime/node.exe") || !files.Contains("ferramentas/instalar-portatil.mjs")) throw new Exception("O ZIP não contém a entrega completa."); return total;
        }
        static void Extract(ZipArchive zip, string root, long total, Action<string, int> report) {
            long copied = 0; byte[] buffer = new byte[1024 * 1024]; int last = -1;
            foreach (ZipArchiveEntry entry in zip.Entries) {
                string relative = EntryPath(entry); if (relative == "") continue; string target = Path.GetFullPath(Path.Combine(root, relative.Replace('/', '\\')));
                if (!target.StartsWith(root + "\\", StringComparison.OrdinalIgnoreCase)) throw new Exception("Caminho ZIP fora da pasta temporária."); NoLinks(target);
                if (entry.FullName.EndsWith("/")) { Directory.CreateDirectory(target); continue; }
                Directory.CreateDirectory(Path.GetDirectoryName(target)); NoLinks(target); long written = 0;
                using (Stream from = entry.Open()) using (FileStream to = new FileStream(target, FileMode.CreateNew, FileAccess.Write, FileShare.None)) {
                    int read; while ((read = from.Read(buffer, 0, buffer.Length)) > 0) { written += read; if (written > entry.Length) throw new Exception("Entrada ZIP excedeu o tamanho declarado."); to.Write(buffer, 0, read); copied += read; int p = 26 + (int)(copied * 35 / Math.Max(1, total)); if (p != last) { report("Extraindo os arquivos da instalação…", p); last = p; } }
                }
                if (written != entry.Length) throw new Exception("Entrada ZIP truncada.");
            }
        }
        static int FreePort(int requested, int low, int high) {
            if (requested != 0) { if (!PortAvailable(requested)) throw new Exception("A porta " + requested + " já está em uso."); return requested; }
            for (int p = low; p <= high; p++) if (PortAvailable(p)) return p; throw new Exception("Nenhuma porta livre entre " + low + " e " + high + ".");
        }
        static bool PortAvailable(int port) { TcpListener listener = null, v6 = null; try { listener = new TcpListener(IPAddress.Any, port); listener.Server.ExclusiveAddressUse = true; listener.Start(); if (Socket.OSSupportsIPv6) { v6 = new TcpListener(IPAddress.IPv6Any, port); v6.Server.SetSocketOption(SocketOptionLevel.IPv6, SocketOptionName.IPv6Only, true); v6.Server.ExclusiveAddressUse = true; v6.Start(); } return true; } catch (SocketException) { return false; } finally { if (listener != null) listener.Stop(); if (v6 != null) v6.Stop(); } }
        static List<string> CreateShortcuts(string root) {
            NoLinks(root); string launch = Path.Combine(root, "FreeMix Studio.cmd"), icon = Path.Combine(root, "bin", "64bit", "FreeMix.exe"); if (!File.Exists(launch) || !File.Exists(icon)) throw new Exception("Arquivos dos atalhos ausentes.");
            List<string> paths = new List<string>(); Type type = Type.GetTypeFromProgID("WScript.Shell"); object shell = Activator.CreateInstance(type);
            try { foreach (string folder in new string[] { Environment.GetFolderPath(Environment.SpecialFolder.Programs), Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory) }) {
                // Windows-managed known folders may legitimately traverse OneDrive or profile junctions.
                // This exception applies only to the two paths returned by GetFolderPath above.
                if (String.IsNullOrWhiteSpace(folder) || !Path.IsPathRooted(folder)) throw new Exception("O Windows não informou a pasta oficial dos atalhos.");
                Directory.CreateDirectory(folder); string path = Path.Combine(folder, "FreeMix Studio.lnk");
                while (File.Exists(path) || Directory.Exists(path)) path = Path.Combine(folder, "FreeMix Studio (" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + "-" + Guid.NewGuid().ToString("N").Substring(0, 6) + ").lnk");
                object shortcut = type.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { path });
                try { Type shortcutType = shortcut.GetType(); Set(shortcutType, shortcut, "TargetPath", launch); Set(shortcutType, shortcut, "WorkingDirectory", root); Set(shortcutType, shortcut, "IconLocation", icon + ",0"); Set(shortcutType, shortcut, "Description", "FreeMix Studio"); shortcutType.InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, new object[0]); paths.Add(path); }
                finally { System.Runtime.InteropServices.Marshal.FinalReleaseComObject(shortcut); }
            } } finally { System.Runtime.InteropServices.Marshal.FinalReleaseComObject(shell); } return paths;
        }
        static void Set(Type type, object target, string name, string value) { type.InvokeMember(name, BindingFlags.SetProperty, null, target, new object[] { value }); }
        static string Json(string s) { return "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "\\r").Replace("\n", "\\n") + "\""; }
        static void WriteReceipt(string root, int api, int ws, List<string> shortcuts) { string path = Path.Combine(root, "installer-setup.json"); NoLinks(path); List<string> quoted = shortcuts.ConvertAll<string>(Json); using (StreamWriter writer = new StreamWriter(new FileStream(path, FileMode.CreateNew, FileAccess.Write), new UTF8Encoding(false))) writer.Write("{\"format\":1,\"version\":" + Json(PayloadInfo.Version) + ",\"payloadSha256\":" + Json(PayloadInfo.Sha256) + ",\"apiPort\":" + api + ",\"wsPort\":" + ws + ",\"appStarted\":false,\"firewallApplied\":false,\"uninstallRegistered\":false,\"shortcuts\":[" + String.Join(",", quoted.ToArray()) + "]}"); }
        static void SafeDelete(string root) { NoLinks(root); foreach (string path in Directory.GetFileSystemEntries(root)) { NoLinks(path); if (Directory.Exists(path)) SafeDelete(path); else File.Delete(path); } Directory.Delete(root); }
    }

    internal sealed class RangeStream : Stream {
        readonly Stream inner; readonly long start, length; long position;
        public RangeStream(Stream inner, long start, long length) { this.inner = inner; this.start = start; this.length = length; }
        public override bool CanRead { get { return true; } } public override bool CanSeek { get { return true; } } public override bool CanWrite { get { return false; } }
        public override long Length { get { return length; } } public override long Position { get { return position; } set { Seek(value, SeekOrigin.Begin); } }
        public override int Read(byte[] buffer, int offset, int count) { if (position >= length) return 0; inner.Position = start + position; int read = inner.Read(buffer, offset, (int)Math.Min(count, length - position)); position += read; return read; }
        public override long Seek(long offset, SeekOrigin origin) { long next = origin == SeekOrigin.Begin ? offset : origin == SeekOrigin.Current ? position + offset : length + offset; if (next < 0 || next > length) throw new IOException("Leitura fora do payload."); position = next; return next; }
        public override void Flush() { } public override void SetLength(long value) { throw new NotSupportedException(); } public override void Write(byte[] buffer, int offset, int count) { throw new NotSupportedException(); }
    }
}
