
/* jshint esversion: 6 */

// (c) 2020 - 2023 ĉe Wolfram Diestel
// laŭ GPL 2.0

const js_sojlo = 3; //30+3;
const ekz_sojlo = 3;
const sec_art = "s_artikolo";
const vokoref_url = "/cgi-bin/vokoref-json.pl";
const vikipedio_url = "https://eo.wikipedia.org/wiki/";
const fundamento_url = "https://www.steloj.de/esperanto/fundamento/";
const ofcaldonoj_url = "https://www.steloj.de/esperanto/ofcaldonoj/";
const art_path = "../art/";

//const KashEvento = new Event("kashu", {bubbles: true});
const MalkashEvento = new Event("malkashu", {bubbles: true});
const KomutEvento = new Event("komutu", {bubbles: true});

window.addEventListener("hashchange", function() {
    //console.log("hashchange: "+window.location.hash )
    //event.stopPropagation();
    //var id = this.getAttribute("href").split('#')[1];
    var id = getHashParts().mrk; // el: util.js
    if (id) {
        var trg = document.getElementById(id);

        // this.console.log("ni malkaŝu "+id);    
        if (trg && trg.tagName == "H2") {
            // ĉe derivaĵoj, la kaŝita div venos post h2
            const sec = trg.closest("section"); //parentElement;    
            trg = sec.querySelector("div.kasxebla");
        }
    
        //showContainingDiv(trg);
        //triggerEvent(trg,"malkashu");
        if (trg)
            trg.dispatchEvent(MalkashEvento);
        else
            this.console.error("ne troviĝis saltomarko '"+id+'"');
    }
});


/**
 * La nomspaco 'artikolo' kunigas ĉiujn funkciojn kaj variablojn, kiujn
 * ni uzas en la prezento de unuopa artikolo en Reta Vortaro.
 * @namespace {Function} artikolo
 */
