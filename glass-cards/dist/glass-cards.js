function t(t,e,a,i){var s,r=arguments.length,n=r<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,a):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,a,i);else for(var o=t.length-1;o>=0;o--)(s=t[o])&&(n=(r<3?s(n):r>3?s(e,a,n):s(e,a))||n);return r>3&&n&&Object.defineProperty(e,a,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,a=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let r=class{constructor(t,e,a){if(this._$cssResult$=!0,a!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(a&&void 0===t){const a=void 0!==e&&1===e.length;a&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),a&&s.set(e,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const a=1===t.length?t[0]:e.reduce((e,a,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+t[i+1],t[0]);return new r(a,t,i)},o=a?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const a of t.cssRules)e+=a.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:l,defineProperty:h,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,g=globalThis,b=g.trustedTypes,m=b?b.emptyScript:"",v=g.reactiveElementPolyfillSupport,f=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let a=t;switch(e){case Boolean:a=null!==t;break;case Number:a=null===t?null:Number(t);break;case Object:case Array:try{a=JSON.parse(t)}catch(t){a=null}}return a}},y=(t,e)=>!l(t,e),_={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=_){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const a=Symbol(),i=this.getPropertyDescriptor(t,a,e);void 0!==i&&h(this.prototype,t,i)}}static getPropertyDescriptor(t,e,a){const{get:i,set:s}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const r=i?.call(this);s?.call(this,e),this.requestUpdate(t,r,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??_}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const a of e)this.createProperty(a,t[a])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,a]of e)this.elementProperties.set(t,a)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const a=this._$Eu(t,e);void 0!==a&&this._$Eh.set(a,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const a=new Set(t.flat(1/0).reverse());for(const t of a)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const a=e.attribute;return!1===a?void 0:"string"==typeof a?a:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const a of e.keys())this.hasOwnProperty(a)&&(t.set(a,this[a]),delete this[a]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,i)=>{if(a)t.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const a of i){const i=document.createElement("style"),s=e.litNonce;void 0!==s&&i.setAttribute("nonce",s),i.textContent=a.cssText,t.appendChild(i)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,a){this._$AK(t,a)}_$ET(t,e){const a=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,a);if(void 0!==i&&!0===a.reflect){const s=(void 0!==a.converter?.toAttribute?a.converter:x).toAttribute(e,a.type);this._$Em=t,null==s?this.removeAttribute(i):this.setAttribute(i,s),this._$Em=null}}_$AK(t,e){const a=this.constructor,i=a._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=a.getPropertyOptions(i),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=i;const r=s.fromAttribute(e,t.type);this[i]=r??this._$Ej?.get(i)??r,this._$Em=null}}requestUpdate(t,e,a,i=!1,s){if(void 0!==t){const r=this.constructor;if(!1===i&&(s=this[t]),a??=r.getPropertyOptions(t),!((a.hasChanged??y)(s,e)||a.useDefault&&a.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,a))))return;this.C(t,e,a)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:a,reflect:i,wrapped:s},r){a&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==s||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||a||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,a]of t){const{wrapped:t}=a,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,a,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[f("elementProperties")]=new Map,w[f("finalized")]=new Map,v?.({ReactiveElement:w}),(g.reactiveElementVersions??=[]).push("2.1.2");const k=globalThis,$=t=>t,E=k.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,C="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,A="?"+M,T=`<${A}>`,N=document,F=()=>N.createComment(""),P=t=>null===t||"object"!=typeof t&&"function"!=typeof t,D=Array.isArray,z="[ \t\n\f\r]",j=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,L=/-->/g,I=/>/g,O=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),B=/'/g,R=/"/g,H=/^(?:script|style|textarea|title)$/i,V=t=>(e,...a)=>({_$litType$:t,strings:e,values:a}),U=V(1),G=V(2),W=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),X=new WeakMap,Y=N.createTreeWalker(N,129);function K(t,e){if(!D(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const Z=(t,e)=>{const a=t.length-1,i=[];let s,r=2===e?"<svg>":3===e?"<math>":"",n=j;for(let e=0;e<a;e++){const a=t[e];let o,l,h=-1,c=0;for(;c<a.length&&(n.lastIndex=c,l=n.exec(a),null!==l);)c=n.lastIndex,n===j?"!--"===l[1]?n=L:void 0!==l[1]?n=I:void 0!==l[2]?(H.test(l[2])&&(s=RegExp("</"+l[2],"g")),n=O):void 0!==l[3]&&(n=O):n===O?">"===l[0]?(n=s??j,h=-1):void 0===l[1]?h=-2:(h=n.lastIndex-l[2].length,o=l[1],n=void 0===l[3]?O:'"'===l[3]?R:B):n===R||n===B?n=O:n===L||n===I?n=j:(n=O,s=void 0);const d=n===O&&t[e+1].startsWith("/>")?" ":"";r+=n===j?a+T:h>=0?(i.push(o),a.slice(0,h)+C+a.slice(h)+M+d):a+M+(-2===h?e:d)}return[K(t,r+(t[a]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class J{constructor({strings:t,_$litType$:e},a){let i;this.parts=[];let s=0,r=0;const n=t.length-1,o=this.parts,[l,h]=Z(t,e);if(this.el=J.createElement(l,a),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=Y.nextNode())&&o.length<n;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(C)){const e=h[r++],a=i.getAttribute(t).split(M),n=/([.?@])?(.*)/.exec(e);o.push({type:1,index:s,name:n[2],strings:a,ctor:"."===n[1]?it:"?"===n[1]?st:"@"===n[1]?rt:at}),i.removeAttribute(t)}else t.startsWith(M)&&(o.push({type:6,index:s}),i.removeAttribute(t));if(H.test(i.tagName)){const t=i.textContent.split(M),e=t.length-1;if(e>0){i.textContent=E?E.emptyScript:"";for(let a=0;a<e;a++)i.append(t[a],F()),Y.nextNode(),o.push({type:2,index:++s});i.append(t[e],F())}}}else if(8===i.nodeType)if(i.data===A)o.push({type:2,index:s});else{let t=-1;for(;-1!==(t=i.data.indexOf(M,t+1));)o.push({type:7,index:s}),t+=M.length-1}s++}}static createElement(t,e){const a=N.createElement("template");return a.innerHTML=t,a}}function Q(t,e,a=t,i){if(e===W)return e;let s=void 0!==i?a._$Co?.[i]:a._$Cl;const r=P(e)?void 0:e._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),void 0===r?s=void 0:(s=new r(t),s._$AT(t,a,i)),void 0!==i?(a._$Co??=[])[i]=s:a._$Cl=s),void 0!==s&&(e=Q(t,s._$AS(t,e.values),s,i)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:a}=this._$AD,i=(t?.creationScope??N).importNode(e,!0);Y.currentNode=i;let s=Y.nextNode(),r=0,n=0,o=a[0];for(;void 0!==o;){if(r===o.index){let e;2===o.type?e=new et(s,s.nextSibling,this,t):1===o.type?e=new o.ctor(s,o.name,o.strings,this,t):6===o.type&&(e=new nt(s,this,t)),this._$AV.push(e),o=a[++n]}r!==o?.index&&(s=Y.nextNode(),r++)}return Y.currentNode=N,i}p(t){let e=0;for(const a of this._$AV)void 0!==a&&(void 0!==a.strings?(a._$AI(t,a,e),e+=a.strings.length-2):a._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,a,i){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=a,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),P(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>D(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&P(this._$AH)?this._$AA.nextSibling.data=t:this.T(N.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:a}=t,i="number"==typeof a?this._$AC(t):(void 0===a.el&&(a.el=J.createElement(K(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new tt(i,this),a=t.u(this.options);t.p(e),this.T(a),this._$AH=t}}_$AC(t){let e=X.get(t.strings);return void 0===e&&X.set(t.strings,e=new J(t)),e}k(t){D(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let a,i=0;for(const s of t)i===e.length?e.push(a=new et(this.O(F()),this.O(F()),this,this.options)):a=e[i],a._$AI(s),i++;i<e.length&&(this._$AR(a&&a._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=$(t).nextSibling;$(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class at{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,a,i,s){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=s,a.length>2||""!==a[0]||""!==a[1]?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=q}_$AI(t,e=this,a,i){const s=this.strings;let r=!1;if(void 0===s)t=Q(this,t,e,0),r=!P(t)||t!==this._$AH&&t!==W,r&&(this._$AH=t);else{const i=t;let n,o;for(t=s[0],n=0;n<s.length-1;n++)o=Q(this,i[a+n],e,n),o===W&&(o=this._$AH[n]),r||=!P(o)||o!==this._$AH[n],o===q?t=q:t!==q&&(t+=(o??"")+s[n+1]),this._$AH[n]=o}r&&!i&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends at{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class st extends at{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class rt extends at{constructor(t,e,a,i,s){super(t,e,a,i,s),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??q)===W)return;const a=this._$AH,i=t===q&&a!==q||t.capture!==a.capture||t.once!==a.once||t.passive!==a.passive,s=t!==q&&(a===q||i);i&&this.element.removeEventListener(this.name,this,a),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,a){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const ot=k.litHtmlPolyfillSupport;ot?.(J,et),(k.litHtmlVersions??=[]).push("3.3.2");const lt=globalThis;class ht extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,a)=>{const i=a?.renderBefore??e;let s=i._$litPart$;if(void 0===s){const t=a?.renderBefore??null;i._$litPart$=s=new et(e.insertBefore(F(),t),t,void 0,a??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}ht._$litElement$=!0,ht.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ht});const ct=lt.litElementPolyfillSupport;ct?.({LitElement:ht}),(lt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,a)=>{void 0!==a?a.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:y},ut=(t=pt,e,a)=>{const{kind:i,metadata:s}=a;let r=globalThis.litPropertyMetadata.get(s);if(void 0===r&&globalThis.litPropertyMetadata.set(s,r=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),r.set(a.name,t),"accessor"===i){const{name:i}=a;return{set(a){const s=e.get.call(this);e.set.call(this,a),this.requestUpdate(i,s,t,!0,a)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){const{name:i}=a;return function(a){const s=this[i];e.call(this,a),this.requestUpdate(i,s,t,!0,a)}}throw Error("Unsupported decorator location: "+i)};function gt(t){return(e,a)=>"object"==typeof a?ut(t,e,a):((t,e,a)=>{const i=e.hasOwnProperty(a);return e.constructor.createProperty(a,t),i?Object.getOwnPropertyDescriptor(e,a):void 0})(t,e,a)}function bt(t){return gt({...t,state:!0,attribute:!1})}let mt=class extends ht{constructor(){super(...arguments),this._cards=[],this._activeView=null,this._cardConfigs=[],this._boundHashChange=this._onHashChange.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._boundHashChange),this._activeView=this._getViewFromHash()??this._config?.default_view??null}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._boundHashChange)}_onHashChange(){const t=this._getViewFromHash();null!==t&&(this._activeView=t),location.hash&&"#"!==location.hash||(this._activeView=this._config?.default_view??null)}_getViewFromHash(){const t=location.hash.replace("#","");if(!t)return null;return(this._config?.views??[]).includes(t)?t:null}setConfig(t){this._config=t,this._activeView=this._getViewFromHash()??t.default_view??null,this._createCards()}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createCards(){this._config.cards&&(this._cardConfigs=this._config.cards,this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,a=document.createElement(e);return"function"==typeof a.setConfig&&a.setConfig(t),a}),this.requestUpdate())}render(){const t=this._cards.filter((t,e)=>{const a=this._cardConfigs[e];return!a||!a.view||a.view===this._activeView});return U`
      <div class="background"></div>
      <div class="content">
        ${t.map(t=>t)}
      </div>
    `}getCardSize(){return 6}};mt.styles=[n`
      :host {
        display: block;
        min-height: 100vh;
        position: relative;
      }
      .background {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #0b1120;
        z-index: -1;
      }
      .content {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding: 8px;
        padding-bottom: 72px;
        max-width: 600px;
        margin: 0 auto;
      }
      /* Full-width cards */
      .content > glass-header,
      .content > glass-nav-bar,
      .content > glass-popup,
      .content > glass-info-row,
      .content > glass-section,
      .content > glass-light-slider,
      .content > glass-departure-card {
        grid-column: 1 / -1;
      }
      /* Buttons and room cards fill 1 column each */
      .content > glass-button,
      .content > glass-room-card {
        grid-column: span 1;
      }
      /* Responsive: wider screens get more breathing room */
      @media (min-width: 600px) {
        .content {
          gap: 12px;
          padding: 12px;
          padding-bottom: 80px;
          max-width: 700px;
        }
      }
      /* Desktop: allow 3 columns for buttons */
      @media (min-width: 900px) {
        .content {
          max-width: 900px;
          grid-template-columns: 1fr 1fr 1fr;
        }
      }
    `],t([gt({attribute:!1})],mt.prototype,"_config",void 0),t([gt({attribute:!1})],mt.prototype,"_cards",void 0),t([bt()],mt.prototype,"_activeView",void 0),mt=t([dt("glass-background")],mt);class vt extends ht{constructor(){super(...arguments),this._trackedEntities=[],this._previousStates={}}setConfig(t){this._config=t}setTrackedEntities(t){this._trackedEntities=t.filter(Boolean)}shouldUpdate(){if(!this.hass)return!1;if(0===this._trackedEntities.length)return!0;let t=!1;for(const e of this._trackedEntities){const a=this.hass.states[e]?.state;this._previousStates[e]!==a&&(this._previousStates[e]=a,t=!0)}return t}getEntity(t){return this.hass?.states[t]}getState(t){return this.hass?.states[t]?.state??"unavailable"}getEntityAttribute(t,e){return this.hass?.states[t]?.attributes[e]}isOn(t){return"on"===this.getState(t)}callService(t,e,a,i){this.hass?.callService(t,e,a,i?{entity_id:i}:void 0)}toggle(t){const[e]=t.split(".");this.callService(e,"toggle",void 0,t)}getCardSize(){return 1}static get glassStyles(){return n`
      :host {
        --glass-bg: rgba(255, 255, 255, 0.06);
        --glass-bg-hover: rgba(255, 255, 255, 0.10);
        --glass-bg-active: rgba(255, 255, 255, 0.14);
        --glass-border: rgba(255, 255, 255, 0.10);
        --glass-border-active: rgba(79, 195, 247, 0.30);
        --glass-accent: #4FC3F7;
        --glass-accent-light: #B3E5FC;
        --glass-accent-glow: rgba(79, 195, 247, 0.30);
        --glass-text-primary: rgba(255, 255, 255, 0.95);
        --glass-text-secondary: rgba(255, 255, 255, 0.55);
        --glass-text-dim: rgba(255, 255, 255, 0.35);
        --glass-radius: 16px;
        --glass-radius-sm: 10px;
        --glass-radius-pill: 50px;
        --glass-blur: 20px;
        --glass-transition: 0.3s ease;
        --glass-coral: #EF5350;
        --glass-green: #66BB6A;

        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: var(--glass-text-primary);
        -webkit-tap-highlight-color: transparent;
      }

      .glass {
        background: var(--glass-bg);
        backdrop-filter: blur(var(--glass-blur));
        -webkit-backdrop-filter: blur(var(--glass-blur));
        border: 1px solid var(--glass-border);
        border-radius: var(--glass-radius);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      }

      .glass:hover {
        background: var(--glass-bg-hover);
      }

      .glass.active {
        background: var(--glass-bg-active);
        border-color: var(--glass-border-active);
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 0 20px var(--glass-accent-glow),
          0 0 60px rgba(79, 195, 247, 0.1);
      }
    `}}t([gt({attribute:!1})],vt.prototype,"hass",void 0),t([gt({attribute:!1})],vt.prototype,"_config",void 0);let ft=class extends vt{get _buttonConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleTap(){const t=this._buttonConfig.tap_action?.action??"toggle";"toggle"===t&&this._config.entity?this.toggle(this._config.entity):"navigate"===t&&this._buttonConfig.tap_action?.navigation_path&&(window.location.hash=this._buttonConfig.tap_action.navigation_path)}render(){if(!this.hass||!this._config)return U``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=!!t&&this.isOn(this._config.entity),a=this._config.name??t?.attributes.friendly_name??"",i=this._config.icon??t?.attributes.icon??"mdi:help-circle";let s="";if(!1!==this._buttonConfig.show_state&&t){const e=t.attributes.unit_of_measurement;s=e?`${t.state} ${e}`:"on"===t.state?"Pa":"off"===t.state?"Av":t.state}return U`
      <div class="glass button ${e?"active":""}" @click=${this._handleTap}>
        <div class="icon-wrap">
          <ha-icon .icon=${i}></ha-icon>
        </div>
        <div class="info">
          <div class="name">${a}</div>
          ${s?U`<div class="state">${s}</div>`:""}
        </div>
      </div>
    `}};ft.styles=[vt.glassStyles,n`
      :host { display: block; }
      .button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
      }
      .button:active {
        background: var(--glass-bg-active);
        transform: scale(0.98);
      }
      .icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        transition: all var(--glass-transition);
      }
      .active .icon-wrap {
        background: rgba(79, 195, 247, 0.15);
        box-shadow: 0 0 16px rgba(79, 195, 247, 0.2);
      }
      .icon-wrap ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
        transition: color var(--glass-transition);
      }
      .active .icon-wrap ha-icon { color: var(--glass-accent); }
      .info { flex: 1; min-width: 0; }
      .name {
        font-size: 14px;
        font-weight: 500;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .state {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .active .state { color: var(--glass-text-secondary); }
    `],ft=t([dt("glass-button")],ft);let xt=class extends vt{setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}get _chipConfig(){return this._config}render(){if(!this.hass||!this._config)return U``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._chipConfig.chip_type??"custom";let a=this._config.icon??"",i="",s=!1;switch(e){case"person":{const e=t?.attributes.friendly_name??"",r=t?.state??"";a=a||"mdi:account",i=`${e} · ${"home"===r?"Hemma":"Borta"}`,s="home"===r;break}case"battery":{const e=t?.state??"?";a=a||"mdi:cellphone",i=`${e} %`,s=Number(e)>20;break}case"lights":{const e=t?.state??"0";a=a||"mdi:lightbulb-group",i=`${e} st`,s=Number(e)>0;break}default:a=a||"mdi:information",i=this._chipConfig.content??t?.state??""}return U`
      <div class="chip ${s?"active":""}">
        <ha-icon .icon=${a}></ha-icon>
        <span class="value">${i}</span>
      </div>
    `}};xt.styles=[vt.glassStyles,n`
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--glass-radius-pill);
        font-size: 13px;
        font-weight: 500;
        color: var(--glass-text-secondary);
        white-space: nowrap;
        cursor: default;
        transition: all var(--glass-transition);
      }
      .chip.active {
        color: var(--glass-text-primary);
        background: rgba(79, 195, 247, 0.12);
        border-color: rgba(79, 195, 247, 0.2);
      }
      .chip ha-icon {
        --mdc-icon-size: 16px;
        display: flex;
      }
      .chip .value {
        font-variant-numeric: tabular-nums;
      }
    `],xt=t([dt("glass-chip")],xt);let yt=class extends vt{get _headerConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.weather_entity&&e.push(t.weather_entity),t.chips&&t.chips.forEach(t=>{t.entity&&e.push(t.entity)}),this.setTrackedEntities(e)}_renderChip(t){const e=this.getEntity(t.entity);if(!e)return U``;let a=t.icon??"",i="",s=!1;switch(t.chip_type){case"person":a=a||"mdi:account";i=`${e.attributes.friendly_name??""} · ${"home"===e.state?"Hemma":"Borta"}`,s="home"===e.state;break;case"battery":a=a||"mdi:cellphone",i=`${e.state} %`,s=Number(e.state)>20;break;case"lights":a=a||"mdi:lightbulb-group",i=`${e.state} st`,s=Number(e.state)>0;break;default:a=a||"mdi:information",i=e.state}return U`
      <div class="chip ${s?"active":""}">
        <ha-icon .icon=${a}></ha-icon>
        <span>${i}</span>
      </div>
    `}render(){if(!this.hass||!this._config)return U``;const t=this.hass.user?.name??"",e=!1!==this._headerConfig.greeting?function(t){const e=(new Date).getHours();return e>=5&&e<10?`God morgon, ${t}`:e>=10&&e<17?`Hej, ${t}`:e>=17&&e<22?`God kvall, ${t}`:`God natt, ${t}`}(t):t,a=this._headerConfig.weather_entity?this.getEntity(this._headerConfig.weather_entity):void 0,i=a?.state??"",s=a?.attributes.temperature??"",r=a?.attributes.temperature_unit??"°C",n={"clear-night":"mdi:weather-night",cloudy:"mdi:weather-cloudy",fog:"mdi:weather-fog",hail:"mdi:weather-hail",lightning:"mdi:weather-lightning","lightning-rainy":"mdi:weather-lightning-rainy",partlycloudy:"mdi:weather-partly-cloudy",pouring:"mdi:weather-pouring",rainy:"mdi:weather-rainy",snowy:"mdi:weather-snowy","snowy-rainy":"mdi:weather-snowy-rainy",sunny:"mdi:weather-sunny",windy:"mdi:weather-windy","windy-variant":"mdi:weather-windy-variant",exceptional:"mdi:alert-circle-outline"}[i]??"mdi:weather-cloudy";return U`
      <div class="glass header">
        <div class="top-row">
          <div class="home-icon">
            <ha-icon icon="mdi:home"></ha-icon>
          </div>
          <div class="greeting-section">
            <div class="greeting">${e}</div>
            ${a?U`
              <div class="weather">
                <ha-icon .icon=${n}></ha-icon>
                ${{"clear-night":"Klart",cloudy:"Molnigt",fog:"Dimma",partlycloudy:"Delvis molnigt",rainy:"Regn",snowy:"Sno",sunny:"Soligt",windy:"Blasigt"}[i]??i} \u2022 ${s}${r}
              </div>
            `:""}
          </div>
        </div>
        ${this._headerConfig.chips?.length?U`
          <div class="chips">
            ${this._headerConfig.chips.map(t=>this._renderChip(t))}
          </div>
        `:""}
      </div>
    `}};yt.styles=[vt.glassStyles,n`
      :host { display: block; }
      .header { padding: 12px 14px; }
      .top-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .home-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(79, 195, 247, 0.12);
        flex-shrink: 0;
      }
      .home-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-accent);
      }
      .greeting-section { flex: 1; min-width: 0; }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .weather {
        font-size: 13px;
        color: var(--glass-text-secondary);
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .weather ha-icon { --mdc-icon-size: 16px; }
      .chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--glass-radius-pill);
        font-size: 13px;
        font-weight: 500;
        color: var(--glass-text-secondary);
        white-space: nowrap;
      }
      .chip.active {
        color: var(--glass-text-primary);
        background: rgba(79, 195, 247, 0.12);
        border-color: rgba(79, 195, 247, 0.2);
      }
      .chip ha-icon {
        --mdc-icon-size: 16px;
        display: flex;
      }
    `],yt=t([dt("glass-header")],yt);let _t=class extends vt{get _roomConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.sub_buttons&&t.sub_buttons.forEach(t=>e.push(t.entity)),this.setTrackedEntities(e)}_handleCardTap(){this._roomConfig.popup_id&&(window.location.hash=this._roomConfig.popup_id)}_handleSubButtonTap(t,e){t.stopPropagation(),this.toggle(e)}render(){if(!this.hass||!this._config)return U``;const t=this._roomConfig.sub_buttons??[],e=t.map(t=>t.entity);this._config.entity&&!e.includes(this._config.entity)&&e.unshift(this._config.entity);const a=e.some(t=>this.isOn(t)),i=function(t,e){const a=function(t,e){return e.filter(e=>"on"===t[e]?.state).length}(t,e);return 0===a?"Av":1===a?"Pa":`${a} lampor pa`}(this.hass.states,e),s=this._config.icon??"mdi:home",r=this._config.name??"";return U`
      <div class="glass room-card ${a?"active":""}" @click=${this._handleCardTap}>
        <div class="top">
          <div class="room-icon">
            <ha-icon .icon=${s}></ha-icon>
          </div>
          <div class="room-info">
            <div class="room-name">${r}</div>
            <div class="room-status">${i}</div>
          </div>
        </div>
        ${t.length?U`
          <div class="sub-buttons">
            ${t.map(t=>{const e=this.isOn(t.entity),a=t.icon??this.getEntity(t.entity)?.attributes.icon??"mdi:lightbulb";return U`
                <div
                  class="sub-btn ${e?"on":""}"
                  @click=${e=>this._handleSubButtonTap(e,t.entity)}
                  title=${t.name??this.getEntity(t.entity)?.attributes.friendly_name??t.entity}
                >
                  <ha-icon .icon=${a}></ha-icon>
                </div>
              `})}
          </div>
        `:""}
      </div>
    `}};_t.styles=[vt.glassStyles,n`
      :host { display: block; }
      .room-card {
        padding: 12px;
        cursor: pointer;
        user-select: none;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .room-card:active { transform: scale(0.97); }
      .top {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .room-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
        transition: all var(--glass-transition);
      }
      .active .room-icon {
        background: rgba(79, 195, 247, 0.12);
        box-shadow: 0 0 12px rgba(79, 195, 247, 0.15);
      }
      .room-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
        transition: color var(--glass-transition);
      }
      .active .room-icon ha-icon { color: var(--glass-accent); }
      .room-info { flex: 1; min-width: 0; }
      .room-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .room-status {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
      }
      .active .room-status { color: var(--glass-accent); }
      .sub-buttons {
        display: flex;
        gap: 5px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
      .sub-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: all var(--glass-transition);
      }
      .sub-btn:hover { background: rgba(255, 255, 255, 0.10); }
      .sub-btn.on {
        background: rgba(79, 195, 247, 0.15);
        border-color: rgba(79, 195, 247, 0.25);
      }
      .sub-btn ha-icon {
        --mdc-icon-size: 16px;
        color: var(--glass-text-dim);
      }
      .sub-btn.on ha-icon { color: var(--glass-accent); }
    `],_t=t([dt("glass-room-card")],_t);let wt=class extends vt{constructor(){super(...arguments),this._dragging=!1,this._dragValue=0,this._stopEvent=t=>{t.stopPropagation()},this._toggleLight=t=>{t.stopPropagation(),this._config?.entity&&this.toggle(this._config.entity)}}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleSliderInteraction(t){if(!this._config.entity)return;const e=this.getEntity(this._config.entity);if(!e||"off"===e.state)return void this.callService("light","turn_on",{brightness_pct:100},this._config.entity);const a=t.currentTarget.getBoundingClientRect(),i=t=>{const e=Math.max(0,Math.min(t-a.left,a.width)),i=Math.round(e/a.width*100);this._dragValue=Math.max(1,Math.min(100,i))},s="touches"in t?t.touches[0].clientX:t.clientX;i(s),this._dragging=!0;const r=t=>{const e="touches"in t?t.touches[0].clientX:t.clientX;i(e)},n=()=>{this._dragging=!1,this.callService("light","turn_on",{brightness_pct:this._dragValue},this._config.entity),document.removeEventListener("mousemove",r),document.removeEventListener("mouseup",n),document.removeEventListener("touchmove",r),document.removeEventListener("touchend",n)};document.addEventListener("mousemove",r),document.addEventListener("mouseup",n),document.addEventListener("touchmove",r,{passive:!0}),document.addEventListener("touchend",n)}render(){if(!this.hass||!this._config?.entity)return U``;const t=this.getEntity(this._config.entity);if(!t)return U``;const e="on"===t.state,a=this._dragging?this._dragValue:function(t){if(!t||"on"!==t.state)return 0;const e=t.attributes.brightness;return e?Math.round(e/255*100):100}(t),i=this._config.name??t.attributes.friendly_name??"",s=this._config.icon??t.attributes.icon??"mdi:lightbulb";return U`
      <div class="glass slider-card ${e?"on":"off"}">
        <div class="slider-header">
          <div class="slider-left">
            <button
              class="light-icon-btn"
              role="button"
              aria-pressed=${e?"true":"false"}
              aria-label=${e?`Släck ${i}`:`Tänd ${i}`}
              @pointerdown=${this._stopEvent}
              @mousedown=${this._stopEvent}
              @touchstart=${this._stopEvent}
              @click=${this._toggleLight}
            >
              <span class="light-icon">
                <ha-icon .icon=${s}></ha-icon>
              </span>
            </button>
            <span class="light-name">${i}</span>
          </div>
          <span class="brightness-value">${e?`${a}%`:"Av"}</span>
        </div>
        <div class="slider-track" @mousedown=${this._handleSliderInteraction} @touchstart=${this._handleSliderInteraction}>
          ${e?U`
            <div class="slider-fill ${this._dragging?"dragging":""}" style="width: ${a}%"></div>
            <div class="slider-glow" style="left: calc(${a}% - 12px)"></div>
          `:U`
            <div class="off-overlay" @click=${()=>this.callService("light","turn_on",{brightness_pct:100},this._config.entity)}>
              Tryck för att tända
            </div>
          `}
        </div>
      </div>
    `}};wt.styles=[vt.glassStyles,n`
      :host { display: block; }
      .slider-card { padding: 16px; }
      .slider-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .slider-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .light-icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        min-height: 48px;
        margin: -6px;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .light-icon-btn:focus-visible {
        outline: 2px solid var(--hub-amber, var(--glass-accent));
        outline-offset: 2px;
        border-radius: 14px;
      }
      .light-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--hub-icon-chip-bg, rgba(255, 255, 255, 0.06));
        transition: background var(--glass-transition), box-shadow var(--glass-transition),
          transform 0.15s ease;
      }
      .light-icon-btn:active .light-icon { transform: scale(0.9); }
      .on .light-icon {
        background: var(--hub-amber, var(--glass-accent));
        box-shadow: var(--hub-amber-glow, 0 0 12px rgba(79, 195, 247, 0.15));
      }
      .light-icon ha-icon {
        --mdc-icon-size: 20px;
        color: var(--hub-icon-chip-color, var(--glass-text-dim));
        transition: color var(--glass-transition);
      }
      .on .light-icon ha-icon { color: var(--hub-surface, #ffffff); }
      .light-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--hub-text, var(--glass-text-primary));
      }
      .brightness-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--hub-text-muted, var(--glass-text-dim));
        font-variant-numeric: tabular-nums;
        min-width: 36px;
        text-align: right;
      }
      .on .brightness-value { color: var(--hub-amber, var(--glass-accent)); }
      .slider-track {
        position: relative;
        height: 36px;
        border-radius: 18px;
        background: var(--hub-track, rgba(255, 255, 255, 0.06));
        overflow: hidden;
        cursor: pointer;
        touch-action: none;
      }
      .slider-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 18px;
        background: linear-gradient(
          90deg,
          var(--hub-amber, var(--glass-accent)),
          var(--hub-amber-muted, var(--glass-accent-light, #B3E5FC))
        );
        transition: width 0.15s ease;
        pointer-events: none;
      }
      .slider-fill.dragging { transition: none; }
      .slider-glow {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 24px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--hub-amber, rgba(79, 195, 247, 0.4)), transparent);
        filter: blur(6px);
        pointer-events: none;
        transition: opacity var(--glass-transition);
        opacity: 0;
      }
      .on .slider-glow { opacity: 1; }
      .off-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: var(--hub-text-dim, var(--glass-text-dim));
        cursor: pointer;
      }
    `],t([bt()],wt.prototype,"_dragging",void 0),t([bt()],wt.prototype,"_dragValue",void 0),wt=t([dt("glass-light-slider")],wt);const kt=n`
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    25% { background-position: 50% 100%; }
    50% { background-position: 100% 50%; }
    75% { background-position: 50% 0%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;let $t=class extends ht{constructor(){super(...arguments),this._isOpen=!1,this._isClosing=!1,this._cards=[],this._onHashChange=()=>{this._checkHash()}}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._onHashChange),this._checkHash()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}_checkHash(){if(!this._config?.hash)return;const t=window.location.hash.replace("#","");t!==this._config.hash||this._isOpen?t!==this._config.hash&&this._isOpen&&this._close():this._open()}_open(){this._isOpen=!0,this._isClosing=!1,this._createPopupCards()}_close(){this._isClosing=!0,setTimeout(()=>{this._isOpen=!1,this._isClosing=!1},350),window.location.hash.replace("#","")===this._config.hash&&history.replaceState(null,"",window.location.pathname+window.location.search)}_handleBackdropClick(){this._close()}setConfig(t){if(!t.hash)throw new Error('glass-popup requires a "hash" property');this._config=t}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createPopupCards(){this._config?.cards&&(this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,a=document.createElement(e);return"function"==typeof a.setConfig&&a.setConfig(t),this.hass&&(a.hass=this.hass),a}),this.requestUpdate())}render(){return this._isOpen||this._isClosing?U`
      <div class="overlay ${this._isOpen&&!this._isClosing?"open":""} ${this._isClosing?"closing":""}">
        <div class="backdrop" @click=${this._handleBackdropClick}></div>
        <div class="panel">
          <div class="handle"></div>
          ${this._config.title?U`
            <div class="popup-header">
              ${this._config.icon?U`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
              <span class="popup-title">${this._config.title}</span>
            </div>
          `:""}
          <div class="popup-cards">
            ${this._cards.map(t=>t)}
          </div>
        </div>
      </div>
    `:U``}getCardSize(){return 0}};$t.styles=[kt,n`
      :host { display: block; }
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 999;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .overlay.open {
        pointer-events: auto;
        opacity: 1;
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .panel {
        position: relative;
        width: 100%;
        max-width: 500px;
        max-height: 85vh;
        overflow-y: auto;
        background: rgba(20, 20, 40, 0.85);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px 24px 0 0;
        padding: 20px;
        padding-bottom: 40px;
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .overlay.open .panel { transform: translateY(0); }
      .overlay.closing .panel { transform: translateY(100%); }
      .handle {
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 auto 16px;
      }
      .popup-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .popup-header ha-icon {
        --mdc-icon-size: 24px;
        color: rgba(79, 195, 247, 0.8);
      }
      .popup-title {
        font-size: 18px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
      }
      .popup-cards {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `],t([gt({attribute:!1})],$t.prototype,"_config",void 0),t([bt()],$t.prototype,"_isOpen",void 0),t([bt()],$t.prototype,"_isClosing",void 0),$t=t([dt("glass-popup")],$t);let Et=class extends ht{constructor(){super(...arguments),this._activeHash="",this._onHashChange=()=>{const t=window.location.hash.replace("#","");this._config.items.some(e=>e.hash===t)&&(this._activeHash=t)}}connectedCallback(){super.connectedCallback(),this._activeHash=window.location.hash.replace("#","")||this._config?.items?.[0]?.hash||"",window.addEventListener("hashchange",this._onHashChange)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}setConfig(t){if(!t.items?.length)throw new Error('glass-nav-bar requires "items"');this._config=t}_handleTap(t){this._activeHash=t,window.location.hash=t}render(){return this._config?.items?U`
      <div class="nav-bar">
        ${this._config.items.map(t=>U`
          <div class="nav-item ${this._activeHash===t.hash?"active":""}" @click=${()=>this._handleTap(t.hash)}>
            <ha-icon .icon=${t.icon}></ha-icon>
            <span class="nav-label">${t.label}</span>
          </div>
        `)}
      </div>
    `:U``}getCardSize(){return 0}};Et.styles=n`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 0 12px 12px;
      pointer-events: none;
    }
    .nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-around;
      max-width: 500px;
      margin: 0 auto;
      padding: 8px 4px;
      background: rgba(15, 15, 35, 0.75);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      pointer-events: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 6px 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.25s ease;
      -webkit-tap-highlight-color: transparent;
      position: relative;
    }
    .nav-item:active { transform: scale(0.92); }
    .nav-item.active { background: rgba(79, 195, 247, 0.10); }
    .nav-item.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 2px;
      border-radius: 1px;
      background: #4FC3F7;
      box-shadow: 0 0 8px rgba(79, 195, 247, 0.5);
    }
    .nav-item ha-icon {
      --mdc-icon-size: 22px;
      color: rgba(255, 255, 255, 0.35);
      transition: color 0.25s ease;
    }
    .nav-item.active ha-icon { color: #4FC3F7; }
    .nav-label {
      font-size: 10px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.35);
      transition: color 0.25s ease;
    }
    .nav-item.active .nav-label { color: rgba(255, 255, 255, 0.85); }
  `,t([gt({attribute:!1})],Et.prototype,"hass",void 0),t([gt({attribute:!1})],Et.prototype,"_config",void 0),t([bt()],Et.prototype,"_activeHash",void 0),Et=t([dt("glass-nav-bar")],Et);let St=class extends vt{get _vacuumConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getStatusText(t){return{cleaning:"Stader",docked:"Dockad",paused:"Pausad",returning:"Atergar",idle:"Inaktiv",error:"Fel",unavailable:"Otillganglig"}[t]??t}_start(){this._config.entity&&this.callService("vacuum","start",void 0,this._config.entity)}_stop(){this._config.entity&&this.callService("vacuum","return_to_base",void 0,this._config.entity)}_cleanRoom(t){this._config.entity&&null!=t.room_id&&this.callService("vacuum","send_command",{command:"app_segment_clean",params:[t.room_id]},this._config.entity)}render(){if(!this.hass||!this._config?.entity)return U``;const t=this.getEntity(this._config.entity);if(!t)return U``;const e=t.state,a="cleaning"===e,i="error"===e,s=t.attributes.battery_level,r=this._config.name??t.attributes.friendly_name??"Vacuum",n=this._config.icon??"mdi:robot-vacuum";return U`
      <div
        class="glass vacuum-card ${a?"cleaning":""} ${i?"error":""}"
      >
        <div class="vacuum-header">
          <div class="vacuum-icon">
            <ha-icon .icon=${n}></ha-icon>
          </div>
          <div class="vacuum-info">
            <div class="vacuum-name">${r}</div>
            <div class="vacuum-status">${this._getStatusText(e)}</div>
          </div>
          ${null!=s?U`
                <div class="vacuum-battery">
                  <ha-icon
                    icon="mdi:battery${s>80?"":s>60?"-80":s>40?"-60":s>20?"-40":"-20"}"
                  ></ha-icon>
                  ${s}%
                </div>
              `:""}
        </div>
        <div class="controls">
          <div class="control-btn" @click=${this._start}>
            <ha-icon icon="mdi:play"></ha-icon> Starta
          </div>
          <div class="control-btn" @click=${this._stop}>
            <ha-icon icon="mdi:home"></ha-icon> Docka
          </div>
        </div>
        ${this._vacuumConfig.rooms?.length?U`
              <div class="rooms">
                ${this._vacuumConfig.rooms.map(t=>U`
                    <div class="room-btn" @click=${()=>this._cleanRoom(t)}>
                      ${t.name}
                    </div>
                  `)}
              </div>
            `:""}
      </div>
    `}};St.styles=[vt.glassStyles,n`
      :host {
        display: block;
      }
      .vacuum-card {
        padding: 16px;
      }
      .vacuum-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }
      .vacuum-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        transition: all var(--glass-transition);
      }
      .cleaning .vacuum-icon {
        background: rgba(79, 195, 247, 0.12);
        animation: pulseGlow 2s ease infinite;
      }
      @keyframes pulseGlow {
        0%,
        100% {
          box-shadow: 0 0 8px rgba(79, 195, 247, 0.1);
        }
        50% {
          box-shadow: 0 0 16px rgba(79, 195, 247, 0.3);
        }
      }
      .vacuum-icon ha-icon {
        --mdc-icon-size: 24px;
        color: var(--glass-text-secondary);
        transition: all var(--glass-transition);
      }
      .cleaning .vacuum-icon ha-icon {
        color: var(--glass-accent);
      }
      .vacuum-info {
        flex: 1;
      }
      .vacuum-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .vacuum-status {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
      }
      .cleaning .vacuum-status {
        color: var(--glass-accent);
      }
      .error .vacuum-status {
        color: var(--glass-coral);
      }
      .vacuum-battery {
        font-size: 12px;
        color: var(--glass-text-dim);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .vacuum-battery ha-icon {
        --mdc-icon-size: 16px;
      }
      .controls {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .control-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: all var(--glass-transition);
        font-size: 12px;
        font-weight: 500;
        color: var(--glass-text-secondary);
      }
      .control-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .control-btn:active {
        transform: scale(0.96);
      }
      .control-btn ha-icon {
        --mdc-icon-size: 18px;
      }
      .rooms {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .room-btn {
        padding: 8px 14px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        color: var(--glass-text-secondary);
        transition: all var(--glass-transition);
      }
      .room-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.12);
      }
      .room-btn:active {
        transform: scale(0.96);
      }
    `],St=t([dt("glass-vacuum-card")],St);let Ct=class extends vt{get _infoConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.secondary_entity&&e.push(t.secondary_entity),t.badge_entity&&e.push(t.badge_entity),this.setTrackedEntities(e)}render(){if(!this.hass||!this._config)return U``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._config.name??t?.attributes.friendly_name??"",a=this._config.icon??t?.attributes.icon??"mdi:information";let i=t?.state??"";const s=t?.attributes.unit_of_measurement;s&&(i=`${i} ${s}`);const r=this._infoConfig.badge_entity?this.getEntity(this._infoConfig.badge_entity):void 0;return U`
      <div class="glass info-card">
        <div class="info-icon">
          <ha-icon .icon=${a}></ha-icon>
        </div>
        <div class="info-content">
          <div class="info-name">${e}</div>
          <div class="info-value">${i}</div>
        </div>
        ${r?U`
              <div class="badge">
                ${this._infoConfig.badge_icon?U`<ha-icon
                      .icon=${this._infoConfig.badge_icon}
                    ></ha-icon>`:""}
                ${r.state}
              </div>
            `:""}
      </div>
    `}};Ct.styles=[vt.glassStyles,n`
      :host {
        display: block;
      }
      .info-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
      }
      .info-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
      }
      .info-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
      }
      .info-content {
        flex: 1;
        min-width: 0;
      }
      .info-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--glass-text-primary);
      }
      .info-value {
        font-size: 12px;
        color: var(--glass-text-dim);
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .badge {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 50px;
        background: rgba(79, 195, 247, 0.12);
        border: 1px solid rgba(79, 195, 247, 0.2);
        font-size: 12px;
        font-weight: 600;
        color: #4fc3f7;
        flex-shrink: 0;
      }
      .badge ha-icon {
        --mdc-icon-size: 14px;
        color: #4fc3f7;
      }
    `],Ct=t([dt("glass-info-row")],Ct);let Mt=class extends ht{set hass(t){}setConfig(t){if(!t.label)throw new Error('glass-section requires a "label" property');this._config=t}render(){return this._config?U`
      <div class="section">
        ${this._config.icon?U`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
        <span class="label">${this._config.label}</span>
      </div>
    `:U``}getCardSize(){return 0}};Mt.styles=n`
    :host { display: block; }
    .section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 4px 0;
    }
    .label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.35);
    }
    ha-icon {
      --mdc-icon-size: 14px;
      color: rgba(255, 255, 255, 0.25);
    }
  `,t([gt({attribute:!1})],Mt.prototype,"_config",void 0),Mt=t([dt("glass-section")],Mt);let At=class extends vt{get _departureConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getDepartures(){if(!this._config?.entity)return[];return this.getEntityAttribute(this._config.entity,"departures")??[]}_isDelayed(t){if(!t.scheduled||!t.expected)return!1;const e=new Date(t.scheduled).getTime();return new Date(t.expected).getTime()-e>6e4}_isSoon(t){const e=t.display?.toLowerCase()??"",a=e.match(/^(\d+)\s*min/);return a?parseInt(a[1],10)<=5:"nu"===e}_getTimeClass(t){return this._isDelayed(t)?"time delayed":this._isSoon(t)?"time soon":"time"}getCardSize(){return 3}render(){if(!this.hass||!this._config?.entity)return U``;const t=this._getDepartures(),e=this._departureConfig.max_departures??6,a=t.slice(0,e),i=this._departureConfig.station_name??this._departureConfig.name??(t.length>0?t[0].stop_area?.name:void 0)??"Avgångar",s=this._departureConfig.icon??"mdi:train";return U`
      <div class="glass departure-card">
        <div class="departure-header">
          <div class="departure-icon">
            <ha-icon .icon=${s}></ha-icon>
          </div>
          <div class="station-name">${i}</div>
        </div>
        ${0===a.length?U`<div class="empty-state">Inga avgångar</div>`:U`
              <div class="departure-list">
                ${a.map(t=>U`
                    <div class="departure-row">
                      <span class="line-badge">${t.line.designation}</span>
                      <span class="destination">${t.destination}</span>
                      <span class="track">Spår ${t.stop_point.designation}</span>
                      <span class=${this._getTimeClass(t)}>${t.display}</span>
                    </div>
                    ${t.deviations?.length?t.deviations.filter(t=>t.message).map(t=>U`<div class="deviation">${t.message}</div>`):q}
                  `)}
              </div>
            `}
      </div>
    `}};At.styles=[vt.glassStyles,n`
      :host {
        display: block;
      }
      .departure-card {
        padding: 14px;
      }
      .departure-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .departure-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
      }
      .departure-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
      }
      .station-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .departure-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .departure-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 4px;
        border-radius: 8px;
        transition: background var(--glass-transition);
      }
      .departure-row:hover {
        background: rgba(255, 255, 255, 0.04);
      }
      .line-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 38px;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(79, 195, 247, 0.15);
        color: var(--glass-accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        flex-shrink: 0;
      }
      .destination {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }
      .track {
        font-size: 11px;
        color: var(--glass-text-dim);
        flex-shrink: 0;
        white-space: nowrap;
      }
      .time {
        font-size: 13px;
        font-weight: 600;
        color: var(--glass-text-secondary);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
        text-align: right;
        min-width: 50px;
      }
      .time.soon {
        color: var(--glass-accent);
      }
      .time.delayed {
        color: var(--glass-coral);
      }
      .deviation {
        font-size: 11px;
        color: var(--glass-coral);
        padding: 2px 4px 2px 52px;
        opacity: 0.9;
      }
      .empty-state {
        text-align: center;
        padding: 16px 8px;
        font-size: 13px;
        color: var(--glass-text-dim);
      }
    `],At=t([dt("glass-departure-card")],At);const Tt=n`
  :host([data-theme='natt']) {
    --hub-surface: #0A0A0C;
    --hub-card: #131316;
    --hub-card-border: #202026;
    --hub-text: #F2F1EE;
    --hub-text-muted: #8B8A92;
    --hub-text-dim: #55555E;
    --hub-amber: #F5B63C;       --hub-amber-text: #F6D9A0;  --hub-amber-muted: #A08A5E;
    --hub-amber-bg: linear-gradient(160deg, rgba(245,182,60,.13), rgba(245,182,60,.04));
    --hub-amber-border: rgba(245,182,60,.25);
    --hub-amber-glow: 0 0 28px rgba(245,182,60,.07);
    --hub-teal: #63D6C2;        --hub-teal-text: #9FE8DB;   --hub-teal-muted: #5F7F78;
    --hub-teal-bg: #101418;     --hub-teal-border: #1E2B31;
    --hub-green: #8EDCA8;       --hub-green-bg: rgba(110,220,160,.08); --hub-green-border: rgba(110,220,160,.18);
    --hub-lavender: #B99CF2;    --hub-lavender-text: #CDBBF0; --hub-lavender-muted: #7A6E92;
    --hub-lavender-bg: #141217; --hub-lavender-border: #262130;
    --hub-coral: #F2968C;       --hub-coral-bg: rgba(240,110,100,.12); --hub-coral-border: rgba(240,110,100,.25);
    --hub-chip-bg: #151519;     --hub-chip-border: #232329;
    --hub-icon-chip-bg: #1d1d23; --hub-icon-chip-color: #5E5E68;
    --hub-track: #1E2B31;
    --hub-shadow: none;
    --hub-scrim: rgba(0, 0, 0, 0.4);
    --hub-navbar-bg: rgba(19, 19, 22, 0.72);
    --hub-navbar-border: rgba(255, 255, 255, 0.06);
  }
  :host([data-theme='dag']) {
    --hub-surface: #F3F0E9;
    --hub-card: #FFFFFF;
    --hub-card-border: #E8E3D8;
    --hub-text: #2A2823;
    --hub-text-muted: #8D877A;
    --hub-text-dim: #A9A395;
    --hub-amber: #F7BE4F;       --hub-amber-text: #2A2823;  --hub-amber-muted: #8D877A;
    --hub-amber-bg: #FFFFFF;
    --hub-amber-border: #F0E4C8;
    --hub-amber-glow: 0 2px 12px rgba(165,115,27,.08);
    --hub-teal: #2E9B87;        --hub-teal-text: #1F6E60;   --hub-teal-muted: #8D877A;
    --hub-teal-bg: #FFFFFF;     --hub-teal-border: #E8E3D8;
    --hub-green: #3E7A4C;       --hub-green-bg: #E9F2E7;    --hub-green-border: #D2E4CE;
    --hub-lavender: #8B6DC7;    --hub-lavender-text: #6B4FA8; --hub-lavender-muted: #8D877A;
    --hub-lavender-bg: #FFFFFF; --hub-lavender-border: #E4DDF0;
    --hub-coral: #C65445;       --hub-coral-bg: #FBE7E3; --hub-coral-border: #F0CFC8;
    --hub-chip-bg: #FFFFFF;     --hub-chip-border: #E8E3D8;
    --hub-icon-chip-bg: #F1EDE3; --hub-icon-chip-color: #B4AC99;
    --hub-track: #EDE9DE;
    --hub-shadow: 0 1px 6px rgba(60,50,30,.05);
    --hub-scrim: rgba(40, 35, 25, 0.25);
    --hub-navbar-bg: rgba(250, 248, 243, 0.72);
    --hub-navbar-border: rgba(60, 50, 30, 0.08);
  }
  :host {
    /* Ink for text sitting directly on weather footage — always light with a
       shadow, independent of theme (the footage, not the theme, is the
       backdrop there). */
    --hub-ink-on-media: #f4f3ef;
    --hub-ink-on-media-muted: rgba(244, 243, 239, 0.95);
    --hub-font-display: 'Outfit', sans-serif;
    --hub-font-body: 'Inter', -apple-system, sans-serif;
    --hub-radius: 18px;
    --hub-radius-lg: 20px;
    --hub-radius-sm: 12px;
    --hub-radius-pill: 99px;
    --hub-gap: 12px;
    --hub-page-pad: clamp(20px, 3vw, 40px);
    --hub-nav-h: calc(64px + env(safe-area-inset-bottom, 0px));
    --hub-fade: 600ms;
  }
`,Nt="glass-hub-theme";const Ft="glass-hub-weather-bg";function Pt(){return"off"!==localStorage.getItem(Ft)}function Dt(t){localStorage.setItem(Ft,t?"on":"off")}let zt=null;function jt(){return zt}function Lt(t,e=8){return Math.abs(t)>e}const It=t=>G`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    ${t}
  </svg>
`,Ot={lamp:It(G`
    <path d="M12 3a6 6 0 0 0-4 10.4c.6.6 1 1.4 1 2.3v.3h6v-.3c0-.9.4-1.7 1-2.3A6 6 0 0 0 12 3z"></path>
    <path d="M10 19h4M10.5 21.5h3"></path>
  `),bolt:It(G`
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"></path>
  `),home:It(G`
    <path d="M3 11.5 12 4l9 7.5"></path>
    <path d="M5.5 10v9.5a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1V15a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V10"></path>
  `),vacuum:It(G`
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="2.2"></circle>
    <path d="M12 4v2M4 12h2M18 12h2M12 20v-2"></path>
  `),train:It(G`
    <rect x="5" y="4" width="14" height="13" rx="4"></rect>
    <path d="M5 12h14"></path>
    <path d="M8 20l-1.5 2M16 20l1.5 2"></path>
    <circle cx="9" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
    <circle cx="15" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),bus:It(G`
    <rect x="4" y="4" width="16" height="13" rx="2.5"></rect>
    <path d="M4 12h16"></path>
    <path d="M4 8.5h16"></path>
    <path d="M7 20l-1 2M17 20l1 2"></path>
    <circle cx="8" cy="14.5" r="0.9" fill="currentColor" stroke="none"></circle>
    <circle cx="16" cy="14.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),note:It(G`
    <circle cx="7" cy="18" r="2.3"></circle>
    <circle cx="16" cy="16" r="2.3"></circle>
    <path d="M9.3 18V5.5L18.3 4v11.5"></path>
  `),ring:It(G`
    <path d="M14.7 4.5A8 8 0 0 1 12 20 8 8 0 0 1 9.3 4.5"></path>
  `),pulse:It(G`
    <path d="M2.5 12h3.2l2-5 3.4 10 2.6-6.4 1.7 3.4h5.6"></path>
  `),server:It(G`
    <rect x="4" y="4" width="16" height="6.5" rx="1.6"></rect>
    <rect x="4" y="13.5" width="16" height="6.5" rx="1.6"></rect>
    <path d="M7.5 7.3h.01M7.5 16.8h.01"></path>
  `),sun:It(G`
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"></path>
  `),moon:It(G`
    <path d="M20 14.5A8 8 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5z"></path>
  `),power:It(G`
    <path d="M12 3v8.5"></path>
    <path d="M6.7 6.9a8 8 0 1 0 10.6 0"></path>
  `),play:It(G`
    <path d="M7 4.5v15l13-7.5-13-7.5z"></path>
  `),pause:It(G`
    <rect x="7" y="5" width="3.5" height="14" rx="1"></rect>
    <rect x="13.5" y="5" width="3.5" height="14" rx="1"></rect>
  `),prev:It(G`
    <path d="M18.5 5.5v13L9 12l9.5-6.5z"></path>
    <path d="M6 5v14"></path>
  `),next:It(G`
    <path d="M5.5 5.5v13L15 12 5.5 5.5z"></path>
    <path d="M18 5v14"></path>
  `),speaker:It(G`
    <rect x="6" y="3" width="12" height="18" rx="3"></rect>
    <circle cx="12" cy="14" r="3.2"></circle>
    <circle cx="12" cy="6.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),sofa:It(G`
    <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"></path>
    <rect x="3" y="11" width="18" height="6" rx="2"></rect>
    <path d="M5 17v2M19 17v2"></path>
  `),pot:It(G`
    <path d="M4 10h16"></path>
    <path d="M5 10v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"></path>
    <path d="M2 10h2M20 10h2"></path>
    <path d="M9 10V7a3 3 0 0 1 6 0v3"></path>
  `),bed:It(G`
    <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"></path>
    <path d="M3 15h18"></path>
    <path d="M3 18v2M21 18v2"></path>
    <rect x="5" y="10" width="6" height="4" rx="1"></rect>
  `),door:It(G`
    <rect x="6" y="3" width="12" height="18" rx="1"></rect>
    <circle cx="14.5" cy="12" r="0.8" fill="currentColor" stroke="none"></circle>
  `),desk:It(G`
    <path d="M3 7h18v3H3z"></path>
    <path d="M5 10v9M19 10v9"></path>
  `),shower:It(G`
    <path d="M8 4a5 5 0 0 1 9 3"></path>
    <path d="M5 9h14"></path>
    <path d="M7 12v2M11 12v2M15 12v2M19 12v2"></path>
    <path d="M7 17v2M11 17v2M15 17v2"></path>
  `),leaf:It(G`
    <path d="M4 20c0-8 6-14 16-15C19 13 13 20 5 20a4 4 0 0 1-1 0z"></path>
    <path d="M4 20c3-5 7-8 12-9.5"></path>
  `),clock:It(G`
    <circle cx="12" cy="12" r="8.5"></circle>
    <path d="M12 7.5V12l3 2"></path>
  `),calendar:It(G`
    <rect x="4" y="5.5" width="16" height="14.5" rx="2"></rect>
    <path d="M4 10h16"></path>
    <path d="M8 3.5v3"></path>
    <path d="M16 3.5v3"></path>
    <path d="M8.5 14h2"></path>
    <path d="M13.5 14h2"></path>
    <path d="M8.5 17h2"></path>
  `),expand:It(G`
    <path d="M8 4H5a1 1 0 0 0-1 1v3"></path>
    <path d="M16 4h3a1 1 0 0 1 1 1v3"></path>
    <path d="M8 20H5a1 1 0 0 1-1-1v-3"></path>
    <path d="M16 20h3a1 1 0 0 0 1-1v-3"></path>
  `),compress:It(G`
    <path d="M4 8h3a1 1 0 0 0 1-1V4"></path>
    <path d="M20 8h-3a1 1 0 0 1-1-1V4"></path>
    <path d="M4 16h3a1 1 0 0 1 1 1v3"></path>
    <path d="M20 16h-3a1 1 0 0 1-1 1v3"></path>
  `),close:G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>`,car:G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"></path><path d="M4 11h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1"></path><path d="M3 12v4a1 1 0 0 0 1 1h1"></path><circle cx="7.5" cy="16.5" r="1.7"></circle><circle cx="16.5" cy="16.5" r="1.7"></circle><path d="M9.2 17h5.6"></path></svg>`};function Bt(t){return null==t||Number.isNaN(t)?"neutral":t>=85?"green":t>=70?"amber":"coral"}function Rt(t){if(null==t||Number.isNaN(t)||t<=0)return"—";const e=Math.floor(t/60),a=Math.round(t%60);return`${e}h ${String(a).padStart(2,"0")}m`}function Ht(t){if(null==t||""===t)return null;if("unavailable"===t||"unknown"===t||"none"===t)return null;const e=Number(t);return Number.isFinite(e)?e:null}function Vt(t,e){if(!Array.isArray(t))return[];const a=[];for(const i of t){if("object"!=typeof i||null===i)continue;const t=i,s=t.date,r=t[e];"string"==typeof s&&"number"==typeof r&&Number.isFinite(r)&&a.push({date:s,value:r})}return a}function Ut(t){return null==t||Number.isNaN(t)?"neutral":t<70?"green":t<90?"amber":"coral"}function Gt(t){return null==t||Number.isNaN(t)?"neutral":t<65?"green":t<80?"amber":"coral"}function Wt(t){return null==t||Number.isNaN(t)?"neutral":t>0?"coral":"green"}function qt(t){return null==t||Number.isNaN(t)?"neutral":0===t?"green":t<5?"amber":"coral"}function Xt(t){return null==t||Number.isNaN(t)?"neutral":t<80?"green":t<90?"amber":"coral"}function Yt(t){return null==t||Number.isNaN(t)?"neutral":t<=26?"green":t<=50?"amber":"coral"}function Kt(t){return null==t||Number.isNaN(t)?"neutral":t>=14?"green":t>=7?"amber":"coral"}function Zt(t,e){return null===t||null===e?"neutral":t>=e?"green":"coral"}const Jt={neutral:0,green:1,amber:2,coral:3};function Qt(t){let e="neutral";for(const a of t)Jt[a]>Jt[e]&&(e=a);return e}function te(t){const e=Qt([Zt(t.nodesReady,t.nodesTotal),Wt(t.alerts),Wt(t.fluxFailing),Wt(t.podsUnhealthy),qt(t.restarts1h),Gt(t.clusterTemp),Gt(t.nasCpuTemp),Gt(t.nasNvmeTemp),Xt(t.volume1UsedPct),Xt(t.volume2UsedPct),Yt(t.backupAgeHours),Kt(t.certDays)]);switch(e){case"coral":return{tone:e,label:"Åtgärda"};case"amber":return{tone:e,label:"Håll koll"};case"green":return{tone:e,label:"Allt OK"};default:return{tone:e,label:"Ingen data"}}}const ee=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:1}),ae=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:2});function ie(t){if(null==t||Number.isNaN(t)||t<0)return"–";if(t>=48)return`${Math.floor(t/24)} d`;const e=Math.floor(t),a=Math.round(60*(t-e));return 0===e?`${a} min`:`${e} h ${String(a).padStart(2,"0")} min`}function se(t){if(null==t||Number.isNaN(t)||t<0)return"–";if(t<1)return`${Math.round(60*t)} min`;if(t<48)return`${ee.format(t)} h`;const e=Math.floor(t/24),a=Math.round(t-24*e);return 0===a?`${e} d`:`${e} d ${a} h`}function re(t){return null==t||Number.isNaN(t)||t<0?"–":t<.1?`${Math.round(1e3*t)} kB/s`:`${ae.format(t)} MB/s`}function ne(t){return null==t||Number.isNaN(t)?"–":`${Math.round(t)} %`}function oe(t){return null==t||Number.isNaN(t)?"–":t<1?`${Math.round(1e3*t)} GB`:`${ee.format(t)} TB`}const le={sunny:{sky:"clear",clouds:0,sun:!0,stars:!0,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:1},"clear-night":{sky:"clear",clouds:0,sun:!1,stars:!0,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:1},partlycloudy:{sky:"partly",clouds:.35,sun:!0,stars:!0,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:1},cloudy:{sky:"overcast",clouds:.85,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:1},rainy:{sky:"storm",clouds:.7,sun:!1,stars:!1,rain:110,snow:0,hail:0,lightning:!1,fog:!1,wind:1.2},pouring:{sky:"storm",clouds:.9,sun:!1,stars:!1,rain:260,snow:0,hail:0,lightning:!1,fog:!1,wind:1.5},snowy:{sky:"overcast",clouds:.7,sun:!1,stars:!1,rain:0,snow:70,hail:0,lightning:!1,fog:!1,wind:1},"snowy-rainy":{sky:"storm",clouds:.8,sun:!1,stars:!1,rain:70,snow:45,hail:0,lightning:!1,fog:!1,wind:1.2},lightning:{sky:"storm",clouds:.9,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!0,fog:!1,wind:1.4},"lightning-rainy":{sky:"storm",clouds:.9,sun:!1,stars:!1,rain:170,snow:0,hail:0,lightning:!0,fog:!1,wind:1.6},fog:{sky:"fog",clouds:.45,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!1,fog:!0,wind:.5},hail:{sky:"storm",clouds:.8,sun:!1,stars:!1,rain:40,snow:0,hail:120,lightning:!1,fog:!1,wind:1.3},windy:{sky:"partly",clouds:.5,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:2.6},"windy-variant":{sky:"partly",clouds:.5,sun:!1,stars:!1,rain:0,snow:0,hail:0,lightning:!1,fog:!1,wind:2.6}};function he(t){return le[t]??le.cloudy}function ce(t){return null===t?"night":t>10?"day":t>-4?"golden":"night"}const de={clear:["#04060C","#070B14","#0B1220"],partly:["#05060B","#090C12","#10141C"],overcast:["#060708","#0A0B0D","#101214"],storm:["#050607","#0A0B0E","#12141A"],fog:["#08090B","#0E1013","#16181C"]},pe={day:{clear:["#4A85C7","#8CB8E3","#D6E7F4"],partly:["#5E8FC0","#93B7DB","#D3E2EE"],overcast:["#8A97A5","#AEB8C2","#D5DADF"],storm:["#4E5A68","#6E7B89","#9AA5B0"],fog:["#A8AFB5","#C2C7CB","#DCDFE1"]},golden:{clear:["#3E6CA8","#C98A5E","#F2C98E"],partly:["#4A6E9E","#B98963","#E8C393"],overcast:["#77808D","#9C9997","#C4B4A4"],storm:["#45505E","#6B6E75","#8F8578"],fog:["#9AA0A8","#B8B4AE","#D6CDC0"]},night:{clear:["#101B30","#1A2A47","#2A3C5C"],partly:["#12192A","#1C2740","#2B3852"],overcast:["#1A1E26","#242A34","#323844"],storm:["#151820","#20242E","#2E323E"],fog:["#1D2026","#282C33","#383C44"]}};function ue(t){const e="string"==typeof t.datetime?Date.parse(t.datetime):NaN;return Number.isNaN(e)?NaN:e}function ge(t){if(!Array.isArray(t))return[];const e=[];for(const a of t){if(!a||"object"!=typeof a)continue;const t=ue(a);Number.isNaN(t)||"number"!=typeof a.temperature||e.push({ts:t,temp:a.temperature,condition:"string"==typeof a.condition?a.condition:"cloudy",precip:"number"==typeof a.precipitation?a.precipitation:0,precipProb:"number"==typeof a.precipitation_probability?a.precipitation_probability:null})}return e.sort((t,e)=>t.ts-e.ts)}function be(t){if(!Array.isArray(t))return[];const e=[];for(const a of t){if(!a||"object"!=typeof a)continue;const t=ue(a);Number.isNaN(t)||"number"!=typeof a.temperature||e.push({ts:t,condition:"string"==typeof a.condition?a.condition:"cloudy",high:a.temperature,low:"number"==typeof a.templow?a.templow:null,precipProb:"number"==typeof a.precipitation_probability?a.precipitation_probability:null})}return e.sort((t,e)=>t.ts-e.ts)}const me=new Set(["rainy","pouring","snowy","snowy-rainy","lightning-rainy","hail"]),ve=new Set(["snowy","snowy-rainy"]);function fe(t){return me.has(t)}function xe(t){return`${String(new Date(t).getHours()).padStart(2,"0")}:00`}const ye={clear:{lit:[.16,.18,.23],shade:[.05,.06,.09],alpha:.75},partly:{lit:[.16,.18,.23],shade:[.05,.06,.09],alpha:.8},overcast:{lit:[.13,.14,.17],shade:[.04,.045,.06],alpha:.85},storm:{lit:[.12,.13,.16],shade:[.03,.035,.05],alpha:.9},fog:{lit:[.16,.17,.2],shade:[.07,.08,.1],alpha:.6}},_e={clear:{lit:[1,1,1],shade:[.62,.66,.72],alpha:.92},partly:{lit:[1,1,1],shade:[.62,.66,.72],alpha:.92},overcast:{lit:[.82,.85,.88],shade:[.45,.49,.55],alpha:.95},storm:{lit:[.62,.66,.72],shade:[.28,.31,.37],alpha:.95},fog:{lit:[.88,.89,.9],shade:[.65,.67,.69],alpha:.7}};class we{constructor(t){this.canvas=t,this.ok=!1,this.gl=null,this.prog=null,this.u={},this._onLost=t=>{t.preventDefault(),this.ok=!1},this._onRestored=()=>{this._init()},t.addEventListener("webglcontextlost",this._onLost),t.addEventListener("webglcontextrestored",this._onRestored),this._init()}_init(){this.ok=!1;const t=this.canvas.getContext("webgl",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!t)return;const e=(e,a)=>{const i=t.createShader(e);return i?(t.shaderSource(i,a),t.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)?i:(console.debug("[cloud-shader] compile failed:",t.getShaderInfoLog(i)),null)):null},a=e(t.VERTEX_SHADER,"\nattribute vec2 a_pos;\nvoid main() { gl_Position = vec4(a_pos, 0.0, 1.0); }\n"),i=e(t.FRAGMENT_SHADER,"\nprecision mediump float;\nuniform vec2 u_res;\nuniform float u_time;\nuniform float u_density;\nuniform float u_wind;\nuniform vec3 u_lit;\nuniform vec3 u_shade;\nuniform float u_alpha;\nuniform float u_flash;\n\nfloat hash(vec2 p) {\n  p = fract(p * vec2(127.1, 311.7));\n  p += dot(p, p + 34.23);\n  return fract(p.x * p.y);\n}\nfloat noise(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  f = f * f * (3.0 - 2.0 * f);\n  return mix(\n    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),\n    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),\n    f.y);\n}\nfloat fbm(vec2 p) {\n  float v = 0.0;\n  float a = 0.5;\n  for (int i = 0; i < 5; i++) {\n    v += a * noise(p);\n    p = p * 2.03 + vec2(19.3, 7.1);\n    a *= 0.5;\n  }\n  return v;\n}\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / u_res;\n  // Aspect-corrected, vertically squashed noise space -> wide cloud banks.\n  vec2 p = vec2(uv.x * (u_res.x / u_res.y), uv.y * 1.9);\n  float t = u_time * 0.014 * u_wind;\n  // Large slow masses + domain-warped turbulent detail.\n  float base = fbm(p * 1.5 + vec2(t, 0.0));\n  vec2 q = vec2(\n    fbm(p * 2.8 + vec2(t * 2.2, 1.7)),\n    fbm(p * 2.8 + vec2(8.3 - t * 1.4, 2.8)));\n  float detail = fbm(p * 4.2 + q * 1.7 + vec2(t * 3.5, 0.0));\n  float f = base * 0.62 + detail * 0.55 + (uv.y - 0.5) * 0.12;\n  float th = mix(0.86, 0.32, u_density);\n  float cov = smoothstep(th, th + 0.28, f);\n  // Denser core = darker (self-shadowing); lightning lifts the whole field.\n  vec3 col = mix(u_lit, u_shade, smoothstep(th + 0.05, th + 0.55, f));\n  col += vec3(u_flash * 0.45);\n  float a = min(cov * u_alpha * (1.0 + u_flash * 0.25), 1.0);\n  gl_FragColor = vec4(col * a, a); // premultiplied\n}\n");if(!a||!i)return;const s=t.createProgram();if(!s)return;if(t.attachShader(s,a),t.attachShader(s,i),t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))return void console.debug("[cloud-shader] link failed:",t.getProgramInfoLog(s));t.useProgram(s);const r=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,r),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);const n=t.getAttribLocation(s,"a_pos");t.enableVertexAttribArray(n),t.vertexAttribPointer(n,2,t.FLOAT,!1,0,0);for(const e of["u_res","u_time","u_density","u_wind","u_lit","u_shade","u_alpha","u_flash"])this.u[e]=t.getUniformLocation(s,e);t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.clearColor(0,0,0,0),this.gl=t,this.prog=s,this.ok=!0}render(t){const e=this.gl;e&&this.ok&&(e.viewport(0,0,this.canvas.width,this.canvas.height),e.clear(e.COLOR_BUFFER_BIT),e.uniform2f(this.u.u_res,this.canvas.width,this.canvas.height),e.uniform1f(this.u.u_time,t.time),e.uniform1f(this.u.u_density,t.density),e.uniform1f(this.u.u_wind,t.wind),e.uniform3f(this.u.u_lit,...t.palette.lit),e.uniform3f(this.u.u_shade,...t.palette.shade),e.uniform1f(this.u.u_alpha,t.palette.alpha),e.uniform1f(this.u.u_flash,t.flash),e.drawArrays(e.TRIANGLES,0,3))}clear(){const t=this.gl;t&&this.ok&&(t.viewport(0,0,this.canvas.width,this.canvas.height),t.clear(t.COLOR_BUFFER_BIT))}dispose(){this.canvas.removeEventListener("webglcontextlost",this._onLost),this.canvas.removeEventListener("webglcontextrestored",this._onRestored),this.gl&&this.prog&&this.gl.deleteProgram(this.prog),this.gl=null,this.prog=null,this.ok=!1}}const ke=[{scale:.55,alpha:.3,speed:.6},{scale:.8,alpha:.55,speed:.85},{scale:1.15,alpha:.9,speed:1.15}];class $e extends vt{constructor(){super(...arguments),this.theme="natt",this.active=!1,this._skyA="",this._skyB="",this._frontA=!0,this._w=0,this._h=0,this._dpr=1,this._running=!1,this._raf=0,this._last=0,this._t=0,this._scene=he("cloudy"),this._sceneKey="",this._drops=[],this._flakes=[],this._stones=[],this._splashes=[],this._clouds=[],this._stars=[],this._fogOffsets=[0,0,0],this._flash=0,this._nextFlash=0,this._bolt=null,this._onVisibility=()=>this._maybeRun(),this._onForce=()=>this.requestUpdate(),this._frame=t=>{if(!this._running)return;const e=Math.min((t-this._last)/1e3,.05);this._last=t,this._t+=e,this._draw(e),this._raf=requestAnimationFrame(this._frame)}}connectedCallback(){super.connectedCallback(),document.addEventListener("visibilitychange",this._onVisibility),window.addEventListener("hub-weather-force",this._onForce)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this._onVisibility),window.removeEventListener("hub-weather-force",this._onForce),this._ro?.disconnect(),this._ro=void 0,this._shader?.dispose(),this._shader=void 0,this._stopLoop()}firstUpdated(){this._canvas=this.renderRoot.querySelector("canvas.px")??void 0,this._ctx=this._canvas?.getContext("2d")??void 0,this._glCanvas=this.renderRoot.querySelector("canvas.gl")??void 0,this._glCanvas&&(this._shader=new we(this._glCanvas)),this._ro=new ResizeObserver(()=>this._resize()),this._ro.observe(this),this._resize()}updated(t){this._syncScene(),t.has("active")&&this._maybeRun()}get _condition(){return jt()??this.getEntity(this.entity)?.state??"cloudy"}get _elevation(){const t=this.hass?.states["sun.sun"]?.attributes?.elevation;return"number"==typeof t?t:null}_syncScene(){const t=ce(this._elevation),e=this._condition,a=`${e}|${this.theme}|${t}`;if(a===this._sceneKey)return;this._sceneKey=a,this._scene=he(e);const[i,s,r]=function(t,e,a){return"natt"===e?de[t]:pe[a][t]}(this._scene.sky,this.theme,t),n=`background:linear-gradient(180deg, ${i} 0%, ${s} 55%, ${r} 100%)`;this._frontA?(this._skyB=n,this._frontA=!1):(this._skyA=n,this._frontA=!0),this._buildSprites(),this._buildParticles(),this._nextFlash=this._t+2+5*Math.random(),this._maybeRun()}_resize(){this._canvas&&(this._w=this.offsetWidth,this._h=this.offsetHeight,this._dpr=Math.min(window.devicePixelRatio||1,1.5),this._canvas.width=Math.max(1,Math.round(this._w*this._dpr)),this._canvas.height=Math.max(1,Math.round(this._h*this._dpr)),this._glCanvas&&(this._glCanvas.width=Math.max(1,Math.round(this._w*this._dpr/2)),this._glCanvas.height=Math.max(1,Math.round(this._h*this._dpr/2))),this._buildParticles())}get _isNightBand(){return"night"===ce(this._elevation)}_perMp(t){return Math.round(t*this._w*this._h/1e6)}_buildParticles(){const t=this._scene,e=this._w,a=this._h;if(0===e||0===a)return;const i=Math.random;this._drops=Array.from({length:this._perMp(t.rain)},()=>({x:i()*e,y:i()*a,layer:Math.floor(i()*ke.length),jl:.7+.6*i(),js:.85+.35*i(),ja:40*(i()-.5)})),this._flakes=Array.from({length:this._perMp(t.snow)},()=>({x:i()*e,y:i()*a,r:1.5+2.5*i(),phase:i()*Math.PI*2,rot:i()*Math.PI*2,rotSpd:1.2*(i()-.5),layer:Math.floor(i()*ke.length)})),this._stones=Array.from({length:this._perMp(t.hail)},()=>({x:i()*e,y:i()*a,vy:700+300*i(),vx:60*(i()-.5),r:1.2+1.6*i(),bounced:!1}));const s=t.clouds>0?Math.round(2+5*t.clouds):0;this._clouds=Array.from({length:s},(t,r)=>({x:i()*e*1.4-.2*e,y:r/Math.max(s,1)*a*.38+30*i(),scale:.7+.9*i(),spd:6+10*i(),alpha:.5+.5*i()})),this._stars=t.stars?Array.from({length:90},()=>({x:i()*e,y:i()*a*.7,r:.5+1.1*i(),phase:i()*Math.PI*2})):[],this._splashes=[]}_buildSprites(){const t=document.createElement("canvas");t.width=512,t.height=256;const e=t.getContext("2d"),a="natt"===this.theme,i="storm"===this._scene.sky,[s,r,n]=a?[26,30,40]:i?[120,130,142]:[255,255,255];for(let t=0;t<9;t++){const t=80+352*Math.random(),i=90+80*Math.random(),o=55+70*Math.random(),l=e.createRadialGradient(t,i,0,t,i,o);l.addColorStop(0,`rgba(${s},${r},${n},${a?.5:.55})`),l.addColorStop(1,`rgba(${s},${r},${n},0)`),e.fillStyle=l,e.fillRect(0,0,512,256)}this._cloudSprite=t;const o=document.createElement("canvas");o.width=32,o.height=32;const l=o.getContext("2d"),h=l.createRadialGradient(16,16,0,16,16,14);h.addColorStop(0,"rgba(255,255,255,0.9)"),h.addColorStop(.5,"rgba(255,255,255,0.35)"),h.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=h,l.fillRect(0,0,32,32),l.strokeStyle="rgba(255,255,255,0.5)",l.lineWidth=1.2;for(let t=0;t<3;t++)l.save(),l.translate(16,16),l.rotate(t*Math.PI/3),l.beginPath(),l.moveTo(-7,0),l.lineTo(7,0),l.stroke(),l.restore();this._flakeSprite=o}_maybeRun(){const t=this._scene.rain>0||this._scene.snow>0||this._scene.hail>0||this._scene.clouds>0||this._scene.stars||this._scene.sun||this._scene.fog||this._scene.lightning,e=this.active&&t&&this.isConnected&&"visible"===document.visibilityState;e&&!this._running?(this._running=!0,this._last=performance.now(),console.debug("[weather-bg] start"),this._raf=requestAnimationFrame(this._frame)):!e&&this._running&&this._stopLoop()}_stopLoop(){this._running&&(this._running=!1,cancelAnimationFrame(this._raf),console.debug("[weather-bg] stop"))}_draw(t){const e=this._ctx;if(!e)return;const a=this._w,i=this._h;e.setTransform(this._dpr,0,0,this._dpr,0,0),e.clearRect(0,0,a,i),this._updateFlash(t),this._stars.length&&this._isNightBand&&this._drawStars(e),!this._isNightBand||"clear"!==this._scene.sky&&"partly"!==this._scene.sky||this._drawMoon(e,a,i),this._scene.sun&&!this._isNightBand&&"dag"===this.theme&&this._drawSun(e,a,i);var s,r;if(!0===this._shader?.ok?this._scene.clouds>0?this._shader.render({time:this._t,density:this._scene.clouds,wind:this._scene.wind,palette:(s=this._scene.sky,r=this.theme,"natt"===r?ye[s]:_e[s]),flash:this._flash}):this._shader.clear():this._clouds.length&&this._drawClouds(e,t,a,i),this._scene.fog&&this._drawFog(e,t,a,i),this._drops.length&&this._drawRain(e,t,a,i),this._flakes.length&&this._drawSnow(e,t,a,i),this._stones.length&&this._drawHail(e,t,a,i),this._splashes.length&&this._drawSplashes(e,t),this._flash>.01){const t=("natt"===this.theme?.22:.3)*(this._bolt?.6:1);e.fillStyle=`rgba(215,225,255,${this._flash*t})`,e.fillRect(0,0,a,i)}this._bolt&&this._flash>.05&&this._drawBolt(e)}_drawStars(t){for(const e of this._stars){const a=.25+.5*Math.abs(Math.sin(.5*this._t+e.phase));t.fillStyle=`rgba(200,215,255,${a})`,t.beginPath(),t.arc(e.x,e.y,e.r,0,2*Math.PI),t.fill()}}_drawMoon(t,e,a){const i=.78*e,s=.2*a,r=.045*Math.min(e,a),n=t.createRadialGradient(i,s,.5*r,i,s,5*r);n.addColorStop(0,"rgba(215,225,250,0.22)"),n.addColorStop(.4,"rgba(215,225,250,0.07)"),n.addColorStop(1,"rgba(215,225,250,0)"),t.fillStyle=n,t.fillRect(i-5*r,s-5*r,10*r,10*r);const o=t.createRadialGradient(i+.35*r,s-.35*r,.1*r,i,s,r);o.addColorStop(0,"rgba(238,242,250,0.95)"),o.addColorStop(.75,"rgba(214,222,238,0.9)"),o.addColorStop(1,"rgba(178,190,214,0.85)"),t.fillStyle=o,t.beginPath(),t.arc(i,s,r,0,2*Math.PI),t.fill()}_sunPos(t,e){const a=this.hass?.states["sun.sun"]?.attributes,i="number"==typeof a?.azimuth?a.azimuth:null,s="number"==typeof a?.elevation?a.elevation:null;if(null===i||null===s)return{cx:.76*t,cy:.2*e};return{cx:t*Math.min(Math.max((i-90)/180,.06),.94),cy:e*(.78-.62*(Math.min(Math.max(s,0),55)/55))}}_drawSun(t,e,a){const{cx:i,cy:s}=this._sunPos(e,a),r="golden"===ce(this._elevation),n=.55*Math.min(e,a),o=.92+.08*Math.sin(.3*this._t),l=r?"255,170,90":"255,218,130";let h=t.createRadialGradient(i,s,0,i,s,n);h.addColorStop(0,`rgba(255,246,220,${.85*o})`),h.addColorStop(.12,`rgba(${l},${.5*o})`),h.addColorStop(.35,`rgba(${l},0.16)`),h.addColorStop(1,`rgba(${l},0)`),t.fillStyle=h,t.fillRect(0,0,e,a);const c=.52*n;h=t.createRadialGradient(i,s,.88*c,i,s,1.12*c),h.addColorStop(0,`rgba(${l},0)`),h.addColorStop(.5,`rgba(${l},0.1)`),h.addColorStop(1,`rgba(${l},0)`),t.fillStyle=h;const d=1.15*c;t.fillRect(i-d,s-d,2*d,2*d),t.save(),t.translate(i,s),t.rotate(.02*this._t),t.fillStyle=`rgba(${l},0.07)`;for(let e=0;e<8;e++)t.rotate(Math.PI/4),t.beginPath(),t.moveTo(0,0),t.lineTo(1.1*n,.045*-n),t.lineTo(1.1*n,.045*n),t.closePath(),t.fill();t.restore();const p=e/2-i,u=a/2-s,g=[[.7,14,.06],[1.4,9,.08],[2.1,22,.045]];for(const[e,a,r]of g){const n=i+p*e,o=s+u*e,h=t.createRadialGradient(n,o,0,n,o,a);h.addColorStop(0,`rgba(${l},${r})`),h.addColorStop(1,`rgba(${l},0)`),t.fillStyle=h,t.fillRect(n-a,o-a,2*a,2*a)}}_drawClouds(t,e,a,i){const s=this._cloudSprite;if(!s)return;const r=this._scene.wind;for(const i of this._clouds){i.x+=i.spd*r*e;const n=512*i.scale*.9;i.x-n/2>a&&(i.x=-n/2),t.globalAlpha=i.alpha*(.35+.5*this._scene.clouds)+.3*this._flash,t.drawImage(s,i.x-n/2,i.y-128*i.scale/2,n,256*i.scale*.9)}t.globalAlpha=1}_drawFog(t,e,a,i){const s="natt"===this.theme,[r,n,o]=s?[40,44,52]:[225,228,230],l=s?[.1,.14,.18]:[.16,.22,.28];for(let s=0;s<3;s++){const h=s%2==0?1:-1;this._fogOffsets[s]=(this._fogOffsets[s]+h*(4+3*s)*e+a)%a;const c=i*(.35+.22*s),d=t.createLinearGradient(0,c-70,0,c+70);d.addColorStop(0,`rgba(${r},${n},${o},0)`),d.addColorStop(.5,`rgba(${r},${n},${o},${l[s]})`),d.addColorStop(1,`rgba(${r},${n},${o},0)`),t.fillStyle=d,t.fillRect(this._fogOffsets[s]-a,c-70,a,140),t.fillRect(this._fogOffsets[s],c-70,a,140)}}_drawRain(t,e,a,i){const s=this._scene.wind,r="natt"===this.theme,n=this._scene.rain>150?1500:1150,o=this._scene.rain>150?30:20;t.lineCap="round";for(const l of this._drops){const h=ke[l.layer],c=n*h.speed*l.js,d=(60*s+l.ja)*h.speed;l.y+=c*e,l.x+=d*e,l.y>i&&(l.y=-o,l.x=Math.random()*a,2===l.layer&&Math.random()<.25&&this._splashes.push({x:l.x,y:i-4-8*Math.random(),r:1,life:1})),l.x>a&&(l.x-=a);const p=o*h.scale*l.jl,u=d/c*p;t.strokeStyle=r?`rgba(150,170,200,${.45*h.alpha})`:`rgba(235,242,250,${.6*h.alpha})`,t.lineWidth=1*h.scale,t.beginPath(),t.moveTo(l.x,l.y),t.lineTo(l.x-u,l.y-p),t.stroke()}}_drawSnow(t,e,a,i){const s=this._flakeSprite;if(!s)return;const r=this._scene.wind;for(const n of this._flakes){const o=ke[n.layer];n.y+=55*o.speed*e,n.x+=20*Math.sin(n.phase+.8*this._t)*r*e,n.rot+=n.rotSpd*e,n.y>i+6&&(n.y=-6,n.x=Math.random()*a),n.x>a+6&&(n.x=-6),n.x<-6&&(n.x=a+6);const l=4*n.r*o.scale;t.save(),t.globalAlpha=o.alpha*("natt"===this.theme?.7:.95),t.translate(n.x,n.y),t.rotate(n.rot),t.drawImage(s,-l/2,-l/2,l,l),t.restore()}t.globalAlpha=1}_drawHail(t,e,a,i){const s="natt"===this.theme;t.fillStyle=s?"rgba(190,205,225,0.7)":"rgba(250,252,255,0.9)";for(const s of this._stones)s.y+=s.vy*e,s.x+=s.vx*e,s.y>i?!s.bounced&&Math.random()<.5?(s.bounced=!0,s.vy=.35*-s.vy,s.y=i):(s.y=-4,s.x=Math.random()*a,s.vy=700+300*Math.random(),s.bounced=!1):s.bounced&&(s.vy+=1600*e),t.beginPath(),t.arc(s.x,s.y,s.r,0,2*Math.PI),t.fill()}_drawSplashes(t,e){const a="natt"===this.theme;for(const i of this._splashes)i.r+=50*e,i.life-=5*e,i.life<=0||(t.strokeStyle=a?`rgba(150,170,200,${.2*i.life})`:`rgba(235,242,250,${.3*i.life})`,t.lineWidth=1,t.beginPath(),t.ellipse(i.x,i.y,i.r,.35*i.r,0,0,2*Math.PI),t.stroke());this._splashes=this._splashes.filter(t=>t.life>0)}_updateFlash(t){if(!this._scene.lightning)return this._flash=0,void(this._bolt=null);this._t>=this._nextFlash?(this._flash=1,this._bolt=Math.random()<.7?this._makeBolt():null,this._nextFlash=this._t+(Math.random()<.3?.15:4+8*Math.random())):this._flash=Math.max(0,this._flash-t/.4)**1.5}_makeBolt(){const t=this._w,e=this._h,a=Math.random,i=[],s=[];let r=t*(.2+.6*a()),n=-8;const o=10*(a()-.5),l=e*(.55+.3*a());for(s.push([r,n]);n<l;)if(n+=12+22*a(),r+=36*(a()-.5)+o,s.push([r,n]),a()<.14&&s.length>2){const t=[[r,n]];let e=r,s=n;const o=a()<.5?-1:1,l=3+Math.floor(4*a());for(let i=0;i<l;i++)s+=10+16*a(),e+=o*(8+20*a())+12*(a()-.5),t.push([e,s]);i.push(t)}return i.unshift(s),i}_drawBolt(t){const e=this._bolt;if(!e)return;const a=this._flash,i=[[10,`rgba(120,170,255,${.25*a})`],[4.5,`rgba(170,205,255,${.45*a})`],[2.5,`rgba(255,255,255,${.95*a})`]];t.lineCap="round",t.lineJoin="round";for(const[a,s]of i)t.strokeStyle=s,e.forEach((e,i)=>{t.lineWidth=0===i?a:.55*a,t.beginPath(),t.moveTo(e[0][0],e[0][1]);for(let a=1;a<e.length;a++)t.lineTo(e[a][0],e[a][1]);t.stroke()})}render(){return U`
      <div class="sky" style="${this._skyA};opacity:${this._frontA?1:0}"></div>
      <div class="sky" style="${this._skyB};opacity:${this._frontA?0:1}"></div>
      <div class="scrim"></div>
      <canvas class="gl"></canvas>
      <canvas class="px"></canvas>
    `}}$e.styles=n`
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    .sky {
      position: absolute;
      inset: 0;
      transition: opacity 1.5s ease;
    }
    /* Text-contrast veil for the light on-media hero ink over bright day
       skies, anchored to the clock corner. Invisible on dark natt scenes. */
    .scrim {
      position: absolute;
      inset: 0;
      background: radial-gradient(120% 90% at 18% 12%, rgba(0, 0, 0, 0.26), transparent 55%);
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
  `,t([gt({attribute:!1})],$e.prototype,"entity",void 0),t([gt({attribute:!1})],$e.prototype,"theme",void 0),t([gt({attribute:!1})],$e.prototype,"active",void 0),t([bt()],$e.prototype,"_skyA",void 0),t([bt()],$e.prototype,"_skyB",void 0),t([bt()],$e.prototype,"_frontA",void 0),customElements.define("hub-weather-bg",$e);const Ee=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="4.2"></circle>
  <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4L19 19M5 19l1.6-1.6M17.4 6.6L19 5"></path>
</svg>`,Se=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7z"></path>
</svg>`,Ce=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 17.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
</svg>`,Me=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="17" cy="7" r="2.8"></circle>
  <path d="M17 2.6v1M21.4 7h1M20.1 3.9l-.7.7M20.1 10.1l-.7-.7"></path>
  <path d="M5.8 19a3.6 3.6 0 0 1-.3-7.2 4.7 4.7 0 0 1 9.1-1.1 3.5 3.5 0 0 1 1.2 6.9 3.6 3.6 0 0 1-1.4.3z"></path>
</svg>`,Ae=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20.6 8.6a4 4 0 0 1-5-5 4 4 0 1 0 5 5z"></path>
  <path d="M5.8 19a3.6 3.6 0 0 1-.3-7.2 4.7 4.7 0 0 1 9.1-1.1 3.5 3.5 0 0 1 1.2 6.9 3.6 3.6 0 0 1-1.4.3z"></path>
</svg>`,Te=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 17.5l-1 2.5M12.5 17.5l-1 2.5M17 17.5l-1 2.5"></path>
</svg>`,Ne=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M7 16l-1.4 3.6M10.5 16l-1.4 3.6M14 16l-1.4 3.6M17.5 16l-1.4 3.6"></path>
</svg>`,Fe=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 18.2v.01M12 19.6v.01M16 18.2v.01M10 21v.01M14 21v.01" stroke-width="2.4"></path>
</svg>`,Pe=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 17.5l-1 2.5M15.5 17.5l-1 2.5"></path>
  <path d="M11.8 20v.01M17.5 20v.01" stroke-width="2.4"></path>
</svg>`,De=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6"></path>
  <path d="M12.5 12l-2.5 4.5h3L10.5 21"></path>
</svg>`,ze=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 13.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6"></path>
  <path d="M12.5 12l-2.5 4.5h3L10.5 21"></path>
  <path d="M6.6 16.5l-.9 2.3M17 16.5l-.9 2.3"></path>
</svg>`,je=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 12.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.4 7.4"></path>
  <path d="M4.5 15.5h15M6.5 18.5h11M8.5 21.5h7"></path>
</svg>`,Le=G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3.5 9h11a2.6 2.6 0 1 0-2.6-2.6"></path>
  <path d="M3.5 13.5h15.2a2.6 2.6 0 1 1-2.6 2.6"></path>
  <path d="M3.5 18h7.4a2.2 2.2 0 1 1-2.2 2.2"></path>
</svg>`,Ie={sunny:{day:Ee,night:Se},"clear-night":{day:Se},partlycloudy:{day:Me,night:Ae},cloudy:{day:Ce},rainy:{day:Te},pouring:{day:Ne},snowy:{day:Fe},"snowy-rainy":{day:Pe},lightning:{day:De},"lightning-rainy":{day:ze},fog:{day:je},hail:{day:G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6.5 14.5a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10.1-1.2 3.9 3.9 0 0 1 1.3 7.6 4 4 0 0 1-1.5.3z"></path>
  <path d="M8 18v.01M12 18v.01M16 18v.01M10 21v.01M14 21v.01" stroke-width="2.6"></path>
</svg>`},windy:{day:Le},"windy-variant":{day:Le}};function Oe(t,e){const a=Ie[t]??Ie.cloudy;return e&&a.night?a.night:a.day}const Be=new Map;async function Re(t,e,a){const i=`${e}:${a}`,s=Be.get(i);if(s&&Date.now()-s.at<9e5)return s.data;try{const s=await t.callWS({type:"call_service",domain:"weather",service:"get_forecasts",service_data:{type:a},target:{entity_id:e},return_response:!0}),r=s?.response?.[e]?.forecast??[];return Be.set(i,{at:Date.now(),data:r}),r}catch{return null}}const He=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long"});class Ve extends vt{constructor(){super(...arguments),this.bgActive=!1,this._now=new Date,this._hours=[],this._days=[],this._fetchedFor="",this._onForce=()=>{this.requestUpdate()},this._open=()=>{this.dispatchEvent(new CustomEvent("hub-weather-open",{bubbles:!0,composed:!0}))}}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},3e4),this._forecastTimer=window.setInterval(()=>this._loadForecasts(),9e5),this.addEventListener("click",this._open),window.addEventListener("hub-weather-force",this._onForce)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&clearInterval(this._interval),void 0!==this._forecastTimer&&clearInterval(this._forecastTimer),this._interval=this._forecastTimer=void 0,this.removeEventListener("click",this._open),window.removeEventListener("hub-weather-force",this._onForce)}updated(t){(t.has("hass")||t.has("weatherEntity"))&&this.hass&&this.weatherEntity&&this._fetchedFor!==this.weatherEntity&&(this._fetchedFor=this.weatherEntity,this._loadForecasts())}async _loadForecasts(){if(!this.hass||!this.weatherEntity)return;const[t,e]=await Promise.all([Re(this.hass,this.weatherEntity,"hourly"),Re(this.hass,this.weatherEntity,"daily")]);t&&(this._hours=ge(t)),e&&(this._days=be(e))}get _timeStr(){return`${String(this._now.getHours()).padStart(2,"0")}:${String(this._now.getMinutes()).padStart(2,"0")}`}get _isNight(){return"below_horizon"===this.hass?.states["sun.sun"]?.state}render(){const t=this.weatherEntity?this.getEntity(this.weatherEntity):void 0,e=jt()??t?.state??"",a=t?.attributes.temperature,i=function(t){const e=t[0];return e&&null!==e.low?{low:e.low,high:e.high}:null}(this._days),s=function(t,e){const a=t.filter(t=>t.ts>=e&&t.ts<=e+432e5);if(0===a.length)return null;if(fe(a[0].condition)){const t=a.find(t=>!fe(t.condition));return t?`Uppehåll ~${xe(t.ts)}`:null}const i=a.find(t=>fe(t.condition));return i?`${ve.has(i.condition)?"Snö":"Regn"} börjar ~${xe(i.ts)}`:null}(this._hours,this._now.getTime());return U`
      <div class="time">${this._timeStr}</div>
      <div class="date">${function(t){return t.length?t.charAt(0).toUpperCase()+t.slice(1):t}(He.format(this._now))}</div>
      ${t&&"number"==typeof a?U`
            <div class="wx">
              ${Oe(e,this._isNight)}
              <span class="wx-temp">${Math.round(a)}°</span>
              ${i?U`<span class="wx-range">
                    <span>↑ ${Math.round(i.high)}°</span>
                    <span>↓ ${Math.round(i.low)}°</span>
                  </span>`:q}
            </div>
            ${s?U`<div class="hint">${s}</div>`:q}
          `:q}
    `}}Ve.styles=[Tt,n`
      :host {
        display: block;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .time {
        font-family: var(--hub-font-display);
        font-weight: 200;
        font-size: clamp(56px, 7vw, 96px);
        letter-spacing: -2px;
        line-height: 1;
        color: var(--hub-text);
      }
      .date {
        font-size: 13px;
        margin-top: 6px;
        color: var(--hub-text-muted);
        font-family: var(--hub-font-body);
      }
      .wx {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
      }
      .wx svg {
        width: 30px;
        height: 30px;
        color: var(--hub-text-muted);
      }
      .wx-temp {
        font: 300 30px var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .wx-range {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .hint {
        margin-top: 5px;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-teal);
      }
      /* Over weather footage the hero always uses light ink + shadow — the
         backdrop is the video (dark night clips, bright day clips), not the
         theme surface, so theme-colored text can't guarantee contrast. */
      :host([bg-active]) .time,
      :host([bg-active]) .wx-temp {
        color: var(--hub-ink-on-media);
        text-shadow: 0 2px 18px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(0, 0, 0, 0.3);
      }
      :host([bg-active]) .date,
      :host([bg-active]) .wx-range {
        color: var(--hub-ink-on-media-muted);
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.55);
      }
      :host([bg-active]) .wx svg {
        color: var(--hub-ink-on-media-muted);
      }
      :host([bg-active]) .hint {
        color: #8fe3d2;
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
      }
    `],t([gt({attribute:!1})],Ve.prototype,"weatherEntity",void 0),t([gt({type:Boolean,reflect:!0,attribute:"bg-active"})],Ve.prototype,"bgActive",void 0),t([bt()],Ve.prototype,"_now",void 0),t([bt()],Ve.prototype,"_hours",void 0),t([bt()],Ve.prototype,"_days",void 0),customElements.define("hub-clock",Ve);class Ue extends ht{constructor(){super(...arguments),this.icon="",this.label="",this.tone="neutral",this.active=!1}render(){const t=Ot[this.icon];return U`
      <span class="chip tone-${this.tone} ${this.active?"active":""}">
        ${t?U`<span class="icon">${t}</span>`:""}
        <span class="label">${this.label}</span>
      </span>
    `}}Ue.styles=[Tt,n`
      :host {
        display: inline-flex;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border-radius: var(--hub-radius-pill);
        font: 500 13px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
        white-space: nowrap;
      }
      .icon {
        display: flex;
        width: 14px;
        height: 14px;
        flex-shrink: 0;
      }
      .icon svg {
        width: 100%;
        height: 100%;
      }
      .chip.active.tone-amber {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
      .chip.active.tone-green {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .chip.active.tone-teal {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }
      .chip.active.tone-lavender {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
        color: var(--hub-lavender-text);
      }
      .chip.active.tone-coral {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }
      .chip.active.tone-neutral {
        background: var(--hub-chip-bg);
        border-color: var(--hub-chip-border);
        color: var(--hub-text-muted);
      }
    `],t([gt({attribute:!1})],Ue.prototype,"icon",void 0),t([gt({attribute:!1})],Ue.prototype,"label",void 0),t([gt({attribute:!1})],Ue.prototype,"tone",void 0),t([gt({type:Boolean})],Ue.prototype,"active",void 0),customElements.define("hub-status-chip",Ue);class Ge extends vt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-lights-open",{bubbles:!0,composed:!0}))}}get _count(){const t=this.config.lights_count_entity?this.getEntity(this.config.lights_count_entity):void 0,e=Number(t?.state);return t&&!Number.isNaN(e)?e:null}_litRooms(){return(this.config.rooms??[]).filter(t=>t.lights.some(t=>"on"===this.getEntity(t.entity)?.state)).map(t=>t.name)}render(){if(!this.hass||!this.config)return U``;const t=this._count;return U`
      <div
        class="card ${(t??0)>0?"on":""}"
        role="button"
        tabindex="0"
        aria-label="Visa alla lampor"
        @click=${this._open}
      >
        <span class="ic">${Ot.lamp}</span>
        <div>
          <b class="label">Belysning</b>
          <span class="sub">${function(t,e){if(null===t)return"–";if(0===t)return"Allt släckt";const a=`${t} ${1===t?"tänd":"tända"}`;return e.length?`${a} · ${e.join(", ")}`:a}(t,this._litRooms())}</span>
        </div>
      </div>
    `}}Ge.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition:
          transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
          background 200ms ease,
          border-color 200ms ease;
      }
      .card:active {
        transform: scale(0.985);
      }
      .card.on {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .ic {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .card.on .ic {
        color: var(--hub-amber-text);
      }
      .ic svg {
        width: 21px;
        height: 21px;
      }
      .label {
        display: block;
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .sub {
        display: block;
        margin-top: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card.on .sub {
        color: var(--hub-amber-text);
      }
    `],t([gt({attribute:!1})],Ge.prototype,"config",void 0),customElements.define("hub-lighting-tile",Ge);class We extends vt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-car-open",{bubbles:!0,composed:!0}))}}render(){if(!this.hass||!this.config?.volvo)return U``;const t=this.config.volvo,e=t.battery_entity?this.getEntity(t.battery_entity)?.state:void 0,a=t.range_entity?this.getEntity(t.range_entity)?.state:void 0,i=t.lock_entity?this.getEntity(t.lock_entity)?.state:void 0,s="charging"===(t.charging_entity?this.getEntity(t.charging_entity)?.state:void 0),r=[e&&!Number.isNaN(Number(e))?`${e}%`:null,a&&!Number.isNaN(Number(a))?`${a} km`:null,s?"Laddar":null].filter(Boolean);return U`
      <div class="card" role="button" tabindex="0" aria-label="Visa bilen" @click=${this._open}>
        <div class="top-row">
          <span class="ic">${Ot.car}</span>
          ${"locked"===i||"unlocked"===i?U`<span class="lock ${"locked"===i?"":"unlocked"}">
                ${"locked"===i?"Låst":"Olåst"}
              </span>`:q}
        </div>
        <div>
          <b class="label">${t.name??"Volvo"}</b>
          <span class="sub">${r.length?r.join(" · "):"–"}</span>
        </div>
      </div>
    `}}We.styles=[Tt,n`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .card:active { transform: scale(0.985); }
      .top-row { display: flex; align-items: center; justify-content: space-between; }
      .ic {
        width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
        border-radius: 11px; background: var(--hub-icon-chip-bg); color: var(--hub-icon-chip-color);
      }
      .ic svg { width: 21px; height: 21px; }
      .lock {
        font: 600 11px var(--hub-font-body);
        padding: 3px 8px; border-radius: 6px;
        background: var(--hub-chip-bg); color: var(--hub-text-dim);
        border: 1px solid var(--hub-chip-border);
      }
      .lock.unlocked { background: var(--hub-coral-bg); color: var(--hub-coral); border-color: var(--hub-coral-border); }
      .label { display: block; font: 600 15px var(--hub-font-body); color: var(--hub-text); }
      .sub {
        display: block; margin-top: 3px;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    `],t([gt({attribute:!1})],We.prototype,"config",void 0),customElements.define("hub-car-card",We);const qe={docked:"Dockad",cleaning:"Städar",returning:"Åker hem",paused:"Pausad",error:"Fel",idle:"Väntar"};class Xe extends vt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-vacuum-open",{bubbles:!0,composed:!0}))}}render(){if(!this.hass||!this.config)return U``;const t=this.config.vacuum_entity?this.getEntity(this.config.vacuum_entity):void 0,e=this.config.vacuum_controls,a=e?.battery_entity?this.getEntity(e.battery_entity)?.state:void 0,i=t?.state??"unknown",s=qe[i]??"–",r="cleaning"===i||"returning"===i,n=a&&!Number.isNaN(Number(a))?`${s} · ${a}%`:s;return U`
      <div
        class="card ${r?"active":""} ${"error"===i?"err":""}"
        role="button"
        tabindex="0"
        aria-label="Visa dammsugaren"
        @click=${this._open}
      >
        <span class="ic">${Ot.vacuum}</span>
        <div>
          <b class="label">Roborock</b>
          <span class="sub">${n}</span>
        </div>
      </div>
    `}}function Ye(t){if(!t.includes("T")){const[e,a,i]=t.split("-").map(Number);return new Date(e,a-1,i).getTime()}return new Date(t).getTime()}function Ke(t,e){const a=t.trim().toLowerCase();return e.includes("T")?`${a}|${Math.floor(new Date(e).getTime()/6e4)}`:`${a}|${e}`}Xe.styles=[Tt,n`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
        padding: 16px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .card:active { transform: scale(0.985); }
      .card.err { border-color: var(--hub-coral-border); background: var(--hub-coral-bg); }
      .ic {
        width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
        border-radius: 11px; background: var(--hub-icon-chip-bg); color: var(--hub-icon-chip-color);
      }
      .ic svg { width: 21px; height: 21px; }
      .card.active .ic { color: var(--hub-teal); }
      .card.err .ic { color: var(--hub-coral); }
      .label { display: block; font: 600 15px var(--hub-font-body); color: var(--hub-text); }
      .sub {
        display: block; margin-top: 3px;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    `],t([gt({attribute:!1})],Xe.prototype,"config",void 0),customElements.define("hub-vacuum-card",Xe);const Ze=["sön","mån","tis","ons","tors","fre","lör"];function Je(t,e){const a=new Date(Ye(t)),i=new Date(e.getFullYear(),e.getMonth(),e.getDate()).getTime(),s=new Date(a.getFullYear(),a.getMonth(),a.getDate()).getTime(),r=Math.round((s-i)/864e5);return 0===r?"Idag":1===r?"Imorgon":`${Ze[a.getDay()]} ${a.getDate()}/${a.getMonth()+1}`}let Qe=null;async function ta(t,e,a=7){if(!e.length)return[];const i=e.join(",");if(Qe&&Qe.key===i&&Date.now()-Qe.at<3e5)return Qe.data;try{const s=new Date,r=new Date(s.getTime()+864e5*a),n=await t.callWS({type:"call_service",domain:"calendar",service:"get_events",service_data:{start_date_time:s.toISOString(),end_date_time:r.toISOString()},target:{entity_id:e},return_response:!0}),o={};for(const t of e)o[t]=n?.response?.[t]?.events??[];const l=function(t){const e=new Map;for(const[a,i]of Object.entries(t))for(const t of i??[]){if(!t?.summary||!t.start)continue;const i=Ke(t.summary,t.start),s=e.get(i);s?s.sources.includes(a)||s.sources.push(a):e.set(i,{title:t.summary.trim(),start:t.start,end:t.end??t.start,allDay:!t.start.includes("T"),sources:[a]})}return[...e.values()].sort((t,e)=>Ye(t.start)-Ye(e.start))}(o);return Qe={key:i,at:Date.now(),data:l},l}catch{return null}}class ea extends vt{constructor(){super(...arguments),this._events=null,this._open=()=>{this.dispatchEvent(new CustomEvent("hub-calendar-open",{bubbles:!0,composed:!0}))}}connectedCallback(){super.connectedCallback(),this._refresh(),this._timer=window.setInterval(()=>{this._refresh()},3e5)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._timer&&clearInterval(this._timer)}async _refresh(){const t=this.config?.calendar;if(!this.hass||!t?.entities?.length)return;const e=await ta(this.hass,t.entities);e&&(this._events=e)}_when(t){const e=Je(t.start,new Date);if(t.allDay)return e;const a=new Date(t.start);return`${e} ${`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`}`}render(){if(!this.hass||!this.config?.calendar)return U``;const t=(this._events??[]).slice(0,3);return U`
      <div class="card" role="button" tabindex="0" aria-label="Visa kalendern" @click=${this._open}>
        <b class="label">Kalender</b>
        ${0===t.length?U`<span class="empty">Inga händelser på 7 dagar</span>`:t.map(t=>U`
                <div class="row">
                  <span class="when">${this._when(t)}</span>
                  <span class="what">${t.title}</span>
                </div>
              `)}
      </div>
    `}}function aa(t){const e=t??[];return{open:e.filter(t=>"needs_action"===t.status),done:e.filter(t=>"completed"===t.status)}}async function ia(t,e){try{const a=await t.callWS({type:"call_service",domain:"todo",service:"get_items",service_data:{},target:{entity_id:e},return_response:!0});return a?.response?.[e]?.items??[]}catch{return null}}ea.styles=[Tt,n`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; gap: 7px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg, var(--hub-card));
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        overflow: hidden;
      }
      .card:active { transform: scale(0.985); }
      .label { font: 600 14px var(--hub-font-body); color: var(--hub-text); flex-shrink: 0; }
      .row { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
      .when {
        flex-shrink: 0; width: 96px;
        font: 600 12.5px var(--hub-font-body); color: var(--hub-lavender, var(--hub-text-muted));
      }
      .what {
        flex: 1; min-width: 0;
        font: 500 13.5px var(--hub-font-body); color: var(--hub-text);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }
    `],t([gt({attribute:!1})],ea.prototype,"config",void 0),t([bt()],ea.prototype,"_events",void 0),customElements.define("hub-calendar-card",ea);class sa extends vt{constructor(){super(...arguments),this._items=null,this._lastCount="",this._fetchSeq=0,this._open=()=>{this.dispatchEvent(new CustomEvent("hub-todo-open",{bubbles:!0,composed:!0}))}}updated(t){super.updated(t);const e=this.config?.todo_entity;if(!e||!this.hass)return;const a=this.getEntity(e)?.state??"";a!==this._lastCount&&(this._lastCount=a,this._refresh())}async _refresh(){if(!this.hass||!this.config?.todo_entity)return;const t=++this._fetchSeq,e=await ia(this.hass,this.config.todo_entity);t===this._fetchSeq&&(this._items=e)}_complete(t,e){t.stopPropagation(),this.config.todo_entity&&this.callService("todo","update_item",{item:e.uid,status:"completed"},this.config.todo_entity)}render(){if(!this.hass||!this.config?.todo_entity)return U``;const{open:t}=aa(this._items);return U`
      <div class="card" role="button" tabindex="0" aria-label="Visa att göra-listan" @click=${this._open}>
        <b class="label">Att göra</b>
        ${0===t.length?U`<span class="empty">Inget att göra</span>`:t.slice(0,4).map(t=>U`
                <div class="row">
                  <button class="box" aria-label="Klar: ${t.summary}" @click=${e=>this._complete(e,t)}><span class="box-visual"></span></button>
                  <span class="txt">${t.summary}</span>
                </div>
              `)}
        ${t.length>4?U`<span class="more">+${t.length-4} till</span>`:q}
      </div>
    `}}sa.styles=[Tt,n`
      :host { display: block; height: 100%; }
      .card {
        box-sizing: border-box; height: 100%;
        display: flex; flex-direction: column; gap: 8px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg, var(--hub-card));
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer; user-select: none;
        -webkit-tap-highlight-color: transparent;
        overflow: hidden;
      }
      .card:active { transform: scale(0.985); }
      .label { font: 600 14px var(--hub-font-body); color: var(--hub-text); flex-shrink: 0; }
      .row {
        display: flex; align-items: center; gap: 10px; min-height: 28px;
      }
      .box {
        width: 44px; height: 44px; flex-shrink: 0;
        margin: -13px;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        display: flex; align-items: center; justify-content: center;
      }
      .box-visual {
        width: 18px; height: 18px;
        box-sizing: border-box;
        border-radius: 6px;
        border: 1.5px solid var(--hub-text-dim);
        background: transparent;
      }
      .txt {
        flex: 1; min-width: 0;
        font: 500 13px var(--hub-font-body); color: var(--hub-text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }
      .more { font: 500 12px var(--hub-font-body); color: var(--hub-text-dim); }
    `],t([gt({attribute:!1})],sa.prototype,"config",void 0),t([bt()],sa.prototype,"_items",void 0),customElements.define("hub-todo-card",sa);const ra=new Set(["off","unavailable","unknown","standby","idle"]);function na(t,e){for(const a of e){const e=t[a.entity];if(e&&"playing"===e.state)return{entity:e,name:a.name}}for(const a of e){const e=t[a.entity];if(e&&!ra.has(e.state))return{entity:e,name:a.name}}return null}function oa(t,e){if(!t)return 0;const a=t.attributes,i="number"==typeof a.media_duration?a.media_duration:0;if(i<=0)return 0;let s="number"==typeof a.media_position?a.media_position:0;const r="string"==typeof a.media_position_updated_at?Date.parse(a.media_position_updated_at):NaN;return"playing"!==t.state||Number.isNaN(r)||(s+=(e-r)/1e3),Math.max(0,Math.min(100,s/i*100))}class la extends vt{constructor(){super(...arguments),this.players=[],this._now=Date.now()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=Date.now()},1e3)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_goto(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"media"},bubbles:!0,composed:!0}))}_togglePlay(t,e){t.stopPropagation(),this.callService("media_player","media_play_pause",void 0,e)}render(){if(!this.hass)return U``;const t=na(this.hass.states,this.players??[]);if(!t)return U`
        <div class="np idle" @click=${this._goto}>
          <span class="idle-ic">${Ot.note}</span>
          <b class="title dim">Ingenting spelas</b>
        </div>
      `;const e=t.entity,a="playing"===e.state,i=e.attributes.media_title||t.name,s=e.attributes.media_artist||t.name,r=e.attributes.entity_picture,n=oa(e,this._now);return U`
      <div class="np ${a?"playing":""}" @click=${this._goto}>
        <div
          class="art"
          style=${r?`background-image:url('${r}')`:""}
        ></div>
        <div class="meta">
          <b class="title">${i}</b>
          <small class="sub">${s}</small>
          <div class="bar"><div class="fill" style="width:${n}%"></div></div>
        </div>
        <button
          class="pp"
          aria-label=${a?"Pausa":"Spela"}
          @click=${t=>this._togglePlay(t,e.entity_id)}
        >
          <span class="ppic">${a?Ot.pause:Ot.play}</span>
        </button>
      </div>
    `}}la.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .np {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease;
      }
      .np.playing {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
      }
      .art {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #3b6ea5, #8e5ea2);
        background-size: cover;
        background-position: center;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .title {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .np.playing .title {
        color: var(--hub-teal-text);
      }
      .sub {
        font-size: 12px;
        color: var(--hub-text-dim);
        display: block;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .np.playing .sub {
        color: var(--hub-teal-muted);
      }
      .bar {
        height: 4px;
        border-radius: 2px;
        background: var(--hub-track);
        margin-top: 9px;
        overflow: hidden;
      }
      .np.playing .bar {
        background: var(--hub-teal-border);
      }
      .fill {
        height: 100%;
        border-radius: 2px;
        background: var(--hub-text-dim);
        transition: width 0.9s linear;
      }
      .np.playing .fill {
        background: var(--hub-teal);
      }
      .pp {
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        padding: 0;
        margin: -4px -8px -4px 0;
        cursor: pointer;
        color: var(--hub-text-muted);
        -webkit-tap-highlight-color: transparent;
      }
      .np.playing .pp {
        color: var(--hub-teal);
      }
      .pp .ppic {
        display: flex;
        width: 22px;
        height: 22px;
      }
      .pp svg {
        width: 100%;
        height: 100%;
      }
      .idle-ic {
        display: flex;
        width: 22px;
        height: 22px;
        color: var(--hub-text-dim);
        flex-shrink: 0;
      }
      .idle-ic svg {
        width: 100%;
        height: 100%;
      }
      .title.dim {
        color: var(--hub-text-dim);
        font-weight: 500;
      }
    `],t([gt({attribute:!1})],la.prototype,"players",void 0),t([bt()],la.prototype,"_now",void 0),customElements.define("hub-now-playing",la);const ha=new Intl.NumberFormat("sv-SE");function ca(t,e){return e>0?Math.max(0,Math.min(100,t/e*100)):0}class da extends vt{_goto(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"kcal"},bubbles:!0,composed:!0}))}render(){if(!this.hass)return U``;const t=this.todayEntity?this.getEntity(this.todayEntity):void 0,e=t?Number(t.state):NaN;if(!t||"unavailable"===t.state||"unknown"===t.state||Number.isNaN(e))return U`
        <div class="kc offline" @click=${this._goto}>
          <div class="ring" style="--pct:0"></div>
          <div class="meta"><b class="val">Kcal · offline</b></div>
        </div>
      `;const a="number"==typeof t.attributes.kcal_target?t.attributes.kcal_target:0,i=ca(e,a),s=function(t){const e=t.protein_g;return"number"==typeof e?`${Math.round(e)} g protein`:""}(t.attributes);return U`
      <div class="kc" @click=${this._goto}>
        <div class="ring" style="--pct:${i}"></div>
        <div class="meta">
          <b class="val">
            ${ha.format(Math.round(e))}
            <span class="target">
              ${a>0?`/ ${ha.format(a)} kcal`:"kcal"}
            </span>
          </b>
          ${s?U`<small class="sub">${s}</small>`:q}
        </div>
      </div>
    `}}da.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .kc {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease;
      }
      .kc.offline {
        background: var(--hub-card);
        border-color: var(--hub-card-border);
      }
      .ring {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        flex-shrink: 0;
        background: conic-gradient(
          var(--hub-lavender) calc(var(--pct, 0) * 1%),
          var(--hub-track) 0
        );
        -webkit-mask: radial-gradient(circle, transparent 14px, #000 14.5px);
        mask: radial-gradient(circle, transparent 14px, #000 14.5px);
      }
      .kc.offline .ring {
        background: var(--hub-track);
      }
      .meta {
        min-width: 0;
      }
      .val {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-lavender-text);
        display: block;
        white-space: nowrap;
      }
      .kc.offline .val {
        color: var(--hub-text-dim);
        font-weight: 500;
        font-size: 13px;
      }
      .target {
        opacity: 0.5;
        font-weight: 400;
      }
      .sub {
        font-size: 12px;
        color: var(--hub-lavender-muted);
        display: block;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `],t([gt({attribute:!1})],da.prototype,"todayEntity",void 0),customElements.define("hub-kcal-ring",da);const pa={frukost:"Frukost",lunch:"Lunch",middag:"Middag",mellis:"Mellis"},ua=["frukost","lunch","middag","mellis"],ga={gymdag:"G",vilodag:"V",flexdag:"F"};const ba=/^\d{4}-\d{2}-\d{2}$/;function ma(t){if(!t||"object"!=typeof t)return null;const e=t;if("frukost"!==(a=e.slot)&&"lunch"!==a&&"middag"!==a&&"mellis"!==a||"string"!=typeof e.name||""===e.name)return null;var a;const i=t=>"number"==typeof t&&Number.isFinite(t)?t:0;return{slot:e.slot,name:e.name,kcal:i(e.kcal),protein:i(e.protein),fat:i(e.fat),carbs:i(e.carbs),logged:!0===e.logged}}function va(t){if(!t||"object"!=typeof t)return null;const e=t;if("string"!=typeof e.date||!ba.test(e.date))return null;const a=Array.isArray(e.meals)?e.meals.map(ma).filter(t=>null!==t):[];return{date:e.date,weekday:"string"==typeof e.weekday?e.weekday:"",day_type:"string"==typeof e.day_type?e.day_type:"vilodag",confirmed:!0===e.confirmed,meals:a,total_kcal:"number"==typeof e.total_kcal?e.total_kcal:0,target_kcal:"number"==typeof e.target_kcal?e.target_kcal:0,protein_ok:!0===e.protein_ok,kcal_ok:!1!==e.kcal_ok}}function fa(t){if(!t)return null;const{week_start:e,today:a,days:i}=t;if("string"!=typeof e||!ba.test(e))return null;if(!Array.isArray(i))return null;const s=i.map(va).filter(t=>null!==t);return 0===s.length?null:{weekStart:e,today:"string"==typeof a&&ba.test(a)?a:e,confirmedDays:s.filter(t=>t.confirmed).length,days:s}}function xa(t){const e=t=>ua.flatMap(e=>t.meals.filter(t=>t.slot===e&&!t.logged)),a=t.days.find(e=>e.date===t.today);if(a){const t=e(a);if(t.length>0)return{dayLabel:"Idag",day:a,meals:t}}const i=t.days.find(e=>e.date===function(t,e){const[a,i,s]=t.split("-").map(Number);return new Date(Date.UTC(a,i-1,s+e)).toISOString().slice(0,10)}(t.today,1));if(i){const t=e(i);if(t.length>0)return{dayLabel:"Imorgon",day:i,meals:t}}return null}const ya=new Intl.NumberFormat("sv-SE");class _a extends vt{_model(){if(!this.plannerEntity)return null;const t=this.getEntity(this.plannerEntity);return t&&"unavailable"!==t.state&&"unknown"!==t.state?fa(t.attributes):null}_open(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"vecka"},bubbles:!0,composed:!0}))}render(){if(!this.hass||!this.plannerEntity)return q;const t=this._model(),e=t?xa(t):null;return U`
      <div class="card${e?"":" empty"}" @click=${this._open}>
        <div class="head">
          <span class="eyebrow">Matsedel</span>
          ${t?U`<span class="count">${t.confirmedDays} / 7 ✓</span>`:q}
        </div>
        ${e?U`
              <span class="when">${e.dayLabel}</span>
              <div class="meals">
                ${e.meals.map(t=>U`
                    <div class="meal">
                      <span class="slot">${pa[t.slot]}</span>
                      <span class="name">${t.name}</span>
                      <span class="kcal">${ya.format(t.kcal)}</span>
                    </div>
                  `)}
              </div>
            `:U`<div class="none">${t?"Inget planerat ännu":"Vecka · offline"}</div>`}
      </div>
    `}}function wa(t){const e=Date.parse(t.expected??t.scheduled??"");return Number.isNaN(e)?Number.POSITIVE_INFINITY:e}function ka(t,e,a){if(!Array.isArray(t))return[];const i=a?new RegExp(a,"i"):null;return t.filter(t=>t?.line?.designation===e).filter(t=>!(i&&t.destination&&i.test(t.destination))).sort((t,e)=>wa(t)-wa(e))}_a.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 12px 18px;
        border-radius: var(--hub-radius);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition:
          background var(--hub-fade) ease,
          border-color var(--hub-fade) ease;
        overflow: hidden;
      }
      .card.empty {
        background: var(--hub-card);
        border-color: var(--hub-card-border);
      }
      .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
      }
      .eyebrow {
        font: 600 11px var(--hub-font-body);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .count {
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-lavender-muted);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .when {
        font: 600 12.5px var(--hub-font-body);
        color: var(--hub-lavender-text);
        margin-top: 4px;
        flex-shrink: 0;
      }
      .meals {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        margin-top: 2px;
      }
      .meal {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 2.5px 0;
      }
      .slot {
        flex-shrink: 0;
        width: 58px;
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .name {
        min-width: 0;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .kcal {
        flex-shrink: 0;
        margin-left: auto;
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .none {
        flex: 1;
        display: flex;
        align-items: center;
        font: 400 13px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
    `],t([gt({attribute:!1})],_a.prototype,"plannerEntity",void 0),customElements.define("hub-meal-card",_a);function $a(t){if(!Array.isArray(t))return[];const e=new Map;for(const a of t){if(!a||"object"!=typeof a)continue;const t=a;if("string"!=typeof t.header||0===t.header.length)continue;const i="number"==typeof t.priority?t.priority:0,s=Array.isArray(t.lines)?t.lines.map(t=>t&&"object"==typeof t?t.designation:null).filter(t=>"string"==typeof t&&t.length>0):[],r="string"==typeof t.details&&t.details.length>0?t.details:void 0,n="string"==typeof t.scope&&t.scope.length>0?t.scope:void 0,o=e.get(t.header);if(o){for(const t of s)o.badges.add(t);o.priority=Math.max(o.priority,i),!o.details&&r&&(o.details=r),!o.scope&&n&&(o.scope=n)}else e.set(t.header,{badges:new Set(s),priority:i,details:r,scope:n})}return[...e.entries()].sort((t,e)=>e[1].priority-t[1].priority).slice(0,5).map(([t,e])=>({badges:[...e.badges].sort(),header:t,...void 0!==e.details?{details:e.details}:{},...void 0!==e.scope?{scope:e.scope}:{}}))}const Ea=new Set(["unavailable","unknown",""]);function Sa(t){if(!t||Ea.has(t))return null;const e=new Date(t);if(Number.isNaN(e.getTime()))return null;return`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}class Ca extends vt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-transit-open",{bubbles:!0,composed:!0}))}}_pendeltag(){const t=this.config.transit?.pendeltag;if(!t)return U`<span class="sub dim">–</span>`;const e=this.getEntity(t.next_entity),a=Sa(e?.state);if(!a)return U`<span class="sub dim">–</span>`;const i=this.getEntity(t.count_entity),s=i&&!Number.isNaN(Number(i.state))?Number(i.state):null;return U`<span class="sub">Nästa ${a}${null===s?"":` · ${s} ${1===s?"avgång":"avgångar"}`}</span>`}_bus(){const t=this.config.transit?.bus;if(!t)return U`<span class="sub dim">Inga avgångar idag</span>`;const e=this.getEntity(t.entity),a=ka(e?.attributes.departures??[],t.line,t.exclude_destination).slice(0,3);return 0===a.length?U`<span class="sub dim">Inga avgångar idag</span>`:U`<span class="sub"
      >${a.map((t,e)=>U`${e>0?U`<span class="sep">·</span>`:""}<span
            class="dep ${t.state&&"EXPECTED"!==t.state?"delayed":""}"
            >${t.display??"–"}</span
          >`)}</span
    >`}_shaped(){const t=this.config.disturbances_entity?this.getEntity(this.config.disturbances_entity):void 0;return t&&"unavailable"!==t.state&&"unknown"!==t.state?$a(t.attributes.deviations):[]}_alerts(t){if(0===t.length)return q;if(1===t.length){const e=t[0];return U`<div class="alerts">
        <div class="alert">
          ${e.badges.map(t=>U`<span class="badge">${t}</span>`)}
          <span class="alert-text">${e.header}</span>
        </div>
      </div>`}const e=[...new Set(t.flatMap(t=>t.badges))].sort();return U`<div class="alerts">
      <div class="alert">
        ${e.map(t=>U`<span class="badge">${t}</span>`)}
        <span class="alert-text">${t.length} störningar</span>
      </div>
    </div>`}render(){if(!this.hass||!this.config)return U``;const t=this.config.transit?.bus?.label??"Buss",e=this._shaped();return U`
      <div
        class="card ${e.length?"has-alerts":""}"
        role="button"
        tabindex="0"
        aria-label="Visa avgångar och störningar"
        @click=${this._open}
      >
        <div class="row">
          <span class="ic">${Ot.train}</span>
          <div class="meta">
            <b class="label">Pendeltåg</b>
            ${this._pendeltag()}
          </div>
        </div>
        <div class="row">
          <span class="ic">${Ot.bus}</span>
          <div class="meta">
            <b class="label">${t}</b>
            ${this._bus()}
          </div>
        </div>
        ${this._alerts(e)}
      </div>
    `}}Ca.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        overflow: hidden;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .card:active {
        transform: scale(0.985);
      }
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        min-width: 0;
        min-height: 0;
        flex: 1;
        overflow: hidden;
      }
      .row + .row {
        border-top: 1px solid var(--hub-card-border);
      }
      .card.has-alerts .row {
        padding: 6px 18px;
        gap: 12px;
      }
      .ic {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        border-radius: 11px;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .ic svg {
        width: 21px;
        height: 21px;
      }
      .card.has-alerts .ic {
        width: 28px;
        height: 28px;
        border-radius: 9px;
      }
      .card.has-alerts .ic svg {
        width: 16px;
        height: 16px;
      }
      .meta {
        flex: 1;
        min-width: 0;
      }
      .label {
        display: block;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card.has-alerts .label {
        font-size: 13.5px;
      }
      .sub {
        display: block;
        margin-top: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card.has-alerts .sub {
        font-size: 12px;
        margin-top: 2px;
      }
      .sub.dim {
        color: var(--hub-text-dim);
        font-weight: 500;
      }
      .dep {
        color: var(--hub-text-muted);
      }
      .dep.delayed {
        color: var(--hub-coral);
      }
      .sep {
        color: var(--hub-text-dim);
        margin: 0 6px;
      }
      .alerts {
        flex-shrink: 0;
        border-top: 1px solid var(--hub-coral-border);
        background: var(--hub-coral-bg);
        padding: 3px 18px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .alert {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .badge {
        flex-shrink: 0;
        min-width: 22px;
        padding: 1px 6px;
        border-radius: 6px;
        text-align: center;
        background: var(--hub-coral);
        color: var(--hub-surface);
        font: 700 10px var(--hub-font-body);
      }
      .alert-text {
        flex: 1;
        min-width: 0;
        font: 600 11px var(--hub-font-body);
        color: var(--hub-coral);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `],t([gt({attribute:!1})],Ca.prototype,"config",void 0),customElements.define("hub-transit-card",Ca);const Ma=36e5,Aa=new Set(["unavailable","unknown","none",""]);function Ta(t,e,a){if(!Array.isArray(t))return[];const i=[];for(const s of t){if(!s||"object"!=typeof s)continue;const t=s,r="number"==typeof t.total?t.total:Number(t.total);if(!Number.isFinite(r)||"string"!=typeof t.startsAt)continue;const n=new Date(t.startsAt);if(Number.isNaN(n.getTime()))continue;const o="number"==typeof t.energy?t.energy:Number(t.energy),l=Number.isFinite(o)?100*o:null,h=100*r,c="spot"===e&&null!==l?l:h+("allin"===e?a:0);i.push({start:n,ore:c,totalOre:h,spotOre:l})}return i.sort((t,e)=>t.start.getTime()-e.start.getTime())}function Na(t){if(t.length<3)return null;let e=1/0,a=-1;for(let i=0;i+3<=t.length;i++){let s=!0,r=t[i].ore;for(let e=i+1;e<i+3;e++){if(t[e].start.getTime()-t[e-1].start.getTime()!==Ma){s=!1;break}r+=t[e].ore}s&&r<e&&(e=r,a=i)}return a<0?null:{start:t[a].start,end:new Date(t[a+3-1].start.getTime()+Ma)}}function Fa(t,e,a,i="allin",s=0){if(Aa.has(String(e??"").toLowerCase()))return{now:null,level:"normal",today:[],tomorrow:[],cheapestWindow:null};const r=Ta(t?.today,i,s),n=Ta(t?.tomorrow,i,s);if(0===r.length&&0===n.length)return{now:null,level:"normal",today:[],tomorrow:[],cheapestWindow:null};const o=[...r,...n].sort((t,e)=>t.start.getTime()-e.start.getTime()),l=a.getTime(),h=o.find(t=>t.start.getTime()<=l&&l<t.start.getTime()+Ma)??null;let c="normal";if(h&&r.length){const t=r.reduce((t,e)=>t+e.ore,0)/r.length;if(t>0){const e=h.ore/t;e<.85?c="låg":e>1.15&&(c="hög")}}const d=o.filter(t=>t.start.getTime()+Ma>l);return{now:h,level:c,today:r,tomorrow:n,cheapestWindow:Na(d)}}function Pa(t){const e=[...t.today,...t.tomorrow];return e.length>0&&e.every(t=>null!==t.spotOre)}const Da="glass-hub-price-view";function za(){try{return"spot"===localStorage.getItem(Da)?"spot":"allin"}catch{return"allin"}}function ja(t){return(t?.grid?.overforing_ore??0)+(t?.grid?.energiskatt_ore??0)}const La={"låg":"lågt",normal:"normalt","hög":"högt"};class Ia extends vt{constructor(){super(...arguments),this._now=new Date,this._open=()=>{this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"energi"},bubbles:!0,composed:!0}))}}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_model(){const t=this.config.price_series_entity?this.getEntity(this.config.price_series_entity):void 0;if(!t)return null;const e=za(),a=t.attributes,i=Fa(a,t.state,this._now,e,"allin"===e?ja(this.config):0);return"spot"===e&&i.today.length&&i.today.some(t=>null===t.spotOre)?Fa(a,t.state,this._now,"allin",ja(this.config)):i}_currentOre(t){if(t?.now)return Math.round(t.now.ore);const e=this.config.price_entity?this.getEntity(this.config.price_entity):void 0;return e&&!Number.isNaN(Number(e.state))?Math.round(100*Number(e.state)):null}_bars(t){const e=function(t,e){const a=[...t.today,...t.tomorrow].sort((t,e)=>t.start.getTime()-e.start.getTime()),i=e.getTime(),s=t.cheapestWindow,r=s?s.start.getTime():null,n=s?s.end.getTime():null;return a.filter(t=>t.start.getTime()+Ma>i).slice(0,12).map(t=>{const e=t.start.getTime();return{start:t.start,ore:t.ore,current:e<=i&&i<e+Ma,cheap:null!==r&&e>=r&&e<n}})}(t,this._now);if(0===e.length)return U`<div class="waiting">Väntar på prisdata</div>`;const a=e.map(t=>t.ore),i=Math.min(...a),s=Math.max(...a)-i;return U`<div class="bars">
      ${e.map(t=>{return U`<div
          class="bar ${t.current?"current":t.cheap?"cheap":""}"
          style="height:${(e=t.ore,s>0?100*(.2+(e-i)/s*.8):60).toFixed(1)}%"
        ></div>`;var e})}
    </div>`}render(){if(!this.hass||!this.config)return U``;const t=this._model(),e=this._currentOre(t),a=!!t&&t.today.length>0,i=t?.now?t.level:"normal",s="låg"===i?"low":"hög"===i?"high":"",r=a&&!!t?.now&&"normal"!==i,n=t?.cheapestWindow,o=n?U`<span class="hint"
          ><span class="ic">${Ot.clock}</span>Billigast ${n.start.getHours()}–${n.end.getHours()}</span
        >`:q;return U`
      <button class="card" aria-label=${null===e?"Elpris, öppna energisidan":`Elpris ${e} öre just nu${r?`, ${La[i]}`:""}, öppna energisidan`} @click=${this._open}>
        <div class="head">
          <div class="lead">
            <span class="ic">${Ot.bolt}</span>
            <span class="num ${s}">${null===e?"—":e}</span>
            <span class="unit">öre</span>
            ${r?U`<span class="level ${s}">· ${La[i]}</span>`:q}
          </div>
          ${o}
        </div>
        ${a?this._bars(t):U`<div class="waiting">Väntar på prisdata</div>`}
      </button>
    `}}Ia.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .card {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px 18px;
        text-align: left;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        color: inherit;
        font-family: var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: border-color 150ms ease;
      }
      .card:focus-visible {
        outline: 2px solid var(--hub-green-border);
        outline-offset: 2px;
      }

      .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }
      .lead {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
      }
      .ic {
        align-self: center;
        display: flex;
        width: 15px;
        height: 15px;
        color: var(--hub-text-dim);
        flex-shrink: 0;
      }
      .ic svg {
        width: 100%;
        height: 100%;
      }
      .num {
        font: 300 clamp(30px, 4vw, 40px) / 1 var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        transition: color var(--hub-fade) ease;
      }
      .num.low {
        color: var(--hub-green);
      }
      .num.high {
        color: var(--hub-coral);
      }
      .unit {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .level {
        font: 600 13px var(--hub-font-body);
      }
      .level.low {
        color: var(--hub-green);
      }
      .level.high {
        color: var(--hub-coral);
      }
      .hint {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
        font: 600 12px var(--hub-font-body);
        color: var(--hub-green);
        white-space: nowrap;
      }
      .hint .ic {
        width: 13px;
        height: 13px;
        color: var(--hub-green);
      }

      /* ── Slim 12h forward sparkline ────────────────────────── */
      .bars {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: flex-end;
        gap: 3px;
      }
      .bar {
        flex: 1;
        min-width: 0;
        border-radius: 3px 3px 1px 1px;
        background: var(--hub-track);
        transition: height var(--hub-fade) ease, background var(--hub-fade) ease;
      }
      .bar.cheap {
        background: color-mix(in srgb, var(--hub-green) 45%, var(--hub-track));
      }
      .bar.current {
        background: var(--hub-green);
        box-shadow: 0 0 12px var(--hub-green-border);
      }

      .waiting {
        flex: 1;
        display: flex;
        align-items: center;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        letter-spacing: 0.01em;
      }
    `],t([gt({attribute:!1})],Ia.prototype,"config",void 0),t([bt()],Ia.prototype,"_now",void 0),customElements.define("hub-energy-strip",Ia);const Oa={cleaning:"Städar",returning:"Åker hem",paused:"Pausad",error:"Fel",idle:"Väntar"};class Ba extends vt{constructor(){super(...arguments),this.theme="natt",this.weatherBg=!1,this.pageActive=!1,this._openVacuum=()=>{this.dispatchEvent(new CustomEvent("hub-vacuum-open",{bubbles:!0,composed:!0}))}}_gotoPage(t){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:t},bubbles:!0,composed:!0}))}get _chips(){const t=this.config,e=[],a=t.lights_count_entity?this.getEntity(t.lights_count_entity):void 0,i=a&&!Number.isNaN(Number(a.state))?Number(a.state):null;if(e.push({icon:"lamp",label:null===i?"—":`${i} ${1===i?"lampa":"lampor"}`,tone:"amber",active:(i??0)>0}),t.vacuum_entity){const a=this.getEntity(t.vacuum_entity);a&&"docked"!==a.state&&"unavailable"!==a.state&&"unknown"!==a.state&&e.push({icon:"vacuum",label:Oa[a.state]??"Städar",tone:"error"===a.state?"coral":"neutral",active:!0,open:this._openVacuum})}const s=t.health?.oura?.readiness_score_entity,r=s?Ht(this.getState(s)):null;if(null!==r){const a=t.health?.oura?.sleep_duration_entity,i=a?Ht(this.getState(a)):null,s=null===i?"":` · ${Rt(Math.round(60*i))}`,n=Bt(r);e.push({icon:"pulse",label:`${Math.round(r)} redo${s}`,tone:"neutral"===n?"lavender":n,active:!0,goto:"halsa"})}if(t.system){const a=t.system,i=t=>t?Ht(this.getState(t)):null,s=te({nodesReady:i(a.cluster?.nodes_ready_entity),nodesTotal:i(a.cluster?.nodes_total_entity),alerts:i(a.alerts?.count_entity),fluxFailing:i(a.cluster?.flux_failing_entity),podsUnhealthy:i(a.cluster?.pods_unhealthy_entity),restarts1h:i(a.cluster?.restarts_entity),clusterTemp:i(a.cluster?.temp_entity),nasCpuTemp:i(a.nas?.cpu_temp_entity),nasNvmeTemp:i(a.nas?.nvme_temp_entity),volume1UsedPct:i(a.nas?.volume1_used_entity),volume2UsedPct:i(a.nas?.volume2_used_entity),backupAgeHours:i(a.nas?.backup_age_entity),certDays:i(a.cluster?.certs_days_entity)});"neutral"!==s.tone&&e.push({icon:"server",label:"green"===s.tone?"System OK":s.label,tone:s.tone,active:"green"!==s.tone,goto:"system"})}if(t.person_entity){const a=this.getEntity(t.person_entity),i=(a?.attributes.friendly_name||"Philip").split(" ")[0],s="home"===a?.state;e.push({icon:"home",label:`${i} ${s?"hemma":"borta"}`,tone:"neutral",active:!1})}return e}render(){if(!this.hass||!this.config)return U``;const t=this.config,e=this.weatherBg?"natt"===this.theme?"--hub-card:rgba(19,19,22,0.86);--hub-chip-bg:rgba(21,21,25,0.86);--hub-teal-bg:rgba(16,20,24,0.86);--hub-lavender-bg:rgba(20,18,23,0.86);":"--hub-card:rgba(255,255,255,0.88);--hub-chip-bg:rgba(255,255,255,0.88);--hub-teal-bg:rgba(255,255,255,0.88);--hub-lavender-bg:rgba(255,255,255,0.88);--hub-amber-bg:rgba(255,255,255,0.88);":"";return U`
      ${this.weatherBg?U`<hub-weather-bg
            .hass=${this.hass}
            .entity=${t.weather_entity}
            .theme=${this.theme}
            .active=${this.pageActive}
          ></hub-weather-bg>`:q}
      <div class="page" style=${e}>
        <div class="top">
          <hub-clock
            .hass=${this.hass}
            .weatherEntity=${t.weather_entity}
            .bgActive=${this.weatherBg}
          ></hub-clock>
          <div class="chips">
            ${this._chips.map(t=>U`
                <hub-status-chip
                  style=${t.goto||t.open?"cursor:pointer":""}
                  .icon=${t.icon}
                  .label=${t.label}
                  .tone=${t.tone}
                  ?active=${t.active}
                  @click=${t.open??(t.goto?()=>this._gotoPage(t.goto):q)}
                ></hub-status-chip>
              `)}
          </div>
        </div>

        <div class="widgets">
          <hub-lighting-tile .hass=${this.hass} .config=${t}></hub-lighting-tile>
          <hub-car-card .hass=${this.hass} .config=${t}></hub-car-card>
          <hub-vacuum-card .hass=${this.hass} .config=${t}></hub-vacuum-card>
          <hub-calendar-card class="cal" .hass=${this.hass} .config=${t}></hub-calendar-card>
          <hub-todo-card .hass=${this.hass} .config=${t}></hub-todo-card>
        </div>

        <div class="info">
          <hub-energy-strip class="energy" .hass=${this.hass} .config=${t}></hub-energy-strip>
          <hub-transit-card class="transit" .hass=${this.hass} .config=${t}></hub-transit-card>
        </div>

        <div class="bottom">
          <hub-now-playing
            class="np"
            .hass=${this.hass}
            .players=${t.media_players??[]}
          ></hub-now-playing>
          <hub-kcal-ring
            class="kc"
            .hass=${this.hass}
            .todayEntity=${t.kcal?.today_entity}
          ></hub-kcal-ring>
          ${t.kcal?.planner_entity?U`<hub-meal-card
                class="meal"
                .hass=${this.hass}
                .plannerEntity=${t.kcal.planner_entity}
              ></hub-meal-card>`:q}
        </div>
      </div>
    `}}Ba.styles=[Tt,n`
      /* Host is a flex column that fills the page section but may grow past it:
         when the wall is too short for everything, the section (its own
         overflow-y:auto) scrolls instead of anything overlapping. */
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        position: relative;
      }
      .page {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: var(--hub-page-pad);
        position: relative;
        z-index: 1;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-shrink: 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        max-width: 56%;
        padding-right: 56px; /* clear the corner theme toggle */
      }
      /* The grid grows into spare height but its flex-basis is the true content
         size and it never shrinks below min-content — so a shrunk band can never
         be painted over. Rows are minmax(min-content, 1fr): fill slack, never
         collapse below a tile. */
      .widgets {
        flex: 1 1 auto;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: minmax(min-content, 1fr);
        gap: var(--hub-gap);
      }
      .widgets .cal {
        grid-column: span 2;
      }

      /* Two glanceable bands below the rooms, fixed-height and non-shrinking. */
      .info,
      .bottom {
        display: flex;
        gap: var(--hub-gap);
        align-items: stretch;
        flex-shrink: 0;
      }
      .info {
        height: clamp(116px, 15vh, 148px);
      }
      .bottom {
        height: clamp(94px, 12vh, 124px);
      }
      .info .energy {
        flex: 3;
        min-width: 0;
      }
      .info .transit {
        flex: 2;
        min-width: 0;
      }
      .bottom .np {
        flex: 2;
        min-width: 0;
      }
      .bottom .kc {
        flex: 1;
        min-width: 0;
      }
      .bottom .meal {
        flex: 1.4;
        min-width: 0;
      }

      /* 2-col regime (≤1400): the room grid becomes three rows, so reclaim
         vertical space — tighter vertical padding and gaps, slimmer bands, and
         equal-width band cards so neither second card is squeezed. Everything
         fits without scrolling down to ~700px tall; shorter than that the page
         scrolls rather than overlapping. */
      @media (max-width: 1400px) {
        .page {
          gap: 10px;
          padding: clamp(14px, 1.8vw, 22px) var(--hub-page-pad);
        }
        .widgets {
          grid-template-columns: repeat(2, 1fr);
        }
        .info {
          height: clamp(104px, 13.5vh, 130px);
        }
        .bottom {
          height: clamp(88px, 11.5vh, 114px);
        }
        .info .energy,
        .info .transit,
        .bottom .np,
        .bottom .kc,
        .bottom .meal {
          flex: 1;
        }
      }

      @media (max-width: 600px) {
        .top {
          flex-direction: column;
        }
        .chips {
          max-width: 100%;
          justify-content: flex-start;
          padding-right: 0;
        }
        .widgets {
          grid-template-columns: 1fr;
        }
        .widgets .cal {
          grid-column: auto;
        }
        .info,
        .bottom {
          flex-direction: column;
          height: auto;
        }
        .info .energy,
        .info .transit,
        .bottom .np,
        .bottom .kc,
        .bottom .meal {
          height: 104px;
          flex: none;
        }
      }
    `],t([gt({attribute:!1})],Ba.prototype,"config",void 0),t([gt({attribute:!1})],Ba.prototype,"theme",void 0),t([gt({attribute:!1})],Ba.prototype,"weatherBg",void 0),t([gt({attribute:!1})],Ba.prototype,"pageActive",void 0),customElements.define("hub-home-page",Ba);const Ra=new Set(["unavailable","unknown"]);class Ha extends vt{constructor(){super(...arguments),this._flash=!1,this._longPressed=!1,this._downX=0,this._downY=0,this._onPointerDown=t=>{this._dead||(this._longPressed=!1,this._downX=t.clientX,this._downY=t.clientY,this._pressTimer=window.setTimeout(()=>{this._longPressed=!0,this.dispatchEvent(new CustomEvent("hub-light-open",{detail:{entity:this.light.entity,name:this.light.name},bubbles:!0,composed:!0}))},500))},this._onPointerMove=t=>{void 0!==this._pressTimer&&(Lt(t.clientX-this._downX)||Lt(t.clientY-this._downY))&&this._cancelPress()},this._cancelPress=()=>{void 0!==this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=void 0)},this._onClick=()=>{this._dead||(this._longPressed?this._longPressed=!1:(this.callService("light","toggle",void 0,this.light.entity),this._flash=!0,void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._flashTimer=window.setTimeout(()=>{this._flash=!1,this._flashTimer=void 0},200)))}}disconnectedCallback(){super.disconnectedCallback(),this._cancelPress(),void 0!==this._flashTimer&&(clearTimeout(this._flashTimer),this._flashTimer=void 0)}get _dead(){const t=this.getEntity(this.light.entity);return!t||Ra.has(t.state)}get _stateLabel(){const t=this.getEntity(this.light.entity);if(!t||Ra.has(t.state))return"Ej tillgänglig";if("on"!==t.state)return"Av";const e=t.attributes.brightness;return"number"==typeof e?`${Math.round(e/255*100)} %`:"På"}render(){if(!this.hass||!this.light)return U``;const t=this.isOn(this.light.entity),e=this._dead;return U`
      <div
        class="tile ${t?"on":""} ${this._flash?"flash":""} ${e?"dead":""}"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._cancelPress}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @click=${this._onClick}
      >
        <span class="ic">${Ot.lamp}</span>
        <span class="name">${this.light.name}</span>
        <span class="state">${this._stateLabel}</span>
      </div>
    `}}Ha.styles=[Tt,n`
      :host {
        display: block;
      }
      .tile {
        box-sizing: border-box;
        min-height: 52px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .tile.on {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .tile.flash {
        transform: scale(0.96);
      }
      .tile.dead {
        cursor: default;
        opacity: 0.55;
      }
      .ic {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .ic svg {
        width: 15px;
        height: 15px;
      }
      .tile.on .ic {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .name {
        flex: 1;
        min-width: 0;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tile.on .name {
        color: var(--hub-amber-text);
        font-weight: 600;
      }
      .state {
        flex-shrink: 0;
        font: 600 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .tile.on .state {
        color: var(--hub-amber-text);
      }
    `],t([gt({attribute:!1})],Ha.prototype,"light",void 0),t([bt()],Ha.prototype,"_flash",void 0),customElements.define("hub-light-tile",Ha);const Va=new Set(["unavailable","unknown"]);function Ua(t){return!!t&&!Va.has(t.state)}class Ga extends vt{constructor(){super(...arguments),this._armed=!1,this._flash=!1,this._headLongPressed=!1,this._headDownX=0,this._headDownY=0,this._onAllOff=()=>{if(!this._armed)return this._armed=!0,void 0!==this._armTimer&&clearTimeout(this._armTimer),void(this._armTimer=window.setTimeout(()=>{this._armed=!1,this._armTimer=void 0},3e3));void 0!==this._armTimer&&clearTimeout(this._armTimer),this._armTimer=void 0,this._armed=!1,this._flash=!0,this.callService("light","turn_off",void 0,"all"),void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._flashTimer=window.setTimeout(()=>{this._flash=!1,this._flashTimer=void 0},200)},this._onHeadMove=t=>{void 0!==this._headPressTimer&&(Lt(t.clientX-this._headDownX)||Lt(t.clientY-this._headDownY))&&this._cancelHeadPress()},this._cancelHeadPress=()=>{void 0!==this._headPressTimer&&(clearTimeout(this._headPressTimer),this._headPressTimer=void 0)}}disconnectedCallback(){super.disconnectedCallback(),this._clearTimers()}_clearTimers(){void 0!==this._armTimer&&clearTimeout(this._armTimer),void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._armTimer=void 0,this._flashTimer=void 0,this._armed=!1,this._flash=!1,this._cancelHeadPress()}_activateScene(t){this.callService("scene","turn_on",void 0,t)}_onHeadDown(t,e){this._headLongPressed=!1,this._headDownX=t.clientX,this._headDownY=t.clientY,this._headPressTimer=window.setTimeout(()=>{this._headLongPressed=!0,this.dispatchEvent(new CustomEvent("hub-room-open",{detail:{roomId:e.id},bubbles:!0,composed:!0}))},500)}_onHeadClick(t){if(this._headLongPressed)return void(this._headLongPressed=!1);const e=function(t,e){const a=t.lights.some(t=>"on"===e[t.entity]?.state);return a?{service:"turn_off",entities:t.lights.map(t=>t.entity)}:{service:"turn_on",entities:t.default_lights?.length?t.default_lights:[t.main_entity]}}(t,this.hass.states);this.callService("light",e.service,{entity_id:e.entities})}_section(t){const e=function(t,e){const a=t.lights.filter(t=>"on"===e[t.entity]?.state),i=a.length;if(0===i)return{onCount:0,pct:null,label:"Släckt"};const s=a.map(t=>e[t.entity]?.attributes.brightness).filter(t=>"number"==typeof t),r=s.length?Math.round(s.reduce((t,e)=>t+e,0)/s.length/255*100):null,n=1===i?"1 lampa":`${i} lampor`;return{onCount:i,pct:r,label:null!==r?`${n} · ${r} %`:n}}(t,this.hass.states),a=e.onCount>0;return U`
      <div class="section">
        <div
          class="sec-head ${a?"active":""}"
          @pointerdown=${e=>this._onHeadDown(e,t)}
          @pointermove=${this._onHeadMove}
          @pointerup=${this._cancelHeadPress}
          @pointercancel=${this._cancelHeadPress}
          @pointerleave=${this._cancelHeadPress}
          @click=${()=>this._onHeadClick(t)}
        >
          <span class="sec-name">${t.name}</span>
          <span class="sec-meta">${e.label}</span>
        </div>
        <div class="tiles">
          ${t.lights.map(t=>U`<hub-light-tile .hass=${this.hass} .light=${t}></hub-light-tile>`)}
        </div>
      </div>
    `}render(){if(!this.hass||!this.config)return U``;const t=this.config,e=function(t,e){let a=0,i=0;for(const s of t.rooms??[])for(const t of s.lights){const s=e[t.entity];Ua(s)&&(i+=1,"on"===s.state&&(a+=1))}return{on:a,total:i}}(t,this.hass.states);return U`
      <div class="page">
        <div class="header">
          <div class="heading">
            <span class="title">Ljus</span>
            <span class="subtitle">
              ${e.on>0?U`<span class="lit">${e.on} tända</span>`:U`Allt släckt`}
            </span>
          </div>
          <div class="actions">
            ${(t.scenes??[]).map(t=>U`
                <button
                  class="action"
                  @click=${()=>this._activateScene(t.entity)}
                >
                  ${Ot[t.icon]?U`<span class="ic">${Ot[t.icon]}</span>`:q}
                  <span>${t.name}</span>
                </button>
              `)}
            <button
              class="action ${this._armed?"armed":""} ${this._flash?"flash":""}"
              aria-label="Släck alla lampor"
              @click=${this._onAllOff}
            >
              <span class="ic">${Ot.power}</span>
              <span>${this._armed?"Säker? Tryck igen":"Allt släckt"}</span>
            </button>
          </div>
        </div>

        <div class="body">
          ${(t.rooms??[]).map(t=>this._section(t))}
        </div>
      </div>
    `}}Ga.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
      }

      /* ── Header ─────────────────────────────────────────── */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        /* keep the whole-home actions clear of the theme toggle in the corner */
        padding-right: 56px;
        margin-bottom: 20px;
      }
      .heading {
        display: flex;
        flex-direction: column;
      }
      .title {
        font: 300 28px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
        line-height: 1.05;
      }
      .subtitle {
        margin-top: 4px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subtitle .lit {
        color: var(--hub-amber);
        font-weight: 600;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .action {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 18px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-amber-border);
        background: var(--hub-amber-bg);
        color: var(--hub-amber-text);
        font: 600 14px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform ${200}ms cubic-bezier(0.2, 0.8, 0.2, 1),
          background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          color var(--hub-fade) ease;
      }
      .action .ic {
        display: flex;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      .action .ic svg {
        width: 100%;
        height: 100%;
      }
      .action.armed {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }
      .action.flash {
        transform: scale(0.94);
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }

      /* ── Room sections in a 3-column flow ─────────────────── */
      .body {
        flex: 1;
        min-height: 0;
        overflow-y: auto; /* emergency fallback only — content must fit 1280×800 */
        overscroll-behavior: contain;
        padding-bottom: 56px;
        -webkit-overflow-scrolling: touch;
        columns: 3;
        column-gap: var(--hub-gap);
      }
      @media (max-width: 1100px) {
        .body {
          columns: 2;
        }
      }
      @media (max-width: 600px) {
        .body {
          columns: 1;
        }
      }

      .section {
        break-inside: avoid;
        margin-bottom: 16px;
      }
      .sec-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding: 2px 4px 8px;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .sec-name {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .sec-head.active .sec-name {
        color: var(--hub-amber-text);
      }
      .sec-meta {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .sec-head.active .sec-meta {
        color: var(--hub-amber-muted);
      }
      .tiles {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      hub-light-tile {
        display: block;
      }
    `],t([gt({attribute:!1})],Ga.prototype,"config",void 0),t([bt()],Ga.prototype,"_armed",void 0),t([bt()],Ga.prototype,"_flash",void 0),customElements.define("hub-lights-page",Ga);class Wa extends ht{constructor(){super(...arguments),this.gridAddOre=0,this._detail=null}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._detailTimer&&(clearTimeout(this._detailTimer),this._detailTimer=void 0)}_slots(){const t=this.model,e=t?.today??[],a=t?.tomorrow??[],i=t?.now?t.now.start.getTime():null,s=t?.cheapestWindow,r=s?s.start.getTime():null,n=s?s.end.getTime():null,o=t=>{const e=t.start.getTime();let a="future",s=null;return null!==i&&(e<i?a="past":e===i&&(a="current",s=String(Math.round(t.ore)))),null!==r&&e>=r&&e<n&&(a+=" cheap"),{kind:"bar",hour:t,cls:a,label:s}},l=e.map(o);if(a.length){l.push({kind:"divider"});for(const t of a)l.push(o(t))}return l}_toggleDetail(t){this._detail=this._detail===t?null:t,void 0!==this._detailTimer&&clearTimeout(this._detailTimer),null!==this._detail&&(this._detailTimer=window.setTimeout(()=>{this._detail=null,this._detailTimer=void 0},6e3))}_bounds(){const t=[...this.model?.today??[],...this.model?.tomorrow??[]].map(t=>t.ore);return{min:Math.min(...t),max:Math.max(...t)}}_height(t,e,a){const i=a-e;return!Number.isFinite(i)||i<=0?60:100*(.14+(t-e)/i*.86)}_tint(t,e,a){const i=a-e,s=i>0?(a-t)/i:.5;return`color-mix(in srgb, var(--hub-green) ${Math.round(22+58*s)}%, var(--hub-track))`}_tick(t){const e=t.start.getHours();return U`<span class="tick ${0===e?"day":""}"
      >${e%6==0?String(e).padStart(2,"0"):""}</span
    >`}_flyout(t,e,a){const i=String(t.start.getHours()).padStart(2,"0"),s=String((t.start.getHours()+1)%24).padStart(2,"0"),r=e<2?"edge-l":e>a-3?"edge-r":"",n=function(t,e){return null===t.spotOre?null:{spot:t.spotOre,taxes:t.totalOre-t.spotOre,grid:e}}(t,this.gridAddOre);return U`
      <div class="flyout ${r}">
        <div class="fly-hour">${i}–${s}</div>
        <div class="fly-price">${Math.round(t.ore)} öre/kWh</div>
        ${n?U`<div class="fly-rows">
              <div class="fly-row"><span>Spot</span><span>${Math.round(n.spot)} öre</span></div>
              <div class="fly-row"><span>Skatt &amp; moms</span><span>${Math.round(n.taxes)} öre</span></div>
              <div class="fly-row"><span>Elnät</span><span>${Math.round(n.grid)} öre</span></div>
            </div>`:q}
      </div>
    `}render(){if(!this.model||0===this.model.today.length)return U``;const t=this._slots(),{min:e,max:a}=this._bounds(),i=t.map(t=>"divider"===t.kind?"8px":"minmax(0, 1fr)").join(" ");return U`
      <div class="chart">
        <div class="plot" style="grid-template-columns:${i}">
          ${t.map((i,s)=>{if("divider"===i.kind)return U`<div class="divider"></div>`;const r=this._height(i.hour.ore,e,a),n=i.cls.startsWith("future")?`background:${this._tint(i.hour.ore,e,a)}`:"";return U`
              <div
                class="cell ${i.cls}"
                style="--bar-h:${r}%"
                @click=${()=>this._toggleDetail(s)}
              >
                ${this._detail===s?this._flyout(i.hour,s,t.length):q}
                ${i.label&&this._detail!==s?U`<span class="cell-label">${i.label}</span>`:q}
                <div class="bar" style="height:${r}%;${n}"></div>
              </div>
            `})}
        </div>
        <div class="axis" style="grid-template-columns:${i}">
          ${t.map(t=>"divider"===t.kind?U`<span></span>`:this._tick(t.hour))}
        </div>
      </div>
    `}}Wa.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .chart {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .plot {
        flex: 1;
        min-height: 0;
        display: grid;
        align-items: end;
        gap: 3px;
      }
      .cell {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }
      .bar {
        width: 100%;
        border-radius: 4px 4px 2px 2px;
        background: var(--hub-track);
        transition: height var(--hub-fade) ease, background var(--hub-fade) ease;
      }
      .cell.past .bar {
        background: var(--hub-text-dim);
        opacity: 0.3;
      }
      .cell.current .bar {
        background: var(--hub-green);
        box-shadow: 0 0 16px var(--hub-green-border);
      }
      .cell.cheap .bar {
        outline: 1.5px solid var(--hub-green);
        outline-offset: 1px;
      }
      .cell-label {
        position: absolute;
        bottom: calc(var(--bar-h) + 8px);
        left: 50%;
        transform: translateX(-50%);
        font: 600 13px var(--hub-font-body);
        color: var(--hub-green);
        white-space: nowrap;
        letter-spacing: -0.01em;
      }
      .divider {
        width: 1px;
        justify-self: center;
        height: 82%;
        align-self: center;
        background: var(--hub-card-border);
      }

      .axis {
        display: grid;
        gap: 3px;
      }
      .tick {
        text-align: center;
        font: 500 10.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        white-space: nowrap;
        overflow: visible;
      }
      .tick.day {
        color: var(--hub-text-muted);
        font-weight: 600;
      }
      .cell {
        cursor: pointer;
      }
      .flyout {
        position: absolute;
        bottom: calc(var(--bar-h) + 10px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        min-width: 132px;
        padding: 10px 12px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        pointer-events: none;
      }
      .flyout.edge-l {
        left: 0;
        transform: none;
      }
      .flyout.edge-r {
        left: auto;
        right: 0;
        transform: none;
      }
      .fly-hour {
        font: 600 11.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        white-space: nowrap;
      }
      .fly-price {
        margin-top: 2px;
        font: 600 17px var(--hub-font-display);
        color: var(--hub-text);
        white-space: nowrap;
      }
      .fly-rows {
        margin-top: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .fly-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font: 500 11px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
    `],t([gt({attribute:!1})],Wa.prototype,"model",void 0),t([gt({type:Number})],Wa.prototype,"gridAddOre",void 0),t([bt()],Wa.prototype,"_detail",void 0),customElements.define("hub-price-chart",Wa);const qa={"låg":"lågt",normal:"normalt","hög":"högt"};class Xa extends vt{constructor(){super(...arguments),this._now=new Date,this._view=za()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_model(){const t=this.config.price_series_entity?this.getEntity(this.config.price_series_entity):void 0;if(!t)return null;const e=t.attributes;let a=Fa(e,t.state,this._now,this._view,"allin"===this._view?ja(this.config):0);return"spot"!==this._view||Pa(a)||(a=Fa(e,t.state,this._now,"allin",ja(this.config))),a}_setView(t){this._view=t,function(t){try{localStorage.setItem(Da,t)}catch{}}(t)}_currentOre(t){if(t?.now)return Math.round(t.now.ore);const e=this.config.price_entity?this.getEntity(this.config.price_entity):void 0;return e&&!Number.isNaN(Number(e.state))?Math.round(100*Number(e.state)):null}_chips(t){const e=this.config,a=[],i=e.co2_entity?this.getEntity(e.co2_entity):void 0;i&&!Number.isNaN(Number(i.state))&&a.push({icon:"leaf",label:`${Math.round(Number(i.state))} g CO₂`,tone:"green"});const s=e.fossil_entity?this.getEntity(e.fossil_entity):void 0;if(s&&!Number.isNaN(Number(s.state))){const t=Math.round(Number(s.state));a.push({icon:"leaf",label:`${t} % fossilt`,tone:t>=40?"coral":"green"})}const r=t?.cheapestWindow;if(r){const t=r.start.getHours(),e=r.end.getHours();a.push({icon:"clock",label:`Billigast ${t}–${e}`,tone:"green"})}return a}render(){if(!this.hass||!this.config)return U``;const t=this._model(),e=this._currentOre(t),a=t?.now?t.level:"normal",i=!!t&&t.today.length>0,s=this._chips(t),r=!!t&&Pa(t),n="låg"===a?"low":"hög"===a?"high":"",o=!!t?.now&&"normal"!==a;return U`
      <div class="page">
        <div class="header">
          <div class="head-row">
            <div>
              <div class="price">
                <span class="price-num ${n}">${null===e?"—":e}</span>
                <span class="price-unit">öre/kWh</span>
              </div>
              <div class="subline">
                ${"spot"===this._view?"spotpris":"allt-in"} just nu${o?U` ·
                      <span class=${"låg"===a?"accent-low":"accent-high"}
                        >${qa[a]}</span
                      >`:q}
              </div>
            </div>
            ${r?U`<div class="view-toggle">
                  <button
                    class=${"spot"===this._view?"sel":""}
                    @click=${()=>this._setView("spot")}
                  >
                    Spot
                  </button>
                  <button
                    class=${"allin"===this._view?"sel":""}
                    @click=${()=>this._setView("allin")}
                  >
                    Allt-in
                  </button>
                </div>`:q}
          </div>
        </div>

        <div class="chart-wrap">
          ${i?U`<hub-price-chart .model=${t} .gridAddOre=${ja(this.config)}></hub-price-chart>`:U`<div class="waiting">Väntar på prisdata</div>`}
        </div>

        <div class="chips">
          ${s.map(t=>U`
              <hub-status-chip
                .icon=${t.icon}
                .label=${t.label}
                .tone=${t.tone}
                active
              ></hub-status-chip>
            `)}
        </div>
      </div>
    `}}async function Ya(t){if(!t)return null;try{const a=await(e=t,new Promise((t,a)=>{const i=new Image;i.crossOrigin="anonymous",i.onload=()=>t(i),i.onerror=()=>a(new Error("image load failed")),i.src=e})),i=document.createElement("canvas");i.width=8,i.height=8;const s=i.getContext("2d");if(!s)return null;s.drawImage(a,0,0,8,8);const{data:r}=s.getImageData(0,0,8,8);let n=0,o=0,l=0,h=0;for(let t=0;t<r.length;t+=4){0!==r[t+3]&&(n+=r[t],o+=r[t+1],l+=r[t+2],h+=1)}return 0===h?null:[Math.round(n/h),Math.round(o/h),Math.round(l/h)]}catch{return null}var e}Xa.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
      }

      /* ── Header: the current price, oversized ─────────────── */
      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: 8px;
      }
      .view-toggle {
        display: inline-flex;
        gap: 2px;
        padding: 3px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
      }
      .view-toggle button {
        min-height: 42px;
        padding: 0 16px;
        border: none;
        border-radius: var(--hub-radius-pill);
        background: transparent;
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 150ms ease, color 150ms ease;
      }
      .view-toggle button.sel {
        background: var(--hub-green-bg);
        color: var(--hub-green);
      }
      .head-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .price {
        display: flex;
        align-items: baseline;
        gap: 12px;
        line-height: 1;
      }
      .price-num {
        font: 200 clamp(56px, 8vw, 76px) / 1 var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        transition: color var(--hub-fade) ease;
        font-variant-numeric: tabular-nums;
      }
      .price-num.low {
        color: var(--hub-green);
      }
      .price-num.high {
        color: var(--hub-coral);
      }
      .price-unit {
        font: 400 15px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subline {
        margin-top: 6px;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .subline .accent-low {
        color: var(--hub-green);
        font-weight: 600;
      }
      .subline .accent-high {
        color: var(--hub-coral);
        font-weight: 600;
      }

      /* ── Chart fills the middle ───────────────────────────── */
      .chart-wrap {
        flex: 1;
        min-height: 0;
        margin: 12px 0 16px;
      }
      .waiting {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font: 400 clamp(16px, 2.4vw, 22px) var(--hub-font-body);
        color: var(--hub-text-dim);
        letter-spacing: 0.01em;
      }

      /* ── Bottom chips ─────────────────────────────────────── */
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-bottom: 44px; /* clear the page dots */
      }

      @media (max-width: 600px) {
        .head-row {
          flex-wrap: wrap;
          gap: 10px;
        }
      }
    `],t([gt({attribute:!1})],Xa.prototype,"config",void 0),t([bt()],Xa.prototype,"_now",void 0),t([bt()],Xa.prototype,"_view",void 0),customElements.define("hub-energy-page",Xa);const Ka=new Set(["unavailable","unknown"]);class Za extends vt{constructor(){super(...arguments),this.groupMaster=null,this._drag=null}_entity(){return this.hass?.states[this.player.entity]}_volume(){if(null!==this._drag)return this._drag;const t=this._entity()?.attributes.volume_level;return"number"==typeof t?t:0}_onInput(t){this._drag=Number(t.target.value)}_onChange(t){const e=Number(t.target.value);this._drag=null,this.callService("media_player","volume_set",{volume_level:e},this.player.entity)}_stop(t){t.stopPropagation()}_toggleGroup(t){this.groupMaster&&(t?this.callService("media_player","unjoin",void 0,this.player.entity):this.callService("media_player","join",{group_members:[this.player.entity]},this.groupMaster))}render(){if(!this.hass||!this.player)return U``;const t=this._entity(),e=!t||Ka.has(t.state),a=this._volume(),i=Math.round(100*a),s=!e&&a>0,r=this.player.entity===this.groupMaster,n=!r&&!!this.groupMaster&&(o=this.hass.states[this.groupMaster]?.attributes.group_members,l=this.player.entity,Array.isArray(o)&&o.includes(l));var o,l;const h=`linear-gradient(90deg, var(--hub-teal) 0 ${i}%, var(--hub-track) ${i}% 100%)`;return U`
      <div class="row ${s?"active":""}">
        <span class="ic">${Ot.speaker}</span>
        <div class="main">
          <div class="top">
            <span class="name">${this.player.name}</span>
            ${e?q:U`<span class="pct">${i}%</span>`}
          </div>
          ${e?U`<span class="dead">Ej tillgänglig</span>`:U`
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  .value=${String(a)}
                  style=${`--track-bg:${h}`}
                  aria-label=${`Volym ${this.player.name}`}
                  @input=${this._onInput}
                  @change=${this._onChange}
                  @pointerdown=${this._stop}
                  @pointermove=${this._stop}
                  @pointerup=${this._stop}
                  @touchstart=${this._stop}
                  @touchmove=${this._stop}
                />
              `}
        </div>
        ${e||r?q:U`
              <button
                class="chip ${n?"on":""}"
                @click=${()=>this._toggleGroup(n)}
              >
                ${n?"I gruppen":"Gruppera"}
              </button>
            `}
      </div>
    `}}Za.styles=[Tt,n`
      :host {
        display: block;
      }
      .row {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        border-radius: var(--hub-radius);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        transition: border-color var(--hub-fade) ease;
      }
      .row.active {
        border-color: var(--hub-teal-border);
      }
      .ic {
        width: 34px;
        height: 34px;
        flex-shrink: 0;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .row.active .ic {
        background: var(--hub-teal-bg);
        color: var(--hub-teal);
      }
      .ic svg {
        width: 17px;
        height: 17px;
      }
      .main {
        flex: 1;
        min-width: 0;
      }
      .top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }
      .name {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .row.active .name {
        color: var(--hub-teal-text);
      }
      .pct {
        font: 600 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
      }
      .row.active .pct {
        color: var(--hub-teal);
      }

      /* Native range, restyled. 48px hit height, slim visible track. */
      input[type='range'] {
        -webkit-appearance: none;
        appearance: none;
        display: block;
        width: 100%;
        height: 48px;
        margin: -14px 0;
        background: transparent;
        cursor: pointer;
        touch-action: none;
      }
      input[type='range']::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 3px;
        background: var(--track-bg, var(--hub-track));
      }
      input[type='range']::-moz-range-track {
        height: 6px;
        border-radius: 3px;
        background: var(--hub-track);
      }
      input[type='range']::-moz-range-progress {
        height: 6px;
        border-radius: 3px;
        background: var(--hub-teal);
      }
      input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        margin-top: -6px;
        border-radius: 50%;
        background: var(--hub-teal);
        border: none;
        box-shadow: 0 0 0 4px var(--hub-teal-bg);
      }
      input[type='range']::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--hub-teal);
        border: none;
        box-shadow: 0 0 0 4px var(--hub-teal-bg);
      }

      .chip {
        flex-shrink: 0;
        min-height: 48px;
        padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease, background 160ms ease,
          border-color 160ms ease, color 160ms ease;
      }
      .chip:active {
        transform: scale(0.95);
      }
      .chip.on {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }

      /* Unavailable speaker → quiet, non-interactive row. */
      .dead {
        color: var(--hub-text-dim);
        font: 500 12.5px var(--hub-font-body);
        margin-left: auto;
      }
    `],t([gt({attribute:!1})],Za.prototype,"player",void 0),t([gt({attribute:!1})],Za.prototype,"groupMaster",void 0),t([bt()],Za.prototype,"_drag",void 0),customElements.define("hub-volume-row",Za);const Ja=new Set(["off","unavailable","unknown","standby","idle"]);function Qa(t){const e=Number.isFinite(t)&&t>0?t:0,a=Math.floor(e/60),i=Math.floor(e%60);return`${a}:${String(i).padStart(2,"0")}`}class ti extends vt{constructor(){super(...arguments),this._sel=null,this._rgb=null,this._now=Date.now()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=Date.now()},1e3)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}get _players(){return this.config?.media_players??[]}_selId(){if(this._sel)return this._sel;const t=na(this.hass?.states??{},this._players);return t?.entity.entity_id??this._players[0]?.entity??null}_theme(){const t=this.getRootNode()?.host;return"dag"===t?.getAttribute("data-theme")?"dag":"natt"}updated(t){const e=this._selId(),a=e?this.hass?.states[e]?.attributes.entity_picture:void 0;a!==this._pic&&(this._pic=a,a?Ya(a).then(t=>{this._pic===a&&(this._rgb=t)}):this._rgb=null)}_transport(t,e){this.callService("media_player",t,void 0,e)}_hero(t,e){const a="playing"===t.state,i=t.attributes.media_title||e,s=t.attributes.media_artist||e,r=t.attributes.entity_picture,n="number"==typeof t.attributes.media_duration?t.attributes.media_duration:0,o=oa(t,this._now),l=o/100*n,h=t.entity_id;return U`
      <div class="hero">
        <div class="art" style=${r?`background-image:url('${r}')`:""}></div>
        <div class="meta">
          <div class="title">${i}</div>
          <div class="artist">${s}</div>
        </div>
        ${n>0?U`
              <div class="progress">
                <div class="bar"><div class="fill" style="width:${o}%"></div></div>
                <div class="times">
                  <span>${Qa(l)}</span>
                  <span>${Qa(n)}</span>
                </div>
              </div>
            `:q}
        <div class="transport">
          <button
            class="tbtn side"
            aria-label="Föregående"
            @click=${()=>this._transport("media_previous_track",h)}
          >
            ${Ot.prev}
          </button>
          <button
            class="tbtn play ${a?"on":""}"
            aria-label=${a?"Pausa":"Spela"}
            @click=${()=>this._transport("media_play_pause",h)}
          >
            ${a?Ot.pause:Ot.play}
          </button>
          <button
            class="tbtn side"
            aria-label="Nästa"
            @click=${()=>this._transport("media_next_track",h)}
          >
            ${Ot.next}
          </button>
        </div>
      </div>
    `}_quiet(){return U`
      <div class="quiet">
        <span class="qic">${Ot.note}</span>
        <span class="qtext">Ingenting spelas</span>
      </div>
    `}render(){if(!this.hass||!this.config)return U``;const t=this._players,e=this.hass.states,a=this._selId(),i=a?e[a]:void 0,s=t.find(t=>t.entity===a)?.name??"",r=!!i&&!Ja.has(i.state),n=function(t,e){for(const a of e)if("playing"===t[a.entity]?.state)return a.entity;return e[0]?.entity??null}(e,t),o=function(t,e){if(!t)return"none";const[a,i,s]=t;return`radial-gradient(80% 60% at 30% 20%, rgba(${a}, ${i}, ${s}, ${"natt"===e?"0.22":"0.12"}), transparent 70%)`}(this._rgb,this._theme());return U`
      <div class="page">
        <div class="bleed" style=${`background:${o}`}></div>
        <div class="content">
          ${t.length>1?U`
                <div class="tabs">
                  ${t.map(t=>U`
                      <button
                        class="tab ${t.entity===a?"on":""}"
                        @click=${()=>this._sel=t.entity}
                      >
                        ${t.name}
                      </button>
                    `)}
                </div>
              `:q}

          ${r?this._hero(i,s):this._quiet()}

          <div class="speakers ${r?"":"pushed"}">
            ${t.map(t=>U`
                <hub-volume-row
                  .hass=${this.hass}
                  .player=${t}
                  .groupMaster=${n}
                ></hub-volume-row>
              `)}
          </div>
        </div>
      </div>
    `}}ti.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        position: relative;
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
      }
      /* Ambient art bleed, painted behind everything. */
      .bleed {
        position: absolute;
        inset: 0;
        pointer-events: none;
        transition: background 900ms ease;
        z-index: 0;
      }
      .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }

      /* ── Speaker tabs ─────────────────────────────────────── */
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: 20px;
      }
      .tab {
        min-height: 48px;
        padding: 0 18px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
      }
      .tab.on {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal-text);
      }

      /* ── Hero: art + meta + transport ─────────────────────── */
      .hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 22px;
        margin-bottom: 28px;
      }
      .art {
        width: min(38vh, 340px);
        height: min(38vh, 340px);
        border-radius: 20px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #1b5a6e, #2f7d70);
        background-size: cover;
        background-position: center;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
      }
      .meta {
        max-width: 100%;
      }
      .title {
        font: 400 26px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
        line-height: 1.15;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .artist {
        margin-top: 6px;
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .progress {
        width: min(100%, 420px);
      }
      .bar {
        height: 5px;
        border-radius: 3px;
        background: var(--hub-track);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 3px;
        background: var(--hub-teal);
        transition: width 0.9s linear;
      }
      .times {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }

      .transport {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
      }
      .tbtn {
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        color: var(--hub-text-muted);
        -webkit-tap-highlight-color: transparent;
        transition: color var(--hub-fade) ease, transform 120ms ease;
      }
      .tbtn:active {
        transform: scale(0.9);
      }
      .tbtn.side {
        width: 48px;
        height: 48px;
      }
      .tbtn.side svg {
        width: 28px;
        height: 28px;
      }
      .tbtn.play {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text);
      }
      .tbtn.play.on {
        background: var(--hub-teal);
        border-color: var(--hub-teal);
        color: var(--hub-surface);
        box-shadow: 0 0 30px rgba(99, 214, 194, 0.25);
      }
      .tbtn.play svg {
        width: 28px;
        height: 28px;
      }

      /* ── Quiet / empty state ──────────────────────────────── */
      .quiet {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 14px;
        padding: 40px 0 44px;
      }
      .quiet .qic {
        width: 44px;
        height: 44px;
        color: var(--hub-text-dim);
      }
      .quiet .qic svg {
        width: 100%;
        height: 100%;
      }
      .quiet .qtext {
        font: 300 clamp(24px, 4vw, 34px) var(--hub-font-display);
        color: var(--hub-text-muted);
        letter-spacing: 0.01em;
      }

      /* ── Speaker volume list ──────────────────────────────── */
      .speakers {
        display: flex;
        flex-direction: column;
        gap: var(--hub-gap);
        padding-bottom: 56px; /* clear the page dots */
      }
      .speakers.pushed {
        margin-top: auto;
      }

      @media (max-width: 600px) {
        .hero {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `],t([gt({attribute:!1})],ti.prototype,"config",void 0),t([bt()],ti.prototype,"_sel",void 0),t([bt()],ti.prototype,"_rgb",void 0),t([bt()],ti.prototype,"_now",void 0),customElements.define("hub-media-page",ti);let ei=0;class ai extends ht{constructor(){super(...arguments),this.points=[],this.stroke="--hub-lavender",this.width=560,this.height=130,this._gid="hub-spark-"+ei++}render(){const t=function(t,e,a,i=.1){const s=t.length;if(0===s)return[];if(1===s)return[{x:e,y:a/2}];const r=t.map(t=>t.value),n=Math.min(...r),o=Math.max(...r)-n,l=n-o*i,h=o*(1+2*i);return t.map((t,i)=>({x:i/(s-1)*e,y:o<=0?a/2:a-(t.value-l)/h*a}))}(this.points,this.width,this.height);if(0===t.length)return U``;const e=t.map(t=>`${t.x.toFixed(2)},${t.y.toFixed(2)}`).join(" "),a=t[t.length-1],i=t[0],s=t.length>=2,r=`${e} ${a.x.toFixed(2)},${this.height} ${i.x.toFixed(2)},${this.height}`;return U`
      <div class="spark" style="--spark-stroke:var(${this.stroke})">
        ${G`
          <svg
            viewBox="0 0 ${this.width} ${this.height}"
            preserveAspectRatio="none"
            style="height:${this.height}px"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="${this._gid}" x1="0" y1="0" x2="0" y2="1">
                <stop class="grad-a" offset="0%"></stop>
                <stop class="grad-b" offset="100%"></stop>
              </linearGradient>
            </defs>
            ${s?G`<polygon points="${r}" fill="url(#${this._gid})" stroke="none"></polygon>
                       <polyline points="${e}" vector-effect="non-scaling-stroke"></polyline>`:q}
          </svg>
        `}
        <span
          class="dot"
          style="left:${(a.x/this.width*100).toFixed(3)}%;top:${(a.y/this.height*100).toFixed(3)}%"
        ></span>
      </div>
    `}}ai.styles=n`
    :host {
      display: block;
    }
    .spark {
      position: relative;
      width: 100%;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      overflow: visible;
    }
    polyline {
      fill: none;
      stroke: var(--spark-stroke, #b99cf2);
      stroke-width: 2.5px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .grad-a {
      stop-color: var(--spark-stroke, #b99cf2);
      stop-opacity: 0.24;
    }
    .grad-b {
      stop-color: var(--spark-stroke, #b99cf2);
      stop-opacity: 0;
    }
    .dot {
      position: absolute;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--spark-stroke, #b99cf2);
      transform: translate(-50%, -50%);
      pointer-events: none;
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--spark-stroke, #b99cf2) 16%, transparent);
    }
  `,t([gt({attribute:!1})],ai.prototype,"points",void 0),t([gt()],ai.prototype,"stroke",void 0),t([gt({type:Number})],ai.prototype,"width",void 0),t([gt({type:Number})],ai.prototype,"height",void 0),customElements.define("hub-sparkline",ai);const ii=new Intl.NumberFormat("sv-SE"),si=new Intl.NumberFormat("sv-SE",{minimumFractionDigits:1,maximumFractionDigits:1}),ri=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:1}),ni=new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short",timeZone:"UTC"}),oi=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});function li(t){if(!t)return"";const e=new Date(`${t}T00:00:00Z`);return Number.isNaN(e.getTime())?"":ni.format(e).replace(/\.$/,"")}class hi extends vt{_meals(t){const e=t.attributes.meals;return Array.isArray(e)?e.filter(t=>!!t&&"object"==typeof t).map(t=>({name:"string"==typeof t.name?t.name:"",kcal:"number"==typeof t.kcal?t.kcal:Number(t.kcal)||0})).filter(t=>t.name):[]}_num(t){return"number"==typeof t?t:NaN}_offline(){return U`
      <div class="page">
        <div class="offline">
          <div class="off-ring"></div>
          <div class="off-text">Kcal · offline</div>
        </div>
      </div>
    `}_weightCard(){const t=this.config.kcal?.forecast_entity,e=t?this.getEntity(t):void 0,a=e?Number(e.state):NaN;if(!e||"unavailable"===e.state||"unknown"===e.state||Number.isNaN(a))return U`
        <section class="card">
          <span class="w-eyebrow">Vikt</span>
          <div class="w-num-row"><span class="w-num">${"−"}</span><span class="w-unit">kg</span></div>
          <div class="spark-wrap"><span class="spark-empty">Ingen viktdata</span></div>
        </section>
      `;const i=e.attributes.weight_trend,s=Array.isArray(i)?i.filter(t=>!!t&&"object"==typeof t).map(t=>({date:String(t.date??""),value:Number(t.kg)})).filter(t=>Number.isFinite(t.value)):[],r=function(t){if(t.length<2)return null;const e=new Date(`${t[0].date}T00:00:00Z`).getTime(),a=new Date(`${t[t.length-1].date}T00:00:00Z`).getTime();return Number.isNaN(e)||Number.isNaN(a)?null:Math.round((a-e)/864e5)}(s),n=s.length>=2?s[s.length-1].value-s[0].value:null,o=null===n||null===r?null:`${n<0?"−":n>0?"+":""}${si.format(Math.abs(n))} kg på ${r} ${1===r?"dag":"dagar"}`,l=e.attributes.forecast,h=l&&"object"==typeof l?l:null,c=h?function(t){const e="number"==typeof t.goal_kg?`Mål ${ri.format(t.goal_kg)} kg`:"",a=t.eta?li(t.eta):"",i=t.eta_early&&t.eta_late?`${li(t.eta_early)}–${li(t.eta_late)}`:"";return[e,a?`ETA ${a}${i?` (${i})`:""}`:""].filter(Boolean).join(" · ")}(h):"",d=!!h?.on_track;return U`
      <section class="card">
        <span class="w-eyebrow">Vikt</span>
        <div class="w-num-row">
          <span class="w-num">${si.format(a)}</span>
          <span class="w-unit">kg</span>
        </div>
        ${o?U`<span class="w-delta">${o}</span>`:q}

        <div class="spark-wrap">
          ${s.length>=2?U`<hub-sparkline
                .points=${s}
                stroke="--hub-lavender"
                .width=${560}
                .height=${130}
              ></hub-sparkline>`:U`<span class="spark-empty">Samlar viktdata</span>`}
        </div>

        <div class="forecast">
          ${c?U`<span class="fc-line">${c}</span>`:U`<span class="fc-line">Ingen prognos ännu</span>`}
          ${d?U`<span class="fc-chip">i fas ✓</span>`:q}
        </div>
      </section>
    `}render(){if(!this.hass||!this.config)return U``;const t=this.config.kcal?.today_entity,e=t?this.getEntity(t):void 0,a=e?Number(e.state):NaN;if(!e||"unavailable"===e.state||"unknown"===e.state||Number.isNaN(a))return this._offline();const i=this._num(e.attributes.kcal_target),s=ca(a,i),r=Number.isFinite(i)&&i>0,n=r?i-a:NaN,o=r?n>0?`${ii.format(Math.round(n))} kcal kvar`:0===n?"Målet nått":`${ii.format(Math.round(-n))} över målet`:null,l=this._num(e.attributes.protein_g),h=this._num(e.attributes.protein_target_g),c=Number.isFinite(l)&&Number.isFinite(h)&&h>0,d=c?Math.max(0,Math.min(100,l/h*100)):0,p=this._meals(e),u=e.attributes.date,g="string"!=typeof u||Number.isNaN(new Date(`${u}T00:00:00Z`).getTime())?"":oi.format(new Date(`${u}T00:00:00Z`));return U`
      <div class="page">
        <div class="header">
          <h1 class="title">Kcal</h1>
          ${g?U`<span class="subtitle">${g}</span>`:q}
        </div>

        <div class="grid">
          <section class="card">
            <div class="ring-wrap">
              <div class="ring-glow"></div>
              <div class="ring" style="--pct:${s}"></div>
              <div class="ring-center">
                <span class="kc-num">${ii.format(Math.round(a))}</span>
                <span class="kc-target">
                  ${r?`/ ${ii.format(i)} kcal`:"kcal"}
                </span>
              </div>
            </div>
            ${o?U`<div class="kc-remain">${o}</div>`:q}

            ${c?U`
                  <div class="metric">
                    <div class="metric-head">
                      <span class="metric-label">Protein</span>
                      <span class="metric-val">
                        ${Math.round(l)} / ${Math.round(h)} g
                      </span>
                    </div>
                    <div class="bar"><div class="bar-fill" style="width:${d}%"></div></div>
                  </div>
                `:q}

            <div class="meals">
              <div class="meals-title">Idag</div>
              ${p.length?p.map(t=>U`
                      <div class="meal">
                        <span class="meal-name">${t.name}</span>
                        <span class="meal-kcal">${ii.format(Math.round(t.kcal))} kcal</span>
                      </div>
                    `):U`<div class="empty">Inga måltider loggade ännu</div>`}
            </div>
          </section>

          ${this._weightCard()}
        </div>
      </div>
    `}}hi.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }

      /* ── Header ────────────────────────────────────────────── */
      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .subtitle {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      /* Swedish keeps weekdays/months lowercase — only lift the leading letter. */
      .subtitle::first-letter {
        text-transform: uppercase;
      }

      /* ── Two-column deck ───────────────────────────────────── */
      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--hub-gap);
      }
      /* Stack only on genuinely narrow / portrait panels; landscape walls keep
         both columns side by side and fit without vertical scroll. */
      @media (max-width: 760px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .card {
        box-sizing: border-box;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: clamp(20px, 2.6vw, 34px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
      }

      /* ── Left: kcal ring + protein + meals ─────────────────── */
      .ring-wrap {
        position: relative;
        width: clamp(176px, 23vh, 236px);
        aspect-ratio: 1;
        margin: 2px auto 0;
        flex-shrink: 0;
      }
      .ring-glow {
        position: absolute;
        inset: -6%;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          color-mix(in srgb, var(--hub-lavender) 20%, transparent),
          transparent 68%
        );
        filter: blur(10px);
      }
      .ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: conic-gradient(
          var(--hub-lavender) calc(var(--pct, 0) * 1%),
          var(--hub-track) 0
        );
        -webkit-mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        transition: --pct var(--hub-fade) ease;
      }
      .ring-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .kc-num {
        font: 200 clamp(42px, 6vw, 62px) / 1 var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .kc-target {
        margin-top: 4px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-lavender-muted);
        font-variant-numeric: tabular-nums;
      }
      .kc-remain {
        margin: 12px auto 0;
        text-align: center;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }

      .metric {
        margin-top: clamp(18px, 2.6vh, 30px);
        flex-shrink: 0;
      }
      .metric-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 8px;
      }
      .metric-label {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-muted);
      }
      .metric-val {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .bar {
        height: 8px;
        border-radius: 99px;
        background: var(--hub-track);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 99px;
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--hub-lavender) 62%, transparent),
          var(--hub-lavender)
        );
        transition: width var(--hub-fade) ease;
      }

      .meals {
        margin-top: clamp(16px, 2.4vh, 26px);
        min-height: 0;
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .meals-title {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 6px;
      }
      .meal {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 14px;
        padding: 8px 0;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
      }
      .meal:first-of-type {
        border-top: none;
      }
      .meal-name {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meal-kcal {
        flex-shrink: 0;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .empty {
        padding: 10px 0;
        font: 400 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Right: weight ─────────────────────────────────────── */
      .w-eyebrow {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .w-num-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-top: 8px;
      }
      .w-num {
        font: 200 clamp(58px, 8.4vw, 88px) / 1 var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .w-unit {
        font: 500 18px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .w-delta {
        margin-top: 10px;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-lavender-text);
        font-variant-numeric: tabular-nums;
      }
      .spark-wrap {
        flex: 1;
        min-height: 96px;
        margin: clamp(18px, 3vh, 34px) 0;
        display: flex;
        align-items: center;
      }
      .spark-empty {
        width: 100%;
        text-align: center;
        font: 400 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .forecast {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .fc-line {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .fc-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 12px;
        border-radius: 99px;
        font: 600 13px var(--hub-font-body);
        background: var(--hub-green-bg);
        color: var(--hub-green);
        border: 1px solid var(--hub-green-border);
        white-space: nowrap;
      }

      /* ── Offline ───────────────────────────────────────────── */
      .offline {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }
      .off-ring {
        width: clamp(156px, 21vh, 208px);
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--hub-track);
        -webkit-mask: radial-gradient(circle, transparent 67%, #000 67.5%);
        mask: radial-gradient(circle, transparent 67%, #000 67.5%);
      }
      .off-text {
        font: 300 clamp(26px, 4vw, 38px) var(--hub-font-display);
        color: var(--hub-text-muted);
        letter-spacing: 0.01em;
      }
    `],t([gt({attribute:!1})],hi.prototype,"config",void 0),customElements.define("hub-kcal-page",hi);const ci=new Intl.NumberFormat("sv-SE"),di=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});class pi extends vt{constructor(){super(...arguments),this._openDate=null,this._confirming=!1}_model(){const t=this.config?.kcal?.planner_entity;if(!t)return null;const e=this.getEntity(t);return e&&"unavailable"!==e.state&&"unknown"!==e.state?fa(e.attributes):null}_confirm(t){this._confirming||t.confirmed||0===t.meals.length||(this._confirming=!0,this.callService("rest_command","kcal_confirm_day",{date:t.date}),window.setTimeout(()=>{const t=this.config?.kcal?.planner_entity;t&&this.callService("homeassistant","update_entity",void 0,t),this._confirming=!1,this._openDate=null},1500))}_dayPopup(t){const e=t.days.find(t=>t.date===this._openDate);if(!e)return q;const a=di.format(new Date(`${e.date}T00:00:00Z`)),i=!e.confirmed&&e.meals.some(t=>!t.logged);return U`
      <div class="scrim" @click=${()=>this._openDate=null}>
        <div class="popup" @click=${t=>t.stopPropagation()}>
          <h2 class="popup-title">${a}</h2>
          <div class="popup-sub">
            ${e.day_type} · ${ci.format(e.total_kcal)} / ${ci.format(e.target_kcal)} kcal
            ${e.confirmed?" · bekräftad ✓":""}
          </div>
          ${e.meals.map(t=>U`
              <div class="pm">
                <div>
                  <span class="pm-slot">${pa[t.slot]}${t.logged?" · loggad":""}</span>
                  <span class="pm-name">${t.name}</span>
                </div>
                <span class="pm-macro">
                  ${ci.format(t.kcal)} kcal<br />
                  P ${ci.format(t.protein)} · F ${ci.format(t.fat)} · K ${ci.format(t.carbs)}
                </span>
              </div>
            `)}
          ${0===e.meals.length?U`<div class="empty-day">Inget planerat.</div>`:q}
          <div class="popup-actions">
            ${e.confirmed?U`<span class="confirmed-note">Dagen är låst ✓</span>`:q}
            <button class="btn" @click=${()=>this._openDate=null}>Stäng</button>
            ${i?U`
                  <button class="btn primary" ?disabled=${this._confirming} @click=${()=>this._confirm(e)}>
                    ${this._confirming?"Bekräftar…":"Bekräfta dagen"}
                  </button>
                `:q}
          </div>
        </div>
      </div>
    `}_dayCard(t,e){const a=ua.filter(e=>t.meals.some(t=>t.slot===e));return U`
      <button
        class="day${t.date===e?" today":""}${t.confirmed?" confirmed":""}"
        @click=${()=>this._openDate=t.date}
      >
        <div class="day-head">
          <span class="day-name">${t.weekday.slice(0,3)}</span>
          <span class="day-date">${t.date.slice(8)}</span>
          <span class="day-flex"></span>
          ${t.confirmed?U`<span class="lock">✓</span>`:q}
          <span class="type-chip ${t.day_type}">${i=t.day_type,ga[i]??"·"}</span>
        </div>
        <div class="slots">
          ${0===a.length?U`<span class="empty-day">—</span>`:q}
          ${a.map(e=>U`
              <div>
                <span class="slot-label">${pa[e]}</span>
                ${t.meals.filter(t=>t.slot===e).map(t=>U`
                      <div class="meal">
                        <span class="meal-name${t.logged?" logged":""}">${t.name}</span>
                        <span class="meal-kcal">${ci.format(t.kcal)} kcal</span>
                      </div>
                    `)}
              </div>
            `)}
        </div>
        <div class="day-foot">
          ${t.meals.length>0?U`${ci.format(t.total_kcal)} / ${ci.format(t.target_kcal)}
              ${t.kcal_ok&&t.protein_ok?q:U`<span class="warn"> ⚠</span>`}`:U`&nbsp;`}
        </div>
      </button>
    `;var i}render(){if(!this.hass||!this.config)return U``;const t=this._model();return t?U`
      <div class="page">
        <div class="header">
          <h1 class="title">Vecka</h1>
          <span class="subtitle">${t.confirmedDays} / 7 bekräftade</span>
        </div>
        <div class="grid">${t.days.map(e=>this._dayCard(e,t.today))}</div>
      </div>
      ${this._openDate?this._dayPopup(t):q}
    `:U`<div class="page"><div class="offline">Vecka · offline</div></div>`}}pi.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
        position: relative; /* containing block for the day-popup overlay */
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }

      .header {
        padding-right: 56px;
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .subtitle {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Week grid ─────────────────────────────────────────── */
      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: clamp(8px, 1vw, 14px);
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 600px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .day {
        box-sizing: border-box;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: clamp(10px, 1.2vw, 16px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-lavender-bg);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        text-align: left;
        font: inherit;
        color: inherit;
      }
      .day.today {
        border-color: var(--hub-lavender);
      }
      .day.confirmed {
        opacity: 0.78;
      }

      .day-head {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-bottom: 8px;
      }
      .day-name {
        font: 600 13px var(--hub-font-body);
        color: var(--hub-text);
        text-transform: capitalize;
      }
      .day-date {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .day-flex {
        flex: 1;
      }
      .type-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        font: 600 11px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
        flex-shrink: 0;
      }
      .type-chip.gymdag {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .type-chip.flexdag {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
        color: var(--hub-teal);
      }
      .lock {
        font: 600 12px var(--hub-font-body);
        color: var(--hub-green);
      }

      .slots {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .slot-label {
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .meal {
        display: flex;
        flex-direction: column;
        margin-top: 2px;
      }
      .meal-name {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meal-name.logged {
        color: var(--hub-text-dim);
      }
      .meal-kcal {
        font: 500 11px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .empty-day {
        font: 400 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      .day-foot {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .day-foot .warn {
        color: var(--hub-coral);
      }

      /* ── Day popup ─────────────────────────────────────────── */
      /* Absolute, not fixed: the swipe strip's translateX makes it the
         containing block for fixed elements, which would center the popup
         across the whole strip instead of the visible page. */
      .scrim {
        position: absolute;
        inset: 0;
        background: color-mix(in srgb, var(--hub-surface) 62%, transparent);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .popup {
        box-sizing: border-box;
        width: min(560px, 94vw);
        max-height: 86vh;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: clamp(20px, 3vw, 32px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-lavender-border);
        box-shadow: var(--hub-shadow);
      }
      .popup-title {
        margin: 0 0 4px;
        font: 300 clamp(24px, 3.4vw, 32px) var(--hub-font-display);
        color: var(--hub-text);
      }
      .popup-title::first-letter {
        text-transform: uppercase;
      }
      .popup-sub {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        margin-bottom: 14px;
      }
      .pm {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        padding: 9px 0;
        border-top: 1px solid color-mix(in srgb, var(--hub-lavender-border) 55%, transparent);
      }
      .pm-name {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text);
      }
      .pm-slot {
        font: 600 10px var(--hub-font-body);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        display: block;
      }
      .pm-macro {
        flex-shrink: 0;
        text-align: right;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .popup-actions {
        margin-top: 18px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .btn {
        font: 600 14px var(--hub-font-body);
        padding: 12px 22px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .btn.primary {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
        color: var(--hub-lavender-text);
      }
      .btn:disabled {
        opacity: 0.5;
      }
      .confirmed-note {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-green);
        align-self: center;
        margin-right: auto;
      }

      /* ── Offline ───────────────────────────────────────────── */
      .offline {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font: 300 clamp(26px, 4vw, 38px) var(--hub-font-display);
        color: var(--hub-text-muted);
      }
    `],t([gt({attribute:!1})],pi.prototype,"config",void 0),t([bt()],pi.prototype,"_openDate",void 0),t([bt()],pi.prototype,"_confirming",void 0),customElements.define("hub-planner-page",pi);const ui=n`
  /* Padding is height-aware as well as width-aware: a 2×2 deck has to fit a
     landscape wall panel without scrolling, and vertical padding is the first
     thing that should give on a short viewport. */
  .card {
    box-sizing: border-box;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: clamp(14px, 2vh, 26px) clamp(18px, 2.2vw, 30px);
    border-radius: var(--hub-radius-lg);
    background: var(--hub-lavender-bg);
    border: 1px solid var(--hub-lavender-border);
    box-shadow: var(--hub-shadow);
  }

  .eyebrow {
    font: 600 12px var(--hub-font-body);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--hub-text-dim);
  }

  /* Headline value. Light display weight at large size is what makes the panel
     read as calm rather than as a dashboard. */
  .value-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-top: 6px;
    flex-wrap: wrap;
  }
  .value {
    font: 200 clamp(34px, min(5.2vw, 6.4vh), 58px) / 1 var(--hub-font-display);
    letter-spacing: -0.03em;
    color: var(--hub-text);
    font-variant-numeric: tabular-nums;
  }
  .unit {
    font: 500 15px var(--hub-font-body);
    color: var(--hub-text-muted);
  }

  /* Score pill, tinted by band. */
  .score {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    padding: 5px 11px;
    border-radius: var(--hub-radius-pill);
    font: 600 15px var(--hub-font-body);
    font-variant-numeric: tabular-nums;
    background: var(--hub-chip-bg);
    border: 1px solid var(--hub-chip-border);
    color: var(--hub-text-muted);
  }
  .score.tone-green {
    background: var(--hub-green-bg);
    border-color: var(--hub-green-border);
    color: var(--hub-green);
  }
  .score.tone-amber {
    background: var(--hub-amber-bg);
    border-color: var(--hub-amber-border);
    color: var(--hub-amber-text);
  }
  .score.tone-coral {
    background: var(--hub-coral-bg);
    border-color: var(--hub-coral-border);
    color: var(--hub-coral);
  }
  .score-label {
    font: 500 11px var(--hub-font-body);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  /* Secondary facts: paired label/value, dot-separated on one line. */
  .facts {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
    font: 500 13.5px var(--hub-font-body);
    color: var(--hub-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .facts .sep {
    color: var(--hub-text-dim);
  }
  .facts b {
    font-weight: 600;
    color: var(--hub-lavender-text);
  }

  /* Trend area. Pushed to the bottom so all four cards align on their
     sparkline baseline regardless of how much text sits above it. */
  .trend {
    margin-top: auto;
    padding-top: clamp(10px, 1.6vh, 20px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .trend-foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-top: 6px;
    font: 500 11.5px var(--hub-font-body);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--hub-text-dim);
  }
  /* Seeded from 70 days of history, so this should be rare — but a fresh
     install, a failed seed, or a metric Oura has not established a baseline for
     all land here, and an empty card must still look deliberate. */
  .trend-empty {
    font: 400 13.5px var(--hub-font-body);
    color: var(--hub-text-dim);
    text-align: center;
    padding: 18px 0;
  }
  .dash {
    color: var(--hub-text-dim);
  }
`,gi=new Intl.DateTimeFormat("sv-SE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Stockholm"});function bi(t){if(!t)return"";const e=Date.parse(t);return Number.isNaN(e)?"":gi.format(new Date(e))}class mi extends vt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-health-open",{detail:{section:"sleep"},bubbles:!0,composed:!0}))}}_num(t){return t?Ht(this.getState(t)):null}render(){const t=this.config?.health?.oura??{},e=this._num(t.sleep_duration_entity),a=this._num(t.sleep_score_entity),i=Bt(a),s=null===e?null:Math.round(60*e),r=function(t){const e=t.reduce((t,e)=>t+e.hours,0);return e<=0?[]:t.map(t=>({...t,pct:t.hours/e*100}))}([{key:"deep",label:"Djup",hours:this._num(t.deep_entity)??0},{key:"rem",label:"REM",hours:this._num(t.rem_entity)??0},{key:"light",label:"Lätt",hours:this._num(t.light_entity)??0}].filter(t=>t.hours>0)),n=bi(t.bedtime_start_entity?this.getState(t.bedtime_start_entity):void 0),o=bi(t.bedtime_end_entity?this.getState(t.bedtime_end_entity):void 0),l=this._num(t.efficiency_entity),h=Vt(this.config?.health?.history_entity?this.getEntityAttribute(this.config.health.history_entity,"days"):void 0,"sleep_score");return U`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">Sömn</span>
        <div class="value-row">
          <span class="value">${Rt(s)}</span>
          ${null===a?q:U`<span class="score tone-${i}"
                ><span class="score-label">poäng</span>${Math.round(a)}</span
              >`}
        </div>

        <div class="facts">
          ${n&&o?U`<span>${n}&thinsp;–&thinsp;${o}</span>`:U`<span class="dash">Ingen sömndata</span>`}
          ${null===l?q:U`<span class="sep">·</span><span>Effektivitet <b>${Math.round(l)} %</b></span>`}
        </div>

        ${r.length>0?U`
              <div class="stages">
                <div class="rail">
                  ${r.map(t=>U`<div class="seg seg-${t.key}" style="width:${t.pct.toFixed(2)}%"></div>`)}
                </div>
                <div class="legend">
                  ${r.map(t=>U`<span
                      ><i class="swatch sw-${t.key}"></i>${t.label}
                      ${Rt(Math.round(60*t.hours))}</span
                    >`)}
                </div>
              </div>
            `:q}

        <div class="trend">
          ${h.length>=2?U`
                <hub-sparkline
                  .points=${h}
                  stroke=${"neutral"===i?"--hub-lavender":`--hub-${i}`}
                  .height=${52}
                ></hub-sparkline>
                <div class="trend-foot">
                  <span>Sömnpoäng ${h.length} dagar</span>
                  <span>${Math.round(h[h.length-1].value)}</span>
                </div>
              `:U`<span class="trend-empty">Samlar sömnhistorik</span>`}
        </div>
      </div>
    `}}mi.styles=[Tt,ui,n`
      :host {
        display: block;
        min-height: 0;
      }
      .card {
        height: 100%;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease;
      }
      /* Press feedback only — no hover lift: this is a wall panel, and a
         hover state that never fires on glass is dead code. */
      .card:active {
        transform: scale(0.995);
      }

      /* Stage bar: deep / rem / light as one continuous rail. Rounded ends on
         the rail rather than per-segment so it reads as a single night. */
      .stages {
        margin-top: clamp(10px, 1.6vh, 16px);
      }
      .rail {
        display: flex;
        height: 9px;
        border-radius: var(--hub-radius-pill);
        overflow: hidden;
        background: var(--hub-track);
      }
      .seg {
        height: 100%;
        /* Values shift once a night; animating avoids a jarring snap when the
           morning sync lands while the panel is being looked at. */
        transition: width var(--hub-fade) ease;
      }
      .seg-deep {
        background: var(--hub-lavender);
      }
      .seg-rem {
        background: color-mix(in srgb, var(--hub-lavender) 62%, transparent);
      }
      .seg-light {
        background: color-mix(in srgb, var(--hub-lavender) 28%, transparent);
      }
      .legend {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 10px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .swatch {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .sw-deep {
        background: var(--hub-lavender);
      }
      .sw-rem {
        background: color-mix(in srgb, var(--hub-lavender) 62%, transparent);
      }
      .sw-light {
        background: color-mix(in srgb, var(--hub-lavender) 28%, transparent);
      }
    `],t([gt({attribute:!1})],mi.prototype,"config",void 0),customElements.define("hub-sleep-card",mi);const vi=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:1});class fi extends vt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-health-open",{detail:{section:"readiness"},bubbles:!0,composed:!0}))}}_num(t){return t?Ht(this.getState(t)):null}render(){const t=this.config?.health?.oura??{},e=this._num(t.readiness_score_entity),a=Bt(e),i=this._num(t.hrv_entity),s=this._num(t.resting_hr_entity),r=this._num(t.temp_deviation_entity),n=Vt(this.config?.health?.history_entity?this.getEntityAttribute(this.config.health.history_entity,"days"):void 0,"readiness_score"),o=function(t,e){if(null===t||null===e)return"";const a=t-e;return Math.abs(a)<1?"som snittet":`${a>0?"+":"−"}${vi.format(Math.abs(a))} mot snittet`}(e,0===(l=n).length?null:l.reduce((t,e)=>t+e.value,0)/l.length);var l;return U`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">Beredskap</span>
        <div class="value-row">
          ${null===e?U`<span class="value dash">—</span>`:U`<span class="value">${Math.round(e)}</span>
                <span class="score tone-${a}">${"green"===a?"Optimal":"amber"===a?"Bra":"Ta det lugnt"}</span>`}
        </div>
        ${o?U`<div class="baseline">${o}</div>`:q}

        <div class="rows">
          <div class="row">
            <span>HRV under sömn</span>
            <b>${null===i?U`<span class="dash">—</span>`:`${Math.round(i)} ms`}</b>
          </div>
          <div class="row">
            <span>Vilopuls</span>
            <b>
              ${null===s?U`<span class="dash">—</span>`:`${Math.round(s)} slag/min`}
            </b>
          </div>
          <div class="row">
            <span>Kroppstemperatur</span>
            <b>
              ${null===r?U`<span class="dash">—</span>`:`${r>0?"+":r<0?"−":""}${vi.format(Math.abs(r))} °C`}
            </b>
          </div>
        </div>

        <div class="trend">
          ${n.length>=2?U`
                <hub-sparkline
                  .points=${n}
                  stroke=${"neutral"===a?"--hub-lavender":`--hub-${a}`}
                  .height=${52}
                ></hub-sparkline>
                <div class="trend-foot">
                  <span>Beredskap ${n.length} dagar</span>
                  <span>${Math.round(n[n.length-1].value)}</span>
                </div>
              `:U`<span class="trend-empty">Samlar beredskapshistorik</span>`}
        </div>
      </div>
    `}}fi.styles=[Tt,ui,n`
      :host {
        display: block;
        min-height: 0;
      }
      .card {
        height: 100%;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease;
      }
      /* Press feedback only — no hover lift: this is a wall panel, and a
         hover state that never fires on glass is dead code. */
      .card:active {
        transform: scale(0.995);
      }
      /* Contributor rows: the three numbers that explain the score. Laid out as
         a label/value pair per row so the values form a readable column. */
      .rows {
        margin-top: clamp(10px, 1.6vh, 16px);
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .row b {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .baseline {
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        margin-top: 8px;
      }
    `],t([gt({attribute:!1})],fi.prototype,"config",void 0),customElements.define("hub-readiness-card",fi);const xi=new Intl.NumberFormat("sv-SE",{minimumFractionDigits:1,maximumFractionDigits:1}),yi=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:1}),_i=new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short",timeZone:"UTC"});class wi extends vt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-health-open",{detail:{section:"body"},bubbles:!0,composed:!0}))}}_num(t){return t?Ht(this.getState(t)):null}render(){const t=this.config?.health?.withings??{},e=this.config?.kcal?.forecast_entity,a=this._num(t.fat_pct_entity),i=this._num(t.muscle_entity),s=(e?Ht(String(this.getEntityAttribute(e,"current_kg")??"")):null)??(e?Ht(this.getState(e)):null)??this._num(t.weight_entity),r=function(t){if(!Array.isArray(t))return[];const e=[];for(const a of t){if("object"!=typeof a||null===a)continue;const{date:t,kg:i}=a;"string"==typeof t&&"number"==typeof i&&Number.isFinite(i)&&e.push({date:t,value:i})}return e}(e?this.getEntityAttribute(e,"weight_trend"):void 0),n=this.config?.kcal?.today_entity,o=e?this.getEntityAttribute(e,"latest_weight_date")??null:null,l=(n?this.getEntityAttribute(n,"date"):"")??"",h=null===a?null:100-a;return U`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">Kropp</span>
        <div class="value-row">
          ${null===s?U`<span class="value dash">—</span>`:U`<span class="value">${xi.format(s)}</span><span class="unit">kg</span>`}
        </div>

        <div class="facts">
          <span>${function(t,e){if(!t)return"aldrig vägd";if(t===e)return"vägd i dag";const a=new Date(`${t}T00:00:00Z`);return Number.isNaN(a.getTime())?"":`vägd ${_i.format(a).replace(/\.$/,"")}`}(o,l)}</span>
          ${null===i?q:U`<span class="sep">·</span><span>Muskler <b>${xi.format(i)} kg</b></span>`}
        </div>

        ${null===a?q:U`
              <div class="comp">
                <div class="rail">
                  <div class="seg-fat" style="width:${a.toFixed(2)}%"></div>
                  <div class="seg-lean" style="width:${(h??0).toFixed(2)}%"></div>
                </div>
                <div class="legend">
                  <span><i class="swatch sw-fat"></i>Fett ${yi.format(a)} %</span>
                  <span><i class="swatch sw-lean"></i>Fettfritt ${yi.format(h??0)} %</span>
                </div>
              </div>
            `}

        <div class="trend">
          ${r.length>=2?U`
                <hub-sparkline .points=${r} stroke="--hub-lavender" .height=${52}></hub-sparkline>
                <div class="trend-foot">
                  <span>Trendkurva ${r.length} vägningar</span>
                  ${(()=>{const t=(e=r).length<2?null:e[e.length-1].value-e[0].value;var e;return null===t?q:U`<span
                      >${t<0?"−":"+"}${xi.format(Math.abs(t))} kg</span
                    >`})()}
                </div>
              `:U`<span class="trend-empty">Samlar viktdata</span>`}
        </div>
      </div>
    `}}wi.styles=[Tt,ui,n`
      :host {
        display: block;
        min-height: 0;
      }
      .card {
        height: 100%;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease;
      }
      /* Press feedback only — no hover lift: this is a wall panel, and a
         hover state that never fires on glass is dead code. */
      .card:active {
        transform: scale(0.995);
      }
      /* Composition split: fat vs everything else, as one rail. Muscle is not
         shown as a third segment because Withings' fat + muscle + bone do not
         sum to body mass, and a bar with a gap invites the wrong question. */
      .comp {
        margin-top: clamp(10px, 1.6vh, 16px);
      }
      .rail {
        display: flex;
        height: 9px;
        border-radius: var(--hub-radius-pill);
        overflow: hidden;
        background: var(--hub-track);
      }
      .seg-fat {
        height: 100%;
        background: var(--hub-amber);
        transition: width var(--hub-fade) ease;
      }
      .seg-lean {
        height: 100%;
        background: color-mix(in srgb, var(--hub-lavender) 55%, transparent);
        transition: width var(--hub-fade) ease;
      }
      .legend {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 10px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .swatch {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .sw-fat {
        background: var(--hub-amber);
      }
      .sw-lean {
        background: color-mix(in srgb, var(--hub-lavender) 55%, transparent);
      }
    `],t([gt({attribute:!1})],wi.prototype,"config",void 0),customElements.define("hub-body-card",wi);const ki=new Intl.NumberFormat("sv-SE"),$i={walking:"Promenad",walk:"Promenad",running:"Löpning",run:"Löpning",cycling:"Cykling",bike:"Cykling",strength_training:"Styrketräning",weights:"Styrketräning",swimming:"Simning",hiking:"Vandring"};class Ei extends vt{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-health-open",{detail:{section:"activity"},bubbles:!0,composed:!0}))}}_num(t){return t?Ht(this.getState(t)):null}_workouts(){const t=this.config?.health?.oura??{},e=this.config?.health?.withings??{},a=t.workout_type_entity?this.getState(t.workout_type_entity):void 0,i=t.workout_at_entity?this.getState(t.workout_at_entity):void 0,s=e.workout_type_entity?this.getState(e.workout_type_entity):void 0;return function(t,e){const a=t=>{if(!t)return Number.NEGATIVE_INFINITY;const e=Date.parse(t.at);return Number.isNaN(e)?Number.NEGATIVE_INFINITY:e},i=a(t),s=a(e);return i===Number.NEGATIVE_INFINITY&&s===Number.NEGATIVE_INFINITY?t??e??null:i>=s?t:e}(a&&"unavailable"!==a&&"unknown"!==a?{source:"Oura",type:a,kcal:this._num(t.workout_kcal_entity),minutes:this._num(t.workout_duration_entity),at:i??""}:null,s&&"unavailable"!==s&&"unknown"!==s?{source:"Withings",type:s,kcal:this._num(e.workout_kcal_entity),minutes:this._num(e.workout_duration_entity),at:""}:null)}render(){const t=this.config?.health?.oura??{},e=this._num(t.steps_entity),a=this._num(t.active_kcal_entity),i=this._num(t.target_kcal_entity),s=this._num(t.total_kcal_entity),r=(o=i,null===(n=a)||null===o||o<=0?null:Math.max(0,Math.min(100,n/o*100)));var n,o;const l=this._workouts(),h=Vt(this.config?.health?.history_entity?this.getEntityAttribute(this.config.health.history_entity,"days"):void 0,"oura_steps");return U`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">Aktivitet</span>
        <div class="value-row">
          ${null===e?U`<span class="value dash">—</span>`:U`<span class="value">${ki.format(Math.round(e))}</span>
                <span class="unit">steg</span>`}
        </div>

        <div class="facts">
          ${null===s?U`<span class="dash">Ingen förbrukning</span>`:U`<span>Totalt <b>${ki.format(Math.round(s))} kcal</b></span>`}
        </div>

        ${null===r?q:U`
              <div class="goal">
                <div class="goal-head">
                  <span>Aktiva kalorier</span>
                  <span
                    >${ki.format(Math.round(a??0))} /
                    ${ki.format(Math.round(i??0))} kcal</span
                  >
                </div>
                <div class="rail">
                  <div class="fill ${r>=100?"reached":""}" style="width:${r.toFixed(2)}%"></div>
                </div>
              </div>
            `}

        ${l?U`
              <div class="workout">
                <span class="who">${l.source}</span>
                <span>${c=l.type,c?$i[c.toLowerCase()]??c.replace(/_/g," "):"Träning"}</span>
                ${null===l.minutes?q:U`<span class="sep">·</span><span>${Math.round(l.minutes)} min</span>`}
                ${null===l.kcal?q:U`<span class="sep">·</span
                      ><span>${ki.format(Math.round(l.kcal))} kcal</span>`}
              </div>
            `:q}

        <div class="trend">
          ${h.length>=2?U`
                <hub-sparkline .points=${h} stroke="--hub-lavender" .height=${52}></hub-sparkline>
                <div class="trend-foot">
                  <span>Steg ${h.length} dagar</span>
                  <span>${ki.format(Math.round(h[h.length-1].value))}</span>
                </div>
              `:U`<span class="trend-empty">Samlar aktivitetshistorik</span>`}
        </div>
      </div>
    `;var c}}Ei.styles=[Tt,ui,n`
      :host {
        display: block;
        min-height: 0;
      }
      .card {
        height: 100%;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease;
      }
      /* Press feedback only — no hover lift: this is a wall panel, and a
         hover state that never fires on glass is dead code. */
      .card:active {
        transform: scale(0.995);
      }
      .goal {
        margin-top: clamp(10px, 1.6vh, 16px);
      }
      .goal-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
        margin-bottom: 8px;
      }
      .rail {
        height: 9px;
        border-radius: var(--hub-radius-pill);
        background: var(--hub-track);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: var(--hub-radius-pill);
        background: var(--hub-lavender);
        transition: width var(--hub-fade) ease;
      }
      .fill.reached {
        background: var(--hub-green);
      }
      .workout {
        margin-top: 14px;
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        font-variant-numeric: tabular-nums;
      }
      .workout .who {
        font: 600 10.5px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        padding: 3px 7px;
        border-radius: var(--hub-radius-pill);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
      }
    `],t([gt({attribute:!1})],Ei.prototype,"config",void 0),customElements.define("hub-activity-card",Ei);const Si=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long",timeZone:"Europe/Stockholm"});class Ci extends vt{render(){if(!this.hass||!this.config)return U``;const t=this.config,e=Ht(t.health?.oura?.battery_entity?this.getState(t.health.oura.battery_entity):void 0);return U`
      <div class="page">
        <div class="header">
          <h1 class="title">Hälsa</h1>
          <span class="subtitle">${Si.format(new Date)}</span>
          ${null===e?U``:U`<span class="ring-battery ${e<=20?"low":""}"
                >Ring ${Math.round(e)} %</span
              >`}
        </div>

        <div class="grid">
          <hub-sleep-card .hass=${this.hass} .config=${t}></hub-sleep-card>
          <hub-readiness-card .hass=${this.hass} .config=${t}></hub-readiness-card>
          <hub-body-card .hass=${this.hass} .config=${t}></hub-body-card>
          <hub-activity-card .hass=${this.hass} .config=${t}></hub-activity-card>
        </div>
      </div>
    `}}Ci.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }

      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .subtitle {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      /* Swedish keeps weekdays and months lowercase — lift only the first letter. */
      .subtitle::first-letter {
        text-transform: uppercase;
      }
      .ring-battery {
        margin-left: auto;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .ring-battery.low {
        color: var(--hub-coral);
      }

      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 1fr;
        gap: var(--hub-gap);
      }
      /* Stack only on genuinely narrow / portrait panels; a landscape wall keeps
         the 2×2 and fits without vertical scroll. */
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
          grid-auto-rows: auto;
        }
      }
    `],t([gt({attribute:!1})],Ci.prototype,"config",void 0),customElements.define("hub-health-page",Ci);class Mi extends ht{constructor(){super(...arguments),this._open=()=>{this.dispatchEvent(new CustomEvent("hub-system-open",{detail:{section:this.model?.section},bubbles:!0,composed:!0}))}}render(){const t=this.model;return t?U`
      <div class="card" role="button" tabindex="0" @click=${this._open}>
        <span class="eyebrow">${t.eyebrow}</span>
        <div class="value-row">
          <span class="value ${"–"===t.value?"dash":""}">${t.value}</span>
          ${t.unit&&"–"!==t.value?U`<span class="unit">${t.unit}</span>`:q}
          ${t.pill?U`<span class="pill tone-${t.pill.tone}">${t.pill.label}</span>`:q}
        </div>
        ${t.bar?U`<div class="bar">
              <div class="bar-track">
                <div
                  class="bar-fill tone-${t.bar.tone}"
                  style="width:${Math.max(0,Math.min(100,t.bar.pct))}%"
                ></div>
              </div>
              <div class="bar-label">${t.bar.label}</div>
            </div>`:q}
        <div class="rows">
          ${t.rows.map(t=>U`<div class="row">
              <span>${t.key}</span>
              <b class=${t.tone&&"green"!==t.tone&&"neutral"!==t.tone?`tone-${t.tone}`:""}>${t.value}</b>
            </div>`)}
        </div>
      </div>
    `:U``}}Mi.styles=[Tt,n`
      :host {
        display: block;
        min-height: 0;
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: clamp(14px, 2vh, 26px) clamp(18px, 2.2vw, 30px);
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease;
      }
      .card:active {
        transform: scale(0.995);
      }
      .eyebrow {
        font: 600 12px var(--hub-font-body);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .value-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-top: 6px;
        flex-wrap: wrap;
      }
      .value {
        font: 200 clamp(34px, min(5.2vw, 6.4vh), 58px) / 1 var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .value.dash {
        color: var(--hub-text-dim);
      }
      .unit {
        font: 500 15px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .pill {
        display: inline-flex;
        align-items: baseline;
        padding: 5px 11px;
        border-radius: var(--hub-radius-pill);
        font: 600 13px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
      }
      .tone-green {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .tone-amber {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
      .tone-coral {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }

      .bar {
        margin-top: clamp(10px, 1.6vh, 16px);
      }
      .bar-track {
        height: 6px;
        border-radius: 3px;
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 3px;
        background: var(--hub-text-muted);
        transition: width 400ms ease;
      }
      .bar-fill.tone-green {
        background: var(--hub-green);
      }
      .bar-fill.tone-amber {
        background: var(--hub-amber);
      }
      .bar-fill.tone-coral {
        background: var(--hub-coral);
      }
      .bar-label {
        margin-top: 6px;
        font: 500 11.5px var(--hub-font-body);
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }

      .rows {
        margin-top: auto;
        padding-top: clamp(10px, 1.6vh, 16px);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .row b {
        font: 600 14.5px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      /* Row values only take a semantic colour when the tone is not green:
         a card full of green numbers is noise, one amber number is a signal. */
      .row b.tone-amber {
        color: var(--hub-amber-text);
      }
      .row b.tone-coral {
        color: var(--hub-coral);
      }
    `],t([gt({attribute:!1})],Mi.prototype,"model",void 0),customElements.define("hub-system-card",Mi);const Ai=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:2});class Ti extends vt{_num(t){return t?Ht(this.getState(t)):null}_text(t){if(!t)return null;const e=this.getState(t);return"unavailable"===e||"unknown"===e||""===e?null:e}render(){if(!this.hass||!this.config)return U``;const t=this.config.system??{},e=t.cluster??{},a=t.nas??{},i=t.media??{},s=t.alerts??{},r={nodesReady:this._num(e.nodes_ready_entity),nodesTotal:this._num(e.nodes_total_entity),alerts:this._num(s.count_entity),fluxFailing:this._num(e.flux_failing_entity),podsUnhealthy:this._num(e.pods_unhealthy_entity),restarts1h:this._num(e.restarts_entity),clusterTemp:this._num(e.temp_entity),nasCpuTemp:this._num(a.cpu_temp_entity),nasNvmeTemp:this._num(a.nvme_temp_entity),volume1UsedPct:this._num(a.volume1_used_entity),volume2UsedPct:this._num(a.volume2_used_entity),backupAgeHours:this._num(a.backup_age_entity),certDays:this._num(e.certs_days_entity)},n=te(r),o=this._num(e.cpu_entity),l=this._num(e.mem_entity),h=null===r.nodesReady||null===r.nodesTotal?"–":`${r.nodesReady}/${r.nodesTotal}`,c=Zt(r.nodesReady,r.nodesTotal),d={section:"kluster",eyebrow:"Kluster",value:h,unit:"noder",pill:"neutral"===c?void 0:{label:"green"===c?"Alla redo":"Nod nere",tone:c},rows:[{key:"CPU",value:ne(o),tone:Ut(o)},{key:"Minne",value:ne(l),tone:Ut(l)},{key:"Poddar",value:(()=>{const t=this._num(e.pods_running_entity),a=r.podsUnhealthy;return null===t?"–":a?`${t} igång · ${a} med problem`:`${t} igång`})(),tone:Wt(r.podsUnhealthy)},{key:"Omstarter / 1 h",value:null===r.restarts1h?"–":`${Math.round(r.restarts1h)}`,tone:qt(r.restarts1h)},{key:"Varmaste nod",value:null===r.clusterTemp?"–":`${Math.round(r.clusterTemp)} °C`,tone:Gt(r.clusterTemp)}]},p=this._num(a.volume1_free_entity),u=r.volume1UsedPct,g=this._num(a.cpu_entity),b=this._num(a.mem_entity),m={section:"nas",eyebrow:"NAS",value:oe(p),unit:"ledigt",bar:null===u?void 0:{pct:u,tone:Xt(u),label:`Volume 1 · ${ne(u)} använt`},rows:[{key:"CPU",value:ne(g),tone:Ut(g)},{key:"Minne",value:ne(b),tone:Ut(b)},{key:"Temperatur",value:null===r.nasCpuTemp?"–":`${Math.round(r.nasCpuTemp)} °C${null===r.nasNvmeTemp?"":` · NVMe ${Math.round(r.nasNvmeTemp)} °C`}`,tone:Qt([Gt(r.nasCpuTemp),Gt(r.nasNvmeTemp)])},{key:"Appar (SSD)",value:(()=>{const t=this._num(a.volume2_free_entity);return null===t?"–":`${Math.round(t)} GB ledigt`})(),tone:Xt(r.volume2UsedPct)},{key:"Drifttid",value:ie(this._num(a.uptime_entity))}]},v=this._num(i.jellyfin_streams_entity),f=this._num(i.jellyfin_cpu_entity),x={section:"media",eyebrow:"Media",value:null===v?"–":`${Math.round(v)}`,unit:1===v?"ström":"strömmar",pill:null!==f&&f>=.8&&0===(v??0)?{label:"Jellyfin jobbar",tone:"neutral"}:void 0,rows:[{key:"Jellyfin CPU",value:null===f?"–":`${Ai.format(f)} kärnor`},{key:"Seedar (upp)",value:re(this._num(i.torrent_up_entity))},{key:"Laddar ner",value:re(this._num(i.torrent_down_entity))},{key:"Containrar",value:(()=>{const t=this._num(a.containers_entity);return null===t?"–":`${Math.round(t)} igång`})()}]},y=r.alerts,_=this._text(s.names_entity),w={section:"drift",eyebrow:"Drift",value:null===y?"–":`${Math.round(y)}`,unit:"larm",pill:null===y?void 0:y>0?{label:_&&"OK"!==_?_.split(",")[0].trim():"Ringer",tone:"coral"}:{label:"Tyst",tone:"green"},rows:[{key:"Flux",value:null===r.fluxFailing?"–":0===r.fluxFailing?"Synkad":`${Math.round(r.fluxFailing)} misslyckade`,tone:Wt(r.fluxFailing)},{key:"Certifikat",value:null===r.certDays?"–":`${Math.round(r.certDays)} dagar kvar`,tone:Kt(r.certDays)},{key:"NAS-backup",value:null===r.backupAgeHours?"–":`${se(r.backupAgeHours)} sedan`,tone:Yt(r.backupAgeHours)},{key:"Kluster drifttid",value:ie(this._num(e.uptime_entity))}]};return U`
      <div class="page">
        <div class="header">
          <h1 class="title">System</h1>
          <span class="status tone-${n.tone}">${n.label}</span>
          <span class="hint">Tryck på ett kort för detaljer</span>
        </div>
        <div class="grid">
          <hub-system-card .model=${d}></hub-system-card>
          <hub-system-card .model=${m}></hub-system-card>
          <hub-system-card .model=${x}></hub-system-card>
          <hub-system-card .model=${w}></hub-system-card>
        </div>
      </div>
    `}}Ti.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--hub-page-pad);
        padding-bottom: clamp(48px, 6vh, 66px);
      }
      .header {
        padding-right: 56px; /* clear the corner theme toggle */
        margin-bottom: clamp(14px, 2vh, 22px);
        display: flex;
        align-items: baseline;
        gap: 14px;
        flex-wrap: wrap;
      }
      .title {
        margin: 0;
        font: 200 clamp(30px, 4.4vw, 46px) var(--hub-font-display);
        letter-spacing: -0.02em;
        color: var(--hub-text);
      }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: var(--hub-radius-pill);
        font: 600 13px var(--hub-font-body);
        background: var(--hub-chip-bg);
        border: 1px solid var(--hub-chip-border);
        color: var(--hub-text-muted);
      }
      .status::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }
      .status.tone-green {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
        color: var(--hub-green);
      }
      .status.tone-amber {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
      .status.tone-coral {
        background: var(--hub-coral-bg);
        border-color: var(--hub-coral-border);
        color: var(--hub-coral);
      }
      .hint {
        margin-left: auto;
        font: 500 12.5px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 1fr;
        gap: var(--hub-gap);
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
          grid-auto-rows: auto;
        }
      }
    `],t([gt({attribute:!1})],Ti.prototype,"config",void 0),customElements.define("hub-system-page",Ti);const Ni=G`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;class Fi extends vt{constructor(){super(...arguments),this.room=null,this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_activateScene(t){this.callService("scene","turn_on",void 0,t)}render(){if(!this.room||!this.hass)return U``;const t=this.room;return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${t.name}>
          <div class="head">
            <span class="title">${t.name}</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>
              ${Ni}
            </button>
          </div>
          <div class="lights">
            ${t.lights.map(t=>U`
                <glass-light-slider
                  .hass=${this.hass}
                  ._config=${{type:"glass-light-slider",entity:t.entity,name:t.name}}
                ></glass-light-slider>
              `)}
          </div>
          ${t.scenes?.length?U`<div class="scenes">
                ${t.scenes.map(t=>U`
                    <button class="scene-chip" @click=${()=>this._activateScene(t.entity)}>
                      ${t.name}
                    </button>
                  `)}
              </div>`:q}
        </div>
      </div>
    `}}Fi.styles=[Tt,n`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .card {
        width: 100%;
        max-width: 520px;
        max-height: 100%;
        overflow: auto;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .title {
        font: 500 22px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg {
        width: 22px;
        height: 22px;
      }
      .lights {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      glass-light-slider {
        display: block;
      }
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }
      .scene-chip {
        min-height: 48px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform 120ms ease, background 160ms ease, border-color 160ms ease,
          color 160ms ease;
      }
      .scene-chip:active {
        transform: scale(0.95);
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
      @media (max-width: 600px) {
        .scrim { padding: 0; }
        .card {
          max-width: none;
          height: 100%;
          max-height: none;
          border-radius: 0;
        }
      }
    `],t([gt({attribute:!1})],Fi.prototype,"room",void 0),customElements.define("hub-room-popup",Fi);const Pi=G`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;class Di extends vt{constructor(){super(...arguments),this.entity="",this.name="",this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}render(){return this.entity&&this.hass?U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${this.name}>
          <div class="head">
            <span class="title">${this.name}</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>${Pi}</button>
          </div>
          <glass-light-slider
            .hass=${this.hass}
            ._config=${{type:"glass-light-slider",entity:this.entity,name:this.name}}
          ></glass-light-slider>
        </div>
      </div>
    `:U``}}Di.styles=[Tt,n`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 440px;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .title {
        font: 500 22px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg {
        width: 22px;
        height: 22px;
      }
      glass-light-slider {
        display: block;
      }
      @media (max-width: 600px) {
        .scrim { padding: 0; }
        .card {
          max-width: none;
          height: 100%;
          max-height: none;
          border-radius: 0;
        }
      }
    `],t([gt()],Di.prototype,"entity",void 0),t([gt()],Di.prototype,"name",void 0),customElements.define("hub-light-popup",Di);const zi=G`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`,ji=new Set(["EXPECTED","ATSTOP"]);class Li extends vt{constructor(){super(...arguments),this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_departures(t,e,a){if(!t)return[];const i=this.getEntity(t);return ka(i?.attributes.departures??[],e,a).slice(0,6)}_depRow(t){const e=function(t){return"string"==typeof t.state&&t.state.length>0&&!ji.has(t.state)}(t),a=Sa(t.expected??t.scheduled)??"–";return U`
      <div class="dep-row">
        <span class="dep-time ${e?"delayed":""}">${a}</span>
        <span class="dep-dest">${t.destination??"–"}</span>
        <span class="dep-in ${e?"delayed":""}">${t.display??""}</span>
      </div>
    `}_depSection(t,e,a){return U`
      <div class="section">
        <div class="sec-title">${t}</div>
        ${e.length?e.map(t=>this._depRow(t)):U`<div class="empty">${a}</div>`}
      </div>
    `}_storSection(t){return 0===t.length?q:U`
      <div class="section">
        <div class="sec-title">Störningar</div>
        ${t.map(t=>U`
            <div class="stor">
              <div class="stor-head">
                ${t.badges.map(t=>U`<span class="badge">${t}</span>`)}
                <span class="stor-header">${t.header}</span>
              </div>
              ${t.details?U`<div class="stor-details">${t.details}</div>`:q}
              ${t.scope?U`<div class="stor-scope">Berör: ${t.scope}</div>`:q}
            </div>
          `)}
      </div>
    `}render(){if(!this.hass||!this.config)return U``;const t=this.config,e=this._departures(t.departures?.list_entity,"43",""),a=t.transit?.bus,i=a?this._departures(a.entity,a.line,a.exclude_destination):[],s=t.disturbances_entity?this.getEntity(t.disturbances_entity):void 0,r=s&&"unavailable"!==s.state&&"unknown"!==s.state?$a(s.attributes.deviations):[];return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Resor och störningar">
          <div class="head">
            <span class="title">Resor & störningar</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>${zi}</button>
          </div>
          ${this._depSection("Pendeltåg",e,"–")}
          ${this._depSection(a?.label??"Buss",i,"Inga avgångar idag")}
          ${this._storSection(r)}
        </div>
      </div>
    `}}Li.styles=[Tt,n`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 560px;
        max-height: 100%;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .title {
        font: 500 22px var(--hub-font-display);
        letter-spacing: -0.01em;
        color: var(--hub-text);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg {
        width: 22px;
        height: 22px;
      }

      .section + .section {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--hub-card-border);
      }
      .sec-title {
        font: 600 13px var(--hub-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 8px;
      }
      .empty {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Departure rows ─────────────────────────────────── */
      .dep-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        min-height: 30px;
      }
      .dep-time {
        flex-shrink: 0;
        width: 52px;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
      }
      .dep-time.delayed {
        color: var(--hub-coral);
      }
      .dep-dest {
        flex: 1;
        min-width: 0;
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dep-in {
        flex-shrink: 0;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-dim);
        font-variant-numeric: tabular-nums;
      }
      .dep-in.delayed {
        color: var(--hub-coral);
      }

      /* ── Störningar ─────────────────────────────────────── */
      .stor + .stor {
        margin-top: 12px;
      }
      .stor-head {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .badge {
        min-width: 24px;
        padding: 1px 6px;
        border-radius: 6px;
        text-align: center;
        background: var(--hub-coral);
        color: var(--hub-surface);
        font: 700 10.5px var(--hub-font-body);
      }
      .stor-header {
        font: 600 14px var(--hub-font-body);
        color: var(--hub-coral);
      }
      .stor-details {
        margin-top: 4px;
        font: 400 13px var(--hub-font-body);
        line-height: 1.45;
        color: var(--hub-text-muted);
        white-space: pre-line;
      }
      .stor-scope {
        margin-top: 3px;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      @media (max-width: 600px) {
        .scrim { padding: 0; }
        .card {
          max-width: none;
          height: 100%;
          max-height: none;
          border-radius: 0;
        }
      }
    `],t([gt({attribute:!1})],Li.prototype,"config",void 0),customElements.define("hub-transit-popup",Li);const Ii=G`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`,Oi=new Intl.DateTimeFormat("sv-SE",{weekday:"short"});class Bi extends vt{constructor(){super(...arguments),this._loc=0,this._hours=[],this._days=[],this._bgOn=Pt(),this._loadedFor="",this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}get _locations(){const t=this.config;return t?.weather_locations?.length?t.weather_locations:t?.weather_entity?[{entity:t.weather_entity,name:"Hem"}]:[]}updated(t){const e=this._locations[this._loc]?.entity;e&&this.hass&&(t.has("hass")||t.has("config"))&&this._loadedFor!==e&&this._load(e)}async _load(t){this._loadedFor=t;const[e,a]=await Promise.all([Re(this.hass,t,"hourly"),Re(this.hass,t,"daily")]);this._loadedFor===t&&(this._hours=e?ge(e):[],this._days=a?be(a):[])}_pickLoc(t){if(t===this._loc)return;this._loc=t,this._hours=[],this._days=[];const e=this._locations[t]?.entity;e&&this._load(e)}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_toggleBg(){this._bgOn=!this._bgOn,Dt(this._bgOn),this.dispatchEvent(new CustomEvent("hub-weather-bg-toggle",{detail:{on:this._bgOn},bubbles:!0,composed:!0}))}get _isNight(){return"below_horizon"===this.hass?.states["sun.sun"]?.state}_hero(){const t=this.getEntity(this._locations[this._loc]?.entity??"");if(!t)return q;const e=t.attributes.temperature,a=t.attributes.apparent_temperature,i=t.attributes.wind_speed,s=t.attributes.wind_speed_unit??"km/h";return U`
      <div class="hero">
        ${Oe(t.state,this._isNight)}
        <span class="hero-temp">${"number"==typeof e?Math.round(e):"–"}°</span>
        <span class="hero-meta">
          <span class="hero-cond">${this.hass.formatEntityState(t)}</span>
          ${"number"==typeof a?U`<span>Känns som ${Math.round(a)}°</span>`:q}
          ${"number"==typeof i?U`<span>Vind ${Math.round(i)} ${s}</span>`:q}
        </span>
      </div>
    `}_hourly(){const t=Date.now()-36e5,e=this._hours.filter(e=>e.ts>=t).slice(0,24);return U`
      <div class="section">
        <div class="sec-title">Idag</div>
        ${e.length?U`<div class="hours">
              ${e.map(t=>U`
                  <div class="hour">
                    <span class="hour-t">${String(new Date(t.ts).getHours()).padStart(2,"0")}</span>
                    ${Oe(t.condition,this._isNight)}
                    <span class="hour-temp">${Math.round(t.temp)}°</span>
                    <span class="hour-precip">${t.precip>=.1?`${t.precip.toFixed(1)}`:""}</span>
                  </div>
                `)}
            </div>`:U`<div class="empty">Ingen timprognos</div>`}
      </div>
    `}_daily(){const t=this._days.slice(0,7),e=function(t){if(0===t.length)return null;let e=1/0,a=-1/0;for(const i of t)null!==i.low&&i.low<e&&(e=i.low),i.high>a&&(a=i.high),i.high<e&&(e=Math.min(e,i.high));return Number.isFinite(e)&&Number.isFinite(a)?{min:e,max:a}:null}(t),a=e?Math.max(e.max-e.min,1):1;return U`
      <div class="section">
        <div class="sec-title">7 dagar</div>
        ${t.length&&e?t.map((t,i)=>{const s=t.low??t.high,r=(s-e.min)/a*100,n=Math.max((t.high-s)/a*100,4);return U`
                <div class="day-row">
                  <span class="day-name">${0===i?"Idag":function(t){return t.length?t.charAt(0).toUpperCase()+t.slice(1):t}(Oi.format(new Date(t.ts)))}</span>
                  ${Oe(t.condition,!1)}
                  <span class="day-prob">${null!==t.precipProb&&t.precipProb>=20?`${Math.round(t.precipProb)}%`:""}</span>
                  <span class="day-lo">${null!==t.low?`${Math.round(t.low)}°`:""}</span>
                  <span class="day-bar">
                    <span class="day-bar-fill" style="left:${r}%;width:${n}%"></span>
                  </span>
                  <span class="day-hi">${Math.round(t.high)}°</span>
                </div>
              `}):U`<div class="empty">Ingen veckoprognos</div>`}
      </div>
    `}render(){if(!this.hass||!this.config)return U``;const t=this._locations;return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Väder">
          <div class="head">
            <div class="pills">
              ${t.map((t,e)=>U`
                  <button class="pill ${e===this._loc?"active":""}" @click=${()=>this._pickLoc(e)}>
                    ${t.name}
                  </button>
                `)}
            </div>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>${Ii}</button>
          </div>
          ${this._hero()}
          ${this._hourly()}
          ${this._daily()}
          <div class="section">
            <div class="toggle-row">
              <span class="toggle-label">Animerad bakgrund</span>
              <button
                class="switch ${this._bgOn?"on":""}"
                role="switch"
                aria-checked=${this._bgOn}
                aria-label="Animerad bakgrund"
                @click=${()=>this._toggleBg()}
              ></button>
            </div>
          </div>
        </div>
      </div>
    `}}Bi.styles=[Tt,n`
      :host {
        position: absolute;
        inset: 0;
        z-index: 40;
      }
      .scrim {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
        background: var(--hub-scrim);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        animation: fade 0.2s ease;
      }
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .card {
        width: 100%;
        max-width: 620px;
        max-height: 100%;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        box-sizing: border-box;
        padding: 20px;
        border-radius: var(--hub-radius-lg);
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      @keyframes pop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .pills {
        display: flex;
        gap: 6px;
      }
      .pill {
        padding: 7px 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease, border-color 150ms ease;
      }
      .pill.active {
        color: var(--hub-text);
        border-color: var(--hub-text-dim);
      }
      .close {
        width: 48px;
        height: 48px;
        margin: -8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .close svg { width: 22px; height: 22px; }

      /* ── Current hero ───────────────────────────────────── */
      .hero {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 4px 0 16px;
      }
      .hero svg {
        width: 52px;
        height: 52px;
        color: var(--hub-text-muted);
      }
      .hero-temp {
        font: 200 56px var(--hub-font-display);
        letter-spacing: -0.03em;
        color: var(--hub-text);
        line-height: 1;
      }
      .hero-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .hero-cond {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text);
      }

      .section {
        padding-top: 14px;
        border-top: 1px solid var(--hub-card-border);
      }
      .section + .section { margin-top: 14px; }
      .sec-title {
        font: 600 13px var(--hub-font-body);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
        margin-bottom: 10px;
      }
      .empty { font: 500 13px var(--hub-font-body); color: var(--hub-text-dim); }

      /* ── Hourly strip ───────────────────────────────────── */
      .hours {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding-bottom: 6px;
        -webkit-overflow-scrolling: touch;
      }
      .hour {
        flex: 0 0 52px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-variant-numeric: tabular-nums;
      }
      .hour-t { font: 500 12px var(--hub-font-body); color: var(--hub-text-dim); }
      .hour svg { width: 22px; height: 22px; color: var(--hub-text-muted); }
      .hour-temp { font: 600 14px var(--hub-font-body); color: var(--hub-text); }
      .hour-precip { font: 500 11px var(--hub-font-body); color: var(--hub-teal); min-height: 13px; }

      /* ── Daily list ─────────────────────────────────────── */
      .day-row {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 40px;
      }
      .day-name {
        width: 44px;
        flex-shrink: 0;
        font: 600 14px var(--hub-font-body);
        color: var(--hub-text);
      }
      .day-row svg { width: 24px; height: 24px; color: var(--hub-text-muted); flex-shrink: 0; }
      .day-prob {
        width: 40px;
        flex-shrink: 0;
        font: 500 12px var(--hub-font-body);
        color: var(--hub-teal);
        font-variant-numeric: tabular-nums;
      }
      .day-lo, .day-hi {
        width: 34px;
        flex-shrink: 0;
        font: 500 14px var(--hub-font-body);
        font-variant-numeric: tabular-nums;
      }
      .day-lo { color: var(--hub-text-dim); text-align: right; }
      .day-hi { color: var(--hub-text); }
      .day-bar {
        flex: 1;
        height: 4px;
        border-radius: 2px;
        background: var(--hub-track);
        position: relative;
        overflow: hidden;
      }
      .day-bar-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        border-radius: 2px;
        background: linear-gradient(90deg, var(--hub-teal), var(--hub-amber));
      }

      /* ── Background toggle ──────────────────────────────── */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 44px;
      }
      .toggle-label { font: 500 14px var(--hub-font-body); color: var(--hub-text); }
      .switch {
        position: relative;
        width: 46px;
        height: 28px;
        border-radius: 14px;
        border: none;
        cursor: pointer;
        background: var(--hub-track);
        transition: background 200ms ease;
        -webkit-tap-highlight-color: transparent;
      }
      .switch.on { background: var(--hub-amber); }
      .switch::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--hub-card);
        transition: transform 200ms ease;
      }
      .switch.on::after { transform: translateX(18px); }
      @media (max-width: 600px) {
        .scrim { padding: 0; }
        .card {
          max-width: none;
          height: 100%;
          max-height: none;
          border-radius: 0;
        }
      }
    `],t([gt({attribute:!1})],Bi.prototype,"config",void 0),t([bt()],Bi.prototype,"_loc",void 0),t([bt()],Bi.prototype,"_hours",void 0),t([bt()],Bi.prototype,"_days",void 0),t([bt()],Bi.prototype,"_bgOn",void 0),customElements.define("hub-weather-popup",Bi);const Ri=n`
  :host {
    position: absolute;
    inset: 0;
    z-index: 40;
  }
  .scrim {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    background: var(--hub-scrim);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    animation: fade 0.2s ease;
  }
  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .card {
    width: 100%;
    max-width: 560px;
    max-height: 100%;
    overflow: auto;
    box-sizing: border-box;
    padding: 20px;
    border-radius: var(--hub-radius-lg);
    background: var(--hub-card);
    border: 1px solid var(--hub-card-border);
    box-shadow: var(--hub-shadow);
    animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  @keyframes pop {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .title {
    font: 500 22px var(--hub-font-display);
    letter-spacing: -0.01em;
    color: var(--hub-text);
  }
  .close {
    width: 48px;
    height: 48px;
    margin: -8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--hub-text-muted);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .close svg {
    width: 22px;
    height: 22px;
  }
  @media (max-width: 600px) {
    .scrim { padding: 0; }
    .card {
      max-width: none;
      height: 100%;
      max-height: none;
      border-radius: 0;
    }
  }
`;class Hi extends vt{constructor(){super(...arguments),this._onScrim=t=>{t.target===t.currentTarget&&this._close()},this._allOff=()=>{const t=[...new Set((this.config.rooms??[]).flatMap(t=>t.lights.map(t=>t.entity)))];this.hass?.callService("light","turn_off",{},{entity_id:t})}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_scene(t){this.callService("scene","turn_on",void 0,t)}render(){if(!this.hass||!this.config)return U``;const t=this.config.rooms??[];return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Belysning">
          <div class="head">
            <span class="title">Belysning</span>
            <button class="all-off" @click=${this._allOff}>Släck allt</button>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>
              ${Ot.close}
            </button>
          </div>
          ${t.map(t=>{const e=t.lights.filter(t=>"on"===this.getEntity(t.entity)?.state).length;return U`
              <div class="room">
                <div class="room-head">
                  <span class="room-name">${t.name}</span>
                  <span class="room-count">${e>0?`${e} tänd${1===e?"":"a"}`:""}</span>
                </div>
                <div class="lights">
                  ${t.lights.map(t=>U`
                      <glass-light-slider
                        .hass=${this.hass}
                        ._config=${{type:"glass-light-slider",entity:t.entity,name:t.name}}
                      ></glass-light-slider>
                    `)}
                </div>
                ${t.scenes?.length?U`<div class="scenes">
                      ${t.scenes.map(t=>U`
                          <button class="scene-chip" @click=${()=>this._scene(t.entity)}>
                            ${t.name}
                          </button>
                        `)}
                    </div>`:q}
              </div>
            `})}
        </div>
      </div>
    `}}Hi.styles=[Tt,Ri,n`
      .all-off {
        min-height: 48px;
        padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .all-off:active {
        transform: scale(0.96);
      }
      .room {
        margin-top: 18px;
      }
      .room:first-of-type {
        margin-top: 0;
      }
      .room-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;
      }
      .room-name {
        font: 500 16px var(--hub-font-display);
        color: var(--hub-text);
      }
      .room-count {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      /* Wider card than the shared popup default — the light grid needs room. */
      .card {
        max-width: 780px;
      }
      .lights {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      @media (max-width: 600px) {
        .lights {
          grid-template-columns: 1fr;
        }
      }
      glass-light-slider {
        display: block;
      }
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .scene-chip {
        min-height: 44px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        white-space: nowrap;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .scene-chip:active {
        transform: scale(0.95);
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        color: var(--hub-amber-text);
      }
    `],t([gt({attribute:!1})],Hi.prototype,"config",void 0),customElements.define("hub-lights-modal",Hi);const Vi={charging:"Laddar",charging_complete:"Fulladdad",cleaning:"Städar",segment_cleaning:"Rumsstädning",zoned_cleaning:"Zonstädning",spot_cleaning:"Fläckstädning",returning_home:"Åker hem",returning:"Åker hem",docked:"Dockad",idle:"Väntar",paused:"Pausad",error:"Fel",emptying:"Tömmer dammbehållaren",washing:"Tvättar moppen",drying:"Torkar moppen",sleeping:"Vilar"},Ui={Kitchen:"Kök","Living room":"Vardagsrum","Living Room":"Vardagsrum",Bedroom:"Sovrum",Hallway:"Hall",Hall:"Hall",Bathroom:"Badrum"},Gi={standard:"Standard",deep:"Djup",deep_plus:"Djup+",fast:"Snabb",custom:"Anpassad",smart_mode:"Smart",off:"Av",mild:"Mild",moderate:"Medel",intense:"Intensiv"},Wi=new Set(["unavailable","unknown",""]);class qi extends vt{constructor(){super(...arguments),this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_press(t){this.callService("button","press",void 0,t)}_vac(t){this.config.vacuum_entity&&this.callService("vacuum",t,void 0,this.config.vacuum_entity)}_selectOption(t,e){this.callService("select","select_option",{option:e},t)}_consumableValue(t){if(!t||Wi.has(t.state))return"–";const e=t.attributes.unit_of_measurement??"",a=Number(t.state);if(Number.isNaN(a))return e?`${t.state} ${e}`:t.state;if("s"===e){const t=Math.round(a/3600);return`${Math.abs(t)} h ${t<0?"över":"kvar"}`}return e?`${a} ${e}`:String(a)}_selectChips(t){if(!t)return q;const e=this.getEntity(t),a=e?.attributes.options??[];return a.length?U`<div class="chips">
      ${a.map(a=>U`
          <button class="chip ${e?.state===a?"sel":""}" @click=${()=>this._selectOption(t,a)}>
            ${Gi[a]??a.replace(/_/g," ")}
          </button>
        `)}
    </div>`:q}render(){if(!this.hass||!this.config)return U``;const t=this.config.vacuum_controls,e=this.config.vacuum_entity?this.getEntity(this.config.vacuum_entity):void 0,a=e?.state??"unknown",i=t?.status_entity?this.getEntity(t.status_entity)?.state:a,s=!i||Wi.has(i)?"–":Vi[i]??i.replace(/_/g," "),r=t?.battery_entity?this.getEntity(t.battery_entity)?.state:void 0,n=r&&!Number.isNaN(Number(r))?r:null,o=t?.current_room_entity?this.getEntity(t.current_room_entity)?.state:void 0,l=o&&!Wi.has(o)?Ui[o]??o:void 0,h="cleaning"===a||"returning"===a,c="paused"===a;return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Roborock">
          <div class="head">
            <span class="title">Roborock</span>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>
              ${Ot.close}
            </button>
          </div>
          <div class="status">
            <span class="state">${s}${h&&l?` · ${l}`:""}</span>
            ${n?U`<span class="batt">${n}%</span>`:q}
          </div>
          <div class="actions">
            ${h||c?U`
                  <button class="act" @click=${()=>this._vac(c?"start":"pause")}>
                    ${c?"Fortsätt":"Pausa"}
                  </button>
                  <button class="act" @click=${()=>this._vac("return_to_base")}>Åk hem</button>
                `:U`
                  ${t?.full_button?U`<button class="act primary" @click=${()=>this._press(t.full_button)}>
                        Städa allt
                      </button>`:q}
                  ${(t?.room_buttons??[]).map(t=>U`
                      <button class="act" @click=${()=>this._press(t.entity)}>${t.name}</button>
                    `)}
                `}
          </div>
          ${t?.mop_mode_entity?U`<div class="sect">Mopläge</div>${this._selectChips(t.mop_mode_entity)}`:q}
          ${t?.mop_intensity_entity?U`<div class="sect">Moppintensitet</div>${this._selectChips(t.mop_intensity_entity)}`:q}
          ${t?.consumables?.length?U`<div class="sect">Förbrukning</div>
                <div class="cons">
                  ${t.consumables.map(t=>{const e=this.getEntity(t.entity);return U`<div class="cons-row">
                      <span>${t.name}</span><span>${this._consumableValue(e)}</span>
                    </div>`})}
                </div>`:q}
        </div>
      </div>
    `}}qi.styles=[Tt,Ri,n`
      .status {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin-bottom: 16px;
      }
      .state {
        font: 500 18px var(--hub-font-display);
        color: var(--hub-text);
      }
      .batt {
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .act {
        min-height: 52px;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .act:active {
        transform: scale(0.97);
      }
      .act.primary {
        grid-column: span 2;
        background: var(--hub-teal-bg);
        color: var(--hub-teal);
        border-color: transparent;
      }
      .sect {
        margin-top: 18px;
        font: 500 12px var(--hub-font-body);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
      }
      .chip {
        min-height: 44px;
        padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .chip.sel {
        background: var(--hub-teal-bg);
        border-color: transparent;
        color: var(--hub-teal);
      }
      .cons {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cons-row {
        display: flex;
        justify-content: space-between;
        font: 500 13px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
    `],t([gt({attribute:!1})],qi.prototype,"config",void 0),customElements.define("hub-vacuum-popup",qi);const Xi={charging:"Laddar",discharging:"Urladdar",done:"Färdigladdad",idle:"Vilar",scheduled:"Schemalagd",not_charging:"Laddar inte",error:"Fel",fault:"Fel"};class Yi extends vt{constructor(){super(...arguments),this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_climate(){const t=this.config.volvo?.climate_entity;t&&(t.startsWith("switch.")?this.callService("switch","toggle",void 0,t):this.callService("button","press",void 0,t))}_climateStop(){const t=this.config.volvo?.climate_stop_entity;t&&this.callService("button","press",void 0,t)}_lockAction(t){const e=this.config.volvo?.lock_entity;e&&this.callService("lock",t,void 0,e)}_val(t,e=""){if(!t)return"–";const a=this.getEntity(t);if(!a||"unavailable"===a.state||"unknown"===a.state)return"–";const i=e||(a.attributes.unit_of_measurement??"");return i?`${a.state} ${i}`:a.state}_chargingLabel(t){if(!t)return"–";const e=this.getEntity(t);return e&&"unavailable"!==e.state&&"unknown"!==e.state?Xi[e.state]??e.state.replace(/_/g," "):"–"}render(){if(!this.hass||!this.config?.volvo)return U``;const t=this.config.volvo,e=t.climate_entity?.startsWith("switch.")??!1,a=e&&t.climate_entity?this.getEntity(t.climate_entity):void 0,i=e&&"on"===a?.state,s=t.lock_entity?this.getEntity(t.lock_entity)?.state:void 0;return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${t.name??"Volvo"}>
          <div class="head">
            <span class="title">${t.name??"Volvo"}</span>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>${Ot.close}</button>
          </div>
          <div class="actions">
            ${t.climate_entity?U`<button class="act primary ${i?"on":""}" @click=${()=>this._climate()}>
                  ${i?"Klimat på — stäng av":"Starta klimat"}
                </button>`:q}
            ${t.climate_stop_entity&&!t.climate_entity?.startsWith("switch.")?U`<button class="act" style="grid-column: span 2" @click=${()=>this._climateStop()}>
                  Stoppa klimat
                </button>`:q}
            ${t.lock_entity?U`
                  <button class="act" @click=${()=>this._lockAction("lock")}>Lås</button>
                  <button class="act" @click=${()=>this._lockAction("unlock")}>Lås upp</button>
                `:q}
          </div>
          <div class="grid">
            <div class="row"><span class="k">Batteri</span><span class="v">${this._val(t.battery_entity,"%")}</span></div>
            <div class="row"><span class="k">Räckvidd</span><span class="v">${this._val(t.range_entity,"km")}</span></div>
            <div class="row"><span class="k">Laddning</span><span class="v">${this._chargingLabel(t.charging_entity)}</span></div>
            <div class="row"><span class="k">Lås</span><span class="v ${"unlocked"===s?"warn":""}">${"locked"===s?"Låst":"unlocked"===s?"Olåst":"–"}</span></div>
            <div class="row"><span class="k">Mätarställning</span><span class="v">${this._val(t.odometer_entity)}</span></div>
            ${(t.doors??[]).map(t=>{const e="on"===this.getEntity(t.entity)?.state;return U`<div class="row">
                <span class="k">${t.name}</span>
                <span class="v ${e?"warn":""}">${e?"Öppen":"Stängd"}</span>
              </div>`})}
          </div>
        </div>
      </div>
    `}}Yi.styles=[Tt,Ri,n`
      .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .act {
        min-height: 52px;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .act:active { transform: scale(0.97); }
      .act.primary { grid-column: span 2; background: var(--hub-teal-bg); color: var(--hub-teal); border-color: transparent; }
      .act.on { background: var(--hub-teal-bg); color: var(--hub-teal); border-color: transparent; }
      .grid { margin-top: 18px; display: flex; flex-direction: column; gap: 6px; }
      .row { display: flex; justify-content: space-between; min-height: 32px; align-items: center; }
      .k { font: 500 13.5px var(--hub-font-body); color: var(--hub-text-muted); }
      .v { font: 600 13.5px var(--hub-font-body); color: var(--hub-text); }
      .v.warn { color: var(--hub-coral); }
    `],t([gt({attribute:!1})],Yi.prototype,"config",void 0),customElements.define("hub-car-popup",Yi);class Ki extends vt{constructor(){super(...arguments),this._items=null,this._lastCount="",this._fetchSeq=0,this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}updated(t){super.updated(t);const e=this.config?.todo_entity;if(!e||!this.hass)return;const a=this.getEntity(e)?.state??"";a!==this._lastCount&&(this._lastCount=a,this._refresh())}async _refresh(){if(!this.hass||!this.config?.todo_entity)return;const t=++this._fetchSeq,e=await ia(this.hass,this.config.todo_entity);t===this._fetchSeq&&(this._items=e)}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}async _add(){const t=this.shadowRoot?.querySelector("input"),e=t?.value.trim();e&&this.config.todo_entity&&(this.callService("todo","add_item",{item:e},this.config.todo_entity),t&&(t.value=""))}_toggle(t){if(!this.config.todo_entity)return;const e="completed"===t.status?"needs_action":"completed";this.callService("todo","update_item",{item:t.uid,status:e},this.config.todo_entity),window.setTimeout(()=>{this._refresh()},400)}_clearDone(){this.config.todo_entity&&(this.callService("todo","remove_completed_items",void 0,this.config.todo_entity),window.setTimeout(()=>{this._refresh()},400))}render(){if(!this.hass||!this.config?.todo_entity)return U``;const{open:t,done:e}=aa(this._items),a=U`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"></path></svg>`;return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Att göra">
          <div class="head">
            <span class="title">Att göra</span>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>${Ot.close}</button>
          </div>
          <div class="add">
            <input
              placeholder="Lägg till…"
              @keydown=${t=>"Enter"===t.key&&this._add()}
            />
            <button @click=${()=>this._add()}>Lägg till</button>
          </div>
          ${[...t,...e].map(t=>U`
              <div class="row ${"completed"===t.status?"done":""}">
                <button class="box" aria-label="Växla" @click=${()=>this._toggle(t)}><span class="box-visual">${a}</span></button>
                <span class="txt">${t.summary}</span>
              </div>
            `)}
          ${e.length?U`<button class="clear" @click=${()=>this._clearDone()}>Rensa klara (${e.length})</button>`:q}
        </div>
      </div>
    `}}Ki.styles=[Tt,Ri,n`
      .add {
        display: flex; gap: 8px; margin-bottom: 14px;
      }
      .add input {
        flex: 1; min-width: 0; height: 48px;
        padding: 0 14px; box-sizing: border-box;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 500 14px var(--hub-font-body);
        outline: none;
      }
      .add button {
        height: 48px; padding: 0 18px;
        border-radius: var(--hub-radius);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .row {
        display: flex; align-items: center; gap: 12px;
        min-height: 48px;
        border-top: 1px solid var(--hub-card-border);
      }
      .box {
        width: 44px; height: 44px; flex-shrink: 0;
        margin: -11px;
        border: none;
        background: transparent;
        cursor: pointer; padding: 0;
        -webkit-tap-highlight-color: transparent;
        display: flex; align-items: center; justify-content: center;
      }
      .box-visual {
        width: 22px; height: 22px;
        box-sizing: border-box;
        border-radius: 7px;
        border: 1.5px solid var(--hub-text-dim);
        background: transparent;
        display: flex; align-items: center; justify-content: center;
        color: transparent;
      }
      .row.done .box-visual { color: var(--hub-text-dim); border-color: var(--hub-text-dim); }
      .box-visual svg { width: 14px; height: 14px; }
      .txt { flex: 1; min-width: 0; font: 500 14.5px var(--hub-font-body); color: var(--hub-text); }
      .row.done .txt { color: var(--hub-text-dim); text-decoration: line-through; }
      .clear {
        margin-top: 14px; min-height: 44px; padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: transparent; color: var(--hub-text-dim);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
    `],t([gt({attribute:!1})],Ki.prototype,"config",void 0),t([bt()],Ki.prototype,"_items",void 0),customElements.define("hub-todo-popup",Ki);const Zi=[{label:"30 min",min:30},{label:"1 tim",min:60},{label:"2 tim",min:120},{label:"Heldag",min:0}];class Ji extends vt{constructor(){super(...arguments),this._events=null,this._creating=!1,this._saving=!1,this._durMin=60,this._saveError=!1,this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}connectedCallback(){super.connectedCallback(),this._refresh()}async _refresh(){const t=this.config?.calendar;if(!this.hass||!t?.entities?.length)return;const e=await ta(this.hass,t.entities);e&&(this._events=e)}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_input(t){return this.shadowRoot?.querySelector(t)??null}async _save(){const t=this.config?.calendar,e=this._input(".f-title")?.value.trim(),a=this._input(".f-date")?.value,i=this._input(".f-time")?.value;if(!t||!e||!a)return;this._saving=!0,this._saveError=!1;const s={summary:e};if(0!==this._durMin&&i){const t=new Date(`${a}T${i}:00`),e=new Date(t.getTime()+6e4*this._durMin),r=t=>`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}T${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}:00`;s.start_date_time=r(t),s.end_date_time=r(e)}else{const[t,e,i]=a.split("-").map(Number),r=new Date(t,e-1,i+1);s.start_date=a,s.end_date=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`}try{await(this.hass?.callService("calendar","create_event",s,{entity_id:t.create_entity})),Qe=null,await this._refresh(),this._creating=!1,this._durMin=60}catch{this._saveError=!0}finally{this._saving=!1}}_grouped(){const t=new Date,e=new Map;for(const a of this._events??[]){const i=Je(a.start,t);e.has(i)||e.set(i,[]),e.get(i).push(a)}return e}_hm(t){if(t.allDay)return"Heldag";const e=new Date(t.start);return`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}render(){if(!this.hass||!this.config?.calendar)return U``;const t=new Date,e=`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`,a=this._grouped();return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label="Kalender">
          <div class="head">
            <span class="title">Kalender</span>
            <button class="new-btn" @click=${()=>this._creating=!this._creating}>
              ${this._creating?"Avbryt":"Nytt"}
            </button>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>${Ot.close}</button>
          </div>
          ${this._creating?U`<div class="form">
                <input class="f-title" placeholder="Vad händer?" />
                <div class="row2">
                  <input class="f-date" type="date" value=${e} />
                  <input class="f-time" type="time" value="12:00" />
                </div>
                <div class="durs">
                  ${Zi.map(t=>U`
                      <button class="dur ${this._durMin===t.min?"sel":""}" @click=${()=>this._durMin=t.min}>
                        ${t.label}
                      </button>
                    `)}
                </div>
                <button class="save" ?disabled=${this._saving} @click=${()=>this._save()}>
                  ${this._saving?"Sparar…":"Spara"}
                </button>
                ${this._saveError?U`<span class="err">Kunde inte spara — försök igen</span>`:q}
              </div>`:q}
          ${0===a.size?U`<div class="empty">Inga händelser de närmaste 7 dagarna</div>`:[...a.entries()].map(([t,e])=>U`
                  <div class="day">${t}</div>
                  ${e.map(t=>U`
                      <div class="ev">
                        <span class="when">${this._hm(t)}</span>
                        <span class="what">${t.title}</span>
                        ${t.sources.length>1?U`<span class="src">båda</span>`:q}
                      </div>
                    `)}
                `)}
        </div>
      </div>
    `}}Ji.styles=[Tt,Ri,n`
      .new-btn {
        min-height: 48px; padding: 0 16px;
        border-radius: var(--hub-radius-pill);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 13px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .day {
        margin-top: 16px;
        font: 500 12px var(--hub-font-body);
        letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--hub-text-dim);
      }
      .ev { display: flex; align-items: baseline; gap: 12px; min-height: 40px; }
      .when { flex-shrink: 0; width: 52px; font: 600 13px var(--hub-font-body); color: var(--hub-lavender, var(--hub-text-muted)); }
      .what { flex: 1; min-width: 0; font: 500 14.5px var(--hub-font-body); color: var(--hub-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .src { flex-shrink: 0; font: 500 11px var(--hub-font-body); color: var(--hub-text-dim); }
      .empty { margin-top: 14px; font: 500 13.5px var(--hub-font-body); color: var(--hub-text-dim); }
      .form { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
      .form input {
        height: 48px; padding: 0 14px; box-sizing: border-box;
        border-radius: var(--hub-radius);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text);
        font: 500 14px var(--hub-font-body);
        outline: none;
        color-scheme: dark light;
      }
      .form .row2 { display: flex; gap: 10px; }
      .form .row2 input { flex: 1; min-width: 0; }
      .durs { display: flex; gap: 8px; flex-wrap: wrap; }
      .dur {
        min-height: 44px; padding: 0 14px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid var(--hub-chip-border);
        background: var(--hub-chip-bg);
        color: var(--hub-text-muted);
        font: 500 12.5px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dur.sel {
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        border-color: transparent;
        color: var(--hub-lavender, var(--hub-text));
      }
      .save {
        min-height: 48px;
        border-radius: var(--hub-radius);
        border: none;
        background: var(--hub-lavender-bg, var(--hub-chip-bg));
        color: var(--hub-lavender, var(--hub-text));
        font: 600 14px var(--hub-font-body);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .save[disabled] { opacity: 0.5; }
      .err { font: 500 12.5px var(--hub-font-body); color: var(--hub-coral); }
    `],t([gt({attribute:!1})],Ji.prototype,"config",void 0),t([bt()],Ji.prototype,"_events",void 0),t([bt()],Ji.prototype,"_creating",void 0),t([bt()],Ji.prototype,"_saving",void 0),t([bt()],Ji.prototype,"_durMin",void 0),t([bt()],Ji.prototype,"_saveError",void 0),customElements.define("hub-calendar-popup",Ji);const Qi={sleep:"Sömn",readiness:"Beredskap",body:"Kropp",activity:"Aktivitet"},ts=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:1}),es=new Intl.NumberFormat("sv-SE");class as extends vt{constructor(){super(...arguments),this.section="sleep",this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_num(t){return t?Ht(this.getState(t)):null}_row(t,e,a,i=1,s=0){const r=this._num(e);if(null===r)return{key:t,value:"–"};const n=r*i,o=s>0?ts.format(n):es.format(Math.round(n));return{key:t,value:a?`${o} ${a}`:o}}_hoursRow(t,e){const a=this._num(e);return{key:t,value:null===a?"–":Rt(Math.round(60*a))}}_rows(){const t=this.config?.health?.oura??{},e=this.config?.health?.withings??{};switch(this.section){case"sleep":{const e=bi(t.bedtime_start_entity?this.getState(t.bedtime_start_entity):void 0),a=bi(t.bedtime_end_entity?this.getState(t.bedtime_end_entity):void 0);return[this._hoursRow("Total sömn",t.sleep_duration_entity),this._hoursRow("Tid i sängen",t.time_in_bed_entity),this._hoursRow("Djupsömn",t.deep_entity),this._hoursRow("REM-sömn",t.rem_entity),this._hoursRow("Lätt sömn",t.light_entity),this._hoursRow("Vaken tid",t.awake_entity),this._row("Effektivitet",t.efficiency_entity,"%"),this._row("Insomningstid",t.latency_entity,"min"),{key:"Sänggående",value:e||"–"},{key:"Uppstigning",value:a||"–"},this._row("Sömnpoäng",t.sleep_score_entity,"")]}case"readiness":return[this._row("Beredskapspoäng",t.readiness_score_entity,""),this._row("HRV under sömn",t.hrv_entity,"ms"),this._row("Vilopuls",t.resting_hr_entity,"slag/min"),this._row("Temperaturavvikelse",t.temp_deviation_entity,"°C",1,1),this._row("HRV-balans",t.hrv_balance_entity,""),this._row("Sömnregularitet",t.sleep_regularity_entity,""),this._row("Vilopulspoäng",t.resting_hr_score_entity,"")];case"body":return[this._row("Vikt",e.weight_entity,"kg",1,1),this._row("Fettandel",e.fat_pct_entity,"%",1,1),this._row("Fettmassa",e.fat_mass_entity,"kg",1,1),this._row("Fettfri massa",e.lean_mass_entity,"kg",1,1),this._row("Muskelmassa",e.muscle_entity,"kg",1,1),this._row("Benmassa",e.bone_entity,"kg",1,1),this._row("Puls vid vägning",e.heart_rate_entity,"slag/min")];case"activity":return[this._row("Steg",t.steps_entity,""),this._row("Aktiva kalorier",t.active_kcal_entity,"kcal"),this._row("Total förbrukning",t.total_kcal_entity,"kcal"),this._row("Kalorimål",t.target_kcal_entity,"kcal"),this._row("Aktivitetspoäng",t.activity_score_entity,""),this._row("MET-minuter hög",t.high_met_entity,"min"),this._row("MET-minuter medel",t.medium_met_entity,"min"),this._row("MET-minuter låg",t.low_met_entity,"min"),this._row("Träningspass idag",t.workouts_today_entity,"")]}}_note(){switch(this.section){case"body":return"Vikten här kommer direkt från vågen. Kcal-sidan visar morgonvägningen som prognosen räknar på — de skiljer sig om du vägt dig fler gånger under dagen.";case"activity":return"Total förbrukning är Ourings uppskattning och ligger högt: modellens TDEE räknas ut från intag och viktförändring, vilket är ett starkare underlag.";default:return""}}render(){if(!this.hass||!this.config?.health)return U``;const t=this._note();return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${Qi[this.section]}>
          <div class="head">
            <span class="title">${Qi[this.section]}</span>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>${Ot.close}</button>
          </div>
          <div class="grid">
            ${this._rows().map(t=>U`<div class="row"><span class="k">${t.key}</span><span class="v">${t.value}</span></div>`)}
          </div>
          ${t?U`<p class="note">${t}</p>`:q}
        </div>
      </div>
    `}}as.styles=[Tt,Ri,n`
      .grid {
        margin-top: 4px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        min-height: 34px;
      }
      .k {
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .v {
        font: 600 13.5px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .note {
        margin-top: 16px;
        font: 400 12.5px var(--hub-font-body);
        line-height: 1.45;
        color: var(--hub-text-dim);
      }
    `],t([gt({attribute:!1})],as.prototype,"config",void 0),t([gt({attribute:!1})],as.prototype,"section",void 0),customElements.define("hub-health-popup",as);const is={kluster:"Kluster",nas:"NAS",media:"Media",drift:"Drift"},ss=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:1}),rs=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:2});class ns extends vt{constructor(){super(...arguments),this.section="kluster",this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}_num(t){return t?Ht(this.getState(t)):null}_text(t){if(!t)return"–";const e=this.getState(t);return"unavailable"===e||"unknown"===e||""===e?"–":e}_int(t,e,a=""){const i=this._num(e);return{key:t,value:null===i?"–":`${Math.round(i)}${a?` ${a}`:""}`}}_rows(){const t=this.config?.system??{},e=t.cluster??{},a=t.nas??{},i=t.media??{},s=t.alerts??{};switch(this.section){case"kluster":{const t=this._num(e.nodes_ready_entity),a=this._num(e.nodes_total_entity);return[{key:"Noder redo",value:null===t||null===a?"–":`${t} av ${a}`},{key:"CPU (alla noder)",value:ne(this._num(e.cpu_entity))},{key:"Minne (alla noder)",value:ne(this._num(e.mem_entity))},this._int("Poddar igång",e.pods_running_entity),this._int("Poddar med problem",e.pods_unhealthy_entity),this._int("Omstarter senaste timmen",e.restarts_entity),this._int("Varmaste nod",e.temp_entity,"°C"),{key:"Kortaste drifttid",value:ie(this._num(e.uptime_entity))}]}case"nas":{const t=this._num(a.volume1_free_entity),e=this._num(a.volume2_free_entity);return[{key:"CPU",value:ne(this._num(a.cpu_entity))},{key:"Minne",value:ne(this._num(a.mem_entity))},this._int("CPU-temperatur",a.cpu_temp_entity,"°C"),this._int("NVMe-temperatur (max)",a.nvme_temp_entity,"°C"),{key:"Volume 1 ledigt (media)",value:null===t?"–":`${oe(t)} · ${ne(this._num(a.volume1_used_entity))} använt`},{key:"Volume 2 ledigt (appar, SSD)",value:null===e?"–":`${Math.round(e)} GB · ${ne(this._num(a.volume2_used_entity))} använt`},this._int("Containrar igång",a.containers_entity),{key:"Drifttid",value:ie(this._num(a.uptime_entity))},{key:"Senaste backup",value:`${se(this._num(a.backup_age_entity))} sedan`},{key:"Backupens storlek",value:(()=>{const t=this._num(a.backup_size_entity);return null===t?"–":`${ss.format(t)} GB`})()}]}case"media":{const t=this._num(i.jellyfin_cpu_entity),e=this._num(i.jellyfin_mem_entity);return[this._int("Jellyfin-strömmar just nu",i.jellyfin_streams_entity),{key:"Jellyfin CPU",value:null===t?"–":`${rs.format(t)} kärnor`},{key:"Jellyfin minne (process)",value:null===e?"–":`${rs.format(e)} GB`},{key:"Torrent uppladdning",value:re(this._num(i.torrent_up_entity))},{key:"Torrent nedladdning",value:re(this._num(i.torrent_down_entity))}]}case"drift":return[this._int("Larm som ringer",s.count_entity),{key:"Vilka",value:this._text(s.names_entity)},this._int("Flux: misslyckade",e.flux_failing_entity),this._int("Certifikat går ut om",e.certs_days_entity,"dagar"),{key:"Senaste NAS-backup",value:`${se(this._num(a.backup_age_entity))} sedan`},{key:"Fördjupning",value:this.config?.system?.grafana_url??"grafana.rutberg.dev"}]}}_note(){switch(this.section){case"nas":return"Minnet här är processernas verkliga minne. UGOS egen RAM-stapel räknar även filcachen, så den ser mycket högre ut när Jellyfin läser igenom biblioteket.";case"media":return"Hög Jellyfin-CPU utan strömmar betyder oftast att Intro Skipper eller trickplay jobbar med nyimporterade avsnitt. Det går över av sig självt.";case"drift":return"Larm når telefonen via Home Assistant. Här visas bara sådant som kräver en hand — Watchdog och info-larm räknas inte.";default:return""}}render(){if(!this.hass||!this.config?.system)return U``;const t=this._note();return U`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${is[this.section]}>
          <div class="head">
            <span class="title">${is[this.section]}</span>
            <button class="close" aria-label="Stäng" @click=${()=>this._close()}>${Ot.close}</button>
          </div>
          <div class="grid">
            ${this._rows().map(t=>U`<div class="row"><span class="k">${t.key}</span><span class="v">${t.value}</span></div>`)}
          </div>
          ${t?U`<p class="note">${t}</p>`:q}
        </div>
      </div>
    `}}ns.styles=[Tt,Ri,n`
      .grid {
        margin-top: 4px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        min-height: 34px;
      }
      .k {
        font: 500 13.5px var(--hub-font-body);
        color: var(--hub-text-muted);
      }
      .v {
        font: 600 13.5px var(--hub-font-body);
        color: var(--hub-text);
        font-variant-numeric: tabular-nums;
        text-align: right;
        max-width: 60%;
        overflow-wrap: anywhere;
      }
      .note {
        margin-top: 16px;
        font: 400 12.5px var(--hub-font-body);
        line-height: 1.45;
        color: var(--hub-text-dim);
      }
    `],t([gt({attribute:!1})],ns.prototype,"config",void 0),t([gt({attribute:!1})],ns.prototype,"section",void 0),customElements.define("hub-system-popup",ns);const os={hem:{label:"Hem",icon:"home",tone:"neutral"},ljus:{label:"Ljus",icon:"lamp",tone:"amber"},media:{label:"Media",icon:"note",tone:"teal"},energi:{label:"Energi",icon:"bolt",tone:"green"},kcal:{label:"Kcal",icon:"ring",tone:"lavender"},vecka:{label:"Vecka",icon:"calendar",tone:"lavender"},halsa:{label:"Hälsa",icon:"pulse",tone:"lavender"},system:{label:"System",icon:"server",tone:"neutral"}};class ls extends ht{constructor(){super(...arguments),this.pages=[],this.active=0}_select(t){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:t},bubbles:!0,composed:!0}))}render(){return U`
      <nav>
        <div class="rail"></div>
        <div class="items">
          ${this.pages.map((t,e)=>{const a=function(t){const e=os[t];return e?{id:t,...e}:{id:t,label:t.charAt(0).toUpperCase()+t.slice(1),icon:"",tone:"neutral"}}(t),i=e===this.active,s=Ot[a.icon];return U`
              <button
                class="item tone-${a.tone} ${i?"active":""}"
                aria-label=${a.label}
                aria-current=${i?"page":q}
                @click=${()=>this._select(t)}
              >
                <span class="pill">
                  ${s?U`<span class="icon">${s}</span>`:q}
                </span>
                <span class="label">${a.label}</span>
              </button>
            `})}
        </div>
        <div class="rail controls">
          <slot name="controls"></slot>
        </div>
      </nav>
    `}}ls.styles=[Tt,n`
      :host {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 30;
        display: block;
      }
      nav {
        display: flex;
        align-items: stretch;
        height: var(--hub-nav-h);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        box-sizing: border-box;
        background: var(--hub-navbar-bg);
        border-top: 1px solid var(--hub-navbar-border);
        backdrop-filter: blur(24px) saturate(1.4);
        -webkit-backdrop-filter: blur(24px) saturate(1.4);
      }
      /* Three-column bar: an empty left rail balances the right control
         cluster so the 5 nav items stay optically centred at any width. */
      .rail {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        align-items: center;
      }
      .rail.controls {
        justify-content: flex-end;
        gap: 4px;
        padding-right: 12px;
      }
      /* Quiet divider between the nav items and the theme/kiosk controls. */
      .rail.controls::before {
        content: '';
        width: 1px;
        height: 26px;
        margin-right: 8px;
        background: var(--hub-card-border);
      }
      .items {
        flex: 0 0 auto;
        display: flex;
        align-items: stretch;
      }
      .item {
        flex: 0 0 auto;
        min-width: 64px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--hub-text-dim);
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease;
      }
      .pill {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 30px;
        border-radius: var(--hub-radius-pill);
        border: 1px solid transparent;
        transition:
          background 150ms ease,
          border-color 150ms ease;
      }
      .icon {
        display: flex;
        width: 24px;
        height: 24px;
      }
      .icon svg {
        width: 100%;
        height: 100%;
      }
      .label {
        font: 500 11px var(--hub-font-body);
        letter-spacing: 0.02em;
        color: inherit;
        transition: color 150ms ease;
      }

      /* Active — icon + label take the page's domain colour, and a subtle
         tinted pill sits behind the icon. Mirrors the chip tone tokens. */
      .item.active.tone-neutral {
        color: var(--hub-text);
      }
      .item.active.tone-neutral .pill {
        background: var(--hub-icon-chip-bg);
        border-color: var(--hub-card-border);
      }
      .item.active.tone-amber {
        color: var(--hub-amber-text);
      }
      .item.active.tone-amber .pill {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
      }
      .item.active.tone-green {
        color: var(--hub-green);
      }
      .item.active.tone-green .pill {
        background: var(--hub-green-bg);
        border-color: var(--hub-green-border);
      }
      .item.active.tone-teal {
        color: var(--hub-teal-text);
      }
      .item.active.tone-teal .pill {
        background: var(--hub-teal-bg);
        border-color: var(--hub-teal-border);
      }
      .item.active.tone-lavender {
        color: var(--hub-lavender-text);
      }
      .item.active.tone-lavender .pill {
        background: var(--hub-lavender-bg);
        border-color: var(--hub-lavender-border);
      }
    `],t([gt({attribute:!1})],ls.prototype,"pages",void 0),t([gt({type:Number})],ls.prototype,"active",void 0),customElements.define("hub-nav-bar",ls);const hs=["hem","ljus","media","energi","kcal","vecka","halsa","system"],cs={hem:"Hem",ljus:"Ljus",media:"Media",energi:"Energi",kcal:"Kcal",vecka:"Vecka",halsa:"Hälsa",system:"System"};const ds=["auto","dag","natt"];let ps=0;class us extends vt{constructor(){super(...arguments),this.theme="natt",this.kiosk=new URLSearchParams(location.search).has("kiosk"),this._page=0,this._dragX=0,this._openRoom=null,this._openLight=null,this._openTransit=!1,this._openWeather=!1,this._openLights=!1,this._openVacuum=!1,this._openCar=!1,this._openTodo=!1,this._openCalendar=!1,this._openHealth=null,this._openSystem=null,this._weatherBgOn=Pt(),this._override=function(){const t=localStorage.getItem(Nt);return"natt"===t||"dag"===t?t:"auto"}(),this._pointerActive=!1,this._dragging=!1,this._startX=0,this._startY=0,this._lastX=0,this._lastT=0,this._velocity=0,this._onRoomOpen=t=>{const e=t.detail?.roomId;this._openRoom=this._cfg?.rooms?.find(t=>t.id===e)??null},this._onLightOpen=t=>{const e=t.detail;this._openLight=e?.entity?{entity:e.entity,name:e.name??e.entity}:null},this._onGotoPage=t=>{const e=t.detail?.page;e&&this.goToPage(e)},this._onTransitOpen=()=>{this._openTransit=!0},this._onLightsOpen=()=>{this._openLights=!0},this._onHealthOpen=t=>{this._openHealth=t.detail?.section??null},this._onSystemOpen=t=>{this._openSystem=t.detail?.section??null},this._onVacuumOpen=()=>{this._openVacuum=!0},this._onCarOpen=()=>{this._openCar=!0},this._onTodoOpen=()=>{this._openTodo=!0},this._onCalendarOpen=()=>{this._openCalendar=!0},this._onWeatherOpen=()=>{this._openWeather=!0},this._onWeatherBgToggle=t=>{this._weatherBgOn=t.detail?.on??Pt(),Dt(this._weatherBgOn)},this._onPopupClose=()=>{this._openRoom=null,this._openLight=null,this._openTransit=!1,this._openWeather=!1,this._openLights=!1,this._openVacuum=!1,this._openCar=!1,this._openTodo=!1,this._openCalendar=!1,this._openHealth=null,this._openSystem=null},this._onAnyInteraction=()=>{this._resetIdle()},this._onPointerDown=t=>{this._pointerActive=!0,this._dragging=!1,this._startX=t.clientX,this._startY=t.clientY,this._lastX=t.clientX,this._lastT=t.timeStamp,this._velocity=0,this._dragX=0},this._onPointerMove=t=>{if(!this._pointerActive)return;const e=t.clientX-this._startX,a=t.clientY-this._startY;if(!this._dragging){if(!Lt(e)&&!Lt(a))return;if(!function(t,e){return Math.abs(t)>Math.abs(e)}(e,a))return void(this._pointerActive=!1);this._dragging=!0,t.currentTarget.setPointerCapture?.(t.pointerId),this._lastX=t.clientX,this._lastT=t.timeStamp}const i=t.timeStamp-this._lastT;i>0&&(this._velocity=(t.clientX-this._lastX)/i),this._lastX=t.clientX,this._lastT=t.timeStamp,this._dragX=e},this._onPointerUp=t=>{if(!this._pointerActive)return;const e=this._dragging;if(this._pointerActive=!1,this._dragging=!1,e){t.currentTarget.releasePointerCapture?.(t.pointerId);const e=this.clientWidth||window.innerWidth;this._page=function(t,e,a,i,s){const r=.2*e,n=Math.abs(a)>.5;let o=i;return t<-r||n&&a<-.5?o=i+1:(t>r||n&&a>.5)&&(o=i-1),Math.max(0,Math.min(s-1,o))}(this._dragX,e,this._velocity,this._page,this._pages.length),ps=this._page}this._dragX=0,this._velocity=0}}setConfig(t){super.setConfig(t)}get _cfg(){return this._config}get _pages(){return this._cfg?.pages??hs}connectedCallback(){super.connectedCallback(),function(){if(document.getElementById("glass-hub-fonts"))return;const t=document.createElement("style");t.id="glass-hub-fonts",t.textContent="\n@font-face{font-family:'Outfit';src:url('/local/glass-cards/fonts/outfit-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n@font-face{font-family:'Inter';src:url('/local/glass-cards/fonts/inter-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n",document.head.appendChild(t)}(),this._applyTheme(),this._page=ps,this._resetIdle(),this._startKioskDrawerShim(),function(){const t=new URLSearchParams(location.search).get("weather");t&&(zt=t),window.__hubForceWeather=t=>{zt=t,window.dispatchEvent(new CustomEvent("hub-weather-force"))}}(),this.addEventListener("pointerdown",this._onAnyInteraction),this.addEventListener("hub-room-open",this._onRoomOpen),this.addEventListener("hub-light-open",this._onLightOpen),this.addEventListener("hub-transit-open",this._onTransitOpen),this.addEventListener("hub-goto-page",this._onGotoPage),this.addEventListener("hub-popup-close",this._onPopupClose),this.addEventListener("hub-weather-open",this._onWeatherOpen),this.addEventListener("hub-lights-open",this._onLightsOpen),this.addEventListener("hub-vacuum-open",this._onVacuumOpen),this.addEventListener("hub-car-open",this._onCarOpen),this.addEventListener("hub-todo-open",this._onTodoOpen),this.addEventListener("hub-calendar-open",this._onCalendarOpen),this.addEventListener("hub-health-open",this._onHealthOpen),this.addEventListener("hub-system-open",this._onSystemOpen),this.addEventListener("hub-weather-bg-toggle",this._onWeatherBgToggle)}disconnectedCallback(){super.disconnectedCallback(),this._clearIdle(),void 0!==this._kioskTimer&&(clearInterval(this._kioskTimer),this._kioskTimer=void 0),this.removeEventListener("pointerdown",this._onAnyInteraction),this.removeEventListener("hub-room-open",this._onRoomOpen),this.removeEventListener("hub-light-open",this._onLightOpen),this.removeEventListener("hub-transit-open",this._onTransitOpen),this.removeEventListener("hub-goto-page",this._onGotoPage),this.removeEventListener("hub-popup-close",this._onPopupClose),this.removeEventListener("hub-weather-open",this._onWeatherOpen),this.removeEventListener("hub-lights-open",this._onLightsOpen),this.removeEventListener("hub-vacuum-open",this._onVacuumOpen),this.removeEventListener("hub-car-open",this._onCarOpen),this.removeEventListener("hub-todo-open",this._onTodoOpen),this.removeEventListener("hub-calendar-open",this._onCalendarOpen),this.removeEventListener("hub-health-open",this._onHealthOpen),this.removeEventListener("hub-system-open",this._onSystemOpen),this.removeEventListener("hub-weather-bg-toggle",this._onWeatherBgToggle)}willUpdate(t){t.has("hass")&&this._applyTheme()}goToPage(t){const e=this._pages.indexOf(t);e>=0&&(this._page=e,ps=e,this._dragX=0)}_applyTheme(){const t=this.hass?.states["sun.sun"]?.attributes?.elevation,e="number"==typeof t?t:null;this.theme=function(t,e,a=4){return"auto"!==e?e:null===t?"natt":t>a?"dag":"natt"}(e,this._override,this._cfg?.day_elevation??4)}_cycleTheme(){const t=ds.indexOf(this._override);this._override=ds[(t+1)%ds.length],function(t){localStorage.setItem(Nt,t)}(this._override),this._applyTheme()}_toggleKiosk(){const t=new URLSearchParams(location.search);t.has("kiosk")?t.delete("kiosk"):t.set("kiosk","true");const e=t.toString();location.assign(location.pathname+(e?`?${e}`:""))}_resetIdle(){this._clearIdle();const t=this._cfg?.idle_return_s??120;this._idleTimer=window.setTimeout(()=>{0!==this._page&&this.goToPage(this._pages[0])},1e3*t)}_clearIdle(){void 0!==this._idleTimer&&(clearTimeout(this._idleTimer),this._idleTimer=void 0)}_startKioskDrawerShim(){if(!new URLSearchParams(location.search).has("kiosk"))return;const t=Date.now(),e=()=>{const t=document.querySelector("home-assistant")?.shadowRoot?.querySelector("home-assistant-main");if(!t)return!1;t.style.setProperty("--mdc-drawer-width","0px");const e=t.shadowRoot?.querySelector("ha-drawer");return e?.style.setProperty("--mdc-drawer-width","0px"),!0};e()||(this._kioskTimer=window.setInterval(()=>{(e()||Date.now()-t>5e3)&&(clearInterval(this._kioskTimer),this._kioskTimer=void 0)},250))}_themeGlyph(){return"auto"===this._override?U`<span class="glyph-auto">A</span>`:"dag"===this._override?G`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"></circle>
        <line x1="12" y1="2" x2="12" y2="5"></line>
        <line x1="12" y1="19" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="5" y2="12"></line>
        <line x1="19" y1="12" x2="22" y2="12"></line>
        <line x1="4.9" y1="4.9" x2="7" y2="7"></line>
        <line x1="17" y1="17" x2="19.1" y2="19.1"></line>
        <line x1="4.9" y1="19.1" x2="7" y2="17"></line>
        <line x1="17" y1="7" x2="19.1" y2="4.9"></line>
      </svg>`:G`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a6.5 6.5 0 1 0 10.5 10.5z"></path>
    </svg>`}render(){const t=this._pages,e=t.length,a=`--page-count:${e};width:calc(100% * ${e});transform:translateX(calc(${-this._page} * 100% / ${e} + ${this._dragX}px));transition:${this._dragging?"none":"transform 320ms cubic-bezier(.3,.7,.3,1)"};`;return U`
      <div
        class="strip"
        style=${a}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
      >
        ${t.map(e=>U`
            <section class="page" data-page-id=${e}>
              ${"hem"===e?U`<hub-home-page
                    .hass=${this.hass}
                    .config=${this._cfg}
                    .theme=${this.theme}
                    .weatherBg=${this._weatherBgOn}
                    .pageActive=${"hem"===t[this._page]}
                  ></hub-home-page>`:"ljus"===e?U`<hub-lights-page
                      .hass=${this.hass}
                      .config=${this._cfg}
                    ></hub-lights-page>`:"energi"===e?U`<hub-energy-page
                        .hass=${this.hass}
                        .config=${this._cfg}
                      ></hub-energy-page>`:"media"===e?U`<hub-media-page
                          .hass=${this.hass}
                          .config=${this._cfg}
                        ></hub-media-page>`:"kcal"===e?U`<hub-kcal-page
                            .hass=${this.hass}
                            .config=${this._cfg}
                          ></hub-kcal-page>`:"vecka"===e?U`<hub-planner-page
                              .hass=${this.hass}
                              .config=${this._cfg}
                            ></hub-planner-page>`:"halsa"===e?U`<hub-health-page
                                .hass=${this.hass}
                                .config=${this._cfg}
                              ></hub-health-page>`:"system"===e?U`<hub-system-page
                                  .hass=${this.hass}
                                  .config=${this._cfg}
                                ></hub-system-page>`:U`<h1 class="page-placeholder">${function(t){return cs[t]??t.charAt(0).toUpperCase()+t.slice(1)}(e)}</h1>`}
            </section>
          `)}
      </div>

      <hub-nav-bar .pages=${t} .active=${this._page}>
        <button
          slot="controls"
          class="kiosk-toggle"
          aria-label=${this.kiosk?"Avsluta helskärm":"Helskärmsläge"}
          @click=${this._toggleKiosk}
        >
          ${this.kiosk?Ot.compress:Ot.expand}
        </button>
        <button
          slot="controls"
          class="theme-toggle"
          aria-label="Byt tema"
          @click=${this._cycleTheme}
        >
          ${this._themeGlyph()}
        </button>
      </hub-nav-bar>

      ${this._openRoom?U`<hub-room-popup
            .hass=${this.hass}
            .room=${this._openRoom}
          ></hub-room-popup>`:q}
      ${this._openLight?U`<hub-light-popup
            .hass=${this.hass}
            .entity=${this._openLight.entity}
            .name=${this._openLight.name}
          ></hub-light-popup>`:q}
      ${this._openTransit?U`<hub-transit-popup
            .hass=${this.hass}
            .config=${this._cfg}
          ></hub-transit-popup>`:q}
      ${this._openWeather?U`<hub-weather-popup
            .hass=${this.hass}
            .config=${this._cfg}
          ></hub-weather-popup>`:q}
      ${this._openLights?U`<hub-lights-modal .hass=${this.hass} .config=${this._cfg}></hub-lights-modal>`:q}
      ${this._openVacuum?U`<hub-vacuum-popup .hass=${this.hass} .config=${this._cfg}></hub-vacuum-popup>`:q}
      ${this._openCar?U`<hub-car-popup .hass=${this.hass} .config=${this._cfg}></hub-car-popup>`:q}
      ${this._openTodo?U`<hub-todo-popup .hass=${this.hass} .config=${this._cfg}></hub-todo-popup>`:q}
      ${this._openCalendar?U`<hub-calendar-popup .hass=${this.hass} .config=${this._cfg}></hub-calendar-popup>`:q}
      ${this._openHealth?U`<hub-health-popup
            .hass=${this.hass}
            .config=${this._cfg}
            .section=${this._openHealth}
          ></hub-health-popup>`:q}
      ${this._openSystem?U`<hub-system-popup
            .hass=${this.hass}
            .config=${this._cfg}
            .section=${this._openSystem}
          ></hub-system-popup>`:q}
    `}}us.styles=[Tt,n`
      :host {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        overflow: hidden;
        background: var(--hub-surface);
        color: var(--hub-text);
        font-family: var(--hub-font-body);
        transition: background var(--hub-fade) ease;
        -webkit-tap-highlight-color: transparent;
      }
      /* Outside kiosk mode HA still shows its own header on top of us; inset
         the whole hub so the top row clears it. HA exposes --header-height. */
      :host(:not([kiosk])) {
        padding-top: var(--header-height, 56px);
      }

      .strip {
        display: flex;
        height: 100%;
        will-change: transform;
        touch-action: pan-y;
      }

      .page {
        flex: 0 0 calc(100% / var(--page-count));
        height: 100%;
        box-sizing: border-box;
        padding-bottom: var(--hub-nav-h);
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        position: relative;
      }

      /* Desktop: cap and center each page's content instead of stretching. */
      @media (min-width: 1600px) {
        .page > * {
          display: block;
          max-width: 1560px;
          margin-inline: auto;
        }
      }

      .page-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        margin: 0;
        font-family: var(--hub-font-display);
        font-weight: 300;
        font-size: clamp(32px, 6vw, 64px);
        color: var(--hub-text-muted);
        letter-spacing: 0.02em;
      }

      /* Quiet control cluster — slotted into the nav bar's right edge. */
      .theme-toggle,
      .kiosk-toggle {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--hub-text-dim);
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: color 150ms ease;
      }
      .theme-toggle svg,
      .kiosk-toggle svg {
        width: 24px;
        height: 24px;
      }
      .theme-toggle .glyph-auto {
        font-family: var(--hub-font-display);
        font-weight: 500;
        font-size: 20px;
      }
    `],t([gt({reflect:!0,attribute:"data-theme"})],us.prototype,"theme",void 0),t([gt({reflect:!0,type:Boolean})],us.prototype,"kiosk",void 0),t([bt()],us.prototype,"_page",void 0),t([bt()],us.prototype,"_dragX",void 0),t([bt()],us.prototype,"_openRoom",void 0),t([bt()],us.prototype,"_openLight",void 0),t([bt()],us.prototype,"_openTransit",void 0),t([bt()],us.prototype,"_openWeather",void 0),t([bt()],us.prototype,"_openLights",void 0),t([bt()],us.prototype,"_openVacuum",void 0),t([bt()],us.prototype,"_openCar",void 0),t([bt()],us.prototype,"_openTodo",void 0),t([bt()],us.prototype,"_openCalendar",void 0),t([bt()],us.prototype,"_openHealth",void 0),t([bt()],us.prototype,"_openSystem",void 0),t([bt()],us.prototype,"_weatherBgOn",void 0),customElements.define("glass-hub",us);const gs=window;gs.customCards=gs.customCards||[],gs.customCards.push({type:"glass-background",name:"Glass Background",description:"Animated gradient background"},{type:"glass-button",name:"Glass Button",description:"Toggle/info button"},{type:"glass-chip",name:"Glass Chip",description:"Small status pill"},{type:"glass-header",name:"Glass Header",description:"Greeting, weather, status chips"},{type:"glass-room-card",name:"Glass Room Card",description:"Room with sub-buttons and popup"},{type:"glass-light-slider",name:"Glass Light Slider",description:"Brightness slider with glow"},{type:"glass-popup",name:"Glass Popup",description:"Modal overlay"},{type:"glass-nav-bar",name:"Glass Nav Bar",description:"Bottom navigation"},{type:"glass-vacuum-card",name:"Glass Vacuum Card",description:"Vacuum controls"},{type:"glass-info-row",name:"Glass Info Row",description:"Information display"},{type:"glass-section",name:"Glass Section",description:"Section header label"},{type:"glass-departure-card",name:"Glass Departure Card",description:"Train departure list"},{type:"glass-hub",name:"Glass Hub",description:"Full-screen wall hub"}),console.info("%c GLASS CARDS %c v0.1.0 ","color: white; background: #4FC3F7; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;","color: #4FC3F7; background: rgba(79,195,247,0.1); padding: 2px 6px; border-radius: 0 4px 4px 0;");
