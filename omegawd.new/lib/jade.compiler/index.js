var fs = require('fs')
,		jade = require('jade')
;

module.exports = function(template, locals){

	var t = template
		, l = locals
	;
	
	// this is a hack of a hack
	// l.body is, at first, the desired template 
	// l.body becomes the html rendered with locals l
	// then l is passed as a local to the layout.jade
	// why, or when, is this not appropriate?
	// when you can answer that, then you can change the hack
	
	l.body = fs.readFileSync('../authentication/templates/' + l.body + '.jade', 'utf8')

	jf = jade.compile(l.body);
	
	l.body = jf(l);
	
	jadeTempl = fs.readFileSync('../authentication/templates/' + t + '.jade', 'utf8');

	jadefn = jade.compile(jadeTempl);
	
	return jadefn(l)
	
}

