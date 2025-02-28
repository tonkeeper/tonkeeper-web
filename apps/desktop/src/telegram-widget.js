/* eslint-disable */
/* patched version of 'https://telegram.org/js/telegram-widget.js?22' */
/* changes: set iframe display to 'none' on line 342, change origin on 521-522 lines and `widgetsOrigin` on 576 line */

(function(window) {
  (function(window){
    window.__parseFunction = function(__func, __attrs) {
      __attrs = __attrs || [];
      __func = '(function(' + __attrs.join(',') + '){' + __func + '})';
      return window.execScript ? window.execScript(__func) : eval(__func);
    }
  }(window));
  (function(window){

    function addEvent(el, event, handler) {
      var events = event.split(/\s+/);
      for (var i = 0; i < events.length; i++) {
        if (el.addEventListener) {
          el.addEventListener(events[i], handler);
        } else {
          el.attachEvent('on' + events[i], handler);
        }
      }
    }
    function removeEvent(el, event, handler) {
      var events = event.split(/\s+/);
      for (var i = 0; i < events.length; i++) {
        if (el.removeEventListener) {
          el.removeEventListener(events[i], handler);
        } else {
          el.detachEvent('on' + events[i], handler);
        }
      }
    }
    function getCssProperty(el, prop) {
      if (window.getComputedStyle) {
        return window.getComputedStyle(el, '').getPropertyValue(prop) || null;
      } else if (el.currentStyle) {
        return el.currentStyle[prop] || null;
      }
      return null;
    }
    function geById(el_or_id) {
      if (typeof el_or_id == 'string' || el_or_id instanceof String) {
        return document.getElementById(el_or_id);
      } else if (el_or_id instanceof HTMLElement) {
        return el_or_id;
      }
      return null;
    }

    var getWidgetsOrigin = function(default_origin, dev_origin) {
      var link = document.createElement('A'), origin;
      link.href = document.currentScript && document.currentScript.src || default_origin;
      origin = link.origin || link.protocol + '//' + link.hostname;
      if (origin == 'https://telegram.org') {
        origin = default_origin;
      } else if (origin == 'https://telegram-js.azureedge.net' || origin == 'https://tg.dev') {
        origin = dev_origin;
      }
      return origin;
    };

    var getPageCanonical = function() {
      var a = document.createElement('A'), link, href;
      if (document.querySelector) {
        link = document.querySelector('link[rel="canonical"]');
        if (link && (href = link.getAttribute('href'))) {
          a.href = href;
          return a.href;
        }
      } else {
        var links = document.getElementsByTagName('LINK');
        for (var i = 0; i < links.length; i++) {
          if ((link = links[i]) &&
            (link.getAttribute('rel') == 'canonical') &&
            (href = link.getAttribute('href'))) {
            a.href = href;
            return a.href;
          }
        }
      }
      return false;
    };

    function haveTgAuthResult() {
      var locationHash = '', re = /[#\?\&]tgAuthResult=([A-Za-z0-9\-_=]*)$/, match;
      try {
        locationHash = location.hash.toString();
        if (match = locationHash.match(re)) {
          location.hash = locationHash.replace(re, '');
          var data = match[1] || '';
          data = data.replace(/-/g, '+').replace(/_/g, '/');
          var pad = data.length % 4;
          if (pad > 1) {
            data += new Array(5 - pad).join('=');
          }
          return JSON.parse(window.atob(data));
        }
      } catch (e) {}
      return false;
    }

    function getXHR() {
      if (navigator.appName == "Microsoft Internet Explorer"){
        return new ActiveXObject("Microsoft.XMLHTTP");
      } else {
        return new XMLHttpRequest();
      }
    }

    if (!window.Telegram) {
      window.Telegram = {};
    }
    if (!window.Telegram.__WidgetUuid) {
      window.Telegram.__WidgetUuid = 0;
    }
    if (!window.Telegram.__WidgetLastId) {
      window.Telegram.__WidgetLastId = 0;
    }
    if (!window.Telegram.__WidgetCallbacks) {
      window.Telegram.__WidgetCallbacks = {};
    }

    function postMessageToIframe(iframe, event, data, callback) {
      if (!iframe._ready) {
        if (!iframe._readyQueue) iframe._readyQueue = [];
        iframe._readyQueue.push([event, data, callback]);
        return;
      }
      try {
        data = data || {};
        data.event = event;
        if (callback) {
          data._cb = ++window.Telegram.__WidgetLastId;
          window.Telegram.__WidgetCallbacks[data._cb] = {
            iframe: iframe,
            callback: callback
          };
        }
        iframe.contentWindow.postMessage(JSON.stringify(data), '*');
      } catch(e) {}
    }

    function initWidget(widgetEl) {
      var widgetId, widgetElId, widgetsOrigin, existsEl,
        src, styles = {}, allowedAttrs = [],
        defWidth, defHeight, scrollable = false, onInitAuthUser, onAuthUser, onUnauth;
      if (!widgetEl.tagName ||
        !(widgetEl.tagName.toUpperCase() == 'SCRIPT' ||
          widgetEl.tagName.toUpperCase() == 'BLOCKQUOTE' &&
          widgetEl.classList.contains('telegram-post'))) {
        return null;
      }
      if (widgetEl._iframe) {
        return widgetEl._iframe;
      }
      if (widgetId = widgetEl.getAttribute('data-telegram-post')) {
        var comment = widgetEl.getAttribute('data-comment') || '';
        widgetsOrigin = getWidgetsOrigin('https://t.me', 'https://post.tg.dev');
        widgetElId = 'telegram-post-' + widgetId.replace(/[^a-z0-9_]/ig, '-') + (comment ? '-comment' + comment : '');
        src = widgetsOrigin + '/' + widgetId + '?embed=1';
        allowedAttrs = ['comment', 'userpic', 'mode', 'single?', 'color', 'dark', 'dark_color'];
        defWidth = widgetEl.getAttribute('data-width') || '100%';
        defHeight = '';
        styles.minWidth = '320px';
      }
      else if (widgetId = widgetEl.getAttribute('data-telegram-discussion')) {
        widgetsOrigin = getWidgetsOrigin('https://t.me', 'https://post.tg.dev');
        widgetElId = 'telegram-discussion-' + widgetId.replace(/[^a-z0-9_]/ig, '-') + '-' + (++window.Telegram.__WidgetUuid);
        var websitePageUrl = widgetEl.getAttribute('data-page-url');
        if (!websitePageUrl) {
          websitePageUrl = getPageCanonical();
        }
        src = widgetsOrigin + '/' + widgetId + '?embed=1&discussion=1' + (websitePageUrl ? '&page_url=' + encodeURIComponent(websitePageUrl) : '');
        allowedAttrs = ['comments_limit', 'color', 'colorful', 'dark', 'dark_color', 'width', 'height'];
        defWidth = widgetEl.getAttribute('data-width') || '100%';
        defHeight = widgetEl.getAttribute('data-height') || 0;
        styles.minWidth = '320px';
        if (defHeight > 0) {
          scrollable = true;
        }
      }
      else if (widgetEl.hasAttribute('data-telegram-login')) {
        widgetId = widgetEl.getAttribute('data-telegram-login');
        widgetsOrigin = getWidgetsOrigin('https://oauth.telegram.org', 'https://oauth.tg.dev');
        widgetElId = 'telegram-login-' + widgetId.replace(/[^a-z0-9_]/ig, '-');
        src = widgetsOrigin + '/embed/' + widgetId + '?origin=' + encodeURIComponent(location.origin || location.protocol + '//' + location.hostname) + '&return_to=' + encodeURIComponent(location.href);
        allowedAttrs = ['size', 'userpic', 'init_auth', 'request_access', 'radius', 'min_width', 'max_width', 'lang'];
        defWidth = 186;
        defHeight = 28;
        if (widgetEl.hasAttribute('data-size')) {
          var size = widgetEl.getAttribute('data-size');
          if (size == 'small') defWidth = 148, defHeight = 20;
          else if (size == 'large') defWidth = 238, defHeight = 40;
        }
        if (widgetEl.hasAttribute('data-onauth')) {
          onInitAuthUser = onAuthUser = __parseFunction(widgetEl.getAttribute('data-onauth'), ['user']);
        }
        else if (widgetEl.hasAttribute('data-auth-url')) {
          var a = document.createElement('A');
          a.href = widgetEl.getAttribute('data-auth-url');
          onAuthUser = function(user) {
            var authUrl = a.href;
            authUrl += (authUrl.indexOf('?') >= 0) ? '&' : '?';
            var params = [];
            for (var key in user) {
              params.push(key + '=' + encodeURIComponent(user[key]));
            }
            authUrl += params.join('&');
            location.href = authUrl;
          };
        }
        if (widgetEl.hasAttribute('data-onunauth')) {
          onUnauth = __parseFunction(widgetEl.getAttribute('data-onunauth'));
        }
        var auth_result = haveTgAuthResult();
        if (auth_result && onAuthUser) {
          onAuthUser(auth_result);
        }
      }
      else if (widgetId = widgetEl.getAttribute('data-telegram-share-url')) {
        widgetsOrigin = getWidgetsOrigin('https://t.me', 'https://post.tg.dev');
        widgetElId = 'telegram-share-' + window.btoa(widgetId);
        src = widgetsOrigin + '/share/embed?origin=' + encodeURIComponent(location.origin || location.protocol + '//' + location.hostname);
        allowedAttrs = ['telegram-share-url', 'comment', 'size', 'text'];
        defWidth = 60;
        defHeight = 20;
        if (widgetEl.getAttribute('data-size') == 'large') {
          defWidth = 76;
          defHeight = 28;
        }
      }
      else {
        return null;
      }
      existsEl = document.getElementById(widgetElId);
      if (existsEl) {
        return existsEl;
      }
      for (var i = 0; i < allowedAttrs.length; i++) {
        var attr = allowedAttrs[i];
        var novalue = attr.substr(-1) == '?';
        if (novalue) {
          attr = attr.slice(0, -1);
        }
        var data_attr = 'data-' + attr.replace(/_/g, '-');
        if (widgetEl.hasAttribute(data_attr)) {
          var attr_value = novalue ? '1' : encodeURIComponent(widgetEl.getAttribute(data_attr));
          src += '&' + attr + '=' + attr_value;
        }
      }
      function getCurCoords(iframe) {
        var docEl = document.documentElement;
        var frect = iframe.getBoundingClientRect();
        return {
          frameTop: frect.top,
          frameBottom: frect.bottom,
          frameLeft: frect.left,
          frameRight: frect.right,
          frameWidth: frect.width,
          frameHeight: frect.height,
          scrollTop: window.pageYOffset,
          scrollLeft: window.pageXOffset,
          clientWidth: docEl.clientWidth,
          clientHeight: docEl.clientHeight
        };
      }
      function visibilityHandler() {
        if (isVisible(iframe, 50)) {
          postMessageToIframe(iframe, 'visible', {frame: widgetElId});
        }
      }
      function focusHandler() {
        postMessageToIframe(iframe, 'focus', {has_focus: document.hasFocus()});
      }
      function postMessageHandler(event) {
        if (event.source !== iframe.contentWindow ||
          event.origin != widgetsOrigin) {
          return;
        }
        try {
          var data = JSON.parse(event.data);
        } catch(e) {
          var data = {};
        }
        if (data.event == 'resize') {
          if (data.height) {
            iframe.style.height = data.height + 'px';
          }
          if (data.width) {
            iframe.style.width = data.width + 'px';
          }
        }
        else if (data.event == 'ready') {
          iframe._ready = true;
          focusHandler();
          for (var i = 0; i < iframe._readyQueue.length; i++) {
            var queue_item = iframe._readyQueue[i];
            postMessageToIframe(iframe, queue_item[0], queue_item[1], queue_item[2]);
          }
          iframe._readyQueue = [];
        }
        else if (data.event == 'visible_off') {
          removeEvent(window, 'scroll', visibilityHandler);
          removeEvent(window, 'resize', visibilityHandler);
        }
        else if (data.event == 'get_coords') {
          postMessageToIframe(iframe, 'callback', {
            _cb: data._cb,
            value: getCurCoords(iframe)
          });
        }
        else if (data.event == 'scroll_to') {
          try {
            window.scrollTo(data.x || 0, data.y || 0);
          } catch(e) {}
        }
        else if (data.event == 'auth_user') {
          if (data.init) {
            onInitAuthUser && onInitAuthUser(data.auth_data);
          } else {
            onAuthUser && onAuthUser(data.auth_data);
          }
        }
        else if (data.event == 'unauthorized') {
          onUnauth && onUnauth();
        }
        else if (data.event == 'callback') {
          var cb_data = null;
          if (cb_data = window.Telegram.__WidgetCallbacks[data._cb]) {
            if (cb_data.iframe === iframe) {
              cb_data.callback(data.value);
              delete window.Telegram.__WidgetCallbacks[data._cb];
            }
          } else {
            console.warn('Callback #' + data._cb + ' not found');
          }
        }
      }
      var iframe = document.createElement('iframe');
/* PATCHED */ iframe.style.display = 'none';
      iframe.id = widgetElId;
      iframe.src = src;
      iframe.width = defWidth;
      iframe.height = defHeight;
      iframe.setAttribute('frameborder', '0');
      if (!scrollable) {
        iframe.setAttribute('scrolling', 'no');
        iframe.style.overflow = 'hidden';
      }
      iframe.style.colorScheme = 'light dark';
      iframe.style.border = 'none';
      for (var prop in styles) {
        iframe.style[prop] = styles[prop];
      }
      if (widgetEl.parentNode) {
        widgetEl.parentNode.insertBefore(iframe, widgetEl);
        if (widgetEl.tagName.toUpperCase() == 'BLOCKQUOTE') {
          widgetEl.parentNode.removeChild(widgetEl);
        }
      }
      iframe._ready = false;
      iframe._readyQueue = [];
      widgetEl._iframe = iframe;
      addEvent(iframe, 'load', function() {
        removeEvent(iframe, 'load', visibilityHandler);
        addEvent(window, 'scroll', visibilityHandler);
        addEvent(window, 'resize', visibilityHandler);
        visibilityHandler();
      });
      addEvent(window, 'focus blur', focusHandler);
      addEvent(window, 'message', postMessageHandler);
      return iframe;
    }
    function isVisible(el, padding) {
      var node = el, val;
      var visibility = getCssProperty(node, 'visibility');
      if (visibility == 'hidden') return false;
      while (node) {
        if (node === document.documentElement) break;
        var display = getCssProperty(node, 'display');
        if (display == 'none') return false;
        var opacity = getCssProperty(node, 'opacity');
        if (opacity !== null && opacity < 0.1) return false;
        node = node.parentNode;
      }
      if (el.getBoundingClientRect) {
        padding = +padding || 0;
        var rect = el.getBoundingClientRect();
        var html = document.documentElement;
        if (rect.bottom < padding ||
          rect.right < padding ||
          rect.top > (window.innerHeight || html.clientHeight) - padding ||
          rect.left > (window.innerWidth || html.clientWidth) - padding) {
          return false;
        }
      }
      return true;
    }

    function getAllWidgets() {
      var widgets = [];
      if (document.querySelectorAll) {
        widgets = document.querySelectorAll('script[data-telegram-post],blockquote.telegram-post,script[data-telegram-discussion],script[data-telegram-login],script[data-telegram-share-url]');
      } else {
        widgets = Array.prototype.slice.apply(document.getElementsByTagName('SCRIPT'));
        widgets = widgets.concat(Array.prototype.slice.apply(document.getElementsByTagName('BLOCKQUOTE')));
      }
      return widgets;
    }

    function getWidgetInfo(el_or_id, callback) {
      var e = null, iframe = null;
      if (el = geById(el_or_id)) {
        if (el.tagName &&
          el.tagName.toUpperCase() == 'IFRAME') {
          iframe = el;
        } else if (el._iframe) {
          iframe = el._iframe;
        }
        if (iframe && callback) {
          postMessageToIframe(iframe, 'get_info', {}, callback);
        }
      }
    }

    function setWidgetOptions(options, el_or_id) {
      var e = null, iframe = null;
      if (typeof el_or_id === 'undefined') {
        var widgets = getAllWidgets();
        for (var i = 0; i < widgets.length; i++) {
          if (iframe = widgets[i]._iframe) {
            postMessageToIframe(iframe, 'set_options', {options: options});
          }
        }
      } else {
        if (el = geById(el_or_id)) {
          if (el.tagName &&
            el.tagName.toUpperCase() == 'IFRAME') {
            iframe = el;
          } else if (el._iframe) {
            iframe = el._iframe;
          }
          if (iframe) {
            postMessageToIframe(iframe, 'set_options', {options: options});
          }
        }
      }
    }

    if (!document.currentScript ||
      !initWidget(document.currentScript)) {
      var widgets = getAllWidgets();
      for (var i = 0; i < widgets.length; i++) {
        initWidget(widgets[i]);
      }
    }

    var TelegramLogin = {
      popups: {},
      options: null,
      auth_callback: null,
      _init: function(options, auth_callback) {
        TelegramLogin.options = options;
        TelegramLogin.auth_callback = auth_callback;
        var auth_result = haveTgAuthResult();
        if (auth_result && auth_callback) {
          auth_callback(auth_result);
        }
      },
      _open: function(callback) {
        TelegramLogin._auth(TelegramLogin.options, function(authData) {
          if (TelegramLogin.auth_callback) {
            TelegramLogin.auth_callback(authData);
          }
          if (callback) {
            callback(authData);
          }
        });
      },
      _auth: function(options, callback) {
        var bot_id = parseInt(options.bot_id);
        if (!bot_id) {
          throw new Error('Bot id required');
        }
        var width = 550;
        var height = 470;
        var left = Math.max(0, (screen.width - width) / 2) + (screen.availLeft | 0),
          top = Math.max(0, (screen.height - height) / 2) + (screen.availTop | 0);
        var onMessage = function (event) {
          try {
            var data = JSON.parse(event.data);
          } catch(e) {
            var data = {};
          }
          if (!TelegramLogin.popups[bot_id]) return;
          if (event.source !== TelegramLogin.popups[bot_id].window) return;
          if (data.event == 'auth_result') {
            onAuthDone(data.result);
          }
        };
        var onAuthDone = function (authData) {
          if (!TelegramLogin.popups[bot_id]) return;
          if (TelegramLogin.popups[bot_id].authFinished) return;
          callback && callback(authData);
          TelegramLogin.popups[bot_id].authFinished = true;
          removeEvent(window, 'message', onMessage);
        };
        var checkClose = function(bot_id) {
          if (!TelegramLogin.popups[bot_id]) return;
          if (!TelegramLogin.popups[bot_id].window ||
            TelegramLogin.popups[bot_id].window.closed) {
            return TelegramLogin.getAuthData(options, function(origin, authData) {
              onAuthDone(authData);
            });
          }
          setTimeout(checkClose, 100, bot_id);
        }

/* PATCHED */ const origin =  REACT_APP_TG_BOT_ORIGIN;
/* PATCHED */ var popup_url = Telegram.Login.widgetsOrigin + '/auth?bot_id=' + encodeURIComponent(options.bot_id) + '&origin=' + encodeURIComponent(origin) + (options.request_access ? '&request_access=' + encodeURIComponent(options.request_access) : '') + ('&lang=' + encodeURIComponent(options.lang)) + '&return_to=' + encodeURIComponent(origin);
        var popup = window.open(popup_url, '_blank', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',status=0,location=0,menubar=0,toolbar=0');
        TelegramLogin.popups[bot_id] = {
          window: popup,
          authFinished: false
        };
        if (popup) {
          addEvent(window, 'message', onMessage);
          popup.focus();
          checkClose(bot_id);
        }
      },
      getAuthData: function(options, callback) {
        var bot_id = parseInt(options.bot_id);
        if (!bot_id) {
          throw new Error('Bot id required');
        }
        var xhr = getXHR();
        var url = Telegram.Login.widgetsOrigin + '/auth/get';
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            if (typeof xhr.responseBody == 'undefined' && xhr.responseText) {
              try {
                var result = JSON.parse(xhr.responseText);
              } catch(e) {
                var result = {};
              }
              if (result.user) {
                callback(result.origin, result.user);
              } else {
                callback(result.origin, false);
              }
            } else {
              callback('*', false);
            }
          }
        };
        xhr.onerror = function() {
          callback('*', false);
        };
        xhr.withCredentials = false;
        xhr.send('bot_id=' + encodeURIComponent(options.bot_id) + (options.lang ? '&lang=' + encodeURIComponent(options.lang) : ''));
      }
    };

    window.Telegram.getWidgetInfo = getWidgetInfo;
    window.Telegram.setWidgetOptions = setWidgetOptions;
    window.Telegram.Login = {
      init: TelegramLogin._init,
      open: TelegramLogin._open,
      auth: TelegramLogin._auth,
/* PATCHED */ widgetsOrigin: 'https://oauth.telegram.org'
    };

  }(window));
})(window);
