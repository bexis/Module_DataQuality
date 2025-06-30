using BExIS.Security.Entities.Objects;
using BExIS.Security.Services.Objects;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Vaiona.Web.Mvc.Modularity;

namespace BExIS.Modules.Dov.UI.Helper
{
    public class DovSeedDataGenerator : IModuleSeedDataGenerator
    {
        public void GenerateSeedData()
        {
            FeatureManager featureManager = new FeatureManager();
            OperationManager operationManager = new OperationManager();

            try
            {
                Feature rootDataToolsFeature = featureManager.FeatureRepository.Get().FirstOrDefault(f => f.Name.Equals("Data Quality Hook"));
                if (rootDataToolsFeature == null) rootDataToolsFeature = featureManager.Create("Data Quality Hook", "Data Quality Hook");

                Feature GalleryFeature = featureManager.FeatureRepository.Get().FirstOrDefault(f => f.Name.Equals("Datasets Overview"));
                if (GalleryFeature == null) GalleryFeature = featureManager.Create("Datasets Overview", "Datasets Overview", rootDataToolsFeature);

                operationManager.Create("DOV", "DatasetsOverview", "*", GalleryFeature);
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                featureManager.Dispose();
                operationManager.Dispose();
            }
        }

            public void Dispose()
        {
            // nothing to do for now...
        }
    }
}