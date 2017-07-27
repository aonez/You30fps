var count = 0;
var injected = false;
var executed = false;

//document.addEventListener("DOMContentLoaded", domReady);

function checkBody() {
	if (document.body && window.safari)
	{
		console.log('body exists');
		console.log('injecting code');
		
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src   = window.safari.extension.baseURI + "force30fps.js";
		document.head.appendChild(script);
		
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.text = "function checkFix() { if (typeof test == 'function') { test(); } else { setTimeout(function(){ checkFix(); }, 10); } } checkFix();";
		//script.text = "test();";
		document.head.appendChild(script);
		
		injected = true;
	}
	else
		setTimeout(function(){ checkBody(); }, 5);
}
checkBody();



