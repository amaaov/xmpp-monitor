reTime = function(str){
  if(!str) return'';
	var tt = str.split(' '), ts=0, t;
	for(var i=0;i<tt.length;i+=2){
		if(tt[i]==='') break;
		t = tt[i+1].replace(/day[s]?/,'86400').replace(/hour[s]?/,'3600')
		   .replace(/minute[s]?/,'60').replace(/second[s]?/,'1').split(' ');
		ts += tt[i]*t;
	}
	return ts;
};

reVersion = function(str){
	var e = str.replace(/#/, '').split('-');
	//parseInt(e[1],16);
	return parseInt(e[0],10);
};

jQuery.fn.dataTableExt.oSort['uptime-asc']  = function(a,b){
	var x = reTime(a),
	    y = reTime(b);
	return ((x < y)?-1:((x > y)?1:0));
};

jQuery.fn.dataTableExt.oSort['uptime-desc'] = function(a,b){
	var x = reTime(a),
	    y = reTime(b);
	return ((x < y)?1:((x > y)?-1:0));		
};

jQuery.fn.dataTableExt.oSort['version-asc']  = function(a,b){
	var x = reVersion(a),
	    y = reVersion(b);
	return ((x < y)?-1:((x > y)?1:0));
};

jQuery.fn.dataTableExt.oSort['version-desc'] = function(a,b){
	var x = reVersion(a),
	    y = reVersion(b);
	return ((x < y)?1:((x > y)?-1:0));		
};

