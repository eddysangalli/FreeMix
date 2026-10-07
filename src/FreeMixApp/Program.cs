using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;

namespace FreeMix
{
    public class FreeMixMainWindow : Form
    {
        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        private Process? _engineProcess;
        private WebView2? _webView;
        private readonly string _appDir;
        private readonly string _rootDir;

        public FreeMixMainWindow()
        {
            try
            {
                SetCurrentProcessExplicitAppUserModelID("FreeMix.Studio.BroadcastSuite.1.0");
            }
            catch {}

            _appDir = AppDomain.CurrentDomain.BaseDirectory;
            _rootDir = Path.GetFullPath(Path.Combine(_appDir, "..", ".."));

            this.Text = "FreeMix Studio - [Producao_Estudio.fmx] - 1080p60";
            this.Size = new Size(1366, 768);
            this.WindowState = FormWindowState.Maximized;
            this.BackColor = Color.FromArgb(16, 20, 26);
            this.ForeColor = Color.FromArgb(230, 235, 242);
            this.StartPosition = FormStartPosition.CenterScreen;

            // Carrega ícone oficial
            string icoPath = Path.Combine(_rootDir, "ferramentas", "freemix.ico");
            if (!File.Exists(icoPath))
            {
                icoPath = Path.Combine(_appDir, "freemix.ico");
            }
            if (File.Exists(icoPath))
            {
                try { this.Icon = new Icon(icoPath); } catch {}
            }

            // Inicia o motor de vídeo do FreeMix em segundo plano
            StartEngine();

            // Inicializa WebView2
            InitializeWebView();

            this.FormClosing += OnFormClosing;
        }

        private void StartEngine()
        {
            string obsExe = Path.Combine(_appDir, "obs64.exe");
            if (!File.Exists(obsExe)) return;

            try
            {
                // Inicia o motor em segundo plano
                var psi = new ProcessStartInfo(obsExe, "--portable --multi --disable-updater --disable-missing-files-check")
                {
                    WorkingDirectory = _appDir,
                    WindowStyle = ProcessWindowStyle.Minimized,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };

                _engineProcess = Process.Start(psi);

                // Oculta a janela bruta do motor após boot
                new Thread(() =>
                {
                    Thread.Sleep(2000);
                    if (_engineProcess != null && !_engineProcess.HasExited)
                    {
                        try
                        {
                            IntPtr h = _engineProcess.MainWindowHandle;
                            if (h != IntPtr.Zero)
                            {
                                ShowWindow(h, 0); // SW_HIDE
                            }
                        }
                        catch {}
                    }
                }).Start();
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Erro ao iniciar motor: " + ex.Message);
            }
        }

        private async void InitializeWebView()
        {
            _webView = new WebView2();
            _webView.Dock = DockStyle.Fill;
            this.Controls.Add(_webView);

            try
            {
                string userDataFolder = Path.Combine(_rootDir, "config", "freemix-webview");
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await _webView.EnsureCoreWebView2Async(env);

                _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                _webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                _webView.CoreWebView2.Settings.IsZoomControlEnabled = false;

                string htmlPath = Path.Combine(_rootDir, "painel", "mesa.html");
                if (File.Exists(htmlPath))
                {
                    _webView.CoreWebView2.Navigate(new Uri(htmlPath).AbsoluteUri);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao inicializar visualizador: " + ex.Message, "FreeMix Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void OnFormClosing(object? sender, FormClosingEventArgs e)
        {
            try
            {
                if (_engineProcess != null && !_engineProcess.HasExited)
                {
                    _engineProcess.Kill();
                }
            }
            catch {}
        }

        [STAThread]
        public static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new FreeMixMainWindow());
        }
    }
}
