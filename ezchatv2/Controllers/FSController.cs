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

        [HttpPost]
        [Produces("application/json")]
        [DisableRequestSizeLimit]
        [RequestFormLimits(ValueLengthLimit = int.MaxValue, MultipartBodyLengthLimit = int.MaxValue)]
        // due to restrictions, all requests have a hardware limit of 2.14 GB
        public async Task<IActionResult> Upload(IFormFile file)
        {
            /*try
            {
                var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images", file.FileName);
                var stream = new FileStream(path, FileMode.Create);
                await file.CopyToAsync(stream);
                return Ok(new { length = file.Length, name = file.FileName });
            }
            catch
            {
                return BadRequest();
            }*/

            try
            {
                System.Diagnostics.Debug.WriteLine("file named [" + file.FileName + "] from uid [" + Request.Headers["uid"] + "]");
                FS_UploadResponse response = new FS_UploadResponse();

                int maxFileLimit = ChatConfig.configTable["fs"]["fileSizeLimit"] * 1000000;
                if (file.Length > maxFileLimit)
                {
                    response.key = null;
                    response.message = "fileSizeLimitExceeded";
                    
                    return BadRequest(JsonConvert.SerializeObject(response, Formatting.None));

                }

                var fspath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], "test" + FSMethods.GetFileExtension(file.FileName));
                var stream = new FileStream(fspath, FileMode.OpenOrCreate);
                await file.CopyToAsync(stream);
                await stream.DisposeAsync();
                stream.Close();

                response.key = "0";
                response.message = null;
                string jsonstring = JsonConvert.SerializeObject(response, Formatting.None);
                return Ok(jsonstring);
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
