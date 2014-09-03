var WFD = require('waveform-data');
var createElement = require('svg-create-element');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var xtend = require('xtend');
var defined = require('defined');

module.exports = WF;
inherits(WF, EventEmitter);

function WF (opts) {
    var self = this;
    if (!(this instanceof WF)) return new WF(opts);
    if (!opts) opts = {};
    
    this.width = defined(opts.width, 800);
    this.height = defined(opts.height, 100);
    this.samples = defined(opts.samples, 100);
    this.fontSize = defined(opts.fontSize, opts.fontsize, 15);
    this.selected = [];
    
    this.colors = xtend({
        waveform: 'purple',
        waveformHover: 'cyan',
        text: 'purple',
        textHover: 'cyan'
    }, opts.colors);
    
    this.element = createElement('svg', {
        width: this.width,
        height: this.height,
        class: 'waveform'
    });
    
    this.defs = createElement('defs');
    this.element.appendChild(this.defs);
    
    var g = this.group = createElement('g', {
        fill: this.colors.waveform,
        stroke: 'transparent'
    });
    this.element.appendChild(this.group);
    
    var txt = createElement('text', {
        x: 0,
        y: this.fontSize,
        fontSize: this.fontSize,
        fill: this.colors.text,
        stroke: 'transparent'
    });
    txt.textContent = opts.label || '';
    this.element.appendChild(txt);
    
    var rect = createElement('rect', {
        width: this.width,
        height: this.height,
        fill: 'transparent',
        stroke: 'transparent'
    });
    rect.addEventListener('mouseover', function (ev) {
        g.setAttribute('fill', self.colors.waveformHover);
        txt.setAttribute('fill', self.colors.textHover);
    });
    rect.addEventListener('mouseout', function (ev) {
        g.setAttribute('fill', self.colors.waveform);
        txt.setAttribute('fill', self.colors.text);
    });
    rect.addEventListener('click', function (ev) {
        self.emit('click', ev);
    });
    this.element.appendChild(rect);
}

WF.prototype.load = function (data) {
    var self = this;
    var wf = WFD.create(data);
    for (var i = 0; i < this.samples; i++) {
        var ix = Math.floor(i / this.samples * wf.max.length);
        
        var ymin = (wf.min[ix] + 128) / 256 * (this.height - this.fontSize);
        var ymax = (wf.max[ix] + 128) / 256 * (this.height - this.fontSize);
        var h = (ymax + ymin) / 2;
        
        var rect = createElement('rect', {
            x: i / this.samples * this.width,
            y: this.height / 2 - h / 2 + this.fontSize / 2,
            width: 1 / this.samples * this.width,
            height: Math.max(h, 10)
        });
        this.group.appendChild(rect);
    }
    this.emit('load');
};

WF.prototype.appendTo = function (target) {
    if (typeof target === 'string') target = document.querySelector(target);
    target.appendChild(this.element);
    return this;
};

WF.prototype.select = function (start, end, opts) {
    var self = this;
    if (!this._loaded) {
        this.once('load', function () { self.select(start, end, opts) });
    }
    if (!opts) opts = {};
    var ref = {
        start: start,
        end: end,
        options: opts,
        element: this.group.cloneNode(true)
    };
    this.selected.push(ref);
    
    var cid = 'clipPath_' + Math.floor(Math.pow(16,8)*Math.random());
    var clipPath = createElement('clipPath', { id: cid });
    
    var rect = createElement('rect', {
        x: start, y: 0,
        width: Math.max(0, end - start),
        height: this.height
    });
    clipPath.appendChild(rect);
    this.defs.appendChild(clipPath);
    
    ref.element.setAttribute('clip-path', 'url(#' + cid + ')');
    ref.element.setAttribute('fill', opts.fill);
    this.element.appendChild(ref.element);
};
