using BExIS.Modules.Dov.UI.Helper;
using System;
using Vaiona.Logging;
using Vaiona.Web.Mvc.Modularity;

namespace BExIS.Modules.Dqm.UI
{
    public class DQMModule : ModuleBase
    {
        public DQMModule(): base("DQM")
        {
        }

       
        public override void Install()
        {
            LoggerFactory.GetFileLogger().LogCustom("... start install of DQM ...");
            try
            {
                base.Install();
                //using (DqmSeedDataGenerator generator = new DovSeedDataGenerator())
                //{
                //    //generator.GenerateSeedData();
                //}
            }
            catch (Exception e)
            {
                LoggerFactory.GetFileLogger().LogCustom(e.Message);
                LoggerFactory.GetFileLogger().LogCustom(e.StackTrace);
            }

            LoggerFactory.GetFileLogger().LogCustom("... end install of DQM ...");
        }
    }
}
