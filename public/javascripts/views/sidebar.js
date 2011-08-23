(function ($) {
  
  var singletonInUseTooltip = "You may only use <b>one</b> of this type of widget at a time.<br /><br />This widget is already in your YoMobi mobile website.";
  var unsavedChangesText = "You have unsaved changes. Click OK to go back and save changes. Click Cancel to discard your changes.";

  SidebarView = Backbone.View.extend({
    
    el: $('#sidebar'),
    
    widgetTemplate: util.getTemplate('sidebar-widget'),

    events: {
      'click .edit-tab-bar': 'tellBappToEditTabBar',
      'click .edit-settings': 'tellBappToEditSettings',
      'click .edit-keywords': 'tellBappToEditKeywords',
      'click img.add': 'onClickAddIcon',
      'dblclick .home-icon': 'onDoubleClick'
    },
    
    initialize: function (options) {
      var self = this;
      _.bindAll(this,'render');

      this.widgets = options.widgets;
      this.widgets.bind('refresh',this.render);

      this.widgets.comparator = options.comparator;
      this.widgets.sort({ silent:true });
      
      this.el.find('.widgets .home-icon').live('mouseover',makeDraggable);
      if (!options.skipRender) this.render();
    },
    
    setSingletonInUse: function (widget,inUse) {
      var w = this.widgets.find(function (w) {
        return w.get('name') == widget.get('name') &&
               w.get('wtype') == widget.get('wtype');
      });
      w.set({ singletonInUse:inUse });
      this.render();
    },

    isSingletonInUse: function (name,wtype) {
      var w = this.widgets.find(function (w) {
        return w.get('name') == name && w.get('wtype') == wtype;
      });
      return w && w.get('singletonInUse');
    },
    
    singletonsInUse: function () {
      return this.widgets.select(function (w) { return !!w.get('singleton'); });
    },

    render: function () {
      var w_area = $('#sidebar .widgets').empty()
        , self = this
      ;

      this.widgets.each(function (widget) {
        // if (widget.get('singletonInUse')) return;
        var icon = self.widgetTemplate(widget.getIconData());
        w_area.append(icon);
        if (widget.get('singletonInUse')) {
          w_area.find('.home-icon:last')
            .addClass('singletonInUse')
            .simpletooltip(singletonInUseTooltip)
            .mousedown(function () { return false; })
          ;
        }
      });

      w_area.append('<div class="clearfix">');
    },

    onClickAddIcon: function (e) {
      bapp.sidebar.addNewWidgetViaTargetedElem( $(e.target).parent() );
    },

    onDoubleClick: function (e) {
      var target = $(e.target);
      if (!target.data('name')) target = target.parent();

      if (target.hasClass('singletonInUse')) return;
      bapp.sidebar.addNewWidgetViaTargetedElem( target );
    },

    addNewWidgetViaTargetedElem: function (targetedElem) {
      if (mapp.pageLevel != 0) {
        $('#dialog-invalid-drag').dialog({
          modal: true,
          buttons: {
            Ok: function () {
              $(this).dialog('close');
              $('#builder .drophover-overlay').hide();
            }
          }
        });
        return;
      }
      
      var editor = bapp.currentEditor;
      if (editor && editor.hasChanges()) {
        if (confirm(unsavedChangesText)) {
          $('#builder .drophover-overlay').hide();
          return false;
        }
        else {
          editor.onDiscardByNavigation();
          editor.stopEditing();
        }
      }
      
      var elem = $(targetedElem)
        , wtype = elem.data('wtype')
        , wsubtype = elem.data('wsubtype')
        , name = wsubtype
        , singleton = elem.hasClass('singleton')
      ;
      if(!elem.hasClass('sidebar')) return;
      
      util.log('dropped',name,wtype,wsubtype,singleton);
      bapp.addNewWidget(name,wtype,wsubtype,singleton);
    },

    tellBappToEditTabBar: function () { bapp.startEditingPanel('tabBar'); },
    tellBappToEditSettings: function () { bapp.startEditingPanel('settings'); },
    tellBappToEditKeywords: function () { bapp.startEditingPanel('keywords'); }
    
  });

  function makeDraggable () {
    $this = $(this);
    if ($this.data('init') || $this.hasClass('singletonInUse')) {
      return;
    }
    $this
      .data('init', true)
      .draggable({ helper:'clone', revert:'invalid', zIndex:99 })
      .disableSelection()
    ;
  }

})(jQuery);
