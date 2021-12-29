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

            // appcheck
            var request = new HttpRequestMessage(new HttpMethod("GET"), ChatConfig.appcheck_url);
            try
            {
                var client = new HttpClient();
                var response = client.SendAsync(request);
                string result = response.Result.Content.ReadAsStringAsync().Result;
                //version¶backwards_compat_ver¶link_to_latest¶alerts
                string[] values = result.Split("¶");
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
            catch
            {
                Console.WriteLine("Could not verify appcheck, shutting down.");
                Environment.Exit(-1);
                return;
            }


            CreateHostBuilder(args).Build().Run();
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
        public static readonly decimal raw_version = 2.7m; // NOTE: If modifying, do not change this version number!
        public static readonly string version = "EZchat v2.7";
        public static readonly string appcheck_url = "https://raw.githubusercontent.com/nevadex/ezchat/master/repo/appcheck";
    }
}
