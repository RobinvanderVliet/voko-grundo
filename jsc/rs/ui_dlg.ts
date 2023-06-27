
/*
 (c) 2016 - 2023 ĉe Wolfram Diestel
 laŭ GPL 2.0
*/

//x/ <reference types="@types/jqueryui/index.d.ts" />

import * as u from '../u';
import * as x from '../x';

import { xpress } from '../x';
import { DOM, Dialog, Menu, Grup, Slip, Elektil, Propon, Valid, Eraro } from '../ui';

import { Artikolo } from './ui_art';
import { Erarolisto } from './ui_err';

import { XMLReferenco, XMLReferencGrupo, XMLRimarko, XMLEkzemplo, 
         XMLFonto, XMLSenco, XMLDerivaĵo, XMLBildo, SncŜablono } from './sxabloniloj';

import { show_error_status, surmetita_dialogo } from './ui_err.js';
//import { xpress } from './jquery_ext';

type NovaArt = { dos: string, rad: string, fin: string, dif: string };
//type ShargArt = { dosiero: string };

// aldonu al jQuery UI dialog proprajn metodojn
// bezonatajn en la redaktilaj dialogoj
console.debug("Instalante la dialogfunkciojn...");


export default function() {
    
    //>>>>>>>> dialogo: Nova artikolo
    new Dialog("#krei_dlg", {
        kampoj: {
            dos: "#krei_dos",
            rad: "#krei_rad",
            fin: "#krei_fin",
            dif: "#krei_dif"    
        },
        buttons: { 
            "Krei": function() { 
                const dlg = Dialog.dialog("#krei_dlg");
                if (dlg) {
                    const art = <NovaArt>(dlg.valoroj());
                    Artikolo.artikolo("#xml_text")?.nova(art);
                    DOM.al_v("#re_radiko",art.rad);
                    DOM.al_t("#dock_eraroj",'');
                    DOM.al_t("#dock_avertoj",'');
                    dlg.fermu();    
                }
            },
            "\u2718": function() { this.fermu(); }
        },
        open: function() {
            // ĉar tiu change_count ankaŭ sen vera ŝanĝo altiĝas, 
            // ni permesu ĝis 2 lastajn ŝanĝojn sen averti
            const cc = Artikolo.artikolo("#xml_text")?.change_count();
            if ( cc && cc > 2 ) {
                DOM.al_html("#krei_error","Averto: ankoraŭ ne senditaj ŝanĝoj en la nuna artikolo perdiĝos kreante novan.")
                DOM.kaŝu("#krei_error",false);
            } else {
                DOM.kaŝu("#krei_error");
            }
        }
    });
    new x.XKlavaro("#krei_butonoj","krei_dlg","#krei_dif",
        undefined, // kiuradiko, provizore redonu stultaĵon
        function(event,ui) {
            if (ui.cmd == "blankigo") {
                DOM.al_v("#krei_dlg input","");
                DOM.al_v("#krei_dif","");
            }
        },
        undefined); // postenmeto
        /*
    $( "#krei_butonoj").Klavaro({
        artikolo: $("#xml_text"),
        posedanto: "#krei_dlg",
        akampo: "#krei_dif",
        reĝimpremo: function(event,ui) {
            if (ui.cmd == "blankigo") {
                $("#krei_dlg input").val("");
                $("#krei_dif").val("");
            }
        }
    });
    */
    DOM.klavpremo("#krei_rad",xpress);
    DOM.klavpremo("#krei_dif",xpress);

    //>>>>>>>> dialogo: Artikolon ŝargi
    new Dialog("#shargi_dlg", {
        kampoj: {
            dosiero: "#shargi_dosiero"
        },
        buttons: {
            "Ŝargi": function(event) { 
                event.preventDefault();
                if (! Valid.valida("#shargi_dosiero")) return;
                const values = Dialog.dialog("#shargi_dlg")?.valoroj();
                download_art(values.dosiero,"#shargi_error","#shargi_dlg");
                DOM.al_t("#dock_eraroj",'');
                DOM.al_t("#dock_avertoj",'');
                //this.fermu() 
            },
            "\u2718": function() { this.fermu(); } 
        },
        open: function() {
            // ĉar tiu change_count ankaŭ sen vera ŝanĝo altiĝas, 
            // ni permesu ĝis 2 lastajn ŝanĝojn sen averti
            const cc = Artikolo.artikolo("#xml_text")?.change_count() || 0; 
            if (DOM.v("#xml_text") && cc > 2) {
                $("#shargi_error").html("Averto: ankoraŭ ne senditaj ŝanĝoj en la nuna artikolo perdiĝos kreante novan.")
                DOM.kaŝu("#shargi_error",false);
            } else {
                DOM.kaŝu("#shargi_error");
            }

            $("#shargi_sercho").selectAll();
        }
    });
    DOM.klavpremo("#shargi_sercho",xpress);
    new Propon("#shargi_sercho", {
        source: shargi_sercho_autocomplete,
        select: function(event,ui) { 
            DOM.al_v("#shargi_dosiero",ui.item.art+'.xml'); 
        }   
    });
    Valid.aldonu("#shargi_sercho", {
        pattern: {
            regex: /^[a-zA-Z 0-9ĉĝĥĵŝŭĈĜĤĴŜŬ-]+$/,
            message: "La serĉesprimo konsistu nur el esperantaj literoj, ciferoj, streketo kaj spacsignoj. "+
                     "Interpunkcioj kaj apostrofo ne estas permesitaj."
        },
        err_to: "#shargi_error"
    });
    Valid.aldonu("#shargi_dosiero", {
        pattern: {
            message: "La dosiernomo (krom xml-finaĵo) konsistu el almenaŭ unu litero kaj eble pliaj: " +
                     "simplaj literoj kaj ciferoj",
            regex: /^[a-zA-Z][0-9_a-zA-Z]*(\.xml)?$/
        },
        err_to: "#shargi_error"
    });

    //>>>>>>>> dialogo: Lastaj redaktoj
    new Dialog("#lastaj_dlg", {
        kampoj: {
            dosiero: "#lastaj_mesagho",
        },
        position: { my: "top", at: "top+10", of: window },
        buttons: [
            { 
                text: "Reredakti",
                id: "lastaj_reredakti",
                disabled: true,
                click: function(event) {  
                    event.preventDefault();
                    if (! Valid.valida("#lastaj_dosiero")) return;
                    if ($("#lastaj_dosiero").data("rezulto") != "eraro") {
                        DOM.al_t("#lastaj_error","Vi povas reredakti nur artikolojn, ĉe kiuj "
                        + "troviĝis eraro dum traktado de la redaktoservo.");
                        DOM.kaŝu("#lastaj_error",false);
                        return;
                    } else {
                        var url = $("#lastaj_dosiero").data("url");
                        var dos = DOM.v("#lastaj_dosiero");
                        download_url(url,dos,"#lastaj_error","#lastaj_dlg");
                        DOM.al_t("#dock_eraroj",'');
                        DOM.al_t("#dock_avertoj",'');
                        //this.fermu() 
                    }
                }
            },
            {
                text: "\u25f1",
                click: function() { this.refaldu(); }
            },
            {
                text: "\u2718",
                click: function() { this.fermu(); }
            }
        ], 
        open: function() {
            //this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...
            Dialog.dialog("#lastaj_dlg")?.faldu(false);
            plenigu_lastaj_liston();            
            DOM.kaŝu("#lastaj_error",false);
        }
    });    
    Valid.aldonu("#lastaj_dosiero", {
        pattern: {
            message: "Bonvolu elekti artikolon en la listo por malfermi.",
            regex: /^[a-zA-Z][0-9_a-zA-Z]*(\.xml)?$/
        },
        err_to: "#lastaj_error"
    });
    $( "#lastaj_tabelo" ).on("click","td",lastaj_tabelo_premo);
    DOM.klak("#lastaj_rigardu",
        function(event) {
            event.preventDefault();
            var url = event.target.data("url");
            window.open(url);
        });


    //>>>>>>>> dialogo: Artikolon sendi tra servilo
    new Dialog("#sendiservile_dlg", {
        buttons: { 
            "Submeti": sendi_artikolon_servile,
            "(Sendi)": sendi_artikolon_servile,
            "\u2718": function() { this.fermu(); }
        }, 
        open: function() {
            DOM.kaŝu("#sendiservile_error");
            const art = Artikolo.artikolo("#xml_text");
            const komt = DOM.i("#sendiservile_komento");
            if (komt) {
                if (art?.opcioj["reĝimo"] == "aldono") {
                    komt.value = DOM.v("#krei_dos") || '';
                    komt.disabled = true;
                } else {
                    komt.value = '';
                    komt.disabled = false;
                }            
            }
        }
    });
    Valid.aldonu("#sendiservile_komento", {
        nonemtpy: "Necesas doni mallongan priskribon de viaj ŝanĝoj. Kion vi redaktis?",
        pattern: {
            regex: /^[\x20-\x7E\xC0-\xFF\u0100-\u017F]+$/,
            message: "En la priskribo nur latinaj signoj estas permesitaj."
        },
        err_to: "#sendiservile_error"
    });   
   
    ///>>>>>>>> dialogo: Enmeti referencon
    new Dialog("#referenco_dlg", {
        kampoj: {
            tip: "#referenco_tipo",
            grp: "#referenco_grp",
            cel: "#referenco_celo",
            lst: "#referenco_listo",
            enh: "#referenco_enhavo"
        },
        buttons: { 
            "Enmeti la referencon": referenco_enmeti,
            "\u25f1": function() { this.refaldu() ;},
            "\u2718": function() { this.fermu(); }
        }, 
        open: function() {
            DOM.kaŝu("#referenco_error");
            this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...
            // se io estas elektita jam serĉu
            var sel = Artikolo.xmlarea("#xml_text")?.selection();
            if (sel) {
                DOM.al_v("#referenco_celo",'');
                DOM.al_v("#referenco_enhavo",'');
                DOM.al_v("#referenco_sercho",sel);
                Propon.propon("#referenco_sercho")?.proponu();
            }
        }
    }); 
    DOM.klavpremo("#referenco_listo",xpress);
    DOM.klavpremo("#referenco_sercho",xpress);
    DOM.klavpremo("#referenco_enhavo",xpress);

    Valid.aldonu("#referenco_sercho", {
        err_to: "#referenco_error",
        pattern: {
            regex: /^[a-zA-Z 0-9ĉĝĥĵŝŭĈĜĤĴŜŬ\-]+$/,
            message: "La serĉesprimo konsistu nur el esperantaj literoj, ciferoj, streketoj kaj spacsignoj. " +
                     "Interpunkcioj kaj apostrofo ne estas permesitaj."
        }
    });
    const ref_lst = DOM.i("#referenco_listo");

    if (ref_lst) ref_lst.disabled = ( DOM.v("#referenco_tipo") != 'lst');
    DOM.ŝanĝo( "#referenco_tipo",function() {
        if (ref_lst) {
            if (DOM.v("#referenco_tipo") == 'lst') {
                ref_lst.disabled = false;
            } else {
                DOM.al_v("#referenco_listo",'');
                ref_lst.disabled = true;
            }    
        }
    });    
    plenigu_referenco_listojn();
    new Propon( "#referenco_sercho", {
        source: referenco_sercho_autocomplete,
        select: function(event,ui) {
            var item = ui.item;
            var enhavo = item.num == "" ? item.kap : item.kap + "<sncref/>";
            DOM.al_v("#referenco_celo",item.mrk);
            DOM.al_v("#referenco_enhavo",enhavo);
        }   
    });
      
    //>>>>>>>> dialogo: Enmeti ekzemplon
    new Dialog("#ekzemplo_dlg", {
        kampoj: {
            frazo: "#ekzemplo_frazo",
            bib: "#ekzemplo_bib",
            vrk: "#ekzemplo_vrk",
            aut: "#ekzemplo_aut",
            url: "#ekzemplo_url",
            lok: "#ekzemplo_lok"
        },
        buttons: {   
            "Enmeti la ekzemplon": function(event) { ekzemplo_enmeti(event,false); },
            "... nur la fonton": function(event) { ekzemplo_enmeti(event,true); },
            "\u25f1": function() { this.refaldu(); },
            "\u2718": function() { this.fermu(); }
        },
        open: function() {
            DOM.kaŝu("#ekzemplo_error");
            this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...
        }
    });  
    plenigu_ekzemplo_bib();
    new x.XKlavaro("#ekzemplo_butonoj","#ekzemplo_dlg","#xml_text",
        undefined, 
        function(event,ui) {
            if (ui.cmd == "blankigo") {
                DOM.al_v("#ekzemplo_dlg input","");
                DOM.al_v("#ekzemplo_frazo","");
            }
        },
        undefined);

    DOM.klavpremo("#ekzemplo_frazo",xpress);
    DOM.klavpremo("#ekzemplo_bib",xpress);
    DOM.klavpremo("#ekzemplo_vrk",xpress);
    DOM.klavpremo("#ekzemplo_aut",xpress);
    DOM.klavpremo("#ekzemplo_lok",xpress);
    
    //>>>>>>>> dialogo: Enmeti bildon
    new Dialog("#bildo_dlg", { 
        kampoj: {
            url: "#bildo_url",
            aut: "#bildo_aut",
            prm: "#bildo_prm",
            fnt: "#bildo_fnt",
            fmt: "#bildo_fmt",
            frazo: "#bildo_frazo"
        },
        buttons: {   
            "Enmeti la bildon": function(event) { bildo_enmeti(event,false); },
            "\u25f1": function() { this.refaldu(); },
            "\u2718": function() { this.fermu(); }
        },
        open: function() {
            DOM.kaŝu("#bildo_error");
            this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...

            if (parseFloat(DOM.v("#bildo_fmt")||'') > 1) {
                bildo_larĝecoj([640,320],640); // eble ankaŭ 800?
            } else {
                bildo_larĝecoj([576,360,180],360); // eble ankaŭ 450, 768?
            }
            Elektil.refreŝigu("#bildo_lrg input");
        },
        valorŝanĝo: function() {
            if (parseFloat(DOM.v("#bildo_fmt")||'') > 1) {
                bildo_larĝecoj([640,320],640); // eble ankaŭ 800?
            } else {
                bildo_larĝecoj([576,360,180],360); // eble ankaŭ 450, 768?
            }
            Elektil.refreŝigu("#bildo_lrg input");
        }
    });

    Elektil.kreu("#bildo_lrg input");
    new Grup("#bildo_lrg");
    new x.XKlavaro("#bildo_butonoj","#bildo_dlg","#bildo_frazo",
        undefined,
        function(event,ui) {
            if (ui.cmd == "blankigo") {
                DOM.al_v("#bildo_dlg input[type!='radio']","");
                DOM.al_v("#bildo_frazo","");
            }
        },
        undefined);
    DOM.klavpremo("#bildo_frazo",xpress);

    ///>>>>>>>> dialogo: Enmeti derivaĵon
    new Dialog("#derivajho_dlg", {
        kampoj: {
            kap: "#derivajho_kap",
            dif: "#derivajho_dif",
            loko: "#derivajho_listo"
        },
        buttons: {   
            "Enmeti la derivaĵon": derivajho_enmeti, 
            "\u25f1": function() { this.refaldu(); },
            "\u2718": function() { this.fermu(); }
        },
        open: function() {
            plenigu_derivajxojn();
            DOM.kaŝu("#derivajho_error");
            this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...
        }
    });
    new x.XKlavaro("#derivajho_butonoj","#derivajho_dlg","#derivajho_dif",
        undefined,
        function(event,ui) {
            if (ui.cmd == "blankigo") {
                DOM.al_v("#derivajho_dlg input","");
                DOM.al_v("#derivajho_dif","");
            }
        },
        undefined);
    /*
    $("#derivajho_butonoj").Klavaro({
        artikolo: $("#xml_text"),
        posedanto: "#derivajho_dlg",
        akampo: "#derivajho_dif",
        reĝimpremo: function(event,ui) {
            if (ui.cmd == "blankigo") {
                $("#derivajho_dlg input").val("");
                $("#derivajho_dif").val("");
            }
        }
    });
    */
    DOM.klavpremo("#derivajho_kap",xpress);
    DOM.klavpremo("#derivajho_dif",xpress);

    //>>>>>>>> dialogo: Enmeti sencon
    new Dialog("#senco_dlg", {
        kampoj: {
            mrk: "#senco_mrk",
            dif: "#senco_dif"
        },
        buttons: {   
            "Enmeti la sencon": senco_enmeti,
            "\u25f1": function() { this.refaldu(); },
            "\u2718": function() { this.fermu(); }
        },
        open: function() {
            DOM.kaŝu("#senco_error");
            this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...
        }
    });
    new x.XKlavaro("#senco_butonoj","#senco_dlg","#senco_dif",
        undefined,
        function(event,ui) {
            if (ui.cmd == "blankigo") {
                DOM.al_v("#senco_dlg input","");
                DOM.al_v("#senco_dif","");
            }
        },
        undefined)
    /*
    $( "#senco_butonoj").Klavaro({
        artikolo: $("#xml_text"),
        posedanto: "#senco_dlg",
        akampo: "#senco_dif",
        reĝimpremo: function(event,ui) {
            if (ui.cmd == "blankigo") {
                $("#senco_dlg input").val("");
                $("#senco_dif").val("");
            }
        }
    });
    */
    DOM.klavpremo("#senco_dif",xpress);

    //>>>>>>>> dialogo: Enmeti tradukojn
    plenigu_lingvojn();
    new Dialog("#traduko_dlg", {
        position: { my: "top", at: "top+10", of: window },
        buttons: {   
            "Enmeti la tradukojn": function(event) { tradukojn_enmeti(event); },
            "\u2718": function() { this.fermu(); }
        },
        open: function() {
            DOM.kaŝu("#traduko_error");
            //$("#traduko_tradukoj").data("trd_shanghoj",{});
            plenigu_lingvojn_artikolo();
            Menu.refreŝigu("#traduko_menuo");
            // jam difinita en ui_kreo... var preflng = pref_lngoj? pref_lngoj[0] : 'en'; // globala variablo
            const preflng = globalThis.preflng;
            fill_tradukojn(preflng,DOM.t("#trd_pref_"+preflng));
            // adaptu altecon de la tabelo
            const view_h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            const dlg = DOM.e("#traduko_dlg")?.parentElement;
            if (dlg) {
                const tbar_h = +(dlg.querySelector(".ui-dialog-titlebar") as HTMLElement).style.height|| 0;
                const pane_h = +(dlg.querySelector(".ui-dialog-buttonpane") as HTMLElement).style.height|| 0;
                const tab_h = (view_h * 0.80) - tbar_h - pane_h;
                const tab_div = DOM.e(".dlg_tab_div") as HTMLElement;
                tab_div.style.height = ""+tab_h;            
            }
        }
    }); 
    new Menu("#traduko_menuo", {
        items: "> :not(.ui-widget-header)",
        select: shanghu_trd_lingvon
    });  
    $( "#traduko_tabelo" ).on("blur","input",traduko_memoru_fokuson);
    $( "#traduko_butonoj" ).on("click","div",traduko_butono_premo);

    //>>>>>>>> dialogo: Enmeti per ŝablono
    plenigu_sxablonojn();
    new Dialog("#sxablono_dlg", {
        buttons: {   
            "Enmeti la tekston": sxablono_enmeti,
            "\u25f1": function() { this.refaldu(); },
            "\u2718": function() { this.fermu(); }
        },
        open: function() {
            DOM.kaŝu("#sxablono_error");
            this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...
        }
    });
    new x.XKlavaro("#sxablono_butonoj","#sxablono_dlg",'', undefined, undefined, undefined);
    /*
    $( "#sxablono_butonoj").Klavaro({
        artikolo: $("#xml_text"),
        posedanto: "#sxablono_dlg",
        akampo: ""
    });
    */
    DOM.ŝanĝo("#sxablono_elekto",kiam_elektis_sxablonon);     
    new Grup(".controlgroup-vertical", { "direction": "vertical" });

    //>>>>>>>> dialogo: Enmeti rimarkon
    new Dialog("#rimarko_dlg", {
        kampoj: {
            aut: "#rimarko_aut",
            rim: "#rimarko_rim",
            adm: "#rimarko_adm"
        },
        buttons: {   
            "Enmeti la rimarkon": function(event) { 
                event.preventDefault();
                const indent=2;
                var rim = Dialog.valoroj("#rimarko_dlg");
                rim.rim = x.linirompo(rim.rim.replace(/~/g,'<tld/>'),indent);
                rim.elm = rim.adm ? 'adm' : 'rim';                   
                var rimstr = new XMLRimarko(rim,rim.elm).xml(indent*2);
                Artikolo.artikolo("#xml_text")?.insert(rimstr);
                Dialog.fermu("#rimarko_dlg");
                this.fermu();
            },
            "\u25f1": function() { this.refaldu(); },
            "\u2718": function() { this.fermu(); }
        },
        open: function() {
            DOM.kaŝu("#rimarko_error");
            this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...
        }
    });
    new x.XKlavaro("#rimarko_butonoj","#riarko_dlg","#rimarko_rim",
        undefined,
        function(event,ui) {
            if (ui.cmd == "blankigo") {
                DOM.al_v("#rimarko_dlg input","");
                DOM.al_v("#rimarko_rim","");
            }
        },
        undefined)
    /*
    $( "#rimarko_butonoj").Klavaro({
        artikolo: $("#xml_text"),
        posedanto: "#riarko_dlg",
        akampo: "#rimarko_rim",
        reĝimpremo: function(event,ui) {
            if (ui.cmd == "blankigo") {
                $("#rimarko_dlg input").val("");
                $("#rimarko_rim").val("");
            }
        }
    });
    */
    DOM.klavpremo("#rimarko_rim",xpress);

    /*
    //>>>>>>>> dialogo: Kontroli > homonimojn
    $( "#homonimo_dlg" ).dialog({
        kampoj: {
            dosiero: "#homonimo_dos",
        },
        position: { my: "top", at: "top+10", of: window },
        buttons: {
            "Ŝargi": function(event) { hom_art_shargi(event) },
            "\u25f1": function() { this.refaldu() },
            "\u2718": function() { $( this ).dialog( "close" ) }  
        },
        open: function() {
            this.faldu(false); // necesas, se la dialogo estis fermita en faldita stato...
            plenigu_homonimo_liston();            
            $("#homonimo_error").show();  
        }
    });  
    $( "#homonimo_tabelo" ).on("click","td.hom_art",homonimo_tabelo_premo);
              */


    //>>>>>>>> eraro-dialogo
    new Dialog("#error_dlg", {
        buttons: { 
            "Resaluti": function() { location.href='../auth/logout'; },
            "\u2718": function() { this.fermu(); }
        },
        open: () => { DOM.kaŝu("#error_msg",false); }
    });

    //>>>>>>>> surmetitta dialogo ekz. por deklaro pri datumprotekto, klarigoj/helpo ks
    new Dialog("#surmetita_dlg", {
        position: { my: "left top", at: "left+20 top+20", of: window },
        // @ts-ignore maxWidth estas deklarita kiel /number/ - ignoru tion aŭ redeklaru ie...
        maxWidth: "90%" 
    });
}  


