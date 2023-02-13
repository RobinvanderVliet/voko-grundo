
/* jshint esversion: 6 */

// (c) 2021 Wolfram Diestel

/**
 * Administras XML-tekston kiel strukturo de subtekstoj
 * @constructor
 * @param {string} xml - la XML-teksto
 * @param {Function} onAddSub - Revokfunkcio, vokata dum analizo de la strukturo ĉiam, kiam troviĝas subteksto. Tiel eblas reagi ekzemple plenigante liston per la trovitaj subtekstoj (art, drv, snc...) 
 */
function XmlStruct(xml, onAddSub) {
    this.xmlteksto = xml; // la tuta teksto
    this.strukturo = []; // la listo de subtekstoj [komenco,fino,nomo]
    this.radiko = '';
    this.onaddsub = onAddSub;

    this.re_stru = {
      _elm: /[ \t]*<((?:sub)?(?:art|drv|snc))[>\s]/g,
      _eoe: />[ \t]*\n?/g,
      _mrk: /\s*mrk\s*=\s*(['"])([^>"']*?)\1/g,
      _kap: /<kap>([^]*)<\/kap>/,
      _rad: /<rad>([^<]+)<\/rad>/,
      _dos: /<art\s+mrk="\$Id:\s+([^\.]+)\.xml|<drv\s+mrk="([^\.]+)\./,
      _var: /<var>[^]*<\/var>/g,
      _ofc: /<ofc>[^]*<\/ofc>/g,
      _klr: /<klr[^>]*>[^]*<\/klr>/g,
      _ind: /<ind>([^]*)<\/ind>/g,
      _fnt: /<fnt>[^]*<\/fnt>/g,
      _tl1: /<tld\s+lit="(.)"[^>]*>/g,
      _tl2: /<tld[^>]*>/g,
      _tagend: /[>\s]/
    };
  
    this.indents = {
      art: "", subart: "\u25b8\u00a0", drv: "\u2014 ", subdrv: "\u00a0\u2014 ", 
      snc: "\u00a0\u00a0\u00a0\u22ef ", subsnc: "\u00a0\u00a0\u00a0\u22ef\u22ef "
    };

    this.elements = {
      subart: "\u24d0",
      drv: "\u24b9", subdrv: "\u24d3", snc: "\u24c8", subsnc: "\u24e2"
    }

    this.structure();
}

/**
 * Metas la kompletan XML-tekston laŭ la argumento 'xml' kaj aktualigas la strukturon el ĝi
 * @param {string} xml 
 */
XmlStruct.prototype.setText = function(xml) {
  this.xmlteksto = xml;  
  this.structure();      
};


/**
 * Ekstraktas strukturon de art/subart/drv/subdrv/snc/subsnc el la artikolo
 * @param {string} selected - se donita tio estas la elektita subteksto kaj estos markita en la revokfunkcio onaddsub (4-a argumento: true)
 */
