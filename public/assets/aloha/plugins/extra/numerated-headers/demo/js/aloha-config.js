(function(e,t){var n=e.jQuery;if(e.Aloha===t||e.Aloha===null)e.Aloha={};e.Aloha.settings={logLevels:{error:!0,warn:!0,info:!0,debug:!1},errorhandling:!1,ribbon:!1,placeholder:{"*":'<img src="http://aloha-editor.org/logo/Aloha%20Editor%20HTML5%20technology%20class%2016.png" alt="logo"/>&nbsp;Placeholder All',"#typo3span":"Placeholder for span"},i18n:{current:"en"},repositories:{linklist:{data:[{name:"Aloha Developers Wiki",url:"http://www.aloha-editor.com/wiki",type:"website",weight:.5},{name:"Aloha Editor - The HTML5 Editor",url:"http://aloha-editor.com",type:"website",weight:.9},{name:"Aloha Demo",url:"http://www.aloha-editor.com/demos.html",type:"website",weight:.75},{name:"Aloha Wordpress Demo",url:"http://www.aloha-editor.com/demos/wordpress-demo/index.html",type:"website",weight:.75},{name:"Aloha Logo",url:"http://www.aloha-editor.com/images/aloha-editor-logo.png",type:"image",weight:.1}]}},plugins:{format:{config:["b","i","sub","sup"],editables:{"#title":[],div:["b","i","del","sub","sup"],".article":["b","i","p","title","h1","h2","h3","h4","h5","h6","pre","removeFormat"]}},list:{config:["ul"],editables:{"#title":["ol"],div:["ol"],".article":["ul"]}},link:{config:["a"],editables:{"#title":[]},targetregex:"^(?!.*aloha-editor.com).*",target:"_blank",cssclassregex:"^(?!.*aloha-editor.com).*",cssclass:"aloha",objectTypeFilter:["website"],onHrefChange:function(e,t,r){r&&n(e).attr("data-name",r.name)}},table:{config:[],editables:{".article":["table"]},tableConfig:[{name:"hor-minimalist-a"},{name:"box-table-a"},{name:"hor-zebra"}],columnConfig:[{name:"bigbold",iconClass:"GENTICS_button_col_bigbold"},{name:"redwhite",iconClass:"GENTICS_button_col_redwhite"}],rowConfig:[{name:"bigbold",iconClass:"GENTICS_button_row_bigbold"},{name:"redwhite",iconClass:"GENTICS_button_row_redwhite"}]},image:{config:{img:{max_width:"50px",max_height:"50px"}},editables:{"#title":{}}}}}})(window);