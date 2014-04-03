import sys,os,xmpp,time,json,re
from systemd import journal

done = False

#journal.send('hosts.py: processing vkxmpp pending hosts')

if len(sys.argv) < 2:
    sys.exit(0)

hosts_to_add = []

def doJSON(f="/dev/null",t="r",d=[]):
  data = ""
  json_data = open(f,t)
  if t=="r":
    data = json.load(json_data)
  if t=="w":
    json.dump(d,json_data)
  json_data.close()
  return data

pending_hosts_file = sys.argv[1]
hosts_file = sys.argv[2]

if os.path.getsize(pending_hosts_file) == 2:
  exit(0)

pending_hosts = doJSON(pending_hosts_file)

jc = xmpp.Client("anon.anakee.ru",debug=[])

jc.connect()
jc.auth(None,None)

for host in pending_hosts:
  ver_iq = xmpp.Protocol('iq', typ='get', to=host, payload = [xmpp.Node('query',{'xmlns':xmpp.NS_VERSION},[])])
  try:
    ver_stz = jc.SendAndWaitForResponse(ver_iq,2)
  except IOError, e:
    ver_stz = False
  if ver_stz:
    if ver_stz.getTag("query"):
      ver = ver_stz.getTag("query").getTagData("version")
      if ver and re.match("^#[0-9^-]*-[a-z0-9]*$",ver):
        hosts_to_add.append(str(ver_stz.getAttr("from")))
        journal.send("hosts.py: new host @"+str(ver_stz.getAttr("from")))

hosts = doJSON(hosts_file)

doJSON(hosts_file,"w",list(set(hosts+hosts_to_add)))
doJSON(pending_hosts_file,"w")