//*********************************************************************************************
//* Helpfunkcioj por dialogoj 
//*********************************************************************************************



export function shargi_sercho_autocomplete(request,response) {
    DOM.al_v("#shargi_dosiero",'');
    if (! Valid.valida("#shargi_sercho")) return;
/*    
      if (! validate_pattern(/^[a-zA-Z 0-9ĉĝĥĵŝŭĈĜĤĴŜŬ]+$/,$("#shargi_sercho"),$("#shargi_error"),
                             "La serĉesprimo konsistu nur el esperantaj literoj, ciferoj kaj spacsignoj. Interpunkcioj kaj apostrofo ne estas permesitaj.")) {
          return;
      }
      */
    
      var sercho = request.term; //$("#referenco_secho").val();
      var results: Array<any> = [];
    
  //    $("body").css("cursor", "progress");
      //$.post(
        u.HTTPRequest('post',"revo_sercho", 
            { 
                sercho: sercho,
                lng: "eo" 
            }, 
            function(data, status, xhr) {   
                if (xhr.status == 302) {
                    // FIXME: When session ended the OpenID redirect 302 is handled behind the scenes and here we get openid/login with status 200
                    show_xhr_error(xhr,"Via seanco finiĝis. Bonvolu resaluti!");
                } else {
                    var i;
                    for (i=0; i<data.length; i++) {
                       var label = (data[i].num != "")? data[i].kap + " " + data[i].num : data[i].kap;
                       results[i] = { 
                           value: label, 
                           art: data[i].art
                       }; 
                    }
                }
                response(results);
            },
            () => document.body.style.cursor = 'wait',
            () => document.body.style.cursor = 'auto',
            show_xhr_error //"#shargi_error")
            );
/*            
        .fail (
            function(xhr) {
                console.error(xhr.status + " " + xhr.statusText);
                if (xhr.status == 400) {
                    $("#shargi_error").html('Pardonu, jen malbona serĉesprimo. Ĝi ne enhavu interpunkcion aŭ eĉ apostrofon.')
                } else {
                    var msg = "Pardonu, okazis netandita eraro: ";
                    $("#shargi_error").html( msg + xhr.status + " " + xhr.statusText + xhr.responseText);
                };
                $("#shargi_error").show()  
        })
        .always(
               function() {
                   $("body").css("cursor", "default");
                   response(results)
               });
               */
}

