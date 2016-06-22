using System;
using System.Net;
using System.IO;
using System.Text;

namespace ReportExporterServer
{
	using Fleck;

	class MainClass
	{
		private static string _sessionId;

		private static string _postId;

		public static void Main (string[] args)
		{
			var port = 8765;

			Console.WriteLine("Starting server...");

			var server = new WebSocketServer("ws://0.0.0.0:" + port);

			server.Start(socket =>
				{
					socket.OnOpen = () => Console.WriteLine("Client connected");
					socket.OnClose = () => Console.WriteLine("Client disconnected");
					socket.OnMessage = message => {
						OnMessage(message);
					};
				});
			Console.ReadLine ();
		}

		private static void OnMessage(string message)
		{
			if (string.IsNullOrWhiteSpace(message))
			{
				return;
		    }

			if (message.StartsWith ("PHPSESSID")) 
			{
				var tmp = message.Split (new [] { ';' });
				_sessionId = tmp[0];
				_postId = tmp [1];
			} 
			else if (message.StartsWith("report_id"))
			{
				var tmp = message.Split(new [] { '=' });
				PerformExport(tmp[0].Substring("report_id".Length), tmp[1]);
			}
		}

		const string BaseUrl  = "http://darkveil.world-of-dungeons.net/wod/spiel/dungeon/report.php";

		private static void PerformExport(string name, string id)
		{
			var data = string.Format("stats{0}=statistics&report_id{0}={1}&wod_post_id={2}", name, id, _postId);
			var raw = FetchHtml(BaseUrl, data);
			var htmlPage = HtmlPage.FromRaw (raw);

			File.WriteAllText ("stats.html", htmlPage.Source);
		}


		private static string FetchHtml(string url, string data) 
		{
			using (WebClient client = new WebClient ()) 
			{
				Console.WriteLine ("Fetching: {0} {1}", url, data);
				client.Headers.Add ("Cookie", _sessionId);
				client.Headers[HttpRequestHeader.ContentType] = "application/x-www-form-urlencoded";
				return client.UploadString (url, data);
			};
		}

	}
}