XmlStruct.prototype.structure = function(selected = undefined) {
  const re_stru = this.re_stru;
  const xmlteksto = this.xmlteksto;

  /**
   * Ekstraktu la XML-atributon 'mrk' el la subteksto
   * @param {string} elm - la elemento de la subteksto (art,subart,drv,...,subsnc)
   * @param {number} de - la komenco de la subteksto en la tuta XML
   * @returns la atributon 'mrk'
   */
  function mrk(elm,de) {
    let i_start = xmlteksto.indexOf('<',de);
    if (i_start > -1) {
      i_start += 1 + elm.length + 1; // de:"<elm " 
      re_stru._mrk.lastIndex = i_start;
      const m = re_stru._mrk.exec(xmlteksto);
      if (m && m.index == i_start) { 
        const mrk = m[2];
        return (elm != 'art'? 
          mrk.substring(mrk.indexOf('.')+1) 
          : (mrk.slice(mrk.indexOf(':')+2,-20)) || '<nova>');
      }  
    }
  }
  function rad(de,ghis) {
    const art = xmlteksto.substring(de,ghis);
    const mr = art.match(re_stru._rad);

    if (mr) {
      const rad = mr[1]
      .replace(/\s+/,' ')
      .trim();  // [^] = [.\r\n]

      return rad;
    }
  }
  function kap(elm,de,ghis) {
    if (elm == 'drv') {
      // find kap
      const drv = xmlteksto.substring(de,ghis);
      const mk = drv.match(re_stru._kap); 
      //re_stru._kap.lastIndex = de;
      if (mk) {
        const kap = mk[1]
        .replace(re_stru._var,'')
        .replace(re_stru._ofc,'')
        .replace(re_stru._fnt,'')
        .replace(re_stru._tl1,'$1~')
        .replace(re_stru._tl2,'~')
        .replace(/\s+/,' ')
        .replace(',',',..')
        .trim();  // [^] = [.\r\n]

        return kap;
      }
    }
  }
  function id(subt) {
    const rx = /[^A-Za-z]/g;
    const key = [111,222,33,44,55]; // ne tro gravas...
    const xor_str = (str) => // kondensigi signoĉenon al cifera identigilo
      { 
          var c = key;
          for(let i=0; i<str.length; i++) { 
              c[i%key.length] ^= str.charCodeAt(i);
          }
          return c.join('.');
      };
    if (subt.mrk) {
      // se la elemento havas markon, tio estas la plej bona identigilo
      return xor_str(subt.mrk);
    } else {
      // se ne, ni uzas la unuajn aperantajn latinajn literojn por
      // identigi, ja konsciante, ke tiuj povos ŝanĝiĝi, sed tiam
      // ni rekalkulas la strukturon kaj akceptas, ke ni ne
      // retrovas la antaŭan elekton...
      return xor_str(xmlteksto.substring(subt.de,subt.de+120).replace(rx,''));
    }
  }
  function al(elm,de) {
    // trovu la finon de elemento 'elm'
    var fin = xmlteksto.indexOf('</'+elm, de);
    // trovu avance >..\n?
    re_stru._eoe.lastIndex = fin;
    const eoe = re_stru._eoe.exec(xmlteksto);
    if (eoe && eoe.index) fin = eoe.index + eoe[0].length;

    return fin;
  }

  this.strukturo = [];
  var m = re_stru._elm.exec(xmlteksto);

  while (m) {
    var subt = {de: m.index}; // komenca signo
    // kiom da linioj antaŭ tio?
    subt.el = m[1]; // elemento
    subt.ln = count_char(xmlteksto,'\n',0,m.index); // komenca linio
    subt.al = al(subt.el,m.index+5); // fina signo
    subt.lc = count_char(xmlteksto,'\n',m.index,subt.al); // lininombro

    subt.mrk = mrk(subt.el,subt.de);
    subt.kap = kap(subt.el,subt.de,subt.al);
    subt.id = id(subt);
    subt.no = this.strukturo.length;

    //const id = el_id(m[1], m.index+5, fino);
    const suff = subt.kap ? subt.kap : subt.mrk||'';
    subt.dsc = this.indents[subt.el] + (
      subt.el!='art'? 
        this.elements[subt.el]+ (suff?' '+suff:' ('+subt.el+')') 
        : suff);

    // ĉe la kapvorto de la artikolo ekstraktu la radikon
    if (subt.el == 'art') this.radiko = rad(subt.de,subt.al);

    // console.debug(subt.de + '-' + subt.al + ': ' + subt.id + ':' + subt.dsc);

    if (this.onaddsub) this.onaddsub(subt,this.strukturo.length,subt.id == selected);
    this.strukturo.push(subt);
    //sel_stru.append(ht_element('option',{value: strukturo.length-1},item));

    m = re_stru._elm.exec(xmlteksto);
  }

  // en la fino aldonu ankoraŭ elektilon por la tuta XML
  const tuto = {de: 0, ln: 0, al: xmlteksto.length, id: "x.m.l", dsc: 'tuta xml-fonto'};
  if (this.onaddsub) this.onaddsub(tuto,this.strukturo.length,tuto.id == selected);
  this.strukturo.push(tuto);
};

