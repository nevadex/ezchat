using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ezchatv2.Pages
{
    public class LicenseModel : PageModel
    {
        private readonly ILogger<LicenseModel> _logger;

        public LicenseModel(ILogger<LicenseModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
        }
    }
}
