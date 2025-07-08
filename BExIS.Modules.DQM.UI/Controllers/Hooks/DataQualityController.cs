using BExIS.App.Bootstrap.Attributes;
using BExIS.Dlm.Entities.Data;
using BExIS.Dlm.Services.Data;
using BExIS.Security.Entities.Authorization;
using BExIS.UI.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Vaiona.Web.Mvc.Models;

namespace BExIS.Modules.Dqm.UI.Controllers.Legacy
{
    public class DataQualityController : Controller
    {
        // GET: DataQuality
        public ActionResult Index(long id, int version)
        {
           ViewBag.Id = id;
           ViewBag.Version = version;

           return PartialView("Index");
        }

        public ActionResult Test()
        {
            return View("Index");

        }

        /// <summary>
        /// Entrypoint for Data Quality Hook
        /// </summary>
        /// <param name="id"></param>
        /// <param name="version"></param>
        /// <returns></returns>
        [BExISEntityAuthorize(typeof(Dataset), "id", RightType.Read)]
        public ActionResult Start(long id, int version = 0)
       {
            //return RedirectToAction("index", new { id, version });
            return RedirectToAction("Index", new { id, version });
        }
    }

   
}