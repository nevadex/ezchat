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
            if (!Context.Items.TryGetValue("uid", out object value)) { Context.Abort(); return; }

            // validation
            if (user.Contains(" ")) { Context.Abort(); return; }
            if (string.IsNullOrWhiteSpace(user)) { Context.Abort(); return; }
            if (user.Length > ChatConfig.configTable["basic"]["userCharLimit"]) { Context.Abort(); return; }
            if (string.IsNullOrWhiteSpace(message)) { Context.Abort(); return; }
            if (message.Length > ChatConfig.configTable["basic"]["messageCharLimit"]) { Context.Abort(); return; }

            msg x = new msg { };
            // update name if changed
            foreach (msg i in ChatContext.contextedUsers)
            {
                if (i.message == Context.ConnectionId)
                {
                    x = new msg {user = user, uid = i.uid, message = i.message};
                    ChatContext.contextedUsers.Remove(i);
                    break;
                }
            }
            ChatContext.contextedUsers.Add(x);
            // refresh clientList
            string clientListMsg = ChatContext.ConnectedIds.Count.ToString();
            // ¶
            foreach (msg i in ChatContext.contextedUsers)
            {
                string v = " " + i.uid + "¶" + i.user;
                clientListMsg = clientListMsg + v;
            }
            await Clients.All.SendAsync("ServerMsg", "clientList", clientListMsg, "SERVER");

            // message delivery
            if (ChatContext.paused == false)
            {
                await Clients.All.SendAsync("ReceiveMessage", user, message, Context.Items["uid"]);
                Util.Print("[CH] <" + user + "/" + Context.Items["uid"] + "> " + message);
                string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.msglog_file);
                string text = File.ReadAllText(path) + "\n[" + DateTime.Now.ToString("MM/dd/yyyy hh:mm tt") + "] " + Context.Items["uid"] + "/" + user + ": " + message;
                File.WriteAllText(path, text);

                msg cMsg = new msg { user = user, message = message, uid = Context.Items["uid"].ToString() };
                ChatContext.recentMsgs.Add(cMsg);
                if (ChatContext.recentMsgs.Count > ChatConfig.configTable["basic"]["recentMsgs"])
                {
                    while (ChatContext.recentMsgs.Count > ChatConfig.configTable["basic"]["recentMsgs"])
                    {
                        ChatContext.recentMsgs.RemoveAt(0);
                    }
                }
            }
        }

        public async Task Login(string user, string uid)
        {
            // validation
            if (user.Contains(" ")) { Context.Abort(); return; }
            if (string.IsNullOrWhiteSpace(user)) { Context.Abort(); return; }
            if (user.Length > ChatConfig.configTable["basic"]["userCharLimit"]) { Context.Abort(); return; }

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

            Util.VerboseConsole("login: username:" + user + ", connectionID:" + Context.ConnectionId + ", UID: " + uid);
            Context.Items.Add("uid", uid);
            //System.Diagnostics.Debug.WriteLine(Context.Items["uid"]);

            // add user to contexted users
            ChatContext.contextedUsers.Add(new msg {uid = uid, user = user, message = Context.ConnectionId});
            string clientListMsg = ChatContext.ConnectedIds.Count.ToString();
            // ¶
            foreach (msg i in ChatContext.contextedUsers)
            {
                string v = " " + i.uid + "¶" + i.user;
                clientListMsg = clientListMsg + v;
            }
            await Clients.All.SendAsync("ServerMsg", "clientList", clientListMsg, "SERVER");

            foreach (msg i in ChatContext.recentMsgs)
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
            // check for uid
            if (!Context.Items.TryGetValue("uid", out object value)) { Context.Abort(); return; }

            // server messenger
            // usable types: 
            if (true)
            {
                await Clients.Caller.SendAsync("ServerMsg", "none", "", "SERVER");
            }
        }

        public async Task AdminMsg(string type, string message, string uid)
        {
            // check for uid
            if (!Context.Items.TryGetValue("uid", out object value)) { Context.Abort(); return; }

            // verify if user is admin
            if (Context.Items["admin"].ToString() == "true" && Context.Items["uid"].ToString() == uid)
            { }
            else if (ChatConfig.configTable["admin"]["useAdminAttribute"])
            { }
            else
            { Context.Abort(); Util.VerboseConsole("[AD]" + uid + " was kicked as impostor admin"); return; }


            // usable types: ban unban banlist clearCache reloadConfig refreshAllClients changeMotd pauseChat stopChat
            if (type == "ban")
            {
                string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.banlist_file);
                string text = File.ReadAllText(path) + "\n" + message;
                File.WriteAllText(path, text);

                string bannedConID = "";
                // find user
                foreach (msg i in ChatContext.contextedUsers)
                {
                    if (i.uid == message)
                    {
                        bannedConID = i.message;
                    }
                }

                await Clients.Client(bannedConID).SendAsync("ServerMsg", "reload", "", "SERVER");

                Util.Print("[AD] " + uid + " banned " + message);
            }
            else if (type == "unban")
            {
                string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.banlist_file);
                List<string> banlist = File.ReadAllText(path).Split("\n").ToList<string>();
                banlist.Remove(banlist[0]);
                string banliststr = "EZchat / ban list";
                foreach (string i in banlist)
                {
                    if (i != message)
                    {
                        banliststr += "\n" + i;
                    }
                }
                File.WriteAllText(path, banliststr);

                Util.Print("[AD] " + uid + " unbanned " + message);
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
                if (!string.IsNullOrEmpty(banliststr))
                { banliststr.Remove(0, 1); }
                else
                { banliststr = "none"; }
                await Clients.Caller.SendAsync("AdminMsg", "banlist", banliststr, "SERVER");
            }
            else if (type == "clearCache")
            {
                while (ChatContext.recentMsgs.Count != 0)
                {
                    ChatContext.recentMsgs.RemoveAt(0);
                }
            }
            else if (type == "reloadConfig")
            {
                StreamReader tomlreader = File.OpenText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ChatConfig.config_file));
                ChatConfig.configTable = TOML.Parse(tomlreader);
            }
            else if (type == "refreshAllClients")
            {
                await Clients.All.SendAsync("ServerMsg", "reload", "", "SERVER");
            }
            else if (type == "changeMotd")
            {
                ChatConfig.configTable["basic"]["motd"] = message;
            }
            else if (type == "pauseChat")
            {
                ChatContext.paused = !ChatContext.paused;
                Util.Print("[AD] " + uid + " set pause to " + ChatContext.paused.ToString());
            }
            else if (type == "stopChat")
            {
                Util.Print("[AD] " + uid + " stopped EZchat @ " + DateTime.Now.ToString("MM/dd/yyyy hh:mm tt"));
                Environment.Exit(0);
            }
        }

        // manage total connected clients

        public override Task OnConnectedAsync()
        {
            ChatContext.ConnectedIds.Add(Context.ConnectionId);
            Util.VerboseConsole("total connected users: " + ChatContext.ConnectedIds.Count);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            ChatContext.ConnectedIds.Remove(Context.ConnectionId);

            foreach (msg i in ChatContext.contextedUsers)
            {
                if (i.uid == Context.Items["uid"].ToString())
                {
                    ChatContext.contextedUsers.Remove(i);
                    break;
                }
            }

            string clientListMsg = ChatContext.ConnectedIds.Count.ToString();
            // ¶
            foreach (msg i in ChatContext.contextedUsers)
            {
                string v = " " + i.uid + "¶" + i.user;
                clientListMsg = clientListMsg + v;
            }
            Clients.All.SendAsync("ServerMsg", "clientList", clientListMsg, "SERVER");

            Util.VerboseConsole("total connected users: " + ChatContext.ConnectedIds.Count);
            return base.OnDisconnectedAsync(exception);
        }
    }

    public class msg
    {
        public string user { get; set; }
        public string message { get; set; }
        public string uid { get; set; }
    }

    /// <summary>
    /// A state/context class for chat operation
    /// </summary>
    public class ChatContext
    {
        public static List<msg> recentMsgs = new List<msg>();
        public static HashSet<string> ConnectedIds = new HashSet<string>();
        public static List<msg> contextedUsers = new List<msg>();
        public static bool paused = false;
    }
}
