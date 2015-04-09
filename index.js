'use strict';

var _ = require('lodash');

var serialise = function(obj) {
  if (!_.isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
      + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

// Prefer node/browserify style requires
module.exports = function(superagent) {
  var Request = superagent.Request;

  Request.prototype.jsonp = jsonp;
  Request.prototype._originalEnd = Request.prototype.end;
  Request.prototype.end = end;

  return superagent;
};

var jsonp = function(options){
  var options = options || {};
  this.options = _.defaults(options, { callbackName : 'cb' });
  this.callbackName = 'superagentCallback' + new Date().valueOf() + parseInt(Math.random() * 1000);

  window[this.callbackName] = function(data){
    this.callback.apply(this, [data]);
  }.bind(this);

  return this;
};

var end = function(callback){
  this.callback = callback;

  if (!this.options) {
    return this._originalEnd(callback);
  }
  var params = {},
    paramName = this.options.paramName || 'callback';

  params[paramName] = this.callbackName;

  this._query.push(serialise(params));

  var queryString = this._query.join('&');
  var s = document.createElement('script');
  var separator = '?';
  if (this.url.indexOf('?') !== -1) {
    separator = '&';
  }

  var url = this.url + separator + queryString;

  s.src = url;

  document.getElementsByTagName('head')[0].appendChild(s);
};