export function show_xhr_error(xhr,msg_prefix="Eraro:",msg_suffix='') {
    const msg_infix = xhr.status + " " + xhr.statusText + 
        (xhr.responseText? " " + xhr.responseText.substring(0,100) : "");
    console.error(msg_infix);
    // alert(xhr.status + " " + xhr.statusText); 
    const msg = "Ho ve, okazis eraro: " 
     + xhr.status + " " + xhr.statusText + " " + xhr.responseText;
    DOM.al_html("#error_msg", msg_prefix +  "<br/>" + msg_infix + "<br/>" +  msg_suffix);
    Dialog.dialog("#error_dlg")?.malfermu();    
}


function download_art(dosiero,err_to,dlg_id,do_close=true) {
    
    var fin = dosiero.slice(-4);
    if (fin == '.xml') {
        dosiero = dosiero.slice(0,-4);
    }

    u.HTTPRequest('post',"revo_artikolo", {
          data: { art: dosiero }
      },
        function(data) {   
            if (data.slice(0,5) == '<?xml') {
                const art = Artikolo.artikolo("#xml_text");
                const xmlarea = Artikolo.xmlarea("#xml_text");
                art?.load(dosiero,data);
                DOM.al_v("#re_radiko",xmlarea?.getRadiko()||'');
                // $("#collapse_outline").accordion("option","active",0);
                $(err_to).hide();
                Slip.montru("#tabs",0);
                
                if (do_close) {
                    Dialog.fermu(dlg_id);
                } else {
                    Dialog.dialog(dlg_id)?.faldu();
                }
            } else {
                var msg = "Okazis neatendita eraro: ";
                $(err_to).html("Okazis eraro, supozeble necesas resaluti.");
            }
        },
        () => document.body.style.cursor = 'wait',
        () => document.body.style.cursor = 'auto',
        err_to
        );
}

