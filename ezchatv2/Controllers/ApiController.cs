using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using ezchatv2.Models;
using Tommy;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace ezchatv2.Controllers
{
    [Route("[controller]/[action]")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        [HttpGet]
        [Produces("application/json")]
#pragma warning disable CS1998
        public async Task<IActionResult> Status()
#pragma warning restore CS1998
        {
            Api_Status status = new Api_Status();
            status.userCharLimit = ChatConfig.configTable["basic"]["userCharLimit"];
            status.messageCharLimit = ChatConfig.configTable["basic"]["messageCharLimit"];
            status.useAdminAttribute = ChatConfig.configTable["admin"]["useAdminAttribute"];

            string jsonstring = JsonConvert.SerializeObject(status, Formatting.None);

            return Ok(jsonstring);
        }
    }
}
