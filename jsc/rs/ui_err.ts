
/* 
 (c) 2016 - 2023 ĉe Wolfram Diestel
 laŭ GPL 2.0
*/

//x/ <reference types="@types/jqueryui/index.d.ts" />

import * as u from '../u';
import * as x from '../x';
import { DOM, UIElement, Eraro } from '../ui';

import { show_xhr_error } from './ui_dlg';
import { HTMLError } from './sxabloniloj';


interface XEraro extends Partial<x.LinePos> { id?: string, cls?: string, msg: string };

/*
declare global {

    interface JQuery {
        Erarolisto(opcioj: any);
        Erarolisto(methodName: "aldonu", e: Eraro);
        Erarolisto(methodName: "aldonu_liston", el: Array<Eraro>);
    }
}
*/


console.debug("Instalante la erar- kaj kontrolfunkciojn...");




export class Erarolisto extends UIElement {

    opcioj = {
        a_click: null
    };

    constructor(element, opcioj) {
        super(element, opcioj);

        this._on({
            "click li": this._click,
            "click a": function(event) { this._trigger("a_click",event,null); } 
        });
    };

    aldonu(err) { // err: {line: <l>, pos: <p>, msg: <text>}
        let added = false;
        /*
        var l = err.line || 0; // linio
        var p = err.pos || 0;  // posicio
        var v = l? (p? l+":"+p : l) : "=)"; // atributo value: kombino de linio kaj pozico aŭ ridulo
        var t = v? "linio "+v : ""; // atributo title
        var item =  '<li value="' + v + (t? '" title="' + t :"") + (err.id?' id="'+err.id+'"':'') + '">'  + err.msg  + '</li>';
        */
        if (err && err.msg) {
            const li = new HTMLError().html(err);
            const n_ = err.line? parseInt(err.line) : -1;
        //$("#kontrolo_list").fadeOut("fast", function() {
            // ni enŝovu la mesaĝon laŭ la ordo de linioj
            $("li",this.element).each(function(){
                if (parseInt($(this).attr("value") as string) > n_) {
                    $(this).before(li);
                // $("#kontrolo_list").fadeIn("fast");
                    added = true;
                    return false;
                }
            });
            // se ni ne jam enŝovis ie, ni alpendigas en la fino
            if ( !added ) {
                this.element.append(li);
            // $("#kontrolo_list").fadeIn("fast");
            }
       }
        //});
    };

    aldonu_liston(entries) {
        for (var i=0; i<entries.length; i++) {
            this.aldonu(entries[i]);
        }
    };

    
    _click(event) {
        // la atributo value de li donas la linion en la XML-teksto,
        // la atributo title de li donas line:pos
        if (event.target.localName != "a") {
            const line_pos = $(event.currentTarget).attr("value");
            const xmlarea = $("#xml_text").Artikolo("option","xmlarea");
            xmlarea.goto(line_pos);
            // okazigu eventon poziciŝanĝo ĉe Artikolo...
            $("#xml_text").Artikolo("option","poziciŝanĝo")(); 
        }
    };

};

export function xmlkontrolo() {
    const xmlarea = $("#xml_text").Artikolo("option","xmlarea");
    const xml_text = xmlarea.syncedXml(); //$("#xml_text").val();

  
    if (! xml_text ) {
        alert('Vi ankoraŭ ne ŝargis artikolon por kontroli!');
        return;
    }
 
    $("body").css("cursor", "progress");
    $.post(
          "revo_kontrolo", 
          //{ art: $("shargi_dosiero").val() },
          { xml: xml_text })
      .done(
          function(data) { 
              // se la listo de eraroj estas malplena la sintakso estas bona
              // malplena listo sendiĝas kiel [] aŭ [{}]
              if ( data.length === 0
                || data.length == 1 && Object.keys(data[0]).length === 0) {
                  data = [{ msg: "XML estas en ordo (sintakso).", cls: "status_ok" }];
              };
              const elisto = UIElement.obj("#dock_eraroj") as Erarolisto;
              if (elisto) elisto.aldonu_liston(
                data.map(err => 
                    {
                        if (err.msg) err.msg = x.quoteattr(err.msg); 
                        return err;
                    })
                );
          })
      .fail (
          function(xhr) {
              console.error(xhr.status + " " + xhr.statusText);
              if (xhr.status == 400) {
                   alert("Eraro dum kontrolado: " + xhr.responseText);
              } else {
                  show_xhr_error(xhr,"Ho ve, okazis eraro:",
                    "Supozeble via seanco forpasis kaj vi devas resaluti.");
              }
      })
      .always(
             function() {
                 $("body").css("cursor", "default");
      });

    // povas okazi dum atendi la rezulton de XML-kontrolo
    mrkkontrolo();
}