function download_url(url,dosiero,err_to,dlg_id,do_close=true) {
    
    u.HTTPRequest('get', url, {}, 
        function(data) {   
            if (data.slice(0,5) == '<?xml') {
                const art = Artikolo.artikolo("#xml_text");
                if (art) art.load(dosiero,data);
                // $("#collapse_outline").accordion("option","active",0);
                DOM.kaŝu(err_to);
                Slip.montru("#tabs", 0);

                if (do_close) {
                    Dialog.fermu(dlg_id);
                } else {
                    Dialog.dialog(dlg_id)?.faldu();
                }
            } else {
                var msg = "Okazis neatendita eraro: ";
                Eraro.al(err_to,"Okazis eraro, supozeble necesas resaluti.");
            }
        },
        () => document.body.style.cursor = 'wait',
        () => document.body.style.cursor = 'auto',
        err_to
    );
}


function sendi_artikolon_servile(event) {
    event.preventDefault();
    // $("#sendiservile_error").hide();
    const trg = event.target;
    const metodo = DOM.t(event.target) == 'Submeti'? 'api' : 'email';
    
    // aldono (t.e. nova artikolo) aŭ redakto (t.e. ŝanĝo)
    const reĝimo = Artikolo.artikolo("#xml_text")?.opcioj["reĝimo"];
    const art_mrk = Artikolo.xmlarea("#xml_text")?.getDosiero();

    // ĉe novaj artikoloj komento entenas la dosiernomon
    if (! Valid.valida("#sendiservile_komento")) return;

    const komento = DOM.v("#sendiservile_komento") || '';
    const dosiero = (reĝimo == 'aldono')? komento : art_mrk; //$("#xml_text").Artikolo("art_drv_mrk"); 
    const xmlarea = Artikolo.xmlarea("#xml_text");

    if (xmlarea) {

        u.HTTPRequest('post', "revo_sendo", {
                xml: xmlarea.normalizedXml(),
                shangho: komento,
                redakto: reĝimo||'',
                metodo: metodo,
                dosiero: dosiero||''
            },
            function(data) {   
                // Montru sukceson...
                const art = Artikolo.artikolo("#xml_text");
                if (art) {
                    const dosiero = art.opcioj["dosiero"];
                    art._change_count = 0;    
                    
                    const url=data.html_url;
                    const msg = "<b>'" + dosiero  + "'</b> sendita. " +
                    (metodo == 'api'
                    ? "Kelkajn tagojn vi trovas vian redakton <a target='_new' href='"+url+"'>tie ĉi ĉe Github</a> kaj sub 'Lastaj...'."
                    : "Bv. kontroli ĉu vi ricevis kopion de la retpoŝto.\n(En tre esceptaj okazoj la spam-filtrilo povus bloki ĝin...)"
                    );
                    Erarolisto.aldonu("#dock_eraroj", {
                        id: "art_sendita_msg",
                        cls: "status_ok",
                        msg: msg
                    });
                    //alert("Sendita. Bv. kontroli ĉu vi ricevis kopion de la retpoŝto.\n(En tre esceptaj okazoj la spam-filtrilo povus bloki ĝin...)");
                    Dialog.fermu("#sendiservile_dlg");
                    //$("#xml_text").val('');
                    xmlarea.setText('');
                    $("#shargi_dlg input").val("");
                }
            },
            undefined,
            undefined,
            (msg: string) => Eraro.al("#sendiservile_error",msg)
        );
    }
/*
      $("body").css("cursor", "progress");
      $.post(
            "revo_sendo", 
            //{ art: $("shargi_dosiero").val() },
            { xml: $("#xml_text").val(),
              shangho: komento,
              redakto: reĝimo})
        .done(
            function(data) {   
                alert("Sendita. Bv. kontroli ĉu vi ricevis kopion de la retpoŝto.\n(En tre esceptaj okazoj la spam-filtrilo povus bloki ĝin...)");
                $("#sendiservile_dlg").dialog("close");
                $("#xml_text").text('');
            })
        .fail (
            function(xhr) {
                console.error(xhr.status + " " + xhr.statusText);
                var msg = "Ho ve, okazis eraro: ";
                $("#sendiservile_error").html( msg + xhr.status + " " + xhr.statusText + xhr.responseText);
                $("#sendiservile_error").show()  
        })
        .always(
               function() {
                   $("body").css("cursor", "default");
               });
               */
}


function plenigu_referenco_listojn() {
    //$("body").css("cursor", "progress");
    //$.get('../voko/klasoj.xml')
    u.HTTPRequest('get','../voko/klasoj.xml',{},
            function(data) {  
                var seen = {}; // evitu duoblaĵojn
                new Propon("#referenco_listo", {
                    source: $("kls",data).map(
                        (i,e) => {
                            //console.log(this + " "+i+" "+e);
                            //console.log($(this).attr("nom"));
                            let nom = e.getAttribute("nom")?.split('#')[1];
                            let mrk = e.getAttribute("mrk");
                            let kap = e.getAttribute("kap");
                            if (nom) {                                
                                if (seen[nom]) {
                                    return false;
                                } else {
                                    seen[nom] = true;
                                    if (mrk) mrk = mrk.split('#')[1];
                                    return {value: nom, mrk: mrk, kap: kap};
                                }
                            }
                        }).get(),
                    select: referenco_listo_elekto
                });
            },
            () => document.body.style.cursor = 'wait',
            () => document.body.style.cursor = 'auto',
            (msg: string) => Eraro.al("#referenco_error",msg)
    );
}

function referenco_listo_elekto(event,ui) {
    if (ui.item.mrk) DOM.al_v("#referenco_sercho",'');
    if (ui.item.mrk) DOM.al_v("#referenco_celo",ui.item.mrk);
    if (ui.item.kap) DOM.al_v("#referenco_enhavo",ui.item.kap);
}

