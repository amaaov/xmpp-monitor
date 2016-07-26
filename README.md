# xmpp-monitor
Strophe HTML Monitor for XMPP services.

Required: XMPP server with Anonymous authentication.

## Installation

* Configure your XMPP server to have anonymous entry and BOSH server, e.g. using server Prosody: https://prosody.im/doc/anonymous_logins and https://prosody.im/doc/setting_up_bosh
* Change path to BOSH in index.html at lines 62-63:
<code>window.xmpp_srv = 'anon.anakee.ru'; window.xmpp_bosh = '/http-bind';</code>
* Check path to json file with hosts in index.html at line 55: <code>window.hosts_path = 'hosts.json';</code>
* In the same place with hosts.php: touch hosts.json hosts_pending.json hosts.log && chmod 777 hosts.json hosts_pending.json hosts.log (if you do care about security, please do it yourself)
* Change anon.anakee.ru to your server address in hosts.py at line 31: <code>jc = xmpp.Client("anon.anakee.ru",debug=[])</code>
* Add cron task for hosts.py, e.g: 0 * * * * python /www/xmppmon/hosts.py /www/xmppmon/hosts_pending.json /www/xmppmon/hosts.json
