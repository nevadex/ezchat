using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using ezchatv2.Models;
using Tommy;

namespace ezchatv2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FSController : ControllerBase
    {
        // GET api/<FSController>/5
        //[HttpGet]
        //public string Get()
        //{
        //    return "value";
        //}

        [HttpGet]
        [Produces("application/json")]
        public async Task<IActionResult> Get()
        {
            FS_Status status = new FS_Status();
            status.enabled = ChatConfig.configTable["fs"]["fileSystem"];
            status.filterExts = ChatConfig.configTable["fs"]["filterFileExts"];
            foreach (TomlNode i in ChatConfig.configTable["fs"]["allowedFileExts"]) { status.acceptedExts.Add(i); }
            foreach (TomlNode i in ChatConfig.configTable["fs"]["blockedFileExts"]) { status.blockedExts.Add(i); }
            status.displayImages = ChatConfig.configTable["fs"]["autoDisplayImages"];
            foreach (TomlNode i in ChatConfig.configTable["fs"]["imageFileExts"]) { status.imageExts.Add(i); }

            string jsonstring = JsonConvert.SerializeObject(status, Formatting.None);

            return Ok(jsonstring);
        }
    }
}