function referenco_sercho_autocomplete(request,response) {
    /*
      $("#referenco_error").hide();
    
      if (! validate_pattern(/^[a-zA-Z 0-9ĉĝĥĵŝŭĈĜĤĴŜŬ\-]+$/,$("#referenco_sercho"),$("#referenco_error"),
                             "La serĉesprimo konsistu nur el esperantaj literoj, ciferoj, streketoj kaj spacsignoj. Interpunkcioj kaj apostrofo ne estas permesitaj.")) {
          return;
      }
      */
      if (! Valid.valida("#referenco_sercho")) return; //Checks("check")) return;
    
      var sercho = request.term; //$("#referenco_secho").val();
      var results = Array();
    
      u.HTTPRequest('post', "revo_sercho", { sercho: sercho, lng: "eo" },
            function(data) {   
                // kap+num -> enhavo
                // mrk -> celo
                //var enhavo = (data.num != "")? data.kap + "<sncref/>" : data.kap;
                var i;
                for (i=0; i<data.length; i++) {
                   var d = data[i];
                   var label = d.kap; //(d.num != "")? d.kap + " " + d.num : d.kap;
                    
                   // ĉe pluraj sencoj aldonu numeron kaj lastan parton de mrk por pli bone distingi
                   if (d.num) {                        
                      label += " " + d.num + " [" + d.mrk.split('.').slice(2) + "]";
                   }
                   results[i] = { 
                       value: label, 
                       mrk: d.mrk, 
                       kap: d.kap, 
                       num: d.num };
                }
                response(results);
            },
            () => document.body.style.cursor = 'wait',
            () => document.body.style.cursor = 'auto',
            (msg: string) => Eraro.al("#referenco_error", msg)       
        );
}


function referenco_enmeti(event) {
    event.preventDefault();
    DOM.kaŝu("#referenco_error");
    //var refgrp = $( "#referenco_grp" ).is(':checked');
    var ref = Dialog.valoroj("#referenco_dlg");

    var refstr = '';

    if (ref.grp) {
        refstr = new XMLReferencGrupo(ref).xml();
    } else {
        refstr = new XMLReferenco(ref).xml();
    }
    
    var enmetu_en = Dialog.dialog("#referenco_dlg")?.opcioj['enmetu_en'] || "xml_text";
    if (enmetu_en == "xml_text") {
        Artikolo.artikolo("#xml_text")?.insert(refstr);
        //$("#"+enmetu_en).insert(refstr);
    } else {
        DOM.al_t("#"+enmetu_en,refstr.trim());
    }
    $("#"+enmetu_en).change();
      
    // post refgrp venos nuda referenco sekvafoje...
    const dlg = Dialog.dialog("#referenco_dlg");
    if (dlg) {
        if (ref.grp) {
            dlg.al_valoroj({grp: false, tip: "nuda"});
            DOM.al_v("#referenco_listo",'');
            const ref_lst = DOM.i("#referenco_listo")
            if (ref_lst) ref_lst.disabled = true;
            //$( "#referenco_grp" ).prop("checked",false);
            //$( "#referenco_tipo" ).val("nuda");
        };
        dlg.fermu();
    }
}

function plenigu_ekzemplo_bib() {
    //$("body").css("cursor", "progress");
    u.HTTPRequest('get','../voko/biblist.xml',{},
            function(data) {  
                new Propon("#ekzemplo_bib", {
                    source: $("vrk",data).map(
                        function(i,e) {
                            //console.log(this + " "+i+" "+e);
                            //console.debug($(this).children("bib").text() +  ": " + $(this).children("text").text());
                            return {
                                value: $(this).children("bib").text(),
                                label: $(this).children("text").text(),
                                url: $(this).children("url").text()
                            };
                        }).get()
                });
            },
            () => document.body.style.cursor = 'wait',
            () => document.body.style.cursor = 'auto',
            (msg: string) => Eraro.al("#ekzemplo_error",msg)
        );
}


function ekzemplo_enmeti(event, nur_fnt) {
    event.preventDefault();
    DOM.kaŝu("#ekzemplo_error");

    var values = Dialog.valoroj("#ekzemplo_dlg");
    var xmlstr = '';

    if (nur_fnt) {
        const indent=8;
        xmlstr = new XMLFonto(values).xml(indent);
    } else {
        const indent=2;
        values.frazo = x.linirompo(values.frazo,indent);
        xmlstr = new XMLEkzemplo(values).xml(indent+4);
    }
   
    // de kie vokiĝis la dialogo tien remetu la rezulton
    var enmetu_en = Dialog.dialog("#ekzemplo_dlg")?.opcioj['enmetu_en'] || "xml_text";
    if (enmetu_en == "xml_text") {
        Artikolo.artikolo("#xml_text")?.insert(xmlstr);
        // $("#"+enmetu_en).insert(xmlstr);
    } else {
        DOM.al_t("#"+enmetu_en,xmlstr.trim());
    }
    $("#"+enmetu_en).change();

    Dialog.fermu("#ekzemplo_dlg");
}


function bildo_enmeti(event, nur_fnt) {
    event.preventDefault();
    DOM.kaŝu("#bildo_error");

    let bld = Dialog.valoroj("#bildo_dlg");
    bld.lrg = DOM.v("#bildo_lrg input:checked") || 360;
    bld.fnt_dec = bld.fnt;
    bld.fnt = encodeURI(bld.fnt);
    // ne kodigu duoble, ekz. % al %25: bld.url = encodeURI(bld.url);
    const indent = 4;
    bld.frazo = x.linirompo(bld.frazo,indent);

    var bldstr = new XMLBildo(bld).xml(indent);
    const art = Artikolo.artikolo("#xml_text");
    if (art) art.insert(bldstr);
    //$("#xml_text").insert(bldstr);    
    //$("#xml_text").change();
    Dialog.fermu("#bildo_dlg");
}

function bildo_larĝecoj(lrg,chk) {
    DOM.ej("#bildo_lrg input").forEach((e) => {
        if (e instanceof HTMLInputElement) {
            e.checked = false;
            let l = parseInt(e.getAttribute("value")||'');
            const lbl = DOM.e("#bildo_lrg label[for='bildo_lrg_" + l + "']");
            if (lbl) {
                if (lrg.indexOf(l) >= 0) {
                    DOM.kaŝu(lbl,false);
                    if (l == chk) {
                        e.checked = true;
                    }
                } else {
                    DOM.kaŝu(lbl,true);
                }
            }
        }
    });
}

/**************** helpfunkcioj por derivajho-dialogo **********/

function plenigu_derivajxojn() {
    let drv_list = '';
    const xmlarea = Artikolo.xmlarea("#xml_text");

    if (xmlarea) for (let ero of xmlarea.xmlstruct.strukturo) {
        if (ero.el == 'drv') {
            const drv = ero.dsc.split(' ').slice(2).join(' ') || ero.dsc;
            drv_list += '<option value="'+ero.id+'">' + drv + '</option>';
        }
    }
    DOM.ej("#derivajho_listo option+option").forEach((o) => o.remove());
    DOM.e("#derivajho_listo")?.append(drv_list);
}

function derivajho_enmeti(event) {
    event.preventDefault();
    DOM.kaŝu("#derivajho_error");

    const xmlarea = Artikolo.xmlarea("#xml_text");    
        if (xmlarea) {
        // sinkronigu unue por certe ne perdi antaŭe faritajn ŝanĝojn
        xmlarea.sync();
        
        let values = Dialog.valoroj("#derivajho_dlg");
        //values.mrk = xmlArtDrvMrk($("#xml_text").val()); 
        const indent = 2;
        values.dif = x.linirompo(values.dif,indent);
        values.mrk = xmlarea.getDosiero(); 

        const drv = new XMLDerivaĵo(values);
        const art = Artikolo.artikolo("#xml_text");
        if (art) {
            if (values.loko == 'kursoro') {
                // enŝovu ĉe kursoro
                art.insert(drv.xml(),true);
            } else {
                // enŝovu post donita drv 
                art.insert_post(drv.xml(),values.loko);
            }
        }
        
        // ekredaktu la novan derivaĵon
        const mrk = drv.drv.mrk;    
        const s_id = xmlarea.changeSubtextMrk(mrk,false); // false: ne denove sinkronigu, 
                // kio povus perdigi ĵus aldonitan drv!
    }

    Dialog.fermu("#derivajho_dlg");
}

