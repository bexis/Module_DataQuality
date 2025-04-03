using BExIS.Modules.Dov.UI.Helper;
using System;
using Vaiona.Logging;
using Vaiona.Web.Mvc.Modularity;

namespace BExIS.Modules.Dov.UI
{
    public class DOVModule : ModuleBase
    {
        public DOVModule(): base("DOV")
        {
        }

       
        public override void Install()
        {
            LoggerFactory.GetFileLogger().LogCustom("... start install of DOV ...");
            try
            {
                base.Install();
                using (DovSeedDataGenerator generator = new DovSeedDataGenerator())
                {
                    generator.GenerateSeedData();
                }
            }
            catch (Exception e)
            {
                LoggerFactory.GetFileLogger().LogCustom(e.Message);
                LoggerFactory.GetFileLogger().LogCustom(e.StackTrace);
            }

            LoggerFactory.GetFileLogger().LogCustom("... end install of DOV ...");
        }
    }
}
