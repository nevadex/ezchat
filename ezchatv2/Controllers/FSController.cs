﻿using Microsoft.AspNetCore.Mvc;
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
#pragma warning disable CS1998
        public async Task<IActionResult> Status()
#pragma warning restore CS1998
        {
            return Ok(JsonConvert.SerializeObject(FSMethods.GenerateStatus(), Formatting.None));
        }

        [HttpPost]
        [Produces("application/json")]
        [DisableRequestSizeLimit]
        [RequestFormLimits(ValueLengthLimit = int.MaxValue, MultipartBodyLengthLimit = int.MaxValue)]
        // due to restrictions, all requests have a hardware limit of 2.14 GB
        public async Task<IActionResult> Upload(IFormFile file)
        {
            
            try
            {
                string uploader = "unknown";
                if (Request.Headers.ContainsKey("uid") && !string.IsNullOrWhiteSpace(Request.Headers["uid"])) { uploader = Request.Headers["uid"]; }

                Util.VerboseConsole("[FS] " + "file named [" + file.FileName + "] [" + (file.Length / 1000000).ToString() + " MB] from uid [" + uploader + "]", "[FS] file upload attempt from [" + Request.Headers["uid"] + "]");

                FS_UploadResponse response = new FS_UploadResponse();

                int maxFileLimit = ChatConfig.configTable["fs"]["fileSizeLimit"] * 1000000;
                if (file.Length > maxFileLimit)
                {
                    Util.VerboseConsole("[FS] " + file.FileName + ": upload failed [fileSizeLimitExceeded]", "[FS] upload failed");
                    response.url = null;
                    response.message = "fileSizeLimitExceeded";
                    return BadRequest(JsonConvert.SerializeObject(response, Formatting.None));

                }



                var fspath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], "test" + FSMethods.GetFileExtension(file.FileName));
                var stream = new FileStream(fspath, FileMode.OpenOrCreate);
                await file.CopyToAsync(stream);
                await stream.DisposeAsync();
                stream.Close();
                Util.VerboseConsole("[FS] " + file.FileName + ": uploaded to [" + "test" + FSMethods.GetFileExtension(file.FileName) + "]");

                response.url = "fs/download/?name=test.png";
                Util.VerboseConsole("[FS] url generated: [" + response.url + "]");
                response.message = "success";
                string jsonstring = JsonConvert.SerializeObject(response, Formatting.None);
                return Ok(jsonstring);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet]
        public async Task<ActionResult> Download(string name)
        {
            // validation
            if (string.IsNullOrWhiteSpace(name)) { return BadRequest(); }

            var bytes = await System.IO.File.ReadAllBytesAsync(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], "test.png"));
            var file = File(bytes, "*/*", "test.png");
            return file;
        }
    }
}