function senco_enmeti(event) {
    event.preventDefault();
    DOM.kaŝu("#senco_error");

    var snc = Dialog.valoroj("#senco_dlg");
    const indent=2;
    snc.dif = x.linirompo(snc.dif,indent);

    try{
        snc.drvmrk = Artikolo.artikolo("#xml_text")?.drv_before_cursor().mrk;
    } catch(e) {
          // donu aprioran valoron al mrk en kazo, ke la XML ne estas valida...
          snc.drvmrk = 'XXXXXXX.YYY';
          // avertu pri la eraro
          show_error_status(e);
    }
    const sncxml = new XMLSenco(snc).xml();
    
    Artikolo.artikolo("#xml_text")?.insert(sncxml,true);
    // $("#xml_text").insert(sncxml);
    // $("#xml_text").change();
    Dialog.fermu("#senco_dlg");
}


/***************** traduk-dialogo ********************************************************************/


// aldonu kompletan lingvoliston kaj preferatajn lingvojn al traduko-dialogo
function plenigu_lingvojn() {
    // @ts-ignore .fail() volas almenaŭ unu argumenton, sed ni rifuzas provizore...
    var p_pref = $.get('revo_preflng').fail();

    // prenu la lingvoliston el lingvoj.xml
    let p_lingvoj;
    u.HTTPRequest('get','../voko/lingvoj.xml',{},
        () => p_lingvoj = data,
        () => document.body.style.cursor = 'wait',
        () => document.body.style.cursor = 'auto',
        (msg: string) =>  Eraro.al("#traduko_error",msg)
    );

    $.when(p_pref,p_lingvoj)
         .done(
             function(pref_data,lingvoj_data) {

                //console.debug(pref_data);
                var pref_lngoj = pref_data[0];
                globalThis.preflng = pref_lngoj[0] || 'en'; // globala variablo (ui_kreo)
                 
                var lingvoj_a_b = '';
                var lingvoj_c_g = '';
                var lingvoj_h_j = '';
                var lingvoj_k_l = '';
                var lingvoj_m_o = '';
                var lingvoj_p_s = '';
                var lingvoj_t_z = '';
                var pref_lingvoj = '';

                // por ĉiu unuopa lingvo en lingvoj.xml post ordigo laŭ nomo
                const lingvoj = $("lingvo",lingvoj_data) as any; // TS ne kapablas rekoni JQuery<T> kiel Array
                    // kaj komplenas pri .sort - do ni artifike konvertas al "any"
                lingvoj.sort(jsort_lng).each(
                        function() {
                            var kodo =$(this).attr('kodo');
                            if (kodo != 'eo') {
                                if ($.inArray(kodo, pref_lngoj) > -1) {
                                    pref_lingvoj += '<li id="trd_pref_' + $(this).attr('kodo') + '"><div>' + $(this).text() + '</div></li>';
                                    /*
                                    if (kodo == preflng) {
                                        pref_lingvoj += '<li id="trd_pref_' + $(this).attr('kodo') + '"><div>' + $(this).text() + '</div></li>';
                                    } else {
                                        pref_lingvoj += '<option value="' + $(this).attr('kodo') + '">' + $(this).text() + '</option>';
                                    }
                                    */
                                    
                                } // else {
                                    var lnomo = $(this).text();
                                    var letter = lnomo.charAt(0);
                                    var lkodo = $(this).attr('kodo');
                                    if (letter >= 'a' && letter <= 'b')
                                        lingvoj_a_b += '<li id="trd_chiuj_' + lkodo + '"><div>' + lnomo + '</div></li>';
                                    else if (letter >= 'c' && letter <= 'g' || letter == 'ĉ' || letter == 'ĝ')
                                        lingvoj_c_g += '<li id="trd_chiuj_' + lkodo + '"><div>' + lnomo + '</div></li>';
                                    else if (letter >= 'h' && letter <= 'j' || letter == 'ĥ' || letter == 'ĵ')
                                        lingvoj_h_j += '<li id="trd_chiuj_' + lkodo + '"><div>' + lnomo + '</div></li>';
                                    else if (letter >= 'k' && letter <= 'l')
                                        lingvoj_k_l += '<li id="trd_chiuj_' + lkodo + '"><div>' + lnomo + '</div></li>';
                                    else if (letter >= 'm' && letter <= 'o')
                                        lingvoj_m_o += '<li id="trd_chiuj_' + lkodo + '"><div>' + lnomo + '</div></li>';
                                    else if (letter >= 'p' && letter <= 's' || letter == 'ŝ')
                                        lingvoj_p_s += '<li id="trd_chiuj_' + lkodo + '"><div>' + lnomo + '</div></li>';
                                    else if (letter >= 't' && letter <= 'z' || letter == 'ŭ')
                                        lingvoj_t_z += '<li id="trd_chiuj_' + lkodo + '"><div>' + lnomo + '</div></li>';
                                //}
                            }
                        });
                // $("#traduko_lingvoj").html(pref_lingvoj +  '<option disabled>────────────────────</option>' +lingvoj); 
                DOM.e("#traduko_aliaj")?.before(pref_lingvoj);
                DOM.e("#traduko_chiuj_a_b")?.append(lingvoj_a_b);
                DOM.e("#traduko_chiuj_c_g")?.append(lingvoj_c_g);
                DOM.e("#traduko_chiuj_h_j")?.append(lingvoj_h_j);
                DOM.e("#traduko_chiuj_k_l")?.append(lingvoj_k_l);
                DOM.e("#traduko_chiuj_m_o")?.append(lingvoj_m_o);
                DOM.e("#traduko_chiuj_p_s")?.append(lingvoj_p_s);
                DOM.e("#traduko_chiuj_t_z")?.append(lingvoj_t_z);
                Menu.refreŝigu("#traduko_menuo");
             }
        );
}

// aldonu la traduk-lingojn de la ŝargita artikolo al la traduko-dialogo (lingvo-elekto)
function plenigu_lingvojn_artikolo() {
    const xmlarea = Artikolo.xmlarea("#xml_text");
    const xml = xmlarea?.syncedXml() || '';

    var lng_nomoj = {};
    for (var kodo in x.traduk_lingvoj(xml)) {
        const lnomo = $("#trd_chiuj_"+kodo).children('div').text();
        lng_nomoj[lnomo] = kodo;
    }
    var lingvoj = Object.keys(lng_nomoj).sort(sort_lng);
    var lingvoj_html = '';
    for (var i=0; i<lingvoj.length; i++) {
        const lnomo = lingvoj[i];
        const kodo = lng_nomoj[lnomo];
        lingvoj_html += '<li id="trd_art_' + kodo + '"><div>' + lnomo + '</div></li>';
    }
    DOM.al_t("#traduko_artikolaj",'');
    DOM.e("#traduko_artikolaj")?.append(lingvoj_html);
//    $("#traduko_menuo[id^=trd_art_]").remove();
//    $("#traduko_artikolaj").after(lingvoj_html);
}

function traduko_memoru_fokuson(event) {
    $("#traduko_dlg").data("last-focus",this.id);
}

function traduko_butono_premo(event) {
    ////var text = $(this).attr("data-btn");
    var cmd = $(this).attr("data-cmd");
    //var form_element = $( document.activeElement );
    var form_element_id = $("#traduko_dlg").data("last-focus")
        .replace(/\./g,'\\\.')
        .replace(/\:/g,'\\\:') || '';

    if ( form_element_id ) {
        var element = $("#" + form_element_id);
        // var form_element = $("#ekzemplo_form input:focus");
    //    if (text) {
    //        element.insert(text);
    //    } else 
        var sel = element.textarea_selection();
        var s_ = '';
        if (cmd == "[]" || cmd == "()") {
            s_ = sel || "\u2026";
            s_ = ('<klr>' + ( sel[0] != cmd[0]? cmd[0]:"" ) 
                + s_ + ( sel[sel.length-1] != cmd[1]? cmd[1]:"" ) +  '</klr>');
        // elemento-klavo
        } else {
            s_ = sel || "\u2026";
            s_ = ('<' + cmd + '>' + s_ + '</' + cmd + '>');
        } 

        element.insert(s_);
        
        trd_input_shanghita(element[0]);
    }
}



