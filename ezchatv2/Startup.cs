using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ezchatv2.Hubs;
using Tommy;

using System.IO;
using LiteDB;
using ezchatv2.Models;

namespace ezchatv2
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;

            Util.Print(ChatConfig.version + " started");
            Util.Print("nevadex (c) 2022");

            // init fs db
            if (!File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], "fs.db")) && ChatConfig.configTable["fs"]["fileSystem"])
            {
                Util.Print("[FS] Creating database");
                var db = new LiteDatabase(FSMethods.FSDBConStr());
                var col = db.GetCollection<FS_FileRecord>("files");
                var cursorcol = db.GetCollection<FS_DBCursor>("cursor");
                var cursor = new FS_DBCursor() { bsonIndex=1, fileId=1 };
                cursorcol.Insert(cursor);
            }
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddRazorPages();
            services.AddSignalR();
            services.AddControllers();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
                endpoints.MapHub<ChatHub>("/chatHub");
                endpoints.MapControllers();
            });
        }
    }
}
