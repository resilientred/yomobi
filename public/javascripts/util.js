var util = {
  
  debug: true,
  cycleIdx: 0,

  // namespace for shared widget functions
  widget: {},
  
  // UI event blocking statuses
  busy: {},
  // Concurrent UI event blocking groups
  groups: {},

  /**
   *  reserve
   *    This function checks if a key is vacant or occupied. Useful
   *  for UI blocking.
   *  If the key is occupied, it returns false.
   *  If the key is vacant, it sets it as occupied and returns true.
   *  Example usage:
      function submitForm() {
        if(!util.reserve('form-submit')) return;
        // do important submitting stuff
      }
   */
  reserve: function (key,takeReservation) {
    if (takeReservation === undefined) takeReservation = true;
    
    if(this.busy[key] === undefined || this.busy[key] === false) {
      if (takeReservation) this.busy[key] = true;
      return true;
    }
    else if(this.busy[key] === true) {
      return false;
    }
  },

  release: function (key) {
    this.busy[key] = false;
  },

  isBusy: function (key) {
    return this.busy[key] === true;
  },
  
  /**
   *  pushBlock

   *    -> "block" as in "an obstacle to progress", not "a set of things"

   *    This function is for handling concurrent events that all relate
   *  to one class of ui blocking. Once all blocks are cleared, 300ms
   *  is waited before releasing the group key.
   *    During these 300ms, if another block is pushed using the same
   *  group key, the 300ms timer is stopped, and begins again only once
   *  all blocks under that group key are cleared.
   *    This function should be called after some successful reserveUI() call.
   *  It can be used to replace the use of releaseUI() with much more fine-
   *  grained control.
   */
  pushBlock: function (group_key,block_key) {
    var group = this.groups[group_key] = this.groups[group_key] || {}
      , timer_key  = group_key + '::timer'
      , timeoutRef = this.groups[timer_key]
    ;
    group[block_key] = true;
    clearTimeout(timeoutRef);
    this.log('pushing into group',group_key,block_key);
  },

  clearBlock: function (group_key,block_key,releaseDelay) {
    var self = this
      , group = this.groups[group_key]
      , timer_key = group_key + '::timer'
      , releaseDelay = releaseDelay || 300
    ;
    if (!group || group[block_key] === undefined) return;
    delete group[block_key];
    this.log('clearing block',group_key,block_key);

    var blocks = _.map(group, function (val) { return val; });
    if (!_.any(blocks)) {
      this.groups[timer_key] = setTimeout(function () {
        self.release(group_key);
        util.toggleLoaderOverlay(false);
        util.log('cleared group key',group_key);
      }, releaseDelay);
    }
  },
  
  reserveWidget: function (widget,force) {
    util.toggleLoaderOverlay(true);
    // TODO: use a combination of id and name once starting
    // to implement multiple copies of the same widget
    return (!this.busy['ui'] || force) && this.reserve('widget:' + widget.get('name'));
  },
  
  releaseWidget: function (widget) {
    this.release('widget:' + widget.get('name'));
    if (util.isUIFree()) util.toggleLoaderOverlay(false);
  },
  
  reserveUI: function () {
    util.toggleLoaderOverlay(true);
    var reservations = _.values(util.busy);
    return !_.any(reservations) && util.reserve('ui');
  },
  
  isUIFree: function () {
    var reservations = _.values(util.busy);
    return !_.any(reservations) && util.reserve('ui',false);
  },
  
  pushUIBlock: function (block_key) {
    this.pushBlock('ui',block_key);
  },
  
  clearUIBlock: function (block_key) {
    this.clearBlock('ui',block_key);
  },
  
  releaseUI: function () {
    util.toggleLoaderOverlay(false);
    util.release('ui');
  },
  
  resizeOverlays: function () {
    return;
    var targetHeight = $('#emulator').height() + 8;
    $('#builder').find('.loader-overlay, .drophover-overlay')
      .height(targetHeight)
      // .css('top',$('#emulator-wrapper').position().top)
    ;
  },
  
  toggleLoaderOverlay: function (showOrHide) {
    util.resizeOverlays();
    $('#builder .loader-overlay').toggle(showOrHide);
    if (!showOrHide) $('#builder .drophover-overlay').hide();
  },
  
  capitalize: function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
  },
  
  prettify: function (word) {
    switch (word.toLowerCase()) {
      case 'and':       word = '&'; break;
      default: break;
    }
    return this.capitalize(word);
  },
  
  uglify: function (word) {
    switch (word) {
      case '&':       word = 'and'; break;
      default: break;
    }
    return word.toLowerCase();
  },
  
  prettifyName: function (name) {
    if (!name) return '';
    
    var prettyName = _(name.split('-')).chain()
        .map(function (word) { return util.prettify(word); })
        .value()
        .join(' ')
    ;
    return prettyName;
  },
  
  uglifyName: function (name) {
    var uglyName = _(name.split(' ')).chain()
        .map(util.uglify)
        .value()
        .join('-')
    ;
    return uglyName;
  },

  helpifyName: function (name) {
    // temporary edge-case hack
    if (name == 'photo-bucket') name = 'photobucket';

    return util.prettifyName(name).replace(/ /g, '');
  },
  
  scrubUglyName: function (name) {
    var scrubbed = _(name.split('-')).chain()
        .map(util.scrubWord)
        .compact()
        .value()
        .join('-')
    ;
    return scrubbed;
  },
  
  scrubWord: function (word) {
    // ie7 does not allow the following like :(
    // return _(word).chain().map(util.scrubChar).value().join('');
    var chars = [];
    for (var i=0;i<word.length;i++) { chars.push( util.scrubChar(word.charAt(i)) ); };
    return chars.join('');
  },
  
  scrubChar: function (c) {
    if (c.match(/[a-z0-9]/)) return c;
    return null;
  },
  
  splitStr: function (str) {
    var result = '';
    for (var i=0; i<str.length; i++) {
      var c = str.charAt(i);
      result += c;
      if (i % 3 == 2) result += '_';
    }
    return result;
  },
  
  widgetById: function (id) {
    return mapp.widgets.get(id);
  },
  
  // Example inputs/outputs:
  // "08:00" -> "08:00am"
  // "16:00" -> "04:00pm"
  // "12:00" -> "12:00pm"
  // "00:01" -> "12:01am"
  // "01:00" -> "01:00am"
  from24to12: function (timeStr) {
    var hour   = parseInt(timeStr.split(':')[0],10)
      , minute = parseInt(timeStr.split(':')[1],10)
      , convertedHour = hour % 12
      , convertedHour = (convertedHour == 0) ? 12 : convertedHour
      , period = (hour < 12) ? ' am' : ' pm'
      , minuteStr = (minute < 10 ? '0' : '') + minute
      , hourStr   = (convertedHour < 10 ? '&nbsp;' : '') + convertedHour
    ;
    return hourStr + ':' + minuteStr + period;
  },
  
  // Example inputs/outputs:
  // "08:00am" -> "08:00"
  // "04:00pm" -> "16:00"
  // "12:00pm" -> "12:00"
  // "12:01am" -> "00:01"
  // "01:00am" -> "01:00"
  from12to24: function (timeStr) {
    var split = timeStr.split(':')
      , hour   = parseInt(split[0],10)
      , minute = parseInt(split[1].substring(0,2),10)
      , period =          split[1].substring(2)
      , hour = (period == 'pm' && hour != 12) ? hour+12 : hour
      , hour = (period == 'am' && hour == 12) ? hour-12 : hour
      , minuteStr = (minute < 10 ? '0' : '') + minute
      , hourStr   = (hour < 10 ? '0' : '') + hour
    ;
    return hourStr + ':' + minuteStr;
  },
  
  parseTimeTo24: function (timeStr) {
    var split = timeStr.split(':');

    if (split[1].substring(2) != '') {
      timeStr = this.from12to24(timeStr);
      split = timeStr.split(':');
    }
    return {
      hour: parseInt(split[0],10),
      minute: parseInt(split[1].substring(0,2),10),
      toMinutes: function () {
        return this.hour * 60 + this.minute;
      },
      toString: function () {
        var hourStr = (this.hour < 10) ? '0'+this.hour : ''+this.hour
          , minStr  = (this.minute < 10) ? '0'+this.minute : ''+this.minute
        ;
        return hourStr + ':' + minStr;
      },
      toString12: function () {
        return util.from24to12(this.toString());
      }
    };
  },

  clock15mIncrements: function () {
    var minInc = ['00','15','30','45'];

    var clock24hourInc = _.map(_.range(24*4), function (i) {
      var hour = (i/4 < 10 ? '0' : '') + (i/4|0)
        , min  = minInc[i%4]
      ;
      return hour + ':' + min;
    });

    return _.map(clock24hourInc, util.from24to12);
  },
  
  getTemplate: function (name) {
    return _.template($('#templates .'+name).html());
  },
  
  getWidgetBData: function (widget) {
    if (widget._bdata) return widget._bdata;

    // cache
    widget._bdata = _.detect(window.bdata, function (w) {
      return w.wtype == widget.get('wtype') &&
             w.wsubtype == widget.get('wsubtype');
    });

    if (window.bhelp) {
      var help = window.bhelp['helpText'][widget._bdata.wsubtype];
      widget._bdata.help = help.help; widget._bdata.subHelp = help.subHelp;
    }
    if (window.bmeta) {
      var meta = window.bmeta[widget.get('wtype') + '::' + widget.get('wsubtype')];
      _.extend(widget._bdata, meta);
    }

    return widget._bdata;
  },

  getInputElements: function (elem,selector) {
    selector = selector || '';
    return elem.find(selector + ' input,' +
                     selector + ' textarea,' + 
                     selector + ' select');
  },
  
  newWidget: function (data) {
    return new window.widgetClasses[data.wtype](data);
  },

  newWidgetByType: function (wtype,wsubtype) {

    var wdata = _.detect(window.bdata, function (w) {
      return w.wtype == wtype && w.wsubtype == wsubtype;
    });

    return util.newWidget(wdata);
  },
  
  newEditor: function (widget) {
    return new (window.widgetEditors[widget.get('wtype')] || window.EditWidgetView)(widget);
  },
  
  showLoading: function (element) {
    element.find('.checkmark').hide();
    element.find('.loader').show();
  },
  
  showSuccess: function (element) {
    element.find('.loader').hide();
    element.find('.checkmark').show();
  },
  
  getUrlParams: function (url) {
    var result = {}
      , e
      , a = /\+/g  // Regex for replacing addition symbol with a space
      , r = /([^&=]+)=?([^&]*)/g
      , d = function (s) { return decodeURIComponent(s.replace(a, " ")); }
      , q = url.substring(url.indexOf('?'))

    while (e = r.exec(q))
       result[d(e[1])] = d(e[2]);
    return result;
  },
  
  eq: function (value) {
    return function (x) { return x === value; };
  },

  keq: function (value) {
    return function (v,k) { return k === value; };
  },
  
  resetCycle: function () {
    util.cycleIdx = 0;
  },
  
  cycle: function () {
    return arguments[(util.cycleIdx++) % arguments.length];
  },
  
  catOrder: function (cat) {
    cat || (cat = '');
    if (cat.lastIndexOf('|') === -1) return NaN;
    return parseInt( cat.substring(cat.lastIndexOf('|')+1),10 );
  },
  
  topCatName: function (stack) {
    var cat = _.last(stack);
    return cat._data && cat._data.name;
  },
  
  fullCatFromName: function (level,catName) {
    var cats = _.without(_.keys(level),'_items')
      , escapedName = util.regexEscape(catName)
      , detectRegex = new RegExp('^' + escapedName + '\\|[0-9]+$')
    ;
    return _.detect(cats,function (c) { return !!c.match(detectRegex) });
  },
  
  catStackCrumbs: function (topName,catStack) {
    var crumbStack = _.map(catStack,function (cat) {
      return cat._data.name;
    });
    crumbStack.shift();

    var tnarr = [topName]
      , result = tnarr.concat(crumbStack).join(' > ')
      , maxWidth = mapp.getActivePage().find('.back-bar .title').width()
    ;
    while ( crumbStack.length > 1 && !util.isTextBounded(result,maxWidth) ) {
      if (tnarr.length == 1) tnarr.push('...');

      crumbStack.splice(0,1);
      result = tnarr.concat(crumbStack).join(' > ');
    }

    return result;
  },
  
  dialog: function (html,buttons,title) {
    return $(html).dialog({
      resizable: false,
      modal: true,
      draggable: false,
      closeOnEscape: false,
      buttons: buttons,
      title: title
    });
  },
  
  regexEscape: function (str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  },

  // A simple, incomplete pluralize function.
  // Add endings as needed.
  pluralize: function (word) {
    if (word.match(/y$/))
      return word.substring(0, word.length - 1) + 'ies';
    else
      return word + 's';
  },
  
  log: function () {
    if(!this.debug) return;
    if(!window.console || !window.console.log) return;
    
    console.log.apply(console, arguments);
  },
  
  couchSync: function (method,model,success,error) {
    if(method == 'read') {
      $.ajax({
        url: model.url,
        type: 'get',
        dataType: 'jsonp',
        success: function(data) {
          if(!data) statusbar.append('not defined data '+JSON.stringify(data));
          success(data);
        },
        error: function(jqXHR,textStatus,errorThrown) {
          error(jqXHR,textStatus,errorThrown);
        }
      });
    }
    else {
      alert(method+' method not implemented.');
    }
  },
  
  deleteSync: function (method,model,success,error) {
    if(method == 'delete') {
      $.ajax({
        url: model.url() + '/' + model.get('_rev'),
        type: 'delete',
        success: function(data) {
          util.log('deleteSync success!',data);
          success(data);
        },
        error: function(jqXHR,textStatus,errorThrown) {
          util.log('deleteSync error');
          error(jqXHR,textStatus,errorThrown);
        }
      });
    }
    else {
      Backbone.sync(method,model,success,error);
    }
  },
  
  clone: function (obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Array
    if (obj instanceof Array) {
      var copy = [];
      for (var i = 0, len = obj.length; i < len; ++i) {
        copy[i] = util.clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      var copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = util.clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  },
  
  /* http://jdsharp.us/jQuery/minute/calculate-scrollbar-width.php */
  scrollbarWidth: function () {
    if (this._scrollbarWidth) return this._scrollbarWidth;

    document.body.style.overflow = 'hidden';
    var width = document.body.clientWidth;
 
    document.body.style.overflow = 'scroll';
    width -= document.body.clientWidth;
 
    if(!width) width = document.body.offsetWidth-document.body.clientWidth;
 
    document.body.style.overflow = '';
    this._scrollbarWidth = width;

    return this._scrollbarWidth;
  },

  getFormValueHash: function ($form) {
    var hash = {};
    $form.find('[name^=]').each(function (idx,elem) {
      hash[elem.name] = $(elem).val();
    });
    return hash;
  },

  spawnJEditor: function () {
    $('#jeditor').wysiwyg({
      css: '/stylesheets/jwysiwyg.css?_=' + Math.random(),
      removeHeadings: true,
      formHeight: 400,
      formWidth: 320,
      events: {
        save: function () { bapp.currentEditor.trigger('wysiwyg-change'); },
        paste: function () { bapp.currentEditor.trigger('wysiwyg-paste'); return false; }
      },
      controls: {
        // createLink: { visible:false },
        insertImage: { visible:false },
        insertTable: { visible:false },
        subscript: { visible:false },
        superscript: { visible:false }
      }
    });
    // $('.wysiwyg iframe').css('height',250).css('width',320);
  },

  spawnRecaptcha: function () {
    if (!window.Recaptcha) return;
    Recaptcha.create("6LdLd8QSAAAAAE9J9A7Vm_bkwK01AdMo4bGInCVv",
      'recaptcha-container',
      {
        // theme: 'custom',
        // custom_theme_widget: 'recaptcha_container',
        theme: 'red',
        callback: function () {
          Recaptcha.focus_response_field();
          mapp.resize();
        }
      }
    );
  },

  spawnAritcaptcha: function () {
    $.get('/mobile/aritcaptcha', function (captchaHtml) {
      mapp.currentWidget.pageView.el
        .find('.aritcaptcha-container').html(captchaHtml)
      ;
      mapp.resize();
    });
  },

  ensureActiveWidgetIsVisible: function () {
    if (!window.bapp || !bapp.currentEditor) return;

    var widget = bapp.currentEditor.widget
      , scrollTop = $('#mobile-scroller').scrollTop()
      , offset = $(widget.homeView.el).offset().top - scrollTop
    ;
    if (offset < 0) {
      $('#mobile-scroller').scrollTop(scrollTop + offset);
    }
    else if (offset > 480) {
      $('#mobile-scroller').scrollTop(scrollTop + offset - 480);
    }
  },

  widgetPageViewSubmit: function () {
    var self = this
      , form = this.el.find('form')
      , url  = form.attr('action')
      , params = form.serialize()
      , method = form.attr('method')
    ;
    this.el.find('input[type=submit]').prop('disabled',true);
    $.post(url,params,function (data) {
      util.log('data',data);
      self.el
        .find('.input-wrap').hide().end()
        .find('.thanks-wrap').show().end()
      ;
      $(window).scrollTop(0);
    })
    .error(function (e,textStatus,errorThrown) {
      var msg = self.prettyErrorMsg($.parseJSON(e.responseText))
      self.el.find('.response').html('ERROR: '+msg).show('pulsate',{ times:3 });
      self.el.find('input[type=submit]').prop('disabled',false);
      mapp.resize();
    });
    
    return false;
  },

  isTextBounded: function (text,width) {
    var textWidth = $('#cat-crumbs-test').text(text).width();
    return textWidth <= width;
  },

  toHtml: function (jqueryObject) {
    return $('<div>').html( jqueryObject ).html();
  },

  stripAllStyles: function (html) {
    var $html = $(html);
    util._stripAllStyles( $html );
    return util.toHtml( $html );
  },

  attributesToStrip: [
    'style', 'width', 'height',
    'border', 'cellpadding', 'frame', 'bgcolor'
  ],

  // expects a jquery object
  _stripAllStyles: function ($group) {
    $group.each(function (idx,elem) {
      if (elem.removeAttribute) {
        for (var i = util.attributesToStrip.length - 1; i >= 0; i--) {
          elem.removeAttribute(util.attributesToStrip[i]);
        }
      }
      // quick and easy non-perfect way of checking for children
      if (elem.innerHTML)
        util._stripAllStyles( $(elem).children() );
    });
  },

  enableFileUploadButton: function () {
    if ($.browser.msie) {
      setTimeout(util._enableFileUploadButton, 0);
    }
    else {
      util._enableFileUploadButton();
    }
  },
  _enableFileUploadButton: function () {
    var fileInput = $('input[type=file]')
      , file = fileInput.val()
    ;
    if (file && file.length > 0) {
      $('input[value=Upload]').prop('disabled',false);
    }
  },

  createNoRedirectCookie: function (domain, minutes) {
    var date = new Date();
    date.setTime(date.getTime()+(minutes*60*1000));
    var expires = "; expires=" + date.toGMTString();
    document.cookie = 'noredirect::' + domain + "=1" + expires + "; path=/";
  },

  // used in mobile captcha pages. Assumes `this` is binded to the widget page.
  spawnCaptcha: function () {
    var myWidget = this.widget;
    setTimeout(function () {
      if (mapp.currentWidget === myWidget) util.spawnAritcaptcha();
    },1000);
  },

  toComparableName: function (name) {
    return name.toLowerCase();
  },

  ran: function (n) { return Math.round(Math.random() * n); },
  ranChr: function () { return String.fromCharCode(97 + util.ran(25)); },

  generateId: function () {
    var rstring = _.map(_.range(8), util.ranChr).join('');
    var id = 'i' + g.id_counter + '-' + rstring;
    // since this is currently only used in category widget,
    // the ids only need to be semi-unique.
    $.post('/builder/gen-id',{});
    g.id_counter += 1;
    return id;
  },

  preventDefault: function (e) { e.preventDefault(); },

  _uploaders: {},
  getOrCreateUploader: function (extraData, options) {
    var defaults = {
      instanceId: 'default',
      extraParams: {},
      onDone: _.identity
    }
    options = _.extend(defaults, options);

    var uploader = this._uploaders[options.instanceId];

    if (uploader && options.emptyQueue && uploader.files.length > 0) {
      while (uploader.files.length > 0) {
        uploader.removeFile(uploader.files[0]);
      }
    }

    if (uploader && uploader.runtime === 'flash') {
      this.destroyUploader(options.instanceId);
    }
    else if (uploader) {
      _.extend(uploader.settings, extraData);
      _.extend(uploader.settings.multipart_params, options.extraParams);
      uploader.yomobiOptions = options;
      return uploader;
    }

    uploader = this._uploaders[options.instanceId] = new plupload.Uploader(_.extend({
      runtimes: 'html5,flash,html4',
      url: g.wphotoUploadPath,
      max_file_size: '10mb',
      multiple_queues: false,
      multi_selection: false,
      filters: [
        { title:'Image Files', extensions:'jpg,jpeg,gif,png' }
      ],

      flash_swf_url: '/javascripts/plupload/plupload.flash.swf',
      multipart: true,
      multipart_params: _.extend(g.uploadifyScriptData, options.extraParams),
      headers: { 'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content') }
    }, extraData));

    uploader.instanceId = options.instanceId;
    uploader.yomobiOptions = options;

    return uploader;
  },

  destroyUploader: function (instanceId) {
    this._uploaders[instanceId].destroy();
    delete this._uploaders[instanceId];
  },

  initUploader: function (context, options) {
    options || (options = {});
    options.context = context;

    var pickerId = util.generateId()
      , uploader = util.getOrCreateUploader({ browse_button:pickerId }, options)
    ;
    util.uploaderContext = context;

    uploader.unbindAll();

    uploader.bind('Init', function (up, params) {
      if (uploader.files.length > 0 && uploader.files[0].status === plupload.DONE) {
        uploader.removeFile(uploader.files[0]);
      }
      else if (uploader.files.length > 0) {
        file = uploader.files[0];
        context.find('.selected-file').empty().append(
          '<div id="' + file.id + '">' +
          file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
        '</div>');
      }
    });

    context.find('[name=pick_files]').attr('id', pickerId);

    uploader.init();

    uploader.reposition = function () {
      uploader.refresh(); // Reposition Flash/Silverlight
      if (uploader.yomobiOptions.alwaysOnTop === true) {
        uploader.bringToFront();
      }
    };
    context.find('img').load(function () { uploader.reposition(); });
    
    // because we're in a dialog, sometimes we need to set the uploader to be
    // on top of everything else, as well as send it back
    uploader.layover = $('#' + uploader.id + '_' + uploader.runtime + '_container');
    if (uploader.layover.length === 0) {
      // layover for html4 runtime
      uploader.layover = $('form[target=' + uploader.id + '_iframe]');
    }

    uploader.bringToFront = function () {
      if ($.browser.mozilla && $.browser.version.slice(0,3) !== "1.9")
        return;
      this.layover.css('z-index', 10000);
    };
    uploader.sendToBack = function () {
      $('#'+pickerId).hide();
      uploader.refresh();
    };
    uploader.disableBrowseButton = function () {
      $('#'+pickerId).hide();
      $('<button>').text('Browse...').prop('disabled',true).insertAfter('#'+pickerId);
      uploader.refresh();
    };

    uploader.bind('FilesAdded', function (up, files) {
      if (!util.isUIFree()) return;

      var isAutoEnabled = uploader.yomobiOptions.auto !== false;

      while (uploader.files.length > 1) {
        uploader.removeFile(uploader.files[0]);
      }
      if (isAutoEnabled && !util.reserveUI()) {
        return;
      }

      $.each(files, function (i, file) {
        context.find('.selected-file').empty().append(
          '<div id="' + file.id + '">' +
          file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
        '</div>');
      });
      
      if (isAutoEnabled) {
        util.log('starting uploader');
        uploader.start();
      }

      uploader.reposition();
    });

    uploader.bind('BeforeUpload', function () {
      context.find('.selected-file').text('Uploading...');
      uploader.disableBrowseButton();
      uploader.startTimestamp = util.now();
    });

    uploader.bind('UploadProgress', function (up, file) {
      var width = context.find('.selected-file').outerWidth();
      var offset = parseInt(-500 + file.percent * width / 100) + 'px 0';
      context.find('.selected-file').css('background-position', offset);
      if (file.percent === 100) {
        var delay = Math.max(uploader.startTimestamp + 2000 - util.now(), 0);
        setTimeout(function () {
          if (!uploader.startTimestamp) return;
          context.find('.selected-file').text('Processing...');
        }, delay);
      }
    });

    uploader.bind('Error', function (up, err) {
      context.find('.error').append("<div>Error: " + err.code +
        ", Message: " + err.message +
        (err.file ? ", File: " + err.file.name : "") +
        "</div>"
      );

      up.refresh(); // Reposition Flash/Silverlight
    });

    uploader.bind('FileUploaded', function (up, file, response) {
      context.find('.selected-file').text('Saving widget...');
      uploader.layover.find('input').show();

      var resData = $.parseJSON(response.response);
      util.log('Upload, complete.', up, file, response, resData);
      delete uploader.startTimestamp;

      callback = uploader.yomobiOptions.onDone;
      callback(resData);
    });
  },

  // returns a jquery object
  ensureClassAncestor: function (elem, className) {
    var failSafe = 8, $elem = $(elem);
    while ($elem && !$elem.hasClass(className) && failSafe > 0) {
      $elem = $elem.parent();
      failSafe -= 1;
    }
    return ($elem && $elem.hasClass(className)) ? $elem : null;
  },

  largerWphoto: function (wphotoUrl) {
    if (!wphotoUrl) return null;
    return wphotoUrl.replace('-thumb?', '-original?');
  },

  now: function () { return (new Date()).getTime(); },

  ensureUrl: function (url) {
    var prefix = url.match(/^(https?:\/\/)|(ftps?\/\/)/) ? '' : 'http://';
    return prefix + url;
  }
}

// useful extensions
Array.prototype.swap = function (x,y) {
  var temp = this[x];
  this[x] = this[y];
  this[y] = temp;
  return this;
};
