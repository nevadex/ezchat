using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using LiteDB;
using Tommy;
using System.IO;

namespace ezchatv2.Models
{
    public class FS_Status
    {
        public bool enabled { get; set; }
        public bool filterExts { get; set; }
        public List<string> acceptedExts { get; set; }
        public List<string> blockedExts { get; set; }
        public bool displayImages { get; set; }
        public int maxFileSizeMB { get; set; }

        public FS_Status()
        {
            acceptedExts = new List<string>();
            blockedExts = new List<string>();
        }
    }

    public class FS_UploadResponse
    {
        public string url { get; set; }
        public string message { get; set; }
    }

    public class FS_FileRecord
    {
        [BsonId]
        public int bsonId { get; set; } // bson id when put in db
        public int fileId { get; set; } // index of file list
        public string uploader { get; set; } // uid/user who uploaded file
        public DateTime uploadTime { get; set; } // time of upload
        public string displayName { get; set; } // original file name without ext
        public string fileName { get; set; } // stored file name, changed in config opt "secureFileNames"
        // format: regular=displayName.fileExt secure=fileId.fileExt.ezfs
        public string fileExt { get; set; } // file extension

        public FS_FileRecord(string fileDisplayName, string uploaderUID)
        {
            uploader = uploaderUID;
            uploadTime = DateTime.Now;    
            fileExt = FSMethods.GetFileExtension(fileDisplayName);
            displayName = fileDisplayName;
        }
    }

    public class FS_DBCursor
    {
        [BsonId]
        public int bsonId { get; set; }
        public int bsonIndex { get; set; }
        public int fileId { get; set; }
        public DateTime lastUpdated { get; set; } // debug

        public FS_DBCursor()
        {
            lastUpdated = DateTime.Now;
        }
    }

    public class FSMethods
    {
        public static string GetFileExtension(string filename)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(filename))
                {
                    return null;
                }
                string[] sections = filename.Split(".");
                string ext = sections[sections.Length - 1];
                if (ext == filename)
                {
                    return "";
                }
                return "." + ext;
            }
            catch
            {
                return null;
            }
        }

        public static FS_Status GenerateStatus()
        {
            FS_Status status = new FS_Status();
            status.enabled = ChatConfig.configTable["fs"]["fileSystem"];
            status.filterExts = ChatConfig.configTable["fs"]["filterFileExts"];
            foreach (TomlNode i in ChatConfig.configTable["fs"]["allowedFileExts"]) { status.acceptedExts.Add(i); }
            foreach (TomlNode i in ChatConfig.configTable["fs"]["blockedFileExts"]) { status.blockedExts.Add(i); }
            status.displayImages = ChatConfig.configTable["fs"]["autoDisplayImages"];
            status.maxFileSizeMB = ChatConfig.configTable["fs"]["fileSizeLimit"];
            return status;
        }

        public static string FSDBConStr()
        {
            return "Filename=" + AppDomain.CurrentDomain.BaseDirectory + ChatConfig.configTable["fs"]["fsDirectory"] + "/fs.db;Connection=Shared";
        }

        public static void ResetFS()
        {
            if (File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], "fs.db")))
            {
                Util.Print("[FS] Deleting existing files..");
                var db = new LiteDatabase(FSDBConStr());
                var col = db.GetCollection<FS_FileRecord>("files");

                for (int i = 1; i <= col.Count(); i++)
                {
                    File.Delete(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.configTable["fs"]["fsDirectory"], col.FindById(i).fileName));
                }

                Util.Print("[FS] Dropping collections..");
                db.DropCollection("files");
                db.DropCollection("cursor");

                Util.Print("[FS] Creating cursor..");
                var cursorcol = db.GetCollection<FS_DBCursor>("cursor");
                var cursor = new FS_DBCursor() { bsonIndex = 1, fileId = 1 };
                cursorcol.Insert(cursor);

                Util.Print("[FS] Done, exiting");
                Environment.Exit(0);
            }
            else
            {
                Util.Print("[FS] No filesystem detected, exiting");
                Environment.Exit(-1);
            }
        }
    }
}
