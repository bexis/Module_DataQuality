using System.Data;

namespace BExIS.Modules.Dqm.UI.Models
{
    public class DatasetsOverviewDataModel
    {
        public DataTable data { get; set; }
        public string GenerationTime { get; set; }

        public DatasetsOverviewDataModel()
        {
            data = new DataTable();
        }
    }
}