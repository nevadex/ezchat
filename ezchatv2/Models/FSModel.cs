using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
}
