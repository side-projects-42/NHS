var socket = io.connect(),
winx=window.innerWidth,
winy=window.innerHeight;
var w = $('#viewPort').width();
var h = $('#viewPort').height();
var vp =  $('#viewPort');
var vpleft = parseInt(vp.css("left"));
var vptop = parseInt(vp.css("top"));
var cx = (winx-w)/2;
var cy = (winy-h)/2;
var rx = w/winx;
var ry = h/(winy)
 socket.on('connect', function () {
   console.log('connection made')
 });
function toggleValue(getter){
	if (!getter.get){
		getter.get = true;
		return
	}
	if (getter.get){
		getter.get = !getter.get
	}
}
var game = {
	socket:null,
	mouse_coordinates:[0,0],
	gameId:0,//your game
	beatCbs:[],
	clientIntervalTime:50,
	heartBeatInterval:null,
	viewPort:null,
	playerId:null,

	gameState:{
		units:[]
	},
	init : function(){
		var z = this;
		$(window).mousemove(function(e){
			z.mouse_coordinates = [e.pageX, e.pageY]
		});
		this.event_emitter(); 
		this.paper();
		//
		this.setGameId();
		//after set gameId
		this.socketInit();
		this.draw.yellowBase(300,1290,200,200);
		this.draw.purpleBase(3700,1290,200,200);
		this.draw.myEnergyMeter(88); // param  = % energy
		this.fluxCapacity.set(80); // probably not a percentage of energy, but a unit value
	},
	cmds:{
		click: "fire",
		
	},
	my_energy: 88, // it is 5:17 am after all
	fluxCapacity:{get:0, set : function(x){var y = x; if (x > 100){y = 100}; if (x < 0){y = 0}; game.draw.myFluxCapacitor(y); this.get = y}},
	new_unit: function(type, _id, x, y){

		if (type = 1){ //type one = saucer
			var _id = 123; 
			game[_id] = paper.set();
			  game[_id].push(
					paper.circle(xy, y, 20).attr({"fill":"purple","stroke":"yellow","stroke-width":3})
				)
		}
		/*
		if (type = 2){
			
		}
		if (type = 3){
			
		}
		*/
		// draw new object
	},
	
	destroy_unit: function(_id){
		// destroy unit
		// removed from  unit object from game 
	},
	setGameId:function(){
		var p = window.location.pathname;
		if(p.indexOf('/game/') == 0) {
			var id = p.split('/').pop();
			if(id && /^\d+$/.test(id)) {
				this.gameId = id;
			}
		}
	},
	scout: {
		get: 0,
		set: function(){
		if (!this.get){$('#console').unbind('mousemove');return}
		var w = $('#viewPort').width();
		var h = $('#viewPort').height();
		var vp =  $('#viewPort');
		var vpleft = parseInt(vp.css("left"));
		var vptop = parseInt(vp.css("top"));
		var cx = (winx-w)/2;
		var cy = (winy-h)/2;
		var rx = w/winx;
		var ry = h/(winy)
		$("#console").mousemove(function(e){
			var x = e.screenX;
			var y = e.screenY;
			var xzoom = -(x/winx)*(w)+w/3;
			var yzoom = -(y/winy)*(h)+h/3;
			console.log(w);
				vp.css({
				left : xzoom, top: yzoom});
		});
	}},
	event_emitter: function(){
		var z = this,
		keys = [65,68,83,87,69,81,32,70,48,49,50,51,52,53,54,55,56,57]
		, kup = function(e){
					console.log(e.keyCode);
			e.preventDefault()
			if(e.keyCode == 68){toggleValue(game.scout);game.scout.set()}
			if (!_.include(keys, e.keyCode)){return false}
			if (e.keyCode > 48 && e.keyCode < 58){game.fluxCapacity.set((e.keyCode-48)*10);return}
			if (e.keyCode == 48){game.fluxCapacity.set(100);return}
			var code = e.which||e.keyCode;
			z.socket.emit("event", "key", code, z.mouse_coordinates);
		}
		, click_fn = function(e){
			console.log(e)
			console.log(parseInt(vp.css("left")));
			z.socket.emit("event", "click", z.cmds.click, z.mouse_coordinates);
			$('#viewPort').css({left: parseInt(vp.css("left"))+(z.mouse_coordinates[0]-winx/2), top: parseInt(vp.css("top"))+(z.mouse_coordinates[1]-winy/2)})
		}
		, getDelta = function(e){
			var evt=window.event || e;
			var delta=evt.detail? evt.detail*(-120) : evt.wheelDelta
			$('#msg').empty().append("DELTA = "+delta);
			if (delta > 0){
				game.fluxCapacity.set(game.fluxCapacity.get+5);
			}
			if (delta < 0){
				game.fluxCapacity.set(game.fluxCapacity.get-5);
			}
		}
		$(document).bind('keyup',kup);
		$(window).bind('click',click_fn);
		var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel"
		document.addEventListener(mousewheelevt, getDelta, false)
	},
	socketInit:function(){
		var z = this
		,socket  = this.socket = io.connect();

		socket.on('connect', function () {
			console.log('connection made',arguments);
			var iosid = (z.parseCookies()||{})['io.sid']||false;
			z.socket.emit("join",{game:z.gameId,sid:iosid});
			this.playerId = iosid;
		});

		//server reports game state here
		socket.on('sync', function(state){
			z.gameState = state;
			z.paper();

			z.loading(false);
			z.setBeats();
			z.checkHeartBeat();
		});

		socket.on('error', function(data){
			console.log('error event emitted ',data).
			z.flashMessage(data.msg);
		});

		socket.on('joined',function(data){
			console.log('joined event emitted ',data);
			z.flashMessage(data.id+' '+(data.reconnected?'reconnected to':'joined')+' the game!');
			console.log('connection made');
		});

		socket.on('event', function(a,b,c,r){
			$('#msg').empty().append("event type: "+a+"<br>Command: "+b+"<br>At Coordinate: "+c[0]+","+c[1]);
			if (b = 32){
				z.draw.energyWave(c[0],c[1],r)
			}
			if (a == "click"){
				z.draw.drawUnit(c[0],c[1])
			}
		});
	},
	paper:function(){
		//RAPHAEL INIT
		Raphael.fn.flag = function (x, y, r, hue) {
		            hue = hue || 0;
		            return this.set(
		                this.ellipse(x - r / 2, y + r - r / 2, r, r).attr({fill: "rhsb(" + hue + ", 1, .25)-hsb(" + hue + ", 1, .25)", stroke: "none", opacity: 0}),
		                this.ellipse(x, y, r, r).attr({fill: "rhsb(" + hue + ", 1, .75)-hsb(" + hue + ", .5, .25)", stroke: "none"}),
		                this.ellipse(x, y, r, r).attr({stroke: "none", fill: "r#ccc-#ccc", opacity: 0})
		            );
		        };
		this.draw.paper = Raphael('viewPort', 4000, 2500);
		this.draw.graph();
		this.draw.commander = Raphael('console',winx,winy );
		
	},
	draw:{
		commander:null,
		paper:null,
		winx:window.innerWidth,
		winy:window.innerHeight,
		graph:function(){
			var paper = this.paper
			,winy = this.winy
			,winx = this.winx
			,alphaGraph = {}
			var w = $('#viewPort').width();
			var h = $('#viewPort').height();
			var vp =  $('#viewPort');
			var cx = (winx-w)/2;
			var cy = (winy-h)/2;
			var rx = w/winx;
			var ry = h/(winy)

			
			for (i=0; i < w; i+=10){
				paper.path("M"+i+" 0L"+i+" "+h).attr({"stroke":"rgba(252,244,6,.1)"});
			}
			for (i=0; i < w; i+=10){
				paper.path("M0 "+i+"L"+w+" "+i).attr({"stroke":"rgba(252,244,6,.1)"});
			}
			for (i=0; i < w; i+=50){
					//paper.circle(2500,1000,i).attr({"fill":"transparent", stroke:"rgba(252,244,6,.1)", "stroke-width":1});
				paper.path("M"+i+" 0L"+i+" "+h).attr({"stroke":"rgba(252,244,6,.1)"});
			}
			for (i=0; i < w; i+=50){
				paper.path("M0 "+i+"L"+w+" "+i).attr({"stroke":"rgba(252,244,6,.1)"});
			}
			$('#viewPort').css({left: cx+'px', top: cy+'px'})
			//paper.circle(2500,1000,2400).attr({"fill":"transparent", "stroke-width":10});
			//vp.css({left:-1500,top:cy});			
		},
		energyWave:function(x,y,r,_id){
			var _id = 123
			,mb = this.linear(0,this.winy,x,y)
			,z = (mb[0]*5000) + mb[1];
			
			game[_id] = this.paper.circle(0,this.winy,r).attr({"stroke-width":0,"fill":"rrgba(138,211,242,1)-rgba(68,68,68,0)"}).animate({"cx":5000,"cy":z,"r":r*100,"opcaity":0,"fill-opacity":0},747)
		},
		drawUnit:function (x,y,_id,team, shield,eRad,isFire){ //eRad is charge radius 
			if (team == "purple"){ var tcolor = "purple", fcolor =.66}
			if (team == "yellow"){var tcolor = "rgba(47,208,63,.2):80", fcolor =.25}
			// for bullets, eRad is an interpolated radius, based on energy in the buller, used to set the radius, which should increase every step by a factor of < 1, or ? 
			if(isFire){paper.circle(x,y,eRad).attr({"fill":"rrgba(255,255,255,.1):20-"+tcolor,"stroke-width":0,"fill-opacity":.5});return}
		game[_id] = paper.set();
		if (eRad){game[_id].push(paper.circle(x-3,y+5,40+1*eRad).attr({"fill":"rrgba(255,255,255,.1):20-"+tcolor,"stroke-width":0,"fill-opacity":1}))}
			game[_id].push(
				paper.circle(x-3,y+5,40).attr({"fill":"rrgba(0,0,0,.5):50-rgba(0,0,0,.1)","stroke-width":0}),
				paper.circle(x, y, 40).attr({"fill":"rrgba(240,240,240,1):10-"+tcolor+":75-rgba(165,182,157,1)","stroke":"#333","stroke-width":1,}),
				paper.path("M"+(x+28)+" "+(y+28)+"L"+(x-28)+" "+(y-28)+" M"+(x-28)+" "+(y+28)+"L"+(x+28)+" "+(y-28)).attr({"stroke":"rgba(105,161,109,.5)", "stroke-width":2})
				//paper.circle(x,y,14).attr({"fill":"r(.45,.45)rgba(112,23,18,.67):5-rgba(162,47,171,1):80-rgba(230,230,240,1)", "stroke-width":0})
			);
			if (shield){game[_id].push(paper.circle(x,y,40+1*shield).attr({"fill":"rrgba(255,255,255,.1):20-"+tcolor,"stroke-width":0,"fill-opacity":.1}))}
			e[_id].push(paper.flag(x,y,10,fcolor))
			if (eRad) {setInterval(function(){e[_id].rotate(15)},30);} // spinning is the new tower
		},
		yellowBase : function(x,y,h,w){
				for (i=0;i<8;++i){
				 game.yellowBase = this.paper.rect(x+(10*i),y+(10*i),h-(20*i),w-(20*i)).attr({"stroke":"rgba(47,208,63,1)", fill: "#444","stroke.width":"3px"})
				}
				game.draw.yellowFlag(x,y,h,w);
		},
		yellowFlag: function(x,y,h,w){
			game.yellowFlag = this.paper.flag(x+100,y+100,14,.25)
		},
		purpleBase : function(x,y,h,w){
				for (i=0;i<8;++i){
				game.purpleBase = this.paper.rect(x+(10*i),y+(10*i),h-(20*i),w-(20*i)).attr({"stroke":"purple", fill: "#444","stroke.width":"3px"})
				}
				game.draw.purpleFlag(x,y,h,w);
		},
		purpleFlag: function (x,y,h,w){game.purpleFlag = this.paper.flag(x+100,y+100,14,.66);},
		myEnergyMeter: function(x){
			var color;
			if (x < 25) color = "red";
			if (x > 49 && x < 75) color = "orange";
			if (x > 24 && x < 50) color = "yellow";
			if (x > 74) color = "green";
			this.commander.rect(10,10,30,700,5).attr({"stroke":"#f9f9f9", "stroke-width":3, "fill":"90-"+color+":"+x+"-#111:"+x});
		},
		myFluxCapacitor: function(x){
			color: "rgba(6,252,30,1)"
			var flux = this.commander.set();
			flux.push(
				this.commander.rect(55,10,300,30,15).attr({"stroke":"#f9f9f9", "stroke-width":3, "fill":"360-rgba(30,245,245,.68):"+x+"-#111:"+x}),
				this.commander.text(180,25,"FLUX CAPACITY: SCROLL WHEEL OR NUM KEYS").attr({stroke:"#111"})
			);
		},
		linear:function (x, y,x1,y1){
			var m = (y1 - y)/x1 -x;
			var b = y - (m*x);
			return [m,b]
		}
	}
}
$(function(){
	game.init();
});