// lingvoj - sort function callback for jQuery
function jsort_lng(a, b){
    //return ($(b).text()) < ($(a).text()) ? 1 : -1;    
   // try { // 2017-06: tio ankoraŭ ne bone funkcias, ekz. en Chromium "c" venos antaŭ "ĝ" ...?
    //    $(a).text().localeCompare($(b).text(), "eo"); 
    //} catch (e) {
        var at = DOM.t(a)||'';
        var bt = DOM.t(b)||'';
        var pos = 0,
          min = Math.min(at.length, bt.length);
        // ne perfekte sed pli bone ol ĉ, ĝ ... tute ĉe la fino...
        var alphabet = 'AaBbCĈcĉDdEeFfGĜgĝHĤhĥIiJĴjĵKkLlMmNnOoPpRrSŜsŝTtUŬuŭVvZz';

        while(at.charAt(pos) === bt.charAt(pos) && pos < min) { pos++; }
        return alphabet.indexOf(at.charAt(pos)) > alphabet.indexOf(bt.charAt(pos)) ?
          1 : -1;
   // }
}

// lingvoj - sort function callback for normal strings
function sort_lng(at, bt){
    //try { // 2017-06: tio ankoraŭ ne bone funkcias, ekz. en Chromium "c" venos antaŭ "ĝ" ...?
    //    at.localeCompare(bt, "eo"); 
    //} catch (e) {
        var pos = 0,
          min = Math.min(at.length, bt.length);
        // ne perfekte sed pli bone ol ĉ, ĝ ... tute ĉe la fino...
        var alphabet = 'AaBbCĈcĉDdEeFfGĜgĝHĤhĥIiJĴjĵKkLlMmNnOoPpRrSŜsŝTtUŬuŭVvZz';

        while(at.charAt(pos) === bt.charAt(pos) && pos < min) { pos++; }
        return alphabet.indexOf(at.charAt(pos)) > alphabet.indexOf(bt.charAt(pos)) ?
          1 : -1;
    //}
}


function fill_tradukojn(lng,lingvo_nomo) {
    // forigu antauajn eventojn por ne multobligi ilin...
    $("#traduko_tradukoj").off("click");
    $("#traduko_tradukoj").off("change");
    
    // ĉar la tradukdialogo montras samtempe ĉiam nur tradukojn de unu lingvo
    // ni kunfandas tiujn el la artikolo, kaj tiujn, kiuj jam estas
    // aldonitaj aŭ ŝanĝitaj en la dialogo
    // var trdoj = $("#xml_text").Artikolo("tradukoj",lng); 
    const xmlarea = Artikolo.xmlarea("#xml_text");
    if (xmlarea) {
        const xmltrad = xmlarea.xmltrad;
        xmltrad.preparu(xmlarea.xmlstruct);
        xmltrad.collectTrdAllStruct(lng);    
        //const trd_shanghoj = $("#traduko_tradukoj").data("trd_shanghoj") || {};

        let tableCnt = '';

        //if (trdoj) {

        // PLIBONIGU: estas neelegante tie pridemandi
        // .xmlstruct - pli bone xmlarea jam redonu la pretan
        // bezonatan strukturon por tradukprezento!
        //
        // Krom la uzo de semantikaj id-atributoj ne estas tro eleganta
        // pli bone kreu propran tradukoj-objekton kun insert, update ktp
        // kiu transprentas la administradon kaj aktualigadon...
        // ŝangojn oni devus skribi tiam nur se oni ŝanĝas lingvon aŭ enmetas tradukojn
        // en la dialogon ĝin fermante...
        for (let s of xmlarea.xmlstruct.strukturo) {
            if (['drv','subdrv','snc','subsnc'].indexOf(s.el) > -1) {
                const parts = s.dsc.split(':');
                let dsc = parts[1] || parts[0];
                if (s.el == 'snc' || s.el == 'subsnc' && parts[1]) {
                    const p = dsc.indexOf('.');
                    if (p>-1) dsc = dsc.slice(p);
                }
                if (s.el == 'drv') dsc = '<b>'+dsc+'</b>';
                tableCnt += '<tr class="tr_' + s.el + '"><td>' + dsc + '</td><td>';
            
                const trd = xmltrad.getStruct(lng,s.id);
                /*
                try {
                    // preferu jam ŝanĝitajn tradukojn
                    trd = trd_shanghoj[s.id][lng];
                } catch (e) {
                    // se ŝanĝoj ne ekzistas prenu tiujn el la XML-artikolo
                    trd = xmltrad.getStruct(lng,s.id); //trdoj[s.id];
                }*/
                
                if ( trd && trd.length ) {
                    for (let j=0; j<trd.length; j++) {
                        tableCnt += traduko_input_field(s.id,j,x.quoteattr(trd[j]));
                        tableCnt += "<br/>";
                    }
                } else {
                   tableCnt += traduko_input_field(s.id,0,'') + '<br/>';  
                }
                tableCnt += '</td>';
                tableCnt += '<td>' + traduko_add_btn(s.id) + '</td>';
                tableCnt += '</tr>';
            } // if drv..subsnc
        } // for s...
    //} // if trdj

        DOM.al_t("#traduko_lingvo",lingvo_nomo +" ["+lng+"]");
        $("#traduko_dlg").data("lng",lng);
        DOM.al_t("#traduko_tradukoj",'');

        // enigu traduko-kampojn
        DOM.al_html("#traduko_tradukoj",tableCnt);
    }
    

    // rimarku ĉiujn ŝanĝojn de unuopaj elementoj
    $("#traduko_tradukoj").on("change","input", trd_shanghita);
}

function trd_shanghita() {
    trd_input_shanghita(this);
}

function trd_input_shanghita(element) {
    const sid = element.id.split(':')[1];
    const lng = $("#traduko_dlg").data("lng");

    const xmlarea = Artikolo.xmlarea("#xml_text");
    const xmltrad = xmlarea?.xmltrad;   

    // prenu ĉiujn tradukojn kun tiu marko, ne nur la ĵus ŝanĝitane
    DOM.ej("#traduko_tradukoj input[id^='trd\\:" + sid + "\\:']").forEach( (e) => {
        var nro = e.id.split(':')[2];
        xmltrad?.putStruct(sid,lng,+nro,(e as HTMLInputElement).value);                               
    });
}

/*
function trd_put(mrk,lng,no,trd) {
    // PLIBONIGU: verŝajne estas pli efike meti aldonojn kaj ŝanĝojn 
    // al Xmlarea.tradukoj nun anstataŭ en aparta dlg-alpendo trd_shanghoj...
    var trd_shanghoj = $("#traduko_tradukoj").data("trd_shanghoj") || {};
    if (! trd_shanghoj[mrk]) trd_shanghoj[mrk] = {};
    if (! trd_shanghoj[mrk][lng]) trd_shanghoj[mrk][lng] = Array();

    trd_shanghoj[mrk][lng][no] = trd;
    $("#traduko_tradukoj").data("trd_shanghoj",trd_shanghoj);
}
*/

function traduko_input_field(mrk,nro,trd) {
    var id = "trd:" + mrk + ':' + nro; //.replace(/\./g,'\\\\.') + '_' + nro;
    return '<input id="' + id + '" type="text" name="' + id + '" size="30" value="' + trd + '"/>';
}

function traduko_add_btn(mrk) {
    const id = mrk; //.replace(/\./g,'\\\\.');
    const id_esc = mrk.replace(/\./g,'\\\.');
    DOM.klak("#trdadd\\:"+id_esc,function() {
        const first_input_of_mrk = DOM.i("#trd\\:" + id_esc + "\\:0");
        if (first_input_of_mrk) {
            const last_input_of_mrk = first_input_of_mrk?.parentElement?.querySelector("input:last-of-type");
            if (last_input_of_mrk) {
                const parts = last_input_of_mrk.id.split(':');
                const next_id = parts[0] + ':' + parts[1] + ':' + (parseInt(parts[2]) + 1);
                last_input_of_mrk.after('<br/><input id="' + next_id 
                    + '" type="text" name="' + next_id + '" size="30" value=""/>');
            }
        } // else: estu ĉiam almenaŭ unu eĉ se malplena kampo....
    });
    return '<button id="trdadd:' + id 
        + '" class="ui-button ui-widget ui-corner-all" title="Aldonu"><b>+</b></button>';
}

