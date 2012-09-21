/**
 * element_common.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */
function initCommonAttributes(e){var t=document.forms[0],n=tinyMCEPopup.editor.dom;setFormValue("title",n.getAttrib(e,"title")),setFormValue("id",n.getAttrib(e,"id")),selectByValue(t,"class",n.getAttrib(e,"class"),!0),setFormValue("style",n.getAttrib(e,"style")),selectByValue(t,"dir",n.getAttrib(e,"dir")),setFormValue("lang",n.getAttrib(e,"lang")),setFormValue("onfocus",n.getAttrib(e,"onfocus")),setFormValue("onblur",n.getAttrib(e,"onblur")),setFormValue("onclick",n.getAttrib(e,"onclick")),setFormValue("ondblclick",n.getAttrib(e,"ondblclick")),setFormValue("onmousedown",n.getAttrib(e,"onmousedown")),setFormValue("onmouseup",n.getAttrib(e,"onmouseup")),setFormValue("onmouseover",n.getAttrib(e,"onmouseover")),setFormValue("onmousemove",n.getAttrib(e,"onmousemove")),setFormValue("onmouseout",n.getAttrib(e,"onmouseout")),setFormValue("onkeypress",n.getAttrib(e,"onkeypress")),setFormValue("onkeydown",n.getAttrib(e,"onkeydown")),setFormValue("onkeyup",n.getAttrib(e,"onkeyup"))}function setFormValue(e,t){document.forms[0].elements[e]&&(document.forms[0].elements[e].value=t)}function insertDateTime(e){document.getElementById(e).value=getDateTime(new Date,"%Y-%m-%dT%H:%M:%S")}function getDateTime(e,t){return t=t.replace("%D","%m/%d/%y"),t=t.replace("%r","%I:%M:%S %p"),t=t.replace("%Y",""+e.getFullYear()),t=t.replace("%y",""+e.getYear()),t=t.replace("%m",addZeros(e.getMonth()+1,2)),t=t.replace("%d",addZeros(e.getDate(),2)),t=t.replace("%H",""+addZeros(e.getHours(),2)),t=t.replace("%M",""+addZeros(e.getMinutes(),2)),t=t.replace("%S",""+addZeros(e.getSeconds(),2)),t=t.replace("%I",""+((e.getHours()+11)%12+1)),t=t.replace("%p",""+(e.getHours()<12?"AM":"PM")),t=t.replace("%%","%"),t}function addZeros(e,t){var n;e=""+e;if(e.length<t)for(n=0;n<t-e.length;n++)e="0"+e;return e}function selectByValue(e,t,n,r,i){if(!e||!e.elements[t])return;var s=e.elements[t],o=!1;for(var u=0;u<s.options.length;u++){var a=s.options[u];a.value==n||i&&a.value.toLowerCase()==n.toLowerCase()?(a.selected=!0,o=!0):a.selected=!1}if(!o&&r&&n!=""){var a=new Option("Value: "+n,n);a.selected=!0,s.options[s.options.length]=a}return o}function setAttrib(e,t,n){var r=document.forms[0],i=r.elements[t.toLowerCase()];tinyMCEPopup.editor.dom.setAttrib(e,t,n||i.value)}function setAllCommonAttribs(e){setAttrib(e,"title"),setAttrib(e,"id"),setAttrib(e,"class"),setAttrib(e,"style"),setAttrib(e,"dir"),setAttrib(e,"lang")}function insertInlineElement(e){var t=tinyMCEPopup.editor,n=t.dom;t.getDoc().execCommand("FontName",!1,"mceinline"),tinymce.each(n.select("span,font"),function(t){(t.style.fontFamily=="mceinline"||t.face=="mceinline")&&n.replace(n.create(e,{"data-mce-new":1}),t,1)})}tinyMCEPopup.requireLangPack(),SXE={currentAction:"insert",inst:tinyMCEPopup.editor,updateElement:null},SXE.focusElement=SXE.inst.selection.getNode(),SXE.initElementDialog=function(e){addClassesToList("class","xhtmlxtras_styles"),TinyMCE_EditableSelects.init(),e=e.toLowerCase();var t=SXE.inst.dom.getParent(SXE.focusElement,e.toUpperCase());t!=null&&t.nodeName.toUpperCase()==e.toUpperCase()&&(SXE.currentAction="update"),SXE.currentAction=="update"&&(initCommonAttributes(t),SXE.updateElement=t),document.forms[0].insert.value=tinyMCEPopup.getLang(SXE.currentAction,"Insert",!0)},SXE.insertElement=function(e){var t=SXE.inst.dom.getParent(SXE.focusElement,e.toUpperCase()),n,r;if(t==null){var i=SXE.inst.selection.getContent();if(i.length>0){r=e,insertInlineElement(e);var s=tinymce.grep(SXE.inst.dom.select(e));for(var o=0;o<s.length;o++){var t=s[o];SXE.inst.dom.getAttrib(t,"data-mce-new")&&(t.id="",t.setAttribute("id",""),t.removeAttribute("id"),t.removeAttribute("data-mce-new"),setAllCommonAttribs(t))}}}else setAllCommonAttribs(t);SXE.inst.nodeChanged(),tinyMCEPopup.execCommand("mceEndUndoLevel")},SXE.removeElement=function(e){e=e.toLowerCase(),elm=SXE.inst.dom.getParent(SXE.focusElement,e.toUpperCase()),elm&&elm.nodeName.toUpperCase()==e.toUpperCase()&&(tinyMCE.execCommand("mceRemoveNode",!1,elm),SXE.inst.nodeChanged(),tinyMCEPopup.execCommand("mceEndUndoLevel"))},SXE.showRemoveButton=function(){document.getElementById("remove").style.display=""},SXE.containsClass=function(e,t){return e.className.indexOf(t)>-1?!0:!1},SXE.removeClass=function(e,t){if(e.className==null||e.className==""||!SXE.containsClass(e,t))return!0;var n=e.className.split(" "),r="";for(var i=0,s=n.length;i<s;i++)n[i]!=t&&(r+=n[i]+" ");e.className=r.substring(0,r.length-1)},SXE.addClass=function(e,t){return SXE.containsClass(e,t)||(e.className?e.className+=" "+t:e.className=t),!0};