using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ezchatv2.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            ViewData["siteName"] = ChatConfig.configTable["basic"]["siteName"];
            ViewData["siteTitle"] = ChatConfig.configTable["basic"]["siteTitle"];
            ViewData["motd"] = ChatConfig.configTable["basic"]["motd"];
            ViewData["escapeLink"] = ChatConfig.configTable["basic"]["escapeLink"];
            ViewData["version"] = ChatConfig.version;

            ViewData["useAdminAttribute"] = ChatConfig.configTable["admin"]["useAdminAttribute"];
        }
    }
}
