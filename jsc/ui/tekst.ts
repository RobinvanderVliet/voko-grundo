/**
 * (c) 2023 ĉe Wolfram Diestel
 * laŭ GPL 2.0
 */

import { UIElement } from './uielement';


export type TPozicio = {
    lin: number,
    poz: number
}

export interface TId {
    id: string
};

export interface Tekstero { 
    id: string, // unika identigilo de la tekstero, ĝi ne dependu de la pozicio de la tekstero en
                // la teksto tiel, ke ĝi ne perdas validecon ĉe ŝovo de la tekstero.
    no: number, // la numero de la subteksto en la listo (subteksteroj enordiĝas, t.e 1.a ricevos numeron 2)
    de: number, // komenca signo de la tekstero, rilate al la tuta teksto
    al: number, // fina signo de la tekstero, rilate al la tuta teksto (do longeo estas de-al)
    ln: number, // la komenca linio ene de la tuta teksto
    lc?: number // la nombro de linioj
};

/**
 * Klaso por trakti strukturitan tekston, aparte por redakti ties unuopan parton
 * aparte. Ne necesas, ke la partoj sekvas unu la aliajn, eblas ankaŭ ingigitaj subtekstoj,
 * t.e. arba strukturo anstataŭ listo. Tamen la partoj estas administrataj interne kiel
 * listo. La komencaj kaj finaj signonumeroj rilate al la komenco de la tuta teksto
 * identigas la unuopajn partojn. Necesas do kohera sinkronigado inter redaktilo kaj
 * la tekststrukturo por ne fusi la enhavon!
 */
export class Tekst extends UIElement {
    static kmp_eo = new Intl.Collator('eo').compare;
    private _partoj: Array<Tekstero>;
    private _teksto: string;
    public sinkrona: boolean;
    public aktiva: Tekstero;

    static aprioraj = { };

    /**
     * Helpfunkcio ripetas unu signon n fojojn
     * @param rStr 
     * @param rNum 
     * @returns 
     */
    static sxn(rStr: string, rNum: number): string {
        var nStr="";
        for (var x=1; x<=rNum; x++) {
            nStr+=rStr;
        }
        return nStr;
    }

    
    /**
     * Kalkulas el la signoindekso la linion kaj la pozicion ene de la linio
     * @param inx - la pozicio en la teksto (sen konsideri liniojn)
     * @param text - la koncerna teksto
     * @returns la pozicion kiel objekto {{line: number, pos: number}}
     */
    static lin_poz(inx: number, text: string): TPozicio {
        let linioj = 0;
        let last_poz = 0;
        for (let i=0; i<inx; i++) { 
            if (text[i] == '\n') {
                linioj++;
                last_poz = i;
            }
        }
        const poz = (linioj == 0)? inx : (inx-last_poz-1);
        return({lin: linioj, poz: poz}); // evtl. ni bezonus adicii la unuan linion de la subteksto
    }

    static kreu(spec: string, opcioj?: any) {
        document.querySelectorAll(spec).forEach((e) => {
            if (e instanceof HTMLElement)
                new Tekst(e,opcioj);
        });
    }

    static tekst(element: HTMLElement|string) {
        const e = super.obj(element);
        if (e instanceof Tekst) return e;
    }

    constructor(element: HTMLElement|string, opcioj?: any, aprioraj = Tekst.aprioraj) {
        super(element, opcioj, aprioraj);
    
        this._teksto = '';
        this._partoj = [];

        this.element.addEventListener("input",() => { this.sinkrona = false; });
        this.element.addEventListener("change",() => { this.sinkrona = false; });
    }

