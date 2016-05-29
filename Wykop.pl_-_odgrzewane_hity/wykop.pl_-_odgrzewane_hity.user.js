// ==UserScript==
// @name        Wykop.pl - odgrzewane hity
// @namespace   odgrzewane_hity@wykop.pl
// @description Dodaje nowe możliwości filtrowania Hitów - z ostatnich 48h lub wszystkie, a także Gorących wpisów - z ostatnich 1h, 2h, 3h, 48h, 7dni i 30 dni.
// @icon        https://github.com/kulmegil/gm_scripts/raw/master/Wykop.pl_-_odgrzewane_hity/icon.png
// @updateURL   https://github.com/kulmegil/gm_scripts/raw/master/Wykop.pl_-_odgrzewane_hity/wykop.pl_-_odgrzewane_hity.meta.js
// @downloadURL https://github.com/kulmegil/gm_scripts/raw/master/Wykop.pl_-_odgrzewane_hity/wykop.pl_-_odgrzewane_hity.user.js
// @include     http://www.wykop.pl/*
// @version     1.1.0
// @run-at      document-start
// @grant       none
// ==/UserScript==

(function (undefined) {
    var $ = window.jQuery, path = location.pathname.split('/').slice(1, -1).map(decodeURIComponent),
        params = {settings: {}};

    function fixIndexNav() {
        if (params.action !== 'index' || params.method !== 'hits' || params.settings.view !== 'list') {return;}
        var navR = $('#site .nav ul:nth-of-type(1)'), navL = $('#site .nav ul:nth-of-type(2)');
            //arch = arch = $('#site .grid-right .sub-menu').first();
        navL.find('a[href="/hity/dnia/"]').parent().after('<li><a href="/hity/"><span>48h</span></a></li>');
        navL.find('a[href*="/hity/roku/"]').parent().after('<li><a href="/hity/roku/6666/"><span>wszystkie</span></a></li>');
        //arch.prepend('<li><a href="/hity/roku/6666/"><i class="fa fa-check-square"></i> wszystkie</a></li>');
        if (!path[1] || path[1] === 'strona') {
            navL.children().removeClass('active');
            navL.find('a[href="/hity/"]').parent().addClass('active');
        } else if (path[1] === 'roku' && path[2] === '6666') {
            navL.children().removeClass('active');
            navL.find('a[href*="/hity/roku/6666/"]').parent().addClass('active');
            //arch.children().removeClass('active');
            //arch.find('a[href="/hity/roku/6666/"]').addClass('active');
        }
    }

    function fixIndexContent() {
        if (params.action !== 'index' || params.method !== 'hits' || params.settings.view !== 'list') {return;}
        if (!path[1] || path[1] === 'strona' || path[1] === 'roku' && path[2] === '6666') {
            var when = path[2] === '6666'? 'all' : 'yesterday', idx = path.indexOf('strona'),
                page = idx >= 0? parseInt(path[idx + 1]) : 0;
            loadSearch({filter: 'links', sort: 'diggs',what: 'promoted', when: when, sort: 'diggs', page: page});
        }
    }

    function fixEntriesNav() {
        if (params.action !== 'entries') {return;}
        var navR = $('#site .nav ul:nth-of-type(1)'), navL = $('#site .nav ul:nth-of-type(2)'), idx,
            stream_h = (idx = path.indexOf('ostatnie')) >= 0? parseInt(path[idx + 1]) : params.settings.stream_h;
        if (!navL[0]) {
            navL = navR;
            navR = $('<ul></ul>').insertBefore('#site .nav ul:nth-of-type(1)');
        }
        navR.html(
            '<li><a href="/mikroblog/hot/ostatnie/1/" title="1h">1h</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/2/" title="1h">2h</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/3/" title="3h">3h</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/6/" class="red" title="6h">6h</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/12/" class="red" title="12h">12h</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/18/" class="red" title="18h">18h</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/24/" class="red" title="24h">24h</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/48/" title="48h">48h</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/168/" title="7d">7d</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/720/" title="30d">30d</a></li>' +
            '<li><a href="/mikroblog/hot/ostatnie/6666/" title="wszystkie">*</a></li>'
        );
        if (params.settings.stream_o === 'hot') {
            navR.find('a[href*="/mikroblog/hot/ostatnie/' + stream_h + '/"]').parent().addClass('active');
        }
        navL.find('a[href="/mikroblog/hot/"]').remove();
        navL.find('a[href="/mikroblog/wszystkie/"] > span').text('wszystkie');
        navL.parent().children('p:first-child').remove();
    }

    function fixEntriesContent() {
        if (params.action !== 'entries' || params.settings.stream_o !== 'hot') {return;}
        var idx, h = (idx = path.indexOf('ostatnie')) >= 0? parseInt(path[idx + 1]) : params.settings.stream_h;
        if (h > 24) {
            var page = (idx = path.indexOf('strona')) >= 0? parseInt(path[idx + 1]) : 0,
                when = h === 48 ? 'yesterday' : h === 168 ? 'week' : h === '720' ? 'month' : 'all';
            loadSearch({filter: 'entries', sort: 'votes', when: when, page: page})
        }
    }

    function loadSearch(opt) {
        var url = ['/szukaj/' + (opt.filter && opt.filter !== 'all' && opt.filter !== 'links'? opt.filter + '/' : '') +
            (opt.page? 'strona/' + opt.page + '/' : '')];
        for (var p in opt) {
            if (p !== 'page' && (p !== 'filter' || opt.filter === 'all' || opt.filter === 'links')) {
                url.push(encodeURIComponent('search['+p+']') + '=' + encodeURIComponent(opt[p]));
            }
        }
        url = url[0] + '?' + url.slice(1).join('&');
        $.holdReady(true);
        $('#itemsStream ~ .pager').remove();
        $('#itemsStream')
            .html('<div id="paginationLoader" class="rbl-block space text-center mark-bg dnone" style="display: block;">' +
                '<i class="fa fa-spinner fa-spin"></i> Ładuję kolejną stronę...</div>')
            .load(url + ' #itemsStream > *,.pager', function() {
                var url = document.location.pathname.replace(/(\/strona\/\d+|\/$)/, '/strona/$i');
                $('#itemsStream > .pager a').each(function(i, el) {$(el).attr('href', url.replace('$i', i + 1));});
                $('#itemsStream > .pager').insertAfter('#itemsStream');
                $.holdReady(false);
        });
    }

    function onWykopReady() {
        'wykop' in window && (params = window.wykop.params);
        'jQuery' in window && ($ = window.jQuery);
        if (params.action === 'index') {
            fixIndexNav();
            fixIndexContent();
        }
        if (params.action === 'entries') {
            fixEntriesNav();
            fixEntriesContent();
        }
    }

    document.readyState === 'loading' || !('wykop' in window)?
        document.addEventListener('DOMContentLoaded', onWykopReady, false) : onWykopReady();

})();