using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using LiteDB;

namespace ezchatv2.Models
{
    public class FS_Status
    {
        public bool enabled { get; set; }
        public bool filterExts { get; set; }
        public List<string> acceptedExts { get; set; }
        public List<string> blockedExts { get; set; }
        public bool displayImages { get; set; }
        public List<string> imageExts { get; set; }

        public FS_Status()
        {
            acceptedExts = new List<string>();
            blockedExts = new List<string>();
            imageExts = new List<string>();
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
        public string displayName { get; set; } // original file name without ext
        public string fileName { get; set; } // stored file name, changed in config opt "secureFileNames"
        // format: regular=displayName.fileExt secure=fileId.fileExt.ezfs
        public string fileExt { get; set; }
    }

    public class FSMethods
    {
        public static string GetFileExtension(string filename)
        {
            try
            {
                string[] sections = filename.Split(".");
                string ext = sections[sections.Length - 1];
                return "." + ext;
            }
            catch
            {
                return null;
            }
        }
    }
}
