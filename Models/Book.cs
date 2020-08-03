using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookW.Models
{
    public class Book
    {
        public int ID { get; set; }
        public string Name { get; set; }
        public int Pages { get; set; }
        public string Author { get; set; }
        public string Description { get; set; }
    }
}
