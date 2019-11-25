"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _linkifyIt = _interopRequireDefault(require("linkify-it"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var REPLACEMENT_TEXT = '⏤⏤⏤⏤';
var telRegex = /(\(?\+?[0-9]+\)?)+[0-9_\- ()]{6,}[0-9]/g;
var dateRegex = /(2\d{3})-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|3[0-1])/;

function CensorifyIt() {
  _linkifyIt["default"].call(this);

  this.add('+', {
    validate: function validate(text, pos, self) {
      if (!self.re.phone) {
        self.re.phone = new RegExp(telRegex);
      }

      if (self.re.phone.test(text) && !dateRegex.test(text)) {
        return text.match(self.re.phone)[0].length;
      }

      return 0;
    }
  });
  this.add('(', '+');

  for (var i = 0; i < 10; i++) {
    this.add(i.toString(), '+');
  }

  this.replacementText = REPLACEMENT_TEXT;
}

CensorifyIt.prototype = Object.create(_linkifyIt["default"].prototype);

CensorifyIt.prototype.set = function set(_ref) {
  var exception = _ref.exception,
      _ref$replacementText = _ref.replacementText,
      replacementText = _ref$replacementText === void 0 ? REPLACEMENT_TEXT : _ref$replacementText,
      options = _objectWithoutProperties(_ref, ["exception", "replacementText"]);

  _linkifyIt["default"].prototype.set.call(this, options);

  this.exception = exception;
  this.replacementText = replacementText;
  return this;
};

function Match(match, text) {
  this.schema = match.schema;
  this.index = match.index;
  this.lastIndex = match.lastIndex;
  this.raw = match.text;
  this.text = text.trim();
}

CensorifyIt.prototype.match = function match(text) {
  var _this = this;

  if (!text) return [];

  var matches = _linkifyIt["default"].prototype.match.call(this, text);

  if (!matches) return [];
  return matches.map(function (match, i) {
    if (_this.exception && match.text.match(_this.exception)) {
      return match;
    }

    return new Match(match, _this.replacementText);
  });
};

var _default = CensorifyIt;
exports["default"] = _default;