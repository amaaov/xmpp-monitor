xmpp_connect = function () {
	window.xmppc = new Strophe.Connection(window.xmpp_bosh ? window.xmpp_bosh : "/bosh");
	window.xmppc.connect((window.xmpp_srv ? window.xmpp_srv : "anon.anakee.ru"), null, handle_connection_status, 50);
	log('Connecting to XMPP server');
}

log = function(message,type){
	var timestamp = (new Date()).format("[HH:MM:ss]");
	$("#status").prepend('<div class="message'+(type?' '+type:'')+'"><span class="timestamp">'+timestamp+'</span>&nbsp;'
						+'<span class="text">'+message+'</span></div>');
}

handle_connection_status = function(status, err){
	var xmppc = window.xmppc;
	
	if(err) log(err, 'error');
	
	if(status == Strophe.Status.CONNECTED)
	{
		var _dis = function () {
			if(!window.xmppc) return;
			window.xmppc.disconnect();
			window.xmppc = null;
		};
		$(window).unload(_dis);
		window.onbeforeunload = _dis;
	}
}
