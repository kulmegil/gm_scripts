// ==UserScript==
// @name        Wykop.pl - odgrzewane hity
// @namespace   odgrzewane_hity@wykop.pl
// @description Dodaje nowe możliwości filtrowania Hitów - z ostatnich 48h lub wszystkie, a także Gorących wpisów - z ostatnich 1h, 2h, 3h, 48h, 7dni i 30 dni.
// @icon        https://github.com/kulmegil/gm_scripts/raw/master/Wykop.pl_-_odgrzewane_hityicon.png
// @updateURL   https://github.com/kulmegil/gm_scripts/raw/master/Wykop.pl_-_odgrzewane_hity/wykop.pl_-_odgrzewane_hity.meta.js
// @include     http://www.wykop.pl/*
// @version     1.0.0
// @grant       none
// ==/UserScript==

;(function ( $, window, document, undefined ) {
	var path = location.pathname.split('/').slice(1),
		page = (page = path.indexOf('strona')) === -1 ? 1 : parseInt(path[page + 1]),
		navEl = $('#site .nav'),
		navLeftEl = $('#site .nav > ul:last-of-type'),
		navRightEl = $('#site .nav > ul:first-of-type'),
		wykopLoaderEl = '<div class="rbl-block space text-center mark-bg dnone" id="paginationLoader" style="display: block;">' +
			'<i class="fa fa-spinner fa-spin"></i> Ładuję kolejną stronę...</div>';


	if (path[0] === 'mikroblog') {
		var last = parseInt(path[path.indexOf('ostatnie') + 1]) || parseInt(navEl.find('ul:first .active').text()) || -1;

		navRightEl.not(':has(a[href*="/mikroblog/hot/ostatnie/12/"])').append(
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/6/"  title="">6h</a></li>' +
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/12/" title="">12h</a></li>' +
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/24/" title="">24h</a></li>');
		navRightEl.find('a[href*="/mikroblog/hot/ostatnie/"]').addClass('red');
		navRightEl.children().has('a[href*="/mikroblog/hot/ostatnie/6/"]').before(
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/1/" title="">1h</a></li>' +
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/2/" title="">2h</a></li>' +
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/3/" title="">3h</a></li>');
		navRightEl.children().has('a[href*="/mikroblog/hot/ostatnie/24/"]').after(
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/48/" title="">48h</a></li>' +
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/168/" title="">7d</a></li>' +
			'<li><a href="http://www.wykop.pl/mikroblog/hot/ostatnie/720/" title="">30d</a></li>');

		// ToDo - hide instead of removing (depending on avail. width)
		navEl.children('.info:contains("Mikroblog :")').addClass('m-hideboard').text('Mirko :');
		navLeftEl.find('a[href*="/mikroblog/wszystkie/"]:contains("wszystkie")').text('wszystkie');
		navLeftEl.find('a[href*="/mikroblog/hot/"]').parent().addClass('dnone');

		// fix nav - selected item
		if (last > 0) {
			navRightEl.find('.active').removeClass('active');
			navRightEl.find('a[href*="/mikroblog/hot/ostatnie/' + last + '/"]').parent().addClass('active');
		}
		
		// ajax load & merge content
		if (last === 48 || last === 168 || last === 720) {
			var url = 'http://www.wykop.pl/szukaj/wpisy/strona/' + page + '/?search[sort]=votes&search[when]=' + 
				(last === 48? 'yesterday' : (last === 168? 'week' : 'month'));
			$.holdReady(true);
			$('#itemsStream.comments-stream').children().remove();
			$('#itemsStream.comments-stream').append(wykopLoaderEl).load(url + ' #itemsStream.comments-stream', function() {
				$.holdReady(false);
			});
		}
	}

	if (path[0] === 'hity') {
		var when = path[1];
		navLeftEl.children().has('a[href*="/hity/dnia/"]').after(
			'<li><a href="http://www.wykop.pl/hity/wczoraj/"><span>wczoraj</span></a></li>');
		navLeftEl.children().has('a[href*="/hity/roku/"]').after(
			'<li><a href="http://www.wykop.pl/hity/wszystkie/"><span>wszystkie</span></a></li>');
		
		if (when === 'wczoraj' || when === 'wszystkie') {
			// fix nav - selected item
			navLeftEl.children('.active').removeClass('active');
			navLeftEl.find('a[href*="/hity/' + when + '/"]').parent().addClass('active');

			// ajax load & merge content
			var url = 'http://www.wykop.pl/szukaj/strona/' + page + '/?search[filter]=links&search[sort]=diggs'
				+'&search[what]=promoted&search[when]=' + (when === 'wczoraj'? 'yesterday' : 'all');
			$.holdReady(true);
			$('#itemsStream.comments-stream').children().remove();
			$('#itemsStream.comments-stream').append(wykopLoaderEl);
			$.get(url, function(data) {
				var doc = $(data);
				doc.find('#itemsStream.comments-stream').replaceAll($('#itemsStream.comments-stream'));
				fixPager(doc, 'http://www.wykop.pl/hity/wczoraj/strona/{$i}/');
				$.holdReady(false);
			}, 'html');
		}
    }

	function fixPager(pagerEl, newUrl) {
		pagerEl = $(pagerEl).find('p > a.button[href*="/strona/2/"]').first().parent();
		var page = parseInt(pagerEl.children('a.selected').text());

		// fix href's
		pagerEl.children('a:contains("poprz")').attr('href', page===2? 
			newUrl.replace('/strona/{$i}', '') : newUrl.replace('{$i}', page - 1));
		pagerEl.children('a:contains("nast")').attr('href', newUrl.replace('{$i}', page + 1));
		pagerEl.children('a').not('a:contains("poprz"), a:contains("nast")').each(function(i, el) {
			$(el).attr('href', i===0? newUrl.replace('/strona/{$i}', '') : newUrl.replace('{$i}', i+1));
		});
		//replace local pager
		$('p > a.button[href*="/strona/2/"]').first().parent().replaceWith(pagerEl);
		console.debug(page, pagerEl);
		return pagerEl;
	}
})( jQuery, window, document );