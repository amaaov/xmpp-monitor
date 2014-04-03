
function create_muc_handler(conn, jid, nick, options)
{
	if(typeof(options) == "undefined" || !options)
		options = {};
	
	var muc = { conn: conn, jid: jid, nick: nick, options: options,
		send_message: function (text, payload) {
			var msg = $msg({to: jid, type: "groupchat"}).c("body").t(text).up();
			if (payload)
				msg.cnode(payload.tree());
			conn.send(msg.tree());
		},
		occupants: {} };
	
	if(options.handle_join)
		conn.addHandler(new_join_handler(muc, options.handle_join), null, "presence", null, null, null);
		
	if(options.handle_leave)
		conn.addHandler(new_leave_handler(muc, options.handle_leave), null, "presence", null, null, null);
		
	if(options.handle_status)
	{
		// This one is called internally, so we need to store a reference to it
		muc.status_handler = new_status_handler(muc, options.handle_status);
		conn.addHandler(muc.status_handler, null, "presence", null, null, null);
	}
		
	if(options.handle_history)
		conn.addHandler(new_history_handler(muc, options.handle_history), null, "message", "groupchat", null, null);

	if(options.handle_message)
		conn.addHandler(new_message_handler(muc, options.handle_message), null, "message", "groupchat", null, null);
	
	if(options.handle_topic)
		conn.addHandler(new_topic_handler(muc, options.handle_topic), null, "message", "groupchat", null, null);

	if(options.handle_error) {
		conn.addHandler(new_error_handler(muc, options.handle_error), null, "presence", "error", null, null);
		conn.addHandler(new_error_handler(muc, options.handle_error), null, "message", "error", null, null);
	}
	
	if(options.handle_typing)
		conn.addHandler(new_typing_handler(muc, options.handle_typing), null, "message", "groupchat", null, null);
	
	muc.set_status = function (status, text)
	{
		var pres = $pres({to: jid+'/'+nick});
		if(status && status != "online")
			pres.c("show").t(status).up();
		if(text)
			pres.c("status").t(text).up();
		conn.send(pres.tree());
	};
	
	(function() {
		var current;
		muc.send_chatstate = function (type)
		{
			if (current === type)
				return;
			var msg = $msg({to: jid, type: "groupchat", id: 'state'});
			if(!type)
				type = "active";
			msg.c(type, {xmlns: "http://jabber.org/protocol/chatstates"}).up();
			conn.send(msg.tree());
			current = type;
		};
	})();
 
 	muc.set_status("online");
	muc.send_chatstate("active");
	
	return muc;
}

function new_join_handler(muc, callback)
{
	return function (stanza)
	{
		var nick = Strophe.getResourceFromJid(stanza.getAttribute("from"));
		if(stanza.getAttribute("type") != "unavailable" && stanza.getAttribute("type") != "error"
		     && Strophe.getBareJidFromJid(stanza.getAttribute("from")) == muc.jid)
			if(!muc.occupants[nick])
			{
				var text = stanza.getElementsByTagName("status")[0];
				if(text) text = Strophe.getText(text);
				muc.occupants[nick] = {};
				callback(stanza, muc, nick, text);
				if(muc.status_handler)
				{
					muc.status_handler(stanza);
				}
			}
		return true;
	};
}

function new_leave_handler(muc, callback)
{
	return function (stanza)
	{
		var nick = Strophe.getResourceFromJid(stanza.getAttribute("from"));
		if(stanza.getAttribute("type") == "unavailable" && Strophe.getBareJidFromJid(stanza.getAttribute("from")) == muc.jid)
			if(muc.occupants[nick])
			{
				var text = stanza.getElementsByTagName("status")[0];
				if(text) text = Strophe.getText(text);
				callback(stanza, muc, nick, text);
				muc.occupants[nick] = null;
			}
		return true;
	};
}