var artikolo = function() {

    /**
     * Tio vokiĝas ĉe izolita prezento de la artikolo
     * kio fakte momente ne okazas, ĉar artikoloj referencas plu al v1b kaj ne al tiu ĉi
     * pli nova JS. Ni poste povos uzi tion por prepari la artikolon ĉe unuopa prezento
     * eble aŭtomate ankadrigante / transirante al la plenkadra prezento.
     * @memberof artikolo
     * @inner
     */
    when_doc_ready(function() {
        console.log("artikolo.when_doc_ready...:" + location.href);
        const fn = getUrlFileName(location.href);
        const art = fn.substring(0,fn.lastIndexOf('.')); 
        if (art) preparu_art(art);
        //enkadrigu();
    });

    /**
     * Preparas la artikolon: kaŝas kaseblajn aferojn, t.e. kunfaldas derivajojn krom unu, kaŝas 
     * ekzemploj krom po tri, kaŝas tradukojn krom preferatajn. Alligas la kodon por aktivaj elementoj
     * uzata por faldi-malfaldi.
     * @memberof artikolo
     * @param {string} artikolo - la doserinomo de la artikolo
     */
    function preparu_art(artikolo) {
        // evitu preparon, se ni troviĝas en la redaktilo kaj
        // la artikolo ne ĉeestas!
        if (! document.getElementById(sec_art)) return;

        // se la nuna staton de la tezaŭro estu videbla, ni tuj ŝargu ĝin... ĝi
        // kio ja povas daŭri sekundon...
        if (preferoj.seanco.tez_videbla) tezauro(artikolo);

        if (window.location.protocol != 'file:') {
            top.document.title='Reta Vortaro [' +
            document.getElementById(sec_art).getElementsByTagName("H1")[0].textContent.trim() +
            ']';
        }
        /* aktivigu nur por longaj artikoloj... */
        var d = document.getElementsByClassName("kasxebla");
         //if (d.length > js_sojlo) {
        piedlinio_modifo(artikolo);
        preparu_kashu_sekciojn();
        preparu_malkashu_fontojn();
        preparu_maletendu_sekciojn();
        kashu_malkashu_butonoj(artikolo);
        //interna_navigado();
        //etendu_ekzemplojn();   
        //}
    }

    /**
     * Trovas la plej proksiman H2-titolelementon (do la derivajon, en kiu ni troviĝas)
     * @memberof artikolo
     * @inner
     * @param {Element} element 
     * @returns La trovitan H2-elementon
     */
    function getPrevH2(element) {
        var prv = element.previousSibling;
        while ( prv && prv.nodeName != "H2") { prv = prv.previousSibling; }
        return prv;
    }

    
    /**
     * Kaŝas sekciojn de derivaĵoj, se la artikolo estas tro longa
     * kaj provizas ilin per ebleco remalkaŝi 
     * @memberof artikolo
     * @inner
     */
    function preparu_kashu_sekciojn() {
        var d = document.getElementsByClassName("kasxebla");

        // derivaĵo aŭ alia elemento celita kaj do montrenda
        var h = getHashParts().mrk; 
        var trg = h? document.getElementById(h) : null;
        var d_vid = trg? trg.closest("section.drv, section.fontoj").firstElementChild.id : null;

        var multaj = d.length > js_sojlo;
        var first = true;

        for (var el of d) {

            // forigu titolon "administraj notoj", se la sekcio estas malplena
            if (el.closest(".admin") && el.childElementCount == 0) {
                el.closest(".admin").textContent= '';
                continue;
            }
            
            // provizore ne bezonata: el.addEventListener("kashu", function(event) { kashu_drv(event.currentTarget) });
            el.addEventListener("malkashu", function(event) { 
                malkashu_drv(/** @type {Element}*/(event.currentTarget));
                event.stopPropagation();
            });
            el.addEventListener("komutu", function(event) { 
                kashu_malkashu_drv(/** @type {Element}*/(event.currentTarget));
                event.stopPropagation();
            });           

            var h2 = getPrevH2(el);
            if (h2) {

                h2.classList.add("kashilo");
                // ni kaŝas derivaĵon sub la sekvaj kondiĉoj:
                // 1. estas multaj derivaĵoj en la artikolo (vd. js_sojlo)
                // 2a. ne temas pri derivaĵo, al kiu ni celis rekte (per marko #, povas esti drv, snc, ekz, fnt)
                // 2b. aŭ ĝi ne estas la unua derivaĵo en la artikolo, kondiĉe ke ni ne celas al specifa derivaĵo 
                if ( multaj && (h && h2.id != d_vid) || (!h && !first) ) { 
                    // \u25be
                    h2.appendChild(ht_icon_button("i_mkash",
                        null,"malkaŝu derivaĵon"));
                    el.classList.add("kasxita");
                } else {
                    // "\u25b2"
                    h2.appendChild(ht_icon_button("i_kash",
                        null,"kaŝu derivaĵon"));
                }                    
                first = false;

                // difinu eventojn
                h2.addEventListener("click", function(event) { 
                    //kashu_malkashu_drv(event);
                    var sec = event.target.closest("section"); //parentElement;    
                    var div = sec.querySelector("div.kasxebla");
                    div.dispatchEvent(KomutEvento);
                    //triggerEvent(div,"komutu");
                });
            }
        }    
    }

    /**
     * Kaŝas la piednotajn fontindikojn de la ekzemploj. Oni povas aperigi ilin
     * per klako sur la piednota signo.
     * @memberof artikolo
     * @inner
     */
    function preparu_malkashu_fontojn() {
        var d = document.getElementsByClassName("fontoj kasxita");
        for (var el of d) {
            el.addEventListener("malkashu", function(event) { 
                event.currentTarget.classList.remove("kasxita");
                event.stopPropagation();
            });
        }
    }

    /**
     * Kelkajn sekciojn kiel ekzemploj, tradukoj, rimarkoj ni maletendas, por eviti troan amplekson.
     * Ili ricevas eblecon por reetendi ilin per "pli..." 
     * @memberof artikolo
     * @inner
     */
    function preparu_maletendu_sekciojn() {
        var d = document.getElementsByClassName("etendebla");
    //    var sojlo = 3+2; // ekde tri drv + trd + fnt, au du drv kaj adm
    // if (d.length > sojlo) { // ĝis tri derivaĵoj (+tradukoj, fontoj), ne kaŝu la alineojn
        for (var el of d) {
            if (el.classList.contains("tradukoj")) {
                maletendu_trd(el);
            }
        }

        var art = document.getElementById("s_artikolo");
        if (art) {
            var d1 = art.querySelectorAll("span.dif");
            for (var dif of d1) {
                maletendu_ekz(dif);
            }
        }
    }

    /** 
     * Kaŝas ĉiujn derivaĵojn 
     * @memberof artikolo
     * @inner
     */
    function kashu_chiujn_drv() {
        for (var el of document.getElementsByClassName("kasxebla")) 
            if (el.parentElement.classList.contains("drv") ||
                el.parentElement.classList.contains("notoj")) 
                kashu_drv(el);
    }

    /** 
     * Malkaŝas ĉiujn derivaĵojn 
     * @memberof artikolo
     * @inner
     */
    function malkashu_chiujn_drv() {
        for (var el of document.getElementsByClassName("kasxebla")) 
            if (el.parentElement.classList.contains("drv") ||
                el.parentElement.classList.contains("notoj"))  
                malkashu_drv(el);
    }

    /**
     * Kaŝas unuopan derivaĵon
     * @memberof artikolo
     * @inner
     * @param {Element} el 
     */
    function kashu_drv(el) {
        el.classList.add("kasxita");
        var h2 = getPrevH2(el);
        if (h2) {
            var kash = h2.querySelector(".i_kash");
            if (kash) kash.classList.replace("i_kash","i_mkash");
        }
    }

    /** 
     * Malkaŝas unopan derivaĵon
     * @memberof artikolo
     * @inner
     * @param {Element} el 
     */
    function malkashu_drv(el) {
        // console.log("malkaŝu drv");
        el.classList.remove("kasxita");
        var h2 = getPrevH2(el);
        if (h2) {
            var mkash = h2.querySelector(".i_mkash");
            if (mkash) mkash.classList.replace("i_mkash","i_kash");
        }
    }

    /**
     * Kaŝas unuopan derivaĵon,s e gi estas malkasita kaj malkaŝas ĝin, se gi estas kasita momente.
     * @memberof artikolo
     * @inner
     * @param {Element} el 
     */
    function kashu_malkashu_drv(el) {
        //event.stopPropagation();
        //var div = section.getElementsByClassName("kasxebla")[0];

        var sec = el.closest("section"); //parentElement;    
        var div = sec.querySelector("div.kasxebla");

        if (div.classList.contains("kasxita")) 
            malkashu_drv(div);
        else 
            kashu_drv(div);
    }

    /**
     * Maletendas tradukojn en unu sekcio
     * @memberof artikolo
     * @inner
     * @param {Element} element 
     */
    function maletendu_trd(element) {
        //var nav_lng = navigator.languages || [navigator.language];
        var eo;
        var maletenditaj = 0;
        var serch_lng = getHashParts().lng;

        for (var id of element.children) {
            var id_lng = id.getAttribute("lang");
            // la tradukoj estas paroj de ea lingvo-nomo kaj nacilingvaj tradukoj
            if (id_lng) {
                if ( id_lng == "eo") {
                    eo = id;
                } else if ( id_lng != serch_lng && preferoj.languages().indexOf(id_lng) < 0 ) {
                    eo.classList.add("kasxita");
                    id.classList.add("kasxita");
                    maletenditaj += 1;
                } else {
                    // tio necesas, se ni adaptas la preferojn
                    // por vidi pli da tradukoj!
                    eo.classList.remove("kasxita");
                    id.classList.remove("kasxita");
                }
            }
        }
        // aldonu pli...
        if (maletenditaj && ! element.querySelector(".pli")) {
            var pli = ht_elements([
                ["DT",{class: "pli lng"},
                    ["(",["A",{lang: "eo", href: "#", class: "pli etendilo"},"+"+maletenditaj],")"]
                ],
                ["DD", {class: "pli"}]
            ]);
                // href=# necesas por ebligi fokusadon per TAB-klavo
            pli[0].addEventListener("click",etendu_trd);
            element.append(...pli);

            const _MS_PER_DAY = 1000 * 60 * 60 * 24;
            if ( Math.round((Date.now() - preferoj.date()) / _MS_PER_DAY) < 1 ) {
                var pref = ht_elements([
                    ["DT",{class: "pref"},
                        [["A",{lang: "eo", href: "#", class: "pref"}, "preferoj..."]]
                    ],
                    ["DD", {class: "pref"}]
                ]);
                pref[0].addEventListener("click",() =>
                    preferoj.dialog(preparu_maletendu_sekciojn));
                element.append(...pref);
            }
        }
    }

    /**
     * Reagas al evento por etendi kaŝitajn tradukojn
     * @memberof artikolo
     * @inner
     * @param {Event} event 
     */
    function etendu_trd(event) {
        event.preventDefault();
        var div_trd = event.target.closest("DL");
        for (var id of div_trd.children) {
            id.classList.remove("kasxita");
        }
        // kaŝu pli...
        div_trd.querySelectorAll("dt.pli, dd.pli").forEach(
            p => p.classList.add("kasxita")
        );
        div_trd.querySelectorAll("dt.pref, dd.pref").forEach(
            p => p.classList.add("kasxita")
        );
    }


    /**
     * Maletendas ekzemplojn ene de dfinio
     * @memberof artikolo
     * @inner
     * @param {Element} dif 
     */
    function maletendu_ekz(dif) {
        var ekz_cnt = 0;
        for (var ch of dif.childNodes) {
            if (ch.classList && ch.classList.contains("ekz")) {
                ekz_cnt += 1;
                if (ekz_cnt > ekz_sojlo) {
                    ch.classList.add("kasxita");
                }
            } else if ( ch.nextSibling && ch.nodeType == 3 && ! ch.nodeValue.trim() ) {
                // ignoru "blankjn" tekstojn
                continue;
            } else {
                // se ni ĵus kaŝis iujn ekzemplojn, ni montru
                // etendilon "+nn..."
                if (ekz_cnt > ekz_sojlo) {
                    var maletenditaj = ekz_cnt - ekz_sojlo;
                    var pli = ht_elements([
                            ["i",{class: "ekz pli"},
                                ["(",["A",{href: "#", class: "pli etendilo"},"+"+maletenditaj],")"]
                            ]])[0];
                    pli.addEventListener("click",etendu_ekz);
                    dif.insertBefore(pli,ch);        
                }
                // ni rekomencu kalkuladon - atentu, ke ekzemploj de difino
                // ne nepre estas unu post alia, sed povas esti pli distritaj...
                ekz_cnt = 0;
            }
        }    
    }

    /**
     * Reagas al evento por etendi kasitajn ekzemplojn
     * @memberof artikolo
     * @inner
     * @param {Event} event 
     */
    function etendu_ekz(event) {
        var dif = event.target.closest("span.dif");
        for (var ch of dif.querySelectorAll(".ekz")) {
            ch.classList.remove("kasxita");
            if (ch.classList.contains("pli"))
                // ĉu forigi aŭ kaŝi - dependas, ĉu poste ni denove bezonus ĝin...
                dif.removeChild(ch);
        }
    }

    /*
    function make_flat_button(label,handler,hint='') {
        var span = document.createElement("SPAN");
        span.classList.add("kashilo");
        span.appendChild(document.createTextNode(label)); 
        //span.addEventListener("click",handler);
        if (hint) span.setAttribute("title",hint)
        return span;
    }*/

    /**
     * Aldonas butonojn por kasi kaj malkasi sekciojn
     * @memberof artikolo
     * @inner
     * @param {string} artikolo - la dosiernomo de la artikolo
     */
    function kashu_malkashu_butonoj(artikolo) {
        // aldonu kasho/malkasho-butonojn  
        //var art = document.getElementById(sec_art);
        var art = document.getElementsByTagName("article")[0];


        var div=ht_element("DIV",{id: "tez_btn"});
        div.appendChild(ht_icon_button("i_tez", () => {tezauro(artikolo);}, "montru la tezaŭron"));
        div.appendChild(ht_icon_button("i_mtez kasxita",tezauro_kashu,"kaŝu la tezaŭron"));    
        art.appendChild(div);

        div=ht_element("DIV",{id: "kash_btn"});
        div.appendChild(ht_icon_button("i_kash_ch",kashu_chiujn_drv,"kaŝu ĉiujn derivaĵojn"));
        div.appendChild(ht_icon_button("i_mkash_ch",malkashu_chiujn_drv,"malkaŝu ĉiujn derivaĵojn"));
        //h1.appendChild(ht_button(icon_opcioj,preferoj_dlg,"agordu viajn preferatajn lingvojn"));
        art.appendChild(div);
    }

    /**
     * Adaptas la piedlinion por la aktuala prezento. 
     * La piedlinioj ankoraŭ havas la malnovan aranĝon kaj 
     * necesas ilin iom koncizigi kaj adapti por la nova fasado.
     * @memberof artikolo
     * @inner
     */
    function piedlinio_modifo(artikolo) {
        const pied = document.body.getElementsByTagName("FOOTER")[0];

        function ref_dlg(r) {
            let dlg = document.getElementById('dlg_referenco');
            if (!dlg) {
                dlg = ht_elements([
                    ['dialog',{id: 'dlg_referenco',class: 'overlay'},[
                        ['a',{href: r.url},r.title],' ',
                        ['input',{id: 'dlg_ref_url', type: 'hidden'},r.url],
                        ['button',{id: 'dlg_ref_kopiu', title: 'kopiu'},'\u2398'],' ',                      
                        ['button',{id: 'dlg_ref_fermu'},'fermu']
                    ]]
                ])[0];  
            }          
            if (dlg) {
                pied.prepend(dlg);
                // reagoj al butonoj [fermu] kaj [kopiu]
                const fermu = document.getElementById('dlg_ref_fermu');
                fermu.addEventListener("click", () => {
                    dlg.close();
                });
                const kopiu = document.getElementById('dlg_ref_kopiu');
                kopiu.addEventListener("click", () => {
                    navigator.permissions.query({name: "clipboard-write"}).then((result) => {
                        if (result.state === "granted" || result.state === "prompt") {
                            navigator.clipboard.writeText(r.url);
                            return;
                        }
                    });
                    // se la supra ne funkcias, kopiu laŭ malnova maniero
                    const url = document.getElementById('dlg_ref_url');
                    url.select();
                    document.execCommand("copy");
                });
                dlg.show();
            }
        }

        if (pied) { // en la redeaktilo eble jam foriĝis...
            // aldonu ligilon "preferoj"
            const first_a = pied.querySelector("A");
            if (first_a) {                
                const pref = ht_element("A",{class: "redakto", href: "#", title: "agordu preferatajn lingvojn"},"preferoj");
                pref.addEventListener("click", () =>
                    preferoj.dialog(preparu_maletendu_sekciojn));
                first_a.insertAdjacentElement("afterend",pref);
                first_a.insertAdjacentText("afterend"," | ");      
            }
            // forigu nun unuan ligilon "Revo"
            first_a.nextSibling.remove();
            first_a.remove();
            // mallongigu referencon xml kaj aldonu "download"
            const xml = pied.querySelector("A[href^='../xml/']");
            if (xml) {
                xml.textContent="xml";
                xml.setAttribute("download","download");
            }
            // antaŭ xml aldonu "referenci..."
            if (xml) {
                const ref = ht_element("A",{class: "redakto", href: "#", title: "refrenci al tiu ĉi artikolo"},"referenci...");
                ref.addEventListener("click", () => {
                    const referenco = {
                        title: document.title,
                        url: 'https://reta-vortaro.de/revo/art/'+artikolo+'.html'
                    };
                    if (navigator.share && navigator.canShare(referenco)) {
                        navigator.share(referenco);
                    } else {
                        ref_dlg(referenco);
                    }
                });                 
                xml.insertAdjacentElement("beforebegin",ref);
                xml.insertAdjacentText("beforebegin"," | ");
            }
            // mallongigu artikolversion al nura dato
            const hst = pied.querySelector("A[href*='/hst/']");
            if (hst) {
                const ver = hst.nextSibling;
                const hst_parts = ver.nodeValue.split(/\s+/);
                if (hst_parts.length>2) { // nova artikolo ne havas jam daton!
                    hst.textContent = hst_parts[2].replace(/\//g,'-');
                }
                ver.remove();    
            }
            // forigu finan <br>
            pied.querySelector("br").remove();

            /***
            // adaptu reagon al traduki...
            const trd =  pied.querySelector("A[href^='http://kono.be']");
            trd.setAttribute("href","#");
            trd.setAttribute("title","trovu kaj aldonu pliajn tradukojn");
            trd.addEventListener("click",(event)=>{traduku(event,artikolo)});
             */
        }        
    }

    /**
     * Montras la informojn de la tezaŭro por la artikolo. Se ili ankoraŭ ne ŝarĝigis ili
     * estas petataj de la servilo
     * @memberof artikolo
     * @inner
     * @param {string} artikolo - la dosiernomo de la artikolo
     */
    function tezauro(artikolo) {
        if (!artikolo) return;

        function toggle_tez_btn() {
            preferoj.seanco.tez_videbla = true;
            // interŝanĝu la videblecon de la tez-butonoj
            const tez_btn = document.getElementById("tez_btn");
            tez_btn.querySelector('.i_tez').classList.add('kasxita');
            tez_btn.querySelector('.i_mtez').classList.remove('kasxita');        
        }

        // ni ne bezonas ŝargi la tezaŭron, se ĝi jam ŝarĝiĝis antaŭe, sed nur montri...
        const art = document.getElementById(sec_art);
        var t_exists = false;
        for (var t of art.querySelectorAll('div.tezauro')) {
            t_exists = true;
            t.classList.remove('kasxita');
        }
        if (t_exists) {
            toggle_tez_btn();
            return;
        }
                
        // se la tezaŭro ankoraŭ ne ŝarĝiĝis ni devos fari tion nun
        HTTPRequestFull('POST', vokoref_url, {}, {art: artikolo},
            function(data) {

                if (! data) return;   

                // trakuru la derivaĵojn kaj alordigu la referencojn kun sama mrk-o
                // en la unua drv aldonu ankaŭ referencojn celantaj al la artikolo (sen '.')
                const art = document.getElementById(sec_art);
                // ĉe duobla klako povas okazi, ke ni dufoje ŝargas la tezaŭon,
                // do se ĝi jam ĉeestas, ni transsaltas la reston...
                if (art.querySelector('div.tezauro')) return;
                                
                var json = 
                    /** @type { {viki: Array<{m,v}>, tez: Array<{mrk,tip,cel}>, ofc: Array<{s,m,r,f}>} } */
                    (JSON.parse(
                        /** @type {string} */ (data)
                    ));
                var first = true;

                function mrk_art_url(mrk) {
                    const fn = mrk.substring(0,mrk.indexOf('.'));
                    return art_path + fn + '.html#' + mrk;
                }
                function tip_fixed(tip) {
                    return ({sup: 'super', mal: 'malprt'}[tip] || tip);
                }
                function ofc_url(f,r) {
                    return ((f=='fe')? fundamento_url:ofcaldonoj_url) + r;
                }
                // kreas la div-keston sub derivaĵo kun la tezaŭro-referencoj
                function kreu_ref_div(mrk, first_drv = false) {
                    var refs = [];
                    var oj = [];

                    var pas = {}; // ni memoras la unuopajn, ĉar ni povas havi 
                    // duoblaĵojn en ofc-referencoj kaj viki-referencoj, pro art/drv-mrk
                    // kaj pri minuklaj/majusklaj alinomoj de Viki-titoloj (internaj referencoj de V.)

                    // oficialeco-referencoj (FdE, OA1..9)
                    if(json.ofc) {
                        for (let r of json.ofc) {
                            if (r.m == mrk || 
                                (first_drv && r.m == mrk.substring(0,mrk.indexOf('.')))
                            ) { 
                                if (! pas[r.s] ) {
                                    pas[r.s] = true;  // memoru

                                    const o = ht_elements([
                                        ['a',{ href: ofc_url(r.f,r.r) }, r.s],', '
                                    ]);
                                    if (o) oj.push(...o); 
                                }
                            }
                        }
                    }

                    if (oj.length) {
                        oj.splice(oj.length-1,1,ht_element("br")); // anstataŭigu lastan komon per <br/>
                        const p = ht_elements([
                            ['p',{},[
                                ['img',{  
                                    //src: '../smb/i_wiki.svg', 
                                    src: '../smb/i_ofc.svg', 
                                    class: 'ref i_ofc',
                                    alt: 'Oficialaj',
                                    title: 'al FdE/OA'}]
                                ]]
                        ]);
                        p[0].append(...oj);
                        refs.push(...p); 
                    }

                    // viki-referencoj
                    var vj = []; pas = {};
                    if (json.viki) {
                        for (let r of json.viki) {
                            if (r.m == mrk || 
                                (first_drv && r.m == mrk.substring(0,mrk.indexOf('.')))) {                            
    
                                if (! pas[r.v.toLowerCase()] ) {
                                    pas[r.v.toLowerCase()] = true;  // memoru
    
                                    const v = ht_elements([
                                        ['a',{ href: vikipedio_url+r.v }, r.v.replace(/_/g,' ')],', '
                                    ]);
                                    if (v) vj.push(...v); 
                                }
                            }
                        }    
                    }
                    
                    if (vj.length) {
                        vj.splice(vj.length-1,1,ht_element("br")); // anstataŭigu lastan komon per <br/>
                        const p = ht_elements([
                            ['p',{},[
                                ['img',{  
                                    //src: '../smb/i_wiki.svg', 
                                    src: '../smb/i_wiki.svg', 
                                    class: 'i_wiki',
                                    alt: 'Vikipedio',
                                    title: 'al Vikipedio'}]
                                ]]
                        ]);
                        p[0].append(...vj);
                        refs.push(...p); 
                    }

                    // tezaŭro-referencoj, reordigitaj laŭ ref-tip
                    const tez = group_by("tip", json.tez.filter(
                        r => ( (r.mrk == mrk || r.mrk.startsWith(mrk+'.') ||   // referenco el tiu ĉi derv (mrk)
                            (first_drv && r.mrk == mrk.substring(0,mrk.indexOf('.'))) ) // en la unua drv ni 
                                                              // inkluzivas nespecif. ref. alartikolaj
                            && !r.cel.m.startsWith(mrk+'.') ) // ni ekskluzivu referencojn al si mem!
                    ));

                    // listo-referencojn ni aldonos al super...
                    if (tez.lst) {
                        tez.super = (tez.super? tez.super.concat(tez.lst) : tez.lst);
                    }
                    // sentipajn referencojn ni aldonos al vid...
                    if (tez['<_sen_>']) {
                        tez.vid = (tez.vid? tez.vid.concat(tez['<_sen_>']) : tez['<_sen_>']);
                    }

                    pas = {}; // ni memoras la celojn, ĉar pro la distingo drv/snc ni havus duoblaĵojn
                                  // kaj ankaŭ pro inversaj dif/sin, sin/vid...

                    // montru referencojn en taŭga ordo... 
                    for (let tip of ['dif','sin','ant','hom','super','malprt','sub','ekz','prt','vid']) {
                        const rj = tez[tip];
                        if (!rj) continue;

                        var aj = [];

                        for (let r of rj) {
                            const cel = r.cel;

                            // NOTO: tio povus neintencite kaŝi homonimojn, se ni referencas al pluraj
                            // sed eble tio okazas tiel rare, ke ni povos ignori tion?
                            // Alie ni devus ankaŭ kompari .m kaj montri distingilon por homonimoj
                            // en la prezento
                            if (! (pas[cel.k] && pas[cel.k] == (cel.n||-1)) )// jam antaŭe donita...
                            {
                                pas[cel.k] = cel.n || -1;  // memoru
                                const a = ht_elements([
                                    ['a',{ 
                                        href: mrk_art_url(cel.m),
                                        class: "ref"
                                    },cel.k],', '
                                ]);
                                if (cel.n) {
                                    const s = ht_element("sup",{},cel.n);
                                    a[0].append(s);
                                }  
                                if (a) aj.push(...a);    
                            }
                        }
                        if (aj.length) {
                            aj.splice(aj.length-1,1,ht_element("br")); // anstataŭigu lastan komon per <br/>
                            const p = ht_elements([
                                ['p',{},[
                                    ['img',{ 
                                        src: '../smb/' + tip_fixed(tip) + '.gif', 
                                        class: "ref " + ref_tip_class(tip), 
                                        title: ref_tip_title(tip_fixed(tip)),
                                        alt: ref_tip_alt(tip_fixed(tip)) }]
                                ]]
                            ]);
                            p[0].append(...aj);
                            refs.push(...p); 
                        }
                    }

                    // nestigu ĉiujn trovitajn referencojn den div
                    if (refs.length) {
                        const div = ht_element("div", { class: 'tezauro' });
                        div.append(...refs);
                        return div;
                    }
                }

                for (let h2 of art.querySelectorAll('h2[id]')) {
                    const div = kreu_ref_div(h2.id,first); first = false;
                    if (div) {
                        const sec = h2.closest("section");
                        const dk = sec.querySelector("div.kasxebla");
                        dk.prepend(div);
                        // aldonu simbolon en h2
                        //const btn = ht_element('button', { 
                        //    class: "i_tez" });                        
                        //h2.append(btn);
                    }
                }

                toggle_tez_btn();
            }
        );        
    }

    /**
     * Kaŝas la tezaŭron
     * @memberof artikolo
     * @inner
     */
    function tezauro_kashu() {
        const art = document.getElementById(sec_art);
        for (var t of art.querySelectorAll('div.tezauro')) {
            t.classList.add('kasxita');
        }
        preferoj.seanco.tez_videbla = false;

        const tez_btn = document.getElementById("tez_btn");
        tez_btn.querySelector('.i_mtez').classList.add('kasxita');
        tez_btn.querySelector('.i_tez').classList.remove('kasxita');
    }


   // eksportu publikajn funkciojn
   return {
        preparu_art: preparu_art
   };

}();
