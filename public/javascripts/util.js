var util = {
  
  debug: true,
  cycleIdx: 0,
  
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
  
  /**
   *  pushBlock

   *    -> "block" as in "an obstacle to progress", not "a set of things"

   *    This function is for handling concurrent events that all relate
   *  to one class of ui blocking. Once all blocks are cleared, 300ms
   *  is waited before releasing the group key.
   *    During these 300ms, if another block is pushed using the same
   *  group key, the 300ms timer is stopped, and begins again only once
   *  all blocks under that group key are cleared.
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

    var blocks = _.map(group, function (val) { return val; });
    if (!_.any(blocks)) {
      this.groups[timer_key] = setTimeout(function () {
        self.release(group_key);
        $('#emulator .loader-overlay').hide();
      }, releaseDelay);
    }
  },
  
  reserveWidget: function (widget,force) {
    $('#emulator .loader-overlay').show();
    // TODO: use a combination of id and name once starting
    // to implement multiple copies of the same widget
    return (!this.busy['ui'] || force) && this.reserve('widget:' + widget.get('name'));
  },
  
  releaseWidget: function (widget) {
    this.release('widget:' + widget.get('name'));
    $('#emulator .loader-overlay').hide();
  },
  
  reserveUI: function () {
    $('#emulator .loader-overlay').show();
    var reservations = _.map(this.busy, function (isReserved) { return isReserved; });
    return !_.any(reservations) && this.reserve('ui');
  },
  
  isUIFree: function () {
    var reservations = _.map(this.busy, function (isReserved) { return isReserved; });
    util.log('ui free?',!_.any(reservations) && this.reserve('ui',false));
    return !_.any(reservations) && this.reserve('ui',false);
  },
  
  pushUIBlock: function (block_key) {
    this.pushBlock('ui',block_key);
  },
  
  clearUIBlock: function (block_key) {
    this.clearBlock('ui',block_key);
  },
  
  releaseUI: function () {
    $('#emulator .loader-overlay').hide();
    this.release('ui');
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
    return _(word).chain().map(util.scrubChar).value().join('');
  },
  
  scrubChar: function (c) {
    if (c.match(/[a-z0-9]/)) return c;
    return null;
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
      , period = (hour < 12) ? 'am' : 'pm'
      , minuteStr = (minute < 10 ? '0' : '') + minute
      , hourStr   = (convertedHour < 10 ? '0' : '') + convertedHour
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
  
  getTemplate: function (name) {
    return _.template($('#templates .'+name).html());
  },
  
  getInputElements: function (elem,selector) {
    selector = selector || '';
    return elem.find(selector + ' input,textarea');
  },
  
  newWidget: function (data) {
    return new window.widgetClasses[data.wtype](data);
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
  
  resetCycle: function () {
    util.cycleIdx = 0;
  },
  
  cycle: function () {
    return arguments[(util.cycleIdx++) % arguments.length];
  },
  
  // Only works with plain objects, and
  // only error checks for Arrays
  calcLevelDepth: function (obj) {
    if (typeof obj !== "object") return 0;
    
    var depths = [1];
    for (var k in obj) {
      var child = obj[k];
      if (child instanceof Array) continue;
      if (typeof child === "object")
        depths.push(1 + this.calcLevelDepth(child));
    }
    return _.max(depths);
  },
  
  catOrder: function (cat) {
    return parseInt( cat.substring(cat.lastIndexOf('|')+1) );
  },
  
  catName: function (cat) {
    return cat.substring(0,cat.lastIndexOf('|'));
  },
  
  catNamesFromLevel: function (level) {
    return _(level).chain().keys().reject(util.eq('_items'))
      .sortBy(function (c) { return util.catOrder(c); })
      .map(function (c) { return util.catName(c); }).value();
  },
  
  fullCatFromName: function (level,catName) {
    var cats = _.without(_.keys(level),'_items')
      , escapedName = util.regexEscape(catName)
      , detectRegex = new RegExp('^' + escapedName + '\\|[0-9]+$')
    ;
    return _.detect(cats,function (c) { return !!c.match(detectRegex) });
  },
  
  dialog: function (html,buttons) {
    $(html).dialog({
      resizable: false,
      modal: true,
      draggable: false,
      buttons: buttons
    });
  },
  
  regexEscape: function (str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  },
  
  log: function () {
    if(!this.debug) return;
    if(!window.console || !window.console.log) return;
    
    console.log.apply(console,arguments);
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
  }
}

// useful extensions
Array.prototype.swap = function (x,y) {
  var temp = this[x];
  this[x] = this[y];
  this[y] = temp;
  return this;
};
