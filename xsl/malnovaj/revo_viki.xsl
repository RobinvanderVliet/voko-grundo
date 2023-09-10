<!DOCTYPE xsl:transform>

<xsl:transform
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:saxon="http://saxon.sf.net/"
  version="2.0"
  extension-element-prefixes="saxon" 
>

<!--
    (c) 2021 ĉe Wolfram Diestel
    laŭ permesilo GPL 2.0

    Kreu liston ligantan markojn de Revo-kapvortoj al Viki-paĝoj.
    La Revo-kapvortojn ni legas el inx_kat.xml, kiu keiĝas dum la indekskreado kaj
    la Viki-titolojn el dosiero, kiun ni kreis aparte el titololisto elŝutita de Vikipedio

voku ekz-e:
    saxonb-xslt -xsl:xsl/revo_viki.xsl -s:/home/revo/tmp/inx_tmp/inx_kat.xml

-->

<!--xsl:variable name="viki_xml" select="'../tmp/vikilst.xml'"/-->
<xsl:param name="viki_xml"/>
<xsl:param name="viki_esc"/>

<xsl:variable name="viki" select="document($viki_xml)/viki"/>
<xsl:variable name="esc" select="document($viki_esc)/vikiref"/>
<xsl:variable name="root" select="/"/>

<!-- stumblaĵo en XSL estas, ke la deklaro de ŝlosilo (key) ne rilatas
al specifa el la pluraj fonto-dosieroj, sed tiu estas donita poste per la kuntekston en kiu ni serĉas, vd. https://www.oxygenxml.com/archives/xsl-list/200105/msg00546.html -->
<xsl:key name="rindekso" match="indekso/kap-oj[@lng='eo']/v[@mrk!='']" use="lower-case(k)"/>
<xsl:key name="eindekso" match="vikiref/r" use="@r"/>

<xsl:template match="/">
    <vikiref>
        <!-- komence enŝovu la esceptojn -->
        <xsl:copy-of select="$esc/r"/>

        <!-- nun trakuru la liston de vikipagoj kaj egaligu ilin al la kapvortoj el 'rindekso' -->
        <xsl:for-each select="$viki//v">
            <xsl:call-template name="join">
                <xsl:with-param name="viki" select="."/>
            </xsl:call-template>
        </xsl:for-each>
    </vikiref>
</xsl:template>

<xsl:template name="join">
    <xsl:param name="viki"/>    
    <!--xsl:message select="concat('|',lower-case($vorto),'|')"/-->

    <!-- kunteksto devas esti la dokumento de la indekso! -->
    <xsl:for-each select="$root/key('rindekso',translate(lower-case($viki),'_',' '))">
        <!--xsl:message select="concat('v:',$viki,'==r:',@mrk,'')"/ -->
        <xsl:variable name="mrk" select="@mrk"/>
        <!-- ni nur skribas la referencon, se por la trovita mrk-o ne registriĝis escepto... -->
        <xsl:if test="not($esc/key('eindekso',$mrk))">
            <r v="{$viki}" r="{$mrk}"/>
        </xsl:if>
    </xsl:for-each>
</xsl:template>


</xsl:transform>