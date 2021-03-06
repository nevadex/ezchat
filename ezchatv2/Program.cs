using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Tommy;
using System.IO;
using System.Net.Http;

namespace ezchatv2
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Initializing...");

            StreamReader tomlreader = File.OpenText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.config_file));
            ChatConfig.configTable = TOML.Parse(tomlreader);
            ChatConfig.msglog_file = ChatConfig.configTable["advanced"]["msglog"];
            ChatConfig.banlist_file = ChatConfig.configTable["advanced"]["banlist"];

            // process args
            foreach (string i in args)
            {
                if (i.IndexOf("-skipAC", StringComparison.OrdinalIgnoreCase) >= 0) { ChatConfig.a_skipAppcheck = true; continue; }
                if (i.IndexOf("-v", StringComparison.OrdinalIgnoreCase) >= 0 || i.IndexOf("-verbose", StringComparison.OrdinalIgnoreCase) >= 0) { ChatConfig.a_Verbose = true; Console.WriteLine("using verbose logging"); continue; }
                if (i.IndexOf("-h", StringComparison.OrdinalIgnoreCase) >= 0 || i.IndexOf("-help", StringComparison.OrdinalIgnoreCase) >= 0) { Console.WriteLine(ChatConfig.a_HelpText); Environment.Exit(0); continue; }

                // all else fails
                Console.WriteLine("unknown argument \"" + i + "\", skipping");
            }

            // appcheck
            if (!ChatConfig.a_skipAppcheck)
            {
                try
                {
                    var request = new HttpRequestMessage(new HttpMethod("GET"), ChatConfig.appcheck_url);
                    var client = new HttpClient();
                    var response = client.SendAsync(request);
                    string result = response.Result.Content.ReadAsStringAsync().Result;
                    //version?backwards_compat_ver?link_to_latest?alerts
                    string[] values = result.Split("?");
                    decimal new_ver = decimal.Parse(values[0], System.Globalization.NumberStyles.Number);
                    decimal bcv = decimal.Parse(values[1], System.Globalization.NumberStyles.Number);

                    // check version
                    if (new_ver > ChatConfig.raw_version)
                    {
                        Console.WriteLine("EZchat {0} is outdated. Please update to EZchat {1}.", ChatConfig.raw_version.ToString(), values[0]);
                        if (ChatConfig.raw_version < bcv)
                        {
                            Console.WriteLine("EZchat {0} is not compatible with your current configuration.", values[0]);
                        }
                        Console.WriteLine("Download EZchat {0} from here: {1}", values[0], values[2]);
                    }

                    // alerts
                    if (values[3] != "none\n")
                    {
                        Console.WriteLine("Alerts: " + values[3]);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Could not verify appcheck, shutting down.\n");
                    Console.WriteLine(ex.ToString());
                    Environment.Exit(-1);
                    return;
                }
            }
            else
            { Console.WriteLine("skipping appcheck"); }


            //CreateHostBuilder(args).Build().Run();
            // not using user args
            string[] emptyArgs = new string[0];
            CreateHostBuilder(emptyArgs).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    //webBuilder.UseStartup<Startup>().UseUrls("http://0.0.0.0:80", "https://0.0.0.0:443");
                    webBuilder.UseStartup<Startup>().UseUrls("http://"+ChatConfig.configTable["advanced"]["addr"]+":"+ChatConfig.configTable["advanced"]["ports"][0], "https://"+ChatConfig.configTable["advanced"]["addr"]+":"+ChatConfig.configTable["advanced"]["ports"][1]);
                });
    }

    /// <summary>
    /// Configuration class for chat.
    /// </summary>
    public class ChatConfig
    {
        /// <summary>
        /// A TOMLTable of configuration settings from loaded file.
        /// </summary>
        public static TomlTable configTable;
        public static string msglog_file;
        public static string banlist_file;

        public static readonly string config_file = "admin/config.toml";
        public static readonly decimal raw_version = 2.8m; // NOTE: If modifying, do not change this version number!
        public static readonly string version = "EZchat v2.8";
        public static readonly string appcheck_url = "https://raw.githubusercontent.com/nevadex/ezchat/master/repo/appcheck";

        // args
        public static readonly string a_HelpText = "Help Text\nGo to https://github.com/nevadex/ezchat/wiki for more information.\n\nArgument|Explanation\n-help OR -h|Opens the help text\n-skipAC|Skips appcheck during initialization\n-v OR -verbose|Starts verbose logging mode";
        public static bool a_Verbose = false;
        public static bool a_skipAppcheck = false;
    }
}
