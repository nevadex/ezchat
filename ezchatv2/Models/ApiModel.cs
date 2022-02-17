using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ezchatv2.Models
{
    public class Api_Status
    {
        public int userCharLimit { get; set; }
        public int messageCharLimit { get; set; }
        public bool useAdminAttribute { get; set; }
    }
}
