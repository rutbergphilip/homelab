function t(t,e,i,a){var s,r=arguments.length,n=r<3?e:null===a?a=Object.getOwnPropertyDescriptor(e,i):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,i,a);else for(var o=t.length-1;o>=0;o--)(s=t[o])&&(n=(r<3?s(n):r>3?s(e,i,n):s(e,i))||n);return r>3&&n&&Object.defineProperty(e,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),s=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(e,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,a)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[a+1],t[0]);return new r(i,t,a)},o=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,a))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,g=globalThis,b=g.trustedTypes,m=b?b.emptyScript:"",v=g.reactiveElementPolyfillSupport,f=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?m:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!l(t,e),_={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=_){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(t,i,e);void 0!==a&&c(this.prototype,t,a)}}static getPropertyDescriptor(t,e,i){const{get:a,set:s}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:a,set(e){const r=a?.call(this);s?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??_}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,a)=>{if(i)t.adoptedStyleSheets=a.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of a){const a=document.createElement("style"),s=e.litNonce;void 0!==s&&a.setAttribute("nonce",s),a.textContent=i.cssText,t.appendChild(a)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),a=this.constructor._$Eu(t,i);if(void 0!==a&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(e,i.type);this._$Em=t,null==s?this.removeAttribute(a):this.setAttribute(a,s),this._$Em=null}}_$AK(t,e){const i=this.constructor,a=i._$Eh.get(t);if(void 0!==a&&this._$Em!==a){const t=i.getPropertyOptions(a),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=a;const r=s.fromAttribute(e,t.type);this[a]=r??this._$Ej?.get(a)??r,this._$Em=null}}requestUpdate(t,e,i,a=!1,s){if(void 0!==t){const r=this.constructor;if(!1===a&&(s=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??y)(s,e)||i.useDefault&&i.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:a,wrapped:s},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==s||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===a&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,a=this[e];!0!==t||this._$AL.has(e)||void 0===a||this.C(e,void 0,i,a)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[f("elementProperties")]=new Map,w[f("finalized")]=new Map,v?.({ReactiveElement:w}),(g.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,k=t=>t,C=$.trustedTypes,E=C?C.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+A,T=`<${M}>`,N=document,z=()=>N.createComment(""),P=t=>null===t||"object"!=typeof t&&"function"!=typeof t,F=Array.isArray,j="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,I=/>/g,O=RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,U=/"/g,B=/^(?:script|style|textarea|title)$/i,L=t=>(e,...i)=>({_$litType$:t,strings:e,values:i}),V=L(1),X=L(2),G=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),W=new WeakMap,Y=N.createTreeWalker(N,129);function K(t,e){if(!F(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const Z=(t,e)=>{const i=t.length-1,a=[];let s,r=2===e?"<svg>":3===e?"<math>":"",n=D;for(let e=0;e<i;e++){const i=t[e];let o,l,c=-1,h=0;for(;h<i.length&&(n.lastIndex=h,l=n.exec(i),null!==l);)h=n.lastIndex,n===D?"!--"===l[1]?n=H:void 0!==l[1]?n=I:void 0!==l[2]?(B.test(l[2])&&(s=RegExp("</"+l[2],"g")),n=O):void 0!==l[3]&&(n=O):n===O?">"===l[0]?(n=s??D,c=-1):void 0===l[1]?c=-2:(c=n.lastIndex-l[2].length,o=l[1],n=void 0===l[3]?O:'"'===l[3]?U:R):n===U||n===R?n=O:n===H||n===I?n=D:(n=O,s=void 0);const d=n===O&&t[e+1].startsWith("/>")?" ":"";r+=n===D?i+T:c>=0?(a.push(o),i.slice(0,c)+S+i.slice(c)+A+d):i+A+(-2===c?e:d)}return[K(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),a]};class J{constructor({strings:t,_$litType$:e},i){let a;this.parts=[];let s=0,r=0;const n=t.length-1,o=this.parts,[l,c]=Z(t,e);if(this.el=J.createElement(l,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(a=Y.nextNode())&&o.length<n;){if(1===a.nodeType){if(a.hasAttributes())for(const t of a.getAttributeNames())if(t.endsWith(S)){const e=c[r++],i=a.getAttribute(t).split(A),n=/([.?@])?(.*)/.exec(e);o.push({type:1,index:s,name:n[2],strings:i,ctor:"."===n[1]?at:"?"===n[1]?st:"@"===n[1]?rt:it}),a.removeAttribute(t)}else t.startsWith(A)&&(o.push({type:6,index:s}),a.removeAttribute(t));if(B.test(a.tagName)){const t=a.textContent.split(A),e=t.length-1;if(e>0){a.textContent=C?C.emptyScript:"";for(let i=0;i<e;i++)a.append(t[i],z()),Y.nextNode(),o.push({type:2,index:++s});a.append(t[e],z())}}}else if(8===a.nodeType)if(a.data===M)o.push({type:2,index:s});else{let t=-1;for(;-1!==(t=a.data.indexOf(A,t+1));)o.push({type:7,index:s}),t+=A.length-1}s++}}static createElement(t,e){const i=N.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,a){if(e===G)return e;let s=void 0!==a?i._$Co?.[a]:i._$Cl;const r=P(e)?void 0:e._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),void 0===r?s=void 0:(s=new r(t),s._$AT(t,i,a)),void 0!==a?(i._$Co??=[])[a]=s:i._$Cl=s),void 0!==s&&(e=Q(t,s._$AS(t,e.values),s,a)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,a=(t?.creationScope??N).importNode(e,!0);Y.currentNode=a;let s=Y.nextNode(),r=0,n=0,o=i[0];for(;void 0!==o;){if(r===o.index){let e;2===o.type?e=new et(s,s.nextSibling,this,t):1===o.type?e=new o.ctor(s,o.name,o.strings,this,t):6===o.type&&(e=new nt(s,this,t)),this._$AV.push(e),o=i[++n]}r!==o?.index&&(s=Y.nextNode(),r++)}return Y.currentNode=N,a}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,a){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),P(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==G&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>F(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&P(this._$AH)?this._$AA.nextSibling.data=t:this.T(N.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,a="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(K(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(e);else{const t=new tt(a,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=W.get(t.strings);return void 0===e&&W.set(t.strings,e=new J(t)),e}k(t){F(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,a=0;for(const s of t)a===e.length?e.push(i=new et(this.O(z()),this.O(z()),this,this.options)):i=e[a],i._$AI(s),a++;a<e.length&&(this._$AR(i&&i._$AB.nextSibling,a),e.length=a)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class it{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,a,s){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=a,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(t,e=this,i,a){const s=this.strings;let r=!1;if(void 0===s)t=Q(this,t,e,0),r=!P(t)||t!==this._$AH&&t!==G,r&&(this._$AH=t);else{const a=t;let n,o;for(t=s[0],n=0;n<s.length-1;n++)o=Q(this,a[i+n],e,n),o===G&&(o=this._$AH[n]),r||=!P(o)||o!==this._$AH[n],o===q?t=q:t!==q&&(t+=(o??"")+s[n+1]),this._$AH[n]=o}r&&!a&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class at extends it{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class st extends it{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class rt extends it{constructor(t,e,i,a,s){super(t,e,i,a,s),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??q)===G)return;const i=this._$AH,a=t===q&&i!==q||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,s=t!==q&&(i===q||a);a&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const ot=$.litHtmlPolyfillSupport;ot?.(J,et),($.litHtmlVersions??=[]).push("3.3.2");const lt=globalThis;class ct extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const a=i?.renderBefore??e;let s=a._$litPart$;if(void 0===s){const t=i?.renderBefore??null;a._$litPart$=s=new et(e.insertBefore(z(),t),t,void 0,i??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}ct._$litElement$=!0,ct.finalized=!0,lt.litElementHydrateSupport?.({LitElement:ct});const ht=lt.litElementPolyfillSupport;ht?.({LitElement:ct}),(lt.litElementVersions??=[]).push("4.2.2");const dt=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},pt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:y},ut=(t=pt,e,i)=>{const{kind:a,metadata:s}=i;let r=globalThis.litPropertyMetadata.get(s);if(void 0===r&&globalThis.litPropertyMetadata.set(s,r=new Map),"setter"===a&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===a){const{name:a}=i;return{set(i){const s=e.get.call(this);e.set.call(this,i),this.requestUpdate(a,s,t,!0,i)},init(e){return void 0!==e&&this.C(a,void 0,t,e),e}}}if("setter"===a){const{name:a}=i;return function(i){const s=this[a];e.call(this,i),this.requestUpdate(a,s,t,!0,i)}}throw Error("Unsupported decorator location: "+a)};function gt(t){return(e,i)=>"object"==typeof i?ut(t,e,i):((t,e,i)=>{const a=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),a?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function bt(t){return gt({...t,state:!0,attribute:!1})}let mt=class extends ct{constructor(){super(...arguments),this._cards=[],this._activeView=null,this._cardConfigs=[],this._boundHashChange=this._onHashChange.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._boundHashChange),this._activeView=this._getViewFromHash()??this._config?.default_view??null}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._boundHashChange)}_onHashChange(){const t=this._getViewFromHash();null!==t&&(this._activeView=t),location.hash&&"#"!==location.hash||(this._activeView=this._config?.default_view??null)}_getViewFromHash(){const t=location.hash.replace("#","");if(!t)return null;return(this._config?.views??[]).includes(t)?t:null}setConfig(t){this._config=t,this._activeView=this._getViewFromHash()??t.default_view??null,this._createCards()}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createCards(){this._config.cards&&(this._cardConfigs=this._config.cards,this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),i}),this.requestUpdate())}render(){const t=this._cards.filter((t,e)=>{const i=this._cardConfigs[e];return!i||!i.view||i.view===this._activeView});return V`
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
    `],t([gt({attribute:!1})],mt.prototype,"_config",void 0),t([gt({attribute:!1})],mt.prototype,"_cards",void 0),t([bt()],mt.prototype,"_activeView",void 0),mt=t([dt("glass-background")],mt);class vt extends ct{constructor(){super(...arguments),this._trackedEntities=[],this._previousStates={}}setConfig(t){this._config=t}setTrackedEntities(t){this._trackedEntities=t.filter(Boolean)}shouldUpdate(){if(!this.hass)return!1;if(0===this._trackedEntities.length)return!0;let t=!1;for(const e of this._trackedEntities){const i=this.hass.states[e]?.state;this._previousStates[e]!==i&&(this._previousStates[e]=i,t=!0)}return t}getEntity(t){return this.hass?.states[t]}getState(t){return this.hass?.states[t]?.state??"unavailable"}getEntityAttribute(t,e){return this.hass?.states[t]?.attributes[e]}isOn(t){return"on"===this.getState(t)}callService(t,e,i,a){this.hass?.callService(t,e,i,a?{entity_id:a}:void 0)}toggle(t){const[e]=t.split(".");this.callService(e,"toggle",void 0,t)}getCardSize(){return 1}static get glassStyles(){return n`
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
    `}}t([gt({attribute:!1})],vt.prototype,"hass",void 0),t([gt({attribute:!1})],vt.prototype,"_config",void 0);let ft=class extends vt{get _buttonConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleTap(){const t=this._buttonConfig.tap_action?.action??"toggle";"toggle"===t&&this._config.entity?this.toggle(this._config.entity):"navigate"===t&&this._buttonConfig.tap_action?.navigation_path&&(window.location.hash=this._buttonConfig.tap_action.navigation_path)}render(){if(!this.hass||!this._config)return V``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=!!t&&this.isOn(this._config.entity),i=this._config.name??t?.attributes.friendly_name??"",a=this._config.icon??t?.attributes.icon??"mdi:help-circle";let s="";if(!1!==this._buttonConfig.show_state&&t){const e=t.attributes.unit_of_measurement;s=e?`${t.state} ${e}`:"on"===t.state?"Pa":"off"===t.state?"Av":t.state}return V`
      <div class="glass button ${e?"active":""}" @click=${this._handleTap}>
        <div class="icon-wrap">
          <ha-icon .icon=${a}></ha-icon>
        </div>
        <div class="info">
          <div class="name">${i}</div>
          ${s?V`<div class="state">${s}</div>`:""}
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
    `],ft=t([dt("glass-button")],ft);let xt=class extends vt{setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}get _chipConfig(){return this._config}render(){if(!this.hass||!this._config)return V``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._chipConfig.chip_type??"custom";let i=this._config.icon??"",a="",s=!1;switch(e){case"person":{const e=t?.attributes.friendly_name??"",r=t?.state??"";i=i||"mdi:account",a=`${e} · ${"home"===r?"Hemma":"Borta"}`,s="home"===r;break}case"battery":{const e=t?.state??"?";i=i||"mdi:cellphone",a=`${e} %`,s=Number(e)>20;break}case"lights":{const e=t?.state??"0";i=i||"mdi:lightbulb-group",a=`${e} st`,s=Number(e)>0;break}default:i=i||"mdi:information",a=this._chipConfig.content??t?.state??""}return V`
      <div class="chip ${s?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span class="value">${a}</span>
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
    `],xt=t([dt("glass-chip")],xt);let yt=class extends vt{get _headerConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.weather_entity&&e.push(t.weather_entity),t.chips&&t.chips.forEach(t=>{t.entity&&e.push(t.entity)}),this.setTrackedEntities(e)}_renderChip(t){const e=this.getEntity(t.entity);if(!e)return V``;let i=t.icon??"",a="",s=!1;switch(t.chip_type){case"person":i=i||"mdi:account";a=`${e.attributes.friendly_name??""} · ${"home"===e.state?"Hemma":"Borta"}`,s="home"===e.state;break;case"battery":i=i||"mdi:cellphone",a=`${e.state} %`,s=Number(e.state)>20;break;case"lights":i=i||"mdi:lightbulb-group",a=`${e.state} st`,s=Number(e.state)>0;break;default:i=i||"mdi:information",a=e.state}return V`
      <div class="chip ${s?"active":""}">
        <ha-icon .icon=${i}></ha-icon>
        <span>${a}</span>
      </div>
    `}render(){if(!this.hass||!this._config)return V``;const t=this.hass.user?.name??"",e=!1!==this._headerConfig.greeting?function(t){const e=(new Date).getHours();return e>=5&&e<10?`God morgon, ${t}`:e>=10&&e<17?`Hej, ${t}`:e>=17&&e<22?`God kvall, ${t}`:`God natt, ${t}`}(t):t,i=this._headerConfig.weather_entity?this.getEntity(this._headerConfig.weather_entity):void 0,a=i?.state??"",s=i?.attributes.temperature??"",r=i?.attributes.temperature_unit??"°C",n={"clear-night":"mdi:weather-night",cloudy:"mdi:weather-cloudy",fog:"mdi:weather-fog",hail:"mdi:weather-hail",lightning:"mdi:weather-lightning","lightning-rainy":"mdi:weather-lightning-rainy",partlycloudy:"mdi:weather-partly-cloudy",pouring:"mdi:weather-pouring",rainy:"mdi:weather-rainy",snowy:"mdi:weather-snowy","snowy-rainy":"mdi:weather-snowy-rainy",sunny:"mdi:weather-sunny",windy:"mdi:weather-windy","windy-variant":"mdi:weather-windy-variant",exceptional:"mdi:alert-circle-outline"}[a]??"mdi:weather-cloudy";return V`
      <div class="glass header">
        <div class="top-row">
          <div class="home-icon">
            <ha-icon icon="mdi:home"></ha-icon>
          </div>
          <div class="greeting-section">
            <div class="greeting">${e}</div>
            ${i?V`
              <div class="weather">
                <ha-icon .icon=${n}></ha-icon>
                ${{"clear-night":"Klart",cloudy:"Molnigt",fog:"Dimma",partlycloudy:"Delvis molnigt",rainy:"Regn",snowy:"Sno",sunny:"Soligt",windy:"Blasigt"}[a]??a} \u2022 ${s}${r}
              </div>
            `:""}
          </div>
        </div>
        ${this._headerConfig.chips?.length?V`
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
    `],yt=t([dt("glass-header")],yt);let _t=class extends vt{get _roomConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.sub_buttons&&t.sub_buttons.forEach(t=>e.push(t.entity)),this.setTrackedEntities(e)}_handleCardTap(){this._roomConfig.popup_id&&(window.location.hash=this._roomConfig.popup_id)}_handleSubButtonTap(t,e){t.stopPropagation(),this.toggle(e)}render(){if(!this.hass||!this._config)return V``;const t=this._roomConfig.sub_buttons??[],e=t.map(t=>t.entity);this._config.entity&&!e.includes(this._config.entity)&&e.unshift(this._config.entity);const i=e.some(t=>this.isOn(t)),a=function(t,e){const i=function(t,e){return e.filter(e=>"on"===t[e]?.state).length}(t,e);return 0===i?"Av":1===i?"Pa":`${i} lampor pa`}(this.hass.states,e),s=this._config.icon??"mdi:home",r=this._config.name??"";return V`
      <div class="glass room-card ${i?"active":""}" @click=${this._handleCardTap}>
        <div class="top">
          <div class="room-icon">
            <ha-icon .icon=${s}></ha-icon>
          </div>
          <div class="room-info">
            <div class="room-name">${r}</div>
            <div class="room-status">${a}</div>
          </div>
        </div>
        ${t.length?V`
          <div class="sub-buttons">
            ${t.map(t=>{const e=this.isOn(t.entity),i=t.icon??this.getEntity(t.entity)?.attributes.icon??"mdi:lightbulb";return V`
                <div
                  class="sub-btn ${e?"on":""}"
                  @click=${e=>this._handleSubButtonTap(e,t.entity)}
                  title=${t.name??this.getEntity(t.entity)?.attributes.friendly_name??t.entity}
                >
                  <ha-icon .icon=${i}></ha-icon>
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
    `],_t=t([dt("glass-room-card")],_t);let wt=class extends vt{constructor(){super(...arguments),this._dragging=!1,this._dragValue=0,this._stopEvent=t=>{t.stopPropagation()},this._toggleLight=t=>{t.stopPropagation(),this._config?.entity&&this.toggle(this._config.entity)}}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_handleSliderInteraction(t){if(!this._config.entity)return;const e=this.getEntity(this._config.entity);if(!e||"off"===e.state)return void this.callService("light","turn_on",{brightness_pct:100},this._config.entity);const i=t.currentTarget.getBoundingClientRect(),a=t=>{const e=Math.max(0,Math.min(t-i.left,i.width)),a=Math.round(e/i.width*100);this._dragValue=Math.max(1,Math.min(100,a))},s="touches"in t?t.touches[0].clientX:t.clientX;a(s),this._dragging=!0;const r=t=>{const e="touches"in t?t.touches[0].clientX:t.clientX;a(e)},n=()=>{this._dragging=!1,this.callService("light","turn_on",{brightness_pct:this._dragValue},this._config.entity),document.removeEventListener("mousemove",r),document.removeEventListener("mouseup",n),document.removeEventListener("touchmove",r),document.removeEventListener("touchend",n)};document.addEventListener("mousemove",r),document.addEventListener("mouseup",n),document.addEventListener("touchmove",r,{passive:!0}),document.addEventListener("touchend",n)}render(){if(!this.hass||!this._config?.entity)return V``;const t=this.getEntity(this._config.entity);if(!t)return V``;const e="on"===t.state,i=this._dragging?this._dragValue:function(t){if(!t||"on"!==t.state)return 0;const e=t.attributes.brightness;return e?Math.round(e/255*100):100}(t),a=this._config.name??t.attributes.friendly_name??"",s=this._config.icon??t.attributes.icon??"mdi:lightbulb";return V`
      <div class="glass slider-card ${e?"on":"off"}">
        <div class="slider-header">
          <div class="slider-left">
            <button
              class="light-icon-btn"
              role="button"
              aria-pressed=${e?"true":"false"}
              aria-label=${e?`Släck ${a}`:`Tänd ${a}`}
              @pointerdown=${this._stopEvent}
              @mousedown=${this._stopEvent}
              @touchstart=${this._stopEvent}
              @click=${this._toggleLight}
            >
              <span class="light-icon">
                <ha-icon .icon=${s}></ha-icon>
              </span>
            </button>
            <span class="light-name">${a}</span>
          </div>
          <span class="brightness-value">${e?`${i}%`:"Av"}</span>
        </div>
        <div class="slider-track" @mousedown=${this._handleSliderInteraction} @touchstart=${this._handleSliderInteraction}>
          ${e?V`
            <div class="slider-fill ${this._dragging?"dragging":""}" style="width: ${i}%"></div>
            <div class="slider-glow" style="left: calc(${i}% - 12px)"></div>
          `:V`
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
    `],t([bt()],wt.prototype,"_dragging",void 0),t([bt()],wt.prototype,"_dragValue",void 0),wt=t([dt("glass-light-slider")],wt);const $t=n`
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
`;let kt=class extends ct{constructor(){super(...arguments),this._isOpen=!1,this._isClosing=!1,this._cards=[],this._onHashChange=()=>{this._checkHash()}}connectedCallback(){super.connectedCallback(),window.addEventListener("hashchange",this._onHashChange),this._checkHash()}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}_checkHash(){if(!this._config?.hash)return;const t=window.location.hash.replace("#","");t!==this._config.hash||this._isOpen?t!==this._config.hash&&this._isOpen&&this._close():this._open()}_open(){this._isOpen=!0,this._isClosing=!1,this._createPopupCards()}_close(){this._isClosing=!0,setTimeout(()=>{this._isOpen=!1,this._isClosing=!1},350),window.location.hash.replace("#","")===this._config.hash&&history.replaceState(null,"",window.location.pathname+window.location.search)}_handleBackdropClick(){this._close()}setConfig(t){if(!t.hash)throw new Error('glass-popup requires a "hash" property');this._config=t}set hass(t){this._hass=t,this._cards.forEach(e=>{e.hass=t})}get hass(){return this._hass}_createPopupCards(){this._config?.cards&&(this._cards=this._config.cards.map(t=>{const e=t.type?.startsWith("custom:")?t.type.replace("custom:",""):`hui-${t.type}-card`,i=document.createElement(e);return"function"==typeof i.setConfig&&i.setConfig(t),this.hass&&(i.hass=this.hass),i}),this.requestUpdate())}render(){return this._isOpen||this._isClosing?V`
      <div class="overlay ${this._isOpen&&!this._isClosing?"open":""} ${this._isClosing?"closing":""}">
        <div class="backdrop" @click=${this._handleBackdropClick}></div>
        <div class="panel">
          <div class="handle"></div>
          ${this._config.title?V`
            <div class="popup-header">
              ${this._config.icon?V`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
              <span class="popup-title">${this._config.title}</span>
            </div>
          `:""}
          <div class="popup-cards">
            ${this._cards.map(t=>t)}
          </div>
        </div>
      </div>
    `:V``}getCardSize(){return 0}};kt.styles=[$t,n`
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
    `],t([gt({attribute:!1})],kt.prototype,"_config",void 0),t([bt()],kt.prototype,"_isOpen",void 0),t([bt()],kt.prototype,"_isClosing",void 0),kt=t([dt("glass-popup")],kt);let Ct=class extends ct{constructor(){super(...arguments),this._activeHash="",this._onHashChange=()=>{const t=window.location.hash.replace("#","");this._config.items.some(e=>e.hash===t)&&(this._activeHash=t)}}connectedCallback(){super.connectedCallback(),this._activeHash=window.location.hash.replace("#","")||this._config?.items?.[0]?.hash||"",window.addEventListener("hashchange",this._onHashChange)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("hashchange",this._onHashChange)}setConfig(t){if(!t.items?.length)throw new Error('glass-nav-bar requires "items"');this._config=t}_handleTap(t){this._activeHash=t,window.location.hash=t}render(){return this._config?.items?V`
      <div class="nav-bar">
        ${this._config.items.map(t=>V`
          <div class="nav-item ${this._activeHash===t.hash?"active":""}" @click=${()=>this._handleTap(t.hash)}>
            <ha-icon .icon=${t.icon}></ha-icon>
            <span class="nav-label">${t.label}</span>
          </div>
        `)}
      </div>
    `:V``}getCardSize(){return 0}};Ct.styles=n`
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
  `,t([gt({attribute:!1})],Ct.prototype,"hass",void 0),t([gt({attribute:!1})],Ct.prototype,"_config",void 0),t([bt()],Ct.prototype,"_activeHash",void 0),Ct=t([dt("glass-nav-bar")],Ct);let Et=class extends vt{get _vacuumConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getStatusText(t){return{cleaning:"Stader",docked:"Dockad",paused:"Pausad",returning:"Atergar",idle:"Inaktiv",error:"Fel",unavailable:"Otillganglig"}[t]??t}_start(){this._config.entity&&this.callService("vacuum","start",void 0,this._config.entity)}_stop(){this._config.entity&&this.callService("vacuum","return_to_base",void 0,this._config.entity)}_cleanRoom(t){this._config.entity&&null!=t.room_id&&this.callService("vacuum","send_command",{command:"app_segment_clean",params:[t.room_id]},this._config.entity)}render(){if(!this.hass||!this._config?.entity)return V``;const t=this.getEntity(this._config.entity);if(!t)return V``;const e=t.state,i="cleaning"===e,a="error"===e,s=t.attributes.battery_level,r=this._config.name??t.attributes.friendly_name??"Vacuum",n=this._config.icon??"mdi:robot-vacuum";return V`
      <div
        class="glass vacuum-card ${i?"cleaning":""} ${a?"error":""}"
      >
        <div class="vacuum-header">
          <div class="vacuum-icon">
            <ha-icon .icon=${n}></ha-icon>
          </div>
          <div class="vacuum-info">
            <div class="vacuum-name">${r}</div>
            <div class="vacuum-status">${this._getStatusText(e)}</div>
          </div>
          ${null!=s?V`
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
        ${this._vacuumConfig.rooms?.length?V`
              <div class="rooms">
                ${this._vacuumConfig.rooms.map(t=>V`
                    <div class="room-btn" @click=${()=>this._cleanRoom(t)}>
                      ${t.name}
                    </div>
                  `)}
              </div>
            `:""}
      </div>
    `}};Et.styles=[vt.glassStyles,n`
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
    `],Et=t([dt("glass-vacuum-card")],Et);let St=class extends vt{get _infoConfig(){return this._config}setConfig(t){super.setConfig(t);const e=[];t.entity&&e.push(t.entity),t.secondary_entity&&e.push(t.secondary_entity),t.badge_entity&&e.push(t.badge_entity),this.setTrackedEntities(e)}render(){if(!this.hass||!this._config)return V``;const t=this._config.entity?this.getEntity(this._config.entity):void 0,e=this._config.name??t?.attributes.friendly_name??"",i=this._config.icon??t?.attributes.icon??"mdi:information";let a=t?.state??"";const s=t?.attributes.unit_of_measurement;s&&(a=`${a} ${s}`);const r=this._infoConfig.badge_entity?this.getEntity(this._infoConfig.badge_entity):void 0;return V`
      <div class="glass info-card">
        <div class="info-icon">
          <ha-icon .icon=${i}></ha-icon>
        </div>
        <div class="info-content">
          <div class="info-name">${e}</div>
          <div class="info-value">${a}</div>
        </div>
        ${r?V`
              <div class="badge">
                ${this._infoConfig.badge_icon?V`<ha-icon
                      .icon=${this._infoConfig.badge_icon}
                    ></ha-icon>`:""}
                ${r.state}
              </div>
            `:""}
      </div>
    `}};St.styles=[vt.glassStyles,n`
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
    `],St=t([dt("glass-info-row")],St);let At=class extends ct{set hass(t){}setConfig(t){if(!t.label)throw new Error('glass-section requires a "label" property');this._config=t}render(){return this._config?V`
      <div class="section">
        ${this._config.icon?V`<ha-icon .icon=${this._config.icon}></ha-icon>`:""}
        <span class="label">${this._config.label}</span>
      </div>
    `:V``}getCardSize(){return 0}};At.styles=n`
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
  `,t([gt({attribute:!1})],At.prototype,"_config",void 0),At=t([dt("glass-section")],At);let Mt=class extends vt{get _departureConfig(){return this._config}setConfig(t){super.setConfig(t),t.entity&&this.setTrackedEntities([t.entity])}_getDepartures(){if(!this._config?.entity)return[];return this.getEntityAttribute(this._config.entity,"departures")??[]}_isDelayed(t){if(!t.scheduled||!t.expected)return!1;const e=new Date(t.scheduled).getTime();return new Date(t.expected).getTime()-e>6e4}_isSoon(t){const e=t.display?.toLowerCase()??"",i=e.match(/^(\d+)\s*min/);return i?parseInt(i[1],10)<=5:"nu"===e}_getTimeClass(t){return this._isDelayed(t)?"time delayed":this._isSoon(t)?"time soon":"time"}getCardSize(){return 3}render(){if(!this.hass||!this._config?.entity)return V``;const t=this._getDepartures(),e=this._departureConfig.max_departures??6,i=t.slice(0,e),a=this._departureConfig.station_name??this._departureConfig.name??(t.length>0?t[0].stop_area?.name:void 0)??"Avgångar",s=this._departureConfig.icon??"mdi:train";return V`
      <div class="glass departure-card">
        <div class="departure-header">
          <div class="departure-icon">
            <ha-icon .icon=${s}></ha-icon>
          </div>
          <div class="station-name">${a}</div>
        </div>
        ${0===i.length?V`<div class="empty-state">Inga avgångar</div>`:V`
              <div class="departure-list">
                ${i.map(t=>V`
                    <div class="departure-row">
                      <span class="line-badge">${t.line.designation}</span>
                      <span class="destination">${t.destination}</span>
                      <span class="track">Spår ${t.stop_point.designation}</span>
                      <span class=${this._getTimeClass(t)}>${t.display}</span>
                    </div>
                    ${t.deviations?.length?t.deviations.filter(t=>t.message).map(t=>V`<div class="deviation">${t.message}</div>`):q}
                  `)}
              </div>
            `}
      </div>
    `}};Mt.styles=[vt.glassStyles,n`
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
    `],Mt=t([dt("glass-departure-card")],Mt);const Tt=n`
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
  }
  :host {
    --hub-font-display: 'Outfit', sans-serif;
    --hub-font-body: 'Inter', -apple-system, sans-serif;
    --hub-radius: 18px;
    --hub-radius-lg: 20px;
    --hub-radius-sm: 12px;
    --hub-radius-pill: 99px;
    --hub-gap: 12px;
    --hub-page-pad: clamp(20px, 3vw, 40px);
    --hub-fade: 600ms;
  }
`,Nt="glass-hub-theme";function zt(t,e=8){return Math.abs(t)>e}const Pt=36e5,Ft=new Set(["unavailable","unknown","none",""]);function jt(t){if(!Array.isArray(t))return[];const e=[];for(const i of t){if(!i||"object"!=typeof i)continue;const t=i,a="number"==typeof t.total?t.total:Number(t.total);if(!Number.isFinite(a)||"string"!=typeof t.startsAt)continue;const s=new Date(t.startsAt);Number.isNaN(s.getTime())||e.push({start:s,ore:100*a})}return e.sort((t,e)=>t.start.getTime()-e.start.getTime())}function Dt(t){if(t.length<3)return null;let e=1/0,i=-1;for(let a=0;a+3<=t.length;a++){let s=!0,r=t[a].ore;for(let e=a+1;e<a+3;e++){if(t[e].start.getTime()-t[e-1].start.getTime()!==Pt){s=!1;break}r+=t[e].ore}s&&r<e&&(e=r,i=a)}return i<0?null:{start:t[i].start,end:new Date(t[i+3-1].start.getTime()+Pt)}}function Ht(t,e,i){if(Ft.has(String(e??"").toLowerCase()))return{now:null,level:"normal",today:[],tomorrow:[],cheapestWindow:null};const a=jt(t?.today),s=jt(t?.tomorrow);if(0===a.length&&0===s.length)return{now:null,level:"normal",today:[],tomorrow:[],cheapestWindow:null};const r=[...a,...s].sort((t,e)=>t.start.getTime()-e.start.getTime()),n=i.getTime(),o=r.find(t=>t.start.getTime()<=n&&n<t.start.getTime()+Pt)??null;let l="normal";if(o&&a.length){const t=a.reduce((t,e)=>t+e.ore,0)/a.length;if(t>0){const e=o.ore/t;e<.85?l="låg":e>1.15&&(l="hög")}}const c=r.filter(t=>t.start.getTime()+Pt>n);return{now:o,level:l,today:a,tomorrow:s,cheapestWindow:Dt(c)}}const It=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long"});class Ot extends vt{constructor(){super(...arguments),this._now=new Date}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},3e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}get _timeStr(){return`${String(this._now.getHours()).padStart(2,"0")}:${String(this._now.getMinutes()).padStart(2,"0")}`}get _dateStr(){return function(t){return t.length?t.charAt(0).toUpperCase()+t.slice(1):t}(It.format(this._now))}get _weatherStr(){const t=this.weatherEntity?this.getEntity(this.weatherEntity):void 0;if(!t||!this.hass)return"";const e=this.hass.formatEntityState(t),i=t.attributes.temperature;return[e,"number"==typeof i?`${Math.round(i)}°`:""].filter(Boolean).join(" ")}render(){const t=this._weatherStr;return V`
      <div class="time">${this._timeStr}</div>
      <div class="date">${this._dateStr}${t?V` · ${t}`:""}</div>
    `}}Ot.styles=[Tt,n`
      :host {
        display: block;
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
    `],t([gt({attribute:!1})],Ot.prototype,"weatherEntity",void 0),t([bt()],Ot.prototype,"_now",void 0),customElements.define("hub-clock",Ot);const Rt=t=>X`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    ${t}
  </svg>
`,Ut={lamp:Rt(X`
    <path d="M12 3a6 6 0 0 0-4 10.4c.6.6 1 1.4 1 2.3v.3h6v-.3c0-.9.4-1.7 1-2.3A6 6 0 0 0 12 3z"></path>
    <path d="M10 19h4M10.5 21.5h3"></path>
  `),bolt:Rt(X`
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"></path>
  `),home:Rt(X`
    <path d="M3 11.5 12 4l9 7.5"></path>
    <path d="M5.5 10v9.5a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1V15a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V10"></path>
  `),vacuum:Rt(X`
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="2.2"></circle>
    <path d="M12 4v2M4 12h2M18 12h2M12 20v-2"></path>
  `),train:Rt(X`
    <rect x="5" y="4" width="14" height="13" rx="4"></rect>
    <path d="M5 12h14"></path>
    <path d="M8 20l-1.5 2M16 20l1.5 2"></path>
    <circle cx="9" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
    <circle cx="15" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),note:Rt(X`
    <circle cx="7" cy="18" r="2.3"></circle>
    <circle cx="16" cy="16" r="2.3"></circle>
    <path d="M9.3 18V5.5L18.3 4v11.5"></path>
  `),sun:Rt(X`
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"></path>
  `),moon:Rt(X`
    <path d="M20 14.5A8 8 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5z"></path>
  `),power:Rt(X`
    <path d="M12 3v8.5"></path>
    <path d="M6.7 6.9a8 8 0 1 0 10.6 0"></path>
  `),play:Rt(X`
    <path d="M7 4.5v15l13-7.5-13-7.5z"></path>
  `),pause:Rt(X`
    <rect x="7" y="5" width="3.5" height="14" rx="1"></rect>
    <rect x="13.5" y="5" width="3.5" height="14" rx="1"></rect>
  `),prev:Rt(X`
    <path d="M18.5 5.5v13L9 12l9.5-6.5z"></path>
    <path d="M6 5v14"></path>
  `),next:Rt(X`
    <path d="M5.5 5.5v13L15 12 5.5 5.5z"></path>
    <path d="M18 5v14"></path>
  `),speaker:Rt(X`
    <rect x="6" y="3" width="12" height="18" rx="3"></rect>
    <circle cx="12" cy="14" r="3.2"></circle>
    <circle cx="12" cy="6.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),sofa:Rt(X`
    <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"></path>
    <rect x="3" y="11" width="18" height="6" rx="2"></rect>
    <path d="M5 17v2M19 17v2"></path>
  `),pot:Rt(X`
    <path d="M4 10h16"></path>
    <path d="M5 10v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"></path>
    <path d="M2 10h2M20 10h2"></path>
    <path d="M9 10V7a3 3 0 0 1 6 0v3"></path>
  `),bed:Rt(X`
    <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"></path>
    <path d="M3 15h18"></path>
    <path d="M3 18v2M21 18v2"></path>
    <rect x="5" y="10" width="6" height="4" rx="1"></rect>
  `),door:Rt(X`
    <rect x="6" y="3" width="12" height="18" rx="1"></rect>
    <circle cx="14.5" cy="12" r="0.8" fill="currentColor" stroke="none"></circle>
  `),desk:Rt(X`
    <path d="M3 7h18v3H3z"></path>
    <path d="M5 10v9M19 10v9"></path>
  `),shower:Rt(X`
    <path d="M8 4a5 5 0 0 1 9 3"></path>
    <path d="M5 9h14"></path>
    <path d="M7 12v2M11 12v2M15 12v2M19 12v2"></path>
    <path d="M7 17v2M11 17v2M15 17v2"></path>
  `),leaf:Rt(X`
    <path d="M4 20c0-8 6-14 16-15C19 13 13 20 5 20a4 4 0 0 1-1 0z"></path>
    <path d="M4 20c3-5 7-8 12-9.5"></path>
  `),clock:Rt(X`
    <circle cx="12" cy="12" r="8.5"></circle>
    <path d="M12 7.5V12l3 2"></path>
  `)};class Bt extends ct{constructor(){super(...arguments),this.icon="",this.label="",this.tone="neutral",this.active=!1}render(){const t=Ut[this.icon];return V`
      <span class="chip tone-${this.tone} ${this.active?"active":""}">
        ${t?V`<span class="icon">${t}</span>`:""}
        <span class="label">${this.label}</span>
      </span>
    `}}Bt.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],Bt.prototype,"icon",void 0),t([gt({attribute:!1})],Bt.prototype,"label",void 0),t([gt({attribute:!1})],Bt.prototype,"tone",void 0),t([gt({type:Boolean})],Bt.prototype,"active",void 0),customElements.define("hub-status-chip",Bt);class Lt extends vt{constructor(){super(...arguments),this._longPressed=!1,this._downX=0,this._downY=0,this._onPointerDown=t=>{this._longPressed=!1,this._downX=t.clientX,this._downY=t.clientY,this._pressTimer=window.setTimeout(()=>{this._longPressed=!0,this.toggle(this.room.main_entity)},500)},this._onPointerMove=t=>{void 0!==this._pressTimer&&(zt(t.clientX-this._downX)||zt(t.clientY-this._downY))&&this._cancelPress()},this._cancelPress=()=>{void 0!==this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=void 0)},this._onClick=()=>{this._longPressed?this._longPressed=!1:this.dispatchEvent(new CustomEvent("hub-room-open",{detail:{roomId:this.room.id},bubbles:!0,composed:!0}))}}disconnectedCallback(){super.disconnectedCallback(),this._cancelPress()}get _lightsOn(){return this.room.lights.filter(t=>this.isOn(t.entity)).length}get _brightnessPct(){const t=this.getEntityAttribute(this.room.main_entity,"brightness");return"number"==typeof t?Math.round(t/255*100):null}get _subtitle(){const t=this._lightsOn;if(0===t)return"Släckt";const e=1===t?"1 lampa":`${t} lampor`,i=this._brightnessPct;return null!==i?`${e} · ${i} %`:e}render(){if(!this.hass||!this.room)return V``;const t=this._lightsOn>0,e=Ut[this.room.icon];return V`
      <div
        class="tile ${t?"active":""}"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._cancelPress}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @click=${this._onClick}
      >
        <span class="icon-chip">${e??""}</span>
        <div>
          <b class="name">${this.room.name}</b>
          <small class="subtitle">${this._subtitle}</small>
        </div>
      </div>
    `}}Lt.styles=[Tt,n`
      :host {
        display: block;
      }
      .tile {
        box-sizing: border-box;
        height: 100%;
        border-radius: var(--hub-radius);
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        transition: background var(--hub-fade) ease, border-color var(--hub-fade) ease,
          box-shadow var(--hub-fade) ease;
      }
      .tile.active {
        background: var(--hub-amber-bg);
        border-color: var(--hub-amber-border);
        box-shadow: var(--hub-amber-glow);
      }
      .icon-chip {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
      }
      .icon-chip svg {
        width: 16px;
        height: 16px;
      }
      .tile.active .icon-chip {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .name {
        font: 600 13px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
      }
      .tile.active .name {
        color: var(--hub-amber-text);
      }
      .subtitle {
        font-size: 10.5px;
        color: var(--hub-text-dim);
        display: block;
        margin-top: 2px;
      }
      .tile.active .subtitle {
        color: var(--hub-amber-muted);
      }
    `],t([gt({attribute:!1})],Lt.prototype,"room",void 0),customElements.define("hub-room-tile",Lt);const Vt=new Set(["off","unavailable","unknown","standby","idle"]);function Xt(t,e){for(const i of e){const e=t[i.entity];if(e&&"playing"===e.state)return{entity:e,name:i.name}}for(const i of e){const e=t[i.entity];if(e&&!Vt.has(e.state))return{entity:e,name:i.name}}return null}function Gt(t,e){if(!t)return 0;const i=t.attributes,a="number"==typeof i.media_duration?i.media_duration:0;if(a<=0)return 0;let s="number"==typeof i.media_position?i.media_position:0;const r="string"==typeof i.media_position_updated_at?Date.parse(i.media_position_updated_at):NaN;return"playing"!==t.state||Number.isNaN(r)||(s+=(e-r)/1e3),Math.max(0,Math.min(100,s/a*100))}class qt extends vt{constructor(){super(...arguments),this.players=[],this._now=Date.now()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=Date.now()},1e3)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_goto(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"media"},bubbles:!0,composed:!0}))}_togglePlay(t,e){t.stopPropagation(),this.callService("media_player","media_play_pause",void 0,e)}render(){if(!this.hass)return V``;const t=Xt(this.hass.states,this.players??[]);if(!t)return V`
        <div class="np idle" @click=${this._goto}>
          <span class="idle-ic">${Ut.note}</span>
          <b class="title dim">Ingenting spelas</b>
        </div>
      `;const e=t.entity,i="playing"===e.state,a=e.attributes.media_title||t.name,s=e.attributes.media_artist||t.name,r=e.attributes.entity_picture,n=Gt(e,this._now);return V`
      <div class="np ${i?"playing":""}" @click=${this._goto}>
        <div
          class="art"
          style=${r?`background-image:url('${r}')`:""}
        ></div>
        <div class="meta">
          <b class="title">${a}</b>
          <small class="sub">${s}</small>
          <div class="bar"><div class="fill" style="width:${n}%"></div></div>
        </div>
        <button
          class="pp"
          aria-label=${i?"Pausa":"Spela"}
          @click=${t=>this._togglePlay(t,e.entity_id)}
        >
          <span class="ppic">${i?Ut.pause:Ut.play}</span>
        </button>
      </div>
    `}}qt.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],qt.prototype,"players",void 0),t([bt()],qt.prototype,"_now",void 0),customElements.define("hub-now-playing",qt);const Wt=new Intl.NumberFormat("sv-SE");function Yt(t,e){return e>0?Math.max(0,Math.min(100,t/e*100)):0}class Kt extends vt{_goto(){this.dispatchEvent(new CustomEvent("hub-goto-page",{detail:{page:"kcal"},bubbles:!0,composed:!0}))}render(){if(!this.hass)return V``;const t=this.todayEntity?this.getEntity(this.todayEntity):void 0,e=t?Number(t.state):NaN;if(!t||"unavailable"===t.state||"unknown"===t.state||Number.isNaN(e))return V`
        <div class="kc offline" @click=${this._goto}>
          <div class="ring" style="--pct:0"></div>
          <div class="meta"><b class="val">Kcal · offline</b></div>
        </div>
      `;const i="number"==typeof t.attributes.kcal_target?t.attributes.kcal_target:0,a=Yt(e,i),s=function(t){const e=t.protein_g;return"number"==typeof e?`${Math.round(e)} g protein`:""}(t.attributes);return V`
      <div class="kc" @click=${this._goto}>
        <div class="ring" style="--pct:${a}"></div>
        <div class="meta">
          <b class="val">
            ${Wt.format(Math.round(e))}
            <span class="target">
              ${i>0?`/ ${Wt.format(i)} kcal`:"kcal"}
            </span>
          </b>
          ${s?V`<small class="sub">${s}</small>`:q}
        </div>
      </div>
    `}}Kt.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],Kt.prototype,"todayEntity",void 0),customElements.define("hub-kcal-ring",Kt);const Zt={cleaning:"Städar",returning:"Åker hem",paused:"Pausad",error:"Fel",idle:"Väntar"};class Jt extends vt{constructor(){super(...arguments),this._now=new Date}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}get _chips(){const t=this.config,e=[],i=t.lights_count_entity?this.getEntity(t.lights_count_entity):void 0,a=i&&!Number.isNaN(Number(i.state))?Number(i.state):null;e.push({icon:"lamp",label:null===a?"—":`${a} ${1===a?"lampa":"lampor"}`,tone:"amber",active:(a??0)>0});const s=t.price_entity?this.getEntity(t.price_entity):void 0,r=s&&!Number.isNaN(Number(s.state))?Math.round(100*Number(s.state)):null,n=t.price_series_entity?this.getEntity(t.price_series_entity):void 0,o=n?Ht(n.attributes,n.state,this._now):null,l=o?.now?o.level:"normal",c="låg"===l?" · lågt":"hög"===l?" · högt":"";if(e.push({icon:"bolt",label:null===r?"— öre":`${r} öre${c}`,tone:"låg"===l?"green":"hög"===l?"coral":"neutral",active:null!==r}),t.vacuum_entity){const i=this.getEntity(t.vacuum_entity);i&&"docked"!==i.state&&"unavailable"!==i.state&&"unknown"!==i.state&&e.push({icon:"vacuum",label:Zt[i.state]??"Städar",tone:"error"===i.state?"coral":"neutral",active:!0})}if(t.departures&&function(t,e="06:30",i="09:30"){const a=t.getDay();if(0===a||6===a)return!1;const s=60*t.getHours()+t.getMinutes(),r=t=>{const[e,i]=t.split(":").map(Number);return 60*e+i};return s>=r(e)&&s<=r(i)}(this._now,t.departures.window?.start,t.departures.window?.end)){const i=this.getEntity(t.departures.next_entity),a=i&&i.state&&"unavailable"!==i.state?i.state:"—";e.push({icon:"train",label:a,tone:"neutral",active:!0})}if(t.person_entity){const i=this.getEntity(t.person_entity),a=(i?.attributes.friendly_name||"Philip").split(" ")[0],s="home"===i?.state;e.push({icon:"home",label:`${a} ${s?"hemma":"borta"}`,tone:"neutral",active:!1})}return e}render(){if(!this.hass||!this.config)return V``;const t=this.config;return V`
      <div class="page">
        <div class="top">
          <hub-clock .hass=${this.hass} .weatherEntity=${t.weather_entity}></hub-clock>
          <div class="chips">
            ${this._chips.map(t=>V`
                <hub-status-chip
                  .icon=${t.icon}
                  .label=${t.label}
                  .tone=${t.tone}
                  ?active=${t.active}
                ></hub-status-chip>
              `)}
          </div>
        </div>

        <div class="rooms">
          ${(t.rooms??[]).map(t=>V`<hub-room-tile .hass=${this.hass} .room=${t}></hub-room-tile>`)}
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
        </div>
      </div>
    `}}Jt.styles=[Tt,n`
      :host {
        display: block;
        height: 100%;
      }
      .page {
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: var(--hub-page-pad);
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        max-width: 62%;
      }
      .rooms {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: 1fr;
        gap: var(--hub-gap);
      }
      @media (max-width: 1400px) {
        .rooms {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .bottom {
        display: flex;
        gap: var(--hub-gap);
        align-items: stretch;
      }
      .bottom .np {
        flex: 2;
        min-width: 0;
      }
      .bottom .kc {
        flex: 1;
        min-width: 0;
      }
    `],t([gt({attribute:!1})],Jt.prototype,"config",void 0),t([bt()],Jt.prototype,"_now",void 0),customElements.define("hub-home-page",Jt);const Qt=new Set(["unavailable","unknown"]);function te(t){return!!t&&!Qt.has(t.state)}class ee extends vt{constructor(){super(...arguments),this._armed=!1,this._flash=!1,this._onAllOff=()=>{if(!this._armed)return this._armed=!0,void 0!==this._armTimer&&clearTimeout(this._armTimer),void(this._armTimer=window.setTimeout(()=>{this._armed=!1,this._armTimer=void 0},3e3));void 0!==this._armTimer&&clearTimeout(this._armTimer),this._armTimer=void 0,this._armed=!1,this._flash=!0,this.callService("light","turn_off",void 0,"all"),void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._flashTimer=window.setTimeout(()=>{this._flash=!1,this._flashTimer=void 0},200)}}disconnectedCallback(){super.disconnectedCallback(),this._clearTimers()}_clearTimers(){void 0!==this._armTimer&&clearTimeout(this._armTimer),void 0!==this._flashTimer&&clearTimeout(this._flashTimer),this._armTimer=void 0,this._flashTimer=void 0,this._armed=!1,this._flash=!1}_activateScene(t){this.callService("scene","turn_on",void 0,t)}_lightRow(t){return te(this.hass.states[t.entity])?V`
      <glass-light-slider
        .hass=${this.hass}
        ._config=${{type:"glass-light-slider",entity:t.entity,name:t.name}}
      ></glass-light-slider>
    `:V`
        <div class="dead-row">
          <span class="dead-name">${t.name}</span>
          <span class="dead-state">Ej tillgänglig</span>
        </div>
      `}_sceneChip(t){return V`
      <button class="scene-chip" @click=${()=>this._activateScene(t.entity)}>
        ${t.name}
      </button>
    `}_roomCard(t){const e=function(t,e){const i=t.lights.filter(t=>"on"===e[t.entity]?.state),a=i.length;if(0===a)return{onCount:0,pct:null,label:"Släckt"};const s=i.map(t=>e[t.entity]?.attributes.brightness).filter(t=>"number"==typeof t),r=s.length?Math.round(s.reduce((t,e)=>t+e,0)/s.length/255*100):null,n=1===a?"1 lampa":`${a} lampor`;return{onCount:a,pct:r,label:null!==r?`${n} · ${r} %`:n}}(t,this.hass.states),i=e.onCount>0,a=Ut[t.icon];return V`
      <div class="room ${i?"active":""}">
        <div class="room-head">
          <span class="room-ic">${a??""}</span>
          <div>
            <b class="room-name">${t.name}</b>
            <small class="room-meta">${e.label}</small>
          </div>
        </div>
        <div class="lights">${t.lights.map(t=>this._lightRow(t))}</div>
        ${t.scenes?.length?V`<div class="scenes">${t.scenes.map(t=>this._sceneChip(t))}</div>`:q}
      </div>
    `}render(){if(!this.hass||!this.config)return V``;const t=this.config,e=function(t,e){let i=0,a=0;for(const s of t.rooms??[])for(const t of s.lights){const s=e[t.entity];te(s)&&(a+=1,"on"===s.state&&(i+=1))}return{on:i,total:a}}(t,this.hass.states);return V`
      <div class="page">
        <div class="header">
          <div class="heading">
            <span class="title">Ljus</span>
            <span class="subtitle">
              ${e.on>0?V`<span class="lit">${e.on} tända</span>`:V`Allt släckt`}
            </span>
          </div>
          <div class="actions">
            ${(t.scenes??[]).map(t=>V`
                <button
                  class="action"
                  @click=${()=>this._activateScene(t.entity)}
                >
                  ${Ut[t.icon]?V`<span class="ic">${Ut[t.icon]}</span>`:q}
                  <span>${t.name}</span>
                </button>
              `)}
            <button
              class="action ${this._armed?"armed":""} ${this._flash?"flash":""}"
              aria-label="Släck alla lampor"
              @click=${this._onAllOff}
            >
              <span class="ic">${Ut.power}</span>
              <span>${this._armed?"Säker? Tryck igen":"Allt släckt"}</span>
            </button>
          </div>
        </div>

        <div class="body">
          <div class="rooms">
            ${(t.rooms??[]).map(t=>this._roomCard(t))}
          </div>
        </div>
      </div>
    `}}ee.styles=[Tt,n`
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

      /* ── Rooms grid ─────────────────────────────────────── */
      .body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-bottom: 56px;
        -webkit-overflow-scrolling: touch;
      }
      .rooms {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        align-content: start;
        gap: var(--hub-gap);
      }
      @media (max-width: 900px) {
        .rooms {
          grid-template-columns: 1fr;
        }
      }

      .room {
        box-sizing: border-box;
        border-radius: var(--hub-radius);
        padding: 16px;
        background: var(--hub-card);
        border: 1px solid var(--hub-card-border);
        box-shadow: var(--hub-shadow);
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: border-color var(--hub-fade) ease, box-shadow var(--hub-fade) ease;
      }
      .room.active {
        border-color: var(--hub-amber-border);
        box-shadow: var(--hub-amber-glow);
      }
      .room-head {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .room-ic {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--hub-icon-chip-bg);
        color: var(--hub-icon-chip-color);
        transition: background var(--hub-fade) ease, color var(--hub-fade) ease;
      }
      .room-ic svg {
        width: 16px;
        height: 16px;
      }
      .room.active .room-ic {
        background: var(--hub-amber);
        color: var(--hub-surface);
      }
      .room-name {
        font: 600 15px var(--hub-font-body);
        color: var(--hub-text-muted);
        display: block;
      }
      .room.active .room-name {
        color: var(--hub-amber-text);
      }
      .room-meta {
        display: block;
        margin-top: 1px;
        font: 500 11.5px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .room.active .room-meta {
        color: var(--hub-amber-muted);
      }

      .lights {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      glass-light-slider {
        display: block;
      }

      /* Unavailable / missing lights are quiet, non-interactive rows. */
      .dead-row {
        box-sizing: border-box;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 16px;
        border-radius: var(--hub-radius-sm, 12px);
        background: var(--hub-icon-chip-bg);
        border: 1px solid var(--hub-card-border);
      }
      .dead-name {
        font: 500 14px var(--hub-font-body);
        color: var(--hub-text-dim);
      }
      .dead-state {
        font: 500 12px var(--hub-font-body);
        color: var(--hub-text-dim);
      }

      /* ── Per-room scene chips ───────────────────────────── */
      .scenes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-top: 2px;
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
    `],t([gt({attribute:!1})],ee.prototype,"config",void 0),t([bt()],ee.prototype,"_armed",void 0),t([bt()],ee.prototype,"_flash",void 0),customElements.define("hub-lights-page",ee);class ie extends ct{_slots(){const t=this.model,e=t?.today??[],i=t?.tomorrow??[],a=t?.now?t.now.start.getTime():null,s=t?.cheapestWindow,r=s?s.start.getTime():null,n=s?s.end.getTime():null,o=t=>{const e=t.start.getTime();let i="future",s=null;return null!==a&&(e<a?i="past":e===a&&(i="current",s=String(Math.round(t.ore)))),null!==r&&e>=r&&e<n&&(i+=" cheap"),{kind:"bar",hour:t,cls:i,label:s}},l=e.map(o);if(i.length){l.push({kind:"divider"});for(const t of i)l.push(o(t))}return l}_bounds(){const t=[...this.model?.today??[],...this.model?.tomorrow??[]].map(t=>t.ore);return{min:Math.min(...t),max:Math.max(...t)}}_height(t,e,i){const a=i-e;return!Number.isFinite(a)||a<=0?60:100*(.14+(t-e)/a*.86)}_tint(t,e,i){const a=i-e,s=a>0?(i-t)/a:.5;return`color-mix(in srgb, var(--hub-green) ${Math.round(22+58*s)}%, var(--hub-track))`}_tick(t){const e=t.start.getHours();return V`<span class="tick ${0===e?"day":""}"
      >${e%6==0?String(e).padStart(2,"0"):""}</span
    >`}render(){if(!this.model||0===this.model.today.length)return V``;const t=this._slots(),{min:e,max:i}=this._bounds(),a=t.map(t=>"divider"===t.kind?"8px":"minmax(0, 1fr)").join(" ");return V`
      <div class="chart">
        <div class="plot" style="grid-template-columns:${a}">
          ${t.map(t=>{if("divider"===t.kind)return V`<div class="divider"></div>`;const a=this._height(t.hour.ore,e,i),s=t.cls.startsWith("future")?`background:${this._tint(t.hour.ore,e,i)}`:"";return V`
              <div class="cell ${t.cls}" style="--bar-h:${a}%">
                ${t.label?V`<span class="cell-label">${t.label}</span>`:q}
                <div class="bar" style="height:${a}%;${s}"></div>
              </div>
            `})}
        </div>
        <div class="axis" style="grid-template-columns:${a}">
          ${t.map(t=>"divider"===t.kind?V`<span></span>`:this._tick(t.hour))}
        </div>
      </div>
    `}}ie.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],ie.prototype,"model",void 0),customElements.define("hub-price-chart",ie);const ae={"låg":"lågt",normal:"normalt","hög":"högt"};class se extends vt{constructor(){super(...arguments),this._now=new Date}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=new Date},6e4)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}_model(){const t=this.config.price_series_entity?this.getEntity(this.config.price_series_entity):void 0;return t?Ht(t.attributes,t.state,this._now):null}_currentOre(t){if(t?.now)return Math.round(t.now.ore);const e=this.config.price_entity?this.getEntity(this.config.price_entity):void 0;return e&&!Number.isNaN(Number(e.state))?Math.round(100*Number(e.state)):null}_chips(t){const e=this.config,i=[],a=e.co2_entity?this.getEntity(e.co2_entity):void 0;a&&!Number.isNaN(Number(a.state))&&i.push({icon:"leaf",label:`${Math.round(Number(a.state))} g CO₂`,tone:"green"});const s=e.fossil_entity?this.getEntity(e.fossil_entity):void 0;if(s&&!Number.isNaN(Number(s.state))){const t=Math.round(Number(s.state));i.push({icon:"leaf",label:`${t} % fossilt`,tone:t>=40?"coral":"green"})}const r=t?.cheapestWindow;if(r){const t=r.start.getHours(),e=r.end.getHours();i.push({icon:"clock",label:`Billigast ${t}–${e}`,tone:"green"})}return i}render(){if(!this.hass||!this.config)return V``;const t=this._model(),e=this._currentOre(t),i=t?.now?t.level:"normal",a=!!t&&t.today.length>0,s=this._chips(t);return V`
      <div class="page">
        <div class="header">
          <div class="price">
            <span class="price-num ${"låg"===i?"low":"hög"===i?"high":""}">${null===e?"—":e}</span>
            <span class="price-unit">öre/kWh</span>
          </div>
          <div class="subline">
            just nu${!!t?.now&&"normal"!==i?V` ·
                  <span class=${"låg"===i?"accent-low":"accent-high"}
                    >${ae[i]}</span
                  >`:q}
          </div>
        </div>

        <div class="chart-wrap">
          ${a?V`<hub-price-chart .model=${t}></hub-price-chart>`:V`<div class="waiting">Väntar på prisdata</div>`}
        </div>

        <div class="chips">
          ${s.map(t=>V`
              <hub-status-chip
                .icon=${t.icon}
                .label=${t.label}
                .tone=${t.tone}
                active
              ></hub-status-chip>
            `)}
        </div>
      </div>
    `}}async function re(t){if(!t)return null;try{const i=await(e=t,new Promise((t,i)=>{const a=new Image;a.crossOrigin="anonymous",a.onload=()=>t(a),a.onerror=()=>i(new Error("image load failed")),a.src=e})),a=document.createElement("canvas");a.width=8,a.height=8;const s=a.getContext("2d");if(!s)return null;s.drawImage(i,0,0,8,8);const{data:r}=s.getImageData(0,0,8,8);let n=0,o=0,l=0,c=0;for(let t=0;t<r.length;t+=4){0!==r[t+3]&&(n+=r[t],o+=r[t+1],l+=r[t+2],c+=1)}return 0===c?null:[Math.round(n/c),Math.round(o/c),Math.round(l/c)]}catch{return null}var e}se.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],se.prototype,"config",void 0),t([bt()],se.prototype,"_now",void 0),customElements.define("hub-energy-page",se);const ne=new Set(["unavailable","unknown"]);class oe extends vt{constructor(){super(...arguments),this.groupMaster=null,this._drag=null}_entity(){return this.hass?.states[this.player.entity]}_volume(){if(null!==this._drag)return this._drag;const t=this._entity()?.attributes.volume_level;return"number"==typeof t?t:0}_onInput(t){this._drag=Number(t.target.value)}_onChange(t){const e=Number(t.target.value);this._drag=null,this.callService("media_player","volume_set",{volume_level:e},this.player.entity)}_stop(t){t.stopPropagation()}_toggleGroup(t){this.groupMaster&&(t?this.callService("media_player","unjoin",void 0,this.player.entity):this.callService("media_player","join",{group_members:[this.player.entity]},this.groupMaster))}render(){if(!this.hass||!this.player)return V``;const t=this._entity(),e=!t||ne.has(t.state),i=this._volume(),a=Math.round(100*i),s=!e&&i>0,r=this.player.entity===this.groupMaster,n=!r&&!!this.groupMaster&&(o=this.hass.states[this.groupMaster]?.attributes.group_members,l=this.player.entity,Array.isArray(o)&&o.includes(l));var o,l;const c=`linear-gradient(90deg, var(--hub-teal) 0 ${a}%, var(--hub-track) ${a}% 100%)`;return V`
      <div class="row ${s?"active":""}">
        <span class="ic">${Ut.speaker}</span>
        <div class="main">
          <div class="top">
            <span class="name">${this.player.name}</span>
            ${e?q:V`<span class="pct">${a}%</span>`}
          </div>
          ${e?V`<span class="dead">Ej tillgänglig</span>`:V`
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  .value=${String(i)}
                  style=${`--track-bg:${c}`}
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
        ${e||r?q:V`
              <button
                class="chip ${n?"on":""}"
                @click=${()=>this._toggleGroup(n)}
              >
                ${n?"I gruppen":"Gruppera"}
              </button>
            `}
      </div>
    `}}oe.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],oe.prototype,"player",void 0),t([gt({attribute:!1})],oe.prototype,"groupMaster",void 0),t([bt()],oe.prototype,"_drag",void 0),customElements.define("hub-volume-row",oe);const le=new Set(["off","unavailable","unknown","standby","idle"]);function ce(t){const e=Number.isFinite(t)&&t>0?t:0,i=Math.floor(e/60),a=Math.floor(e%60);return`${i}:${String(a).padStart(2,"0")}`}class he extends vt{constructor(){super(...arguments),this._sel=null,this._rgb=null,this._now=Date.now()}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>{this._now=Date.now()},1e3)}disconnectedCallback(){super.disconnectedCallback(),void 0!==this._interval&&(clearInterval(this._interval),this._interval=void 0)}get _players(){return this.config?.media_players??[]}_selId(){if(this._sel)return this._sel;const t=Xt(this.hass?.states??{},this._players);return t?.entity.entity_id??this._players[0]?.entity??null}_theme(){const t=this.getRootNode()?.host;return"dag"===t?.getAttribute("data-theme")?"dag":"natt"}updated(t){const e=this._selId(),i=e?this.hass?.states[e]?.attributes.entity_picture:void 0;i!==this._pic&&(this._pic=i,i?re(i).then(t=>{this._pic===i&&(this._rgb=t)}):this._rgb=null)}_transport(t,e){this.callService("media_player",t,void 0,e)}_hero(t,e){const i="playing"===t.state,a=t.attributes.media_title||e,s=t.attributes.media_artist||e,r=t.attributes.entity_picture,n="number"==typeof t.attributes.media_duration?t.attributes.media_duration:0,o=Gt(t,this._now),l=o/100*n,c=t.entity_id;return V`
      <div class="hero">
        <div class="art" style=${r?`background-image:url('${r}')`:""}></div>
        <div class="meta">
          <div class="title">${a}</div>
          <div class="artist">${s}</div>
        </div>
        ${n>0?V`
              <div class="progress">
                <div class="bar"><div class="fill" style="width:${o}%"></div></div>
                <div class="times">
                  <span>${ce(l)}</span>
                  <span>${ce(n)}</span>
                </div>
              </div>
            `:q}
        <div class="transport">
          <button
            class="tbtn side"
            aria-label="Föregående"
            @click=${()=>this._transport("media_previous_track",c)}
          >
            ${Ut.prev}
          </button>
          <button
            class="tbtn play ${i?"on":""}"
            aria-label=${i?"Pausa":"Spela"}
            @click=${()=>this._transport("media_play_pause",c)}
          >
            ${i?Ut.pause:Ut.play}
          </button>
          <button
            class="tbtn side"
            aria-label="Nästa"
            @click=${()=>this._transport("media_next_track",c)}
          >
            ${Ut.next}
          </button>
        </div>
      </div>
    `}_quiet(){return V`
      <div class="quiet">
        <span class="qic">${Ut.note}</span>
        <span class="qtext">Ingenting spelas</span>
      </div>
    `}render(){if(!this.hass||!this.config)return V``;const t=this._players,e=this.hass.states,i=this._selId(),a=i?e[i]:void 0,s=t.find(t=>t.entity===i)?.name??"",r=!!a&&!le.has(a.state),n=function(t,e){for(const i of e)if("playing"===t[i.entity]?.state)return i.entity;return e[0]?.entity??null}(e,t),o=function(t,e){if(!t)return"none";const[i,a,s]=t;return`radial-gradient(80% 60% at 30% 20%, rgba(${i}, ${a}, ${s}, ${"natt"===e?"0.22":"0.12"}), transparent 70%)`}(this._rgb,this._theme());return V`
      <div class="page">
        <div class="bleed" style=${`background:${o}`}></div>
        <div class="content">
          ${t.length>1?V`
                <div class="tabs">
                  ${t.map(t=>V`
                      <button
                        class="tab ${t.entity===i?"on":""}"
                        @click=${()=>this._sel=t.entity}
                      >
                        ${t.name}
                      </button>
                    `)}
                </div>
              `:q}

          ${r?this._hero(a,s):this._quiet()}

          <div class="speakers ${r?"":"pushed"}">
            ${t.map(t=>V`
                <hub-volume-row
                  .hass=${this.hass}
                  .player=${t}
                  .groupMaster=${n}
                ></hub-volume-row>
              `)}
          </div>
        </div>
      </div>
    `}}he.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],he.prototype,"config",void 0),t([bt()],he.prototype,"_sel",void 0),t([bt()],he.prototype,"_rgb",void 0),t([bt()],he.prototype,"_now",void 0),customElements.define("hub-media-page",he);let de=0;class pe extends ct{constructor(){super(...arguments),this.points=[],this.stroke="--hub-lavender",this.width=560,this.height=130,this._gid="hub-spark-"+de++}render(){const t=function(t,e,i,a=.1){const s=t.length;if(0===s)return[];if(1===s)return[{x:e,y:i/2}];const r=t.map(t=>t.value),n=Math.min(...r),o=Math.max(...r)-n,l=n-o*a,c=o*(1+2*a);return t.map((t,a)=>({x:a/(s-1)*e,y:o<=0?i/2:i-(t.value-l)/c*i}))}(this.points,this.width,this.height);if(0===t.length)return V``;const e=t.map(t=>`${t.x.toFixed(2)},${t.y.toFixed(2)}`).join(" "),i=t[t.length-1],a=t[0],s=t.length>=2,r=`${e} ${i.x.toFixed(2)},${this.height} ${a.x.toFixed(2)},${this.height}`;return V`
      <div class="spark" style="--spark-stroke:var(${this.stroke})">
        ${X`
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
            ${s?X`<polygon points="${r}" fill="url(#${this._gid})" stroke="none"></polygon>
                       <polyline points="${e}" vector-effect="non-scaling-stroke"></polyline>`:q}
          </svg>
        `}
        <span
          class="dot"
          style="left:${(i.x/this.width*100).toFixed(3)}%;top:${(i.y/this.height*100).toFixed(3)}%"
        ></span>
      </div>
    `}}pe.styles=n`
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
  `,t([gt({attribute:!1})],pe.prototype,"points",void 0),t([gt()],pe.prototype,"stroke",void 0),t([gt({type:Number})],pe.prototype,"width",void 0),t([gt({type:Number})],pe.prototype,"height",void 0),customElements.define("hub-sparkline",pe);const ue=new Intl.NumberFormat("sv-SE"),ge=new Intl.NumberFormat("sv-SE",{minimumFractionDigits:1,maximumFractionDigits:1}),be=new Intl.NumberFormat("sv-SE",{maximumFractionDigits:1}),me=new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short",timeZone:"UTC"}),ve=new Intl.DateTimeFormat("sv-SE",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});function fe(t){if(!t)return"";const e=new Date(`${t}T00:00:00Z`);return Number.isNaN(e.getTime())?"":me.format(e).replace(/\.$/,"")}class xe extends vt{_meals(t){const e=t.attributes.meals;return Array.isArray(e)?e.filter(t=>!!t&&"object"==typeof t).map(t=>({name:"string"==typeof t.name?t.name:"",kcal:"number"==typeof t.kcal?t.kcal:Number(t.kcal)||0})).filter(t=>t.name):[]}_num(t){return"number"==typeof t?t:NaN}_offline(){return V`
      <div class="page">
        <div class="offline">
          <div class="off-ring"></div>
          <div class="off-text">Kcal · offline</div>
        </div>
      </div>
    `}_weightCard(){const t=this.config.kcal?.forecast_entity,e=t?this.getEntity(t):void 0,i=e?Number(e.state):NaN;if(!e||"unavailable"===e.state||"unknown"===e.state||Number.isNaN(i))return V`
        <section class="card">
          <span class="w-eyebrow">Vikt</span>
          <div class="w-num-row"><span class="w-num">${"−"}</span><span class="w-unit">kg</span></div>
          <div class="spark-wrap"><span class="spark-empty">Ingen viktdata</span></div>
        </section>
      `;const a=e.attributes.weight_trend,s=Array.isArray(a)?a.filter(t=>!!t&&"object"==typeof t).map(t=>({date:String(t.date??""),value:Number(t.kg)})).filter(t=>Number.isFinite(t.value)):[],r=function(t){if(t.length<2)return null;const e=new Date(`${t[0].date}T00:00:00Z`).getTime(),i=new Date(`${t[t.length-1].date}T00:00:00Z`).getTime();return Number.isNaN(e)||Number.isNaN(i)?null:Math.round((i-e)/864e5)}(s),n=s.length>=2?s[s.length-1].value-s[0].value:null,o=null===n||null===r?null:`${n<0?"−":n>0?"+":""}${ge.format(Math.abs(n))} kg på ${r} ${1===r?"dag":"dagar"}`,l=e.attributes.forecast,c=l&&"object"==typeof l?l:null,h=c?function(t){const e="number"==typeof t.goal_kg?`Mål ${be.format(t.goal_kg)} kg`:"",i=t.eta?fe(t.eta):"",a=t.eta_early&&t.eta_late?`${fe(t.eta_early)}–${fe(t.eta_late)}`:"";return[e,i?`ETA ${i}${a?` (${a})`:""}`:""].filter(Boolean).join(" · ")}(c):"",d=!!c?.on_track;return V`
      <section class="card">
        <span class="w-eyebrow">Vikt</span>
        <div class="w-num-row">
          <span class="w-num">${ge.format(i)}</span>
          <span class="w-unit">kg</span>
        </div>
        ${o?V`<span class="w-delta">${o}</span>`:q}

        <div class="spark-wrap">
          ${s.length>=2?V`<hub-sparkline
                .points=${s}
                stroke="--hub-lavender"
                .width=${560}
                .height=${130}
              ></hub-sparkline>`:V`<span class="spark-empty">Samlar viktdata</span>`}
        </div>

        <div class="forecast">
          ${h?V`<span class="fc-line">${h}</span>`:V`<span class="fc-line">Ingen prognos ännu</span>`}
          ${d?V`<span class="fc-chip">i fas ✓</span>`:q}
        </div>
      </section>
    `}render(){if(!this.hass||!this.config)return V``;const t=this.config.kcal?.today_entity,e=t?this.getEntity(t):void 0,i=e?Number(e.state):NaN;if(!e||"unavailable"===e.state||"unknown"===e.state||Number.isNaN(i))return this._offline();const a=this._num(e.attributes.kcal_target),s=Yt(i,a),r=Number.isFinite(a)&&a>0,n=r?a-i:NaN,o=r?n>0?`${ue.format(Math.round(n))} kcal kvar`:0===n?"Målet nått":`${ue.format(Math.round(-n))} över målet`:null,l=this._num(e.attributes.protein_g),c=this._num(e.attributes.protein_target_g),h=Number.isFinite(l)&&Number.isFinite(c)&&c>0,d=h?Math.max(0,Math.min(100,l/c*100)):0,p=this._meals(e),u=e.attributes.date,g="string"!=typeof u||Number.isNaN(new Date(`${u}T00:00:00Z`).getTime())?"":ve.format(new Date(`${u}T00:00:00Z`));return V`
      <div class="page">
        <div class="header">
          <h1 class="title">Kcal</h1>
          ${g?V`<span class="subtitle">${g}</span>`:q}
        </div>

        <div class="grid">
          <section class="card">
            <div class="ring-wrap">
              <div class="ring-glow"></div>
              <div class="ring" style="--pct:${s}"></div>
              <div class="ring-center">
                <span class="kc-num">${ue.format(Math.round(i))}</span>
                <span class="kc-target">
                  ${r?`/ ${ue.format(a)} kcal`:"kcal"}
                </span>
              </div>
            </div>
            ${o?V`<div class="kc-remain">${o}</div>`:q}

            ${h?V`
                  <div class="metric">
                    <div class="metric-head">
                      <span class="metric-label">Protein</span>
                      <span class="metric-val">
                        ${Math.round(l)} / ${Math.round(c)} g
                      </span>
                    </div>
                    <div class="bar"><div class="bar-fill" style="width:${d}%"></div></div>
                  </div>
                `:q}

            <div class="meals">
              <div class="meals-title">Idag</div>
              ${p.length?p.map(t=>V`
                      <div class="meal">
                        <span class="meal-name">${t.name}</span>
                        <span class="meal-kcal">${ue.format(Math.round(t.kcal))} kcal</span>
                      </div>
                    `):V`<div class="empty">Inga måltider loggade ännu</div>`}
            </div>
          </section>

          ${this._weightCard()}
        </div>
      </div>
    `}}xe.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],xe.prototype,"config",void 0),customElements.define("hub-kcal-page",xe);const ye=X`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 6l12 12M18 6L6 18"></path>
  </svg>
`;class _e extends vt{constructor(){super(...arguments),this.room=null,this._onScrim=t=>{t.target===t.currentTarget&&this._close()}}_close(){this.dispatchEvent(new CustomEvent("hub-popup-close",{bubbles:!0,composed:!0}))}render(){if(!this.room||!this.hass)return V``;const t=this.room;return V`
      <div class="scrim" @click=${this._onScrim}>
        <div class="card" role="dialog" aria-label=${t.name}>
          <div class="head">
            <span class="title">${t.name}</span>
            <button class="close" aria-label="Stäng" @click=${this._close}>
              ${ye}
            </button>
          </div>
          <div class="lights">
            ${t.lights.map(t=>V`
                <glass-light-slider
                  .hass=${this.hass}
                  ._config=${{type:"glass-light-slider",entity:t.entity,name:t.name}}
                ></glass-light-slider>
              `)}
          </div>
        </div>
      </div>
    `}}_e.styles=[Tt,n`
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
    `],t([gt({attribute:!1})],_e.prototype,"room",void 0),customElements.define("hub-room-popup",_e);const we=["hem","ljus","media","energi","kcal"],$e={hem:"Hem",ljus:"Ljus",media:"Media",energi:"Energi",kcal:"Kcal"};function ke(t){return $e[t]??t.charAt(0).toUpperCase()+t.slice(1)}const Ce=["auto","dag","natt"];let Ee=0;class Se extends vt{constructor(){super(...arguments),this.theme="natt",this._page=0,this._dragX=0,this._openRoom=null,this._override=function(){const t=localStorage.getItem(Nt);return"natt"===t||"dag"===t?t:"auto"}(),this._pointerActive=!1,this._dragging=!1,this._startX=0,this._startY=0,this._lastX=0,this._lastT=0,this._velocity=0,this._onRoomOpen=t=>{const e=t.detail?.roomId;this._openRoom=this._cfg?.rooms?.find(t=>t.id===e)??null},this._onGotoPage=t=>{const e=t.detail?.page;e&&this.goToPage(e)},this._onPopupClose=()=>{this._openRoom=null},this._onAnyInteraction=()=>{this._resetIdle()},this._onPointerDown=t=>{this._pointerActive=!0,this._dragging=!1,this._startX=t.clientX,this._startY=t.clientY,this._lastX=t.clientX,this._lastT=t.timeStamp,this._velocity=0,this._dragX=0},this._onPointerMove=t=>{if(!this._pointerActive)return;const e=t.clientX-this._startX,i=t.clientY-this._startY;if(!this._dragging){if(!zt(e)&&!zt(i))return;if(!function(t,e){return Math.abs(t)>Math.abs(e)}(e,i))return void(this._pointerActive=!1);this._dragging=!0,t.currentTarget.setPointerCapture?.(t.pointerId),this._lastX=t.clientX,this._lastT=t.timeStamp}const a=t.timeStamp-this._lastT;a>0&&(this._velocity=(t.clientX-this._lastX)/a),this._lastX=t.clientX,this._lastT=t.timeStamp,this._dragX=e},this._onPointerUp=t=>{if(!this._pointerActive)return;const e=this._dragging;if(this._pointerActive=!1,this._dragging=!1,e){t.currentTarget.releasePointerCapture?.(t.pointerId);const e=this.clientWidth||window.innerWidth;this._page=function(t,e,i,a,s){const r=.2*e,n=Math.abs(i)>.5;let o=a;return t<-r||n&&i<-.5?o=a+1:(t>r||n&&i>.5)&&(o=a-1),Math.max(0,Math.min(s-1,o))}(this._dragX,e,this._velocity,this._page,this._pages.length),Ee=this._page}this._dragX=0,this._velocity=0}}setConfig(t){super.setConfig(t)}get _cfg(){return this._config}get _pages(){return this._cfg?.pages??we}connectedCallback(){super.connectedCallback(),function(){if(document.getElementById("glass-hub-fonts"))return;const t=document.createElement("style");t.id="glass-hub-fonts",t.textContent="\n@font-face{font-family:'Outfit';src:url('/local/glass-cards/fonts/outfit-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n@font-face{font-family:'Inter';src:url('/local/glass-cards/fonts/inter-variable.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;}\n",document.head.appendChild(t)}(),this._applyTheme(),this._page=Ee,this._resetIdle(),this._startKioskDrawerShim(),this.addEventListener("pointerdown",this._onAnyInteraction),this.addEventListener("hub-room-open",this._onRoomOpen),this.addEventListener("hub-goto-page",this._onGotoPage),this.addEventListener("hub-popup-close",this._onPopupClose)}disconnectedCallback(){super.disconnectedCallback(),this._clearIdle(),void 0!==this._kioskTimer&&(clearInterval(this._kioskTimer),this._kioskTimer=void 0),this.removeEventListener("pointerdown",this._onAnyInteraction),this.removeEventListener("hub-room-open",this._onRoomOpen),this.removeEventListener("hub-goto-page",this._onGotoPage),this.removeEventListener("hub-popup-close",this._onPopupClose)}willUpdate(t){t.has("hass")&&this._applyTheme()}goToPage(t){const e=this._pages.indexOf(t);e>=0&&(this._page=e,Ee=e,this._dragX=0)}_applyTheme(){const t=this.hass?.states["sun.sun"]?.attributes?.elevation,e="number"==typeof t?t:null;this.theme=function(t,e,i=4){return"auto"!==e?e:null===t?"natt":t>i?"dag":"natt"}(e,this._override,this._cfg?.day_elevation??4)}_cycleTheme(){const t=Ce.indexOf(this._override);this._override=Ce[(t+1)%Ce.length],function(t){localStorage.setItem(Nt,t)}(this._override),this._applyTheme()}_resetIdle(){this._clearIdle();const t=this._cfg?.idle_return_s??120;this._idleTimer=window.setTimeout(()=>{0!==this._page&&this.goToPage(this._pages[0])},1e3*t)}_clearIdle(){void 0!==this._idleTimer&&(clearTimeout(this._idleTimer),this._idleTimer=void 0)}_startKioskDrawerShim(){if(!new URLSearchParams(location.search).has("kiosk"))return;const t=Date.now(),e=()=>{const t=document.querySelector("home-assistant")?.shadowRoot?.querySelector("home-assistant-main");if(!t)return!1;t.style.setProperty("--mdc-drawer-width","0px");const e=t.shadowRoot?.querySelector("ha-drawer");return e?.style.setProperty("--mdc-drawer-width","0px"),!0};e()||(this._kioskTimer=window.setInterval(()=>{(e()||Date.now()-t>5e3)&&(clearInterval(this._kioskTimer),this._kioskTimer=void 0)},250))}_themeGlyph(){return"auto"===this._override?V`<span class="glyph-auto">A</span>`:"dag"===this._override?X`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
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
      </svg>`:X`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a6.5 6.5 0 1 0 10.5 10.5z"></path>
    </svg>`}render(){const t=this._pages,e=t.length,i=`--page-count:${e};width:calc(100% * ${e});transform:translateX(calc(${-this._page} * 100% / ${e} + ${this._dragX}px));transition:${this._dragging?"none":"transform 320ms cubic-bezier(.3,.7,.3,1)"};`;return V`
      <div
        class="strip"
        style=${i}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
      >
        ${t.map(t=>V`
            <section class="page" data-page-id=${t}>
              ${"hem"===t?V`<hub-home-page
                    .hass=${this.hass}
                    .config=${this._cfg}
                  ></hub-home-page>`:"ljus"===t?V`<hub-lights-page
                      .hass=${this.hass}
                      .config=${this._cfg}
                    ></hub-lights-page>`:"energi"===t?V`<hub-energy-page
                        .hass=${this.hass}
                        .config=${this._cfg}
                      ></hub-energy-page>`:"media"===t?V`<hub-media-page
                          .hass=${this.hass}
                          .config=${this._cfg}
                        ></hub-media-page>`:"kcal"===t?V`<hub-kcal-page
                            .hass=${this.hass}
                            .config=${this._cfg}
                          ></hub-kcal-page>`:V`<h1 class="page-placeholder">${ke(t)}</h1>`}
            </section>
          `)}
      </div>

      <button
        class="theme-toggle"
        aria-label="Byt tema"
        @click=${this._cycleTheme}
      >
        ${this._themeGlyph()}
      </button>

      <div class="dots">
        ${t.map((t,e)=>V`
            <button
              class="dot ${e===this._page?"active":""}"
              aria-label=${ke(t)}
              @click=${()=>this.goToPage(t)}
            ></button>
          `)}
      </div>

      ${this._openRoom?V`<hub-room-popup
            .hass=${this.hass}
            .room=${this._openRoom}
          ></hub-room-popup>`:q}
    `}}Se.styles=[Tt,n`
      :host {
        position: absolute;
        inset: 0;
        overflow: hidden;
        background: var(--hub-surface);
        color: var(--hub-text);
        font-family: var(--hub-font-body);
        transition: background var(--hub-fade) ease;
        -webkit-tap-highlight-color: transparent;
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
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        position: relative;
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

      .theme-toggle {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--hub-text-muted);
        cursor: pointer;
        z-index: 20;
        -webkit-tap-highlight-color: transparent;
      }
      .theme-toggle svg {
        width: 24px;
        height: 24px;
      }
      .theme-toggle .glyph-auto {
        font-family: var(--hub-font-display);
        font-weight: 500;
        font-size: 20px;
      }

      .dots {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        z-index: 20;
      }
      .dot {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .dot::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--hub-text-dim);
        transition: background 0.25s ease, transform 0.25s ease;
      }
      .dot.active::before {
        background: var(--hub-text);
        transform: scale(1.15);
      }
    `],t([gt({reflect:!0,attribute:"data-theme"})],Se.prototype,"theme",void 0),t([bt()],Se.prototype,"_page",void 0),t([bt()],Se.prototype,"_dragX",void 0),t([bt()],Se.prototype,"_openRoom",void 0),customElements.define("glass-hub",Se);const Ae=window;Ae.customCards=Ae.customCards||[],Ae.customCards.push({type:"glass-background",name:"Glass Background",description:"Animated gradient background"},{type:"glass-button",name:"Glass Button",description:"Toggle/info button"},{type:"glass-chip",name:"Glass Chip",description:"Small status pill"},{type:"glass-header",name:"Glass Header",description:"Greeting, weather, status chips"},{type:"glass-room-card",name:"Glass Room Card",description:"Room with sub-buttons and popup"},{type:"glass-light-slider",name:"Glass Light Slider",description:"Brightness slider with glow"},{type:"glass-popup",name:"Glass Popup",description:"Modal overlay"},{type:"glass-nav-bar",name:"Glass Nav Bar",description:"Bottom navigation"},{type:"glass-vacuum-card",name:"Glass Vacuum Card",description:"Vacuum controls"},{type:"glass-info-row",name:"Glass Info Row",description:"Information display"},{type:"glass-section",name:"Glass Section",description:"Section header label"},{type:"glass-departure-card",name:"Glass Departure Card",description:"Train departure list"},{type:"glass-hub",name:"Glass Hub",description:"Full-screen wall hub"}),console.info("%c GLASS CARDS %c v0.1.0 ","color: white; background: #4FC3F7; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;","color: #4FC3F7; background: rgba(79,195,247,0.1); padding: 2px 6px; border-radius: 0 4px 4px 0;");
