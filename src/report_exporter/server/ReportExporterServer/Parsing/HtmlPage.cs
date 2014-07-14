using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace ReportExporterServer
{
	public class HtmlPage
	{
		public string Source { get; private set; }

		public List<Asset> Styles { get; private set; }

		private HtmlPage ()
		{
			Styles = new List<Asset> ();
		}

		public static HtmlPage FromRaw(string rawHtml) 
		{
			HtmlPage page = new HtmlPage ();
			page.Source = page.FilterNoise(rawHtml);
			return page;
		}

		private string FilterNoise(string html)
		{
			StringBuilder sb = new StringBuilder ();
			bool hasStart = false;
			bool take = false;

			foreach (var item in html.Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries))
			{
				if (!hasStart)
				{
					if (item.Contains("rel=\"stylesheet\""))
					{
						var newitem = ParseStyleSheet(item);
						sb.AppendLine(newitem);
					} 
					else
					{
						sb.AppendLine(item);

						if (item.Contains("<body>"))
						{
							hasStart = true;
						}
					}
				} 
				else 
				{
					if (item.Contains ("id=\"main_content\""))
					{
						take = true;
					} 
					else if (take && item.Contains ("id=\"gadgettable"))
					{
						break;
					}

					if (take)
					{
						sb.AppendLine (item);
					}
				}
			}

			return sb.ToString ();
		}

		private string ParseStyleSheet(string item)
		{
			var tmp = item.Substring (item.IndexOf ("href=") + 6);
			var remote = "world-of-dungeons.net" + tmp.Substring(0, tmp.IndexOf("\""));
			var newName = tmp.Substring (tmp.LastIndexOf ("?"));
			newName = "/assets/" + newName.Substring (newName.LastIndexOf ("/"));
			Styles.Add (new Asset () { Local = newName, Remote = remote });
			tmp = "<link rel=\"stylesheet\" type=\"text/css\" href=\"/assets/" + newName + "\" />";
			return tmp;
		}
	}
}