function shanghu_trd_lingvon(event,ui) {
    var id = ui.item.attr('id');
    if (id && id.slice(0,4) == "trd_") {
        var lng= id.split('_')[2];
        var lingvo_nomo = ui.item.text();
        //alert($("#traduko_lingvoj").val())
        fill_tradukojn(lng,lingvo_nomo);
    }
    $("#traduko_dlg").data("last-focus",'');
}

// enmetu ŝanĝitajn kaj aldonitajn tradukojn en la XML-artikolon
function tradukojn_enmeti(event) {
    // prenu la shanghitajn tradukojn
    //var trd_shanghoj = $("#traduko_tradukoj").data("trd_shanghoj"); 
    const art = Artikolo.artikolo("#xml_text");
    const trd_dlg = Dialog.dialog("#traduko_dlg")
    try {
        art?.enmetu_tradukojn(); //,trd_shanghoj);
        trd_dlg?.fermu();
    } catch (e) {
        Eraro.al("#traduko_error",e.toString());
    }
}

/***************** ŝablono-dialogo ********************************************************************/

function plenigu_sxablonojn() {
    var sxbl_list = '';
    for (let nomo in snc_sxablonoj) {
        sxbl_list += '<option>' + nomo + '</option>';
    }
    DOM.e("#sxablono_elekto")?.append(sxbl_list);
}

function kiam_elektis_sxablonon(event) {
    var sxbl = $("#sxablono_elekto").val() as string;
    DOM.al_t("#sxablono_xml",'');
    $("#sxablono_xml").off("keypress");
    $("#sxablono_xml").off("click");
    DOM.e("#sxablono_xml")?.append(new SncŜablono(sxbl).html());
    /*
    var lines = new SncŜablono(sxbl).form().split('\n');
    for (var i=0; i<lines.length; i++) {
        $("#sxablono_xml").append('<tr><td><b class="sxbl">&ndash;</b></td><td><pre class="line">'+lines[i]+'</pre></td></tr>');
    }
    */
    DOM.klak("#sxablono_xml button",sxablono_button_click);
    //$("#sxablono_xml input[type='checkbox']").click(sxablono_checkbox_click);
    DOM.klak("#sxablono_xml b.sxbl",sxablono_strike_click);
    DOM.klak("#sxablono_xml span.sxbl",sxablono_span_click);
    DOM.klavpremo("#sxablono_xml input",xpress);
}

function sxablono_button_click(event) {
    event.preventDefault(); 
    const text_span = event.target.closest("button").prev("span");
    const ref_dlg = Dialog.dialog("#referenco_dlg");
    const ekz_dlg = Dialog.dialog("#ekzemplo_dlg");

    if (text_span && ref_dlg) {
        if (text_span.innerHTML.startsWith('&lt;ref')) {
            ref_dlg.malfermu();
            ref_dlg.opcioj["enmetu_en"] = text_span[0].id;
            //referenco_dialogo(text_span[0].id);
        } else if (text_span.innerHTML.startsWith('&lt;ekz') && ekz_dlg) {
            ekz_dlg.opcioj["enmetu_en"] = text_span[0].id;
            ekz_dlg.malfermu();
            //ekzemplo_dialogo(text_span[0].id);
        }
    }
}


function sxablono_strike_click(event) {
    const text_line = event.target.closest("tr").querySelector("pre");
    const style = text_line.style["text-decoration-line"];
    text_line.style['text-decoration-line'] = (style == "none"?"line-through":"none");
}

function sxablono_span_click(event) {
  const text_span_id = event.target.id;
  const ref_dlg = Dialog.dialog("#referenco_dlg");
  const ekz_dlg = Dialog.dialog("#ekzemplo_dlg");

 // if (text_span_id.startsWith('o_')) {
//      var checkbox = $("#"+text_span_id).next("input[type='checkbox']");
//      checkbox.prop('checked',function(i,val){return !val});
//      $("#"+text_span_id).css("text-decoration-line",checkbox.prop('checked')?"none":"line-through"); 
//  } else 
  if (text_span_id.startsWith('r_') && ref_dlg) {
      //referenco_dialogo(text_span_id);
      ref_dlg.opcioj["enmetu_en"] = text_span_id;
      ref_dlg.malfermu();
  } else if (text_span_id.startsWith('e_') && ekz_dlg) {
      //ekzemplo_dialogo(text_span_id);
      ekz_dlg.opcioj["enmetu_en"] = text_span_id;
      ekz_dlg.malfermu();
    }
}

function sxablono_enmeti(event) {
    //$("#xml_text").insert($("#sxablono_xml").val());
    let text = '';
    DOM.ej("#sxablono_xml pre").forEach( (pre) => {
        //var cb = $(this).children("input[type='checkbox']");
        //if (cb.length == 0 || cb.prop('checked'))
        if ((pre as HTMLElement).style["text-decoration-line"] != "line-through") {
            text += pre.form_text() + "\n";
        }
    });

    const art = Artikolo.artikolo("#xml_text");
    art?.insert(text,true);
    // $("#xml_text").insert(text);
    // $("#xml_text").change();
    Dialog.fermu("#sxablono_dlg");
}

function plenigu_lastaj_liston() {
    u.HTTPRequest('get',"revo_lastaj_redaktoj",{},
        function(data, status, xhr) {   
            if (xhr.status == 302) {
                // FIXME: When session ended the OpenID redirect 302 is handled 
                // behind the scenes and here we get openid/login with status 200
                show_xhr_error(xhr,"Via seanco finiĝis. Bonvolu resaluti!");
            } else {
                var listo = '';
                var previous = null; //{kap: '', art1: '', art2: ''};
                
                for (let h=0; h< data.length; h++) {
                    var entry = data[h];
                    var status_icon;
                    switch (entry.rezulto) {
                        case 'eraro':
                            status_icon = '&#x26a0;';
                            break;
                        case 'konfirmo':
                            status_icon = '&#x2713;';
                            break;
                        default:
                            status_icon = '&#x23f2'; //'&#x2709;';
                    }

                    //if (! (previous && previous.kap == hom.kap && previous.art1 == hom.art2 && previous.art2 == hom.art1))
                    listo += '<tr class="last_art" id="'
                        + entry.id 
                        + '"><td>'
                        + entry.name.split('.')[0]
                        + '</a></td><td>'
                        + status_icon
                        + '</td><td>' 
                        + entry.created.substring(0,16).replace('T',' ') 
                        + '</td><td>' 
                        + entry.desc.split(':').slice(1).join(':')
                        + '</td></tr>';                    
                }
                
                DOM.al_html("#lastaj_listo",listo);
                $("#lastaj_listo").data("detaloj",data);
            }

            // adaptu altecon de la dialogo, por ke la listo ruliĝu sed la titolo kaj reir-butono montriĝu...
            //var dlg = $("#lastaj_dlg").parent();
            //var view_h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            //var decl_h = (view_h * .70) - dlg.children(".ui-dialog-titlebar").height(); // - dlg.children(".ui-dialog-buttonpane").height();
            //$("#lastaj_tabelo").height(decl_h);
        },
        () => document.body.style.cursor = 'wait',
        () => document.body.style.cursor = 'auto',
        show_xhr_error
    );
}


function lastaj_tabelo_premo(event) {
    event.preventDefault();
    const id = event.target.parentElement.id;
    const dtl = $("#lastaj_listo").data("detaloj");
    const entry = dtl.filter(function(e) { if (e.id == id) return e; });
    if (entry) {
        entry = entry[0];
        DOM.al_v("#lastaj_dosiero",entry.name);
        $("#lastaj_dosiero").data("url",entry.xml_url);
        $("#lastaj_rigardu").data("url",entry.html_url);
        $("#lastaj_dosiero").data("rezulto",entry.rezulto);
        if (entry.rezulto == 'eraro') {
            $("#lastaj_reredakti").button("enable");
        } else {
            $("#lastaj_reredakti").button("disable");
        }
        DOM.al_v("#lastaj_mesagho",'');
        if (entry.rez_url) {
            u.HTTPRequest('post',entry.rez_url,{},
                function(data) {  
                    var rez = JSON.parse(data); 
                    if (rez && rez.mesagho) {
                        var msg = rez.mesagho.replace(/\|\| */g,"\n").replace('[m ','[');
                        DOM.al_v("#lastaj_mesagho",msg);
                    }
                });
        } else if (! entry.rezulto) {
            DOM.al_v("#lastaj_mesagho",'Atendante traktadon...');
        }
    }
}