export function mrkkontrolo() {
    const art = $("#xml_text");
    const xmlarea = art.Artikolo("option","xmlarea");
    const xml = xmlarea.syncedXml(); //$("#xml_text").val();

    var mrkoj = art.Artikolo("markoj");
    for (let mrk in mrkoj) {
        if (mrkoj[mrk] > 1) {
            //alert("" + mrkoj[mrk] + "-obla marko: "+ mrk);
            let linpos = x.get_line_pos(mrkoj[mrk],xml);
            linpos.line++; linpos.pos+=2;
            let err = linpos as XEraro;
            (err as XEraro).msg = "marko aperas plurfoje: "+ mrk;
            const elisto = UIElement.obj("#dock_eraroj") as Erarolisto;
            if (elisto) elisto.aldonu(err);
        }
    }
    var sncoj = art.Artikolo("snc_sen_mrk");

    if (sncoj) {
        var drvoj = art.Artikolo("drv_markoj");
        var dmrk = 'xxx.0';

        for (let inx in sncoj) {
            let linpos = x.get_line_pos(parseInt(inx),xml);

            // trovu derivaĵon antaŭ tiu senco
            for(var i=drvoj.length-1; i>=0; i--) {
                let drv = drvoj[i];
                if (drv.line < linpos.line) {
                    dmrk = drv.mrk;
                    break;
                }
            }
    
            linpos.line++; linpos.pos++;
            let snc = linpos as XEraro;
            snc.msg = "senco sen marko, <span class='snc_mrk' title='aldonu'>aldonebla kiel: <a>"
                     + dmrk + "." + sncoj[inx] + "</a></span>";
            const elisto = UIElement.obj("#dock_avertoj") as Erarolisto;
            if (elisto) elisto.aldonu(snc);
        }
    }
}


export function klrkontrolo() {
    const art = $("#xml_text");
    const xmlarea = art.Artikolo("option","xmlarea");
    const xml = xmlarea.syncedXml(); //$("#xml_text").val();
    const klroj = art.Artikolo("klr_ppp");

    if (klroj) {
        for (let pos in klroj) {
            let linpos = x.get_line_pos(+pos,xml);
   
            linpos.line++; linpos.pos++;
            let klr = linpos as XEraro;
            klr.msg = "klarigo sen krampoj, <span class='klr_ppp' title='anstataŭigu'>anstataŭigebla per: <a>" +
                "&lt;klr&gt;[…]&lt;/klr&gt;</a></span>";
            const elisto = UIElement.obj("#dock_avertoj") as Erarolisto;
            if (elisto) elisto.aldonu(klr);
        }
    }
}


export function vortokontrolo() {

    var lines = $("#xml_text").Artikolo("lines_as_dict");

    var chunk_size = 20;
    var i = 0;
    var l_ = {};

    for (let n in lines) {
        l_[n]  = lines[n];
        i++;

        if (i == chunk_size) {
            kontrolu_liniojn(l_);
            i = 0; l_ = {};
        }
        //kontrolu_linion(parseInt(n),lines[n]);
    }
    // kontrolu eblan reston
    if (i < chunk_size) {
        kontrolu_liniojn(l_);
    }
}