    /**
     * Metas la tutan tekston, poste renovigas la strukturinformojn.
     */
    set teksto(teksto: string) {
        this._teksto = teksto;
        this.strukturo();

        // elektu la unuan (art)
        this.aktiva = this._partoj[0];

        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement)
            txtarea.value = this.subteksto(this.aktiva);
    }


    /**
     * Redonas la tutan tekston post eventuala sinkronigo kun la aktuala redakto
     * @returns la tuta sinkronigita teksto
     */
    get teksto(): string {
        if (! this.sinkrona) this.sinkronigu(this.aktiva); 
        return this.teksto;
    };

    konservu(ŝlosilo: string, info: any) {
        window.localStorage.setItem(ŝlosilo,
            JSON.stringify({
            'xml': this.teksto,
            'nom': nom.value
            //'red': nova/redakti...
            })
        );
    };

  
    /**
     * Restarigas XML-tekston kaj la artikolnomon el loka retumila memoro.
     * @memberof redaktilo
     * @inner
     */
    relegu(ŝlosilo) {
        const str = window.localStorage.getItem(ŝlosilo);
        const art = (str? JSON.parse(str) : null);
        if (art) {
            this.text = art.xml; // document.getElementById("r:xmltxt").value = art.xml;
            //  document.getElementById("...").value = art.red;
            nom.value = art.nom;
        }
    };

    /**
     * Aktualigas la tekstbufron per la redaktata subteksto, ankaŭ aktualigas la struktur-liston
     * @param select - se donita, la strukturelemento kun 
     * tiu .id estos poste la elektita, se ĝi aldone havas .ln, .el tiuj povus esti
     * uzataj por retrovi subtekston, kies .id ŝanĝiĝis, ekz-e pro aldono/ŝanĝo
     */
    sinkronigu(select?: TId) {
        if (this.aktiva) {
            console.debug("<<< sinkronigo <<<");
            // try {
            //   console.debug(new Error().stack.split("\n")[2]);
            // } catch(e) { };

            const old_s = this.aktiva;    
            const nstru = this._partoj.length;

            if (!select) select = this.aktiva;

            // unue ni legas la aktuale redaktatan subtekston kaj enŝovas en la kompletan
            // tio ankaŭ rekreas la strukturon de subtekstoj!
            // ni memoras la longecon de la nova subteksto, ĉar se ĝi entenas pli ol la ĉefan elementon, ekz-e finan
            // komenton, ni devas evit duobliĝon per aktualigo ankaŭ de la montrata subteksto
            const teksto =  this.element.value;
            const ln = teksto.length;
            this.anstataŭigu(this.aktiva,teksto,select.id);

            // nun retrovu la elektendan subtekston en la rekreita strukturo

            // trovu laŭ id (tbs = to be selected)
            let tbs = this.subtekst_info(select.id);

            if (tbs) {
                this.aktiva = tbs;
            // se ni ne trovis la subtekston per sia id, sed ĝi estas la
            // sama, kiun ni ĵus redaktis, eble la marko ŝanĝiĝis
            // aŭ aldoniĝis snc/drv, ni provu trovi do per .ln kaj .el
            } else if (select.id == old_s.id) {
                tbs = this.trovu_subtekst_info(select);
                if (tbs) this.aktiva = tbs;
            };
            
            // se tute ne retrovita, ni elektas la unuan subtekston (art)
            if (!tbs) {
                this.aktiva = this._partoj[0]; 
            }

            // se ni transiris al alia subteksto, aŭ aldoniĝis io post ĝi, aŭ eĉ tuta strukturero, 
            // ni devos ankoraŭ montri la novelektitan/ŝanĝitan subtekston en Textarea
            if (old_s.id != this.aktiva.id 
                || old_s.ln != this.aktiva.ln
                || ln != (this.aktiva.al - this.aktiva.de)
                || old_s.el != this.aktiva.el

                || nstru != this._partoj.length) {
                // nun ni montras la celatan XML-parton por redaktado
                this.element.value = this.subteksto(this.aktiva);
            }

            this.sinkrona = true;
        }
    };

    /**
     * Kreas novan strukturon. Ĉar ni ne scias, laŭ kiu sintakso la strukturo
     * kreigu tion devas fari la uzanta objekto, kiu tiucele transdonu en opcioj
     * funkcion strukturo()
     */
    strukturo() {
        this._partoj = [];
        if (this.opcioj.strukturo instanceof Function)
            this.opcioj.strukturo(this);
    }


    /**
     * Elektas (alian) subtekston de la teksto por redakti nur tiun.
     * Laŭbezone sekurigas la nune redaktatan parton...
     * @param id - la identigilo de la subteksto
     */
    ekredaktu(id: string, sinkronigu = true) {
        if (id) {
            console.debug("<<< ŝanĝu subtekston "+id+" <<<");

            // ni unue sekurigu la aktuale redaktatan parton...
            if (sinkronigu) this.sinkronigu({id:id}); // ni transdonas ankaŭ la elektotan id por navigi tien en la elekto-listo
            
            /* ni trovu la celatan subtekston per ĝia id... */

            // apriore, por la kazo, ke ni ne trovos la celatan, ekz-e ĉar marko aŭ enhavo snc-aldono...) ŝanĝiĝis,
            // ni antaŭelektas al la unuan (art)
            this.aktiva = this._partoj[0]; 
                // ni montro simple la unua subtekston, t.e. la artikolon
            
            // nun serĉu...
            const tbs = this.subtekst_info(id);
            if (tbs) {
                this.aktiva = tbs;
            }

            // komparu kun SYNC...
            //console.debug("CHNG "+this.xml_elekto.id+": "+this.xml_elekto.de+"-"+this.xml_elekto.al
            //  +"("+(this.xml_elekto.al-this.xml_elekto.de)+")");

            // nun ni montras la celatan XML-parton por redaktado
            this.element.value = this.subteksto(this.aktiva);
            // iru al la komenco!
            this.kursoro_supren();
            this.rulpozicio = 0;

            if (this.onselectsub) this.onselectsub(this.aktiva);
        }
    };

    /**
     * Aldonas teksteron al la fino de la parto-listo. Ni aŭtomate metas/aktualigas ĝian numeron
     * @param ero  aldona objekto kun la atributoj de la strukturero
     */
    aldonu(ero: Tekstero) {
        ero.no = this._partoj.length;
        this._partoj.push(ero);

        // evtl. reago al aldono
        if (this.opcioj.post_aldono instanceof Function)
            this.opcioj.post_aldono(ero);
    }

    /**
     * Forigas ĉiujn strukturinformojn.
     */
    purigu() {
        this._partoj = [];
    }

    /**
     * 
     * @param id Redonas la informojn pri subteksto, identigitan per sia id
     * @returns 
     */
    subtekst_info(id: string): Tekstero|undefined {
        return this._partoj.find((e) => e.id == id);
    }

    /**
     * Trovas la informon de subteksto: aŭ identigante ĝin per sia .id aŭ
     * per sama elemento kaj komenco devianta maksimume je unu linio
     * @param sd 
     * @returns la informoj pri la subteksto kiel objekto
     */
    trovu_subtekst_info(sd: Tekstero): Tekstero {
        let s = this.subtekst_info(sd.id);

        if(s) { return s; }
            else if (sd.el && sd.ln) {
            for (s of this._partoj) {
                if ( ( s.el == sd.el )  && ( Math.abs(s.ln-sd.ln) <= 1 ) ) {
                return s;
                }
            }
        }
    }

    /**
     * Trovas subtekston en la strukturlisto
     * @param sd - objekto kun .id kaj eventuala pliaj informoj .ln, .el por identigi la subtekston
     * @returns la konernan XML-tekston
     */
    subteksto(sd: TId): string {
        const s = this.subtekst_info(sd.id);
        if (s) return this.teksto.slice(s.de,s.al);
        else throw "Nevalida tekstero '"+sd.id+"'";
    };


    /**
     * Trovos la patran subtekston de la struktur-elemento donita, t.e. kiu
     * entenas ĝin
     * @param sd - objekto kun .id kaj eventuale pliaj informoj .ln, .el por identigi la subtekston
     * @returns la detalojn de la patro kiel objekto
     */
    patro(sd: TId): Tekstero|undefined {
        const s = this.subtekst_info(sd.id);

        // patro venas antaŭ la nuna kaj enhavas ĝin (subteksto al..de)
        if (s) {
            for (var n = s.no-1; n>=0; n--) {
                const p = this._partoj[n];
                if (p.de < s.de && p.al > s.al ) return p;  
            }        
        } else throw "Nevalida tekstero '"+sd.id+"'";
    };


    /**
     * Redonas la informojn pri la lasta subteksto, kiu enhavas linion
     * @param line - la koncerna linio
     * @returns - la serĉataj detaloj, undefined - se neniu enhavas la linion
     */
    lasta_kun_linio(line: number): Tekstero {
        for (let n = this._partoj.length-2; n>=0; n--) {
        const s = this._partoj[n];
            if (s.ln <= line && s.ln+s.lc >= line) {
                return s;
            }
        } 

        // ankoraŭ ne trovita? do redonu XML-tuta...
        return this._partoj[this._partoj.length-1]
    }

   /* Anstataŭigas donitan subtekston per nova
    * @param sd - la anstataŭigenda subteksto
    * @param xml - la nova subteksto
    * @param select - se donita, la strukturelemento kun tiu .id estos poste la elektita
    */
    anstataŭigu(sd: Tekstero, teksto: string) {   
       const elekto = this.subtekst_info(sd.id);
 
       if (elekto) {
        this.teksto = 
            (this.teksto.substring(0,elekto.de) 
            + teksto
            + this.teksto.substring(elekto.al));
       } else
        throw "Nevalida tekstero '"+sd.id+"'";
    };

    /**
    * Enŝovas novan subtekston post la subtekston kun 's_id'
    * Ĝi atentas, ke rekte post tiu povas okazi sub-subtekstoj,
    * kiujn ni devas transsalti por trovi la ĝustan lokon.
    */
    enŝovu_post(s_id: string, xml: string) {
        // trovu la subtekston laŭ mrk
        const s = this.subteksto(s_id);
        if (!s) throw "Subteksto kun id "+s_id+" ne trovita!"

        // enŝovu la novan subtekston post tiu, uzante la pozicion s.al
        this.teksto = 
            this.teksto.substring(0,s.al) 
            + "\n"+ xml 
            + this.teksto.substring(s.al);
    }

    /**
     * Redonas aŭ metas la aktualan y-koordinaton de la videbla parto de this.xmlarea
     * @param pos - se donita rulas al tiu y-koordinato, se mankas redonu la aktualan
     * @returns la aktuala y-koordinato
     */
    set rulpozicio(pos: number) {
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            // set scroll pos
            if (typeof txtarea.scrollTop == "number")  // Mozilla & Co
                txtarea.scrollTop = pos;
            else if (document.documentElement && document.documentElement.scrollTop)
                document.documentElement.scrollTop = pos;
            else /* if (document.body) */
                document.body.scrollTop = pos;
        }
    };


    /**
     * Redonas la aktualan y-koordinaton de la videbla parto de this.xmlarea
     * @returns la aktuala y-koordinato
     */
    get rulpozicio(): number|undefined {
        var txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            if (txtarea.scrollTop)  // Mozilla
                return txtarea.scrollTop;
            else if (document.documentElement && document.documentElement.scrollTop)
                return document.documentElement.scrollTop;
            else /*if (document.body)*/
                return document.body.scrollTop;
        }
    };
    

    /**
     * Iras al pozicio indikita per "<line>:[<lpos>]"
     * @param line_pos - linio kaj eventuala pozicio en la linio kiel teksto
     * @param len - se donita, tiom da signoj ĉe la indikita poizico estos markitaj,
     *                  se ne donita unu signo estos elektita
     */
    iru_al(line_pos: string, len:number = 1) {
        //const re_line = this.re_stru._line;
        
        // kalkulu la signoindekson por certa linio
        function pos_of_line(txt: string, line: number): number {
            let pos = 0;
            let lin = 0;

            while (lin < line) {
                pos = txt.indexOf('\n',pos)+1;
                lin++;
            }
            /*
            var lines = this.element.val().split('\n');
            var pos = 0;
            
            for (var i=0; i<line; i++) {
                pos += lines[i].length+1;
            }*/
            return pos;
        };

        const p = line_pos.split(":");
        const linio = +p[0] || 1;
        const lpos = +p[1] || 1;

        if (! this.sinkrona) this.sinkronigu(this.aktiva); 
        const sub = this.lasta_kun_linio(linio);

        const teksto = this.subteksto(sub);
        const pos = pos_of_line(teksto,linio-sub.ln-1) + ( lpos>0 ? lpos-1 : 0 );

        this.ekredaktu(sub.id,true);
        this.elektu(pos,0); // rulu al la pozicio
        this.elektu(pos,len); // nur nun marku <len> signojn por pli bona videbleco
    };


    /**
     * Redonas la aktualan pozicion de la kursoro kiel linio kaj loko ene de la linio 
     * @returns objekto {{lin: number, poz: number}}
     */
    pozicio() {
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            const loff = this.aktiva? this.aktiva.ln : 0;
            const lp = Tekst.lin_poz(txtarea.selectionStart||0,txtarea.value);
            lp.lin += loff;
            return lp;
        } else 
            throw "Malnovaj retumiloj kiel IE ne plu subtenataj!"
    };


    /**
     * Redonas pozicion de kursoro kiel n-ro de signo
     * @returns - la numero de la signo, kie staras la kursoro
     */
    signo(): number|undefined {
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            return txtarea.selectionStart;
        }
    };


    /**
     * Elektas tekstoparton en la redaktata teksto
     * @param poz - la pozicio ekde kie elekti
     * @param ln - la nombro de elektendaj signoj
     */
    elektu(poz: number, len: number = 0) {
        const txtarea = this.element;

        if (txtarea instanceof HTMLTextAreaElement) {
            txtarea.selectionStart = poz;
            txtarea.selectionEnd = poz + len;

            // necesas ruli al la ĝusta linio ankoraŭ, por ke ĝi estu videbla
            const text = txtarea.value;
            const scroll_to_line = Math.max(Tekst.lin_poz(poz,text).lin - 5, 0);
            const last_lin = Tekst.lin_poz(text.length-1,text).lin;
            this.rulpozicio = txtarea.scrollHeight * scroll_to_line / last_lin;  
        };
    }


    /**
     * Legas aŭ anstataŭigas la momente elektitan tekston en la redaktata teksto
     * @param insertion - se donita la enmetenda teksto (ĉe la aktuala pozicio aŭ anstataŭ la aktuala elekto)
     * @param p_kursoro - se negativa tiom da signoj ni moviĝas antaŭen antaŭ enmeti la tekston, se pozitiva, tiom da signoj ni movas antaŭen la kursoron post enmeto (ekz-e tekstenŝovo)
     * @returns la momente elektita teksto, se ne estas donita enmetenda teksto
     */
    elektenmeto(insertion: string, p_kursoro: number = 0) {
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            txtarea.focus();

            // enmetu tekston ĉe la markita loko
            let startPos = txtarea.selectionStart;
            if (p_kursoro < 0) startPos += p_kursoro; // -1: anstataŭigo kun x-klavo forigu la antaŭan literon!
            txtarea.value = 
                txtarea.value.substring(0, startPos) +
                insertion +
                txtarea.value.substring(txtarea.selectionEnd, txtarea.value.length);
            if (p_kursoro > 0) { // ni antaŭe havis > -1, sed tio ne funkciis por enŝovoj per spacoj
                // movu la kursoron al startPost+p_kursoro, por
                // ekz-e transsalti tekstenŝovon post enmetita snc/ekz/ref
                // vd. redaktilo.insert_xml
                txtarea.selectionStart = startPos + p_kursoro; 
                txtarea.selectionEnd = txtarea.selectionStart;
            } else {
                // movu la kursoron post la aldonita teksto
                txtarea.selectionStart = startPos + insertion.length;
                txtarea.selectionEnd = txtarea.selectionStart;
            }

            // ni ŝangis la tekston, sed la evento "input" ne en ciu retumilo lanciĝas
            // se la klavaro ne estas tuŝita...:
            this.sinkrona = false;
        }
    }

    /**
     * Redonas la momente elektitan tekston
     */
    get elekto(): string|undefined {
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            const startPos = txtarea.selectionStart;
            const endPos = txtarea.selectionEnd;
            return txtarea.value.substring(startPos, endPos);         
        }
    }


    /**
     * Ŝovas la markitan tekston 'ind' signojn dekstren aŭ maldekstren
     * @param ind - la nombro de ŝovendaj spacoj
     */
    set enŝovo(ind: number) {
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            // legu la nunan enŝovon
            const i_ = this.enŝovo?.length || 0;
            const blankoj = Tekst.sxn(" ", Math.abs(
                // ŝovu nur ±1 (±2/2) ĉe momente nepara enŝovo!
                (i_ % 2 == 1)? ind/2 : ind)
            );

            // enŝovu
            txtarea.focus();

            // sekurigu nunan rulpozicion
            const textScroll = txtarea.scrollTop;
            
            // legu nunan elekton
            let startPos = txtarea.selectionStart;
            if (startPos > 0) startPos--;
            let endPos = txtarea.selectionEnd;
            if (endPos > 0) endPos--;
             
            const selText = txtarea.value.substring(startPos, endPos);
 
            if (selText=="") {
                alert("Marku kion vi volas en-/elŝovi.");
            } else {
                let nt; // var por nova teksto
                if (ind > 0)
                    nt = selText.replace(/\n/g, "\n"+blankoj);
                else if (ind < 0) {
                    const re = new RegExp("\n"+blankoj,"g")            
                    nt = selText.replace(re, "\n");
                }
 
                txtarea.value = 
                    txtarea.value.substring(0, startPos)
                    + nt
                    + txtarea.value.substring(endPos, txtarea.value.length);
 
                txtarea.selectionStart = startPos+1;
                txtarea.selectionEnd = startPos + nt.length+1;
 
                // restarigu rul-pozicion
                txtarea.scrollTop = textScroll;
            }

            // ni ŝangis la tekston, sed la evento "input" ne en ĉiu retumilo lanciĝas
            // se la klavaro ne estas tuŝita...:
            this.sinkrona = false;
        }
    }

    /**
     * Redonas la enŝovon en la aktuala linio
     * @returns la enŝovo de la aktuala linio (la spacsignoj en ties komenco)
     */
    get enŝovo(): string|undefined {

        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            const startPos = txtarea.selectionStart;
            const linestart = txtarea.value.substring(0, startPos).lastIndexOf("\n");

            // eltrovu la nunan enŝovon
            let ind = 0;
            while (txtarea.value.substring(0, startPos).charCodeAt(linestart+1+ind) == 32) {ind++;}
            return (Tekst.sxn(" ", ind));  
        }
    };


    /**
     * Signo antaŭ kursoro
     * @returns la signon antaŭ la kursoro
     */
    signo_antaŭ(): string|undefined {
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            const startPos = txtarea.selectionStart;
            //txtarea.setSelectionRange(startPos-1,startPos);
            return txtarea.value.substring(startPos - 1, startPos);
        }
    };

    /**
     * Eltrovu la signojn antaŭ la nuna pozicio (ek de la linikomenco)
     */
    linisignoj_antaŭ(): string|undefined {
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) {
            const poz = this.signo()||0;
            const val = txtarea.value;
            let p = poz;
            while (p>0 && val[p] != '\n') p--;
            return val.substring(p+1,poz);
        }
    };


    /**
     * Metas la kursoron al la komenco de la redaktejo kaj fokusas ĝin
     */
    kursoro_supren() { 
        const txtarea = this.element;
        if (txtarea instanceof HTMLTextAreaElement) { 
            //txtarea.focus(); 
            txtarea.setSelectionRange(0, 0); // problemo en Chrome?
            //txtarea.selectionStart = 0;
            //txtarea.selectionEnd = 0;
            txtarea.focus();
        }
    };

}