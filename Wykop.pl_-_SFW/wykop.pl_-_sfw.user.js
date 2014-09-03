// ==UserScript==
// @name        Wykop.pl - SFW
// @namespace   SFW@wykop.pl
// @description Przycisk w menu pod awatarem pozwalający ukryć znaleziska oznaczone jako 18+ Automatycznie blokuje tag #nsfw i oraz wybrane tagi użytkownika.
// @include     http://www.wykop.pl/*
// @version     1.1.0
// @icon        https://github.com/kulmegil/gm_scripts/raw/master/Wykop.pl_-_sfw/icon.png
// @updateURL   https://github.com/kulmegil/gm_scripts/raw/master/Wykop.pl_-_sfw/wykop.pl_-_sfw.meta.js
// @downloadURL https://github.com/kulmegil/gm_scripts/raw/master/Wykop.pl_-_sfw/wykop.pl_-_sfw.user.js
// @grant       none
// ==/UserScript==
"use strict"

;(function ($, win, doc, undefined) {
	var NSFW_TAG_PREFIX = 'plus18',
		URL_BASE = doc.location.protocol + '//www.wykop.pl/';

	// needed for wykop.pl/ajax2/ requests
	function wykopDataFilter(data, type) {
		if (type !== 'json' && type !== 'jsonp') {return data;}
		var pfx = 'for(;;);', pos = data.indexOf(pfx);
		if (pos === 0) {return data.substring(pfx.length);}
		return data;
	}

	function get18Plus() {
		return win.wykop.getSetting ? win.wykop.getSetting('plus18', false)	: win.wykop.params.settings.plus18 === true;
	}

	function set18Plus(value) {
		var base = URL_BASE, hash = win.wykop.params.hash, 
			url = base + 'ajax/profile/option/name/plus18/' + (typeof value === 'undefined'? '/' : value? 'value/1/' : 'value/0/') + 
				+ 'hash/' + hash;
		return $.getJSON(url).done(function(data) {
			var nsfw = data.plus18;
			win.wykop.setSetting ?
				win.wykop.setSetting('plus18', nsfw) : win.wykop.params.settings.plus18 = nsfw;
		});
	}

	function getBlacklistItems() {
		var base = doc.location.protocol + '//www.wykop.pl/i/', hash = win.wykop.params.hash, 
			url = base + 'ustawienia/czarne-listy/', dfd = new $.Deferred();
		
		$.get(url).fail(dfd.reject).done(function(data) {
			var ret = {users: [], hashtags: [], domains: []}, match = data.match(/hash\s+:\s+"([^"]+)/);
			data = $($.parseHTML(data));
			//test
			if (!match || data.find('[data-type="users"],[data-type="hashtags"],[data-type="domains"]').length !== 3) {
				return dfd.reject();
			}
			
			win.wykop.params.hash = match[1];
			$.each(data.find('[data-type="users"] a[href*="wykop.pl/i/ludzie/"]'), function(i, el) {
				ret.users.push(el.textContent.trim());
			});
			$.each(data.find('[data-type="hashtags"] a[href*="wykop.pl/i/tag/"]'), function(i, el) {
				ret.hashtags.push(el.textContent.trim().slice(1));
			});
			$.each(data.find('[data-type="domains"] a:first-of-type'), function(i, el) {
				ret.domains.push(el.textContent.trim());
			});
			dfd.resolve(ret);
		});
		return dfd.promise();
	}

	function setBlacklistItem(item, blocked) {
		var url, base = URL_BASE, hash = win.wykop.params.hash;

		if (item.charAt(0) === '#') {
			url = base + 'ajax2/tag/' + (blocked ? 'block/' : 'unblock/') + item.slice(1) + '/hash/' + hash;
		} else if (item.charAt(0) === '@') {
			url = base + 'ajax2/ludzie/' + (blocked ? 'block/' : 'unblock/') + item.slice(1) + '/hash/' + hash;
		} else if (item.indexOf('.') >= 0) {
			url = base + 'ajax2/domain/' + (blocked ? 'block/' : 'unblock/') + item + '/hash/' + hash;
		}
		if (url) {
			return $.ajax({url: url, dataFilter: wykopDataFilter, dataType : 'json'});
		}
		return null;
	}
	
	function block(item) {
		return setBlacklistItem(item, true); 
	}
	
	function unblock(item) {
		return setBlacklistItem(item, false); 
	}
	
	function show18Plus(show) {
		var dfd = new $.Deferred();
		
		getBlacklistItems().fail(dfd.reject).done(function(blacklistItems) {
			set18Plus(show).fail(dfd.reject).done(function() {
				var when = [], show = get18Plus();
				
				when.push( (show? unblock : block)('#nsfw') );
				$.each(blacklistItems.hashtags, function(i, hashtag) {
					if (hashtag.substr(0, NSFW_TAG_PREFIX.length) === NSFW_TAG_PREFIX) {
						hashtag = hashtag.substr(NSFW_TAG_PREFIX.length);
						when.push( (show? unblock : block)('#' + hashtag) );
					}
				});
				
				$.when.apply(this, when).fail(dfd.reject).done(function() {
					dfd.resolve(show);
				});
			});
		});
		return dfd.promise();
	}
	
	function show18Button(loading) {
		var menu = $('#nav .logged-user .dropdown ul'),
		    button = menu.children().has('a[href*="#sfw"], a[href*="#nsfw"]'),
			show = get18Plus();
		
		if (button.length !== 1) {
			var before = menu.children().has('a[href*="/ustawienia/"]');
			button = before.before('<li><a title=""><i class="fa"></i> <span></span></a></li>').prev();
			button.on('click', handle18ButtonClick);
		}

		if (loading) {
			$('span', button).text('wł. tryb ' + (show? 'SFW' : 'NSFW'));
			$('i.fa', button).attr('class', 'fa fa-spinner');
		} else {
			$('span', button).text(show? 'NSFW' : 'SFW');
			$('i.fa', button).attr('class', 'fa fa-' + (show? 'eye' : 'eye-slash'));
		}
		$('a', button).attr('href', show? '#nsfw' : '#sfw');
	}

	function handle18ButtonClick(e) {
		e.preventDefault();
		show18Button(true);
		show18Plus().done(function() {
			doc.location.href = doc.location.href;
		});
	}
	
	show18Button();
	
	// add to wykop API
	if (!win.wykop.block) win.wykop.block = block;
	if (!win.wykop.unblock) win.wykop.unblock = unblock;
	if (!win.wykop.show18Plus) win.wykop.show18Plus = show18Plus;
})(jQuery || $, window, document);