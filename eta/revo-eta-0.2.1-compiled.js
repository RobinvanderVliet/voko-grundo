var resultCount=0;$(document).bind("mobileinit",function(){$.mobile.loader.prototype.options.html='<img src="hotu.gif" alt="rezonanta..."/>'});String.format=function(){for(var a=arguments[0],b=0;b<arguments.length-1;b++)a=a.replace(RegExp("\\{"+b+"\\}","gm"),arguments[b+1]);return a};String.prototype.endsWith=function(a){return this.substr(this.length-a.length)===a};String.prototype.startsWith=function(a){return this.substr(0,a.length)===a};
function translateMrk(a){var b=RegExp("_","g");return a.replace(/([^#]+)#([^_]+)_(.*)/,"$1/$2.html#$2.$3").replace(b,".")}function rezonoLigo(a){return"<input type='image' src='../smb/tezauro.png' alt='REZ' value='"+a+"'/>"}
function loadArticle(a,b){var c=$.mobile.path.parseUrl(b.link[0].href);$("#__article__").load("../art/"+c.filename+c.hash,function(a,c,h){a=$("#__legado__");$header=a.children(":jqmData(role=header)");$("[href='../stl/artikolo.css']").remove();$("#__article__ a[href^='#']").attr("data-ajax","false");$("#__article__ dt > a[href^='../tez/tz_']").remove();$("#__article__ a[href^='../tez/tz_']").replaceWith(function(){var a=$(this).parent().text(),a=a.replace(RegExp("[^\\w\\u00C0-\\u1FFF\\u2C00-\\uD7FF]",
"gm"),"");return rezonoLigo(a)});c=$("#__article__ > h1");c.detach();$header.find("h1").html(c.html());a.page();b.dataUrl="#__legado__";$.mobile.changePage(a,b)})}
function loadEditor(a,b){$("#__editor__").load("/cgi-bin/vokomail.pl?art=",function(c,d,f){c=$("#__redakti__");$header=c.children(":jqmData(role=header)");$("[href='../stl/artikolo.css']").remove();$("#__editor__ a[href^='#']").attr("rel","external");d=$("#article > h1");d.detach();$header.find("h1").html(d.html());c.page();b.dataUrl=a.href;$.mobile.changePage(c,b)})}
$(document).bind("pagebeforechange",function(a,b){if("string"===typeof b.toPage&&b.options.link){var c=$.mobile.path.parseUrl(b.toPage);"#__"!=c.hash.substr(0,3)?(loadArticle(c,b.options),a.preventDefault()):"#__redakti__"==c.hash&&(loadEditor(c,b.options),a.preventDefault())}});
function replaceX(a){a=$(a.target);var b=a.val();(a.id=$("#__cx__")).attr("checked")&&(b=b.replace(/c[xX]/g,"\u0109"),b=b.replace(/g[xX]/g,"\u011d"),b=b.replace(/h[xX]/g,"\u0125"),b=b.replace(/j[xX]/g,"\u0135"),b=b.replace(/s[xX]/g,"\u015d"),b=b.replace(/u[xX]/g,"\u016d"),b=b.replace(/C[xX]/g,"\u0108"),b=b.replace(/G[xX]/g,"\u011c"),b=b.replace(/H[xX]/g,"\u0124"),b=b.replace(/J[xX]/g,"\u0134"),b=b.replace(/S[xX]/g,"\u015c"),b=b.replace(/U[xX]/g,"\u016c"),b!=a.val()&&a.val(b))}
function injectSearchResult(a){for(var b=$("#__sercho__"),c='<div data-role="collapsible-set">',d=0;d<a.length;d++){for(var f=a[d],c=c+("<div data-role='collapsible'"+("eo"==f.lng1?" data-collapsed='false'":"")+">"),c=c+("<h2 class='ui-body-b ui-corner-all'>"+f.titolo+"</h2><ul class='ui-body-c ui-corner-all'>"),h=0;h<f.trovoj.length;h++){var e=f.trovoj[h],c=c+"<li>";0>e.mrk1.indexOf(".")&&(e.mrk1=e.art+"."+e.mrk1);c+="<a href='../art/"+e.art+".html#"+e.mrk1+"'>"+e.vrt1+"</a> ";e.mrk2&&(0>e.mrk2.indexOf(".")&&
(e.mrk2=e.art+"."+e.mrk2),c+="(<a href='../art/"+e.art+".html#"+e.mrk2+"'>"+e.vrt2+"</a>)");c+="</li>"}c+="</ul></div>"}c+="</div>";$("#__trovoj__").html(c);b.page();$.mobile.loading("hide")}
function submitSearchForm(a){a.preventDefault();var b=$("#__serchFormularo__");a=b.find('input[name="__serchajho__"]').val();b=b.find('input[name="__cx__"]').val();$.mobile.loading("show");$.post("/cgi-bin/sercxu-json.pl",{sercxata:a,cx:b},function(a){injectSearchResult(a)}).error(function(a,b,f){alert("Eraro dum ser\u0109o:"+f);$.mobile.loading("hide")})}
function groupReasonResult(a,b,c){for(var d={},f=0;f<a.length;f++){var h=a[f],e=d[h[b].value];e||(e={length:0,entries:{},get_any:function(){for(var a in this.entries)if(this.entries[a]instanceof Array)return this.entries[a][0]}},d[h[b].value]=e);var k=e.entries[h[c].value];k||(k=[],e.entries[h[c].value]=k,e.length++);k.push(h)}return d}
function injectReasoningResult(a,b){var c=$("#__rezonado__"),d="<div>";if(b.results.bindings&&b.results.bindings.length){var f=groupReasonResult(b.results.bindings,"s","trd"==a?"t":"ok");switch(a){case "sin":sentence_1="<a href='{0}'><em>{1}</em>{2}</a> nomi\u011das anka\u016d <a href='{3}'><em>{4}</em>{5}</a>{6}. ";sentence_n_s="<a href='{0}'><em>{1}</em>{2}</a> nomi\u011das anka\u016d ";sentence_n_o="<a href='{0}'><em>{1}</em>{2}</a>{3}";break;case "ant":sentence_1="<a href='{0}'><em>{1}</em>{2}</a> estas malo de <a href='{3}'><em>{4}</em>{5}</a>{6}. ";
sentence_n_s="<a href='{0}'><em>{1}</em>{2}</a> estas malo de ";sentence_n_o="<a href='{0}'><em>{1}</em>{2}</a>{3}";break;case "vid":sentence_1="<a href='{0}'><em>{1}</em>{2}</a> rilatas al <a href='{3}'><em>{4}</em>{5}</a>{6}. ";sentence_n_s="<a href='{0}'><em>{1}</em>{2}</a> rilatas al ";sentence_n_o="<a href='{0}'><em>{1}</em>{2}</a>{3}";break;case "super":sentence_1="<a href='{0}'><em>{1}</em>{2}</a> estas <a href='{3}'><em>{4}</em>{5}</a>{6}. ";sentence_n_s="<a href='{0}'><em>{1}</em>{2}</a> estas ";
sentence_n_o="<a href='{0}'><em>{1}</em>{2}</a>{3}";break;case "malprt":sentence_1="<a href='{0}'><em>{1}</em>{2}</a> apartenas al <a href='{3}'><em>{4}</em>{5}</a>{6}. ";sentence_n_s="<a href='{0}'><em>{1}</em>{2}</a> apartenas al ";sentence_n_o="<a href='{0}'><em>{1}</em>{2}</a>{3}";break;case "ekz":sentence_1="Ekzemplo de <a href='{0}'><em>{1}</em>{2}</a> estas <a href='{3}'><em>{4}</em>{5}</a>{6}. ";sentence_n_s="Ekzemploj de <a href='{0}'><em>{1}</em>{2}</a> estas: ";sentence_n_o="<a href='{0}'><em>{1}</em>{2}</a>{3}";
break;case "sub":sentence_1="Speco de <a href='{0}'><em>{1}</em>{2}</a> estas <a href='{3}'><em>{4}</em>{5}</a>{6}. ";sentence_n_s="Specoj de <a href='{0}'><em>{1}</em>{2}</a> estas: ";sentence_n_o="<a href='{0}'><em>{1}</em>{2}</a>{3}";break;case "prt":sentence_1="Al <a href='{0}'><em>{1}</em>{2}</a> apartenas <a href='{3}'><em>{4}</em>{5}</a>{6}. ";sentence_n_s="Al <a href='{0}'><em>{1}</em>{2}</a> apartenas: ";sentence_n_o="<a href='{0}'><em>{1}</em>{2}</a>{3}";break;case "trd":sentence_1="<a href='{0}'><em>{1}</em>{2}</a> en aliaj lingvoj nomi\u011das <em>{3}</em> ({4})</a>. ",
sentence_n_s="<a href='{0}'><em>{1}</em>{2}</a> en aliaj lingvoj nomi\u011das: ",sentence_n_o="<em>{0}</em> ({1})"}$.each(f,function(b,c){var g=c.get_any(),f=g.k.value;1==c.length?d+=String.format(sentence_1,translateMrk(g.s.value),"sub"==a||"ekz"==a||"prt"==a?f:f.substr(0,1).toUpperCase()+f.substr(1),g.sn?"<sup>"+g.sn.value+"</sup>":"","trd"==a?g.t.value:translateMrk(g.o.value),"trd"==a?g.l.value:g.ok.value,g.on?"<sup>"+g.on.value+"</sup>":"","trd"==a?"":rezonoLigo(g.ok.value)):(d+=String.format(sentence_n_s,
translateMrk(g.s.value),"sub"==a||"ekz"==a||"prt"==a?f:f.substr(0,1).toUpperCase()+f.substr(1),g.sn?"<sup>"+g.sn.value+"</sup>":""),$.each(c.entries,function(b,c){for(var e=0;e<c.length;e++)g=c[e],f=g.k.value,d+=String.format(sentence_n_o,"trd"==a?g.t.value:translateMrk(g.o.value),"trd"==a?g.l.value:g.ok.value,g.on?"<sup>"+g.on.value+"</sup>":"","trd"==a?"":rezonoLigo(g.ok.value)),d+=e<c.length-1?"/":", "}),d=d.substr(0,d.length-2)+". ");d+="<br/>"})}else if(resultCount-=1,0==resultCount)var f="\u011ci estas 42.;42;Kvardek du.;Sepoble ses.;Sesoble sep.;\u011ci estas nenio.;\u011ci estas ne tre interesa.;Mi laci\u011das.;Mi enuas.;Mi ne scias multe.;Hiera\u016d mi sciis ankora\u016d, kio \u011di estas, sed momente mi ne havas ideon.;Demandu min alian fojon, kio \u011di estas.;Demandu \u0109e la forumo revuloj@yahoogroups.com, kio \u011di estas.;Mi pensas, ke vi scias, kio \u011di estas. Kial vi do demandas min?;Redemandu alian fojon, kio \u011di estas.;Bela vetero hodia\u016d, \u0109u ne?;Se vi volas scii, kio \u011di estas, a\u0109etu PIVon, -- a\u016d \u0109e\u0125an bieron.;Vi amuzi\u011das pri mi, \u0109u?;Vi opinias, ke mi estas stulta, \u0109u ne?;Kiel pla\u0109as al vi mia robo?;Mi estas virino.;Mi scias pli da vortoj ol Zam\u0109jo.;Mi scias pli da vortoj ol Mazi man\u011das horlo\u011dojn!;Diable, mi ne scias \u0109ion!;\u011ci estas si mem.;\u011ci estas, kion vi tajpis.;\u011ci estas koncepto, eble.;\u011ci estas kelkaj literoj.;\u011ci estas serio de literoj.;\u011ci estas esprimo.".split(";"),
h=Math.floor(Math.random()*f.length),d=d+f[h];d+="</div>";$("#__rezonoj__"+a+"__").html(d);c.page();$.mobile.loading("hide")}function reason(a,b){$("#__rezonoj__"+a+"__").html("");$.post("/cgi-bin/revo-rezono.pl",{q:a,kap:b},function(b){injectReasoningResult(a,b)})}
function submitReasoningForm(a){a.preventDefault();if(rezonajho=$("#__rezonoFormularo__").find('input[name="__rezonajho__"]').val())resultCount=9,$.mobile.loading("show"),reason("sin",rezonajho),reason("super",rezonajho),reason("malprt",rezonajho),reason("sub",rezonajho),reason("sub",rezonajho),reason("prt",rezonajho),reason("trd",rezonajho),reason("ant",rezonajho),reason("vid",rezonajho)}
function reasonAbout(a){a.preventDefault();var b=$(a.target).val();rezonajho=$("#__rezonoFormularo__").find('input[name="__rezonajho__"]').val(b);submitReasoningForm(a)}$(document).on("keyup","#__sercho__",replaceX);$(document).on("keyup","#__rezonado__",replaceX);$(document).on("click","#__rezonu__",submitReasoningForm);$(document).on("keydown","#__rezonajho__",function(a){13==a.which&&submitReasoningForm(a)});
$(document).on("click","#__article__ input[alt='REZ']",function(){var a=$("#__rezonado__");$.mobile.changePage(a)});$(document).on("click","input[alt='REZ']",reasonAbout);$(document).on("click","#__trovu__",submitSearchForm);$(document).on("keydown","#__serchajho__",function(a){13==a.which&&submitSearchForm(a)});