function new_message_handler(muc, callback)
{
	return function (stanza)
	{
		if(stanza.getAttribute("type") == "groupchat" && Strophe.getBareJidFromJid(stanza.getAttribute("from")) == muc.jid)
		{
			var body = stanza.getElementsByTagName("body");
			if(body.length > 0 && stanza.getElementsByTagName("delay").length == 0)
			{
				var nick = Strophe.getResourceFromJid(stanza.getAttribute("from"));
				if(nick && muc.occupants[nick])
					muc.occupants[nick].chatstate = null;
				callback(stanza, muc, nick, Strophe.getText(body[0]));
			}
		}
		return true;
	};
}

function new_typing_handler(muc, callback)
{
	return function (stanza)
	{
		var nick = Strophe.getResourceFromJid(stanza.getAttribute("from"));
		if(stanza.getAttribute("type") == "groupchat" && Strophe.getBareJidFromJid(stanza.getAttribute("from")) == muc.jid
		   && nick != muc.nick)
		{
			var state = null;
			Strophe.forEachChild(stanza, null, function (child)
				{
					if(child.getAttribute("xmlns") == "http://jabber.org/protocol/chatstates") {
						state = child.nodeName;
						return;
					}
				});
			if(state && muc.occupants[nick])
			{
				if(state == "active")
					muc.occupants[nick].chatstate = null;
				else
					muc.occupants[nick].chatstate = state;
				callback(stanza, muc, nick, state);
			}
		}
		return true;
	};
}

function new_topic_handler(muc, callback)
{
	return function (stanza)
	{
		if(stanza.getAttribute("type") == "groupchat" && Strophe.getBareJidFromJid(stanza.getAttribute("from")) == muc.jid)
		{
			var body = stanza.getElementsByTagName("body");
			var subject = stanza.getElementsByTagName("subject");
			if(body.length == 0 && subject.length > 0)
				callback(stanza, muc, Strophe.getResourceFromJid(stanza.getAttribute("from")), Strophe.getText(subject[0]));
		}
		return true;
	};
}

function new_history_handler(muc, callback)
{
	return function (stanza)
	{
		if(stanza.getAttribute("type") == "groupchat" && Strophe.getBareJidFromJid(stanza.getAttribute("from")) == muc.jid)
		{
			var body = stanza.getElementsByTagName("body");
			if(body.length > 0 && stanza.getElementsByTagName("delay").length > 0)
				callback(stanza, muc, Strophe.getResourceFromJid(stanza.getAttribute("from")), Strophe.getText(body[0]));
		}
		return true;
	};
}

function new_error_handler(muc, callback)
{
	return function (stanza)
	{
		if(Strophe.getBareJidFromJid(stanza.getAttribute("from")) == muc.jid)
		{
			var e = stanza.getElementsByTagName("error");
			if(e.length > 0)
			{
				var err = null;
				var text = null;
				Strophe.forEachChild(e[0], null, function (child)
					{
						if(child.nodeName != "text" && child.getAttribute("xmlns") == "urn:ietf:params:xml:ns:xmpp-stanzas")
							err = child.nodeName;
						else if(child.nodeName == "text")
							text = Strophe.getText(child);
					});
				callback(stanza, muc, err, text);
			}
		}
		return true;
	};
}

function new_status_handler(muc, callback)
{
	return function (stanza)
        {
                var nick = Strophe.getResourceFromJid(stanza.getAttribute("from"));
                if(stanza.getAttribute("type") != "unavailable" && stanza.getAttribute("type") != "error"
                     && Strophe.getBareJidFromJid(stanza.getAttribute("from")) == muc.jid)
                        if(muc.occupants[nick])
                        {
                                var status = stanza.getElementsByTagName("show")[0];
                                var text = stanza.getElementsByTagName("status")[0];
                                if(!status)
                                	status = "online";
                                else
                                	status = Strophe.getText(status);
				if(text) text = Strophe.getText(text);
				if(status != muc.occupants[nick].status ||
				   text != muc.occupants[nick].status_text)
				{
					muc.occupants[nick].status = status;
					muc.occupants[nick].status_text = text;
                                	callback(stanza, muc, nick, status, text);
                                }
                        }
                return true;
        };
}
