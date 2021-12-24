using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using System.IO;

using Tommy;

namespace ezchatv2.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string user, string message)
        {
            // check for uid
            if (!Context.Items.TryGetValue("uid", out object value))
            { Context.Abort(); return; }

            msg x = new msg { };
            // update name if changed
            foreach (msg i in ppcontext.contextedUsers)
            {
                if (i.message == Context.ConnectionId)
                {
                    x = new msg {user = user, uid = i.uid, message = i.message};
                    ppcontext.contextedUsers.Remove(i);
                    break;
                }
            }
            ppcontext.contextedUsers.Add(x);
            // refresh clientList
            string clientListMsg = ppcontext.ConnectedIds.Count.ToString();
            // ¶
            foreach (msg i in ppcontext.contextedUsers)
            {
                string v = " " + i.uid + "¶" + i.user;
                clientListMsg = clientListMsg + v;
            }
            await Clients.All.SendAsync("ServerMsg", "clientList", clientListMsg, "SERVER");

            await Clients.All.SendAsync("ReceiveMessage", user, message, Context.Items["uid"]);
            Console.WriteLine("<" + user + "/" + Context.Items["uid"] + "> " + message);
            string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.msglog_file);
            string text = File.ReadAllText(path) + "\n[" + DateTime.Now.ToString("MM/dd/yyyy hh:mm tt") + "] " + Context.Items["uid"] + "/" + user + ": " + message;
            File.WriteAllText(path, text);

            msg cMsg = new msg {user = user, message = message, uid = Context.Items["uid"].ToString()};
            ppcontext.recentMsgs.Add(cMsg);
            if (ppcontext.recentMsgs.Count > 20)
            {
                while (ppcontext.recentMsgs.Count > 20)
                {
                    ppcontext.recentMsgs.RemoveAt(0);
                }
            }
        }

        public async Task Login(string user, string uid)
        {   
            // check for ban
            string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.banlist_file);
            List<string> banlist = File.ReadAllText(path).Split("\n").ToList<string>();
            banlist.Remove(banlist[0]);
            System.Diagnostics.Debug.WriteLine(banlist.Count);
            foreach (string i in banlist)
            {
                if (uid == i)
                {
                    await Clients.Caller.SendAsync("ServerMsg", "banMsg", i + " is banned", "SERVER");
                    Context.Abort();
                }
            }

            System.Diagnostics.Debug.WriteLine("login: username:" + user + ", connectionID:" + Context.ConnectionId + ", UID: " + uid);
            Context.Items.Add("uid", uid);
            //System.Diagnostics.Debug.WriteLine(Context.Items["uid"]);

            // add user to contexted users
            ppcontext.contextedUsers.Add(new msg {uid = uid, user = user, message = Context.ConnectionId});
            string clientListMsg = ppcontext.ConnectedIds.Count.ToString();
            // ¶
            foreach (msg i in ppcontext.contextedUsers)
            {
                string v = " " + i.uid + "¶" + i.user;
                clientListMsg = clientListMsg + v;
            }
            await Clients.All.SendAsync("ServerMsg", "clientList", clientListMsg, "SERVER");

            foreach (msg i in ppcontext.recentMsgs)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", i.user, i.message, i.uid);
            }

            Context.Items.Add("admin", "false");
            // check for admin
            foreach (TomlNode i in ChatConfig.configTable["admin"]["adminUids"])
            {
                if (i == uid)
                {
                    // ServerMsg client informing admin
                    await Clients.Caller.SendAsync("AdminMsg", "clientAdmin", Context.Items["uid"], "SERVER");
                    //Context.Items.Add("admin", "true");
                    Context.Items["admin"] = "true";
                    break;
                }
            }
        }

        public async Task ServerMsg(string type, string message, string uid)
        {
            // server messenger
            // usable types: 
            if (true)
            {
                
            }
        }

        public async Task AdminMsg(string type, string message, string uid)
        {
            // verify if user is admin
            if (Context.Items["admin"].ToString() == "true" && Context.Items["uid"].ToString() == uid)
            { }
            else if (ChatConfig.configTable["admin"]["useAdminAttribute"])
            { }
            else
            { Context.Abort(); System.Diagnostics.Debug.WriteLine(Context.Items["admin"].ToString() + "  " + Context.Items["uid"]); return; }

            // usable types: ban unban banlist
            if (type == "ban")
            {
                string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.banlist_file);
                string text = File.ReadAllText(path) + "\n" + message;
                File.WriteAllText(path, text);

                string bannedConID = "";
                // find user
                foreach (msg i in ppcontext.contextedUsers)
                {
                    if (i.uid == message)
                    {
                        bannedConID = i.uid;
                    }
                }

                await Clients.Client(bannedConID).SendAsync("ServerMsg", "reload", "", "SERVER");

                System.Diagnostics.Debug.WriteLine(uid + " banned " + message);
            }
            else if (type == "unban")
            {
                string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.banlist_file);
                List<string> banlist = File.ReadAllText(path).Split("\n").ToList<string>();
                banlist.Remove(banlist[0]);
                string banliststr = "ez chat v2 / ban list";
                foreach (string i in banlist)
                {
                    if (i != message)
                    {
                        banliststr += "\n" + i;
                    }
                }
                File.WriteAllText(path, banliststr);

                System.Diagnostics.Debug.WriteLine(uid + " unbanned " + message);
            }
            else if (type == "banlist")
            {
                string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.banlist_file);
                List<string> banlist = File.ReadAllText(path).Split("\n").ToList<string>();
                banlist.Remove(banlist[0]);
                string banliststr = "";
                foreach (string i in banlist)
                {
                    banliststr += " " + i;
                }
                try { banliststr.Remove(0, 1); } catch { banliststr = "none"; }
                await Clients.Caller.SendAsync("AdminMsg", "banlist", banliststr, "SERVER");
            }
        }

        // manage total connected clients

        public override Task OnConnectedAsync()
        {
            ppcontext.ConnectedIds.Add(Context.ConnectionId);
            System.Diagnostics.Debug.WriteLine("total connected users: " + ppcontext.ConnectedIds.Count);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            ppcontext.ConnectedIds.Remove(Context.ConnectionId);

            foreach (msg i in ppcontext.contextedUsers)
            {
                if (i.uid == Context.Items["uid"].ToString())
                {
                    ppcontext.contextedUsers.Remove(i);
                    break;
                }
            }

            string clientListMsg = ppcontext.ConnectedIds.Count.ToString();
            // ¶
            foreach (msg i in ppcontext.contextedUsers)
            {
                string v = " " + i.uid + "¶" + i.user;
                clientListMsg = clientListMsg + v;
            }
            Clients.All.SendAsync("ServerMsg", "clientList", clientListMsg, "SERVER");

            System.Diagnostics.Debug.WriteLine("total connected users: " + ppcontext.ConnectedIds.Count);
            return base.OnDisconnectedAsync(exception);
        }
    }

    public class msg
    {
        public string user { get; set; }
        public string message { get; set; }
        public string uid { get; set; }
    }

    public class ppcontext
    {
        public static List<msg> recentMsgs = new List<msg>();
        public static HashSet<string> ConnectedIds = new HashSet<string>();
        public static List<msg> contextedUsers = new List<msg>();
    }
}