/**
 * Redonas dosieronomon trovante ĝin en art-mrk aŭ drv-mrk
 * @returns La dosiernomon ekstraktitan el la trovita mrk-atributo
 */
XmlStruct.prototype.art_drv_mrk = function() {
  var match = this.xmlteksto.match(this.re_stru._dos);
  if (match) return (match[1]? match[1] : match[2]);
};

/**
 * Anstataŭigas donitan subtekston per nova, ankaŭ aktualigas la struktur-liston
 * @param {{id: string}} sd - la anstataŭigenda subteksto
 * @param {string} xml - la nova subteksto
 * @param {string} select - se donita, la strukturelemento kun tiu .id estos poste la elektita
 */
XmlStruct.prototype.replaceSubtext = function(sd, xml, select = undefined) {   
    const elekto = this.getStructById(sd.id);

    this.xmlteksto = 
      (this.xmlteksto.substring(0, elekto.de) 
      + xml
      + this.xmlteksto.substring(elekto.al));
    // rekalkulu la strukturon pro ŝovitaj pozicioj...
    this.structure(select);  
};

/**
 * Trovu la informojn de subteksto 'id' en la strukturlisto 
 * @param {string} id 
 * @returns la detalojn kiel objekto
 */
XmlStruct.prototype.getStructById = function(id) {
  for (let s of this.strukturo) {
    if (s.id == id) return s;
  }
};


/**
 * Trovas la informon de subteksto: aŭ identigante ĝin per sia .id aŭ
 * per sama elemento kaj komenco devianta maksimume je unu linio
 * @param {{id: string}} sd 
 * @returns la informoj pri la subteksto kiel objekto
 */
XmlStruct.prototype.findStruct = function(sd) {
  let s = this.getStructById(sd.id);

  if(s) { return s; }
  else if (sd.el && sd.ln) {
    for (s of this.strukturo) {
      if ( ( s.el == sd.el )  && ( Math.abs(s.ln-sd.ln) <= 1 ) ) {
        return s;
      }
    }
  }
}


/**
XmlStruct.prototype.match = function(sd1,sd2) {
  return (
    sd1.id = sd2.id
    || 
    ( sd1.el && sd2.el && sd1.ln && sd2.ln 
      && ( sd1.el == sd2.el ) 
      && ( Math.abs(sd2.ln-sd1.ln) <= 1 ) )
  );
}
 */

/**
 * Trovas subtekston en la strukturlisto
 * @param {{id: string}} sd - objekto kun .id kaj eventuala pliaj informoj .ln, .el por identigi la subtekston
 * @returns la konernan XML-tekston
 */
XmlStruct.prototype.getSubtext = function(sd) {
  const s = this.getStructById(sd.id);
  if (s) return this.xmlteksto.slice(s.de,s.al);
};


/**
 * Trovos la parencon de la struktur-elemento, ekzemple ĉe senco tio estas la enhavanta derivaĵo.
 * @param {{id: string}} sd - objekto kun .id kaj eventuale pliaj informoj .ln, .el por identigi la subtekston
 * @returns la detalojn de la parenco kiel objekto
 */
XmlStruct.prototype.getParent = function(sd) {
  const s = this.getStructById(sd.id);
  // parenco venas antaŭ la nuna kaj enhavas ĝin (subteksto al..de)
  for (var n = s.no-1; n>=0; n--) {
    const p = this.strukturo[n];
    if (p.de < s.de && p.al > s.al ) return p;  
  }
};

/**
 * Trovas la plej proksiman parencon de la aktuale elektita subteksto, kiu havas XML-atributon 'mrk'
 * @param {{id: string}} sd - objekto kun .id por identigi la subtekston
 * @returns la detalojn de la parenco kiel objekto
 */
XmlStruct.prototype.getClosestWithMrk = function(sd) {
  const elekto = this.getStructById(sd.id);
  if (elekto.mrk) {
    return elekto;
  } else {
    var p = this.getParent(sd);
    while (p && p.no > 0) { // ni ne redonos art@mrk (0-a elemento)
      if (p.mrk) return p;
      p = this.getParent(p);
    }
  }
};


