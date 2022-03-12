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
using LiteDB;

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
            try
            {
                return Ok(JsonConvert.SerializeObject(FSMethods.GenerateStatus(), Formatting.None));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPost]
        [Produces("application/json")]
        [DisableRequestSizeLimit]
        [RequestFormLimits(ValueLengthLimit = int.MaxValue, MultipartBodyLengthLimit = int.MaxValue)]
        // due to restrictions, all requests have a hardware limit of 2.14 GB
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (FSMethods.GenerateStatus().enabled)
            {
                try
                {
                    FS_Status fsStatus = FSMethods.GenerateStatus();

                    string uploader = "unknown";
                    if (Request.Headers.ContainsKey("uid") && !string.IsNullOrWhiteSpace(Request.Headers["uid"])) { uploader = Request.Headers["uid"]; }

                    Util.VerboseConsole("[FS] " + "file named [" + file.FileName + "] [" + (file.Length / 1000000).ToString() + " MB] from uid [" + uploader + "]", "[FS] file upload attempt from [" + Request.Headers["uid"] + "]");

                    FS_UploadResponse response = new FS_UploadResponse();
                    // validation
                    if (fsStatus.blockedExts.Contains(FSMethods.GetFileExtension(file.FileName)))
                    {
                        Util.VerboseConsole("[FS] " + file.FileName + ": upload failed [fileExtBlocked]", "[FS] upload failed");
                        response.url = null;
                        response.message = "fileExtBlocked";
                        return BadRequest(JsonConvert.SerializeObject(response, Formatting.None));
                    }
                    if (fsStatus.filterExts && !fsStatus.acceptedExts.Contains(FSMethods.GetFileExtension(file.FileName)))
                    {
                        Util.VerboseConsole("[FS] " + file.FileName + ": upload failed [fileNotAccepted]", "[FS] upload failed");
                        response.url = null;
                        response.message = "fileNotAccepted";
                        return BadRequest(JsonConvert.SerializeObject(response, Formatting.None));
                    }
                    int maxFileLimit = fsStatus.maxFileSizeMB * 1000000;
                    if (file.Length > maxFileLimit)
                    {
                        Util.VerboseConsole("[FS] " + file.FileName + ": upload failed [fileSizeLimitExceeded]", "[FS] upload failed");
                        response.url = null;
                        response.message = "fileSizeLimitExceeded";
                        return BadRequest(JsonConvert.SerializeObject(response, Formatting.None));

                    }

                    var maxFiles = ChatConfig.configTable["fs"]["maxFiles"];
                    var db = new LiteDatabase(FSMethods.FSDBConStr());
                    var col = db.GetCollection<FS_FileRecord>("files");
                    var cursorcol = db.GetCollection<FS_DBCursor>("cursor");
                    var cursorRN = cursorcol.FindById(1);

                    if (col.FindById(cursorRN.bsonIndex) == null)
                    {
                        // new record
                        FS_FileRecord record = new FS_FileRecord(file.FileName, uploader);
                        record.fileId = cursorRN.fileId;
                        if (string.IsNullOrWhiteSpace(record.displayName))
                        {
                            record.displayName = "unknown" + record.fileExt;
                        }
                        record.displayName = record.displayName.Replace(" ", "_");
                        if (!ChatConfig.configTable["fs"]["secureFileNames"])
                        {
                            record.fileName = record.fileId + "_" + record.displayName;
                        }
                        else
                        {
                            record.fileName = record.fileId + record.fileExt + ".ezfs";
                        }

                        var fspath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], record.fileName);
                        var stream = new FileStream(fspath, FileMode.OpenOrCreate);
                        await file.CopyToAsync(stream);
                        await stream.DisposeAsync();
                        stream.Close();
                        Util.VerboseConsole("[FS] " + record.displayName + ": uploaded to [" + record.fileName + "]");

                        col.Insert(record);

                        // cursor
                        if (cursorcol.FindById(1).bsonIndex == maxFiles && maxFiles > 0)
                        {
                            var cursor = cursorcol.FindById(1);
                            cursor.bsonIndex = 1;
                            cursor.fileId = 1;
                            cursor.lastUpdated = DateTime.Now;
                            cursorcol.Update(cursor);
                        }
                        else
                        {
                            var cursor = cursorcol.FindById(1);
                            cursor.bsonIndex++;
                            cursor.fileId++;
                            cursor.lastUpdated = DateTime.Now;
                            cursorcol.Update(cursor);
                        }

                        db.Dispose();

                        response.url = "fs/download/" + record.fileId + "/" + record.displayName + "/";
                        Util.VerboseConsole("[FS] url generated: [" + response.url + "]");
                        response.message = "success";
                        string jsonstring = JsonConvert.SerializeObject(response, Formatting.None);
                        return Ok(jsonstring);
                    }
                    else if (col.FindById(cursorRN.bsonIndex) != null)
                    {
                        // new record
                        FS_FileRecord record = new FS_FileRecord(file.FileName, uploader);
                        record.bsonId = cursorRN.bsonIndex;
                        record.fileId = cursorRN.fileId;
                        if (string.IsNullOrWhiteSpace(record.displayName))
                        {
                            record.displayName = "unknown" + record.fileExt;
                        }
                        record.displayName = record.displayName.Replace(" ", "_");
                        if (!ChatConfig.configTable["fs"]["secureFileNames"])
                        {
                            record.fileName = record.fileId + "_" + record.displayName;
                        }
                        else
                        {
                            record.fileName = record.fileId + record.fileExt + ".ezfs";
                        }

                        // delete old file
                        var oldrecord = col.FindById(cursorRN.bsonIndex);
                        var oldpath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], oldrecord.fileName);
                        System.IO.File.Delete(oldpath);
                        var fspath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], record.fileName);
                        var stream = new FileStream(fspath, FileMode.OpenOrCreate);
                        await file.CopyToAsync(stream);
                        await stream.DisposeAsync();
                        stream.Close();
                        Util.VerboseConsole("[FS] " + record.displayName + ": uploaded to [" + record.fileName + "], overwrote [" + oldrecord.fileName + "]");

                        col.Update(record);

                        // cursor
                        if (cursorcol.FindById(1).bsonIndex == maxFiles && maxFiles > 0)
                        {
                            var cursor = cursorcol.FindById(1);
                            cursor.bsonIndex = 1;
                            cursor.fileId = 1;
                            cursor.lastUpdated = DateTime.Now;
                            cursorcol.Update(cursor);
                        }
                        else
                        {
                            var cursor = cursorcol.FindById(1);
                            cursor.bsonIndex++;
                            cursor.fileId++;
                            cursor.lastUpdated = DateTime.Now;
                            cursorcol.Update(cursor);
                        }

                        db.Dispose();

                        response.url = "fs/download/" + record.fileId + "/" + record.displayName + "/";
                        Util.VerboseConsole("[FS] url generated: [" + response.url + "]");
                        response.message = "success";
                        string jsonstring = JsonConvert.SerializeObject(response, Formatting.None);
                        return Ok(jsonstring);
                    }
                    else
                    {
                        throw new Exception("FS error");
                    }
                }
                catch
                {
                    return StatusCode(500);
                }
            }
            else
            {
                return StatusCode(405);
            }
        }

        [HttpGet("{id:int}/{name}")]
        public async Task<ActionResult> Download(int id, string name)
        {
            if (FSMethods.GenerateStatus().enabled)
            {
                try
                {
                    // validation
                    if (string.IsNullOrWhiteSpace(name)) { return BadRequest(); }

                    var db = new LiteDatabase(FSMethods.FSDBConStr());
                    var col = db.GetCollection<FS_FileRecord>("files");
                    col.EnsureIndex(x => x.fileId);
                    col.EnsureIndex(x => x.displayName);
                    var result = col.FindOne(x => x.fileId == id && x.displayName == name);
                    db.Dispose();

                    if (result == null)
                    {
                        return NotFound();
                    }

                    var bytes = await System.IO.File.ReadAllBytesAsync(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], result.fileName));
                    var file = File(bytes, "*/*", result.displayName, enableRangeProcessing: true);
                    return file;
                }
                catch (Exception ex)
                {
                    Util.VerboseConsole(ex.ToString());
                    return StatusCode(500);
                }
            }
            else
            {
                return StatusCode(405);
            }
        }
    }
}
