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
    }
}