/**
 * Redonas la XML-atributon 'mrk' de la aktuala subteksto, aŭ tiun de parenco, se ĝi ne havas mem
 * @param {{id: string}} sd - objekto kun .id por identigi la subtekston
 * @returns la XML-atributon 'mrk'
 */
XmlStruct.prototype.getMrk = function(sd) {
  const c = this.getClosestWithMrk(sd);
  if (c) return c.mrk;
  return '';
};


/**
 * Redonas kapvorton, se ene de drv t.e. ties kapvorton, alie la kapvorton de la unua drv
 * en la artikolo
 * @param {{id: string}} sd - objekto kun .id por identigi la subtekston
 * @returns la kapvorton, tildo estas anstataŭigita per la radiko, variaĵoj post komo forbalaita
 */
XmlStruct.prototype.getClosestKap = function(sd) {
    function kap(e) {
      return e.kap
        .replace('~',rad)
        .replace(/,.*/,'');
    }

  const rad = this.radiko;
  const elekto = this.getStructById(sd.id);
  
  if (elekto.el != 'art' && elekto.id != "x.m.l") {

    if (elekto.kap) {
      return kap(elekto);
    } else {
      var p = this.getParent(elekto);
      while (p && p.no > 0) { // ni ne redonos art@mrk (0-a elemento)
        if (p.kap) return kap(p);
        p = this.getParent(p);
      }
    }

  } else { // prenu kapvorton de unua drv
    for (let s of this.strukturo) {
      if (s.el == 'drv') {
        return (kap(s));
      }
    }
  }
};

/**
 * Redonas la informojn pri la lasta subteksto, kiu enhavas linion
 * @param {number} line - la koncerna linio
 * @returns - la serĉataj detaloj, null - se neniu enhavas la linion
 */
XmlStruct.prototype.getLastStructWithLine = function(line) {
  for (let n = this.strukturo.length-2; n>=0; n--) {
    const s = this.strukturo[n];
    if (s.ln <= line && s.ln+s.lc >= line) {
      return s;
    }
  } 

  // ankoraŭ ne trovita? do redonu XML-tuta...
  return this.strukturo[this.strukturo.length-1]
}


/**
 * Trovas la elemento-komencon (end=false) aŭ finon (end=true) en la XML-teksto.
 * La serĉo okazas de la fino!
 * @param {!Array<string>} elements - listo de interesantaj elementoj
 * @param {boolean} end - true: ni serĉas elementofinon (&lt;/drv), false: ni serĉas komencon (&lt;drv)
 * @param {boolean} stop_no_match - se 'true', ni haltas ĉe la unua elemento, kiu ne estas en la listo
 * @param {string} xml - la XML-teksto en kiu ni serĉas
 * @param {number} from - la finpozicio de kiu ni serĉas en alantaŭa direkto, se ne donita serĉe komenciĝas ĉe la fino
 * @returns objekton kun kampoj pos, end, elm
 */
XmlStruct.prototype.travel_tag_bw = function(elements,end,stop_no_match,xml,from=undefined) {    
  const re_te = this.re_stru._tagend;
  const mark = end? '</' : '<';

  // se mankas la lasta argumento, uzu aprioran...
  /*
  if (!xml) {
    xml = this.txtarea.value;
  }
  */
  if (from == undefined) {
    from = xml.length;
  }

    // kontrolu ĉu la trovita elemento estas en la listo
    // de interesantaj elementoj
    function match(p) {
      for (let e of elements) {
        if ( xml.substring(p,p+e.length) == e 
          && xml.substring(p+e.length,p+e.length+1).match(re_te) ) return e;
      }
    }

  // trovu krampon < aŭ </
  var pos = xml.lastIndexOf(mark,from-mark.length);

  while (pos > -1 ) {
    const element = match(pos+mark.length);
    if (element) {
      const end = xml.indexOf('>',pos);
      // redonu la trovitan elementon
      return {pos: pos, end: end, elm: element};
    } else {
      if (stop_no_match) return;
    }
    // trovu sekvan krampon < aŭ </
    pos = xml.lastIndexOf(mark,pos-1);
  }
};


