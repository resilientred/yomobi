/**
 * Controls: Link plugin
 *
 * Depends on jWYSIWYG
 *
 * By: Esteban Beltran (academo) <sergies@gmail.com>
 */
(function ($) {
	"use strict";

	if (undefined === $.wysiwyg) {
		throw "wysiwyg.link.js depends on $.wysiwyg";
	}

	if (!$.wysiwyg.controls) {
		$.wysiwyg.controls = {};
	}

	/*
	* Wysiwyg namespace: public properties and methods
	*/
	$.wysiwyg.controls.link = {
		init: function (Wysiwyg) {
			var self = this, elements, dialog, url, a, selection,
				formLinkHtml, dialogReplacements, key, translation, regexp,
				baseUrl, img;

			dialogReplacements = {
				legend: "Insert Link",
				type  : "Type",
				url   : "Value",
				title : "Link Title",
				target: "Link Target",
				submit: "Insert Link",
				reset : "Cancel",
				url_op: "URL",
				email : "Email",
				phone : "Phone",
				address: "Address"
			};

			formLinkHtml =
				'<form class="wysiwyg addlink" title="{legend}" style="padding-top:30px">' +
				'<table>' +
				'<tr>' +
				'<td class="label"><label>{type}: </label></td>' +
				'<td><select name="linktype">' +
					'<option value="url">{url_op}</option>' +
					'<option value="email">{email}</option>' +
					'<option value="phone">{phone}</option>' +
					'<option value="address">{address}</option>' +
				'</select>' +
				'<a href="http://help.yomobi.com/Wysiwyg/LinkTypes" target="ymhelp"><img class="help-bubble" src="/images/ui/help-bubble.png" title=""></a>' +
				'</td></tr>' +
				'<tr>' +
				'<td class="label"><label>{url}: </label></td>' +
				'<td><input class="focus" type="text" name="linkhref" value=""/></td>' +
				'</tr></table>' +
				'<input type="text" name="linktitle" value="" style="display:none"/>' +
				'<input type="text" name="linktarget" value="" style="display:none" />' +
				'</form>';


			for (key in dialogReplacements) {
				if ($.wysiwyg.i18n) {
					// translation = $.wysiwyg.i18n.t(dialogReplacements[key], "dialogs.link");
					// yomobi-specific
					translation = g.i18n.wysiwyg.dialogs.link[key];

					// if (translation === dialogReplacements[key]) { // if not translated search in dialogs
					// 	translation = $.wysiwyg.i18n.t(dialogReplacements[key], "dialogs");
					// }

					dialogReplacements[key] = translation;
				}

				regexp = new RegExp("{" + key + "}", "g");
				formLinkHtml = formLinkHtml.replace(regexp, dialogReplacements[key]);
			}

			a = {
				self: Wysiwyg.dom.getElement("a"), // link to element node
				href: "",
				title: "",
				target: ""
			};

			if (a.self) {
				a.href = a.self.href ? a.self.href : a.href;
				a.title = a.self.title ? a.self.title : "";
				a.target = a.self.target ? a.self.target : "";
			}

			if ($.fn.dialog) {
				elements = $(formLinkHtml);
				elements.find("input[name=linkhref]").val(util.urlValue(a.href));
				elements.find("input[name=linktitle]").val(a.title);
				elements.find("input[name=linktarget]").val(a.target);

				var type = util.urlType(a.href);
				if (type != null)
					elements.find("select[name=linktype]").val(type);


				if ($.browser.msie) {
					try {
						dialog = elements.appendTo(Wysiwyg.editorDoc.body);
					} catch (err) {
						dialog = elements.appendTo("body");
					}
				} else {
					dialog = elements.appendTo("body");
				}


				var buttons = {};
				buttons[g.i18n.submit] = function (e,ui) {
					e.preventDefault();

					var type   = $('select[name="linktype"]', dialog).val(),
						url    = $('input[name="linkhref"]', dialog).val(),
						title  = $('input[name="linktitle"]', dialog).val(),
						target = $('input[name="linktarget"]', dialog).val(),
						baseUrl,
						img;

					if (Wysiwyg.options.controlLink.forceRelativeUrls) {
						baseUrl = window.location.protocol + "//" + window.location.hostname;
						if (0 === url.indexOf(baseUrl)) {
							url = url.substr(baseUrl.length);
						}
					}

					url = util.ensureUrl(url, type);

					if (a.self) {
						if ("string" === typeof (url)) {
							if (url.length > 0) {
								// to preserve all link attributes
								$(a.self).attr("href", url).attr("title", title).attr("target", target);
							} else {
								$(a.self).replaceWith(a.self.innerHTML);
							}
						}
					} else {
						if ($.browser.msie) {
							Wysiwyg.ui.returnRange();
						}

						//Do new link element
						selection = Wysiwyg.getRangeText();
						img = Wysiwyg.dom.getElement("img");

						if ((selection && selection.length > 0) || img) {
							if ($.browser.msie) {
								Wysiwyg.ui.focus();
							}

							if ("string" === typeof (url)) {
								if (url.length > 0) {
									Wysiwyg.editorDoc.execCommand("createLink", false, url);
								} else {
									Wysiwyg.editorDoc.execCommand("unlink", false, null);
								}
							}

							a.self = Wysiwyg.dom.getElement("a");

							$(a.self).attr("href", url).attr("title", title);

							/**
							 * @url https://github.com/akzhan/jwysiwyg/issues/16
							 */
							$(a.self).attr("target", target);
						} else if (Wysiwyg.options.messages.nonSelection) {
							window.alert(Wysiwyg.options.messages.nonSelection);
						}
					}

					Wysiwyg.saveContent();

					$(dialog).dialog("close");
				};

				buttons[g.i18n.close] = function (e) {
					e.preventDefault();
					$(dialog).dialog("close");
				};

				dialog.dialog({
					modal: true,
					buttons: buttons,
					close: function (ev, ui) {
						dialog.dialog("destroy");
						dialog.remove();
					}
				});
				setTimeout(function () {
		      dialog.find('.focus').focus();
		    }, 200);
			} else {
				if (a.self) {
					url = window.prompt("URL", a.href);

					if (Wysiwyg.options.controlLink.forceRelativeUrls) {
						baseUrl = window.location.protocol + "//" + window.location.hostname;
						if (0 === url.indexOf(baseUrl)) {
							url = url.substr(baseUrl.length);
						}
					}

					if ("string" === typeof (url)) {
						if (url.length > 0) {
							$(a.self).attr("href", url);
						} else {
							$(a.self).replaceWith(a.self.innerHTML);
						}
					}
				} else {
					//Do new link element
					selection = Wysiwyg.getRangeText();
					img = Wysiwyg.dom.getElement("img");

					if ((selection && selection.length > 0) || img) {
						if ($.browser.msie) {
							Wysiwyg.ui.focus();
							Wysiwyg.editorDoc.execCommand("createLink", true, null);
						} else {
							url = window.prompt(dialogReplacements.url, a.href);

							if (Wysiwyg.options.controlLink.forceRelativeUrls) {
								baseUrl = window.location.protocol + "//" + window.location.hostname;
								if (0 === url.indexOf(baseUrl)) {
									url = url.substr(baseUrl.length);
								}
							}

							if ("string" === typeof (url)) {
								if (url.length > 0) {
									Wysiwyg.editorDoc.execCommand("createLink", false, url);
								} else {
									Wysiwyg.editorDoc.execCommand("unlink", false, null);
								}
							}
						}
					} else if (Wysiwyg.options.messages.nonSelection) {
						window.alert(Wysiwyg.options.messages.nonSelection);
					}
				}

				Wysiwyg.saveContent();
			}

			$(Wysiwyg.editorDoc).trigger("editorRefresh.wysiwyg");
		}
	};

	$.wysiwyg.createLink = function (object, url) {
		return object.each(function () {
			var oWysiwyg = $(this).data("wysiwyg"),
				selection;

			if (!oWysiwyg) {
				return this;
			}

			if (!url || url.length === 0) {
				return this;
			}

			selection = oWysiwyg.getRangeText();

			if (selection && selection.length > 0) {
				if ($.browser.msie) {
					oWysiwyg.ui.focus();
				}
				oWysiwyg.editorDoc.execCommand("unlink", false, null);
				oWysiwyg.editorDoc.execCommand("createLink", false, url);
			} else if (oWysiwyg.options.messages.nonSelection) {
				window.alert(oWysiwyg.options.messages.nonSelection);
			}
			return this;
		});
	};
})(jQuery);
