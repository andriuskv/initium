"use strict";function _typeof(a){return a&&"undefined"!=typeof Symbol&&a.constructor===Symbol?"symbol":typeof a}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var _slicedToArray=function(){function a(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var h,g=a[Symbol.iterator]();!(d=(h=g.next()).done)&&(c.push(h.value),!b||c.length!==b);d=!0);}catch(a){e=!0,f=a}finally{try{!d&&g.return&&g.return()}finally{if(e)throw f}}return c}return function(b,c){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return a(b,c);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),_createClass=function(){function a(a,b){for(var c=0;c<b.length;c++){var d=b[c];d.enumerable=d.enumerable||!1,d.configurable=!0,"value"in d&&(d.writable=!0),Object.defineProperty(a,d.key,d)}}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();!function(){var Codebird=function(){function Codebird(){_classCallCheck(this,Codebird),this._oauth_consumer_key=null,this._oauth_consumer_secret=null,this._oauth_bearer_token=null,this._endpoint_base="https://api.twitter.com/",this._endpoint_base_media="https://upload.twitter.com/",this._endpoint=this._endpoint_base+"1.1/",this._endpoint_media=this._endpoint_base_media+"1.1/",this._endpoint_publish="https://publish.twitter.com/",this._endpoint_oauth=this._endpoint_base,this._endpoint_proxy="https://api.jublo.net/codebird/",this._use_proxy="undefined"!=typeof navigator&&"undefined"!=typeof navigator.userAgent,this._oauth_token=null,this._oauth_token_secret=null,this._version="3.0.0-dev",this.b64_alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}return _createClass(Codebird,[{key:"setConsumerKey",value:function(b,c){this._oauth_consumer_key=b,this._oauth_consumer_secret=c}},{key:"setBearerToken",value:function(b){this._oauth_bearer_token=b}},{key:"getVersion",value:function(){return this._version}},{key:"setToken",value:function(b,c){this._oauth_token=b,this._oauth_token_secret=c}},{key:"logout",value:function(){return this._oauth_token=this._oauth_token_secret=null,!0}},{key:"setUseProxy",value:function(b){this._use_proxy=!!b}},{key:"setProxy",value:function(b){b.match(/\/$/)||(b+="/"),this._endpoint_proxy=b}},{key:"_url",value:function(b){return/boolean|number|string/.test("undefined"==typeof b?"undefined":_typeof(b))?encodeURIComponent(b).replace(/!/g,"%21").replace(/'/g,"%27").replace(/\(/g,"%28").replace(/\)/g,"%29").replace(/\*/g,"%2A"):""}},{key:"_sha1",value:function(b){function c(a,b){a[b>>5]|=128<<24-b%32,a[(b+64>>9<<4)+15]=b;for(var c=new Array(80),e=1732584193,f=-271733879,g=-1732584194,h=271733878,i=-1009589776,j=0;j<a.length;j+=16){for(var k=e,l=f,m=g,n=h,o=i,p=0;80>p;p++){var q=void 0;p<16?q=a[j+p]:(q=c[p-3]^c[p-8]^c[p-14]^c[p-16],q=q<<1|q>>>31),c[p]=q,q=d(d(e<<5|e>>>27,20>p?f&g|~f&h:40>p?f^g^h:60>p?f&g|f&h|g&h:f^g^h),d(d(i,c[p]),20>p?1518500249:40>p?1859775393:60>p?-1894007588:-899497514)),i=h,h=g,g=f<<30|f>>>2,f=e,e=q}e=d(e,k),f=d(f,l),g=d(g,m),h=d(h,n),i=d(i,o)}return[e,f,g,h,i]}function d(a,b){var c=(65535&a)+(65535&b);return(a>>16)+(b>>16)+(c>>16)<<16|65535&c}function e(a){for(var b=[],c=(1<<f)-1,d=0;d<a.length*f;d+=f)b[d>>5]|=(a.charCodeAt(d/f)&c)<<24-d%32;return b}var f=8,g=this._oauth_consumer_secret+"&"+(null!==this._oauth_token_secret?this._oauth_token_secret:"");if(null===this._oauth_consumer_secret)throw"To generate a hash, the consumer secret must be set.";var h=e(g);h.length>16&&(h=c(h,g.length*f));for(var i=new Array(16),j=new Array(16),k=0;k<16;k++)j[k]=909522486^h[k],i[k]=1549556828^h[k];for(h=c(j.concat(e(b)),512+b.length*f),i=c(i.concat(h),672),g="",f=0;f<4*i.length;f+=3)for(k=(i[f>>2]>>8*(3-f%4)&255)<<16|(i[f+1>>2]>>8*(3-(f+1)%4)&255)<<8|i[f+2>>2]>>8*(3-(f+2)%4)&255,b=0;4>b;b++)g=8*f+6*b>32*i.length?g+"=":g+this.b64_alphabet.charAt(k>>6*(3-b)&63);return g}},{key:"_base64_encode",value:function(b){var c=void 0,d=void 0,e=void 0,f=void 0,g=0,h=0,i=this.b64_alphabet,j=[];if(!b)return b;do c=b.charCodeAt(g++),d=b.charCodeAt(g++),e=b.charCodeAt(g++),f=c<<16|d<<8|e,c=f>>18&63,d=f>>12&63,e=f>>6&63,f&=63,j[h++]=i.charAt(c)+i.charAt(d)+i.charAt(e)+i.charAt(f);while(g<b.length);return i=j.join(""),b=b.length%3,(b?i.slice(0,b-3):i)+"===".slice(b||3)}},{key:"_http_build_query",value:function(b,c,d){function e(a,b,c){var d=void 0,f=[];if(b===!0?b="1":b===!1&&(b="0"),null!==b){if("object"===("undefined"==typeof b?"undefined":_typeof(b))){for(d in b)b.hasOwnProperty(d)&&null!==b[d]&&f.push(e.call(this,a+"["+d+"]",b[d],c));return f.join(c)}if("function"!=typeof b)return this._url(a)+"="+this._url(b);throw"There was an error processing for http_build_query()."}return""}var f,g,h=[];d||(d="&");for(g in b)b.hasOwnProperty(g)&&(f=b[g],c&&!isNaN(g)&&(g=String(c)+g),f=e.call(this,g,f,d),""!==f&&h.push(f));return h.join(d)}},{key:"_nonce",value:function(){var b=arguments.length<=0||void 0===arguments[0]?8:arguments[0];if(b<1)throw"Invalid nonce length.";for(var c="",d=0;d<b;d++){var e=Math.floor(61*Math.random());c+=this.b64_alphabet.substring(e,e+1)}return c}},{key:"_ksort",value:function(b){var c=[],d=void 0,e=void 0;d=function(a,b){var c=parseFloat(a),d=parseFloat(b),e=c+""===a,f=d+""===b;return e&&f?c>d?1:c<d?-1:0:e&&!f?1:!e&&f?-1:a>b?1:a<b?-1:0};for(e in b)b.hasOwnProperty(e)&&c.push(e);return c.sort(d),c}},{key:"_clone",value:function(b){var c={};for(var d in b)"object"===_typeof(b[d])?c[d]=this._clone(b[d]):c[d]=b[d];return c}},{key:"_getXmlRequestObject",value:function(){var b=null;if("object"===("undefined"==typeof window?"undefined":_typeof(window))&&window&&"undefined"!=typeof window.XMLHttpRequest)b=new window.XMLHttpRequest;else if("object"===("undefined"==typeof Ti?"undefined":_typeof(Ti))&&Ti&&"undefined"!=typeof Ti.Network.createHTTPClient)b=Ti.Network.createHTTPClient();else if("undefined"!=typeof ActiveXObject)try{b=new ActiveXObject("Microsoft.XMLHTTP")}catch(a){throw"ActiveXObject object not defined."}else if("function"==typeof require){var c;try{c=require("xmlhttprequest").XMLHttpRequest,b=new c}catch(a){try{c=require("xhr2"),b=new c}catch(a){throw"xhr2 object not defined, cancelling."}}}return b}},{key:"_parse_str",value:function _parse_str(str,array){var glue1="=",glue2="&",array2=String(str).replace(/^&?([\s\S]*?)&?$/,"$1").split(glue2),i,j,chr,tmp,key,value,bracket,keys,evalStr,fixStr=function(b){return decodeURIComponent(b).replace(/([\\"'])/g,"\\$1").replace(/\n/g,"\\n").replace(/\r/g,"\\r")};for(array||(array=this.window),i=0;i<array2.length;i++){for(tmp=array2[i].split(glue1),tmp.length<2&&(tmp=[tmp,""]),key=fixStr(tmp[0]),value=fixStr(tmp[1]);" "===key.charAt(0);)key=key.substr(1);if(key.indexOf("\0")>-1&&(key=key.substr(0,key.indexOf("\0"))),key&&"["!==key.charAt(0)){for(keys=[],bracket=0,j=0;j<key.length;j++)if("["!==key.charAt(j)||bracket){if("]"===key.charAt(j)&&bracket&&(keys.length||keys.push(key.substr(0,bracket-1)),keys.push(key.substr(bracket,j-bracket)),bracket=0,"["!==key.charAt(j+1)))break}else bracket=j+1;for(keys.length||(keys=[key]),j=0;j<keys[0].length&&(chr=keys[0].charAt(j)," "!==chr&&"."!==chr&&"["!==chr||(keys[0]=keys[0].substr(0,j)+"_"+keys[0].substr(j+1)),"["!==chr);j++);for(evalStr="array",j=0;j<keys.length;j++)key=keys[j],key=""!==key&&" "!==key||0===j?"'"+key+"'":eval(evalStr+".push([]);")-1,evalStr+="["+key+"]",j!==keys.length-1&&"undefined"===eval("typeof "+evalStr)&&eval(evalStr+" = [];");evalStr+=" = '"+value+"';\n",eval(evalStr)}}}},{key:"getApiMethods",value:function(){var b={GET:["account/settings","account/verify_credentials","application/rate_limit_status","blocks/ids","blocks/list","collections/entries","collections/list","collections/show","direct_messages","direct_messages/sent","direct_messages/show","favorites/list","followers/ids","followers/list","friends/ids","friends/list","friendships/incoming","friendships/lookup","friendships/lookup","friendships/no_retweets/ids","friendships/outgoing","friendships/show","geo/id/:place_id","geo/reverse_geocode","geo/search","geo/similar_places","help/configuration","help/languages","help/privacy","help/tos","lists/list","lists/members","lists/members/show","lists/memberships","lists/ownerships","lists/show","lists/statuses","lists/subscribers","lists/subscribers/show","lists/subscriptions","mutes/users/ids","mutes/users/list","oauth/authenticate","oauth/authorize","saved_searches/list","saved_searches/show/:id","search/tweets","site","statuses/firehose","statuses/home_timeline","statuses/mentions_timeline","statuses/oembed","statuses/retweeters/ids","statuses/retweets/:id","statuses/retweets_of_me","statuses/sample","statuses/show/:id","statuses/user_timeline","trends/available","trends/closest","trends/place","user","users/contributees","users/contributors","users/profile_banner","users/search","users/show","users/suggestions","users/suggestions/:slug","users/suggestions/:slug/members"],POST:["account/remove_profile_banner","account/settings__post","account/update_delivery_device","account/update_profile","account/update_profile_background_image","account/update_profile_banner","account/update_profile_colors","account/update_profile_image","blocks/create","blocks/destroy","collections/create","collections/destroy","collections/entries/add","collections/entries/curate","collections/entries/move","collections/entries/remove","collections/update","direct_messages/destroy","direct_messages/new","favorites/create","favorites/destroy","friendships/create","friendships/destroy","friendships/update","lists/create","lists/destroy","lists/members/create","lists/members/create_all","lists/members/destroy","lists/members/destroy_all","lists/subscribers/create","lists/subscribers/destroy","lists/update","media/upload","mutes/users/create","mutes/users/destroy","oauth/access_token","oauth/request_token","oauth2/invalidate_token","oauth2/token","saved_searches/create","saved_searches/destroy/:id","statuses/destroy/:id","statuses/filter","statuses/lookup","statuses/retweet/:id","statuses/unretweet/:id","statuses/update","statuses/update_with_media","users/lookup","users/report_spam"]};return b}},{key:"_getDfd",value:function(){if("undefined"!=typeof window){if("undefined"!=typeof window.jQuery&&window.jQuery.Deferred)return window.jQuery.Deferred();if("undefined"!=typeof window.Q&&window.Q.defer)return window.Q.defer();if("undefined"!=typeof window.RSVP&&window.RSVP.defer)return window.RSVP.defer();if("undefined"!=typeof window.when&&window.when.defer)return window.when.defer()}if("undefined"!=typeof require){var b=!1;try{b=require("jquery")}catch(a){}if(b)return b.Deferred();try{b=require("q")}catch(a){}if(!b)try{b=require("rsvp")}catch(a){}if(!b)try{b=require("when")}catch(a){}if(b)try{return b.defer()}catch(a){}}return!1}},{key:"_getPromise",value:function(b){return"function"==typeof b.promise?b.promise():b.promise}},{key:"_parseApiParams",value:function(b){var c={};return"object"===("undefined"==typeof b?"undefined":_typeof(b))?c=b:this._parse_str(b,c),c}},{key:"_stringifyNullBoolParams",value:function(b){for(var c in b)if(b.hasOwnProperty(c)){var d=b[c];null===d?b[c]="null":d!==!0&&d!==!1||(b[c]=d?"true":"false")}return b}},{key:"_mapFnInsertSlashes",value:function(b){return b.split("_").join("/")}},{key:"_mapFnRestoreParamUnderscores",value:function(b){var c=["screen_name","place_id"],d=void 0,e=void 0,f=void 0;for(d=0;d<c.length;d++)e=c[d].toUpperCase(),f=e.split("_").join("/"),b=b.split(f).join(e);return b}},{key:"_mapFnToApiMethod",value:function(b,c){var d="",e=void 0,f=void 0,g=void 0;d=this._mapFnInsertSlashes(b),d=this._mapFnRestoreParamUnderscores(d);var h=d,i=d.match(/[A-Z_]{2,}/);if(i)for(f=0;f<i.length;f++){e=i[f];var j=e.toLowerCase();if(h=h.split(e).join(":"+j),"undefined"==typeof c[j]){for(g=0;g<26;g++)h=h.split(String.fromCharCode(65+g)).join("_"+String.fromCharCode(97+g));throw'To call the templated method "'+h+'", specify the parameter value for "'+j+'".'}d=d.split(e).join(c[j]),delete c[j]}for(f=0;f<26;f++)d=d.split(String.fromCharCode(65+f)).join("_"+String.fromCharCode(97+f)),h=h.split(String.fromCharCode(65+f)).join("_"+String.fromCharCode(97+f));return[d,h]}},{key:"_detectMethod",value:function(b,c){if("undefined"!=typeof c.httpmethod){var d=c.httpmethod;return delete c.httpmethod,d}switch(b){case"account/settings":case"account/login_verification_enrollment":case"account/login_verification_request":b=Object.keys(c).length?b+"__post":b}var e=this.getApiMethods();for(var d in e)if(e.hasOwnProperty(d)&&e[d].indexOf(b)>-1)return d;throw"Can't find HTTP method to use for \""+b+'".'}},{key:"_detectMultipart",value:function(b){var c=["statuses/update_with_media","media/upload","account/update_profile_background_image","account/update_profile_image","account/update_profile_banner"];return c.indexOf(b)>-1}},{key:"_getSignature",value:function(b,c,d,e){for(var f="",g=void 0,h=void 0,i=0;i<d.length;i++)g=d[i],h=e[g],f+=g+"="+this._url(h)+"&";return f=f.substring(0,f.length-1),this._sha1(b+"&"+this._url(c)+"&"+this._url(f))}},{key:"_time",value:function(){return Math.round((new Date).getTime()/1e3)}},{key:"_sign",value:function(b,c){var d=arguments.length<=2||void 0===arguments[2]?{}:arguments[2];if(null===this._oauth_consumer_key)throw"To generate a signature, the consumer key must be set.";var e={consumer_key:this._oauth_consumer_key,version:"1.0",timestamp:this._time(),nonce:this._nonce(),signature_method:"HMAC-SHA1"},f={};for(var g in e)if(e.hasOwnProperty(g)){var h=e[g];f["oauth_"+g]=this._url(h)}null!==this._oauth_token&&(f.oauth_token=this._url(this._oauth_token));var i=this._clone(f);for(g in d)d.hasOwnProperty(g)&&(f[g]=d[g]);var j=this._ksort(f),k=this._getSignature(b,c,j,f);d=i,d.oauth_signature=k,j=this._ksort(d);for(var l="OAuth ",m=0;m<j.length;m++)g=j[m],l+=g+'="'+this._url(d[g])+'", ';return l.substring(0,l.length-2)}},{key:"_buildMultipart",value:function(b,c){if(this._detectMultipart(b)){var d=["media/upload","statuses/update_with_media","account/update_profile_background_image","account/update_profile_image","account/update_profile_banner"],e={"media/upload":"media","statuses/update_with_media":"media[]","account/update_profile_background_image":"image","account/update_profile_image":"image","account/update_profile_banner":"banner"};if(d.indexOf(b)!==-1){e=e[b].split(" ");var f="--------------------"+this._nonce(),g="";for(var h in c)c.hasOwnProperty(h)&&(g+="--"+f+'\r\nContent-Disposition: form-data; name="'+h+'"',e.indexOf(h)===-1&&(g+="\r\nContent-Transfer-Encoding: base64"),g+="\r\n\r\n"+c[h]+"\r\n");return g+="--"+f+"--"}}}},{key:"_detectMedia",value:function(b){var c=["media/upload"];return c.indexOf(b)>-1}},{key:"_detectJsonBody",value:function(b){var c=["collections/entries/curate"];return c.indexOf(b)>-1}},{key:"_getEndpoint",value:function(b){var c=void 0;return c="oauth"===b.substring(0,5)?this._endpoint_oauth+b:this._detectMedia(b)?this._endpoint_media+b+".json":"statuses/oembed"===b?this._endpoint_publish+"oembed":this._endpoint+b+".json"}},{key:"_parseApiReply",value:function(b){if("string"!=typeof b||""===b)return{};if("[]"===b)return[];var c=void 0;try{c=JSON.parse(b)}catch(a){c={};for(var d=b.split("&"),e=0;e<d.length;e++){var f=d[e].split("=",2);f.length>1?c[f[0]]=decodeURIComponent(f[1]):c[f[0]]=null}}return c}},{key:"oauth_authenticate",value:function(){var b=arguments.length<=0||void 0===arguments[0]?{}:arguments[0],c=arguments.length<=1||void 0===arguments[1]?void 0:arguments[1],d=arguments.length<=2||void 0===arguments[2]?"authenticate":arguments[2],e=this._getDfd();if("undefined"==typeof b.force_login&&(b.force_login=null),"undefined"==typeof b.screen_name&&(b.screen_name=null),["authenticate","authorize"].indexOf(d)===-1&&(d="authenticate"),null===this._oauth_token){var f="To get the "+d+" URL, the OAuth token must be set.";if(e)return e.reject({error:f}),this._getPromise(e);throw f}var g=this._endpoint_oauth+"oauth/"+d+"?oauth_token="+this._url(this._oauth_token);return b.force_login===!0&&(g+="&force_login=1"),null!==b.screen_name&&(g+="&screen_name="+b.screen_name),"function"==typeof c&&c(g),!e||(e.resolve({reply:g}),this._getPromise(e))}},{key:"oauth_authorize",value:function(b,c){return this.oauth_authenticate(b,c,"authorize")}},{key:"oauth2_token",value:function(b){var c=this,d=this._getDfd();if(null===this._oauth_consumer_key){var e="To obtain a bearer token, the consumer key must be set.";if(d)return d.reject({error:e}),this._getPromise(d);throw e}d||"undefined"!=typeof b||(b=function(){});var f="grant_type=client_credentials",g=this._endpoint_oauth+"oauth2/token";this._use_proxy&&(g=g.replace(this._endpoint_base,this._endpoint_proxy));var h=this._getXmlRequestObject();if(null!==h)return h.open("POST",g,!0),h.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),h.setRequestHeader((this._use_proxy?"X-":"")+"Authorization","Basic "+this._base64_encode(this._oauth_consumer_key+":"+this._oauth_consumer_secret)),h.onreadystatechange=function(){if(h.readyState>=4){var a=12027;try{a=h.status}catch(a){}var e="";try{e=h.responseText}catch(a){}var f=c._parseApiReply(e);f.httpstatus=a,200===a&&c.setBearerToken(f.access_token),"function"==typeof b&&b(f),d&&d.resolve({reply:f})}},h.onerror=function(a){"function"==typeof b&&b(null,a),d&&d.reject(a)},h.timeout=3e4,h.send(f),d?this._getPromise(d):void 0}},{key:"_callApi",value:function(b,c){var d=arguments.length<=2||void 0===arguments[2]?{}:arguments[2],e=!(arguments.length<=3||void 0===arguments[3])&&arguments[3],f=this,g=!(arguments.length<=4||void 0===arguments[4])&&arguments[4],h=arguments.length<=5||void 0===arguments[5]?function(){}:arguments[5],i=this._getDfd(),j=this._getEndpoint(c),k=null,l=this._getXmlRequestObject();if(null!==l){var m=void 0;if("GET"===b){var n=j;"{}"!==JSON.stringify(d)&&(n+="?"+this._http_build_query(d)),g||(k=this._sign(b,j,d)),this._use_proxy&&(n=n.replace(this._endpoint_base,this._endpoint_proxy).replace(this._endpoint_base_media,this._endpoint_proxy)),l.open(b,n,!0)}else e?(g||(k=this._sign(b,j,{})),d=this._buildMultipart(c,d)):this._detectJsonBody(c)?(k=this._sign(b,j,{}),d=JSON.stringify(d)):(g||(k=this._sign(b,j,d)),d=this._http_build_query(d)),m=d,(this._use_proxy||e)&&(j=j.replace(this._endpoint_base,this._endpoint_proxy).replace(this._endpoint_base_media,this._endpoint_proxy)),l.open(b,j,!0),e?l.setRequestHeader("Content-Type","multipart/form-data; boundary="+m.split("\r\n")[0].substring(2)):this._detectJsonBody(c)?l.setRequestHeader("Content-Type","application/json"):l.setRequestHeader("Content-Type","application/x-www-form-urlencoded");if(g){if(null===this._oauth_consumer_key&&null===this._oauth_bearer_token){var o="To make an app-only auth API request, consumer key or bearer token must be set.";if(i)return i.reject({error:o}),this._getPromise(i);throw o}if(null===this._oauth_bearer_token)return i?this.oauth2_token().then(function(){return f._callApi(b,c,d,e,g,h)}):void this.oauth2_token(function(){f._callApi(b,c,d,e,g,h)});k="Bearer "+this._oauth_bearer_token}return null!==k&&l.setRequestHeader((this._use_proxy?"X-":"")+"Authorization",k),l.onreadystatechange=function(){if(l.readyState>=4){var a=12027;try{a=l.status}catch(a){}var b="";try{b=l.responseText}catch(a){}var c=f._parseApiReply(b);c.httpstatus=a;var d=null;"undefined"!=typeof l.getResponseHeader&&""!==l.getResponseHeader("x-rate-limit-limit")&&(d={limit:l.getResponseHeader("x-rate-limit-limit"),remaining:l.getResponseHeader("x-rate-limit-remaining"),reset:l.getResponseHeader("x-rate-limit-reset")}),"function"==typeof h&&h(c,d),i&&i.resolve({reply:c,rate:d})}},l.onerror=function(a){"function"==typeof h&&h(null,null,a),i&&i.reject(a)},l.timeout=3e4,l.send("GET"===b?null:m),!i||this._getPromise(i)}}},{key:"__call",value:function(b){var c=arguments.length<=1||void 0===arguments[1]?{}:arguments[1],d=arguments[2],e=!(arguments.length<=3||void 0===arguments[3])&&arguments[3];switch("function"!=typeof d&&"function"==typeof c?(d=c,c={},"boolean"==typeof d&&(e=d)):"undefined"==typeof d&&(d=function(){}),b){case"oauth_authenticate":case"oauth_authorize":return this[b](c,d);case"oauth2_token":return this[b](d)}var f=this._parseApiParams(c);f=this._stringifyNullBoolParams(f),"oauth_requestToken"===b&&this.setToken(null,null);var g=this._mapFnToApiMethod(b,f),h=_slicedToArray(g,2),i=h[0],j=h[1],k=this._detectMethod(j,f),l=this._detectMultipart(j);return this._callApi(k,i,f,l,e,d)}}]),Codebird}();"object"===("undefined"==typeof module?"undefined":_typeof(module))&&module&&"object"===_typeof(module.exports)?module.exports=Codebird:("object"===("undefined"==typeof window?"undefined":_typeof(window))&&window&&(window.Codebird=Codebird),"function"==typeof define&&define.amd&&define("codebird",[],function(){return Codebird}))}();