function kontrolu_liniojn(lines) {   
    $("body").css("cursor", "progress");
    var k = Object.keys(lines);
    var id = "vktrl_"+k[0];
    // montru linion dum atendado...
    const elisto = UIElement.obj("#dock_avertoj") as Erarolisto;
    if (elisto) elisto.aldonu(<XEraro>{
        id: id, 
        line: +k[0],
        msg: "<span class=\"animated-dock-font\">kontrolante vortojn de linioj " + k[0] + ".." + k[k.length-1] + " ...</span>"
    });

    // redonu nur kontrolendajn analiz-rezultojn    
    lines.moduso = "kontrolendaj"; 
    $.alportu2(
        {
            url: "analinioj",
            //{ art: $("shargi_dosiero").val() },
            data: JSON.stringify(lines),
            contentType: 'application/json'
        })
      .done(
          function(data) {  
             //var html = n + ": " + data;
             // $("#kontrolo_ana").append(html);
             //var str = data.replace('---','\u2014');
             $("#"+id).remove();
             const elisto = UIElement.obj("#dock_avertoj") as Erarolisto;
             if (elisto) elisto.aldonu_liston(
                Object.keys(data).map(_ana2txt,data) as Array<XEraro>);

             /*
             for (n in data) {
                vrtkontrolo_aldonu_linion(n,data[n]); 
             }
             */
          })
       .fail (
            function(xhr) {
                console.error(xhr.status + " " + xhr.statusText);
                $("#"+id).html("Okazis erraro dum kontrolo: " + xhr.statusText);
          });
}

export function surmetita_dialogo(url, root_el, loc = '') {
    
    u.HTTPRequest('get', url, 
          {},
          function(data, status, xhr) {   
              if (xhr.status == 302) {
                  // FIXME: When session ended the OpenID redirect 302 is handled behind the scenes and here we get openid/login with status 200
                show_xhr_error(xhr,"Via seanco finiĝis. Bonvolu resaluti!");
              } else {
                  $("#surmetita").html(data);
                  $("#surmetita_dlg").dialog("option", "title", $("#surmetita h1").text());
                  $("#surmetita h1").remove("h1");
              }
              // adaptu altecon de la dialogo, por ke la deklaro ruliĝu sed la titolo kaj reir-butono montriĝu...
              var dlg = $("#surmetita_dlg").parent();
              var view_h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
              var decl_h = (view_h * 0.70) - dlg.children(".ui-dialog-titlebar").height(); // - dlg.children(".ui-dialog-buttonpane").height();
              $("#"+root_el).height(decl_h);

              $("#surmetita_dlg").dialog("open");

              window.location.hash=loc;
        },
        function() { $("body").css("cursor", "progress") },
        function() { $("body").css("cursor", "default"); },
        function(xhr) {
            console.error(xhr.status + " " + xhr.statusText);
            if (xhr.status == 400) {
                $("#surmetita_error").html('Pardonu, okazis eraro dum ŝargo de la dokumento.');
            } else {
                var msg = "Pardonu, okazis netandita eraro: ";
                $("#surmetita_error").html( msg + xhr.status + " " + xhr.statusText + xhr.responseText);
            }
            $("#surmetita_error").show(); 
        });
}

export function show_error_status(error) {
    //plenigu_xmleraro_liston([{"line": "nekonata", "msg": error.toString().slice(0,256)+'...'}]);
    const err: XEraro = {"line": -1, "msg": error.toString().slice(0,256)+'...'};
    const elisto = UIElement.obj("#dock_eraroj") as Erarolisto;
    if (elisto)  elisto.aldonu(err);

    $("#elekto_indikoj").hide();
    $("#dock_klavaro").show();
    $("#dock_kontrolo").show();
}

function _ana2txt(line) {
    var ana_arr = this[line]; 
    var txt = '';
    for(let i = 0; i<ana_arr.length; i++) {
        if (i>0) txt += "; ";
        const ana = ana_arr[i];
        txt += "<span class='" + ana.takso + "'>";
        txt += ana.analizo || ana.vorto;
        txt += "</span>";
        txt += " - kontrolinda ĉar <span class='ana_klarigo' data-takso='" + ana.takso + "'>";
        txt += ana.takso + " <a>\u24D8</a></span>";
    }
    return {line: line, msg: txt};
}
