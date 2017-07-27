'use strict';

// https://greasyfork.org/en/scripts/23329-disable-youtube-60-fps-force-30-fps
	
var injected = false;

function test() {
	if (injected)
		return;
	console.log('TEST!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
	mediaFix();
	injected = true;
}

function createNewTypeChecker( originalChecker, debugLogging )
{	

	return function( videoType) {
		console.log( 'Format Query: "' + videoType + '", originalAnswer: "' + originalChecker( videoType ) + '"' );
		return false;
	}
	var debugLogging = true;
			
	return function( videoType) {
		if( videoType === undefined ) { return false; }
		console.log( 'Format Query: "' + videoType + '", originalAnswer: "' + originalChecker( videoType ) + '"' );

		// Block all queries regarding high-framerate support.
		var matches = videoType.match( /framerate=(\d+)/ );
		if( matches && ( matches[1] > 30 ) ) {
			if( debugLogging ) { console.log( 'Blocking High-FPS format: "' + videoType + '"' ); }
			return false;
		}

		// Let the browser answer all other codec queries.
		return originalChecker( videoType );
	};
}

function mediaFix() {
	if( window.MediaSource ) {	
		var originalChecker = window.MediaSource.isTypeSupported.bind( window.MediaSource );
		window.MediaSource.isTypeSupported = createNewTypeChecker( originalChecker, false );
	}
	
	
	
	var removeReloadCountHash = true;
	    if( window.ytplayer ) {
	        if( location.pathname && location.pathname === '/watch' ) {
	            // Start reload counter at one.
	            var nextReloadCount = 1, oldHash = '', newHash = '';

	            // Get the current hash value and reload counter if one exists.
	            if( location.hash && location.hash !== '' && location.hash !== '#' ) {
	                oldHash = location.hash;
	                if( oldHash ) {
	                    if( oldHash.charAt(0) === '#' ) {
	                        oldHash = oldHash.substr(1); // skip the leading # symbol
	                    }
	                    var matches = oldHash.match( /fpsreloads=(\d+)/ );
	                    if( matches ) {
	                        // We found an existing count, so increment to prepare for reload.
	                        nextReloadCount = parseInt( matches[1], 10 );
	                        nextReloadCount++;
	                        oldHash = oldHash.replace( /&?fpsreloads=\d+/, '' );
	                    }
	                }
	            }

	            // We allow a limited amount of reload attempts to try to inject before the YouTube player.
	            // The user can click the "failure" message at the bottom of the video to try again, if they want to.
	            // NOTE: The 2nd "reload attempt" is actually the 3rd load of the page. And if we haven't successfully
	            // injected before the YouTube player in 3 load attempts, then we have almost no chance of doing it
	            // even with further reloads (there's only about a 10% chance that it would work within 9 loads in such
	            // an incredibly bugged browser tab). Most proper tabs work within 1-2, maybe 3 loads. So we abort after 3.
	            // That way, the user has a chance to decide quickly instead of waiting for reloads. Most videos are not high-FPS!
	            if( nextReloadCount <= 2 ) { // 1 load + 2 reloads = 3 attempts total
	                // Determine which new hash to use.
	                if( oldHash !== '' ) {
	                    newHash = oldHash + '&fpsreloads=' + nextReloadCount;
	                } else {
	                    newHash = 'fpsreloads=' + nextReloadCount;
	                }

	                // Tell ourselves that we don't want to remove the reload count from the hash.
	                removeReloadCountHash = false;

	                // Set the hash, which will track the number of page reloads we've attempted.
	                location.hash = newHash;

	                // Reload the current video page (since merely setting the hash is not enough to cause a reload in most browsers).
	                // NOTE: Waiting LONGER (via a timer) before reloading the page does NOT help the user's browser "react faster"
	                // during the next reload (it STILL won't inject the script in time). The ONLY thing we can do is reload the page
	                // repeatedly until we either succeed or give up. Because if we've seen window.ytplayer, it means we were injected
	                // AFTER the codec check and therefore TOO LATE to fix the framerate on the video page. We MUST reload.
	                // ALSO NOTE: In Safari 10 on Mac, it can take anywhere from 2 to 8 reloads in *some* cases (usually 1-3, avg 2), and in very
	                // rare cases it can't be fixed *at all* without closing that tab and opening the video in a new tab or restarting Safari.
	                location.reload();
	            } else {
	                // It's time to give up. The repeatedly failed reloads are enough to know that the user's current browser tab
	                // is totally bugged out and won't recover. So we'll stop trying and will tell the user instead.
	                // This creates a nice, floating, fixed bar at the bottom of the YouTube video page. Most importantly,
	                // the bar is non-blocking (unlike an alert()), which means music playlists won't pause waiting for user input.
	                var errorDiv = document.createElement( 'div' );
	                errorDiv.style.position = 'fixed';
	                errorDiv.style.bottom = 0;
	                errorDiv.style.left = 0;
	                errorDiv.style.width = '100%';
	                errorDiv.style.padding = '10px';
	                errorDiv.style.textAlign = 'center';
	                errorDiv.style.fontSize = '120%';
	                errorDiv.style.fontWeight = 'bold';
	                errorDiv.style.color = '#fff';
	                errorDiv.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
	                errorDiv.style.zIndex = '99999';
	                errorDiv.innerHTML = '<p>Your browser failed to disable 60 FPS playback in this tab. Videos in this tab will play in 60 FPS if available.</p><p style="font-size:80%">You can try again by <a href="#reload" onclick="location.reload();return false" style="color:#fff;text-decoration:underline">reloading</a> the page, using a <a href="#newtab" onclick="var ytplayer=document.getElementById(\'movie_player\');if(ytplayer&&ytplayer.pauseVideo){ytplayer.pauseVideo();};window.open(location.href,\'_blank\');return false" style="color:#fff;text-decoration:underline">new tab</a> or restarting your browser.</p>';
	                document.body.appendChild( errorDiv );
	            }
	        }
	    }
	    if( removeReloadCountHash ) {
	        // We'll remove the "fpsreloads=X" location hash from the location (without causing a page reload) if we're either done injecting,
	        // OR if the injection reloads have failed too many times in a row (due to a bad browser with late extension injection).
	        // This means that people can copy and paste the video link to share it with others without sharing the "fpsreloads=X" value.
	        if( window.history && window.history.replaceState ) {
	            var newUrl = location.href.replace( /(#?)fpsreloads=\d+&?/g, '$1' ).replace( /[#&]+$/, '' );
	            if( location.href != newUrl ) {
	                window.history.replaceState( {}, document.title, newUrl );
	            }
	        }
	    }
	
	
	
}

// 	MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');

