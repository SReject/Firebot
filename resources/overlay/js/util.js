// Global
notificationShown = false;

// Handle notifications
function notification(status, text){
	var divStatus = $('.notification').is(':visible');

	// Check if we need to show notification or not.
	if(divStatus === false && status === "open" && notificationShown === false){
		// Show the notification
		notificationShown = true;
		$('body').prepend('<div class="notification" style="display:none"><p>'+text+'</p></div>');
		$('.notification').fadeIn('fast');
		setTimeout(function(){ 
			$(".notification p").text("I'll keep trying in the background...");
			setTimeout(function(){ 
				$(".notification").fadeOut(300, function() { $(this).remove(); });
			}, 5000);
		}, 30000);
	} else if (status === "close"){
		// Fade out and remove notification
		notificationShown = false;
		$(".notification").fadeOut(300, function() { $(this).remove(); });
	}
}

$.fn.extend({
    animateCss: function (animationName, animationDuration, animationDelay, animationRepeat, callback, data) {
		if(callback == null || !(callback instanceof Function)) {
			callback = () => {};
		}
		var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		if(animationName !== "none") {
			if(animationDuration) {
				$(this).css("animation-duration", animationDuration);
			}

			if(animationDelay) {
				$(this).css("animation-delay", animationDelay);
			}

			if(animationRepeat) {
				$(this).css("animation-iteration-count", animationRepeat);
			}

			this.addClass('animated ' + animationName).one(animationEnd, function() {
				if(animationDuration) {
					$(this).css("animation-duration", "");
				}

				if(animationDelay) {
					$(this).css("animation-delay", "");
				}
	
				$(this).removeClass('animated ' + animationName);
				callback(data);
			});
		} else { 
			callback(data);
		}	
        return this;
    }
});

function showTimedAnimatedElement(
	elementClass, 
	enterAnimation, 
	enterDuration,
	inbetweenAnimation,
	inbetweenDelay,
	inbetweenDuration, 
	inbetweenRepeat,
	exitAnimation, 
	exitDuration, 
	duration, 
	tokenArg) {
	enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
	exitAnimation = exitAnimation ? exitAnimation : "fadeOut";
	inbetweenAnimation = inbetweenAnimation ? inbetweenAnimation : "none";
	var id = `${elementClass}`;
	$(id).find(".inner-position").animateCss(enterAnimation, enterDuration, null, null, (data) => {
		
		$(data.id).find(".inner-position").animateCss(data.inbetweenAnimation, data.inbetweenDuration, data.inbetweenDelay, data.inbetweenRepeat);

		setTimeout(function(){ 
			if(data.inbetweenAnimation) {
				$(data.id).find(".inner-position").css("animation-duration", "");
				$(data.id).find(".inner-position").css("animation-delay", "");
				$(data.id).find(".inner-position").css("animation-iteration-count", "");
				$(this).find(".inner-position").removeClass('animated ' + data.inbetweenAnimation);
			}
			$(data.id).find(".inner-position").animateCss(data.exitAnimation, data.exitDuration, null, null, (data1) => {
				$(data1.id).remove();
			}, data);
		}, (duration === 0 || duration != null) ? duration : 5000);
	}, { 
		token: tokenArg, 
		id: id, 
		exitAnimation: exitAnimation, 
		exitDuration: exitDuration,
		inbetweenAnimation: inbetweenAnimation,
		inbetweenDuration: inbetweenDuration,
		inbetweenDelay: inbetweenDelay,
		inbetweenRepeat: inbetweenRepeat
	});
}

function getPositionWrappedHTML(uniqueId, positionData, html) {
    
    // when using 'Custom' position, the user has defined exact top/left pixels
	let styles = "";
	if (positionData.position === "Custom") {
		styles = getStylesForCustomCoords(positionData.customCoords);
	}

	//normalize position
	let position = positionData.position ? 
		positionData.position.replace(/\s/, "-").toLowerCase() : "middle";

	let positionWrappedHtml = `
		<div id="${uniqueId}" class="position-wrapper ${position}">
			<div class="inner-position" style="${styles}">
				${html}
			</div>		
		</div>
    `;
    
    return positionWrappedHtml;
}

function showElement(
	effectHTML,
	positionData,
	animationData
){
	let uniqueId = new Date().getTime();

	let positionWrappedHtml = getPositionWrappedHTML(uniqueId, positionData, effectHTML);

	$('.wrapper').append(positionWrappedHtml);

	showTimedAnimatedElement(
		"#" + uniqueId, 
		animationData.enterAnimation, 
		animationData.enterDuration,
		animationData.inbetweenAnimation,
		animationData.inbetweenDelay,
		animationData.inbetweenDuration, 
		animationData.inbetweenRepeat,
		animationData.exitAnimation, 
		animationData.exitDuration, 
		animationData.totalDuration, 
		animationData.resourceToken
	);
}

function getStylesForCustomCoords(customCoords) {
	
	var style = "position:absolute;margin:auto;"
	if(customCoords.top !== null) {
		style = style + "top:" + customCoords.top.toString() + "px;"
	}
	if(customCoords.bottom !== null) {
		style = style + "bottom:" + customCoords.bottom.toString() + "px;"
	}
	if(customCoords.left !== null) {
		style = style + "left:" + customCoords.left.toString() + "px;"
	}
	if(customCoords.right !== null) {
		style = style + "right:" + customCoords.right.toString() + "px;"
	}
	
	return style;
}

/* Polyfill EventEmitter. */
var EventEmitter = function () {
    this.events = {};
};

EventEmitter.prototype.on = function (event, listener) {
    if (typeof this.events[event] !== 'object') {
        this.events[event] = [];
    }

    this.events[event].push(listener);
};

EventEmitter.prototype.removeListener = function (event, listener) {
    var idx;

    if (typeof this.events[event] === 'object') {
        idx = this.events[event].indexOf(listener);

        if (idx > -1) {
            this.events[event].splice(idx, 1);
        }
    }
};

EventEmitter.prototype.emit = function (event) {
    var i, listeners, length, args = [].slice.call(arguments, 1);

    if (typeof this.events[event] === 'object') {
        listeners = this.events[event].slice();
        length = listeners.length;

        for (i = 0; i < length; i++) {
            listeners[i].apply(this, args);
        }
    }
};

EventEmitter.prototype.once = function (event, listener) {
    this.on(event, function g () {
        this.removeListener(event, g);
        listener.apply(this, arguments);
    });
};